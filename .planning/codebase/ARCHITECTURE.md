<!-- refreshed: 2026-05-01 -->
# Architecture

**Analysis Date:** 2026-05-01

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    SvelteKit SPA (Client)                    │
├──────────────────┬──────────────────┬───────────────────────┤
│   Admin Routes   │  Employee Routes │    Auth / Login        │
│  `src/routes/admin/` │ `src/routes/employee/` │ `src/routes/login/`  │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Svelte 5 Stores (Reactive State)               │
│         `src/lib/stores/`                                    │
│  auth.svelte.ts · tasks.svelte.ts · clients.svelte.ts        │
│  messages.svelte.ts · files.svelte.ts · users.svelte.ts      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           Firebase Service Layer (Singleton)                  │
│         `src/lib/services/firebase_service.ts`                │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
│ Firebase Auth │ │ Cloud Firestore │ │ Firebase Functions │
│ (Login/Session) │ │ (Database/RT)  │ │ (Callable: users, │
│               │ │               │ │  R2 upload URLs)  │
└──────────────┘ └──────────────┘ └──────────────────┘
                                            │
                                            ▼
                                   ┌──────────────┐
                                   │ Cloudflare R2 │
                                   │ (File Storage)│
                                   └──────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Firebase Init | Initialize Firebase app, export `auth`, `db`, `functions` singletons | `src/lib/firebase.ts` |
| Firebase Service | All Firestore/Auth/Functions API calls, streams, CRUD operations | `src/lib/services/firebase_service.ts` |
| Auth Store | Global reactive auth state (firebase user, profile, loading, role) | `src/lib/stores/auth.svelte.ts` |
| Tasks Store | Per-instance task list stream with start/stop lifecycle | `src/lib/stores/tasks.svelte.ts` |
| Clients Store | Global reactive client list stream | `src/lib/stores/clients.svelte.ts` |
| Users Store | Global reactive user list stream | `src/lib/stores/users.svelte.ts` |
| Messages Store | Per-instance message list stream for a task | `src/lib/stores/messages.svelte.ts` |
| Files Store | Per-instance file list stream for a task | `src/lib/stores/files.svelte.ts` |
| Models | TypeScript interfaces/types for all domain entities | `src/lib/models.ts` |
| Utils | Pure helper functions (date formatting, file size, priority comparison) | `src/lib/utils.ts` |
| Sidebar | Responsive sidebar shell with nav + footer snippets | `src/lib/components/Sidebar.svelte` |
| TaskCard | Task summary card for dashboard grid display | `src/lib/components/TaskCard.svelte` |
| TaskHeader | Task detail header with status/priority/assignor/assignees | `src/lib/components/TaskHeader.svelte` |
| ChatPanel | Real-time message panel for a task | `src/lib/components/ChatPanel.svelte` |
| ChatMessage | Single message bubble (sent/received) | `src/lib/components/ChatMessage.svelte` |
| FileList | File listing container for a task | `src/lib/components/FileList.svelte` |
| FileRow | Single file row with approve/reject actions | `src/lib/components/FileRow.svelte` |
| ConfirmModal | Reusable confirmation dialog | `src/lib/components/ConfirmModal.svelte` |
| StatusBadge | Colored pill for task status | `src/lib/components/StatusBadge.svelte` |
| PriorityBadge | Colored pill for task priority | `src/lib/components/PriorityBadge.svelte` |
| UserAvatar | Initials-based avatar with deterministic color | `src/lib/components/UserAvatar.svelte` |
| LoadingSpinner | Reusable animated spinner | `src/lib/components/LoadingSpinner.svelte` |

## Pattern Overview

**Overall:** Client-side SPA with SvelteKit, Firebase backend, Svelte 5 runes for state management

**Key Characteristics:**
- SSR disabled (`export const ssr = false` in `src/routes/+layout.ts`) — pure client-side SPA
- Svelte 5 runes mode enforced project-wide (`compilerOptions.runes: true` in `svelte.config.js`)
- Real-time data via Firestore `onSnapshot` streams, no REST/HTTP data fetching
- Role-based routing: Admin and Employee have completely separate route trees
- Firebase Auth + Cloud Functions for privileged operations (user CRUD, R2 presigned URLs)
- Tailwind CSS v4 with custom design tokens via `@theme` in `src/routes/layout.css`

## Layers

**Presentation Layer (Routes):**
- Purpose: Page-level components that compose UI, wire stores to views
- Location: `src/routes/`
- Contains: `+page.svelte` files, `+layout.svelte` files, `+layout.ts` config
- Depends on: Stores, Service layer, `$lib/components`
- Used by: SvelteKit router (file-based routing)

