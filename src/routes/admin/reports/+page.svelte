<script lang="ts">
	import { createTasksStore } from '$lib/stores/tasks.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { createUsersStore } from '$lib/stores/users.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { formatDate } from '$lib/utils';
	import type { TaskStatus } from '$lib/models';

	const usersStore = createUsersStore();
	const tasksStore = createTasksStore();

	$effect(() => {
		const uid = authStore.user?.uid;
		if (uid) {
			tasksStore.start(uid);
			return () => tasksStore.stop();
		}
	});

	let startDate = $state('');
	let endDate = $state('');
	let filterStatus = $state<TaskStatus | 'All'>('All');

	const filteredTasks = $derived.by(() => {
		return tasksStore.tasks.filter((t) => {
			if (filterStatus !== 'All' && t.status !== filterStatus) return false;
			if (startDate) {
				const s = new Date(startDate).getTime() / 1000;
				if ((t.createdAt?.seconds ?? 0) < s) return false;
			}
			if (endDate) {
				const e = new Date(endDate).getTime() / 1000 + 86400;
				if ((t.createdAt?.seconds ?? 0) > e) return false;
			}
			return true;
		});
	});

	const statusCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const t of filteredTasks) {
			counts[t.status] = (counts[t.status] || 0) + 1;
		}
		return counts;
	});

	function exportCSV() {
		const rows = [
			['Title', 'Status', 'Priority', 'Assignor', 'Assignees', 'Created At'].join(','),
			...filteredTasks.map((t) => {
				const assignor = usersStore.usersMap.get(t.assignorId)?.name ?? 'Unknown';
				const assignees = t.assigneeIds
					.map((id) => usersStore.usersMap.get(id)?.name ?? 'Unknown')
					.join('; ');
				return [
					`"${t.title.replace(/"/g, '""')}"`,
					t.status,
					t.priority,
					assignor,
					`"${assignees}"`,
					formatDate(t.createdAt)
				].join(',');
			})
		];
		const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `tasks-report-${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	const statusOptions: (TaskStatus | 'All')[] = [
		'All',
		'In Progress',
		'Review',
		'Approved',
		'Completed'
	];
</script>

<div class="space-y-5">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold text-text">Reports</h2>
		<button
			type="button"
			class="cursor-pointer rounded-lg border border-border px-3.5 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface"
			onclick={exportCSV}
		>
			Export CSV
		</button>
	</div>

	<div class="flex flex-wrap gap-3">
		<div class="min-w-[140px] flex-1">
			<label
				for="start-date"
				class="mb-1 block text-[11px] font-medium tracking-wider text-text-muted uppercase"
				>Start date</label
			>
			<input
				id="start-date"
				type="date"
				bind:value={startDate}
				class="focus:accent w-full rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-[13px] text-text focus:border-accent focus:ring-1 focus:outline-none"
			/>
		</div>
		<div class="min-w-[140px] flex-1">
			<label
				for="end-date"
				class="mb-1 block text-[11px] font-medium tracking-wider text-text-muted uppercase"
				>End date</label
			>
			<input
				id="end-date"
				type="date"
				bind:value={endDate}
				class="focus:accent w-full rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-[13px] text-text focus:border-accent focus:ring-1 focus:outline-none"
			/>
		</div>
		<div class="min-w-[140px] flex-1">
			<label
				for="report-status"
				class="mb-1 block text-[11px] font-medium tracking-wider text-text-muted uppercase"
				>Status</label
			>
			<select
				id="report-status"
				bind:value={filterStatus}
				class="focus:accent w-full appearance-none rounded-md border border-border bg-surface-raised bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%23737373%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat py-1.5 pr-8 pl-2.5 text-[13px] text-text-secondary focus:border-accent focus:ring-1 focus:outline-none"
			>
				{#each statusOptions as s}
					<option value={s}>{s === 'All' ? 'All statuses' : s}</option>
				{/each}
			</select>
		</div>
	</div>

	{#if tasksStore?.loading}
		<div class="flex h-48 items-center justify-center">
			<div class="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent"></div>
		</div>
	{:else}
		<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
			{#each Object.entries(statusCounts) as [status, count]}
				<div class="rounded-lg border border-border bg-surface-raised p-3 text-center">
					<p class="text-xl font-semibold text-text sm:text-2xl">{count}</p>
					<div class="mt-1">
						<StatusBadge status={status as TaskStatus} />
					</div>
				</div>
			{/each}
		</div>

		<div class="overflow-x-auto rounded-lg border border-border bg-surface-raised">
			<table class="min-w-full divide-y divide-border">
				<thead>
					<tr>
						<th
							class="px-4 py-2.5 text-left text-[11px] font-medium tracking-wider whitespace-nowrap text-text-muted uppercase"
							>Title</th
						>
						<th
							class="px-4 py-2.5 text-left text-[11px] font-medium tracking-wider whitespace-nowrap text-text-muted uppercase"
							>Status</th
						>
						<th
							class="px-4 py-2.5 text-left text-[11px] font-medium tracking-wider whitespace-nowrap text-text-muted uppercase"
							>Priority</th
						>
						<th
							class="px-4 py-2.5 text-left text-[11px] font-medium tracking-wider whitespace-nowrap text-text-muted uppercase"
							>Created</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each filteredTasks as task (task.id)}
						<tr class="transition-colors hover:bg-surface">
							<td class="px-4 py-3 text-[13px] font-medium whitespace-nowrap text-text"
								>{task.title}</td
							>
							<td class="px-4 py-3 whitespace-nowrap"><StatusBadge status={task.status} /></td>
							<td class="px-4 py-3 text-[13px] whitespace-nowrap text-text-secondary"
								>{task.priority}</td
							>
							<td class="px-4 py-3 text-[13px] whitespace-nowrap text-text-muted"
								>{formatDate(task.createdAt)}</td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
