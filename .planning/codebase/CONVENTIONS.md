# Coding Conventions

**Analysis Date:** 2026-05-01

## Naming Patterns

**Files:**
- **Components:** PascalCase `.svelte` files — e.g. `TaskCard.svelte`, `ChatPanel.svelte`, `StatusBadge.svelte`
- **Stores:** camelCase with `.svelte.ts` extension — e.g. `tasks.svelte.ts`, `auth.svelte.ts`, `messages.svelte.ts`
- **Services:** snake_case `.ts` files — e.g. `firebase_service.ts`
- **Models/Utils:** camelCase `.ts` files — e.g. `models.ts`, `utils.ts`, `firebase.ts`
- **Routes:** SvelteKit filesystem conventions (`+page.svelte`, `+layout.svelte`, `+layout.ts`, `[taskId]` dynamic params)

**Functions:**
- camelCase for all functions — `signIn`, `logOut`, `createTopLevelTask`, `formatFileSize`
- Handler functions prefixed with `handle` — `handleSubmit`, `handleDelete`, `handleFileUpload`, `handleLogout`
- Store factories use `create` prefix — `createTasksStore`, `createUsersStore`, `createClientsStore`, `createMessagesStore`
- Stream/snapshot functions use `Stream` suffix — `myAssignedTasksStream`, `allUsersStream`, `clientsStream`, `taskMessagesStream`

**Variables:**
- camelCase for all variables — `filterStatus`, `selectedAssignees`, `newMessage`
- Boolean state prefixed with action context — `loading`, `showCreateModal`, `deleteConfirmOpen`, `uploadLoading`
- Error state named `error` or `createError` — always typed as `string | null` or `string`

**Types/Interfaces:**
- PascalCase for interfaces and types — `User`, `Client`, `Task`, `TaskMessage`, `TaskFile`
- Union string literal types for enums — `UserRole = 'Admin' | 'Employee'`, `TaskStatus = 'To Do' | 'In Progress' | ...`, `FileStatus = 'Pending' | 'Approved' | 'Rejected'`

## Code Style

**Formatting:**
- Tool: Prettier (`prettier --write .`)
- Config: `.prettierrc`
- Key settings:
  - `useTabs: true` — use tabs for indentation
  - `singleQuote: true` — single quotes for strings
  - `trailingComma: "none"` — no trailing commas
  - `printWidth: 100` — 100-character line width
  - Plugins: `prettier-plugin-svelte`, `prettier-plugin-tailwindcss`
  - Svelte override parser enabled for `*.svelte` files
  - Tailwind stylesheet: `./src/routes/layout.css`

**Linting:**
- Tool: ESLint v10 with flat config (`eslint.config.js`)
- Key rules:
  - `@eslint/js` recommended rules
  - `typescript-eslint` recommended rules
  - `eslint-plugin-svelte` recommended + prettier
  - `eslint-config-prettier` to avoid conflicts
  - `no-undef: 'off'` (disabled per typescript-eslint recommendation)
  - Svelte files parsed with `typescript-eslint` parser + `svelteConfig`
- Run: `npm run lint` (checks both Prettier and ESLint)

**Type Checking:**
- Tool: `svelte-check` with `tsconfig.json`
- Run: `npm run check` (syncs SvelteKit then runs svelte-check)
- Strict mode enabled (`"strict": true`)
- `checkJs: true` — JavaScript files also checked

## Import Organization

**Order (observed consistently):**
1. Svelte/SvelteKit imports (`svelte`, `$app/navigation`, `$app/stores`)
2. Library code via `$lib` alias (`$lib/firebase`, `$lib/models`, `$lib/services/firebase_service`, `$lib/stores/auth.svelte`)
3. Component imports (relative `./` paths for sibling components)
4. Firebase SDK imports (`firebase/auth`, `firebase/firestore`, `firebase/functions`)

