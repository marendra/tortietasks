# External Integrations

**Analysis Date:** 2026-05-01

## APIs & External Services

**Firebase Authentication:**
- Email/password authentication for Admin and Employee roles
- SDK: `firebase/auth` (modular SDK v12)
- Implementation: `src/lib/firebase.ts` exports `auth` instance
- Usage: `signInWithEmailAndPassword`, `signOut`, `onAuthStateChanged` in `src/lib/services/firebase_service.ts`
- Auth state managed via Svelte 5 rune store at `src/lib/stores/auth.svelte.ts`

**Cloud Firestore:**
- Primary database for all application data
- SDK: `firebase/firestore` (modular SDK v12)
- Implementation: `src/lib/firebase.ts` exports `db` instance
- Collections:
  - `users/{userId}` — User profiles with roles
  - `clients/{clientId}` — Client entities
  - `tasks/{taskId}` — Top-level tasks
  - `tasks/{taskId}/messages/{messageId}` — Task chat messages (subcollection)
  - `tasks/{taskId}/files/{fileId}` — Task file attachments (subcollection)
- Real-time listeners via `onSnapshot` used throughout stores and service layer
- Security rules defined in `firestore.rules` (126 lines) with role-based access control

**Firebase Cloud Functions (Callable):**
- SDK: `firebase/functions` (modular SDK v12)
- Implementation: `src/lib/firebase.ts` exports `functions` instance (region: `us-central1`)
- Callable functions used:
  - `createUser` — Creates Auth user + Firestore doc atomically (Admin only)
  - `deleteUser` — Deletes Auth user + Firestore doc (Admin only)
  - `getR2UploadUrl` — Generates presigned PUT URL for Cloudflare R2 file uploads
- Invocation pattern: `httpsCallable(functions, 'functionName')` in `src/lib/services/firebase_service.ts`

**Cloudflare R2 (Object Storage):**
- File storage for task attachments
- Client uploads directly to R2 via presigned URLs (5-minute expiry)
- Upload flow implemented in `uploadFileToR2()` at `src/lib/services/firebase_service.ts:325-346`
- Pattern: Call `getR2UploadUrl` Cloud Function → `fetch(presignedUrl, { method: 'PUT' })` → store `publicUrl` in Firestore
- Public URLs stored in `tasks/{taskId}/files/{fileId}.fileUrl`

**Firebase Cloud Messaging (FCM):**
- Push notification infrastructure (referenced in models, not yet implemented in web client)
- `fcmTokens` field exists on `User` model (`src/lib/models.ts:10`)
- Cloud Functions send push notifications on: task creation, new messages, file uploads, file approval/rejection
- Web push registration not yet implemented — deferred per `WEB_ARCHITECTURE.md`

**Google Fonts:**
- Inter font loaded via Google Fonts CDN in `src/app.html`
- Weights: 300, 400, 500, 600, 700

## Data Storage

**Databases:**
- Cloud Firestore (Google Cloud)
  - Connection: Firebase JS SDK initialized in `src/lib/firebase.ts`
  - Config: `VITE_FIREBASE_*` environment variables
  - Client: Firebase modular SDK (`firebase/firestore`)
  - Access pattern: Client-side SDK with Firestore security rules (no server middleware)

**File Storage:**
- Cloudflare R2 via presigned URLs
  - Files stored as public objects
  - Metadata tracked in Firestore `tasks/{taskId}/files` subcollection
  - Approval workflow: Pending → Approved | Rejected

**Caching:**
- None — Firestore real-time listeners provide fresh data; no client-side caching layer

## Authentication & Identity

**Auth Provider:**
- Firebase Authentication (email/password)
  - Implementation: `src/lib/services/firebase_service.ts` — `signIn()`, `logOut()`, `getCurrentUser()`, `onAuthChange()`
  - Auth state: Svelte rune store at `src/lib/stores/auth.svelte.ts` with `firebaseUser`, `userDoc`, `loading`
  - Roles: Stored in Firestore `users/{uid}.role` field (NOT in Firebase Auth custom claims)
  - Role values: `'Admin'` | `'Employee'`
  - Route protection: `src/routes/+layout.svelte` — redirects unauthenticated users to `/login`
  - Role-based routing: Admin → `/admin/dashboard`, Employee → `/employee/dashboard`

**Authorization:**
- Firestore security rules enforce access control at database level (`firestore.rules`)
- Admin check: Reads `users/{uid}.role` from Firestore within rules
- Task access: `participants` array-contains check for all task queries
- File/message access: Denormalized `participants` field for subcollection queries

## Monitoring & Observability

**Error Tracking:**
- None — errors logged to `console.error` in stores and service layer

**Logs:**
- Browser console via `console.error` for stream errors in stores
- No structured logging or error reporting service

## CI/CD & Deployment

**Hosting:**
- `@sveltejs/adapter-auto` — auto-detects platform
- `.gitignore` references `.vercel`, `.netlify`, `.wrangler` — multiple platforms tested/considered

**CI Pipeline:**
- None detected — no `.github/workflows/`, no CI config files

**Scripts:**
```bash
npm run dev          # Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # TypeScript + Svelte type checking
npm run lint         # Prettier check + ESLint
npm run format       # Prettier write
```

## Environment Configuration

**Required env vars (Firebase):**
- `VITE_FIREBASE_API_KEY` — Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` — Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` — Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` — Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` — FCM sender ID
- `VITE_FIREBASE_APP_ID` — Firebase app ID
- `VITE_FIREBASE_MEASUREMENT_ID` — Firebase Analytics measurement ID

**Secrets location:**
- `.env` file (gitignored, present in repo root)
- Never committed — `.gitignore` excludes `.env` and `.env.*`

## Webhooks & Callbacks

**Incoming:**
- None — client-side SPA, no server endpoints

**Outgoing:**
- None — all server-side logic handled by Firebase Cloud Functions (Firestore triggers)

## Firebase Cloud Functions (Server-Side Triggers)

These run server-side and are not called directly by the web client:

| Trigger | Collection | Event | Notification Target |
|---------|-----------|-------|---------------------|
| `onTaskCreated` | `tasks/{taskId}` | created | All assignees (except creator) |
| `onMessageCreated` | `tasks/{taskId}/messages/{messageId}` | created | All participants (except sender) |
| `onFileCreated` | `tasks/{taskId}/files/{fileId}` | created | Task assignor (if not uploader) |
| `onFileUpdated` | `tasks/{taskId}/files/{fileId}` | updated (status change) | File uploader |

---

*Integration audit: 2026-05-01*
