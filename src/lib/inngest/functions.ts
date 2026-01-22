// src/lib/inngest/functions.ts
import { inngest } from "@/lib/inngest/inngest";
import { generateObject } from "ai";
import { GenerateAnswersSchema } from "@/lib/zod-schemas";
import { db } from "@/db/prisma";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3-client";
import { AI_GENERATION } from "@/lib/constants";

/**
 * INNGEST FUNCTION: Generate Interview Answers
 *
 * This function runs in the BACKGROUND (no timeout limits).
 * It generates 25 answers in batches of 5, saving incrementally so the UI
 * can see progressive updates (either via polling or SSE).
 *
 * ARCHITECTURE OVERVIEW:
 * 1. Triggered by an event: "answers/generate"
 * 2. Generates answers in batches of 5 (to avoid JSON parsing errors)
 * 3. Saves incrementally after each batch (enables progressive UI updates)
 * 4. Works with BOTH polling and SSE frontend implementations
 *
 * WHY BATCHING?
 * - Generating all 25 answers at once creates ~10,000+ words of JSON
 * - Large JSON responses often cause "Unterminated string" parsing errors
 * - Batching into 5 answers (~2,000 words) is much more reliable
 *
 * WHY INCREMENTAL SAVING?
 * - We save after EACH batch completes, not at the end
 * - This allows the frontend to see answers appear progressively:
 *   - After batch 1: UI sees 5 answers
 *   - After batch 2: UI sees 10 answers
 *   - After batch 3: UI sees 15 answers
 *   - etc.
 * - Works seamlessly with both polling (checks every 2s) and SSE (instant push)
 */

