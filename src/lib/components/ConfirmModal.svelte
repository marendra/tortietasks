<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		title = 'Confirm',
		message = 'Are you sure?',
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		onConfirm,
		children
	}: {
		open?: boolean;
		title?: string;
		message?: string;
		confirmText?: string;
		cancelText?: string;
		onConfirm: () => void;
		children?: Snippet;
	} = $props();

	function handleConfirm() {
		open = false;
		onConfirm();
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-black/20 p-0 backdrop-blur-sm sm:items-center sm:p-4"
	>
		<div
			class="w-full max-w-sm rounded-t-xl border-t border-border bg-surface-raised p-5 sm:rounded-xl sm:border sm:p-6"
		>
			<h3 class="text-sm font-semibold text-text">{title}</h3>
			<p class="mt-2 text-sm leading-relaxed text-text-secondary">{message}</p>
			{#if children}
				{@render children()}
			{/if}
			<div class="mt-5 flex justify-end gap-2">
				<button
					type="button"
					class="cursor-pointer rounded-lg border border-border px-3.5 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface"
					onclick={() => (open = false)}
				>
					{cancelText}
				</button>
				<button
					type="button"
					class="cursor-pointer rounded-lg bg-danger px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-danger/90"
					onclick={handleConfirm}
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}
