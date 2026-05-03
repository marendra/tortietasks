# Codebase Structure

**Analysis Date:** 2026-05-01

## Directory Layout

```
tortietaskweb/
├── .env                    # Firebase env vars (VITE_FIREBASE_*) — NOT committed
├── .prettierrc             # Prettier config
├── .prettierignore         # Prettier ignore rules
├── eslint.config.js        # ESLint flat config
├── firestore.rules         # Firestore security rules
├── package.json            # Dependencies and scripts
├── package-lock.json       # Lockfile
├── svelte.config.js        # SvelteKit config (adapter-auto, runes mode)
├── tsconfig.json           # TypeScript config (extends .svelte-kit/tsconfig)
├── vite.config.ts          # Vite config (tailwindcss + sveltekit plugins)
├── static/                 # Static assets served at root
│   └── robots.txt
├── src/
│   ├── app.html            # HTML shell template
│   ├── app.d.ts            # App-level TypeScript declarations
│   ├── lib/                # Shared library code ($lib alias)
│   │   ├── index.ts        # Barrel file (empty, placeholder for $lib alias)
│   │   ├── firebase.ts     # Firebase app initialization + service exports
│   │   ├── models.ts       # TypeScript interfaces for all domain types
│   │   ├── utils.ts        # Pure helper functions
│   │   ├── assets/         # Static assets imported in code
│   │   │   └── favicon.svg
│   │   ├── components/     # Reusable Svelte UI components
│   │   │   ├── ChatMessage.svelte
│   │   │   ├── ChatPanel.svelte
│   │   │   ├── ConfirmModal.svelte
│   │   │   ├── FileList.svelte
│   │   │   ├── FileRow.svelte
│   │   │   ├── LoadingSpinner.svelte
│   │   │   ├── PriorityBadge.svelte
│   │   │   ├── Sidebar.svelte
│   │   │   ├── StatusBadge.svelte
│   │   │   ├── TaskCard.svelte
│   │   │   ├── TaskHeader.svelte
│   │   │   └── UserAvatar.svelte
│   │   ├── services/       # Firebase API layer
│   │   │   └── firebase_service.ts
│   │   └── stores/         # Svelte 5 reactive state stores
│   │       ├── auth.svelte.ts
│   │       ├── clients.svelte.ts
│   │       ├── files.svelte.ts
│   │       ├── messages.svelte.ts
│   │       ├── tasks.svelte.ts
│   │       └── users.svelte.ts
│   └── routes/             # SvelteKit file-based routing
│       ├── +layout.ts      # Root layout config (SSR disabled)
│       ├── +layout.svelte  # Root layout (auth guard, loading state)
│       ├── +page.svelte    # Root page (role-based redirect)
│       ├── layout.css      # Global styles + Tailwind theme
│       ├── login/          # Login route
│       │   └── +page.svelte
│       ├── admin/          # Admin-only routes
│       │   ├── +layout.svelte    # Admin layout (sidebar, role guard)
│       │   ├── dashboard/
│       │   │   └── +page.svelte  # Task grid with filters
│       │   ├── tasks/
│       │   │   ├── new/
│       │   │   │   └── +page.svelte  # Create task form
│       │   │   └── [taskId]/
│       │   │       └── +page.svelte  # Task detail (chat, files, manage)
│       │   ├── team/
│       │   │   └── +page.svelte  # User management (CRUD)
│       │   ├── clients/
│       │   │   └── +page.svelte  # Client management (CRUD)
│       │   └── reports/
│       │       └── +page.svelte  # Task reports + CSV export
│       └── employee/       # Employee-only routes
│           ├── +layout.svelte    # Employee layout (sidebar, role guard)
│           ├── dashboard/
│           │   └── +page.svelte  # Assigned tasks grid
│           └── tasks/
│               └── [taskId]/
│                   └── +page.svelte  # Task detail (chat, files, status)
└── .planning/              # GSD planning docs
    └── codebase/
        ├── ARCHITECTURE.md
        └── STRUCTURE.md
```

## Directory Purposes

**`src/lib/`:**
- Purpose: Shared library code accessible via `$lib` import alias
- Contains: Components, stores, services, models, utilities, assets
- Key files: `firebase.ts`, `models.ts`, `utils.ts`, `index.ts`

