# TortieTask Architecture

Internal task-based chat application for companies built with Flutter, connecting Firebase backend services with a Riverpod-based state management layer.

## Tech Stack

- **Frontend**: Flutter 3.x with Dart
- **State Management**: flutter_riverpod
- **Routing**: go_router (with auth-based redirects)
- **Backend**: Firebase (Auth, Firestore, Cloud Functions)
- **File Storage**: Cloudflare R2 (via presigned URLs from Cloud Functions)
- **PDF**: pdf + printing packages for report generation
- **HTTP**: http package for R2 uploads

## Firebase Structure

### Authentication
Firebase Authentication handles user identity. Users sign in via email/password and receive a UID that serves as their primary identifier across the system.

### Firestore Collections

```
users/{userId}
  - name: string
  - role: "Admin" | "Employee"

clients/{clientId}
  - clientName: string

tasks/{taskId}                    # Top-level task collection (Task-Centric)
  - title: string
  - description: string
  - status: "To Do" | "In Progress" | "Review" | "Approved - Ready to Send" | "Completed"
  - priority: "High" | "Medium" | "Low"
  - isClosed: boolean
  - assignorId: string           # User who created/gave the task
  - assigneeIds: string[]         # Users assigned to the task (multi-assignee)
  - clientId: string | null       # Optional client association
  - createdAt: timestamp
  - updatedAt: timestamp | null

tasks/{taskId}/messages/{messageId}  # Task chat messages
  - taskId: string
  - senderId: string
  - text: string
  - fileUrl: string | null
  - createdAt: timestamp

tasks/{taskId}/files/{fileId}        # Task files with approval workflow
  - taskId: string
  - uploadedBy: string
  - fileName: string
  - fileUrl: string
  - fileSize: number
  - mimeType: string
  - status: "Pending" | "Approved" | "Rejected"
  - uploadedAt: timestamp
  - approvedAt: timestamp | null
  - approvedBy: string | null
  - rejectionReason: string | null
```

**Note**: The old nested task structure under `clients/{clientId}/projects/{projectId}/tasks/{taskId}` still exists but is being phased out in favor of the top-level `tasks` collection.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│  ┌─────────────┐ ┌─────────────┐ ┌───────────────────────┐  │
│  │   Screens   │ │   Widgets   │ │  go_router (routing)  │  │
│  └─────────────┘ └─────────────┘ └───────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    State Layer                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Riverpod Providers                     │    │
│  │  - authStateProvider, currentUserModelProvider      │    │
│  │  - myAssignedTasksStreamProvider (employee tasks)   │    │
│  │  - myCreatedTasksStreamProvider (manager tasks)      │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                   Service Layer                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              FirebaseService                         │    │
│  │  - Auth operations (signIn, signOut, currentUser)   │    │
│  │  - Firestore CRUD (tasks, users, clients)            │    │
│  │  - Cloud Functions (createUser, deleteUser)          │    │
│  │  - File uploads to Firebase Storage                 │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    Firebase Layer                           │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │
│  │    Auth    │ │ Firestore  │ │  Storage  │ │ Functions │  │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Models

### UserModel
| Field | Type | Description |
|-------|------|-------------|
| id | String | Firebase Auth UID |
| name | String | Display name |
| role | UserRole | Admin or Employee |

### TaskModel
| Field | Type | Description |
|-------|------|-------------|
| id | String | Firestore document ID |
| title | String | Task title |
| description | String | Task details |
| status | TaskStatus | Current workflow status |
| priority | TaskPriority | High/Medium/Low |
| isClosed | bool | Whether task is closed |
| assignorId | String | UID of task creator |
| assigneeIds | List<String> | UIDs of assigned users |
| clientId | String? | Optional client reference |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime? | Last update timestamp |

### Enums

**UserRole**: `Admin`, `Employee`

**TaskStatus**: `todo` → `inProgress` → `review` → `approvedReadyToSend` → `completed`

**TaskPriority**: `high` (sortOrder: 0), `medium` (sortOrder: 1), `low` (sortOrder: 2)

**FileStatus**: `pending`, `approved`, `rejected`

## Key Providers

