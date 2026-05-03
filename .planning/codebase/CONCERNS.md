# Codebase Concerns

**Analysis Date:** 2026-05-01

## Tech Debt

**Zero Test Coverage:**
- Issue: No test files exist in the entire codebase. No test framework is configured (no vitest, jest, or playwright).
- Files: No `*.test.*` or `*.spec.*` files found in `src/`
- Impact: Any code change risks introducing regressions with no safety net. Critical for a task management app handling real business data.
- Fix approach: Add vitest for unit tests, playwright for E2E. Start with `src/lib/services/firebase_service.ts` and store logic.

**Module-Level Store Initialization in `clients.svelte.ts` and `users.svelte.ts`:**
- Issue: Both `src/lib/stores/clients.svelte.ts` (lines 8-19) and `src/lib/stores/users.svelte.ts` (lines 8-19) start Firestore `onSnapshot` listeners at module scope, outside any factory function. These listeners fire on first import regardless of auth state.
- Files: `src/lib/stores/clients.svelte.ts:8-19`, `src/lib/stores/users.svelte.ts:8-19`
- Impact: Listeners start before user is authenticated, potentially causing permission errors or wasted reads. No way to stop these listeners — they persist for app lifetime.
- Fix approach: Refactor to match pattern in `src/lib/stores/tasks.svelte.ts` — move `$state` inside factory function, add `start()`/`stop()` lifecycle methods.

**Duplicate Code Between Admin and Employee Pages:**
- Issue: `src/routes/admin/dashboard/+page.svelte` and `src/routes/employee/dashboard/+page.svelte` share nearly identical filter UI, task grid rendering, and store initialization logic. Same for task detail pages.
- Files: `src/routes/admin/dashboard/+page.svelte`, `src/routes/employee/dashboard/+page.svelte`, `src/routes/admin/tasks/[taskId]/+page.svelte`, `src/routes/employee/tasks/[taskId]/+page.svelte`
- Impact: Bug fixes and feature additions must be applied in two places. Risk of drift between admin and employee views.
- Fix approach: Extract shared dashboard and task-detail components. Pass role-specific props (e.g., `canApprove`, `canClose`) to control permissions.

**Single Monolithic Service File:**
- Issue: All Firebase operations (Auth, Users, Clients, Tasks, Messages, Files, R2 upload) live in one 346-line file `src/lib/services/firebase_service.ts`.
- Files: `src/lib/services/firebase_service.ts`
- Impact: Hard to navigate, test, and maintain. Adding new features requires modifying this single file.
- Fix approach: Split into domain-specific service files: `auth_service.ts`, `user_service.ts`, `task_service.ts`, `file_service.ts`.

**No `.env.example` File:**
- Issue: The `.env` file is gitignored but there's no `.env.example` template for new developers.
- Files: `.env` (exists but gitignored), `.gitignore`
- Impact: New developers must guess which environment variables are needed.
- Fix approach: Create `.env.example` with placeholder values for all 7 required `VITE_FIREBASE_*` variables.

## Known Bugs

**`myCreatedTasksStream` Has Identical Query to `myAssignedTasksStream`:**
- Symptoms: `myCreatedTasksStream()` in `src/lib/services/firebase_service.ts:148-157` uses the exact same query as `myAssignedTasksStream()` — both filter by `participants` array-contains. This function appears to be intended to show tasks the user created (by `assignorId`), but instead shows the same assigned tasks.
- Files: `src/lib/services/firebase_service.ts:148-157`
- Trigger: Calling `myCreatedTasksStream()` returns tasks where user is a participant, not tasks they created.
- Workaround: None needed currently — function is not called anywhere in the codebase.

**`reopenTopLevelTask` Does Not Restore Status:**
- Symptoms: When reopening a closed task via `reopenTopLevelTask()`, it sets `isClosed: false` but does not reset the `status` field. The task remains with `status: 'Completed'` even though it's now open.
- Files: `src/lib/services/firebase_service.ts:227-232`
- Trigger: Clicking "Reopen task" on a closed task.
- Workaround: Manually change status after reopening.

## Security Considerations

**Client-Side Role Checks Only:**
- Risk: Route guards in `src/routes/admin/+layout.svelte:10-13` and `src/routes/employee/+layout.svelte:10-13` check `authStore.isAdmin` / `authStore.isEmployee` client-side. A malicious user could bypass these checks by modifying the client bundle.
- Files: `src/routes/admin/+layout.svelte:10-13`, `src/routes/employee/+layout.svelte:10-13`
- Current mitigation: Firestore security rules (not in this repo) should enforce server-side access control.
- Recommendations: Ensure Firestore rules enforce role-based access. Add server-side validation in Cloud Functions for sensitive operations.

