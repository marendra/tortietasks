# TortieTask Web — Architecture Overview

> **Purpose**: This document is the single source of truth for building the TortieTask **web client** in **Svelte** (SvelteKit recommended). The web app connects to the **same Firebase backend** (Auth, Firestore, Cloud Functions, Cloud Messaging) used by the existing Flutter mobile app.

---

## 1. System Overview

**TortieTask** is an internal task-based chat application for companies. It supports two user roles:

| Role | Capabilities |
|------|-------------|
| **Admin** | Create/delete users, create tasks, assign tasks to employees, manage clients, approve/reject files, view all tasks, generate reports |
| **Employee** | View assigned tasks, update task status, chat in task threads, upload files for approval |

**Core Flow:**
1. Admin creates a task and assigns one or more employees.
2. Employees update the task through a 4-step status workflow.
3. Employees upload files to the task; Admins/assignors approve or reject them.
4. All participants can chat in real-time within each task workspace.
5. Push notifications alert users about new tasks, messages, file uploads, and approval changes.

---

## 2. Tech Stack (Web Client)

| Layer | Technology |
|-------|------------|
| Framework | **SvelteKit** (SSR disabled or hybrid; this is a SPA-like dashboard app) |
| Language | TypeScript |
| Styling | Tailwind CSS (recommended) or plain CSS |
| UI Components | shadcn-svelte, Skeleton, or custom |
| State Management | Svelte 5 runes (`$state`, `$derived`, `$effect`) + custom stores for Firestore streams |
| Routing | SvelteKit file-based routing (`src/routes/`) |
| Backend SDK | Firebase JS SDK v10+ (modular) |
| Auth | Firebase Authentication (email/password) |
| Database | Cloud Firestore (client-side SDK with security rules) |
| File Storage | Cloudflare R2 via presigned URLs (same as mobile) |
| Push Notifications | Firebase Cloud Messaging (web push) — optional v1 |

> **Important**: The web app does NOT replace the backend. It reuses the exact same Firebase project, Firestore collections, Cloud Functions, and security rules.

---

## 3. Database Design (Firestore)

### 3.1 Collection Hierarchy

```
users/{userId}                          (top-level)
clients/{clientId}                      (top-level)
tasks/{taskId}                          (top-level)
tasks/{taskId}/messages/{messageId}     (subcollection)
tasks/{taskId}/files/{fileId}           (subcollection)

# Legacy (read-only / do not extend)
clients/{clientId}/projects/{projectId}
clients/{clientId}/projects/{projectId}/tasks/{taskId}
```

### 3.2 Document Schemas

#### `users/{userId}`

```typescript
interface User {
  id: string;              // Firebase Auth UID (document ID)
  name: string;            // Display name
  role: "Admin" | "Employee";
  fcmTokens: string[];     // Push notification tokens
  createdAt?: Timestamp;   // Set by Cloud Function
  createdBy?: string;      // Admin UID who created this user
}
```

#### `clients/{clientId}`

```typescript
interface Client {
  id: string;              // Firestore auto-ID
  clientName: string;
}
```

#### `tasks/{taskId}` (Task-Centric — primary)

```typescript
interface Task {
  id: string;                        // Firestore auto-ID
  title: string;
  description: string;
  status: "In Progress" | "Review" | "Approved" | "Completed";
  priority: "High" | "Medium" | "Low";
  isClosed: boolean;                 // true = archived/completed
  assignorId: string;                // Admin/manager who created the task
  assigneeIds: string[];             // Employee UIDs
  participants: string[];            // Denormalized: assignorId + assigneeIds (unique)
  clientId: string | null;           // Optional client reference
  createdAt: Timestamp;
  updatedAt: Timestamp | null;
}
```

> **Note**: Default status on creation is `"In Progress"`. The `"To Do"` status has been removed to simplify the workflow.

> **Critical**: `participants` MUST be maintained as `assignorId + assigneeIds` (deduplicated). It is the primary field used in security rules for read access.

