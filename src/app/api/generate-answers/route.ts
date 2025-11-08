import { generateText } from "ai"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { content } = await req.json()

    if (!content || content.trim().length === 0) {
      return Response.json({ error: "Content is required" }, { status: 400 })
    }

    console.log("[v0] Starting to generate interview answers...")
    console.log("[v0] Content length:", content.length)

    // Generate behavioral interview answers using AI
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4.5",
      prompt: `You are an expert career coach specializing in behavioral interviews. Analyze the following career document and generate up to 50 different behavioral interview answers in STAR format (Situation, Task, Action, Result).

Career Document:
${content}

Instructions:
1. Extract key experiences, projects, and achievements from the document
2. For each experience, create a behavioral interview answer that follows the STAR format
3. Cover a wide range of behavioral competencies: leadership, teamwork, problem-solving, conflict resolution, communication, adaptability, time management, decision-making, innovation, and customer focus
4. Make each answer specific, quantifiable, and impactful
5. Ensure answers are 150-250 words each
6. Format each answer clearly with labeled sections: SITUATION, TASK, ACTION, RESULT
7. Generate as many unique answers as possible (up to 50) based on the content provided

Return the answers in the following JSON format:
{
  "answers": [
    {
      "id": 1,
      "competency": "Leadership",
      "question": "Tell me about a time when you led a team",
      "situation": "...",
      "task": "...",
      "action": "...",
      "result": "...",
      "fullAnswer": "..."
    }
  ]
}`,
      maxOutputTokens: 16000,
      temperature: 0.7,
    })

    console.log("[v0] Generated text length:", text.length)

    // Parse the JSON response
    let answers
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        answers = parsed.answers || []
      } else {
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      console.error("[v0] Failed to parse JSON:", parseError)
      // Fallback: return raw text
      answers = [
        {
          id: 1,
          competency: "General",
          question: "Career Summary",
          situation: "",
          task: "",
          action: "",
          result: "",
          fullAnswer: text,
        },
      ]
    }

    console.log("[v0] Generated answers count:", answers.length)

    return Response.json({
      answers,
      count: answers.length,
    })
  } catch (error) {
    console.error("[v0] Error generating answers:", error)
    return Response.json({ error: "Failed to generate answers" }, { status: 500 })
  }
}