| Provider | Type | Description |
|----------|------|-------------|
| `firebaseServiceProvider` | Provider | Singleton FirebaseService instance |
| `authStateProvider` | StreamProvider | Firebase Auth state changes |
| `currentUserModelProvider` | StreamProvider | Current user's Firestore document |
| `myAssignedTasksStreamProvider(uid)` | StreamProvider | Tasks assigned to user (employee view) |
| `myCreatedTasksStreamProvider(uid)` | StreamProvider | Tasks created by user (manager view) |
| `allUsersStreamProvider` | StreamProvider | All users for team management |
| `taskMessagesStreamProvider(taskId)` | StreamProvider | Chat messages for a task |
| `taskFilesStreamProvider(taskId)` | StreamProvider | Files uploaded to a task |

## Route Structure

| Path | Screen | Description |
|------|--------|-------------|
| `/login` | LoginScreen | User authentication |
| `/admin` | AdminDashboard | Manager/admin task view |
| `/employee` | EmployeeDashboard | Employee task view |
| `/task/:taskId` | TaskWorkspaceScreen | Task details and workspace |
| `/create-task` | CreateTaskScreen | Create new task |
| `/clients` | ClientProjectScreen | Client management |
| `/team` | TeamManagementScreen | Team/user management |
| `/reports` | WeeklyReportScreen | Weekly reports |

## Authentication Flow

1. User opens app → routed to `/login`
2. User enters credentials → Firebase Auth verifies
3. On success, `firebaseService.getUser(uid)` fetches Firestore user document
4. Role determined → redirects to `/admin` or `/employee`
5. Router's `redirect` callback handles auth state checks

## Cloud Functions

### createUser
- **Trigger**: Callable HTTPS
- **Auth Required**: Yes (Admin only)
- **Parameters**: email, password, name, role
- **Behavior**: Creates Firebase Auth user + Firestore user document

### deleteUser
- **Trigger**: Callable HTTPS
- **Auth Required**: Yes (Admin only)
- **Parameters**: userId
- **Behavior**: Deletes from Firebase Auth + Firestore
- **Restrictions**: Cannot delete self, cannot delete other admins

### getR2UploadUrl
- **Trigger**: Callable HTTPS
- **Auth Required**: Yes (any authenticated user)
- **Parameters**: fileName, contentType
- **Behavior**: Generates presigned PUT URL for Cloudflare R2
- **Returns**: `{presignedUrl, publicUrl, key}`

## Security Rules

### Firestore Rules (概览)
- Users can only read/write their own user document
- Tasks can be read by assignor and assignee
- Only admins can create/delete users
- Task mutations require either assignor or assignee role

## File Structure

```
lib/
├── main.dart                    # App entry, Firebase init, ProviderScope
├── firebase_options.dart        # Firebase platform config
├── models/
│   └── models.dart             # All data models and enums
├── services/
│   └── firebase_service.dart   # All Firestore/Auth/Storage operations
├── providers/
│   ├── providers.dart         # Riverpod providers
│   └── router.dart            # GoRouter configuration + ProjectTasksScreen
└── screens/
    ├── auth/
    │   └── login_screen.dart
    ├── dashboard/
    │   ├── admin_dashboard.dart
    │   └── employee_dashboard.dart
    ├── task_workspace/
    │   ├── task_workspace_screen.dart
    │   └── create_task_screen.dart
    ├── client_project/
    │   └── client_project_screen.dart
    ├── team/
    │   └── team_management_screen.dart
    └── reports/
        └── weekly_report_screen.dart
```

## Task Workflow

```
┌──────────┐    ┌─────────────┐    ┌────────┐    ┌────────────────────────┐    ┌───────────┐
│   To Do  │ →  │ In Progress │ →  │ Review │ →  │ Approved - Ready to Send │ →  │ Completed │
└──────────┘    └─────────────┘    └────────┘    └────────────────────────┘    └───────────┘
     ↑                                                                                   │
     │                                                                                   │
     └───────────────────── (reopen if needed) ─────────────────────────────────────────┘
```

## Future Considerations

- [x] Implement messages/chat for top-level tasks
- [x] File upload for tasks (Cloudflare R2 with approval workflow)
- [ ] Task comments/activity log
- [ ] Task deadlines/due dates
- [ ] Push notifications
- [ ] Task categories/tags