**No Input Sanitization on Task/Message Content:**
- Risk: User-generated text (task titles, descriptions, messages) is rendered directly without sanitization. While Svelte auto-escapes HTML by default, the `ChatMessage.svelte` component renders `{message.text}` directly.
- Files: `src/lib/components/ChatMessage.svelte:32`, `src/routes/admin/tasks/[taskId]/+page.svelte:118`
- Current mitigation: Svelte's default template escaping prevents XSS in text interpolation.
- Recommendations: Validate message length and content server-side via Cloud Functions or Firestore rules.

**File Upload Has No Size or Type Validation:**
- Risk: `uploadFileToR2()` in `src/lib/services/firebase_service.ts:325-346` accepts any file type and size. No client-side validation before upload.
- Files: `src/lib/services/firebase_service.ts:325-346`, `src/routes/admin/tasks/[taskId]/+page.svelte:74-99`
- Current mitigation: R2 presigned URL generation (Cloud Function) may enforce limits server-side.
- Recommendations: Add client-side file size limit (e.g., 10MB) and allowed MIME type check before upload.

**CSV Export Missing Sanitization:**
- Risk: `exportCSV()` in `src/routes/admin/reports/+page.svelte:47-72` wraps title in double quotes but doesn't escape formulas. A task title starting with `=`, `+`, `-`, or `@` could be interpreted as a formula in spreadsheet applications.
- Files: `src/routes/admin/reports/+page.svelte:47-72`
- Current mitigation: Title is wrapped in double quotes and internal quotes are escaped.
- Recommendations: Prefix formula-starting values with a single quote or tab character.

## Performance Bottlenecks

**`usersMap` and `clientsMap` Recomputed on Every Access:**
- Problem: `createUsersStore().usersMap` and `createClientsStore().clientsMap` in `src/lib/stores/users.svelte.ts:32-36` and `src/lib/stores/clients.svelte.ts:32-36` create a new `Map` on every getter call. These are used as props in render loops.
- Files: `src/lib/stores/users.svelte.ts:32-36`, `src/lib/stores/clients.svelte.ts:32-36`
- Cause: The `get usersMap()` getter creates `new Map()` on each access without caching.
- Improvement path: Cache the map using `$derived` and only rebuild when the underlying `users` array changes.

**No Pagination on Firestore Queries:**
- Problem: `allTasksStream()`, `myAssignedTasksStream()`, `allUsersStream()`, `clientsStream()` all fetch entire collections without pagination or limits.
- Files: `src/lib/services/firebase_service.ts:64-67`, `src/lib/services/firebase_service.ts:100-103`, `src/lib/services/firebase_service.ts:129-146`, `src/lib/services/firebase_service.ts:159-164`
- Cause: No `limit()` clause on any query.
- Improvement path: Add `limit()` and cursor-based pagination for large datasets. Firestore charges per document read.

**`alert()` for Error Feedback:**
- Problem: File upload failure uses browser `alert()` in `src/routes/admin/tasks/[taskId]/+page.svelte:83` and `src/routes/employee/tasks/[taskId]/+page.svelte:49`. This blocks the UI thread.
- Files: `src/routes/admin/tasks/[taskId]/+page.svelte:83`, `src/routes/employee/tasks/[taskId]/+page.svelte:49`
- Cause: Quick error handling without proper UI.
- Improvement path: Replace with inline error message or toast notification.

## Fragile Areas

**Auth Store Is a Module-Level Singleton:**
- Files: `src/lib/stores/auth.svelte.ts`
- Why fragile: The `onAuthStateChanged` listener starts immediately on import (line 12). If Firebase initialization fails or env vars are missing, the app crashes with no recovery path. The `docUnsub` cleanup logic (lines 14-17) is critical — any leak causes Firestore listener accumulation.
- Safe modification: Never import `authStore` conditionally. Ensure all auth-dependent code waits for `loading` to be `false`.
- Test coverage: None.