#### `tasks/{taskId}/messages/{messageId}`

```typescript
interface TaskMessage {
  id: string;
  taskId: string;           // Parent task ID
  senderId: string;         // User UID
  text: string;
  fileUrl: string | null;   // Optional attached file
  createdAt: Timestamp;
}
```

> **Note**: Access control is determined by the parent task's `participants` array, not a denormalized field on each message.

#### `tasks/{taskId}/files/{fileId}`

```typescript
interface TaskFile {
  id: string;
  taskId: string;              // Parent task ID
  uploadedBy: string;          // User UID
  fileName: string;
  fileUrl: string;             // Public R2 URL
  fileSize: number;            // Bytes
  mimeType: string;
  status: "Pending" | "Approved" | "Rejected";
  uploadedAt: Timestamp;
  approvedAt: Timestamp | null;
  approvedBy: string | null;   // Admin UID who approved/rejected
  rejectionReason: string | null;
}
```

> **Note**: Access control is determined by the parent task's `participants` array, not a denormalized field on each file.

### 3.3 Composite Indexes Required

```json
{
  "indexes": [
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "participants", "arrayConfig": "CONTAINS" },
        { "fieldPath": "isClosed", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

> If additional queries are added (e.g., filter by `status` + `createdAt`), new composite indexes may need to be defined in `firestore.indexes.json` and deployed.

---

## 4. Authentication & Authorization

### 4.1 Auth Method

- **Firebase Authentication — Email/Password**
- Web SDK: `createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `signOut`
- Admin user creation MUST go through the `createUser` Cloud Function (so the Firestore user doc is created atomically with the Auth user).

### 4.2 Role-Based Access

Roles are stored in Firestore (`users/{uid}.role`), NOT in Firebase Auth custom claims.

**After login flow:**
1. Authenticate with Firebase Auth.
2. Listen to `users/{uid}` document to get `role`.
3. Redirect: `Admin` → `/admin/dashboard`, `Employee` → `/employee/dashboard`.

