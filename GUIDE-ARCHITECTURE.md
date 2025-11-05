# Architecture Guide - Behave Interview Practice App

## Overview
This document explains the architectural decisions for this application. Read this FIRST before starting the build guides.

---

## Tech Stack Decisions

### Phase 1: MVP (Supabase-based)
**Why this stack for the first 3 days:**
- Speed of development
- Minimal infrastructure setup
- Focus on React patterns, not DevOps
- Can ship and demo quickly

**Stack:**
- **Next.js 15** (App Router) - Server components, Server Actions
- **React 19** - useOptimistic, use(), View Transitions
- **TypeScript** (strict mode) - Advanced patterns, branded types, generics
- **Better Auth** - Passkey support, modern auth UX
- **Supabase** - Postgres database, easy setup
- **Supabase Storage** - File storage for MVP
- **Zero** - Local-first sync, CRDTs
- **OpenAI Whisper** - Audio transcription
- **OpenRouter / Vercel AI Gateway** - User brings their own key
- **Vercel AI SDK** - Streaming responses
- **TanStack Query** - Server state management
- **Zod** - Runtime validation, type inference

### Phase 2: Production (AWS-based)
**Why migrate to AWS:**
- Learn real infrastructure (RDS, S3, IAM)
- Better for resume (AWS skills)
- Understanding cloud architecture
- Production-grade setup
- Lower long-term costs at scale

**What changes:**
- **Supabase Postgres** → **AWS RDS (Postgres)**
- **Supabase Storage** → **AWS S3** (already using S3, but direct)
- **Better Auth** (stays, but with RDS backend)
- Everything else stays the same

**Interview story:**
"I started with Supabase to validate the idea quickly, then migrated to AWS to learn cloud infrastructure. This taught me database migrations, IAM policies, S3 bucket policies, and production deployment patterns."

---

## Application Architecture

### Data Flow

```
User Upload Document
  ↓
Local Cache (Zero) ← immediately show optimistic state
  ↓
Supabase (source of truth)
  ↓
AI Parsing (streaming via Server Action)
  ↓
Zero sync ← update local cache
  ↓
UI updates automatically
```

### Recording Flow

```
User clicks Record
  ↓
MediaRecorder API (browser)
  ↓
Chunks collected in memory
  ↓
Stop recording
  ↓
Web Worker (off main thread)
  ├─ Generate thumbnail
  ├─ Extract audio track
  └─ Compress if needed
  ↓
Upload to S3 (background, with retry)
  ├─ Video file
  └─ Audio file
  ↓
Trigger transcription (Whisper API)
  ↓
Trigger AI analysis (streaming)
  ↓
Store results in Supabase
  ↓
Zero syncs to local cache
  ↓
UI updates with feedback
```

### Local-First Pattern (Zero)

**Why local-first:**
- Instant UI updates (no loading spinners)
- Offline-capable (bonus, not focus)
- Optimistic updates built-in
- Conflict resolution automatic (CRDTs)

**How it works:**
1. All reads from local Zero cache (instant)
2. All writes to Zero (instant local update)
3. Zero syncs to server in background
4. Conflicts resolved automatically via CRDTs
5. Other devices/tabs sync automatically

**What this gives you:**
- Snappy UI (feels native)
- No loading states for reads
- Optimistic updates for writes
- Real-time collaboration ready (if you add it later)

---

## Advanced TypeScript Patterns You'll Learn

### 1. Branded Types
**Problem:** JavaScript doesn't distinguish between different ID types
**Solution:** Brand them at the type level

**When to use:**
- User IDs, Session IDs, Answer IDs
- Prevents mixing them up
- Type-safe at compile time

**Example concept:**
```typescript
// A string branded as UserId - can't be used where SessionId is expected
type UserId = string & { readonly __brand: 'UserId' }
```

### 2. Discriminated Unions
**Problem:** Complex state with multiple possibilities
**Solution:** Union types with a discriminant field

**When to use:**
- Upload states (idle, uploading, processing, complete, error)
- Recording states
- Async operations

**Example concept:**
```typescript
// TypeScript knows which fields exist based on 'status'
type State =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number }
  | { status: 'error'; error: Error }
```

### 3. Generic Utility Types
**Problem:** Repeating similar type patterns
**Solution:** Create reusable generic types

**When to use:**
- Async data (loading, error, success states)
- API responses
- Form state

**Example concept:**
```typescript
// Reusable for ANY async operation
type AsyncData<T, E = Error> =
  | { status: 'loading' }
  | { status: 'error'; error: E }
  | { status: 'success'; data: T }
```

### 4. Zod + Type Inference
**Problem:** Maintaining separate runtime validation and TypeScript types
**Solution:** Define schema once, infer types