**Path Aliases:**
- `$lib` → `src/lib/` (SvelteKit built-in, configured via `$lib/index.ts`)
- Import from `$lib/models`, `$lib/firebase`, `$lib/utils`, `$lib/services/...`, `$lib/stores/...`, `$lib/components/...`
- Relative imports (`./`) used only for sibling components within `src/lib/components/`

**Import Style:**
- Named imports for Firebase SDK: `import { signInWithEmailAndPassword, signOut } from 'firebase/auth'`
- Type-only imports with `type` keyword: `import type { User, Task } from '$lib/models'`
- Single re-export when aliasing: `import type { User as FirebaseUser } from 'firebase/auth'`

## Error Handling

**Patterns:**

1. **try/catch/finally in event handlers** — Primary pattern for async operations:
   ```typescript
   // src/routes/login/+page.svelte:22-28
   async function handleSubmit(e: Event) {
       e.preventDefault();
       error = '';
       loading = true;
       try {
           await signIn(email, password);
       } catch (err: unknown) {
           error = err instanceof Error ? err.message : 'Login failed';
       } finally {
           loading = false;
       }
   }
   ```

2. **Inline error state** — Page-level `error` state variable displayed in template:
   ```svelte
   {#if error}
       <p class="text-sm text-danger">{error}</p>
   {/if}
   ```

3. **Store error handling** — Stores expose `error` state from stream callbacks:
   ```typescript
   // src/lib/stores/tasks.svelte.ts:29-33
   (err) => {
       console.error('tasks stream error:', err);
       loading = false;
       error = err.message;
   }
   ```

4. **Service-layer errors** — Services log to console but propagate to callers:
   ```typescript
   // src/lib/services/firebase_service.ts:341-343
   if (!response.ok) {
       console.error('R2 upload failed', response.status, await response.text());
       return null;
   }
   ```

5. **Null returns** — Service functions return `null` for not-found or failed operations:
   ```typescript
   // src/lib/services/firebase_service.ts:53-56
   export async function getUser(uid: string): Promise<User | null> {
       const snap = await getDoc(doc(db, 'users', uid));
       return snap.exists() ? ({ id: snap.id, ...snap.data() } as User) : null;
   }
   ```

**Error message extraction:**
- Always use: `err instanceof Error ? err.message : 'Fallback message'`
- Never use: bare `catch (err)` without type narrowing

## Logging

**Framework:** `console.error` / `console.log` only (no logging library)

**Patterns:**
- `console.error` for stream errors in stores: `console.error('tasks stream error:', err)`
- `console.error` for upload failures: `console.error('R2 upload failed', response.status, ...)`
- No structured logging, no log levels, no remote logging

## Comments

**When to Comment:**
- Section dividers in service files: `// ─── Auth ───`, `// ─── Users ───`, `// ─── Tasks ───`
- Configuration comments in config files (tsconfig, svelte.config)
- No JSDoc/TSDoc used anywhere — types are self-documenting via TypeScript interfaces

**Comment Style:**
- Minimal comments — code is expected to be self-explanatory
- Section separators use em-dash pattern: `// ─── Section Name ───`

## Svelte 5 Conventions (Runes Mode)

**Props:**
- Always use `$props()` with inline type annotations:
  ```svelte
  let { task, usersMap, onClick }: { task: Task; usersMap: Map<string, User>; onClick: () => void } = $props();
  ```

**State:**
- Use `$state()` for reactive local state: `let loading = $state(true)`
- Use `$state` for arrays and objects: `let tasks = $state<Task[]>([])`

**Derived:**
- Use `$derived()` for computed values: `const assignees = $derived(task.assigneeIds.map(...))`
- Use `$derived.by()` for complex derivations with multi-line logic

**Effects:**
- Use `$effect()` for side effects (subscriptions, navigation, cleanup):
  ```svelte
  $effect(() => {
      const unsub = topLevelTaskStream(taskId, (t) => { task = t; loading = false; });
      return unsub; // cleanup function
  });
  ```