**Type Assertions with `as` Throughout Service Layer:**
- Files: `src/lib/services/firebase_service.ts:55`, `src/lib/services/firebase_service.ts:60`, `src/lib/services/firebase_service.ts:66`, `src/lib/services/firebase_service.ts:73`, `src/lib/services/firebase_service.ts:102`, `src/lib/services/firebase_service.ts:109`, `src/lib/services/firebase_service.ts:142`, `src/lib/services/firebase_service.ts:155`, `src/lib/services/firebase_service.ts:162`, `src/lib/services/firebase_service.ts:174`, `src/lib/services/firebase_service.ts:182`, `src/lib/services/firebase_service.ts:245`, `src/lib/services/firebase_service.ts:276`
- Why fragile: Every Firestore document is cast with `as User`, `as Task`, etc. without runtime validation. If the Firestore schema changes or a document is malformed, the app will have silent type mismatches.
- Safe modification: Add runtime validation (e.g., zod schemas) before casting, or at minimum check required fields exist.
- Test coverage: None.

**Firebase Config Reads Undefined Env Vars Silently:**
- Files: `src/lib/firebase.ts:6-14`
- Why fragile: If any `VITE_FIREBASE_*` env var is missing, `firebaseConfig` contains `undefined` values. Firebase initialization may succeed but produce cryptic errors later.
- Safe modification: Add validation at startup: `if (!firebaseConfig.apiKey) throw new Error('Missing VITE_FIREBASE_API_KEY')`.
- Test coverage: None.

**Hardcoded Cloud Functions Region:**
- Files: `src/lib/firebase.ts:20`
- Why fragile: `getFunctions(app, 'us-central1')` hardcodes the region. If Cloud Functions are deployed to a different region, all callable function invocations fail.
- Safe modification: Move region to env var or use `getFunctions(app)` with default region.
- Test coverage: None.

## Scaling Limits

**Firestore Read Costs:**
- Current capacity: Every page load triggers multiple `onSnapshot` listeners. Dashboard loads all users, all clients, and user's tasks simultaneously.
- Limit: At scale (hundreds of users, thousands of tasks), Firestore read costs increase linearly with concurrent users.
- Scaling path: Add query limits, implement pagination, consider Firestore caching with `enableMultiTabIndexedDbPersistence()`.

**No Offline Support:**
- Current capacity: App requires active internet connection. All data is fetched via real-time listeners.
- Limit: Users lose access entirely when offline.
- Scaling path: Enable Firestore offline persistence. Handle offline state in UI.

## Dependencies at Risk

**Firebase SDK v12:**
- Risk: Single runtime dependency (`firebase` 12.12.1). The Firebase JS SDK is large (~400KB+ bundled). Tree-shaking helps but Auth + Firestore + Functions is still substantial.
- Impact: Bundle size directly affects initial load time.
- Migration plan: Consider using modular imports (`firebase/auth`, `firebase/firestore`) which are already in use. Monitor bundle size with `vite-bundle-analyzer`.

**`adapter-auto`:**
- Risk: `@sveltejs/adapter-auto` auto-detects deployment platform. Behavior may differ between environments.
- Impact: Build output varies by deployment target, potentially causing environment-specific bugs.
- Migration plan: Pin to a specific adapter (e.g., `@sveltejs/adapter-vercel`) once deployment target is finalized.

## Missing Critical Features

**No Password Reset:**
- Problem: Login page at `src/routes/login/+page.svelte` has no "Forgot password" link or flow.
- Blocks: Users who forget their password must contact an admin.

**No User Profile Editing:**
- Problem: Users cannot edit their own name, email, or password. Only admins can manage users via `src/routes/admin/team/+page.svelte`.
- Blocks: Self-service account management.

**No Task Deletion:**
- Problem: Tasks can be closed and reopened but never deleted. `src/lib/services/firebase_service.ts` has no `deleteTask` function.
- Blocks: Cleaning up test or erroneous tasks.

**No Notification System:**
- Problem: `User` model includes `fcmTokens?: string[]` (Firebase Cloud Messaging) in `src/lib/models.ts:10`, but no FCM integration exists in the codebase.
- Blocks: Push notifications for task assignments, messages, or status changes.

## Test Coverage Gaps

**Entire Codebase Untested:**
- What's not tested: All store logic, service layer, components, routing, auth flows, file uploads, error handling.
- Files: All files in `src/`
- Risk: Any refactoring or feature addition may introduce regressions undetected.
- Priority: High — start with service layer unit tests, then store logic, then component tests.

**No Type-Safe Firestore Operations:**
- What's not tested: All Firestore document reads use `as Type` assertions without runtime validation.
- Files: `src/lib/services/firebase_service.ts` (all functions)
- Risk: Schema changes in Firestore silently break the app with wrong data shapes.
- Priority: High — add zod or similar runtime validation.

---

*Concerns audit: 2026-05-01*