**When to use:**
- API responses
- Form validation
- Environment variables

**Key concept:**
- Write Zod schema (runtime validation)
- Infer TypeScript type from schema
- One source of truth

### 5. Const Type Parameters
**Problem:** Generic functions losing literal types
**Solution:** Use `as const` and const generics

**When to use:**
- Builder patterns
- Configuration objects
- Type-safe routes/keys

---

## React 19 Patterns You'll Learn

### 1. useOptimistic Hook
**What it solves:** Instant UI updates before server confirms

**Use cases in this app:**
- Document upload → show "Parsing..." immediately
- Recording → show "Uploading..." immediately
- AI feedback → show partial results as they stream

**Key concept:**
- Render optimistic state immediately
- Revert if server errors
- Update to real data when available

### 2. use() Hook
**What it solves:** Unwrapping promises/context in render

**Use cases in this app:**
- Reading from Zero cache (async)
- Server component data fetching
- Suspense boundaries

**Key concept:**
- Can "use" promises directly in render
- Suspense handles loading automatically
- Cleaner than useEffect + loading states

### 3. Server Actions
**What it solves:** Calling server code without API routes

**Use cases in this app:**
- AI parsing
- Transcription triggers
- Database mutations

**Key concept:**
- Functions marked 'use server'
- Called directly from client
- Built-in loading states via useFormStatus
- Automatic revalidation

### 4. View Transitions
**What it solves:** Smooth animations between pages/states

**Use cases in this app:**
- Practice → Review page transition
- Video thumbnail → fullscreen playback
- List item → detail view

**Key concept:**
- CSS View Transitions API
- React 19 makes it easy
- Feels native, not web

---

## Performance Patterns You'll Learn

### 1. Web Workers
**Problem:** Video processing blocks main thread → UI freezes
**Solution:** Offload to Web Worker

**What you'll do:**
- Thumbnail generation in worker
- Audio extraction in worker
- Video compression in worker

**Key concept:**
- Heavy CPU work in separate thread
- Message passing between main/worker
- Main thread stays responsive

### 2. Virtualized Lists
**Problem:** Rendering 100+ items is slow
**Solution:** Only render visible items

**What you'll do:**
- STAR answers list (potentially 50+ items)
- Session history (100+ practice sessions)

**Key concept:**
- Calculate visible window
- Render only those items
- Scroll smoothly regardless of total count

### 3. Optimistic Updates + Background Upload
**Problem:** Waiting for upload is slow UX
**Solution:** Show success immediately, upload in background

**What you'll do:**
- Recording completes → immediately show in history
- Upload happens in background
- Retry on failure
- Show subtle progress indicator

**Key concept:**
- UI updates immediately (optimistic)
- Network happens async
- Error recovery if upload fails

### 4. Lazy Loading + Intersection Observer
**Problem:** Loading all videos at once is slow
**Solution:** Load as they enter viewport

**What you'll do:**
- Video thumbnails load on scroll
- Hover previews load on demand
- Infinite scroll triggers at bottom

**Key concept:**
- Intersection Observer API
- Load resources just-in-time
- Reduce initial page weight

### 5. Streaming AI Responses
**Problem:** Waiting 10s for full AI response is bad UX
**Solution:** Stream response as it generates

**What you'll do:**
- Show AI feedback as it types (ChatGPT style)
- User can start reading while generating
- Feels faster even if same total time

**Key concept:**
- Server-sent events or streams
- Update UI incrementally
- Vercel AI SDK handles complexity

---

## File Structure