### 4.3 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "Admin";
    }

    function getTaskParticipants(taskId) {
      return get(/databases/$(database)/documents/tasks/$(taskId)).data.participants;
    }

    function getTaskAssignorId(taskId) {
      return get(/databases/$(database)/documents/tasks/$(taskId)).data.assignorId;
    }

    // Users: all authenticated can read, only admin can create/delete
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAdmin();
      allow update: if isAdmin() || (request.auth.uid == userId &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['name']));
      allow delete: if isAdmin();
    }

    // Clients: all authenticated can read, only admin can write
    match /clients/{clientId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Top-level Tasks
    match /tasks/{taskId} {
      // READ: only participants can read
      allow read: if isAuthenticated() &&
        request.auth.uid in resource.data.participants;

      // CREATE: only admin can create
      allow create: if isAdmin();

      // UPDATE: assignor (full), assignee (limited to status/updatedAt)
      allow update: if isAuthenticated() && (
        resource.data.assignorId == request.auth.uid ||
        (request.auth.uid in resource.data.assigneeIds &&
         request.resource.data.diff(resource.data).affectedKeys().hasOnly([
           'status', 'updatedAt'
         ]))
      );

      // DELETE: only admin
      allow delete: if isAdmin();
    }

    // Task Messages
    match /tasks/{taskId}/messages/{messageId} {
      // READ: participants can read (checks parent task)
      allow read: if isAuthenticated() &&
        request.auth.uid in getTaskParticipants(taskId);

      // CREATE: participants can create messages
      allow create: if isAuthenticated() &&
        request.auth.uid in getTaskParticipants(taskId) &&
        request.resource.data.senderId == request.auth.uid &&
        request.resource.data.taskId == taskId;

      // UPDATE/DELETE: sender or admin
      allow update, delete: if isAuthenticated() && (
        resource.data.senderId == request.auth.uid || isAdmin()
      );
    }

    // Task Files
    match /tasks/{taskId}/files/{fileId} {
      // READ: participants can read (checks parent task)
      allow read: if isAuthenticated() &&
        request.auth.uid in getTaskParticipants(taskId);

      // CREATE: participants can upload files
      allow create: if isAuthenticated() &&
        request.auth.uid in getTaskParticipants(taskId) &&
        request.resource.data.uploadedBy == request.auth.uid &&
        request.resource.data.taskId == taskId &&
        request.resource.data.status == "Pending";

      // UPDATE: admin or assignor can approve/reject
      allow update: if isAuthenticated() && (
        isAdmin() || request.auth.uid == getTaskAssignorId(taskId)
      ) && request.resource.data.diff(resource.data).affectedKeys().hasOnly([
        'status', 'approvedBy', 'approvedAt', 'rejectionReason'
      ]);

      // DELETE: admin or uploader
      allow delete: if isAuthenticated() && (
        isAdmin() || resource.data.uploadedBy == request.auth.uid
      );
    }
  }
}
```

### 4.4 Security Rules Summary

| Resource | Read | Create | Update | Delete |
|----------|------|--------|--------|--------|
| `users/{id}` | Any auth user | Admin only | Admin, or self (name only) | Admin only |
| `clients/{id}` | Any auth user | Admin only | Admin only | Admin only |
| `tasks/{id}` | Participants only | Admin only | Assignor (full), Assignee (status only) | Admin only |
| `tasks/{id}/messages/{id}` | Participants (via parent task) | Participants | Sender or Admin | Sender or Admin |
| `tasks/{id}/files/{id}` | Participants (via parent task) | Participants | Admin or Assignor | Admin or Uploader |

> **Web client implication**: Every list query against `tasks` MUST include `.where("participants", "array-contains", currentUser.uid)` or Firestore will reject it.

---

## 5. Cloud Functions Workflow

### 5.1 Callable HTTPS Functions

These are invoked from the web client via `httpsCallable`.

| Function | Auth | Role | Input | Output | Behavior |
|----------|------|------|-------|--------|----------|
| `createUser` | Required | Admin | `{ email, password, name, role }` | `{ success, userId, message }` | Creates Auth user + Firestore doc |
| `deleteUser` | Required | Admin | `{ userId }` | `{ success, message }` | Deletes Auth user + Firestore doc. Cannot delete self or admins. |
| `getR2UploadUrl` | Required | Any auth | `{ fileName, contentType }` | `{ presignedUrl, publicUrl, key }` | Generates a 5-min presigned PUT URL for Cloudflare R2 |

### 5.2 Firestore Trigger Functions (Notifications)

These run server-side; the web client does not call them directly. They send FCM push notifications.

| Trigger | Collection | Event | Target | Payload |
|---------|-----------|-------|--------|---------|
| `onTaskCreated` | `tasks/{taskId}` | created | All `assigneeIds` except `assignorId` | "New Task Assigned: {title}" |
| `onMessageCreated` | `tasks/{taskId}/messages/{messageId}` | created | All `participants` except `senderId` | "New Message: {text}" |
| `onFileCreated` | `tasks/{taskId}/files/{fileId}` | created | Task `assignorId` (if not uploader) | "New File Upload: {fileName}" |
| `onFileUpdated` | `tasks/{taskId}/files/{fileId}` | updated (status Pending → Approved/Rejected) | `uploadedBy` user | "File Approved" / "File Rejected" |

### 5.3 File Upload Flow (R2)

```
┌──────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌─────────┐
│  Client  │────▶│ getR2UploadUrl() │────▶│  Cloud Function │────▶│   R2    │
│  (Web)   │     │  (callable)      │     │  (presigned URL)│     │ (store) │
└──────────┘     └──────────────────┘     └─────────────────┘     └─────────┘
      │                                                            │
      │◄──────────────────── publicUrl ────────────────────────────│
      │                                                            │
      │     PUT file bytes to presignedUrl (5 min expiry)          │
      └────────────────────────────────────────────────────────────▶
