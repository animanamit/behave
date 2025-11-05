# 3-Day MVP Build Guide - Behave Interview Practice App

**Goal:** Ship a working interview practice app that demonstrates advanced React patterns, TypeScript skills, and AI integration.

**Timeline:** 3 days (Day 1: Foundation + Upload, Day 2: Recording System, Day 3: AI Analysis)

**Prerequisites:**
- Read `GUIDE-ARCHITECTURE.md` first
- Node.js 18+ installed
- Git installed
- Supabase account (free tier)
- AWS account (for S3)
- OpenRouter account OR OpenAI API key

---

## Pre-Build Setup (30 minutes)

### Step 1: Environment Preparation

**1.1 - Clean your existing project**
- Review what v0 generated
- Delete unnecessary files (keep the basic structure)
- Keep shadcn components in `/components/ui`
- Delete the mock pages (we're rebuilding from scratch)

**1.2 - Create a fresh git branch for your work**
- Branch name: `feature/3day-mvp-build`
- This keeps your v0 prototype separate

**1.3 - Set up your documentation system**
- Create a Notion page or markdown file for notes
- Sections: "Day 1 Log", "Day 2 Log", "Day 3 Log", "Bugs Hit", "Patterns Learned"
- Have this open alongside your code

**1.4 - Install additional dependencies**

You'll need to add these packages (don't install yet, just understand what they do):

**Zero** - Local-first sync
- `@rocicorp/zero`
- Handles local cache, sync, CRDTs

**Better Auth** - Authentication with passkeys
- `better-auth`
- Modern auth, passkey support

**Vercel AI SDK** - Streaming AI responses
- `ai`
- Already in your package.json

**TanStack Query** - Server state
- `@tanstack/react-query`
- Async state management

**AWS SDK** - S3 uploads
- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`
- S3 presigned URLs

**Zod** - Validation
- `zod`
- Already in your package.json

**Dexie** - IndexedDB wrapper (only if NOT using Zero)
- Skip this if you're using Zero

**Additional tools:**
- `openai` - For Whisper API
- `react-dropzone` - File upload UX

### Step 2: Create Project Structure

**2.1 - Set up the folder structure from GUIDE-ARCHITECTURE.md**

Create these directories:
- `/lib/db` - Database clients
- `/lib/storage` - S3 client
- `/lib/ai` - AI clients
- `/lib/auth` - Better Auth
- `/lib/zero` - Zero setup
- `/lib/utils` - Already exists, enhance it
- `/hooks` - Custom hooks
- `/workers` - Web Workers
- `/types` - Global types
- `/actions` - Server Actions
- `/components/features` - Feature components

**2.2 - Update tsconfig.json for strict mode**

Enable these TypeScript strict options:
- `strict: true`
- `strictNullChecks: true`
- `noUncheckedIndexedAccess: true`
- Path aliases already set up (`@/`)

**Why this matters:**
Strict TypeScript catches bugs at compile time. You'll learn to handle nulls/undefined properly.

### Step 3: Environment Variables Setup

**3.1 - Create `.env.local` file**

You'll need these variables (fill them in as you set up services):

```
# Database
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

# Storage
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

