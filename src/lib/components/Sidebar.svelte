<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		children,
		footer
	}: {
		open?: boolean;
		children: Snippet;
		footer: Snippet;
	} = $props();

	function closeOnBackdrop() {
		open = false;
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
		onclick={closeOnBackdrop}
		role="button"
		tabindex="-1"
		onkeydown={(e) => e.key === 'Escape' && (open = false)}
	></div>
{/if}

<aside
	class="fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-border bg-surface-raised transition-transform duration-200 md:translate-x-0 {open
		? 'translate-x-0'
		: '-translate-x-full'}"
>
	<div class="flex h-14 items-center justify-between px-5">
		<span class="text-sm font-semibold tracking-tight text-text">TortieTask</span>
		<button
			type="button"
			class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text md:hidden"
			onclick={() => (open = false)}
			aria-label="Close menu"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>

	<nav class="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
		{@render children()}
	</nav>

	<div class="border-t border-border p-3">
		{@render footer()}
	</div>
</aside>
