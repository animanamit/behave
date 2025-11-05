# 6-Day Extension Guide - Advanced Features & AWS Migration

**Prerequisites:** You've completed the 3-day MVP from `GUIDE-3DAY-MVP.md`

**What you have now:**
- Working document upload + AI parsing
- Video recording with Web Workers
- Audio transcription + AI feedback
- Local-first sync with Zero
- Supabase for database + storage (S3 via Supabase)

**What you'll add in 6 days:**
- Performance optimizations (virtualization, lazy loading, infinite scroll)
- AWS infrastructure migration (RDS, direct S3)
- Progress tracking and analytics
- Advanced features (spaced repetition, session comparison)
- Production polish

---

## DAY 4: Performance Engineering - Part 1 (8 hours)

**Goal:** Optimize list rendering, add virtualization, implement lazy loading for images/videos.

### Phase 4.1: Virtualized Lists (2 hours)

**4.1.1 - Install TanStack Virtual**

Run: `npm install @tanstack/react-virtual`

**What you're learning:**
- Virtualization concepts
- Window-based rendering
- Performance profiling

**4.1.2 - Analyze current performance**

Task: Profile your STAR answers list with 50+ items

**What you're learning:**
- React DevTools Profiler
- Performance bottlenecks
- Render counts

**Steps:**
- Open React DevTools
- Go to Profiler tab
- Record while scrolling through answers list
- Note render times, component renders

**Question to answer:**
How many list items are rendered? (Should be ALL of them currently - wasteful!)

**4.1.3 - Create virtualized answer list**

Location: `/components/features/document-upload/virtualized-answer-list.tsx`

Task: Replace regular list with virtualized list

**What you're learning:**
- TanStack Virtual API
- Virtual item positioning
- Estimated item sizes

**Implementation approach:**
- Create parent ref (scroll container)
- Initialize virtualizer with `useVirtualizer`
- Set `count` to total answers
- Set `estimateSize` to average item height (estimate 150px)
- Set `overscan` to 5 (render 5 extra items off-screen)
- Get virtual items with `virtualizer.getVirtualItems()`
- Render only visible items with absolute positioning

**Key concepts:**
- Parent must have fixed height (e.g., `h-[600px]`)
- Items positioned absolutely within total height
- Only visible items in DOM
- Smooth scrolling with overscan

**4.1.4 - Add dynamic item sizing**

Task: Handle variable height items (some answers are longer)

**What you're learning:**
- Dynamic sizing in virtualizers
- `measureElement` API
- Layout recalculation

**Implementation approach:**
- Use `useVirtualizer` with `getScrollElement`
- Add `measureElement` ref to each item
- Virtualizer measures actual height after render
- Updates scroll positions accordingly

**Common pitfall:**
Don't set `estimateSize` too far from actual - causes scroll jumping.

**4.1.5 - Test virtualization performance**

Task: Re-profile with virtualization enabled

**What you're learning:**
- Performance measurement
- Before/after comparison

**Expected results:**
- DOM nodes: 50+ → ~10-15 (only visible)
- Scroll FPS: Should be 60fps
- Initial render time: Faster

**4.1.6 - Virtualize practice sessions list**

Location: `/app/review/page.tsx` (update)

Task: Apply same virtualization to sessions list

**Why this matters:**
User might have 100+ practice sessions over time. Rendering all would be slow.

### Phase 4.2: Infinite Scroll with React Query (2 hours)

**4.2.1 - Set up React Query**

Location: `/lib/query/client.ts`

Task: Create React Query client with configuration

**What you're learning:**
- React Query setup
- Query client configuration
- Stale time, cache time settings

**Configuration to set:**
- `defaultOptions.queries.staleTime`: 5 minutes (data stays fresh)
- `defaultOptions.queries.cacheTime`: 30 minutes
- `defaultOptions.queries.refetchOnWindowFocus`: false (for better UX)

**4.2.2 - Create query provider**

Location: `/components/providers/query-provider.tsx`

Task: Wrap app with QueryClientProvider

**What you're learning:**
- Provider composition
- Client-side query state

**4.2.3 - Create infinite query for sessions**

Location: `/hooks/use-infinite-sessions.ts`

Task: Infinite query that loads sessions in pages

**What you're learning:**
- `useInfiniteQuery` hook
- Pagination patterns
- Cursor-based vs offset-based pagination

**Implementation approach:**
- Use `useInfiniteQuery` from React Query
- `queryKey`: `['sessions', userId]`
- `queryFn`: Fetch sessions with offset/limit
- `getNextPageParam`: Return next offset if more data exists
- `initialPageParam`: 0

**Query function:**
```typescript
async ({ pageParam = 0 }) => {
  // Fetch from Supabase with offset
  const { data } = await supabase
    .from('practice_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .range(pageParam, pageParam + 19) // 20 items per page

  return {
    sessions: data,
    nextOffset: data.length === 20 ? pageParam + 20 : undefined
  }
}
```

**4.2.4 - Implement intersection observer for auto-load**

Location: Same hook, add observer

Task: Load next page when user scrolls to bottom

**What you're learning:**
- Intersection Observer API
- Automatic pagination
- Ref callbacks

**Implementation approach:**
- Create ref for "load more" sentinel element
- Use `useEffect` to set up IntersectionObserver
- When sentinel is visible, call `fetchNextPage()`
- Clean up observer on unmount

**Pattern:**
```typescript
const loadMoreRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    { threshold: 1.0 }
  )

  if (loadMoreRef.current) {
    observer.observe(loadMoreRef.current)
  }

  return () => observer.disconnect()
}, [hasNextPage, isFetchingNextPage, fetchNextPage])
```

**4.2.5 - Combine virtualization + infinite scroll**

Task: Virtualize the infinitely scrolling list

**What you're learning:**
- Combining advanced patterns
- Flattening paginated data

**Implementation approach:**
- Flatten pages: `data.pages.flatMap(page => page.sessions)`
- Pass flattened array to virtualizer
- Virtualizer handles rendering
- Infinite query handles data fetching

**This is production-grade list handling!**

### Phase 4.3: Lazy Loading Images & Videos (2 hours)