# AI (users bring their own, but you need for testing)
OPENAI_API_KEY=
OPENROUTER_API_KEY=
```

**3.2 - Create type-safe environment validation**

Location: `/lib/utils/env.ts`

Task: Create a Zod schema that validates all environment variables at startup

**What you're learning:**
- Zod schema definition
- Runtime validation
- Type inference from Zod
- Fail-fast pattern (app won't start with bad config)

**Implementation approach:**
- Define a Zod object schema with all env vars
- Use `.parse()` on `process.env`
- Export the validated env object
- Import this in your app, never use `process.env` directly

**Common pitfall:**
Zod will throw if vars are missing. Make sure you handle this gracefully during development (maybe use `.safeParse()` and show helpful error message).

---

## DAY 1: Foundation + Document Upload (6-8 hours)

**Goal:** User can upload a document, see streaming AI parse it into STAR answers, and see them stored locally + in Supabase.

### Phase 1.1: Supabase Setup (45 min)

**1.1.1 - Create Supabase project**
- Go to supabase.com
- Create new project (free tier)
- Note down URL and anon key
- Add to `.env.local`

**1.1.2 - Create database schema**

Use the SQL editor in Supabase dashboard to create tables from GUIDE-ARCHITECTURE.md:
- `users` (Better Auth will handle this, but create a basic version for now)
- `documents`
- `star_answers`
- `practice_sessions`
- `session_feedback`

**What you're learning:**
- SQL table creation
- Foreign key relationships
- UUID vs integer IDs
- Timestamp columns with defaults

**Common pitfalls:**
- Forgetting NOT NULL constraints
- Wrong FK references
- Missing indexes (add them!)

**1.1.3 - Enable Row Level Security (RLS)**

For each table, create RLS policies:
- Users can only read their own data
- Users can only insert/update their own data

**What you're learning:**
- Database-level authorization
- RLS syntax
- Security best practices

**Skip this if running out of time, but come back to it later.**

**1.1.4 - Create Supabase client**

Location: `/lib/db/client.ts`

Task: Create a Supabase client that can be used in both server and client components

**What you're learning:**
- Next.js Server Components vs Client Components
- Supabase auth context
- Singleton pattern (one client instance)

**Implementation approach:**
- Create server client (for Server Components, API routes)
- Create client client (for Client Components)
- Export both

**Reference:** Supabase Next.js docs

### Phase 1.2: Better Auth Setup (45 min)

**1.2.1 - Install Better Auth**

Run: `npm install better-auth`

**1.2.2 - Configure Better Auth**

Location: `/lib/auth/better-auth.ts`

Task: Set up Better Auth with:
- Passkey support
- Email/password as fallback
- Supabase as backend

**What you're learning:**
- Modern auth patterns
- Passkey/WebAuthn basics
- Auth middleware

**Implementation approach:**
- Follow Better Auth docs for Supabase adapter
- Enable passkey plugin
- Set up session management

**Common pitfall:**
Better Auth needs specific database tables. Make sure they're created.

**1.2.3 - Create auth API routes**

Location: `/app/api/auth/[...auth]/route.ts`

Task: Catch-all route for Better Auth

**What you're learning:**
- Next.js catch-all routes
- API route handlers

**1.2.4 - Create auth context/provider**

Location: `/components/providers/auth-provider.tsx`

Task: Wrap your app with auth context so you can access user anywhere

**What you're learning:**
- React Context API
- Provider pattern
- Client-side auth state

**1.2.5 - Protect routes**

Task: Create middleware to redirect unauthenticated users to login

Location: `/middleware.ts`

**What you're learning:**
- Next.js middleware
- Route protection patterns

**For MVP, you can skip fancy login UI. Just use Better Auth's default forms.**

### Phase 1.3: TypeScript Foundations (30 min)

**1.3.1 - Create branded types**

Location: `/types/branded.ts`

Task: Create branded types for IDs

**What you're learning:**
- Type branding technique
- Phantom types
- Compile-time safety

**Branded types you need:**
- `UserId`
- `DocumentId`
- `AnswerId`
- `SessionId`

**Implementation approach:**
- Create a generic `Brand` utility type
- Use intersection types
- Create constructor functions for each

**Example concept** (don't just copy, understand it):
```typescript
// A brand is a unique symbol that makes the type incompatible with plain strings
```

**1.3.2 - Create discriminated union types**

Location: `/types/api.ts`

Task: Create discriminated unions for async states

**States you need:**
- Upload state (idle, uploading, processing, success, error)
- Recording state (idle, recording, processing, uploading, complete, error)
- AI streaming state (idle, streaming, complete, error)

**What you're learning:**
- Discriminated unions
- Type narrowing
- Exhaustive checking with `never`

**1.3.3 - Create Zod schemas for database entities**

Location: `/lib/db/schema.ts`

Task: Create Zod schemas for each database table

**What you're learning:**
- Zod schema composition
- Type inference
- Validation patterns

**Schemas you need:**
- `DocumentSchema`
- `STARAnswerSchema`
- `PracticeSessionSchema`
- `SessionFeedbackSchema`

**After creating schemas, infer types:**
```typescript
export type Document = z.infer<typeof DocumentSchema>
```

### Phase 1.4: Document Upload UI (1.5 hours)

**1.4.1 - Create upload page**

Location: `/app/upload/page.tsx`

Task: Create a page with a drag-and-drop file upload zone

**What you're learning:**
- File input handling
- Drag and drop API
- File validation

**Use react-dropzone for easier DX**

**UI Requirements:**
- Drag-and-drop zone
- Click to browse
- File type validation (PDF, DOCX, TXT only)
- File size limit (10MB max)
- Show selected file details

**1.4.2 - Create upload component**

Location: `/components/features/document-upload/upload-zone.tsx`

Task: Extract upload logic into reusable component

**What you're learning:**
- Component composition
- Props interface design
- Event handling

**Props interface:**
- `onFileSelect: (file: File) => void`
- `accept: string[]`
- `maxSize: number`
- `isLoading: boolean`

**1.4.3 - Add file reading logic**

Task: Read file content in browser (for text files)

**What you're learning:**
- FileReader API
- Async file reading
- Binary vs text files

**For MVP:**
- Only support TXT files (easiest)
- Skip PDF/DOCX parsing (requires libraries)
- Read as text with FileReader

**Common pitfall:**
FileReader is callback-based, wrap it in a Promise for cleaner async/await.

### Phase 1.5: AI Parsing with Streaming (2 hours)

**1.5.1 - Create AI client**

Location: `/lib/ai/openrouter.ts`

Task: Create a client for OpenRouter API

**What you're learning:**
- API client patterns
- Headers, authentication
- Error handling

**Client should:**
- Accept API key (user provides)
- Accept model selection
- Have a method for streaming chat completions
- Handle errors gracefully

**1.5.2 - Create Server Action for parsing**

Location: `/actions/parse-document.ts`

Task: Server Action that takes document text, streams AI responses

**What you're learning:**
- Server Actions
- Streaming responses
- Vercel AI SDK

**Implementation approach:**
- Mark function with `'use server'`
- Use Vercel AI SDK's `streamText()` function
- Return stream reader
- Prompt: Ask AI to extract STAR answers from document

**Prompt engineering tips:**
- Be specific about format (JSON)
- Give examples of good STAR answers
- Request structured output
- Limit to 10-20 answers (not 50, that's too many for MVP)

**1.5.3 - Create streaming UI component**

Location: `/components/features/document-upload/parsing-progress.tsx`

Task: Component that shows AI responses as they stream in

**What you're learning:**
- Vercel AI SDK's `useCompletion` or `useChat` hook
- Real-time UI updates
- Streaming data handling

**Implementation approach:**
- Use `useCompletion` hook from `'ai/react'`
- Pass Server Action as API endpoint
- Display partial response as it streams
- Show "typing" indicator

**UI should show:**
- Progress indicator
- Partial text as it streams
- Count of answers found so far
- "Complete" state when done

**1.5.4 - Parse AI response into structured data**

Task: Extract JSON from AI response, validate with Zod

**What you're learning:**
- JSON parsing
- Error recovery
- Zod validation

**Implementation approach:**
- AI might return markdown wrapped JSON (```json ... ```)
- Extract JSON with regex
- Parse with `JSON.parse()`
- Validate with Zod schema
- Handle parse failures gracefully

**Common pitfalls:**
- AI doesn't always return valid JSON
- Use `.safeParse()` not `.parse()`
- Have fallback behavior

**1.5.5 - Save answers to Supabase**

Task: Insert parsed answers into `star_answers` table

**What you're learning:**
- Supabase insert operations
- Batch inserts
- Transaction handling

**Implementation approach:**
- Use Supabase client's `.insert()` method
- Insert all answers in one batch
- Get back inserted IDs
- Handle foreign keys (document_id, user_id)

### Phase 1.6: Zero Setup (1 hour)

**1.6.1 - Install Zero**

Run: `npm install @rocicorp/zero`

**1.6.2 - Define Zero schema**

Location: `/lib/zero/schema.ts`

Task: Define Zero schema matching your Supabase tables

**What you're learning:**
- Zero schema definition
- Relationship modeling
- Type generation

**Follow Zero docs for schema syntax**

**Tables to mirror:**
- `star_answers`
- `practice_sessions` (for later)
- `session_feedback` (for later)

**1.6.3 - Create Zero client**

Location: `/lib/zero/client.ts`

Task: Initialize Zero with your schema and Supabase backend

**What you're learning:**
- Zero initialization
- Backend configuration
- Client singleton

**1.6.4 - Set up Zero provider**

Location: `/components/providers/zero-provider.tsx`

Task: Wrap app with Zero provider

**What you're learning:**
- Provider composition
- React Context for data layer

**1.6.5 - Create hook to read from Zero**

Location: `/hooks/use-star-answers.ts`

Task: Custom hook that reads STAR answers from Zero cache

**What you're learning:**
- Zero's `useQuery` API
- Custom hook patterns
- Local-first reads

**Implementation approach:**
- Use Zero's query API
- Filter by user ID
- Return answers with loading state
- Automatically re-render on updates

### Phase 1.7: Display Answers with Optimistic Updates (1 hour)

**1.7.1 - Create answer list component**

Location: `/components/features/document-upload/answer-list.tsx`

Task: Display list of STAR answers from Zero cache

**What you're learning:**
- Rendering lists
- Zero query integration
- Component design

**UI should show:**
- Each answer as a card
- Competency badge
- Question text
- Collapsible STAR sections
- Created date

**1.7.2 - Add optimistic updates with React 19**

Task: When parsing completes, show answers immediately before Supabase confirms

**What you're learning:**
- `useOptimistic` hook
- Optimistic UI patterns
- Rollback on error

**Implementation approach:**
- Import `useOptimistic` from React 19
- Wrap your answers list
- When parse completes, add to optimistic state
- Zero will sync and replace with real data
- If error, optimistic state reverts

**Pattern:**
```typescript
// Current answers from Zero
const [optimisticAnswers, addOptimistic] = useOptimistic(
  realAnswers,
  (state, newAnswer) => [...state, newAnswer]
)

