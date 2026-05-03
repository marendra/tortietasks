<script lang="ts">
	import type { Task, User, Client } from '$lib/models';
	import StatusBadge from './StatusBadge.svelte';
	import PriorityBadge from './PriorityBadge.svelte';
	import UserAvatar from './UserAvatar.svelte';

	let {
		task,
		usersMap,
		clientsMap,
		isAdmin = false,
		onStatusChange,
		onClose,
		onReopen
	}: {
		task: Task;
		usersMap: Map<string, User>;
		clientsMap: Map<string, Client>;
		isAdmin?: boolean;
		onStatusChange?: (status: Task['status']) => void;
		onClose?: () => void;
		onReopen?: () => void;
	} = $props();

	const assignor = $derived(usersMap.get(task.assignorId));
	const assignees = $derived(
		task.assigneeIds.map((id) => usersMap.get(id)).filter(Boolean) as User[]
	);
	const client = $derived(task.clientId ? clientsMap.get(task.clientId) : null);

	const statusFlow: Task['status'][] = [
		'In Progress',
		'Review',
		'Approved',
		'Completed'
	];
</script>

<div class="rounded-lg border border-border bg-surface-raised p-4 sm:p-5">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div class="min-w-0 flex-1">
			<h1 class="text-base font-semibold text-text sm:text-lg">{task.title}</h1>
			<p class="mt-1.5 text-sm leading-relaxed text-text-secondary">
				{task.description || 'No description'}
			</p>
		</div>
		<div class="flex items-center gap-2">
			<PriorityBadge priority={task.priority} />
			{#if task.isClosed}
				<span
					class="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500"
					>Closed</span
				>
			{/if}
		</div>
	</div>

	<div class="mt-4 flex flex-wrap items-center gap-3 text-sm sm:gap-5">
		<div class="flex items-center gap-2">
			<span class="text-[11px] font-medium tracking-wider text-text-muted uppercase">Status</span>
			{#if onStatusChange && !task.isClosed}
				<select
					value={task.status}
					onchange={(e) => onStatusChange(e.currentTarget.value as Task['status'])}
					class="focus:accent appearance-none rounded-md border border-border bg-surface-raised bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%23737373%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat py-1.5 pr-7 pl-2 text-[13px] text-text focus:border-accent focus:ring-1 focus:outline-none"
				>
					{#each statusFlow as s}
						<option value={s}>{s}</option>
					{/each}
				</select>
			{:else}
				<StatusBadge status={task.status} />
			{/if}
		</div>

		{#if client}
			<div class="flex items-center gap-2">
				<span class="text-[11px] font-medium tracking-wider text-text-muted uppercase">Client</span>
				<span class="text-[13px] font-medium text-text">{client.clientName}</span>
			</div>
		{/if}
	</div>

	<div class="mt-3 flex flex-wrap items-center gap-3 text-sm sm:gap-5">
		<div class="flex items-center gap-2">
			<span class="text-[11px] font-medium tracking-wider text-text-muted uppercase">Assignor</span>
			{#if assignor}
				<div class="flex items-center gap-1.5">
					<UserAvatar name={assignor.name} size="sm" />
					<span class="text-[13px] text-text">{assignor.name}</span>
				</div>
			{:else}
				<span class="text-[13px] text-text-muted">Unknown</span>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<span class="text-[11px] font-medium tracking-wider text-text-muted uppercase">Assignees</span
			>
			<div class="flex -space-x-1">
				{#each assignees as assignee}
					<UserAvatar name={assignee.name} size="sm" />
				{/each}
			</div>
		</div>
	</div>

	{#if isAdmin && !task.isClosed && onClose}
		<div class="mt-4 border-t border-border pt-4">
			<button
				type="button"
				class="cursor-pointer rounded-md border border-border px-3 py-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:border-danger/20 hover:bg-danger-soft hover:text-danger"
				onclick={onClose}
			>
				Close task
			</button>
		</div>
	{/if}

	{#if isAdmin && task.isClosed && onReopen}
		<div class="mt-4 border-t border-border pt-4">
			<button
				type="button"
				class="cursor-pointer rounded-md border border-border px-3 py-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:border-accent/20 hover:bg-accent-soft hover:text-accent"
				onclick={onReopen}
			>
				Reopen task
			</button>
		</div>
	{/if}
</div>
