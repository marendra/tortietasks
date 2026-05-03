<script lang="ts">
	import { createUsersStore } from '$lib/stores/users.svelte';
	import { createUser, deleteUserCloud } from '$lib/services/firebase_service';
	import { authStore } from '$lib/stores/auth.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';

	const usersStore = createUsersStore();

	let showCreateModal = $state(false);
	let newEmail = $state('');
	let newPassword = $state('');
	let newName = $state('');
	let newRole = $state<'Admin' | 'Employee'>('Employee');
	let createLoading = $state(false);
	let createError = $state('');

	let deleteConfirmOpen = $state(false);
	let deleteUserId = $state<string | null>(null);
	let deleteUserName = $state('');

	async function handleCreate() {
		createError = '';
		createLoading = true;
		try {
			await createUser(newEmail, newPassword, newName, newRole);
			showCreateModal = false;
			newEmail = '';
			newPassword = '';
			newName = '';
			newRole = 'Employee';
		} catch (err: unknown) {
			createError = err instanceof Error ? err.message : 'Failed to create user';
		} finally {
			createLoading = false;
		}
	}

	function confirmDelete(userId: string, name: string) {
		deleteUserId = userId;
		deleteUserName = name;
		deleteConfirmOpen = true;
	}

	async function handleDelete() {
		if (!deleteUserId) return;
		try {
			await deleteUserCloud(deleteUserId);
		} catch (err: unknown) {
			alert(err instanceof Error ? err.message : 'Failed to delete user');
		}
		deleteConfirmOpen = false;
		deleteUserId = null;
	}
</script>

<div class="space-y-5">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold text-text">Team</h2>
		<button
			type="button"
			class="cursor-pointer rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
			onclick={() => (showCreateModal = true)}
		>
			Add user
		</button>
	</div>

	{#if usersStore.loading}
		<div class="flex h-48 items-center justify-center">
			<div class="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent"></div>
		</div>
	{:else}
		<div class="overflow-x-auto rounded-lg border border-border bg-surface-raised">
			<table class="min-w-full divide-y divide-border">
				<thead>
					<tr>
						<th
							class="px-4 py-2.5 text-left text-[11px] font-medium tracking-wider whitespace-nowrap text-text-muted uppercase"
							>Name</th
						>
						<th
							class="px-4 py-2.5 text-left text-[11px] font-medium tracking-wider whitespace-nowrap text-text-muted uppercase"
							>Role</th
						>
						<th
							class="px-4 py-2.5 text-right text-[11px] font-medium tracking-wider whitespace-nowrap text-text-muted uppercase"
							>Actions</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each usersStore.users as user (user.id)}
						<tr class="transition-colors hover:bg-surface">
							<td class="px-4 py-3 text-[13px] font-medium whitespace-nowrap text-text"
								>{user.name}</td
							>
							<td class="px-4 py-3 text-[13px] whitespace-nowrap text-text-secondary"
								>{user.role}</td
							>
							<td class="px-4 py-3 text-right whitespace-nowrap">
								{#if user.id !== authStore.user?.uid && user.role !== 'Admin'}
									<button
										type="button"
										class="cursor-pointer text-[13px] text-danger transition-colors hover:text-danger/80"
										onclick={() => confirmDelete(user.id, user.name)}
									>
										Remove
									</button>
								{:else}
									<span class="text-[13px] text-text-muted">&mdash;</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

{#if showCreateModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
		<div class="w-full max-w-sm rounded-xl border border-border bg-surface-raised p-5">
			<h3 class="text-sm font-semibold text-text">Add user</h3>
			{#if createError}
				<p class="mt-2 text-sm text-danger">{createError}</p>
			{/if}
			<div class="mt-4 space-y-3">
				<div>
					<label
						for="new-name"
						class="mb-1 block text-[11px] font-medium tracking-wider text-text-muted uppercase"
						>Name</label
					>
					<input
						id="new-name"
						type="text"
						bind:value={newName}
						class="focus:accent block w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-[13px] text-text placeholder:text-text-muted focus:border-accent focus:ring-1 focus:outline-none"
						required
					/>
				</div>
				<div>
					<label
						for="new-email"
						class="mb-1 block text-[11px] font-medium tracking-wider text-text-muted uppercase"
						>Email</label
					>
					<input
						id="new-email"
						type="email"
						bind:value={newEmail}
						class="focus:accent block w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-[13px] text-text placeholder:text-text-muted focus:border-accent focus:ring-1 focus:outline-none"
						required
					/>
				</div>
				<div>
					<label
						for="new-password"
						class="mb-1 block text-[11px] font-medium tracking-wider text-text-muted uppercase"
						>Password</label
					>
					<input
						id="new-password"
						type="password"
						bind:value={newPassword}
						class="focus:accent block w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-[13px] text-text placeholder:text-text-muted focus:border-accent focus:ring-1 focus:outline-none"
						required
					/>
				</div>
				<div>
					<label
						for="new-role"
						class="mb-1 block text-[11px] font-medium tracking-wider text-text-muted uppercase"
						>Role</label
					>
					<select
						id="new-role"
						bind:value={newRole}
						class="focus:accent block w-full appearance-none rounded-lg border border-border bg-surface-raised bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%23737373%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat py-2 pr-9 pl-3 text-[13px] text-text focus:border-accent focus:ring-1 focus:outline-none"
					>
						<option value="Employee">Employee</option>
						<option value="Admin">Admin</option>
					</select>
				</div>
			</div>
			<div class="mt-5 flex justify-end gap-2">
				<button
					type="button"
					class="cursor-pointer rounded-lg border border-border px-3.5 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface"
					onclick={() => (showCreateModal = false)}
				>
					Cancel
				</button>
				<button
					type="button"
					class="cursor-pointer rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
					disabled={createLoading}
					onclick={handleCreate}
				>
					{#if createLoading}
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
						></div>
					{:else}
						Create
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<ConfirmModal
	bind:open={deleteConfirmOpen}
	title="Remove user"
	message="Remove {deleteUserName} from the team? This action cannot be undone."
	confirmText="Remove"
	onConfirm={handleDelete}
/>