**Component Layer (Reusable UI):**
- Purpose: Presentational components with props/callbacks, no business logic
- Location: `src/lib/components/`
- Contains: 12 Svelte components (TaskCard, ChatPanel, FileList, Sidebar, etc.)
- Depends on: Models, Utils, Stores (only `authStore` for current user context)
- Used by: Route pages

**Store Layer (State Management):**
- Purpose: Reactive state containers wrapping Firestore streams
- Location: `src/lib/stores/`
- Contains: 6 store files using Svelte 5 `$state` runes
- Depends on: Firebase service layer
- Used by: Routes and components

**Service Layer (API):**
- Purpose: Single point of contact with Firebase SDKs
- Location: `src/lib/services/firebase_service.ts`
- Contains: Auth functions, Firestore CRUD, Cloud Function calls, R2 upload
- Depends on: `src/lib/firebase.ts` (Firebase singletons), `src/lib/models.ts`
- Used by: Stores, some route pages (direct mutation calls)

**Domain Layer (Types):**
- Purpose: Shared TypeScript interfaces and types
- Location: `src/lib/models.ts`
- Contains: `User`, `Client`, `Task`, `TaskMessage`, `TaskFile`, status/priority enums
- Depends on: `firebase/firestore` (for `Timestamp` type)
- Used by: All other layers

**Utility Layer:**
- Purpose: Pure helper functions
- Location: `src/lib/utils.ts`
- Contains: `formatDate`, `formatFileSize`, `classNames`, `comparePriority`
- Depends on: Nothing
- Used by: Components, Stores

**Infrastructure Layer (Firebase Init):**
- Purpose: Firebase app initialization and service exports
- Location: `src/lib/firebase.ts`
- Contains: Firebase app singleton, `auth`, `db`, `functions` exports
- Depends on: `firebase` SDK, Vite env vars (`import.meta.env.VITE_FIREBASE_*`)
- Used by: `firebase_service.ts`, `auth.svelte.ts`

## Data Flow

### Primary Request Path (Task Dashboard)

1. User navigates to `/admin/dashboard` or `/employee/dashboard` — route page mounts (`src/routes/admin/dashboard/+page.svelte:14`)
2. `createTasksStore()` creates a new store instance (`src/routes/admin/dashboard/+page.svelte:10`)
3. `$effect` watches `authStore.user?.uid`, calls `tasksStore.start(uid)` (`src/routes/admin/dashboard/+page.svelte:14-19`)
4. `start()` calls `myAssignedTasksStream()` which creates a Firestore `onSnapshot` query (`src/lib/services/firebase_service.ts:129-146`)
5. Firestore pushes snapshots → callback updates `$state<Task[]>` in the store (`src/lib/stores/tasks.svelte.ts:16-34`)
6. `$derived` filtered tasks recompute reactively based on filter state (`src/routes/admin/dashboard/+page.svelte:27-35`)
7. Svelte re-renders the `TaskCard` grid (`src/routes/admin/dashboard/+page.svelte:109-118`)
8. On component unmount, `$effect` cleanup calls `tasksStore.stop()` which unsubscribes from Firestore (`src/lib/stores/tasks.svelte.ts:37-42`)

### Task Detail + Chat Flow

1. User clicks a task card → `goto(`/admin/tasks/${task.id}`)` (`src/routes/admin/dashboard/+page.svelte:115`)
2. Route page subscribes to single task stream via `topLevelTaskStream(taskId, ...)` (`src/routes/admin/tasks/[taskId]/+page.svelte:36`)
3. `ChatPanel` component creates `createMessagesStore()` and calls `start(taskId)` (`src/lib/components/ChatPanel.svelte:19-25`)
4. Messages stream from Firestore subcollection `tasks/{taskId}/messages` (`src/lib/services/firebase_service.ts:236-249`)
5. User sends message → `sendTaskMessage()` writes to Firestore (`src/lib/services/firebase_service.ts:251-263`)
6. `FileList` component similarly subscribes to `tasks/{taskId}/files` subcollection (`src/lib/components/FileList.svelte:21-26`)

### File Upload Flow

1. User selects file → `handleFileUpload` in route page (`src/routes/admin/tasks/[taskId]/+page.svelte:74-98`)
2. `uploadFileToR2(file)` calls Firebase Function `getR2UploadUrl` to get presigned URL (`src/lib/services/firebase_service.ts:325-334`)
3. Direct `fetch()` PUT to Cloudflare R2 with presigned URL (`src/lib/services/firebase_service.ts:334-338`)
4. On success, `addTaskFile()` writes metadata to Firestore `tasks/{taskId}/files` subcollection (`src/lib/services/firebase_service.ts:282-299`)
5. Real-time stream in `FileList` automatically reflects the new file