```
/behave
├── /app
│   ├── layout.tsx                 # Root layout, Better Auth provider
│   ├── page.tsx                   # Dashboard (Server Component)
│   ├── /api
│   │   ├── /auth/[...auth]        # Better Auth routes
│   │   └── /upload-url            # S3 presigned URL generator
│   ├── /upload
│   │   └── page.tsx               # Document upload page
│   ├── /practice
│   │   └── page.tsx               # Recording interface
│   └── /review
│       └── page.tsx               # Session review + feedback
│
├── /components
│   ├── /ui                        # shadcn components
│   └── /features
│       ├── /document-upload
│       │   ├── upload-zone.tsx
│       │   ├── parsing-progress.tsx
│       │   └── answer-list.tsx
│       ├── /video-recorder
│       │   ├── recorder.tsx       # Compound component root
│       │   ├── preview.tsx
│       │   ├── controls.tsx
│       │   └── status.tsx
│       └── /feedback
│           ├── streaming-feedback.tsx
│           └── score-badges.tsx
│
├── /lib
│   ├── /db
│   │   ├── client.ts              # Supabase client (Phase 1)
│   │   ├── schema.ts              # Database schema types
│   │   └── queries.ts             # Type-safe query builders
│   ├── /storage
│   │   ├── s3-client.ts           # S3 upload/download
│   │   └── presigned-urls.ts      # URL generation
│   ├── /ai
│   │   ├── openrouter.ts          # OpenRouter client
│   │   ├── vercel-ai.ts           # Vercel AI Gateway client
│   │   └── prompts.ts             # AI prompts
│   ├── /auth
│   │   └── better-auth.ts         # Better Auth config
│   ├── /zero
│   │   ├── schema.ts              # Zero schema definition
│   │   └── client.ts              # Zero client setup
│   └── /utils
│       ├── env.ts                 # Zod-validated env vars
│       └── types.ts               # Shared utility types
│
├── /hooks
│   ├── use-document-upload.ts     # Document upload with streaming
│   ├── use-video-recorder.ts      # Recording state machine
│   ├── use-optimistic-session.ts  # Optimistic session updates
│   └── use-streaming-feedback.ts  # AI feedback streaming
│
├── /workers
│   └── video-processor.ts         # Web Worker for video processing
│
├── /types
│   ├── database.ts                # Database types (generated or manual)
│   ├── api.ts                     # API response types
│   └── branded.ts                 # Branded type utilities
│
├── /actions
│   ├── parse-document.ts          # Server Action for AI parsing
│   ├── analyze-session.ts         # Server Action for feedback
│   └── transcribe-audio.ts        # Server Action for Whisper
│
└── /scripts
    └── migrate-to-aws.ts          # Migration script (Phase 2)
```

---

## Database Schema (Supabase)

### Tables

**users** (handled by Better Auth)
- id (uuid, PK)
- email (text, unique)
- created_at (timestamp)

**documents**
- id (uuid, PK)
- user_id (uuid, FK → users)
- file_name (text)
- file_size (int)
- storage_key (text) - S3 key
- uploaded_at (timestamp)
- processed (boolean)

**star_answers**
- id (uuid, PK)
- user_id (uuid, FK → users)
- document_id (uuid, FK → documents, nullable)
- competency (text) - e.g., "Leadership"
- question (text)
- situation (text)
- task (text)
- action (text)
- result (text)
- full_answer (text)
- created_at (timestamp)

**practice_sessions**
- id (uuid, PK)
- user_id (uuid, FK → users)
- answer_id (uuid, FK → star_answers)
- video_url (text) - S3 URL
- audio_url (text) - S3 URL
- thumbnail_url (text) - S3 URL
- transcript (text, nullable)
- duration (int) - seconds
- recorded_at (timestamp)

**session_feedback**
- id (uuid, PK)
- session_id (uuid, FK → practice_sessions)
- content_fidelity_score (int) - 1-10
- pacing (text) - "too-slow" | "perfect" | "too-fast"
- confidence (text) - "low" | "medium" | "high"
- suggestions (jsonb) - array of suggestion objects
- words_matched (int)
- total_words (int)
- key_points_missed (jsonb) - array of strings
- created_at (timestamp)

### Indexes
- user_id on all tables (for fast user queries)
- recorded_at DESC on practice_sessions (for chronological listing)
- answer_id on practice_sessions (for filtering by question)

---

## Zero Schema (Local-First)

Zero mirrors your Supabase schema but adds:
- Automatic sync
- Offline mutations queue
- Conflict resolution via CRDTs
- Real-time updates across tabs

**Key concept:**
- Define schema once in Zero
- Zero generates TypeScript types
- Read from Zero cache (instant)
- Write to Zero (syncs to Supabase)

---

## AWS Migration (Phase 2)

### What Changes

**Supabase Postgres** → **RDS Postgres**
- Same schema, different connection
- Learn: VPC, security groups, IAM roles
- Connection pooling (PgBouncer)

**Supabase Storage** → **S3** (direct)
- Already using S3, but via Supabase
- Now direct access
- Learn: Bucket policies, presigned URLs, CloudFront CDN

**Better Auth Backend**
- Point to RDS instead of Supabase
- Same auth flows
- No code changes needed

### What Stays Same
- Next.js app code
- React components
- Zero (just points to new backend)
- Better Auth (just different DB)

### What You Learn
- AWS Console navigation
- IAM policies (least privilege)
- RDS management
- S3 bucket policies
- Security groups
- Environment-based configs (dev/prod)

**Interview story:**
"I migrated from Supabase to AWS to learn production infrastructure. I set up RDS with proper security groups, configured S3 with CloudFront for video delivery, and managed IAM roles for least-privilege access. This taught me how to think about cloud architecture, not just glue SaaS products together."

