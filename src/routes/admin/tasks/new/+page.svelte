<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { createUsersStore } from '$lib/stores/users.svelte';
	import { createClientsStore } from '$lib/stores/clients.svelte';
	import { createTopLevelTask } from '$lib/services/firebase_service';
	import type { TaskPriority } from '$lib/models';

	const usersStore = createUsersStore();
	const clientsStore = createClientsStore();

	let title = $state('');
	let description = $state('');
	let priority = $state<TaskPriority>('Medium');
	let clientId = $state<string | null>(null);
	let selectedAssignees = $state<string[]>([]);
	let loading = $state(false);
	let error = $state('');

	const employees = $derived(usersStore.users.filter((u) => u.role === 'Employee'));

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!authStore.user) return;
		if (selectedAssignees.length === 0) {
			error = 'Select at least one assignee';
			return;
		}
		error = '';
		loading = true;
		try {
			await createTopLevelTask({
				title: title.trim(),
				description: description.trim(),
				assigneeIds: selectedAssignees,
				assignorId: authStore.user.uid,
				priority,
				clientId: clientId || null
			});
			goto('/admin/dashboard');
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Failed to create task';
			loading = false;
		}
	}

	function toggleAssignee(id: string) {
		if (selectedAssignees.includes(id)) {
			selectedAssignees = selectedAssignees.filter((a) => a !== id);
		} else {
			selectedAssignees = [...selectedAssignees, id];
		}
	}
</script>

<div class="mx-auto max-w-xl">
	<div class="mb-5 flex items-center gap-1.5 text-[13px] text-text-muted">
		<a href="/admin/dashboard" class="transition-colors hover:text-text">Dashboard</a>
		<span>/</span>
		<span class="text-text-secondary">New task</span>
	</div>

	<h2 class="text-lg font-semibold text-text">Create task</h2>

	<form class="mt-5 space-y-4" onsubmit={handleSubmit}>
		{#if error}
			<p class="text-sm text-danger">{error}</p>
		{/if}

		<div>
			<label
				for="title"
				class="mb-1 block text-[11px] font-medium tracking-wider text-text-muted uppercase"
				>Title</label
			>
			<input
				id="title"
				type="text"
				required
				bind:value={title}
				class="focus:accent block w-full rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-[13px] text-text placeholder:text-text-muted focus:border-accent focus:ring-1 focus:outline-none"
			/>
		</div>

		<div>
			<label
				for="description"
				class="mb-1 block text-[11px] font-medium tracking-wider text-text-muted uppercase"
				>Description</label
			>
			<textarea
				id="description"
				rows={3}
				bind:value={description}
				class="focus:accent block w-full rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-[13px] text-text placeholder:text-text-muted focus:border-accent focus:ring-1 focus:outline-none"
			></textarea>
		</div>

		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			<div>
				<label
					for="priority"
					class="mb-1 block text-[11px] font-medium tracking-wider text-text-muted uppercase"
					>Priority</label
				>
				<select
					id="priority"
					bind:value={priority}
					class="focus:accent block w-full appearance-none rounded-lg border border-border bg-surface-raised bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%23737373%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat py-2.5 pr-9 pl-3 text-[13px] text-text focus:border-accent focus:ring-1 focus:outline-none"
				>
					<option value="High">High</option>
					<option value="Medium">Medium</option>
					<option value="Low">Low</option>
				</select>
			</div>
			<div>
				<label
					for="client"
					class="mb-1 block text-[11px] font-medium tracking-wider text-text-muted uppercase"
					>Client</label
				>
				<select
					id="client"
					bind:value={clientId}
					class="focus:accent block w-full appearance-none rounded-lg border border-border bg-surface-raised bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%23737373%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat py-2.5 pr-9 pl-3 text-[13px] text-text focus:border-accent focus:ring-1 focus:outline-none"
				>
					<option value={null}>None</option>
					{#each clientsStore.clients as client}
						<option value={client.id}>{client.clientName}</option>
					{/each}
				</select>
			</div>
		</div>

		<div>
			<span class="mb-2 block text-[11px] font-medium tracking-wider text-text-muted uppercase"
				>Assignees</span
			>
			<div class="flex flex-wrap gap-1.5">
				{#each employees as emp}
					<button
						type="button"
						class="cursor-pointer rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors {selectedAssignees.includes(
							emp.id
						)
							? 'border-accent bg-accent-soft text-accent'
							: 'border-border text-text-secondary hover:border-border/80 hover:bg-surface'}"
						onclick={() => toggleAssignee(emp.id)}
					>
						{emp.name}
					</button>
				{/each}
			</div>
		</div>

		<div class="flex gap-2 pt-2">
			<a
				href="/admin/dashboard"
				class="rounded-lg border border-border px-3.5 py-2.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface"
			>
				Cancel
			</a>
			<button
				type="submit"
				disabled={loading}
				class="flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-3.5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
			>
				{#if loading}
					<div
						class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
					></div>
				{/if}
				Create task
			</button>
		</div>
	</form>
</div>
