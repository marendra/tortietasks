<script lang="ts">
	import type { TaskFile, User } from '$lib/models';
	import { createFilesStore } from '$lib/stores/files.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import FileRow from './FileRow.svelte';

	let {
		taskId,
		usersMap,
		canApprove = false,
		onApprove,
		onReject
	}: {
		taskId: string;
		usersMap: Map<string, User>;
		canApprove?: boolean;
		onApprove?: (fileId: string) => void;
		onReject?: (fileId: string) => void;
	} = $props();

	const filesStore = createFilesStore();

	$effect(() => {
		filesStore.start(taskId);
		return () => filesStore.stop();
	});
</script>

<div class="rounded-lg border border-border bg-surface-raised p-4">
	<h3 class="mb-3 text-[11px] font-medium tracking-wider text-text-muted uppercase">Files</h3>

	{#if filesStore.loading}
		<div class="flex h-24 items-center justify-center">
			<div class="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent"></div>
		</div>
	{:else if filesStore.files.length === 0}
		<p class="py-4 text-center text-sm text-text-muted">No files uploaded</p>
	{:else}
		<div class="space-y-1.5">
			{#each filesStore.files as file (file.id)}
				<FileRow
					{file}
					uploader={usersMap.get(file.uploadedBy)}
					{canApprove}
					onApprove={() => onApprove?.(file.id)}
					onReject={() => onReject?.(file.id)}
				/>
			{/each}
		</div>
	{/if}
</div>