**Bindable Props:**
- Use `$bindable()` for two-way binding: `open = $bindable(false)`

**Snippets:**
- Use `Snippet` type from `svelte` for slot-like composition:
  ```svelte
  import type { Snippet } from 'svelte';
  let { children, footer }: { children: Snippet; footer: Snippet } = $props();
  ```
- Render snippets with `{@render children()}`

**Store Pattern (Svelte 5 Runes):**
- Stores use module-level `$state` with getter-based exports (NOT Svelte stores):
  ```typescript
  // src/lib/stores/auth.svelte.ts
  let firebaseUser = $state<FirebaseUser | null>(null);
  export const authStore = {
      get user() { return firebaseUser; },
      get loading() { return loading; }
  };
  ```
- Factory stores return object with getters + start/stop lifecycle:
  ```typescript
  // src/lib/stores/tasks.svelte.ts
  export function createTasksStore() {
      let tasks = $state<Task[]>([]);
      // ...
      return { get tasks() { return tasks; }, start, stop };
  }
  ```

## Component Design

**Props Interface:**
- Define props inline in `$props()` call — no separate Props interface
- Required props have no default: `{ task: Task; onClick: () => void }`
- Optional props use defaults: `{ size?: 'sm' | 'md' | 'lg' } = $props()` with `let { size = 'md' } = ...`

**Component Size:**
- Small, focused components: 13–132 lines
- Single-responsibility: `StatusBadge` only renders status, `PriorityBadge` only renders priority
- Page components are larger (up to 220 lines) and handle data fetching + composition

**Event Handling:**
- Pass callback props: `onClick: () => void`, `onApprove: (fileId: string) => void`
- Use `onsubmit` for forms, `onclick` for buttons
- Always `e.preventDefault()` on form submissions

## CSS/Styling

**Framework:** Tailwind CSS v4 with `@tailwindcss/vite` plugin
- Forms plugin: `@tailwindcss/forms`
- Typography plugin: `@tailwindcss/typography`

**Design System:**
- Custom theme colors defined in `src/routes/layout.css` via `@theme` block
- Use semantic color tokens: `text-text`, `bg-surface`, `border-border`, `text-accent`, `bg-danger`
- Never use raw Tailwind colors directly — always use theme tokens

**Class Composition:**
- Conditional classes via ternary: `class="... {condition ? 'active-class' : 'default-class'}"`
- Helper function for complex class merging: `classNames(...)` from `$lib/utils`
- Tailwind classes are auto-sorted by `prettier-plugin-tailwindcss`

**Responsive:**
- Mobile-first with `sm:`, `md:`, `lg:` breakpoints
- Consistent responsive pattern: `px-4 pt-18 pb-6 md:px-8 md:py-8 md:pt-8`

**Font Sizing:**
- Use pixel-based sizes for small text: `text-[11px]`, `text-[13px]`
- Use standard sizes for headings: `text-sm`, `text-base`, `text-lg`
- Labels: `text-[11px] font-medium tracking-wider uppercase text-text-muted`
- Body text: `text-[13px]` or `text-sm`

## Module Design

**Exports:**
- Service functions: individual named exports (no default export, no barrel)
- Stores: named export of object literal (`export const authStore`) or factory function (`export function createTasksStore()`)
- Models: individual named exports (`export interface User`, `export type TaskStatus`)
- Utils: individual named exports (`export function formatDate`, `export function classNames`)

**Barrel Files:**
- `src/lib/index.ts` exists but is empty — all imports use direct paths like `$lib/models`, `$lib/firebase`

**Service Layer:**
- Single service file: `src/lib/services/firebase_service.ts` (346 lines)
- Organized by domain sections with comment dividers: Auth, Users, Clients, Tasks, Messages, Files, R2 File Upload
- All Firebase operations go through this service — components never call Firebase SDK directly

---

*Convention analysis: 2026-05-01*