```

**Web implementation steps:**
1. User selects file via `<input type="file">`.
2. Call `getR2UploadUrl({ fileName, contentType })` Cloud Function.
3. `fetch(presignedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': contentType } })`.
4. On success (HTTP 200), store `publicUrl` in Firestore via `addTaskFile()`.

---

## 6. Web Frontend Architecture (SvelteKit)

### 6.1 Recommended Directory Structure

```
src/
├── lib/
│   ├── firebase.ts              # Firebase app initialization + SDK instances
│   ├── models.ts                # TypeScript interfaces (mirror of Flutter models)
│   ├── stores/
│   │   ├── auth.ts              # Auth state store ($user, $role, $isAdmin)
│   │   ├── tasks.ts             # Task stream stores
│   │   ├── messages.ts          # Message stream stores
│   │   └── files.ts             # File stream stores
│   ├── services/
│   │   └── firebase_service.ts  # All Firestore/Auth/Function/R2 operations
│   └── components/              # Reusable Svelte components
│       ├── TaskCard.svelte
│       ├── StatusBadge.svelte
│       ├── StatusIcon.svelte
│       ├── ChatMessage.svelte
│       ├── FileRow.svelte
│       └── UserAvatar.svelte
├── routes/
│   ├── +layout.svelte           # Root layout: auth guard, nav, Firebase init
│   ├── +page.svelte             # Landing / redirect to login
│   ├── login/
│   │   └── +page.svelte         # Login screen
│   ├── admin/
│   │   ├── dashboard/
│   │   │   └── +page.svelte     # Admin task list (all open / created by me)
│   │   ├── team/
│   │   │   └── +page.svelte     # Team management (create/delete users)
│   │   ├── clients/
│   │   │   └── +page.svelte     # Client CRUD
│   │   ├── reports/
│   │   │   └── +page.svelte     # Weekly reports
│   │   └── tasks/
│   │       ├── new/
│   │       │   └── +page.svelte # Create task
│   │       └── [taskId]/
│   │           └── +page.svelte # Task workspace (chat, files, status)
│   └── employee/
│       ├── dashboard/
│       │   └── +page.svelte     # Employee task list (assigned to me)
│       └── tasks/
│           └── [taskId]/
│               └── +page.svelte # Task workspace
└── app.html
```

### 6.2 Firebase Initialization (`lib/firebase.ts`)

```typescript
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getMessaging, getToken } from "firebase/messaging"; // optional

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "us-central1");
export const messaging = typeof window !== "undefined" ? getMessaging(app) : null;
```

### 6.3 Auth Store Pattern (`lib/stores/auth.ts`)

Use a Svelte 5 rune-based pattern (or writable store if on Svelte 4):

```typescript
import { auth, db } from "$lib/firebase";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

// Svelte 5 runes
function createAuthStore() {
  let firebaseUser = $state<FirebaseUser | null>(null);
  let userDoc = $state<{ name: string; role: "Admin" | "Employee" } | null>(null);
  let loading = $state(true);

  $effect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      firebaseUser = u;
      if (!u) {
        userDoc = null;
        loading = false;
      }
    });
    return unsubAuth;
  });

  $effect(() => {
    if (!firebaseUser) return;
    const unsubDoc = onSnapshot(doc(db, "users", firebaseUser.uid), (snap) => {
      userDoc = snap.exists() ? (snap.data() as any) : null;
      loading = false;
    });
    return unsubDoc;
  });

  return {
    get user() { return firebaseUser; },
    get profile() { return userDoc; },
    get isAdmin() { return userDoc?.role === "Admin"; },
    get isEmployee() { return userDoc?.role === "Employee"; },
    get loading() { return loading; },
  };
}

export const authStore = createAuthStore();
```

### 6.4 Route Guards

In `+layout.svelte` or a `+page.ts` load function:

1. Wait for `authStore.loading === false`.
2. If no user → redirect to `/login`.
3. If user but no profile → show loading or error.
4. On protected admin routes, check `isAdmin`; otherwise redirect to `/employee/dashboard`.
5. On protected employee routes, check `isEmployee`; otherwise redirect to `/admin/dashboard`.

---

## 7. Service Layer (`lib/services/firebase_service.ts`)

Implement the following operations using Firebase JS SDK. Match the Flutter `FirebaseService` API surface.

### Auth
- `signIn(email, password)` → `signInWithEmailAndPassword`
- `signOut()` → `signOut` + clear any FCM token if implemented
- `get currentUser()` → `auth.currentUser`
- `onAuthStateChanged(callback)`

### Users
- `getUser(uid): Promise<User | null>` — `getDoc`
- `userStream(uid): Observable<User | null>` — `onSnapshot`
- `getAllUsers(): Promise<User[]>` — `getDocs`
- `allUsersStream(): Observable<User[]>` — `collection` snapshot
- `createUser(email, password, name, role)` — `httpsCallable('createUser')`
- `updateUser(uid, { name?, role? })` — `updateDoc`
- `deleteUser(uid)` — `httpsCallable('deleteUser')`

### Clients
- `getAllClients(): Promise<Client[]>`
- `clientsStream(): Observable<Client[]>`
- `createClient(clientName)` — `addDoc`
- `updateClient(id, clientName)` — `updateDoc`
- `deleteClient(id)` — `deleteDoc`

### Tasks (Top-Level — Primary)
- `myAssignedTasksStream(userId): Observable<Task[]>`
  - Query: `collection("tasks")`, `where("participants", "array-contains", userId)`
- `myCreatedTasksStream(userId): Observable<Task[]>`
  - Same query; filter client-side by `assignorId === userId` if needed, or use the same query and let the UI split.
- `allOpenTasksStream(): Observable<Task[]>`
  - Query: `where("isClosed", "==", false)`, `orderBy("createdAt", "desc")`
- `topLevelTaskStream(taskId): Observable<Task | null>` — `doc` snapshot
- `getTopLevelTask(taskId): Promise<Task | null>`
- `createTopLevelTask({ title, description, assigneeIds, assignorId, priority, clientId? })` — `addDoc`
  - **Note**: Default status is `"In Progress"` on creation.
- `updateTopLevelTask(taskId, { title?, description?, status?, priority?, assigneeIds?, clientId? })` — `updateDoc`
  - **IMPORTANT**: If `assigneeIds` changes, recalculate `participants = [...new Set([assignorId, ...assigneeIds])]`.
- `closeTopLevelTask(taskId)` — sets `isClosed: true`, `status: "Completed"`
- `reopenTopLevelTask(taskId)` — sets `isClosed: false`
- `deleteTopLevelTask(taskId)` — `deleteDoc` (Admin only)

### Messages (Task Chat)
- `taskMessagesStream(taskId): Observable<TaskMessage[]>`
  - Query: `collection("tasks", taskId, "messages")`, `orderBy("createdAt", "asc")`
- `sendTaskMessage({ taskId, senderId, text, fileUrl? })` — `addDoc`
  - Security rules verify sender is in parent task's participants.

### Files
- `taskFilesStream(taskId): Observable<TaskFile[]>`
  - Query: `collection("tasks", taskId, "files")`, `orderBy("uploadedAt", "desc")`
- `addTaskFile({ taskId, uploadedBy, fileName, fileUrl, fileSize, mimeType })` — `addDoc`
  - Security rules verify uploader is in parent task's participants.
- `approveTaskFile(taskId, fileId, approverId)` — `updateDoc` with status `Approved`, `approvedBy`, `approvedAt`
- `rejectTaskFile(taskId, fileId, approverId, reason)` — `updateDoc` with status `Rejected`, `approvedBy`, `approvedAt`, `rejectionReason`
- `deleteTaskFile(taskId, fileId)` — `deleteDoc` (Admin or uploader)

### R2 File Upload
- `uploadFileToR2(file: File): Promise<string | null>`
  1. Call `httpsCallable('getR2UploadUrl')` with `fileName` and `contentType`.
  2. `fetch(presignedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': contentType } })`.
  3. Return `publicUrl` on HTTP 200.

---

## 8. Page & Route Map

| URL | Audience | Purpose |
|-----|----------|---------|
| `/login` | Public | Email/password login |
| `/admin/dashboard` | Admin | List of open tasks (all or created by me). Filter by status, priority, assignee. |
| `/admin/tasks/new` | Admin | Create new task form: title, description, priority, client select, multi-assignee select |
| `/admin/tasks/[taskId]` | Admin | Task workspace: details editor, status board, real-time chat, file list with approve/reject |
| `/admin/team` | Admin | User management table: create user modal, delete user button |
| `/admin/clients` | Admin | Client CRUD table |
| `/admin/reports` | Admin | Weekly reports (filter tasks by date range + status, export PDF or CSV) |
| `/employee/dashboard` | Employee | List of assigned open tasks |
| `/employee/tasks/[taskId]` | Employee | Task workspace: view details, update status, chat, upload files |

### Status Workflow UI

```
In Progress → Review → Approved → Completed
```

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| In Progress | Blue | Clock | Employee is working on the task |
| Review | Amber | Eye | Employee submitted for admin review |
| Approved | Green | Check circle | Admin approved the work |
| Completed | Gray | Shield check | Task is closed |

- **Employee** can move forward through statuses.
- **Admin** can set any status and close/reopen tasks.
- **Rejection**: Admin rejects → status goes back to `In Progress`.

---

## 9. Real-Time Patterns in Svelte

Firestore `onSnapshot` maps naturally to Svelte runes. Example task list store:

```typescript
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "$lib/firebase";

export function myTasksStream(userId: string) {
  let tasks = $state<Task[]>([]);
  let loading = $state(true);
  let error = $state<Error | null>(null);

  $effect(() => {
    const q = query(
      collection(db, "tasks"),
      where("participants", "array-contains", userId),
      where("isClosed", "==", false),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
      loading = false;
    }, (err) => {
      error = err;
      loading = false;
    });
    return unsub;
  });

  return {
    get tasks() { return tasks; },
    get loading() { return loading; },
    get error() { return error; },
  };
}
```

> **Cleanup**: Always return the `unsubscribe` function from `$effect` so Svelte auto-disposes Firestore listeners on component unmount.

---

## 10. Task Workspace UI Requirements

The task detail page (`/admin/tasks/[id]` and `/employee/tasks/[id]`) is the most complex screen. It must contain:

1. **Task Header**: Title (editable by admin), description, priority badge, status badge, assignees list.
2. **Status Control**:
   - Dropdown showing the 4 statuses (In Progress, Review, Approved, Completed).
   - Employee: can update status (respecting Firestore rule limitations).
   - Admin: can set any status and close/reopen.
3. **Chat Panel**:
   - Scrollable message list (oldest at top, newest at bottom).
   - Auto-scroll to bottom on new messages.
   - Input box + send button.
   - Optional: file attachment sends a message with `fileUrl`.
4. **Files Panel**:
   - List of uploaded files with name, size, uploader, status badge.
   - Upload button: triggers the R2 presigned flow.
   - Admin/Assignor: Approve / Reject buttons + rejection reason modal.
   - Uploader: can see approval status.
5. **Participants Sidebar** (optional): Show assignor + assignee avatars/names.

---

## 11. Notification Strategy (Web)

The mobile app uses FCM. For the web client:

1. **In-app real-time**: Firestore listeners provide live task/message/file updates. This covers most UX needs.
2. **Browser push (optional)**: If implementing FCM web push:
   - Request notification permission.
   - Register service worker (`firebase-messaging-sw.js`).
   - Store web FCM token in `users/{uid}.fcmTokens` array (same field mobile uses).
   - The existing Cloud Functions will send to web tokens automatically (they broadcast to all tokens in the array).

> For v1, in-app real-time via Firestore is sufficient. Browser push can be deferred.

---

## 12. Key Implementation Rules

1. **Always include `participants` array-contains in task queries.** Firestore security rules require it.
2. **Never create users directly via Firebase Auth SDK from the client.** Always use the `createUser` Cloud Function to ensure the Firestore user doc is created.
3. **Never delete users directly.** Use the `deleteUser` Cloud Function.
4. **R2 uploads are two-step**: get presigned URL from Cloud Function → PUT file bytes → store `publicUrl` in Firestore.
5. **Rebuild `participants` array whenever `assigneeIds` changes.**
6. **Use Firestore server timestamps** for `createdAt` and `updatedAt` where possible (`serverTimestamp()`), or use client-side `new Date()` consistently.
7. **Only admins can delete tasks.** Use `deleteTopLevelTask(taskId)` with proper authorization checks.
8. **File upload metadata is written by the client**, not the Cloud Function. The Cloud Function only generates presigned URLs.
9. **Subcollections (messages, files) use parent task's participants** for access control via `getTaskParticipants(taskId)` in security rules.
10. **Guard all Firestore streams with auth check.** Stores are initialized eagerly at module level. Before subscribing to any stream, check `auth.currentUser`. If null, skip the subscription and log a warning. This prevents CORS/access control errors when modules load before auth is ready.

```typescript
export function allUsersStream(onData, onError) {
  if (!auth.currentUser) {
    console.warn('[Firestore] Skipped "users" stream — not authenticated');
    return () => {};
  }
  return onSnapshot(
    collection(db, 'users'),
    (snap) => { /* ... */ },
    (err) => {
      console.error('[Firestore] Error in "users" collection:', err.message);
      onError?.(err);
    }
  );
}
```

11. **Log collection name on Firestore errors.** Every `onSnapshot` error handler must include the collection path in the console error. Format: `[Firestore] Error in "<collection>" collection: <message>`. This makes debugging real-time listener failures much easier.

---

## 13. Cloudflare R2 Setup

### Creating an R2 Bucket

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → Sign up / Log in
2. Left sidebar → **R2 Object Storage**
3. Click **Create bucket**
   - Bucket name: `tortietask-files` (or your preference)
   - Region: **Automatic** (or pick nearest)
4. Click **Create bucket**

### Enable Public Access

1. Click your bucket → **Settings**
2. Under **Public Access** → click **Allow Access**
3. Confirm → you'll get a public URL like: `https://pub-<hash>.r2.dev`

### Create API Credentials

1. R2 sidebar → **Manage R2 API Tokens**
2. Click **Create API token**
   - Token name: `tortietask-presigned`
   - Permissions: **Object Read & Write**
   - Specify bucket: `tortietask-files`
3. Click **Create API Token**
4. Copy the **Access Key ID** and **Secret Access Key**

### Cloud Function for Presigned URLs

```typescript
// functions/src/r2.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const getR2UploadUrl = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in");
  }

  const { fileName, contentType } = request.data;
  const timestamp = Date.now();
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `uploads/${request.auth.uid}/${timestamp}_${sanitized}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  return { presignedUrl, publicUrl, key };
});
```

### Environment Variables for Functions

```bash
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=tortietask-files
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

---

## 14. Environment Variables

Create a `.env` file (do NOT commit):

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## 15. Migration / Compatibility Notes

- The web app reads from the **same** Firestore database as the Flutter app.
- Any schema changes (new fields, new collections) must be coordinated with the mobile team.
- The legacy nested path `clients/{cid}/projects/{pid}/tasks` is **read-only** from the web app. Do not write new data there.
- All new features (tasks, messages, files) must use the top-level `tasks` collection.

---

*End of Document*