// Helper to read stream to string
const streamToString = (stream: any) =>
  new Promise<string>((resolve, reject) => {
    const chunks: any[] = [];
    stream.on("data", (chunk: any) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });

export const generateAnswers = inngest.createFunction(
  {
    id: "generate-answers",
    name: "Generate Interview Answers",
    // No timeout! Can run for hours if needed.
    // This is the KEY advantage of Inngest over regular API routes.
  },
  { event: "answers/generate" }, // This is the "trigger" event name
  async ({ event, step }) => {
    // -------------------------------------------------------------------------
    // STEP 0: Extract Event Data
    // -------------------------------------------------------------------------
    // The event contains: { userId, resumeText }
    // This comes from the API route that triggers the job.
    const { userId, resumeText, s3Key } = event.data;

    // STEP 0.5: Fetch Resume Text if needed
    let finalResumeText = resumeText;

    if (!finalResumeText && s3Key) {
      await step.run("fetch-resume-from-s3", async () => {
        try {
          const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET!,
            Key: s3Key,
          });
          const response = await s3Client.send(command);
          // @ts-ignore - Body is a stream in Node.js
          finalResumeText = await streamToString(response.Body);
        } catch (err) {
          throw new Error("Failed to read resume file");
        }
      });
    }

    // -------------------------------------------------------------------------
    // STEP 1: Server-Side Cleanup (Idempotency Guarantee)
    // -------------------------------------------------------------------------
    await step.run("purge-existing-answers", async () => {
      await db.starAnswer.deleteMany({
        where: {
          userId: userId,
        },
      });
    });

    // -------------------------------------------------------------------------
    // STEP 2: Configuration
    // -------------------------------------------------------------------------
    const BATCH_SIZE = AI_GENERATION.BATCH_SIZE;
    const TARGET_TOTAL = AI_GENERATION.TARGET_TOTAL_ANSWERS;
    const allAnswers: any[] = []; // Accumulator for all batches

    // -------------------------------------------------------------------------
    // STEP 3: Generate in Batches (Loop)
    // -------------------------------------------------------------------------
    // We loop through: batch 1 (IDs 1-5), batch 2 (IDs 6-10), etc.
    // Each batch is a separate "step" in Inngest, so they're tracked individually.
    for (let startId = 1; startId <= TARGET_TOTAL; startId += BATCH_SIZE) {
      const batchNumber = Math.floor(startId / BATCH_SIZE) + 1;
      const endId = Math.min(startId + BATCH_SIZE - 1, TARGET_TOTAL);

      // -----------------------------------------------------------------------
      // STEP 2A: Generate One Batch (5 answers)
      // -----------------------------------------------------------------------
      // This is wrapped in step.run() so Inngest can track progress.
      // If this step fails, Inngest can retry just this batch.
      const batchResult = await step.run(
        `generate-batch-${batchNumber}`, // Unique step ID for tracking
        async () => {
          // Build the prompt with dynamic instructions
          // We tell the AI exactly which IDs to generate (e.g., "Generate IDs 6-10")
          const promptText =
            "You are an expert career coach specializing in behavioral interviews. Analyze the following career document and generate behavioral interview answers in STAR format (Situation, Task, Action, Result).\n\n" +
            "Career Document:\n" +
            (finalResumeText ||
              "Animan Amit5 Siglap Road, Singapore • +65 97552111 • 747animan@gmail.com • Linkedin • Github • Portfolio\n\n" +
                "PROFESSIONAL SUMMARY\n" +
                "Results-driven Frontend Web Developer with over 4 years of experience in designing and building advanced web applications using React, TypeScript, and modern JavaScript (ES6+). Proven track record in enhancing user engagement and optimizing performance through agile methodologies, collaboration with cross-functional teams, and a strong focus on user experience (UX) principles.\n\n" +
                "PROFESSIONAL EXPERIENCE\n" +
                "Vista Music Instruments, SingaporeFrontend Web Developer				                                                               Dec 2022 – Feb 2025\n" +
                "Conceived and implemented a comprehensive React and Next.js component library across 12+ eCommerce storefronts, establishing design system patterns that reduced development time by 40% and enhanced frontend usability and performance. Collaborated in Agile environments to integrate sustainability practices into the development process.\n" +
                "Architected modernisation of critical 7+ year legacy JavaScript codebase, refactoring monolithic structures into modular, class-based architecture, eliminating 60% of recurring production bugs.\n" +
                "Delivered complex interactive features, including multi-variant product carousels with intelligent lazy loading, responsive mobile navigation with touch gestures, and dynamic promotional banner systems, resulting in a 25% improvement in user engagement and performance.\n" +
                "Collaborated extensively with cross-functional teams via Agile Software Development practices to translate complex Figma specifications into pixel-perfect, accessible, and responsive web interfaces using advanced SASS and modern CSS patterns\n" +
                "Implemented advanced performance optimisations including intelligent lazy loading strategies, code-splitting, and scoped styling that achieved 35% faster load times on high-traffic product pages\n\n" +
                "Future AI, USALead Frontend Developer					                  		           Nov 2020 – Oct 2022\n" +
                "Architected and developed a scalable React-based video conferencing platform, leveraging advanced JavaScript techniques and real-time collaboration features, successfully serving over 500 concurrent users and enhancing application performance.\n" +
                "Engineered a highly scalable chat architecture with WebSocket optimization and intelligent polling fallbacks, successfully integrating external APIs and achieving sub-100ms latency for distributed users, enhancing real-time user experience.\n" +
                "Engineered advanced performance optimisation strategies with React and Typescript, successfully handling multiple concurrent video sessions without performance degradation\n" +
                "Implemented robust state management using Redux Toolkit with efficient server state synchronisation, managing complex application state for video calls, user presence, and real-time messaging\n\n" +
                "Focalcast, USAFrontend Developer						                  		           Jun 2020 – Nov 2020\n" +
                "Developed a custom JavaScript chat UI with advanced features such as message threading and real-time typing notifications, ensuring high usability and performance across diverse web interfaces. Implemented frontend testing frameworks to enhance code quality and reliability.\n" +
                "Architected comprehensive authentication system with Django's built-in user management, including session handling, CSRF protection, and role-based access control for different user permission levels\n" +
                "Architected WebSocket communication architecture with intelligent polling fallbacks and connection retry logic, ensuring 99.9% message delivery reliability across unstable network connections\n\n" +
                "TECHNICAL SKILLS\n" +
                "Frontend Development: JavaScript (ES6+), HTML, ReactJS, TypeScript, Next.js\n" +
                "State Management - Redux, React Query, Zustand, React Context API\n" +
                "Unit Testing Frameworks - Jest, Vitest, Playwright, React Testing Library\n" +
                "Backend & Database - Node.js, MySQL, PostgreSQL, GraphQL, Prisma, SupabaseBuild Tools & Infrastructure - Babel, Webpack, Vite, Docker, AWS, GitHub Actions\n\n" +
                "EDUCATION\n" +
                "Washington University in St. Louis, USAMasters of Science, Computer Science				           			           Jan 2019 – Dec 2019\n" +
                "Washington University in St. Louis, USABachelors of Science, Computer Science				           		           Aug 2015 – Dec 2018\n\n") +
            "\n\nInstructions:\n" +
            "1. Extract key experiences, projects, and achievements from the document\n" +
            "2. For each experience, create a behavioral interview answer that follows the STAR format\n" +
            "3. Cover a wide range of behavioral competencies: leadership, teamwork, problem-solving, conflict resolution, communication, adaptability, time management, decision-making, innovation, and customer focus\n" +
            "4. Make each answer specific, quantifiable, and impactful\n" +
            "5. Ensure that all scenarios and examples chosen demonstrate clear BUSINESS VALUE and IMPACT. Focus on outcomes that matter to the business, such as revenue growth, cost reduction, efficiency improvements, customer satisfaction, or strategic alignment. Avoid purely technical descriptions without business context.\n" +
            "6. Highlight REPEATABLE actions and frameworks. Show that your success is due to systematic approaches (e.g., 'I established a process for...', 'I applied a framework to...') that are transferable across different business functions and companies, rather than just one-off fixes.\n" +
            "7. Emphasize EMPATHY and UNDERSTANDING first. Before jumping to solutions, explicitly mention how you sought to understand the user's or stakeholder's pain points and perspective. Describe how this empathy informed your problem-solving approach.\n" +
            "8. Include a REFLECTION or LEARNING section within the Result or as a concluding thought. Briefly mention what you learned from the experience and how you would apply it to future challenges.\n" +
            "9. IMPORTANT: Provide VERY DETAILED and IN-DEPTH answers. Each answer should be approximately 300-400 words. Elaborate significantly on the 'Action' and 'Result' sections.\n" +
            "10. Format each answer clearly with labeled sections: SITUATION, TASK, ACTION, RESULT\n" +
            `11. GENERATE ONLY ${
              endId - startId + 1
            } ANSWERS. START NUMBERING FROM ID #${startId}. So if startId is ${startId}, the first answer should be ID ${startId}, the second ${
              startId + 1
            }, etc.`;

          // -------------------------------------------------------------------
          // AI GENERATION CALL
          // -------------------------------------------------------------------
          // We use generateObject (not streamObject) because:
          // 1. We're not streaming to the frontend (Inngest runs in background)
          // 2. We need the complete JSON object to save it
          // 3. The function can take as long as needed (no timeout)
          const { object } = await generateObject({
            model: "google/gemini-2.0-flash",
            schema: GenerateAnswersSchema, // Forces structured JSON output
            prompt: promptText,
            temperature: AI_GENERATION.PROMPT_TEMPERATURE, // Balance between creativity and consistency
          });

          return object; // Returns { answers: [...] } with 5 answers
        }
      );

      // -----------------------------------------------------------------------
      // STEP 2B: Accumulate Answers
      // -----------------------------------------------------------------------
      // Add the new batch to our running total
      allAnswers.push(...batchResult.answers);

      // -----------------------------------------------------------------------
      // STEP 2C: Save Answers Individually (One-by-One)
      // -----------------------------------------------------------------------
      // APPROACH C: Batch generation + Individual saves
      // - Generate 5 answers together (reliable)
      // - Save each answer individually (progressive UX)
      // - Both polling and SSE frontends see one-by-one appearance
      //
      // WHY THIS WORKS:
      // - Polling: Frontend queries DB every 2s, sees 1, 2, 3, ... 5 answers
      // - SSE: Server polls DB every 2s, pushes update when count changes
      // - Result: User sees answers appear one-at-a-time, not all 5 together
      //
      // Each save is a separate Inngest step so progress is tracked individually
      for (let i = 0; i < batchResult.answers.length; i++) {
        const answer = batchResult.answers[i];
        const answerNumber = allAnswers.length + i + 1; // 1-indexed position

        await step.run(`save-answer-batch${batchNumber}-${i + 1}`, async () => {
          const answerToInsert = {
            userId: userId,
            competency: answer.competency,
            question: answer.question,
            situation: answer.situation,
            task: answer.task,
            action: answer.action,
            result: answer.result,
            // Handle optional fullAnswer
            fullAnswer:
              answer.fullAnswer ||
              `${answer.situation}\n\n${answer.task}\n\n${answer.action}\n\n${answer.result}`,
          };

          // Save ONE answer at a time
          await db.starAnswer.create({
            data: answerToInsert,
          });
        });

        // NO ARTIFICIAL DELAYS - Frontend polls frequently (500ms) to catch each save
        // This is more honest: answers appear as fast as they're generated
      }
    }

    // -------------------------------------------------------------------------
    // STEP 3: Return Success
    // -------------------------------------------------------------------------
    // Inngest tracks this return value in its dashboard
    return { success: true, count: allAnswers.length };
  }
);