### Auth Flow

1. `src/routes/+layout.ts` disables SSR, `src/routes/+layout.svelte` reads `authStore` (`src/routes/+layout.svelte:10-18`)
2. `auth.svelte.ts` sets up `onAuthStateChanged` listener at module level (`src/lib/stores/auth.svelte.ts:12-34`)
3. On auth state change, subscribes to `users/{uid}` Firestore doc for profile data (`src/lib/stores/auth.svelte.ts:22-33`)
4. Root layout redirects to `/login` if not authenticated (`src/routes/+layout.svelte:13-17`)
5. Login page calls `signIn()` → Firebase Auth → on success, role-based redirect (`src/routes/login/+page.svelte:11-15`)
6. Admin/Employee layouts enforce role access via `$effect` guard (`src/routes/admin/+layout.svelte:10-13`)

**State Management:**
- Global singleton stores: `authStore`, `createUsersStore()`, `createClientsStore()` — module-level `$state` with factory function returning getters
- Per-instance stores: `createTasksStore()`, `createMessagesStore()`, `createFilesStore()` — factory functions returning new `$state` each call
- No external state management library (no Redux, Zustand, etc.)
- All state flows through Svelte 5 `$state`/`$derived`/`$effect` runes

## Key Abstractions

**Auth Store (Singleton):**
- Purpose: Central source of truth for authentication state and user profile
- Pattern: Module-level `$state` with exported getter object (no factory function)
- Examples: `src/lib/stores/auth.svelte.ts`
- Import as: `import { authStore } from '$lib/stores/auth.svelte'`

**Stream Stores (Factory Pattern):**
- Purpose: Per-component reactive wrappers around Firestore `onSnapshot`
- Pattern: Factory function returning `{ get data(), get loading(), get error(), start(), stop() }`
- Examples: `src/lib/stores/tasks.svelte.ts`, `src/lib/stores/messages.svelte.ts`, `src/lib/stores/files.svelte.ts`
- Usage: `const store = createStore(); $effect(() => { store.start(id); return () => store.stop(); })`

**Global Data Stores (Singleton via Factory):**
- Purpose: App-wide reference data (users, clients) always available
- Pattern: Module-level `$state` + `onSnapshot` at import time, factory returns getters
- Examples: `src/lib/stores/users.svelte.ts`, `src/lib/stores/clients.svelte.ts`
- Includes `usersMap`/`clientsMap` computed getters for O(1) ID lookups

**Firebase Service Layer (Flat Functions):**
- Purpose: Single file with all Firebase operations as named exports
- Pattern: Individual exported async functions, no class, no service object
- Examples: `src/lib/services/firebase_service.ts`
- Import as: `import { signIn, createTopLevelTask, ... } from '$lib/services/firebase_service'`

**Role-Based Layouts:**
- Purpose: Route-level auth gating and navigation shell
- Pattern: `+layout.svelte` checks `authStore` role, redirects if wrong role, renders `Sidebar` + content
- Examples: `src/routes/admin/+layout.svelte`, `src/routes/employee/+layout.svelte`

## Entry Points

**Root Page (`/`):**
- Location: `src/routes/+page.svelte`
- Triggers: Any visit to root URL
- Responsibilities: Redirect to role-appropriate dashboard or login

**Login Page (`/login`):**
- Location: `src/routes/login/+page.svelte`
- Triggers: Unauthenticated users, explicit navigation
- Responsibilities: Email/password login form, role-based redirect on success

**Admin Dashboard (`/admin/dashboard`):**
- Location: `src/routes/admin/dashboard/+page.svelte`
- Triggers: Admin user navigation
- Responsibilities: Task grid with filters (status, priority, assignee, client), link to create task

**Employee Dashboard (`/employee/dashboard`):**
- Location: `src/routes/employee/dashboard/+page.svelte`
- Triggers: Employee user navigation
- Responsibilities: Assigned task grid with filters (status, priority, client)

**Task Detail (Admin):**
- Location: `src/routes/admin/tasks/[taskId]/+page.svelte`
- Triggers: Click on task card from admin dashboard
- Responsibilities: Task header, chat panel, file list with approve/reject, file upload, close/reopen task

**Task Detail (Employee):**
- Location: `src/routes/employee/tasks/[taskId]/+page.svelte`
- Triggers: Click on task card from employee dashboard
- Responsibilities: Task header (status change only), chat panel, file list (view only), file upload