**4.3.1 - Optimize thumbnail loading**

Location: `/components/features/feedback/session-card.tsx`

Task: Lazy load session thumbnails

**What you're learning:**
- Native lazy loading
- Next.js Image component
- Image optimization

**Implementation approach:**
- Use Next.js `<Image>` component (not `<img>`)
- Set `loading="lazy"`
- Set `placeholder="blur"` with base64 blur
- Configure sizes based on viewport

**Next.js Image benefits:**
- Automatic WebP conversion
- Responsive images
- Built-in lazy loading
- Blur-up placeholder

**4.3.2 - Generate blur placeholders**

Location: `/workers/video-processor.ts` (update)

Task: Generate tiny blur placeholder along with thumbnail

**What you're learning:**
- Low-quality image placeholders (LQIP)
- Base64 encoding
- Canvas downsampling

**Implementation approach:**
- When generating thumbnail, also create 20x20 version
- Convert to base64
- Store in database alongside thumbnail URL
- Use as blur placeholder in Image component

**4.3.3 - Implement video hover previews**

Location: `/components/features/feedback/session-card.tsx` (update)

Task: Show video preview on hover (like Netflix/porn sites)

**What you're learning:**
- Video preloading strategies
- Hover interactions
- Smooth transitions

**Implementation approach:**
- Show thumbnail by default
- On `mouseEnter`: Load video with `preload="metadata"`
- After video loads: Swap thumbnail for video
- On `mouseLeave`: Swap back to thumbnail
- Use CSS transitions for smooth fade

**Pattern:**
```typescript
const [isHovering, setIsHovering] = useState(false)
const videoRef = useRef<HTMLVideoElement>(null)

const handleMouseEnter = () => {
  setIsHovering(true)
  if (videoRef.current) {
    videoRef.current.load()
    videoRef.current.play().catch(() => {}) // Ignore errors
  }
}

const handleMouseLeave = () => {
  setIsHovering(false)
  if (videoRef.current) {
    videoRef.current.pause()
    videoRef.current.currentTime = 0
  }
}
```

**CSS transitions:**
- Crossfade between thumbnail and video
- Smooth scale on hover
- Duration: 200ms

**4.3.4 - Add loading skeletons**

Location: `/components/ui/skeletons/session-skeleton.tsx`

Task: Create skeleton components for loading states

**What you're learning:**
- Skeleton UI patterns
- Progressive loading
- Shimmer animations

**Implementation approach:**
- Use shadcn Skeleton component
- Match layout of actual content
- Add shimmer animation
- Show while data loading

**Skeletons needed:**
- Session card skeleton
- Answer card skeleton
- Feedback panel skeleton

**4.3.5 - Test performance improvements**

Task: Profile and measure

**Metrics to check:**
- Lighthouse score (Performance)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)

**Expected improvements:**
- LCP: Should decrease (lazy loading)
- Network requests: Should decrease (only visible images)
- Memory usage: Should decrease (virtualization)

---

## DAY 5: Performance Engineering - Part 2 (8 hours)

**Goal:** Optimize video handling, add background sync, implement caching strategies.

### Phase 5.1: Video Optimization (3 hours)

**5.1.1 - Implement video compression in worker**

Location: `/workers/video-processor.ts` (update)

Task: Compress video before upload

**What you're learning:**
- Video encoding in browser
- MediaRecorder quality settings
- Bitrate optimization

**Implementation approach:**
- When creating MediaRecorder, set `videoBitsPerSecond`
- Recommended: 2.5 Mbps for 720p (2500000)
- Lower quality but smaller files
- Faster uploads

**Trade-off analysis:**
- Quality vs file size vs upload time
- For interview practice, 720p @ 2.5Mbps is fine
- Full HD not necessary

**5.1.2 - Add video format conversion**

Task: Convert to most compatible format

**What you're learning:**
- Video codecs (H.264, VP8, VP9)
- Browser compatibility
- Fallback strategies

**Implementation approach:**
- Check supported types: `MediaRecorder.isTypeSupported()`
- Priority: VP8 (most compatible) → VP9 (better compression) → H.264 (Safari)
- Store codec used in database
- Handle playback accordingly

**5.1.3 - Implement progressive upload**

Location: `/lib/storage/upload.ts` (update)

Task: Upload video chunks as they're recorded (don't wait for full video)

**What you're learning:**
- Streaming uploads
- S3 multipart upload
- Progressive feedback

**This is ADVANCED - skip if running out of time, but impressive if you nail it.**

**Implementation approach:**
- Use S3 multipart upload API
- Upload each MediaRecorder chunk as it comes
- Show progress as chunks upload
- Complete multipart when recording stops

**Benefits:**
- Faster perceived performance
- Can start transcription before full upload
- Better UX

**5.1.4 - Add upload queue with retry**

Location: `/lib/storage/upload-queue.ts`

Task: Queue multiple uploads, handle failures gracefully

**What you're learning:**
- Queue data structure
- Background processing
- Error recovery

**Implementation approach:**
- Create upload queue class
- Add uploads to queue
- Process queue in background
- Retry failed uploads
- Persist queue to IndexedDB (survive page refresh)

**Queue state machine:**
- Pending → Uploading → Complete
- Pending → Uploading → Failed → Retrying → ...
- Failed (after max retries) → Requires manual retry

**5.1.5 - Add video preview generation**

Location: `/workers/video-processor.ts` (update)

Task: Generate multiple preview frames (not just one thumbnail)

**What you're learning:**
- Sprite sheets
- Multiple frame extraction
- Efficient preview generation

**Implementation approach:**
- Extract frames at: 0s, 25%, 50%, 75%, 100%
- Create sprite sheet (5 frames in one image)
- Use for scrubbing preview (hover shows different frames)

**This makes your app feel like a real video platform!**

### Phase 5.2: Caching Strategies (2 hours)

**5.2.1 - Implement React Query caching for API responses**

Location: `/hooks/use-star-answers.ts` (update)

Task: Add smart caching with React Query

**What you're learning:**
- Cache invalidation
- Stale-while-revalidate
- Optimistic updates with cache

