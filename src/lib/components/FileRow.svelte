<script lang="ts">
	import type { TaskFile, User } from '$lib/models';
	import { formatDate, formatFileSize } from '$lib/utils';

	let {
		file,
		uploader,
		canApprove = false,
		onApprove,
		onReject
	}: {
		file: TaskFile;
		uploader: User | undefined;
		canApprove?: boolean;
		onApprove?: () => void;
		onReject?: () => void;
	} = $props();

	const statusColors: Record<TaskFile['status'], string> = {
		Pending: 'text-warning',
		Approved: 'text-success',
		Rejected: 'text-danger'
	};
</script>

<div
	class="flex items-start justify-between gap-2 rounded-md border border-border px-3 py-2.5 transition-colors hover:bg-surface sm:items-center"
>
	<div class="min-w-0 flex-1">
		<a
			href={file.fileUrl}
			target="_blank"
			class="block truncate text-[13px] font-medium text-accent hover:underline"
		>
			{file.fileName}
		</a>
		<div class="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-text-muted">
			<span>{formatFileSize(file.fileSize)}</span>
			<span class="hidden sm:inline">&middot;</span>
			<span class="hidden sm:inline">{uploader?.name ?? 'Unknown'}</span>
			<span class="hidden sm:inline">&middot;</span>
			<span class="hidden sm:inline">{formatDate(file.uploadedAt)}</span>
		</div>
		{#if file.status === 'Rejected' && file.rejectionReason}
			<p class="mt-1 text-[11px] text-danger">Reason: {file.rejectionReason}</p>
		{/if}
	</div>

	<div class="flex shrink-0 items-center gap-2">
		<span class="text-[11px] font-medium {statusColors[file.status]}">
			{file.status}
		</span>
		{#if canApprove && file.status === 'Pending'}
			<div class="flex gap-1">
				<button
					type="button"
					class="cursor-pointer rounded-md bg-success px-2 py-1 text-[11px] font-medium text-white transition-colors hover:bg-success/90"
					onclick={onApprove}
				>
					Approve
				</button>
				<button
					type="button"
					class="cursor-pointer rounded-md bg-danger px-2 py-1 text-[11px] font-medium text-white transition-colors hover:bg-danger/90"
					onclick={onReject}
				>
					Reject
				</button>
			</div>
		{/if}
	</div>
</div>