---

## Common Pitfalls & How to Avoid

### 1. CORS Issues
**When:** Calling external APIs from client
**Fix:** Proxy through Next.js API route or Server Action

### 2. MediaRecorder codec support
**When:** Recording video in browser
**Fix:** Check supported types, fallback to safest option (webm/vp8)

### 3. S3 presigned URL expiration
**When:** User takes too long to upload
**Fix:** Generate with 5-10 min expiry, handle expiration gracefully

### 4. Web Worker can't access DOM
**When:** Trying to use canvas/video in worker
**Fix:** OffscreenCanvas API or pass data back to main thread

### 5. Zod parse errors
**When:** API returns unexpected shape
**Fix:** Use `.safeParse()` instead of `.parse()`, handle errors

### 6. React 19 useOptimistic timing
**When:** Optimistic update before mutation starts
**Fix:** Call mutation, THEN update optimistic state

### 7. Zero sync conflicts
**When:** Multiple tabs/devices editing same data
**Fix:** Let CRDTs handle it, or use last-write-wins for simple cases

### 8. Vercel AI SDK streaming errors
**When:** Streaming breaks mid-response
**Fix:** Error boundaries, show partial response, retry option

---

## Development Workflow

### Local Development
1. Run Postgres locally (Docker)
2. Run Next.js dev server
3. Use Supabase local dev (optional)
4. Mock S3 with local storage (initially)
5. Use real APIs (OpenRouter, Whisper) - free tiers

### Testing Strategy
**Not writing tests in 3-day sprint**, but when you do:
- Unit tests: TypeScript utility functions
- Integration tests: Server Actions
- E2E tests: Critical flows (upload → parse → record → review)
- Use Playwright for E2E

### Debugging Strategy
1. React DevTools (component tree, props)
2. Network tab (API calls, timings)
3. Console logs (liberal use during development)
4. Zero DevTools (sync state)
5. Supabase dashboard (database queries)

---

## Interview Talking Points

After building this, you can say:

**React/TypeScript:**
"I used advanced TypeScript patterns like branded types and discriminated unions for type safety. I leveraged all the new React 19 features - useOptimistic for instant UI updates, Server Actions for seamless client-server integration, and View Transitions for smooth animations."

**Architecture:**
"I built a local-first architecture using Zero, which uses CRDTs for conflict-free sync. This gives instant UI updates and real-time collaboration capabilities. I started with Supabase for speed, then migrated to AWS to learn production infrastructure."

**Performance:**
"I used Web Workers to offload video processing from the main thread, keeping the UI responsive. I implemented virtualized lists for handling 100+ items, lazy loading for images, and background upload with retry logic for reliability."

**AI Integration:**
"I integrated streaming AI responses using Vercel AI SDK, so users see feedback as it generates. I used Whisper for audio transcription and built a comparison system that analyzes transcript vs script. The AI gives structured feedback using Zod schemas for type safety."

**Infrastructure:**
"I handle video storage with S3 using presigned URLs for secure uploads. I set up RDS for the database with proper security groups and IAM roles. I understand the tradeoffs between managed services like Supabase and building on AWS directly."

---

## Success Criteria

After 3 days (MVP):
✅ Can upload document and see AI-generated STAR answers streaming in
✅ Can record video with camera
✅ Video uploads to S3 in background with progress indicator
✅ Can transcribe audio and get AI feedback
✅ UI updates instantly (optimistic updates)
✅ Code uses advanced TypeScript patterns
✅ Uses React 19 features extensively

After 9 days (Complete):
✅ All performance optimizations implemented
✅ Migrated to AWS (RDS + S3)
✅ Progress tracking and analytics
✅ Polished UI with smooth animations
✅ Comprehensive documentation
✅ Blog post drafted

---

## Resources You'll Need

**Documentation:**
- React 19 docs (react.dev)
- Next.js 15 docs (nextjs.org)
- Zero docs (zero.rocicorp.dev)
- Better Auth docs (better-auth.com)
- Vercel AI SDK docs (sdk.vercel.ai)
- AWS S3 docs (for presigned URLs)
- MDN Web APIs (MediaRecorder, Web Workers, Intersection Observer)

**Tools:**
- TypeScript playground (for testing types)
- Supabase dashboard (database management)
- AWS Console (Phase 2)
- Vercel dashboard (deployment)

**APIs:**
- OpenRouter (or user's OpenAI key)
- OpenAI Whisper API
- Vercel AI Gateway (optional)

---

Read this document thoroughly before starting the build guides. Refer back to it when making decisions.

Now proceed to **GUIDE-3DAY-MVP.md** to start building.