**Implementation approach:**
- Wrap Zero queries with React Query
- Set appropriate `staleTime` (data considered fresh)
- Set `cacheTime` (data kept in memory)
- Invalidate cache on mutations

**Cache times to set:**
- STAR answers: `staleTime: 10 minutes` (rarely change)
- Sessions: `staleTime: 1 minute` (change more often)
- Feedback: `staleTime: Infinity` (never changes after creation)

**5.2.2 - Add service worker for video caching**

Location: `/public/sw.js`

Task: Cache videos for offline playback

**What you're learning:**
- Service Workers
- Cache API
- Offline-first patterns

**This is ADVANCED - only if you want to go deep on PWA patterns.**

**Implementation approach:**
- Register service worker
- Intercept video fetch requests
- Cache videos after first load
- Serve from cache on repeat views
- Clear old videos (LRU eviction)

**Skip this if you're not interested in PWA, but it's very impressive if you do it.**

**5.2.3 - Implement request deduplication**

Location: `/lib/query/client.ts` (update)

Task: Prevent duplicate API calls

**What you're learning:**
- Request deduplication
- React Query's built-in dedup
- Network optimization

**What React Query already does:**
- If same query called multiple times, only one request
- If query is fresh, return from cache

**What you add:**
- Global request deduplication across tabs (use BroadcastChannel)
- Share cache between tabs

**5.2.4 - Add prefetching**

Task: Prefetch data before user needs it

**What you're learning:**
- Prefetching strategies
- Predictive loading
- User intent detection

**Implementation approach:**
- On session list: Prefetch video on hover
- On practice page: Prefetch next question
- On dashboard: Prefetch recent sessions

**React Query prefetching:**
```typescript
const queryClient = useQueryClient()

const handleSessionHover = (sessionId: string) => {
  queryClient.prefetchQuery({
    queryKey: ['session', sessionId],
    queryFn: () => fetchSession(sessionId)
  })
}
```

### Phase 5.3: Background Sync (2 hours)

**5.3.1 - Implement background upload completion**

Location: `/hooks/use-background-sync.ts`

Task: Continue uploads even if user leaves page

**What you're learning:**
- Background Sync API
- Persistence across page reloads
- Queue management

**Implementation approach:**
- Store upload state in IndexedDB
- On page load, check for pending uploads
- Resume uploads
- Show notification when complete

**5.3.2 - Add offline queue for mutations**

Task: Queue writes when offline, sync when back online

**What you're learning:**
- Offline-first patterns
- Mutation queuing
- Network state detection

**Implementation approach:**
- Detect online/offline state
- If offline, queue mutations in IndexedDB
- When back online, flush queue
- Handle conflicts

**Zero already does this! But you can extend it.**

**5.3.3 - Add sync status indicator**

Location: `/components/ui/sync-status.tsx`

Task: Show user when data is syncing

**What you're learning:**
- Real-time status indicators
- User feedback
- Network awareness

**UI should show:**
- "Synced" (green) - all data saved
- "Syncing..." (yellow) - upload in progress
- "Offline" (gray) - no connection
- "Error" (red) - sync failed

**5.3.4 - Test offline behavior**

Task: Verify app works offline

**Test scenarios:**
- Go offline while uploading
- Go offline while parsing
- Create session offline, come back online
- Network drops mid-upload

**Expected behavior:**
- No data loss
- Graceful degradation
- Clear user feedback
- Automatic retry when online

---

## DAY 6: AWS Migration - Infrastructure (8 hours)

**Goal:** Migrate from Supabase to AWS (RDS for database, direct S3 for storage)

### Phase 6.1: AWS RDS Setup (2 hours)

**6.1.1 - Create RDS Postgres instance**

In AWS Console:
- Go to RDS
- Create database
- Engine: PostgreSQL (same version as Supabase, probably 15.x)
- Template: Free tier (for dev) or Production (for real deployment)
- DB instance identifier: `behave-db`
- Master username: `behaveadmin`
- Master password: Generate secure password
- VPC: Default (or create new)
- Public access: Yes (for now - restrict later)
- Database name: `behave`

**What you're learning:**
- RDS configuration
- VPC networking basics
- Database accessibility

**6.1.2 - Configure security group**

Task: Allow connections to RDS

**What you're learning:**
- Security groups
- Inbound rules
- IP whitelisting

**Configuration:**
- Create security group: `behave-db-sg`
- Inbound rule: PostgreSQL (5432)
- Source: Your IP (for dev) + Vercel IPs (for production)
- Outbound: All traffic (default)

**For production:**
- Restrict to application server IPs only
- No public access
- Use VPC peering or bastion host

**6.1.3 - Connect to RDS with psql**

Task: Verify connection works

**What you're learning:**
- PostgreSQL client tools
- Connection strings
- Database authentication

**Command:**
```bash
psql -h behave-db.xxxxx.us-east-1.rds.amazonaws.com -U behaveadmin -d behave
```

**If connection fails:**
- Check security group rules
- Check RDS is publicly accessible
- Check password is correct

**6.1.4 - Run schema migration**

Task: Create all tables in RDS

**What you're learning:**
- Database migrations
- Schema transfer
- SQL dump/restore

**Option 1: Manual migration**
- Copy SQL from Supabase SQL editor
- Run in RDS

**Option 2: Use migration tool**
- Export from Supabase: `pg_dump`
- Import to RDS: `psql < dump.sql`

**Schema to create:**
- All tables from GUIDE-ARCHITECTURE.md
- All indexes
- All foreign keys
- RLS policies (if RDS supports, otherwise handle in app)

**6.1.5 - Update database connection**

Location: `/lib/db/client.ts` (update)

Task: Point to RDS instead of Supabase

**What you're learning:**
- Environment-based configuration
- Connection pooling
- Postgres clients (pg vs Supabase client)

**Implementation approach:**
- Install `pg` package: `npm install pg`
- Create connection pool
- Update all queries to use `pg` instead of Supabase client
- Environment variable: `DATABASE_URL`

**Connection string format:**
```
postgresql://behaveadmin:password@behave-db.xxxxx.us-east-1.rds.amazonaws.com:5432/behave
```

**6.1.6 - Add connection pooling**

Task: Use PgBouncer or connection pooler

