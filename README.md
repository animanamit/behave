# Behave

A tool I built to practice behavioral interviews. I kept blanking during "tell me about a time when..." questions and realized I just needed reps. Reading scripts in my head wasn't cutting it - I needed to actually say the words out loud, on camera, and see how I came across.

## Why I built this

Most interview prep is passive. You read example answers, maybe write some notes, then hope you remember them under pressure. That doesn't work for me. I needed something that forced me to actually practice delivering answers, not just thinking about them.

The video component is intentional. Behavioral interviews aren't just about what you say - they're about how you say it. Do you make eye contact? Do you look confident or like you're trying to remember a script? Do you ramble? You can't know any of this without seeing yourself. It's uncomfortable at first, but that's kind of the point.

## How it works

### The flow

1. **Upload resume/career doc** - This gives the AI context about my actual experience. Generic STAR answers are useless. I needed answers based on things I actually did.

2. **Generate scripts** - The AI creates 25 behavioral answers covering different competencies (leadership, conflict, failure, etc.). Each one follows STAR format and pulls from my real background. These become my "teleprompter scripts" for practice.

3. **Practice mode** - I pick a question, hit record, and deliver my answer while the script scrolls on screen. The camera shows my face so I can see my expressions. It's meant to feel like an actual interview - someone watching you while you talk.

4. **Review and feedback** - After recording, the AI transcribes what I said and compares it to the script. It tells me:
   - Did I cover the key points?
   - Did I go off on tangents?
   - Was my pacing okay or did I rush through it?
   - If I improvised, did it make the answer better or worse?

The goal isn't to memorize scripts word-for-word. It's to internalize the structure and key points so I can deliver them naturally. The feedback helps me see where I'm drifting too far from the core message.

## Tech choices and why

### Next.js 15 + Railway

I put both the frontend and database on Railway instead of the typical Vercel + Supabase setup. The reasoning: if my app and database are on different infrastructure, every database query adds latency from the network hop between providers. With both on Railway, they're in the same data center. For an app that hits the database constantly (loading answers, saving sessions, fetching feedback), this adds up.

It also means one platform to manage instead of two.

### PostgreSQL + Prisma

Nothing fancy here. Prisma gives me type safety and makes schema changes painless. PostgreSQL because it's reliable and I didn't need anything more specialized.

### tRPC

Type safety from database to frontend without writing API boilerplate. When I change a query, TypeScript tells me everywhere that breaks. This saved me a lot of debugging.

I still use regular REST routes for some things though - specifically AI streaming responses. The Vercel AI SDK returns streams that don't fit cleanly into tRPC's request/response model. So it's tRPC for normal CRUD, REST for AI stuff.

### Inngest for background jobs

This was a key decision. Generating 25 STAR answers takes longer than Vercel's 60-second timeout allows. I needed something that could run in the background without time limits.

Inngest also handles the video analysis pipeline. When someone finishes recording:

```
Upload to S3 → Transcribe audio (Whisper) → Analyze against script (Gemini) → Save feedback
```

Each step is a separate function. If transcription fails, I don't lose the video. If analysis fails, I don't redo transcription. Inngest handles retries per-step, which matters when you're paying per API call.

The step-based approach also lets me show progress in the UI. Users see "Transcribing..." then "Analyzing..." instead of just a spinner with no context.

### The batching problem

Early on, I tried generating all 25 answers in one AI call. It kept failing. The AI would return ~10,000 words of JSON and the response would randomly cut off mid-sentence, causing parse errors.

After some debugging, I realized large structured outputs are unreliable. The fix was batching - generate 5 answers at a time, save them immediately, then generate the next 5. Each batch is ~2,000 words which parses consistently.

This had a nice side effect: users see answers appear progressively instead of waiting 2 minutes for everything. Better UX from a technical constraint.

### S3 for video storage

Videos are large and I didn't want them in my database. S3 with presigned URLs keeps things simple - upload directly from the browser, download with time-limited URLs. The videos are private but accessible when needed.

### Whisper for transcription

OpenAI's Whisper is the best speech-to-text I've used. It handles filler words, pauses, and unclear speech well. The transcription quality directly affects feedback quality, so this mattered.

One gotcha: long videos (5+ minutes) can take several minutes to transcribe. I had to configure generous timeouts and make sure Inngest wouldn't kill the job early.

### Gemini for AI

I use Google's Gemini for both answer generation and feedback analysis. It's good at following structured output schemas and the pricing is reasonable for a personal project.

## What I learned

**Product stuff:**
- Practicing out loud is fundamentally different from practicing in your head. The video component forces you to confront how you actually come across, not how you imagine you come across.
- Progressive feedback is better than batch feedback. Seeing answers appear one by one feels faster than waiting for all 25, even if total time is the same.
- Status indicators matter. "Transcribing... Analyzing... Complete" is way better than a generic spinner.

**Technical stuff:**
- Large AI responses are unreliable. Batch and save incrementally.
- Background jobs solve a lot of timeout problems, but add complexity. Worth it for long-running tasks.
- Co-locating your app and database removes a whole category of latency issues.
- tRPC is great until you need streaming. Then you need escape hatches.

## What I'd improve

- **Tests** - I moved fast and skipped them. Would add before sharing with anyone else.
- **Mobile recording** - Currently assumes desktop with webcam. Phone recording would be useful for practicing anywhere.
- **Better error handling** - Some failures show generic messages. Should be more specific.
- **Practice streaks/stats** - Would be motivating to see how many days in a row I've practiced, which questions I struggle with, improvement over time.

---

This started as a tool for myself but turned into a good learning project. The intersection of video, AI, and background processing forced me to solve problems I wouldn't hit in a typical CRUD app.
