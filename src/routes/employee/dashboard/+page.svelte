<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { createTasksStore } from '$lib/stores/tasks.svelte';
	import { createUsersStore } from '$lib/stores/users.svelte';
	import { createClientsStore } from '$lib/stores/clients.svelte';
	import TaskCard from '$lib/components/TaskCard.svelte';
	import type { TaskStatus, TaskPriority } from '$lib/models';

	const tasksStore = createTasksStore();
	const usersStore = createUsersStore();
	const clientsStore = createClientsStore();

	$effect(() => {
		const uid = authStore.user?.uid;
		if (uid) {
			tasksStore.start(uid);
			return () => tasksStore.stop();
		}
	});

	let filterStatus = $state<TaskStatus | 'All'>('In Progress');
	let filterPriority = $state<TaskPriority | 'All'>('All');
	let filterClient = $state<string>('All');

	const filteredTasks = $derived.by(() => {
		return tasksStore.tasks.filter((t) => {
			if (filterStatus !== 'All' && t.status !== filterStatus) return false;
			if (filterPriority !== 'All' && t.priority !== filterPriority) return false;
			if (filterClient !== 'All' && t.clientId !== filterClient) return false;
			return true;
		});
	});

	const statusOptions: (TaskStatus | 'All')[] = [
		'All',
		'In Progress',
		'Review',
		'Approved',
		'Completed'
	];
	const priorityOptions: (TaskPriority | 'All')[] = ['All', 'High', 'Medium', 'Low'];
</script>

<div class="space-y-5">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold text-text">My tasks</h2>
	</div>

	<div class="flex flex-wrap gap-2">
		<select
			bind:value={filterStatus}
			class="focus:accent min-w-0 flex-1 appearance-none rounded-md border border-border bg-surface-raised bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%23737373%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat py-1.5 pr-8 pl-2.5 text-[13px] text-text-secondary focus:border-accent focus:ring-1 focus:outline-none sm:flex-none"
		>
			{#each statusOptions as s}
				<option value={s}>{s === 'All' ? 'All statuses' : s}</option>
			{/each}
		</select>
		<select
			bind:value={filterPriority}
			class="focus:accent min-w-0 flex-1 appearance-none rounded-md border border-border bg-surface-raised bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%23737373%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat py-1.5 pr-8 pl-2.5 text-[13px] text-text-secondary focus:border-accent focus:ring-1 focus:outline-none sm:flex-none"
		>
			{#each priorityOptions as p}
				<option value={p}>{p === 'All' ? 'All priorities' : p}</option>
			{/each}
		</select>
		<select
			bind:value={filterClient}
			class="focus:accent min-w-0 flex-1 appearance-none rounded-md border border-border bg-surface-raised bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%23737373%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat py-1.5 pr-8 pl-2.5 text-[13px] text-text-secondary focus:border-accent focus:ring-1 focus:outline-none sm:flex-none"
		>
			<option value="All">All clients</option>
			{#each clientsStore.clients as client}
				<option value={client.id}>{client.clientName}</option>
			{/each}
		</select>
	</div>

	{#if tasksStore.loading}
		<div class="flex h-48 items-center justify-center">
			<div class="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent"></div>
		</div>
	{:else if tasksStore.error}
		<div class="flex h-48 items-center justify-center text-sm text-danger">
			<p>Error: {tasksStore.error}</p>
		</div>
	{:else if filteredTasks.length === 0}
		<div class="flex h-48 items-center justify-center text-sm text-text-muted">
			<p>No tasks assigned to you</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each filteredTasks as task (task.id)}
				<TaskCard
					{task}
					usersMap={usersStore.usersMap}
					clientsMap={clientsStore.clientsMap}
					onClick={() => goto(`/employee/tasks/${task.id}`)}
				/>
			{/each}
		</div>
	{/if}
</div>