// When AI parsing returns an answer
addOptimistic(newAnswer)
// UI updates immediately

// Then save to Supabase
await saveToSupabase(newAnswer)
// Zero syncs, replaces optimistic with real
```

**1.7.3 - Add loading states**

Task: Show skeletons while loading

**What you're learning:**
- Suspense boundaries
- Loading UI patterns
- Skeleton components

**Use shadcn skeleton components**

### Phase 1.8: Wire It All Together (30 min)

**1.8.1 - Create dashboard page**

Location: `/app/page.tsx`

Task: Main dashboard showing uploaded documents and answers

**What you're learning:**
- Page composition
- Server Components
- Client Components boundary

**Dashboard should show:**
- List of uploaded documents
- Button to upload new document
- Count of total STAR answers
- Recent answers preview

**1.8.2 - Add navigation**

Task: Links between pages

**Simple nav:**
- Dashboard (/)
- Upload (/upload)
- Practice (/practice) - placeholder for now
- Review (/review) - placeholder for now

**1.8.3 - Test the flow end-to-end**

**Manual test:**
1. Sign up with passkey
2. Navigate to upload page
3. Upload a text file with your resume/experiences
4. See streaming parse progress
5. See answers appear in real-time
6. Navigate to dashboard
7. See all answers listed
8. Refresh page - answers should persist (Zero + Supabase)

**Debug any issues before moving to Day 2**

---

## DAY 2: Video Recording System (8-10 hours)

**Goal:** User can record themselves answering a question, video uploads to S3 in background, audio is extracted.

### Phase 2.1: AWS S3 Setup (30 min)

**2.1.1 - Create S3 bucket**

In AWS Console:
- Create new bucket
- Name: `behave-interview-videos` (or whatever)
- Region: Choose closest to you
- Block all public access: YES (we'll use presigned URLs)
- Versioning: Disabled (for now)
- Encryption: Enable (default AWS encryption)

**2.1.2 - Create IAM user for S3 access**

In AWS IAM:
- Create new user: `behave-app-s3-uploader`
- Attach policy: `AmazonS3FullAccess` (for MVP - restrict this later)
- Generate access keys
- Add to `.env.local`

**What you're learning:**
- AWS IAM concepts
- Least privilege (even though we're using full access for now)
- Access key management

**2.1.3 - Configure CORS on bucket**

In S3 bucket settings, add CORS configuration:
- Allow PUT, POST, GET from your domain
- Allow all headers for now

**Why:** Presigned URLs need CORS to work from browser

**2.1.4 - Install AWS SDK**

Run: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`

