import { streamObject } from "ai";
import { GenerateAnswersSchema } from "@/lib/zod-schemas";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// ---------------------------------------------------------------------------
// SIMPLE PER-USER RATE LIMITING
// ---------------------------------------------------------------------------
// We only need lightweight protection here to keep hobby-tier tokens in check.
// The map lives at the module level so it survives across requests on the same
// serverless instance.
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 3; // Allow three chained requests per minute

type RateBucket = {
  count: number;
  resetAt: number;
};

const userRateLimit = new Map<string, RateBucket>();

function checkRateLimit(userId: string) {
  const now = Date.now();
  const bucket = userRateLimit.get(userId);

  if (!bucket || now >= bucket.resetAt) {
    // New window
    userRateLimit.set(userId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfter: Math.max(0, bucket.resetAt - now),
    };
  }

  bucket.count += 1;
  return { allowed: true };
}

// Allow streaming responses up to 60 seconds (Vercel Hobby Limit)
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // -----------------------------------------------------------------------
    // STEP 0: AUTHENTICATION
    // -----------------------------------------------------------------------
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // -----------------------------------------------------------------------
    // STEP 0.5: RATE LIMIT
    // -----------------------------------------------------------------------
    const rateStatus = checkRateLimit(session.user.id);
    if (!rateStatus.allowed) {
      console.warn(
        `[API] Rate limit hit for user ${session.user.id}. Retry after ${rateStatus.retryAfter}ms`
      );
      return Response.json(
        {
          error:
            "Too many streaming requests. Please wait a moment and try again.",
          retryAfter: rateStatus.retryAfter,
        },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    // 1. Parse Request Body for Pagination Parameters
    // We expect the frontend to send 'startId' and 'batchSize' to control pagination.
    // This allows us to generate answers in small batches (e.g., 5 at a time) to avoid timeouts.
    const { startId = 1, batchSize = 5 } = await req.json().catch(() => ({}));

    console.log(
      `[API] Starting stream for answers #${startId} to #${
        startId + batchSize - 1
      }`
    );

    // 2. Define the Prompt with Pagination Instructions
    // We dynamically inject the requested ID range into the prompt.
    // This ensures the AI knows exactly which "slice" of the 25 answers to generate right now.
    const promptText =
      "You are an expert career coach specializing in behavioral interviews. Analyze the following career document and generate behavioral interview answers in STAR format (Situation, Task, Action, Result).\n\n" +
      "Career Document:\n" +
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
      "Refactored comprehensive authentication system with Django's built-in user management, including session handling, CSRF protection, and role-based access control for different user permission levels\n" +
      "Architected WebSocket communication architecture with intelligent polling fallbacks and connection retry logic, ensuring 99.9% message delivery reliability across unstable network connections\n\n" +
      "TECHNICAL SKILLS\n" +
      "Frontend Development: JavaScript (ES6+), HTML, ReactJS, TypeScript, Next.js\n" +
      "State Management - Redux, React Query, Zustand, React Context API\n" +
      "Unit Testing Frameworks - Jest, Vitest, Playwright, React Testing Library\n" +
      "Backend & Database - Node.js, MySQL, PostgreSQL, GraphQL, Prisma, SupabaseBuild Tools & Infrastructure - Babel, Webpack, Vite, Docker, AWS, GitHub Actions\n\n" +
      "EDUCATION\n" +
      "Washington University in St. Louis, USAMasters of Science, Computer Science				           			           Jan 2019 – Dec 2019\n" +
      "Washington University in St. Louis, USABachelors of Science, Computer Science				           		           Aug 2015 – Dec 2018\n\n" +
      "Instructions:\n" +
      "1. Extract key experiences, projects, and achievements from the document\n" +
      "2. For each experience, create a behavioral interview answer that follows the STAR format\n" +
      "3. Cover a wide range of behavioral competencies: leadership, teamwork, problem-solving, conflict resolution, communication, adaptability, time management, decision-making, innovation, and customer focus\n" +
      "4. Make each answer specific, quantifiable, and impactful\n" +
      // Restored original long answer requirement
      "5. IMPORTANT: Provide VERY DETAILED and IN-DEPTH answers. Each answer should be approximately 300-400 words. Elaborate significantly on the 'Action' and 'Result' sections.\n" +
      "6. Format each answer clearly with labeled sections: SITUATION, TASK, ACTION, RESULT\n" +
      // DYNAMIC INSTRUCTION: Tell the model which ID range to generate
      `7. GENERATE ONLY ${batchSize} ANSWERS. START NUMBERING FROM ID #${startId}. So if startId is ${startId}, the first answer should be ID ${startId}, the second ${
        startId + 1
      }, etc.`;

    // 3. Initialize Streaming
    // streamObject is used to stream a structured JSON object.
    // It works by validating partial JSON against the Zod schema as it arrives.
    const result = await streamObject({
      model: "google/gemini-2.0-flash",
      schema: GenerateAnswersSchema,
      prompt: promptText,
      temperature: 0.7,
    });

    // 4. Return the Stream
    // The frontend useObject hook consumes this stream directly.
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[API] Error generating answers:", error);
    return Response.json(
      { error: "Failed to generate answers" },
      { status: 500 }
    );
  }
}