**What you're learning:**
- Connection pooling
- Database performance
- Resource management

**Options:**
- AWS RDS Proxy (managed, costs money)
- Supabase Pooler (if keeping Supabase for other features)
- PgBouncer (self-hosted)

**For MVP, skip this. Come back later for production.**

### Phase 6.2: Direct S3 Integration (2 hours)

**You already have S3, but you might be using it through Supabase Storage. Now go direct.**

**6.2.1 - Update S3 client configuration**

Location: `/lib/storage/s3-client.ts` (update)

Task: Remove Supabase layer, use AWS SDK directly

**What you're learning:**
- Direct AWS SDK usage
- No abstraction layer
- Fine-grained control

**Already done if you followed Day 2 guide! If not, do it now.**

**6.2.2 - Implement S3 bucket lifecycle policies**

In AWS Console → S3 → Lifecycle:

Task: Auto-delete old videos to save costs

**What you're learning:**
- Lifecycle policies
- Cost optimization
- Data retention

**Policy to create:**
- Transition to S3 Glacier after 90 days (cheaper storage)
- Delete after 1 year (or keep forever, your choice)

**6.2.3 - Add CloudFront CDN**

In AWS Console → CloudFront:

Task: Add CDN for faster video delivery

**What you're learning:**
- Content Delivery Networks
- Edge caching
- Global distribution

**Configuration:**
- Origin: Your S3 bucket
- Origin Access Identity: Create new (restrict direct S3 access)
- Cache behavior: Cache videos for 1 year
- Price class: Use only North America + Europe (cheaper)

**Update video URLs:**
- From: `https://s3.amazonaws.com/bucket/key`
- To: `https://d123456.cloudfront.net/key`

**Why CloudFront:**
- Faster delivery (edge locations)
- Lower bandwidth costs
- Better user experience globally

**6.2.4 - Implement signed URLs for CloudFront**

Location: `/lib/storage/presigned-urls.ts` (update)

Task: Generate CloudFront signed URLs instead of S3 presigned URLs

**What you're learning:**
- CloudFront signed URLs
- URL expiration
- Access control

**CloudFront signed URLs are more secure than S3 presigned for public content.**

### Phase 6.3: Better Auth with RDS (1 hour)

**6.3.1 - Update Better Auth database connection**

Location: `/lib/auth/better-auth.ts` (update)

Task: Point Better Auth to RDS instead of Supabase

**What you're learning:**
- Auth database migration
- Session management
- User data migration

**Implementation approach:**
- Better Auth supports any Postgres database
- Update connection string in config
- Run Better Auth migrations on RDS
- Migrate existing users (export from Supabase, import to RDS)

**6.3.2 - Migrate user data**

Task: Move existing users from Supabase to RDS

**What you're learning:**
- Data migration scripts
- User account handling
- Password hash transfer

**Script to write:**
- Export users from Supabase
- Import to RDS Better Auth tables
- Preserve user IDs (foreign key integrity)
- Test login works

### Phase 6.4: Environment Configuration (1 hour)

**6.4.1 - Set up environment-based configs**

Location: `/lib/config/environments.ts`

Task: Different configs for dev/staging/production

**What you're learning:**
- Environment management
- Configuration patterns
- Secrets management

**Environments:**
- **Development:** Local Postgres, local S3 (LocalStack)
- **Staging:** RDS, S3, CloudFront (but separate from prod)
- **Production:** Production RDS, S3, CloudFront

**6.4.2 - Update environment variables**

Update `.env.local` (dev) and Vercel env vars (production):

```
# Database
DATABASE_URL=postgresql://...  # RDS connection string

# Storage
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=behave-videos
CLOUDFRONT_DOMAIN=d123456.cloudfront.net
CLOUDFRONT_KEY_PAIR_ID=...
CLOUDFRONT_PRIVATE_KEY=...

# Auth (same as before)
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://yourdomain.com
```

**6.4.3 - Add secret rotation**

Task: Set up AWS Secrets Manager for credentials

**What you're learning:**
- Secret management
- Credential rotation
- Security best practices

**This is ADVANCED - skip for MVP, but important for production.**

**Implementation approach:**
- Store DB password in AWS Secrets Manager
- Store S3 keys in Secrets Manager
- App reads from Secrets Manager at runtime
- Rotate secrets automatically

### Phase 6.5: Test Migration (1 hour)

**6.5.1 - End-to-end test with new infrastructure**

**Test flow:**
1. Sign up (Better Auth → RDS)
2. Upload document (read from S3)
3. Parse with AI (save to RDS)
4. Record video (upload to S3 directly)
5. Generate thumbnail (upload to S3)
6. Transcribe (download from S3, call Whisper)
7. Generate feedback (save to RDS)
8. View session (video from CloudFront)

**All should work with AWS infrastructure!**

**6.5.2 - Compare performance: Supabase vs AWS**

**Metrics to compare:**
- Database query latency
- Video upload speed
- Video playback speed (CloudFront vs direct S3)
- Total costs (estimate)

**Expected results:**
- RDS: Similar latency to Supabase (if same region)
- S3 direct: Slightly faster upload (no Supabase proxy)
- CloudFront: Much faster video playback (CDN)
- Costs: Possibly higher (RDS), but more control

**6.5.3 - Document infrastructure**

Task: Create architecture diagram

**What you're learning:**
- System architecture
- Infrastructure documentation
- Visual communication

**Diagram should show:**
- Client (browser)
- Next.js app (Vercel)
- RDS Postgres
- S3 bucket
- CloudFront CDN
- External APIs (OpenRouter, Whisper)
- Data flow arrows

**Tools:**
- draw.io
- Excalidraw
- Lucidchart

**This diagram goes in your README and you show it in interviews!**

---

## DAY 7: AWS Deep Dive (8 hours)

**Goal:** Add production-grade AWS features, understand cloud architecture deeply.

### Phase 7.1: Infrastructure as Code (3 hours)

**7.1.1 - Set up AWS CDK**

Install: `npm install -g aws-cdk`

Task: Define infrastructure as code

**What you're learning:**
- Infrastructure as Code (IaC)
- AWS CDK (TypeScript!)
- Reproducible deployments

