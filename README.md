# TortieTask Web

Internal task-based chat application for companies — web client built with **SvelteKit** and **Firebase**.

## Overview

TortieTask enables teams to manage tasks with real-time chat, file sharing, and approval workflows. Two user roles:

| Role | Capabilities |
|------|-------------|
| **Admin** | Create/delete users, create tasks, assign employees, manage clients, approve/reject files, view all tasks, generate reports |
| **Employee** | View assigned tasks, update task status, chat in task threads, upload files for approval |

### Core Flow

1. Admin creates a task and assigns employees
2. Employees update task status through a 5-step workflow
3. Employees upload files; Admins approve or reject them
4. All participants chat in real-time within each task
5. Push notifications alert users about updates

### Status Workflow

```
To Do → In Progress → Review → Approved - Ready to Send → Completed
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | SvelteKit |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Svelte 5 runes (`$state`, `$derived`, `$effect`) |
| Backend | Firebase JS SDK v10+ (modular) |
| Auth | Firebase Authentication (email/password) |
| Database | Cloud Firestore |
| File Storage | Cloudflare R2 via presigned URLs |
| Notifications | Firebase Cloud Messaging (web push) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Firebase project (shared with TortieTask mobile app)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── lib/
│   ├── firebase.ts              # Firebase initialization
│   ├── models.ts                # TypeScript interfaces
│   ├── stores/                  # Svelte stores (auth, tasks, messages, files)
│   ├── services/                # Firestore/Auth/Functions operations
│   └── components/              # Reusable Svelte components
├── routes/
│   ├── +layout.svelte           # Root layout (auth guard, nav)
│   ├── login/                   # Login page
│   ├── admin/
│   │   ├── dashboard/           # Admin task list
│   │   ├── team/                # User management
│   │   ├── clients/             # Client CRUD
│   │   ├── reports/             # Weekly reports
│   │   └── tasks/
│   │       ├── new/             # Create task
│   │       └── [taskId]/        # Task workspace
│   └── employee/
│       ├── dashboard/           # Employee task list
│       └── tasks/[taskId]/      # Task workspace
└── app.html
```

## Route Map

| URL | Audience | Purpose |
|-----|----------|---------|
| `/login` | Public | Email/password login |
| `/admin/dashboard` | Admin | Open tasks overview with filters |
| `/admin/tasks/new` | Admin | Create new task |
| `/admin/tasks/[taskId]` | Admin | Task workspace (chat, files, status) |
| `/admin/team` | Admin | User management |
| `/admin/clients` | Admin | Client CRUD |
| `/admin/reports` | Admin | Weekly reports |
| `/employee/dashboard` | Employee | Assigned open tasks |
| `/employee/tasks/[taskId]` | Employee | Task workspace |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run check` | Type-check with svelte-check |
| `npm run lint` | Run Prettier + ESLint |
| `npm run format` | Auto-format with Prettier |

## Architecture

See [WEB_ARCHITECTURE.md](./WEB_ARCHITECTURE.md) for full architecture documentation including:

- Database schema (Firestore collections & documents)
- Security rules
- Cloud Functions
- Service layer API
- Real-time patterns
- File upload flow (R2 presigned URLs)
