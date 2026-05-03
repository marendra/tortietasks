<script lang="ts">
	import type { Task, User, Client } from '$lib/models';
	import StatusBadge from './StatusBadge.svelte';
	import StatusIcon from './StatusIcon.svelte';
	import PriorityBadge from './PriorityBadge.svelte';
	import UserAvatar from './UserAvatar.svelte';
	import { formatDate } from '$lib/utils';

	let {
		task,
		usersMap,
		clientsMap,
		isAdmin = false,
		onClick,
		onDelete
	}: {
		task: Task;
		usersMap: Map<string, User>;
		clientsMap: Map<string, Client>;
		isAdmin?: boolean;
		onClick: () => void;
		onDelete?: (taskId: string) => void;
	} = $props();

	const assignees = $derived(
		task.assigneeIds.map((id) => usersMap.get(id)).filter(Boolean) as User[]
	);
	const client = $derived(task.clientId ? clientsMap.get(task.clientId) : null);
	const isClosed = $derived(task.isClosed);

	function handleDelete(e: Event) {
		e.stopPropagation();
		onDelete?.(task.id);
	}
</script>

<button
	type="button"
	class="group relative w-full cursor-pointer rounded-lg border p-4 text-left transition-colors {isClosed
		? 'border-neutral-200 bg-neutral-50 opacity-75 hover:border-neutral-300'
		: 'border-border bg-surface-raised hover:border-border/80'}"
	onclick={onClick}
>
	<div class="flex items-start justify-between gap-2">
		<h3
			class="line-clamp-1 text-sm font-medium {isClosed
				? 'text-text-muted line-through'
				: 'text-text'}"
		>
			{task.title}
		</h3>
		<div class="flex items-center gap-1.5">
			<PriorityBadge priority={task.priority} />
			{#if isAdmin && onDelete}
				<button
					type="button"
					class="cursor-pointer rounded p-0.5 text-text-muted opacity-0 transition-all hover:bg-danger-soft hover:text-danger group-hover:opacity-100"
					onclick={handleDelete}
					title="Delete task"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-3.5 w-3.5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
					</svg>
				</button>
			{/if}
		</div>
	</div>

	<p
		class="mt-1.5 line-clamp-2 text-[13px] leading-relaxed {isClosed
			? 'text-text-muted'
			: 'text-text-secondary'}"
	>
		{task.description || 'No description'}
	</p>

	<div class="mt-3 flex flex-wrap items-center gap-2">
		<div class="flex items-center gap-1.5">
			<StatusIcon status={task.status} />
			<StatusBadge status={task.status} />
		</div>
		{#if client}
			<span class="text-[11px] font-medium {isClosed ? 'text-text-muted' : 'text-text-muted'}"
				>{client.clientName}</span
			>
		{/if}
		{#if isClosed}
			<span
				class="inline-flex items-center rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-medium text-neutral-500"
			>
				Closed
			</span>
		{/if}
	</div>

	<div class="mt-3 flex items-center justify-between">
		<div class="flex -space-x-1.5">
			{#each assignees.slice(0, 3) as assignee}
				<UserAvatar name={assignee.name} size="sm" />
			{/each}
			{#if assignees.length > 3}
				<div
					class="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-medium text-text-muted"
				>
					+{assignees.length - 3}
				</div>
			{/if}
		</div>
		<span class="text-[11px] text-text-muted">{formatDate(task.createdAt)}</span>
	</div>
</button>
