# Testing Patterns

**Analysis Date:** 2026-05-01

## Test Framework

**Runner:**
- **No test framework is configured.** The project has zero test files, no test runner dependency, and no test-related scripts in `package.json`.
- No `vitest`, `jest`, `@testing-library/svelte`, `playwright`, `cypress`, or any other testing dependency present.
- `package.json` scripts: `dev`, `build`, `preview`, `prepare`, `check`, `check:watch`, `lint`, `format` — no `test` script.

**Config:**
- No `vitest.config.ts`, `jest.config.*`, `playwright.config.*`, or equivalent exists.

**Run Commands:**
```bash
# No test commands available. Closest to testing:
npm run check          # Type-checking via svelte-check (not a test runner)
npm run lint           # Lint + format check (not a test runner)
```

## Test File Organization

**Location:**
- Not applicable — no test files exist in the codebase.

**Naming:**
- Not applicable.

**Structure:**
- Not applicable.

## Test Structure

**Suite Organization:**
- Not applicable — no test suites exist.

**Patterns:**
- Not applicable.

## Mocking

**Framework:** Not applicable.

**Patterns:**
- Not applicable.

## Fixtures and Factories

**Test Data:**
- Not applicable.

**Location:**
- Not applicable.

## Coverage

**Requirements:** None — no coverage tooling configured.

**View Coverage:**
```bash
# No coverage commands available
```

## Test Types

**Unit Tests:**
- None exist.
- To add: Install `vitest` + `@testing-library/svelte` + `jsdom`. Create `vitest.config.ts` extending Vite config. Place tests as `*.test.ts` alongside source files in `src/lib/`.
- Priority targets for unit tests:
  - `src/lib/utils.ts` — pure functions (`formatDate`, `formatFileSize`, `classNames`, `comparePriority`)
  - `src/lib/models.ts` — type validation logic (if added)
  - `src/lib/services/firebase_service.ts` — service functions with Firebase mocks

**Integration Tests:**
- None exist.
- To add: Test store + service interactions with Firebase emulator or mocked Firestore.

**E2E Tests:**
- None exist.
- To add: Install `@playwright/test`. Create `playwright.config.ts`. Test full user flows: login, task creation, task status changes, file upload, chat messaging.

## Recommended Test Setup

If tests are to be added, follow this stack:

**Framework Stack:**
```bash
npm install -D vitest @testing-library/svelte @testing-library/jest-dom jsdom
```

**Config (`vitest.config.ts`):**
```typescript
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
    plugins: [sveltekit()],
    test: {
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        environment: 'jsdom',
        setupFiles: ['./src/tests/setup.ts']
    }
});
```

**Add to `package.json` scripts:**
```json
{
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
}
```

## Testing Gaps (Critical)

The following areas have no automated verification and represent the highest risk:

**Pure Utility Functions (`src/lib/utils.ts`):**
- `formatDate()` — handles null, Date objects, and Firestore Timestamps. No tests verify edge cases (null, undefined, invalid seconds).
- `formatFileSize()` — handles 0 bytes, KB, MB, GB boundaries. No tests.
- `classNames()` — filters falsy values. No tests for mixed types.
- `comparePriority()` — compares High/Medium/Low with fallback. No tests for unknown priorities.

**Store Logic (`src/lib/stores/*.svelte.ts`):**
- `createTasksStore()` — sorts by priority then by date. No tests verify sort order.
- `createMessagesStore()` — manages stream lifecycle. No tests verify cleanup on `stop()`.
- `authStore` — manages auth state transitions. No tests verify the unsubscribe-on-user-change logic.

**Service Functions (`src/lib/services/firebase_service.ts`):**
- All 30+ service functions call Firebase SDK directly. No tests verify:
  - Correct Firestore query construction (e.g., `where('participants', 'array-contains', userId)`)
  - Data mapping from Firestore docs to typed interfaces
  - Error handling paths
  - The `participants` array derivation in `createTopLevelTask` and `updateTopLevelTask`

**Component Behavior:**
- No component rendering tests
- No interaction tests (button clicks, form submissions, modal open/close)
- No accessibility tests

**Auth Guard Logic:**
- `+layout.svelte` redirects unauthenticated users to `/login`
- `admin/+layout.svelte` redirects non-admins to `/employee/dashboard`
- `employee/+layout.svelte` redirects non-employees to `/admin/dashboard`
- None of these redirects are tested

**Form Validation:**
- Login form requires email + password
- Task creation requires title + at least one assignee
- User creation requires name + email + password + role
- No validation tests exist

---

*Testing analysis: 2026-05-01*