**`src/lib/components/`:**
- Purpose: Reusable presentational Svelte components
- Contains: 12 `.svelte` files — UI building blocks with no business logic
- Key files: `TaskCard.svelte`, `ChatPanel.svelte`, `Sidebar.svelte`, `FileList.svelte`

**`src/lib/stores/`:**
- Purpose: Svelte 5 reactive state management using `$state` runes
- Contains: 6 `.svelte.ts` files — auth, tasks, clients, users, messages, files
- Key files: `auth.svelte.ts` (singleton), `tasks.svelte.ts` (factory pattern)

**`src/lib/services/`:**
- Purpose: Firebase SDK wrapper — all external API calls
- Contains: Single file `firebase_service.ts` with flat exported functions
- Key files: `firebase_service.ts`

**`src/routes/`:**
- Purpose: SvelteKit file-based routing — pages and layouts
- Contains: Route pages (`+page.svelte`), layouts (`+layout.svelte`), config (`+layout.ts`)
- Key files: `+layout.ts` (SSR disabled), `+layout.svelte` (auth guard)

**`src/routes/admin/`:**
- Purpose: Admin-only section with full management capabilities
- Contains: Dashboard, task CRUD, team management, client management, reports
- Key files: `+layout.svelte` (admin role guard + sidebar)

**`src/routes/employee/`:**
- Purpose: Employee-only section with limited task interaction
- Contains: Dashboard (assigned tasks), task detail (view/update status, chat, upload)
- Key files: `+layout.svelte` (employee role guard + sidebar)

**`static/`:**
- Purpose: Files served at the root URL without processing
- Contains: `robots.txt`
- Key files: `robots.txt`

**`src/lib/assets/`:**
- Purpose: Static assets that need to be imported in code (for Vite hashing)
- Contains: `favicon.svg`
- Key files: `favicon.svg`

## Key File Locations

**Entry Points:**
- `src/routes/+page.svelte`: Root URL — redirects to role dashboard or login
- `src/routes/login/+page.svelte`: Login form — email/password authentication
- `src/routes/admin/dashboard/+page.svelte`: Admin main view — task grid
- `src/routes/employee/dashboard/+page.svelte`: Employee main view — assigned tasks

**Configuration:**
- `svelte.config.js`: SvelteKit config — adapter-auto, runes mode enforcement
- `vite.config.ts`: Vite plugins — tailwindcss, sveltekit
- `tsconfig.json`: TypeScript strict mode, bundler module resolution
- `eslint.config.js`: ESLint flat config with svelte + prettier plugins
- `.prettierrc`: Prettier formatting config
- `firestore.rules`: Firestore security rules (authorization layer)

**Core Logic:**
- `src/lib/firebase.ts`: Firebase initialization — exports `auth`, `db`, `functions`
- `src/lib/services/firebase_service.ts`: All Firebase operations (346 lines)
- `src/lib/models.ts`: Domain type definitions (69 lines)
- `src/lib/utils.ts`: Pure utility functions (31 lines)

**State Management:**
- `src/lib/stores/auth.svelte.ts`: Auth singleton — user, profile, role, loading
- `src/lib/stores/tasks.svelte.ts`: Task list factory — start/stop lifecycle
- `src/lib/stores/users.svelte.ts`: User list singleton — all users stream
- `src/lib/stores/clients.svelte.ts`: Client list singleton — all clients stream
- `src/lib/stores/messages.svelte.ts`: Message list factory — per-task stream
- `src/lib/stores/files.svelte.ts`: File list factory — per-task stream

**Testing:**
- No test files detected — no `*.test.*`, `*.spec.*`, no test framework configured

**Global Styles:**
- `src/routes/layout.css`: Tailwind imports + custom `@theme` design tokens

## Naming Conventions

