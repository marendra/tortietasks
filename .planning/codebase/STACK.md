# Technology Stack

**Analysis Date:** 2026-05-01

## Languages

**Primary:**
- TypeScript 6.0.2 - All application code, stores, services, and components
- Svelte 5.55.2 - UI components using Svelte 5 runes syntax

**Secondary:**
- CSS (via Tailwind CSS 4.2.2) - Styling through utility classes and custom theme tokens

## Runtime

**Environment:**
- Browser (SPA mode — SSR disabled via `export const ssr = false` in `src/routes/+layout.ts`)
- Node.js (development tooling)

**Package Manager:**
- npm (lockfile: `package-lock.json` present)
- `.npmrc` with `engine-strict=true`

## Frameworks

**Core:**
- SvelteKit 2.57.0 - Full-stack framework with file-based routing, SPA mode
- Svelte 5.55.2 - UI framework using runes (`$state`, `$derived`, `$effect`, `$props`)
- Vite 8.0.7 - Build tool and dev server

**Styling:**
- Tailwind CSS 4.2.2 - Utility-first CSS framework
- `@tailwindcss/vite` 4.2.2 - Vite plugin integration
- `@tailwindcss/forms` 0.5.11 - Form element resets
- `@tailwindcss/typography` 0.5.19 - Prose styling

**Linting/Formatting:**
- ESLint 10.2.0 - Linting with TypeScript and Svelte plugins
- Prettier 3.8.1 - Code formatting with Svelte and Tailwind plugins
- `typescript-eslint` 8.58.1 - TypeScript ESLint integration

**Type Checking:**
- `svelte-check` 4.4.6 - Svelte type checking
- TypeScript 6.0.2 - Type system

## Key Dependencies

**Critical (Runtime):**
- `firebase` 12.12.1 - Firebase JS SDK (Auth, Firestore, Functions) — single runtime dependency

**Infrastructure (Dev):**
- `@sveltejs/adapter-auto` 7.0.1 - Auto-detects deployment adapter
- `@sveltejs/vite-plugin-svelte` 7.0.0 - Svelte Vite integration
- `@eslint/compat` 2.0.4 - ESLint compatibility layer
- `@eslint/js` 10.0.1 - ESLint core
- `eslint-plugin-svelte` 3.17.0 - Svelte-specific ESLint rules
- `eslint-config-prettier` 10.1.8 - Disables ESLint rules that conflict with Prettier
- `globals` 17.4.0 - Global variable definitions for ESLint
- `prettier-plugin-svelte` 3.5.1 - Svelte formatting for Prettier
- `prettier-plugin-tailwindcss` 0.7.2 - Tailwind class sorting for Prettier

## Configuration

**Environment:**
- Vite environment variables via `import.meta.env.VITE_*` prefix
- `.env` file present (gitignored — contains Firebase config)
- Required env vars:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_FIREBASE_MEASUREMENT_ID`

**Build:**
- `vite.config.ts` — Plugins: `tailwindcss()`, `sveltekit()`
- `svelte.config.js` — Adapter: `adapter-auto`, runes mode forced for all non-library files
- `tsconfig.json` — Extends `.svelte-kit/tsconfig.json`, strict mode, bundler module resolution
- `eslint.config.js` — Flat config format with TypeScript, Svelte, and Prettier
- `.prettierrc` — Tabs, single quotes, no trailing commas, 100 char width

## Platform Requirements

**Development:**
- Node.js (version not pinned via `.nvmrc`; `engine-strict=true` in `.npmrc`)
- npm (lockfile-based)
- Firebase project with Auth, Firestore, and Cloud Functions enabled

**Production:**
- SPA deployment (SSR disabled)
- `adapter-auto` resolves to Vercel, Netlify, Cloudflare, or Node depending on platform
- `.gitignore` references `.vercel`, `.netlify`, `.wrangler` — suggesting multiple deployment targets tested

---

*Stack analysis: 2026-05-01*