**Why IaC:**
- Version control your infrastructure
- Recreate environment easily
- No manual clicking in AWS Console

**7.1.2 - Create CDK stack**

Location: `/infrastructure/lib/behave-stack.ts`

Task: Define all AWS resources in code

**What you're learning:**
- CDK constructs
- Resource dependencies
- Stack outputs

**Resources to define:**
- RDS Postgres instance
- S3 bucket
- CloudFront distribution
- IAM roles and policies
- Security groups
- Secrets Manager secrets

**7.1.3 - Deploy with CDK**

Command: `cdk deploy`

Task: Deploy entire infrastructure with one command

**What you're learning:**
- CloudFormation (behind CDK)
- Stack management
- Deployment automation

**Benefits:**
- Can destroy and recreate environment
- Can create staging environment
- Can share infrastructure with team

**7.1.4 - Add monitoring with CDK**

Task: Set up CloudWatch alarms in CDK

**What you're learning:**
- Monitoring setup
- Alerting
- Observability

**Alarms to create:**
- RDS CPU > 80%
- RDS storage > 80%
- S3 bucket size > 100GB
- CloudFront 4xx/5xx errors > threshold

### Phase 7.2: Database Optimization (2 hours)

**7.2.1 - Add database indexes**

Task: Analyze slow queries, add indexes

**What you're learning:**
- Query optimization
- Index strategy
- EXPLAIN ANALYZE

**Indexes to add:**
- `user_id` on all tables (already have, but verify)
- `recorded_at DESC` on practice_sessions
- Composite index: `(user_id, recorded_at DESC)` on practice_sessions
- `document_id` on star_answers

**How to decide:**
- Run EXPLAIN ANALYZE on slow queries
- Look for sequential scans (bad!)
- Add indexes to turn into index scans (good!)

**7.2.2 - Set up connection pooling with RDS Proxy**

Task: Add RDS Proxy for better connection management

**What you're learning:**
- Connection pooling
- RDS Proxy
- Serverless-friendly databases

**Why RDS Proxy:**
- Serverless functions open many connections
- RDS Proxy pools them
- Prevents "too many connections" errors

**Configuration:**
- Create RDS Proxy in AWS Console
- Point to your RDS instance
- Update DATABASE_URL to proxy endpoint

**7.2.3 - Implement read replicas**

Task: Add read replica for analytics queries

**What you're learning:**
- Read replicas
- Read/write split
- Scaling databases

**This is ADVANCED - only if you're going deep on database scaling.**

**Configuration:**
- Create read replica in RDS
- Route heavy read queries to replica
- Keep writes on primary

**Use case:**
- Analytics queries (progress over time)
- Generating reports
- Don't slow down main database

### Phase 7.3: Cost Optimization (2 hours)

**7.3.1 - Implement S3 Intelligent Tiering**

Task: Automatically move old videos to cheaper storage

**What you're learning:**
- S3 storage classes
- Cost optimization
- Data lifecycle

**Storage tiers:**
- Frequent access (default, most expensive)
- Infrequent access (cheaper, slower retrieval)
- Glacier (very cheap, slow retrieval)

**Policy:**
- Videos older than 30 days → Infrequent Access
- Videos older than 90 days → Glacier
- Delete after 1 year (or keep forever)

**7.3.2 - Add CloudFront caching**

Task: Optimize cache behavior for costs

**What you're learning:**
- Cache-Control headers
- Origin request reduction
- Bandwidth savings

**Cache settings:**
- Videos: Cache for 1 year (immutable)
- Thumbnails: Cache for 1 year
- API responses: Don't cache (or very short)

**7.3.3 - Monitor costs with Cost Explorer**

Task: Set up cost tracking and budgets

**What you're learning:**
- AWS billing
- Cost allocation tags
- Budget alerts