**New Task Form:**
- Location: `src/routes/admin/tasks/new/+page.svelte`
- Triggers: "New task" button from admin dashboard
- Responsibilities: Create task with title, description, priority, client, assignees

## Architectural Constraints

- **SSR disabled:** `export const ssr = false` in `src/routes/+layout.ts` — entire app runs client-side, no server-side rendering
- **Runes mode forced:** `svelte.config.js` forces `runes: true` for all non-`node_modules` files
- **Global state (module-level):** `auth.svelte.ts`, `users.svelte.ts`, `clients.svelte.ts` run `onSnapshot` at module import time — these subscriptions persist for the app lifetime
- **No API routes:** No `+server.ts` files — all data operations go directly from client to Firebase
- **Firebase SDK client-side:** Firebase is initialized and used entirely client-side via `import.meta.env.VITE_*` env vars
- **Firestore rules enforce security:** All authorization is in `firestore.rules`, not in application code — client-side code has no role checks for data access

## Anti-Patterns

### Inline Stream Subscriptions in `clients.svelte.ts` and `users.svelte.ts`

**What happens:** `clientsStream()` and `allUsersStream()` are called at module top-level in `src/lib/stores/clients.svelte.ts:8-19` and `src/lib/stores/users.svelte.ts:8-19`, creating Firestore subscriptions immediately on import
**Why it's wrong:** These subscriptions start before any component uses the data, and there's no cleanup mechanism — they persist for the entire app session. If the store module is imported but not needed (e.g., in tests or lazy-loaded routes), it wastes resources.
**Do this instead:** Follow the `tasks.svelte.ts` pattern — use a factory with explicit `start()`/`stop()` lifecycle, or use SvelteKit's `onMount`/`onDestroy` for subscription management

### Direct `alert()` for Error Feedback

**What happens:** `src/routes/admin/tasks/[taskId]/+page.svelte:83` and `src/routes/employee/tasks/[taskId]/+page.svelte:49` use `alert('Upload failed')` for error handling
**Why it's wrong:** `alert()` blocks the UI thread and provides poor UX (no styling, no dismiss control). The codebase otherwise uses inline error state with styled messages.
**Do this instead:** Use a local `$state` error variable and render inline error message, or create a toast/notification component

### Duplicated Filter UI Across Dashboards

**What happens:** Admin dashboard (`src/routes/admin/dashboard/+page.svelte:59-93`) and employee dashboard (`src/routes/employee/dashboard/+page.svelte:51-77`) contain nearly identical filter select markup
**Why it's wrong:** Any filter UI change requires updating two files. The filter logic and markup drift apart over time.
**Do this instead:** Extract a `TaskFilters` component in `src/lib/components/` that accepts filter state as `$bindable()` props

### No Error Boundary or Global Error Handling

**What happens:** Stream errors are caught in callbacks and set to local `$state` error fields, but there's no global error handler or fallback UI
**Why it's wrong:** If a Firestore stream errors (network issue, permission change), the user sees a generic "Error: ..." message with no recovery action
**Do this instead:** Add a global error toast/banner component, and provide "Retry" actions on stream error states

## Error Handling

**Strategy:** Per-component error state via store `$state<string | null>` fields

**Patterns:**
- Stores expose `get error()` getter — components check and render inline error messages
- Firebase operations use try/catch in route page handlers — errors set local `$state` or show `alert()`
- Stream errors caught in `onSnapshot` error callback — sets store `error` field, sets `loading = false`
- No centralized error handling, no retry logic, no error boundary components

## Cross-Cutting Concerns

**Logging:** `console.error()` in store error callbacks (`src/lib/stores/*.svelte.ts`), `console.error()` for R2 upload failure (`src/lib/services/firebase_service.ts:341`). No structured logging framework.

**Validation:** Client-side form validation via HTML `required` attributes and manual checks (e.g., `selectedAssignees.length === 0` in `src/routes/admin/tasks/new/+page.svelte:25-28`). No schema validation library (no Zod, Yup, etc.).

**Authentication:** Firebase Auth with email/password (`signInWithEmailAndPassword`). Auth state managed by `authStore` singleton. Role (`Admin`/`Employee`) stored in Firestore `users/{uid}` document, not in Firebase custom claims.

**Authorization:** Firestore security rules (`firestore.rules`) enforce all access control. Application code does not check roles before Firestore operations — it relies on rules to reject unauthorized writes.

**Styling:** Tailwind CSS v4 with custom design tokens (`--color-surface`, `--color-accent`, etc.) defined in `src/routes/layout.css`. All styling is utility-first Tailwind classes inline in components. No CSS modules, no styled-components.

---

*Architecture analysis: 2026-05-01*