**Files:**
- Svelte components: PascalCase (e.g., `TaskCard.svelte`, `ChatPanel.svelte`)
- Store files: camelCase with `.svelte.ts` extension (e.g., `auth.svelte.ts`, `tasks.svelte.ts`)
- Service files: snake_case (e.g., `firebase_service.ts`)
- Utility/model files: camelCase (e.g., `utils.ts`, `models.ts`)
- Route files: SvelteKit convention (`+page.svelte`, `+layout.svelte`, `+layout.ts`)
- Dynamic route segments: `[paramName]` (e.g., `[taskId]`)

**Directories:**
- Route directories: lowercase (e.g., `admin/`, `employee/`, `login/`, `tasks/`, `dashboard/`)
- Library directories: lowercase (e.g., `components/`, `stores/`, `services/`, `assets/`)

**Variables/Functions:**
- Functions: camelCase (e.g., `signIn`, `createTopLevelTask`, `formatDate`)
- Types/Interfaces: PascalCase (e.g., `Task`, `User`, `TaskStatus`, `TaskPriority`)
- Constants: camelCase for module-level state (e.g., `firebaseUser`, `loading`)
- Store exports: camelCase with `Store` suffix (e.g., `authStore`, `createTasksStore`)

## Where to Add New Code

**New Feature (Admin Page):**
- Route page: `src/routes/admin/[feature-name]/+page.svelte`
- Add nav link in: `src/routes/admin/+layout.svelte` (line 21-26, `navItems` array)

**New Feature (Employee Page):**
- Route page: `src/routes/employee/[feature-name]/+page.svelte`
- Add nav link in: `src/routes/employee/+layout.svelte`

**New Reusable Component:**
- Implementation: `src/lib/components/ComponentName.svelte`
- Use PascalCase filename, `$props()` for inputs, callbacks for outputs
- Pattern: `let { prop1, prop2, onAction } = $props()`

**New Store:**
- Singleton (global data): `src/lib/stores/entityname.svelte.ts` — follow `clients.svelte.ts` pattern
- Factory (per-component): `src/lib/stores/entityname.svelte.ts` — follow `tasks.svelte.ts` pattern with `start()`/`stop()`

**New Firebase Operation:**
- Add function to: `src/lib/services/firebase_service.ts`
- Group by domain section with `// ─── Section Name ───` comment header

**New Domain Type:**
- Add interface/type to: `src/lib/models.ts`
- Export the type, import where needed

**New Utility Function:**
- Add to: `src/lib/utils.ts`
- Export as named function

**New Static Asset:**
- Importable in code: `src/lib/assets/assetname.ext`
- Served at root URL: `static/assetname.ext`

## Special Directories

**`.svelte-kit/`:**
- Purpose: SvelteKit generated types and config
- Generated: Yes (by `svelte-kit sync`)
- Committed: No (in `.gitignore`)

**`node_modules/`:**
- Purpose: Installed npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No (in `.gitignore`)

**`.opencode/`:**
- Purpose: OpenCode AI tooling config
- Generated: No
- Committed: Yes

**`.planning/`:**
- Purpose: GSD planning and codebase analysis documents
- Generated: No
- Committed: Yes

**`.vscode/`:**
- Purpose: VS Code workspace settings
- Generated: No
- Committed: Yes

**`.idea/`:**
- Purpose: JetBrains IDE settings
- Generated: No
- Committed: Yes

## Import Patterns

**Path Alias:**
- `$lib` → `src/lib/` (SvelteKit built-in)
- Usage: `import { authStore } from '$lib/stores/auth.svelte'`
- Usage: `import type { Task } from '$lib/models'`

**SvelteKit App Imports:**
- `$app/stages` → `import { page } from '$app/stores'`
- `$app/navigation` → `import { goto } from '$app/navigation'`

**Firebase Imports:**
- `firebase/app` → `initializeApp`, `getApps`, `FirebaseApp`
- `firebase/auth` → `signInWithEmailAndPassword`, `signOut`, `onAuthStateChanged`
- `firebase/firestore` → `collection`, `doc`, `getDoc`, `addDoc`, `updateDoc`, `onSnapshot`, etc.
- `firebase/functions` → `httpsCallable`

**Component Imports (relative):**
- Within `src/lib/components/`, components import each other with relative paths
- Example: `import StatusBadge from './StatusBadge.svelte'` (in `TaskCard.svelte`)

---

*Structure analysis: 2026-05-01*