**Budgets to create:**
- Monthly budget: $50 (or whatever you're comfortable with)
- Alert at 80% of budget
- Alert at 100% of budget

**Cost allocation tags:**
- Environment: production / staging / dev
- Service: rds / s3 / cloudfront
- Project: behave

**7.3.4 - Calculate cost per user**

Task: Estimate costs at scale

**What you're learning:**
- Cost modeling
- Unit economics
- Scaling estimates

**Calculation:**
- Per user per month:
  - Storage: X sessions × Y MB × $0.023/GB
  - Database: Shared cost / # users
  - Bandwidth: Z GB × $0.085/GB
  - Total: ~$X/user/month

**This is important for interviews - shows business thinking!**

### Phase 7.4: Security Hardening (1 hour)

**7.4.1 - Implement least privilege IAM**

Task: Restrict IAM permissions to minimum needed

**What you're learning:**
- IAM policies
- Least privilege principle
- Security best practices

**Current:** `AmazonS3FullAccess` (too permissive!)

**Better policy:**
```json
{
  "Effect": "Allow",
  "Action": [
    "s3:PutObject",
    "s3:GetObject",
    "s3:DeleteObject"
  ],
  "Resource": "arn:aws:s3:::behave-videos/*"
}
```

**7.4.2 - Enable S3 bucket encryption**

Task: Encrypt all objects at rest

**What you're learning:**
- Encryption at rest
- KMS keys
- Data protection

**Configuration:**
- Default encryption: AES-256 (SSE-S3)
- Or use KMS (more control, more cost)

**7.4.3 - Add VPC for RDS**

Task: Move RDS to private subnet

**What you're learning:**
- VPC networking
- Public vs private subnets
- Bastion hosts

**This is ADVANCED - for production, not MVP.**

**Configuration:**
- Create VPC with public and private subnets
- Move RDS to private subnet (no public IP)
- Access via bastion host or VPN
- App server in public subnet can still access RDS

---

## DAY 8: Advanced Features (8 hours)

**Goal:** Add progress tracking, analytics, spaced repetition, session comparison.

### Phase 8.1: Progress Tracking (3 hours)

**8.1.1 - Create progress analytics table**

SQL schema:
```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  sessions_completed INT DEFAULT 0,
  avg_content_fidelity DECIMAL,
  avg_confidence DECIMAL,
  total_practice_time INT, -- seconds
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

**What you're learning:**
- Aggregation tables
- Time-series data
- Analytics schema design

**8.1.2 - Create aggregation job**

Location: `/lib/jobs/aggregate-progress.ts`

Task: Daily job to calculate progress metrics

**What you're learning:**
- Data aggregation
- SQL analytics queries
- Job scheduling

**Query to write:**
```sql
INSERT INTO user_progress (user_id, date, sessions_completed, avg_content_fidelity, ...)
SELECT
  user_id,
  DATE(recorded_at) as date,
  COUNT(*) as sessions_completed,
  AVG(feedback.content_fidelity_score) as avg_content_fidelity,
  ...
FROM practice_sessions
JOIN session_feedback ON ...
WHERE recorded_at >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY user_id, DATE(recorded_at);
```

**For MVP:** Run manually or on page load. For production: Use cron job or AWS Lambda scheduled event.

**8.1.3 - Create progress dashboard page**

Location: `/app/progress/page.tsx`

Task: Visualize progress over time

**What you're learning:**
- Data visualization
- Chart libraries (Recharts)
- Dashboard design

**Install Recharts:** `npm install recharts` (already in your package.json)

**Charts to create:**
1. **Line chart:** Content fidelity score over time
2. **Line chart:** Confidence level over time
3. **Bar chart:** Sessions per week
4. **Area chart:** Total practice time (cumulative)

**8.1.4 - Add streak tracking**

Task: Calculate current streak (days practiced in a row)

**What you're learning:**
- Streak algorithms
- Date manipulation
- Gamification patterns

**Algorithm:**
```typescript
function calculateStreak(progressData: ProgressDay[]) {
  // Sort by date descending
  // Start from today, count consecutive days
  // Break when gap > 1 day
  // Return count
}
```

**Display:**
- Current streak: "🔥 7 days"
- Longest streak: "🏆 21 days"
- Motivational message based on streak

**8.1.5 - Create improvement insights**

Task: AI-generated insights from progress data

**What you're learning:**
- AI for analytics
- Insight generation
- Personalization

**Implementation approach:**
- Query last 30 days of progress
- Send to AI with prompt: "Analyze this interview practice data and give 3 actionable insights"
- AI returns: Trends, strengths, areas for improvement
- Display on dashboard

**Example insights:**
- "Your confidence scores improved 20% this month - great work!"
- "You tend to miss key points in the 'Result' section - focus there"
- "You practice most on weekends - try 2 weekday sessions for consistency"

### Phase 8.2: Spaced Repetition (2 hours)

**8.2.1 - Implement SM-2 algorithm**

Location: `/lib/algorithms/spaced-repetition.ts`

Task: Calculate when to review each STAR answer

**What you're learning:**
- Spaced repetition algorithms
- Memory science
- Scheduling algorithms

**SM-2 algorithm (simplified):**
- After each practice, user rates difficulty (1-5)
- Algorithm calculates next review date
- Easy questions: Review in 7+ days
- Hard questions: Review tomorrow

**8.2.2 - Add review scheduling to database**

Update `star_answers` table:
```sql
ALTER TABLE star_answers ADD COLUMN next_review_date DATE;
ALTER TABLE star_answers ADD COLUMN repetition_count INT DEFAULT 0;
ALTER TABLE star_answers ADD COLUMN easiness_factor DECIMAL DEFAULT 2.5;
```

**8.2.3 - Create "Practice Today" queue**

Location: `/app/practice/page.tsx` (update)

Task: Show questions due for review today

**What you're learning:**
- Queue management
- Prioritization algorithms
- User-centric design

**Query:**
```sql
SELECT * FROM star_answers
WHERE user_id = ?
  AND (next_review_date <= CURRENT_DATE OR next_review_date IS NULL)
ORDER BY next_review_date ASC
LIMIT 5;
```

**UI:**
- "5 questions due for practice today"
- Show them in priority order
- After practicing, update next_review_date

**8.2.4 - Add difficulty rating after practice**

Task: After each session, ask "How difficult was this?"

**What you're learning:**
- Feedback collection
- Algorithm input
- UX for learning

**UI:**
- After viewing feedback, show: "Rate difficulty: 😰 Hard | 😐 Medium | 😊 Easy"
- Update SM-2 algorithm with rating
- Calculate next review date

### Phase 8.3: Session Comparison (2 hours)

**8.3.1 - Create comparison page**

Location: `/app/compare/page.tsx`

Task: Side-by-side comparison of 2+ sessions

**What you're learning:**
- Multi-video playback
- Comparison UX
- Data presentation

**UI layout:**
- Select 2-3 sessions for same question
- Show videos side-by-side
- Synchronized playback (play all at once)
- Show feedback scores below each

**8.3.2 - Add synchronized video playback**

Task: Play multiple videos in sync

**What you're learning:**
- Video synchronization
- Media element control
- Complex interactions

**Implementation approach:**
- Create array of video refs
- On play, play all videos
- On pause, pause all videos
- On seek, seek all videos to same position

**8.3.3 - Create comparison metrics**

Task: Show improvement between sessions

**What you're learning:**
- Diff calculation
- Progress visualization
- Comparative analytics

**Metrics to show:**
- Content fidelity: 6/10 → 8/10 (+2) ✅
- Pacing: Too fast → Perfect ✅
- Confidence: Medium → High ✅
- Words matched: 120/200 → 180/200 (+60) ✅

**8.3.4 - Add transcript diff view**

Task: Show word-by-word comparison of transcripts

**What you're learning:**
- Text diff algorithms
- Visual diff presentation
- Detail-oriented UX

**Implementation approach:**
- Use diff library (e.g., `diff` npm package)
- Highlight additions (green), deletions (red), unchanged (gray)
- Show side-by-side or unified view

**This is very impressive for interviews!**

### Phase 8.4: Analytics Dashboard (1 hour)

**8.4.1 - Create admin analytics page**

Location: `/app/analytics/page.tsx`

Task: Overall statistics and insights

**What you're learning:**
- Analytics dashboards
- Data aggregation
- Business intelligence basics

**Metrics to show:**
- Total sessions: 47
- Total practice time: 3h 24m
- Most practiced competency: Leadership (12 sessions)
- Weakest competency: Conflict Resolution (avg score: 6.2)
- Best time of day: 2-4pm (avg score: 8.1)
- Questions needing review: 8

**8.4.2 - Add export functionality**

Task: Export all data as JSON/CSV

**What you're learning:**
- Data export
- File generation
- User data portability

**Formats to support:**
- JSON: All data, structured
- CSV: Sessions with scores (for Excel analysis)

**Button:** "Export My Data" → Downloads zip file

---

## DAY 9: Production Polish (8 hours)

**Goal:** Final polish, animations, documentation, deployment.

### Phase 9.1: UI Polish & Animations (3 hours)

**9.1.1 - Add React 19 View Transitions**

Task: Smooth transitions between pages

**What you're learning:**
- View Transitions API
- React 19 integration
- Smooth animations

**Implementation approach:**
- Enable view transitions in Next.js
- Add `viewTransitionName` to shared elements
- Videos transition smoothly from thumbnail to fullscreen
- Page transitions fade smoothly

**9.1.2 - Add micro-interactions**

Task: Button hover effects, loading animations, success states

**What you're learning:**
- Animation principles
- User feedback
- Polished UX

**Interactions to add:**
- Buttons: Scale on hover, press animation
- Upload: Drag-over highlight, drop animation
- Recording: Pulse effect on record button
- Success: Checkmark animation, confetti (optional!)

**9.1.3 - Implement skeleton screens everywhere**

Task: Replace spinners with content-aware skeletons

**What you're learning:**
- Progressive loading
- Skeleton UI best practices
- Perceived performance

**Skeletons for:**
- Answer cards
- Session cards
- Video player
- Feedback panel
- Charts

**9.1.4 - Add empty states with illustrations**

Task: Make empty states delightful

**What you're learning:**
- Zero-state design
- User onboarding
- Emotional design

**Empty states:**
- No answers: "Upload your first document to get started! 📄"
- No sessions: "Record your first practice session! 🎥"
- No progress: "Complete 3 sessions to unlock progress tracking 📊"

**Use illustrations:** undraw.co or similar

**9.1.5 - Add toast notifications**

Install: `npm install sonner` (already in package.json)

Task: User feedback for all actions

**What you're learning:**
- Toast notifications
- Non-blocking feedback
- Action confirmations

**Toasts for:**
- Upload success: "Document uploaded! Parsing..."
- Recording complete: "Session saved! ✅"
- Feedback ready: "Analysis complete!"
- Error: "Upload failed. Retrying..."

### Phase 9.2: Error Handling & Edge Cases (2 hours)

**9.2.1 - Add comprehensive error boundaries**

Task: Graceful error handling everywhere

**What you're learning:**
- Error boundary placement
- Error recovery strategies
- User-facing error messages

**Boundaries needed:**
- Root level (catch-all)
- Feature level (per major feature)
- Component level (complex components)

**9.2.2 - Handle all edge cases**

Task: Test and fix unusual scenarios

**Edge cases to handle:**
- Empty file upload
- Very large file (>100MB)
- Video recording >10 minutes
- AI returns no answers
- Transcription returns empty
- Network timeout mid-upload
- User closes tab during upload
- Camera/mic permission denied
- Unsupported browser

**For each: Add graceful handling and clear error message**

**9.2.3 - Add retry mechanisms everywhere**

Task: Auto-retry transient failures

**What you're learning:**
- Fault tolerance
- Retry strategies
- Resilience patterns

**Retry logic for:**
- API calls (3 retries with backoff)
- File uploads (3 retries with backoff)
- AI streaming (reconnect on disconnect)
- Database queries (1 retry)

**9.2.4 - Add logging and error reporting**

Task: Track errors in production

**What you're learning:**
- Error monitoring
- Logging strategies
- Observability

**Options:**
- Sentry (error tracking)
- LogRocket (session replay)
- CloudWatch Logs (AWS)

**For MVP:** Console logs are fine. Add Sentry for production.

### Phase 9.3: Documentation (2 hours)

**9.3.1 - Write comprehensive README**

Location: `/README.md`

**Sections to include:**

1. **Overview**
   - What is Behave?
   - Screenshot/demo GIF
   - Key features

2. **Architecture**
   - Tech stack
   - Architecture diagram
   - Data flow

3. **Getting Started**
   - Prerequisites
   - Installation steps
   - Environment variables
   - Running locally

4. **Features**
   - Document upload + AI parsing
   - Video recording + transcription
   - AI feedback
   - Progress tracking
   - Spaced repetition

5. **Advanced Patterns**
   - TypeScript patterns used
   - React 19 features
   - Performance optimizations
   - AWS infrastructure

6. **Deployment**
   - Deploy to Vercel
   - AWS setup
   - Environment configuration

7. **Future Improvements**
   - List of TODOs
   - Known limitations

**9.3.2 - Add inline code comments**

Task: Document complex logic

**What you're learning:**
- Code documentation
- Explaining architectural decisions
- Knowledge sharing

**Where to add comments:**
- Complex TypeScript types (why this pattern?)
- Custom hooks (what does this do?)
- Algorithms (how does SM-2 work?)
- Workarounds (why this hack?)

**9.3.3 - Create architecture decision records (ADRs)**

Location: `/docs/adr/`

Task: Document major decisions

**What you're learning:**
- ADR format
- Decision documentation
- Architectural thinking

**ADRs to write:**
- Why Zero over Redux/Zustand?
- Why AWS over Supabase?
- Why React 19 over XState?
- Why virtualization for lists?

**Format:**
- Context: What problem are we solving?
- Decision: What did we choose?
- Consequences: What are the tradeoffs?

### Phase 9.4: Deployment & CI/CD (1 hour)

**9.4.1 - Deploy to Vercel**

Task: Deploy production app

**What you're learning:**
- Vercel deployment
- Environment variables in production
- Production configuration

**Steps:**
- Connect GitHub repo to Vercel
- Set environment variables
- Deploy
- Test production URL

**9.4.2 - Set up CI/CD**

Task: Auto-deploy on git push

**What you're learning:**
- Continuous deployment
- Git workflows
- Automation

**Vercel does this automatically!**

**Optional:** Add GitHub Actions for:
- TypeScript type checking
- Linting
- Unit tests (if you wrote any)

**9.4.3 - Add production monitoring**

Task: Monitor app health in production

**What you're learning:**
- Application monitoring
- Uptime tracking
- Performance monitoring

**Tools:**
- Vercel Analytics (built-in)
- Sentry (error tracking)
- Uptime Robot (uptime monitoring)

**9.4.4 - Create demo video**

Task: Record walkthrough of your app

**What you're learning:**
- Storytelling
- Demo presentation
- Portfolio creation

**Script:**
1. "Hi, this is Behave, an AI-powered interview practice app"
2. Show document upload + streaming parse
3. Show video recording
4. Show AI feedback streaming
5. Show progress dashboard
6. "Built with React 19, Next.js, AWS, and advanced TypeScript patterns"
7. Show architecture diagram
8. "Check out the code on GitHub"

**Length:** 2-3 minutes

**Post on:**
- LinkedIn
- Twitter
- GitHub README

---

## Final Checklist

After 9 days, you should have:

### Technical Features
- ✅ Document upload with streaming AI parsing
- ✅ Video recording with Web Workers
- ✅ Audio transcription with Whisper
- ✅ Streaming AI feedback
- ✅ Local-first architecture (Zero)
- ✅ AWS infrastructure (RDS, S3, CloudFront)
- ✅ Virtualized lists for performance
- ✅ Infinite scroll with lazy loading
- ✅ Video hover previews
- ✅ Progress tracking dashboard
- ✅ Spaced repetition algorithm
- ✅ Session comparison
- ✅ Analytics and insights

### Advanced Patterns
- ✅ Branded types
- ✅ Discriminated unions
- ✅ Zod schemas with inference
- ✅ Generic utility types
- ✅ React 19 (useOptimistic, use(), Server Actions)
- ✅ Custom hooks (useVideoRecorder, useStreamingFeedback)
- ✅ Compound components
- ✅ Web Workers
- ✅ Optimistic UI
- ✅ Background uploads with retry
- ✅ Request deduplication
- ✅ Prefetching

### Infrastructure
- ✅ RDS Postgres
- ✅ S3 with presigned URLs
- ✅ CloudFront CDN
- ✅ Better Auth with passkeys
- ✅ IAM roles and policies
- ✅ Infrastructure as Code (CDK)
- ✅ Cost optimization
- ✅ Monitoring and alerts

### Polish
- ✅ View Transitions
- ✅ Skeleton screens
- ✅ Empty states
- ✅ Error boundaries
- ✅ Toast notifications
- ✅ Loading states everywhere
- ✅ Responsive design
- ✅ Dark mode

### Documentation
- ✅ Comprehensive README
- ✅ Architecture diagram
- ✅ Architecture Decision Records
- ✅ Inline code comments
- ✅ Demo video

---

## Interview Talking Points

After completing this, here's what you can say:

**On React/TypeScript:**
"I built a production-grade React app using all the new React 19 features like useOptimistic and Server Actions. I used advanced TypeScript patterns like branded types and discriminated unions for type safety. The codebase is fully typed with strict mode enabled."

**On Performance:**
"I optimized for performance by implementing virtualized lists that handle 100+ items smoothly, lazy loading for images and videos, Web Workers to offload video processing from the main thread, and prefetching for better perceived performance. I also added infinite scroll with React Query for efficient pagination."

**On Architecture:**
"I built a local-first architecture using Zero with CRDTs for conflict-free sync. This gives instant UI updates and offline support. I also integrated streaming AI responses using Vercel AI SDK, so users see feedback as it generates - just like ChatGPT."

**On Infrastructure:**
"I started with Supabase for rapid development, then migrated to AWS to learn cloud infrastructure. I set up RDS for the database, S3 for file storage, and CloudFront as a CDN for faster video delivery globally. I also used Infrastructure as Code with AWS CDK to make the deployment reproducible."

**On AI Integration:**
"I integrated OpenAI's Whisper for audio transcription and used streaming AI for feedback generation. I implemented prompt engineering to get structured outputs validated with Zod schemas. The AI analyzes transcripts against scripts and provides actionable feedback."

**On Advanced Features:**
"I implemented a spaced repetition algorithm (SM-2) to help users review questions optimally. I also built a progress tracking dashboard with charts showing improvement over time, and a session comparison feature that lets users see their growth."

**The one-liner:**
"I built a full-stack AI-powered interview practice app with video recording, real-time transcription, streaming feedback, and progress tracking. It uses React 19, AWS infrastructure, local-first architecture, and advanced performance optimizations. I learned production-grade patterns and documented everything in a technical blog."

---

## What Makes This Impressive

**Not a CRUD app because:**
- Real-time media handling (complex!)
- Web Workers (most devs haven't used)
- Streaming AI (cutting edge)
- Local-first architecture (advanced pattern)
- AWS infrastructure (not just SaaS glue)
- Performance optimizations (production-grade)
- Spaced repetition (algorithm implementation)

**Demonstrates depth:**
- Can architect complex systems
- Understands performance
- Knows cloud infrastructure
- Writes advanced TypeScript
- Stays current with React 19
- Solves real problems

**Portfolio quality:**
- Comprehensive README
- Architecture diagrams
- Demo video
- Clean code with comments
- Deployed and live
- Technical blog posts

---

## Next Steps (Optional)

**If you want to keep going:**

**Week 3: Testing**
- Unit tests with Vitest
- Integration tests
- E2E tests with Playwright
- Visual regression tests

**Week 4: Mobile**
- React Native app
- Share code between web/mobile
- Native camera integration
- Offline-first mobile

**Week 5: Collaboration**
- Share sessions with friends
- Peer feedback
- Interview with partner mode
- Real-time collaboration

**Week 6: Advanced AI**
- Computer vision (analyze facial expressions)
- Voice analysis (tone, confidence)
- Multi-modal AI (video + audio + transcript)
- Custom fine-tuned models

---

You now have a portfolio project with REAL DEPTH.

Go get that job. 🚀
