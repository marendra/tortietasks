# Changelog

## 2026-05-01

### Dashboard Task Visibility

- Removed `isClosed == false` filter from Firestore queries so completed/closed tasks are now fetched
- Updated `myAssignedTasksStream`, `myCreatedTasksStream`, and `allOpenTasksStream` (renamed to `allTasksStream`) in `firebase_service.ts`
- Default status filter changed from "All" to "In Progress" on both admin and employee dashboards
- Users can switch to "All" or "Completed" to see closed tasks

### Priority & Task Card Colors

- `PriorityBadge` — replaced dot indicators with colored pill badges:
  - **High**: Red (`bg-red-50 text-red-600`)
  - **Medium**: Amber (`bg-amber-50 text-amber-600`)
  - **Low**: Slate gray (`bg-slate-50 text-slate-500`)
- `StatusBadge` — updated color palette for better distinction:
  - **To Do**: Slate gray
  - **In Progress**: Blue
  - **Review**: Amber
  - **Approved - Ready to Send**: Emerald green
  - **Completed**: Neutral gray
- `TaskCard` — visual distinction for open vs closed tasks:
  - **Open tasks**: White background, normal text
  - **Closed tasks**: Muted gray background (`bg-neutral-50`), faded opacity, strikethrough title, "Closed" pill badge

### Dropdown Arrow Fix

- Fixed dropdown arrow icon overlapping text in all `<select>` elements
- Replaced native browser arrow with custom SVG chevron via `background-image`
- Added `appearance-none` to remove default browser styling
- Added `pr-8` / `pr-9` padding-right to ensure text doesn't overlap the arrow
- Applied to all selects: filter dropdowns (status, priority, assignees, clients), status workflow selector, priority/client selects in task creation, role select in team modal

### Mobile Responsiveness

- Added `Sidebar.svelte` component with slide-in drawer for mobile navigation
- Added hamburger menu button in fixed top header bar on mobile screens
- Sidebar opens as overlay with backdrop blur, closes on backdrop tap or link click
- Sidebar always visible on desktop (`md:` breakpoint and up)
- Added mobile header bar (56px) with TortieTask branding
- Content area shifts down on mobile to account for fixed header
- Reduced padding on mobile (`px-4` vs `px-8`)

**Pages:**
- Filter selects wrap and fill available width on small screens
- Tables wrapped in `overflow-x-auto` with `whitespace-nowrap` on cells
- Task detail chat panel gets `min-h-[350px]` on mobile before stacking
- Task creation form priority/client grid collapses to single column on mobile
- Reports date filters use flexible layout with `min-w-[140px]`
- Status count grid uses 2 columns on mobile

**Components:**
- `ChatPanel` — minimum height on mobile, message count in header, larger touch targets
- `ChatMessage` — hidden avatar on small screens, wider message bubbles (85%)
- `FileRow` — stacks vertically on mobile, hides metadata on small screens
- `TaskHeader` — responsive padding, flexible wrapping
- `ConfirmModal` — slides up from bottom on mobile (sheet-style), centered on desktop
- Input fields have larger touch targets (`py-2.5`) for mobile tapping

---

### Minimalist Design Redesign

**Design System:**
- Font: Inter (clean, professional sans-serif)
- Palette: Neutral grays (`#171717` text, `#fafafa` surface, `#e5e5e5` borders) with blue accent (`#2563eb`)
- Flat design: no shadows, no gradients, subtle borders only
- Typography: `13px` body, `11px` uppercase labels, `14px` headings

**Layout:**
- Sidebar: narrower (224px), fixed position, no heavy borders
- Content: centered max-width container with consistent padding

**Components:**
- `TaskCard` — flat border, no shadow, dot-based priority indicator
- `StatusBadge` — muted colors, smaller text
- `PriorityBadge` — uses dots (1-3) instead of colored labels
- `UserAvatar` — neutral gray palette instead of bright colors
- `ChatPanel` — cleaner header labeled "Discussion"
- `ChatMessage` — subtle message bubbles with border
- `ConfirmModal` — backdrop blur instead of solid black overlay
- `LoadingSpinner` — thinner borders, smaller sizes
- Tables — removed header backgrounds, lighter row separators
- Buttons — flat, no shadows, `cursor-pointer` on all interactive elements
- Inputs — consistent styling with focus ring

**Files Updated:**
- `src/routes/layout.css` — design tokens and custom theme
- `src/app.html` — Inter font import
- `src/routes/+layout.svelte` — root layout and loading
- `src/routes/+page.svelte` — root redirect
- `src/routes/login/+page.svelte` — login page
- `src/routes/admin/+layout.svelte` — admin sidebar layout
- `src/routes/admin/dashboard/+page.svelte` — admin dashboard
- `src/routes/admin/team/+page.svelte` — team management
- `src/routes/admin/clients/+page.svelte` — clients page
- `src/routes/admin/reports/+page.svelte` — reports page
- `src/routes/admin/tasks/new/+page.svelte` — task creation
- `src/routes/admin/tasks/[taskId]/+page.svelte` — admin task detail
- `src/routes/employee/+layout.svelte` — employee sidebar layout
- `src/routes/employee/dashboard/+page.svelte` — employee dashboard
- `src/routes/employee/tasks/[taskId]/+page.svelte` — employee task detail
- `src/lib/components/Sidebar.svelte` — new responsive sidebar
- `src/lib/components/TaskCard.svelte` — task card
- `src/lib/components/TaskHeader.svelte` — task header
- `src/lib/components/StatusBadge.svelte` — status badge
- `src/lib/components/PriorityBadge.svelte` — priority badge
- `src/lib/components/UserAvatar.svelte` — user avatar
- `src/lib/components/ChatPanel.svelte` — chat panel
- `src/lib/components/ChatMessage.svelte` — chat message
- `src/lib/components/FileList.svelte` — file list
- `src/lib/components/FileRow.svelte` — file row
- `src/lib/components/ConfirmModal.svelte` — confirm modal
- `src/lib/components/LoadingSpinner.svelte` — loading spinner