**2.1.5 - Create S3 client**

Location: `/lib/storage/s3-client.ts`

Task: Create S3 client with credentials from env

**What you're learning:**
- AWS SDK initialization
- Credential management
- Client configuration

**2.1.6 - Create presigned URL generator**

Location: `/lib/storage/presigned-urls.ts`

Task: Function to generate presigned URL for PUT

**What you're learning:**
- S3 presigned URLs
- Temporary access patterns
- Security (URLs expire)

**Implementation approach:**
- Use `getSignedUrl` from SDK
- Command: `PutObjectCommand`
- Expiration: 300 seconds (5 min)
- Return URL and object key

**2.1.7 - Create API route for presigned URLs**

Location: `/app/api/upload-url/route.ts`

Task: Endpoint that returns presigned URL

**What you're learning:**
- API routes
- POST handlers
- Request/response patterns

**API should:**
- Accept: `{ fileName: string, fileType: string, category: 'video' | 'audio' }`
- Validate user is authenticated
- Generate S3 key: `videos/{userId}/{sessionId}/{timestamp}-{fileName}`
- Return: `{ presignedUrl: string, fileKey: string }`

**Security note:**
This route needs auth. Check Better Auth session.

### Phase 2.2: MediaRecorder Setup (1.5 hours)

**2.2.1 - Create recording state type**

Location: `/types/api.ts`

Task: Discriminated union for recording states

**What you're learning:**
- Complex state modeling
- Discriminated unions in practice

**States:**
- `{ status: 'idle' }`
- `{ status: 'requesting-camera' }`
- `{ status: 'camera-ready', stream: MediaStream }`
- `{ status: 'recording', startTime: number, chunks: Blob[] }`
- `{ status: 'processing', videoBlob: Blob }`
- `{ status: 'uploading', progress: number, videoBlob: Blob }`
- `{ status: 'complete', videoUrl: string, audioUrl: string }`
- `{ status: 'error', error: Error, canRetry: boolean }`

**2.2.2 - Create useVideoRecorder hook**

Location: `/hooks/use-video-recorder.ts`

Task: Custom hook managing entire recording lifecycle

**What you're learning:**
- Complex custom hooks
- State machines in React
- Media APIs
- useReducer for complex state

**Implementation approach:**
- Use `useReducer` for state machine (not XState, just plain reducer)
- Each action transitions between states
- State transitions enforce valid flows
- Return methods: `requestCamera()`, `startRecording()`, `stopRecording()`

**Methods to implement:**

**requestCamera()**
- Call `navigator.mediaDevices.getUserMedia()`
- Request video + audio
- Store stream in state
- Handle permission denied

**startRecording()**
- Create MediaRecorder from stream
- Set up data available handler
- Collect chunks in state
- Start timer

**stopRecording()**
- Stop MediaRecorder
- Create Blob from chunks
- Transition to processing state

**Common pitfalls:**
- MediaRecorder codec support varies by browser
- Check supported types: `MediaRecorder.isTypeSupported()`
- Fallback: webm/vp8 (most compatible)
- Chunks might be empty if timeslice too large

**2.2.3 - Create camera preview component**

Location: `/components/features/video-recorder/preview.tsx`

Task: Video element showing live camera feed

**What you're learning:**
- Video element in React
- MediaStream as srcObject
- Ref handling

**Implementation approach:**
- Use `useRef<HTMLVideoElement>`
- Set `srcObject` to MediaStream from hook
- Set `autoPlay` and `muted` (don't hear yourself)
- Handle stream cleanup on unmount

**2.2.4 - Create recording controls**

Location: `/components/features/video-recorder/controls.tsx`

Task: Start/Stop buttons

**What you're learning:**
- Conditional rendering
- State-based UI
- Button states

**UI shows:**
- If idle: "Start Camera" button
- If camera ready: "Record" button (big, circular, red)
- If recording: "Stop" button (square icon)
- Timer display during recording
- Camera/mic toggle buttons

### Phase 2.3: Web Worker for Video Processing (2 hours)

**2.3.1 - Create web worker file**

Location: `/workers/video-processor.ts`

Task: Worker that processes video off main thread

**What you're learning:**
- Web Workers
- Post message API
- Offscreen processing

**Worker should handle:**
- Extract audio from video
- Generate thumbnail at 0 seconds
- Compress video (optional, skip if complex)

**Implementation approach:**
- Listen for `message` events
- Handle different message types (discriminated union!)
- Post results back to main thread

**Message types:**
- `{ type: 'PROCESS_VIDEO', blob: Blob }`
- Returns: `{ type: 'PROCESSING_COMPLETE', audioBlob: Blob, thumbnail: Blob }`

**2.3.2 - Implement audio extraction**

Task: Extract audio track from video Blob

**What you're learning:**
- MediaSource API (advanced!)
- Audio/video track manipulation
- Canvas for thumbnail

**Implementation approach (complex!):**
- Create video element in worker (OffscreenCanvas context)
- Load video Blob
- Use Web Audio API to extract audio
- Create new Blob with audio only

**Alternative for MVP:**
Skip extraction in worker. Send entire video to S3, extract audio server-side later with FFmpeg (Lambda function). This is easier but less impressive.

**For learning purposes, try client-side first. If stuck after 1 hour, move server-side.**

**2.3.3 - Implement thumbnail generation**

Task: Generate thumbnail image from video at 0 seconds

**What you're learning:**
- Canvas API
- Video frame extraction
- Blob generation

**Implementation approach:**
- Create video element, set src to Blob URL
- Seek to time 0
- Wait for `seeked` event
- Draw frame to canvas
- Convert canvas to Blob (JPEG, 0.8 quality)

**2.3.4 - Wire worker into hook**

Location: `/hooks/use-video-recorder.ts` (update)

Task: Create worker, communicate with it

**What you're learning:**
- Worker lifecycle
- Message passing
- Async worker communication

**Implementation approach:**
- Create worker in useEffect: `new Worker(new URL('../workers/video-processor.ts', import.meta.url))`
- On stop recording, post message to worker
- Listen for worker response
- Update state when processing complete
- Terminate worker on unmount

**Common pitfall:**
Next.js needs special webpack config for workers. Check Next.js docs for worker support.

### Phase 2.4: Background Upload with Retry (2 hours)

**2.4.1 - Create upload function with progress**

Location: `/lib/storage/upload.ts`

Task: Function that uploads Blob to S3 with progress tracking

**What you're learning:**
- XMLHttpRequest for progress tracking
- Fetch doesn't support upload progress easily
- Progress events

**Implementation approach:**
- Get presigned URL from your API route
- Use XMLHttpRequest (yes, really, for progress events)
- Listen to `upload.onprogress`
- Return Promise that resolves when complete

**Function signature:**
```typescript
async function uploadToS3(
  blob: Blob,
  fileType: string,
  onProgress: (percent: number) => void
): Promise<string>
```

**2.4.2 - Add retry logic**

Task: Retry failed uploads with exponential backoff

**What you're learning:**
- Error recovery patterns
- Exponential backoff
- Retry limits

**Implementation approach:**
- Wrap upload in try/catch
- On error, wait `Math.pow(2, attempt) * 1000` ms
- Retry up to 3 times
- If all retries fail, throw error

**2.4.3 - Integrate upload into hook**

Location: `/hooks/use-video-recorder.ts` (update)

Task: After worker processes video, upload in background

**What you're learning:**
- Chaining async operations
- State updates during async flow
- Error handling across multiple steps

**Flow:**
1. Recording stops
2. State: `processing` (worker running)
3. Worker completes
4. State: `uploading` with progress 0
5. Start upload, update progress
6. Upload completes
7. State: `complete` with video URL

**2.4.4 - Add optimistic UI**

Task: Use `useOptimistic` to show recording in session list immediately

**What you're learning:**
- useOptimistic with complex flows
- Optimistic state for uploads
- Rollback on failure

**Pattern:**
- When recording stops, add to optimistic session list with "Uploading..." status
- As upload progresses, update status
- When upload completes, replace with real data from Supabase
- If upload fails, show retry button

### Phase 2.5: Practice Page UI (2 hours)

**2.5.1 - Create practice page layout**

Location: `/app/practice/page.tsx`

Task: Split screen layout (recording on left, script on right)

**What you're learning:**
- CSS Grid / Flexbox
- Responsive layout
- Fixed sidebars

**Layout:**
- Left 2/3: Video preview + controls
- Right 1/3: Question + Script (scrollable, sticky)

**2.5.2 - Integrate video recorder**

Task: Use your `useVideoRecorder` hook, render UI

**Components to create:**
- `<VideoPreview>` - Shows camera feed or recorded video
- `<RecordingControls>` - Start/stop buttons
- `<RecordingStatus>` - Timer, upload progress
- `<CameraToggle>` - Toggle camera/mic on/off

**2.5.3 - Add question selection**

Task: Let user pick which STAR answer to practice

**What you're learning:**
- Data fetching in Server Components
- Client/Server composition
- Props passing

**Implementation approach:**
- Fetch user's STAR answers (from Zero or Supabase)
- Show dropdown to select
- Display selected question + script in sidebar
- Pass selected answer to recording component

**For MVP:**
Just hardcode one question. Skip selection for now.

**2.5.4 - Create script display**

Location: `/components/features/video-recorder/script-display.tsx`

Task: Scrollable teleprompter-style script

**UI requirements:**
- Large, readable font
- STAR sections labeled and color-coded
- Auto-scrolls as user talks (future feature, skip for now)
- Sticky, always visible

**2.5.5 - Test recording flow**

**Manual test:**
1. Click "Start Camera" - see yourself
2. Click "Record" - timer starts
3. Talk for 30 seconds
4. Click "Stop" - processing starts
5. See thumbnail generated
6. See upload progress
7. Recording appears in session list
8. Refresh page - recording persists

**Debug any issues before Day 3**

---

## DAY 3: AI Analysis & Feedback (6-8 hours)

**Goal:** Transcribe recorded audio, compare to script, generate AI feedback, display streaming results.

### Phase 3.1: Audio Transcription (1.5 hours)

**3.1.1 - Create Whisper API client**

Location: `/lib/ai/whisper.ts`

Task: Function to transcribe audio with OpenAI Whisper

**What you're learning:**
- Audio processing APIs
- FormData for file uploads
- Multipart requests

**Implementation approach:**
- Create FormData
- Append audio blob
- POST to `https://api.openai.com/v1/audio/transcriptions`
- Model: `whisper-1`
- Response format: `verbose_json` (includes word timestamps)

**Function signature:**
```typescript
async function transcribeAudio(
  audioBlob: Blob,
  apiKey: string
): Promise<TranscriptionResult>
```

**TranscriptionResult type:**
- `text: string` - Full transcript
- `words: Array<{ word: string, start: number, end: number }>` - Word-level timestamps
- `duration: number` - Audio duration

**3.1.2 - Create Server Action for transcription**

Location: `/actions/transcribe-audio.ts`

Task: Server Action that accepts audio URL, downloads it, transcribes it

**What you're learning:**
- Server Actions with file processing
- Downloading from S3
- Error handling

**Implementation approach:**
- Mark function `'use server'`
- Accept audio S3 URL
- Download audio blob from S3
- Call Whisper API
- Return transcript
- Store in Supabase `practice_sessions` table

**Common pitfall:**
Audio blob might be too large for Whisper (25MB limit). Check size, compress if needed.

**3.1.3 - Trigger transcription after upload**

Location: `/hooks/use-video-recorder.ts` (update)

Task: After video/audio upload completes, trigger transcription

**Implementation approach:**
- When upload state is `complete`
- Call transcription Server Action
- Don't block UI (do in background)
- Update session record when complete

### Phase 3.2: AI Feedback Generation (2 hours)

**3.2.1 - Create feedback Zod schema**

Location: `/lib/db/schema.ts` (update)

Task: Schema for structured AI feedback

**What you're learning:**
- Nested Zod schemas
- Complex validation
- Type inference

**Schema structure:**
```typescript
FeedbackSchema = {
  scores: {
    contentFidelity: number (0-10),
    pacing: "too-slow" | "perfect" | "too-fast",
    confidence: "low" | "medium" | "high"
  },
  suggestions: [
    {
      category: "content" | "delivery" | "structure",
      text: string,
      priority: "low" | "medium" | "high"
    }
  ],
  transcriptAnalysis: {
    wordsMatched: number,
    totalWords: number,
    keyPointsMissed: string[]
  }
}
```

**3.2.2 - Create feedback prompt**

Location: `/lib/ai/prompts.ts`

Task: Craft prompt for AI to analyze performance

**What you're learning:**
- Prompt engineering
- Structured output requests
- Few-shot examples

**Prompt should include:**
- Transcript text
- Original script (STAR answer)
- Instructions to compare
- Request specific feedback format (matching schema)
- Example of good feedback (few-shot)

**Tips:**
- Be specific about scoring criteria
- Ask for actionable suggestions
- Request JSON output
- Show example JSON structure

**3.2.3 - Create Server Action for analysis**

Location: `/actions/analyze-session.ts`

Task: Server Action that streams AI feedback

**What you're learning:**
- Streaming Server Actions
- Vercel AI SDK advanced usage
- Structured streaming

**Implementation approach:**
- Accept session ID
- Load session + transcript + script from DB
- Call AI with prompt
- Use `streamObject` from Vercel AI SDK (not `streamText`)
- Stream structured output matching FeedbackSchema
- Store final result in `session_feedback` table

**Key:** Use Vercel AI SDK's `streamObject` for structured streaming

**3.2.4 - Handle streaming on client**

Location: `/hooks/use-streaming-feedback.ts`

Task: Custom hook that consumes streaming feedback

**What you're learning:**
- Vercel AI SDK React hooks
- Streaming state management
- Partial object updates

**Implementation approach:**
- Use `useObject` hook from `ai/react`
- Pass Server Action
- Hook returns partial object as it streams
- Display partial results in real-time

### Phase 3.3: Review Page UI (2 hours)

**3.3.1 - Create review page**

Location: `/app/review/[sessionId]/page.tsx`

Task: Page showing session video + feedback side by side

**What you're learning:**
- Dynamic routes
- Video playback
- Complex layouts

**Layout:**
- Left: Video player (with controls)
- Right: Feedback panel

**3.3.2 - Create video playback component**

Location: `/components/features/feedback/video-playback.tsx`

Task: Video player for recorded session

**What you're learning:**
- Video element controls
- S3 video streaming
- Playback state

**Implementation:**
- HTML5 video element
- Source from S3 URL
- Built-in controls (for MVP)
- Show transcript below (optional)

**3.3.3 - Create feedback display component**

Location: `/components/features/feedback/feedback-panel.tsx`

Task: Display AI feedback with scores and suggestions

**What you're learning:**
- Data visualization
- Color-coded scores
- List rendering

**UI sections:**
- Score badges (green/yellow/red based on performance)
- Suggestions list (with priority indicators)
- Transcript analysis (words matched, points missed)

**3.3.4 - Integrate streaming feedback**

Task: Show feedback as it generates

**What you're learning:**
- Real-time UI updates
- Partial data rendering
- Loading states

**Implementation approach:**
- Use `use-streaming-feedback` hook
- Pass session ID
- Render partial feedback as it streams
- Show "Analyzing..." until complete
- Smooth transitions as sections fill in

**3.3.5 - Add session history**

Location: `/app/review/page.tsx`

Task: List all past sessions with thumbnails

**What you're learning:**
- List rendering
- Image optimization
- Navigation

**UI:**
- Grid of session cards
- Thumbnail + date + question
- Click to view full review
- Sort by recent

**Use Next.js Image for thumbnails**

### Phase 3.4: Polish & Error Handling (1.5 hours)

**3.4.1 - Add error boundaries**

Location: `/app/error.tsx` and feature-specific error boundaries

Task: Catch errors gracefully

**What you're learning:**
- Error boundaries
- Error recovery
- User-friendly error messages

**Add boundaries for:**
- Upload errors (show retry button)
- Recording errors (request camera again)
- Transcription errors (show manual transcript option)
- AI errors (retry generation)

**3.4.2 - Add loading states**

Task: Suspense boundaries and skeletons everywhere

**What you're learning:**
- Suspense boundaries
- Streaming UI
- Skeleton screens

**Use shadcn Skeleton component**

**3.4.3 - Add empty states**

Task: What shows when user has no data?

**What you're learning:**
- Zero data UX
- Call-to-action patterns

**Empty states needed:**
- No documents uploaded yet
- No STAR answers parsed yet
- No practice sessions yet

**3.4.4 - Test edge cases**

**Test scenarios:**
- Upload fails midway
- Camera permission denied
- Recording interrupted (tab closed)
- Transcription fails (audio unclear)
- AI returns invalid JSON
- Network drops during upload

**Fix critical issues, document others for Phase 2**

**3.4.5 - Add basic styling polish**

Task: Make it look professional

**What you're learning:**
- Responsive design
- Color consistency
- Spacing/typography

**Focus areas:**
- Consistent spacing (use Tailwind space scale)
- Color scheme (dark mode with teal accents per v0 design)
- Typography hierarchy
- Responsive breakpoints

---

## DAY 3 END: Testing & Documentation

### Final Testing Checklist

**End-to-end flow:**
1. ✅ Sign up with passkey
2. ✅ Upload document (text file)
3. ✅ See AI parse it (streaming)
4. ✅ See answers in dashboard
5. ✅ Navigate to practice
6. ✅ Select a question
7. ✅ Record video answer
8. ✅ See upload progress
9. ✅ See transcription happen
10. ✅ Navigate to review
11. ✅ See AI feedback streaming
12. ✅ View past sessions

**Performance check:**
- Upload a 2-minute video - should not freeze UI
- Parse a long document - should stream smoothly
- Generate feedback - should start showing results within 2s

**Browser testing:**
- Chrome (primary)
- Firefox (test MediaRecorder compat)
- Safari (test video codecs)

### Documentation Task

**3.4.6 - Document what you learned**

In your Notion or markdown file, write:

**Day 1:**
- What TypeScript patterns did you learn?
- What bugs did you hit with Zod validation?
- How does Zero's sync work?
- What was confusing about Server Actions?

**Day 2:**
- What was hardest about MediaRecorder API?
- How do Web Workers communicate?
- What did you learn about S3 presigned URLs?
- What retry logic bugs did you encounter?

**Day 3:**
- How does Whisper API work?
- What makes a good AI prompt?
- How does streaming structured output work?
- What edge cases did you find?

**General:**
- What would you architect differently?
- What took longer than expected?
- What was easier than expected?
- What are you proud of?

---

## Post-MVP Next Steps

**What's missing (to add in 6-day extension):**
- Performance optimizations (virtualization, lazy loading)
- AWS migration (RDS, direct S3)
- Progress tracking over time
- Advanced analytics
- Spaced repetition algorithm
- Session comparison
- Polish and animations

**But you now have:**
✅ Working MVP with all core features
✅ Advanced TypeScript patterns in practice
✅ React 19 features (useOptimistic, Server Actions)
✅ Streaming AI integration
✅ Video recording and processing
✅ Local-first architecture with Zero
✅ Real infrastructure (S3, Supabase)

---

## Troubleshooting Guide

**Common issues and solutions:**

**Problem:** Zero won't sync
- Check network tab for sync requests
- Verify schema matches Supabase tables
- Check auth token is passed correctly

**Problem:** MediaRecorder not supported
- Check supported types with `MediaRecorder.isTypeSupported()`
- Fallback to webm/vp8
- Safari needs different codecs

**Problem:** S3 upload fails with CORS error
- Check bucket CORS configuration
- Verify presigned URL is correct
- Check URL hasn't expired

**Problem:** Whisper API fails
- Check audio file size (25MB limit)
- Verify audio format (needs audio track)
- Check API key is valid

**Problem:** AI returns invalid JSON
- Use `.safeParse()` not `.parse()`
- Extract JSON with regex (AI wraps in markdown)
- Have fallback for parse failures

**Problem:** Web Worker not loading
- Check Next.js config for worker support
- Verify worker path is correct
- Check browser console for errors

**Problem:** Upload progress not showing
- XMLHttpRequest needed (not fetch)
- Check `upload.onprogress` listener
- Verify progress callback is called

---

## You Did It!

After 3 days, you've built:
- A local-first app with real-time sync
- Video recording with Web Workers
- Streaming AI integration
- S3 file storage
- Audio transcription
- Complex TypeScript patterns
- React 19 features

**This is not a CRUD app.**

Now proceed to **GUIDE-6DAY-EXTENSION.md** to level it up even more.

---

END OF 3-DAY MVP GUIDE
