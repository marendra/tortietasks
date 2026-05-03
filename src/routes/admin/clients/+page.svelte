<script lang="ts">
	import { createClientsStore } from '$lib/stores/clients.svelte';
	import { createClient, updateClient, deleteClient } from '$lib/services/firebase_service';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';

	const clientsStore = createClientsStore();

	let newClientName = $state('');
	let adding = $state(false);

	let editingId = $state<string | null>(null);
	let editName = $state('');

	let deleteConfirmOpen = $state(false);
	let deleteClientId = $state<string | null>(null);
	let deleteClientName = $state('');

	async function handleAdd() {
		if (!newClientName.trim()) return;
		adding = true;
		try {
			await createClient(newClientName.trim());
			newClientName = '';
		} finally {
			adding = false;
		}
	}

	function startEdit(id: string, name: string) {
		editingId = id;
		editName = name;
	}

	async function handleSaveEdit() {
		if (!editingId || !editName.trim()) return;
		await updateClient(editingId, editName.trim());
		editingId = null;
	}

	function confirmDelete(id: string, name: string) {
		deleteClientId = id;
		deleteClientName = name;
		deleteConfirmOpen = true;
	}

	async function handleDelete() {
		if (!deleteClientId) return;
		await deleteClient(deleteClientId);
		deleteConfirmOpen = false;
		deleteClientId = null;
	}
</script>

<div class="space-y-5">
	<h2 class="text-lg font-semibold text-text">Clients</h2>

	<div class="flex gap-2">
		<input
			type="text"
			placeholder="Client name"
			bind:value={newClientName}
			class="focus:accent flex-1 rounded-lg border border-border bg-surface-raised px-3 py-2 text-[13px] text-text placeholder:text-text-muted focus:border-accent focus:ring-1 focus:outline-none"
			onkeydown={(e) => e.key === 'Enter' && handleAdd()}
		/>
		<button
			type="button"
			disabled={adding || !newClientName.trim()}
			class="cursor-pointer rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
			onclick={handleAdd}
		>
			{#if adding}
				<div
					class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
				></div>
			{:else}
				Add
			{/if}
		</button>
	</div>

	{#if clientsStore.loading}
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
							class="px-4 py-2.5 text-right text-[11px] font-medium tracking-wider whitespace-nowrap text-text-muted uppercase"
							>Actions</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each clientsStore.clients as client (client.id)}
						<tr class="transition-colors hover:bg-surface">
							<td class="px-4 py-3 text-[13px] whitespace-nowrap text-text">
								{#if editingId === client.id}
									<div class="flex flex-wrap gap-2">
										<input
											type="text"
											bind:value={editName}
											class="focus:accent rounded-md border border-border bg-surface-raised px-2 py-1 text-[13px] text-text focus:border-accent focus:ring-1 focus:outline-none"
											onkeydown={(e) => e.key === 'Enter' && handleSaveEdit()}
										/>
										<button
											class="cursor-pointer text-[13px] text-accent hover:underline"
											onclick={handleSaveEdit}>Save</button
										>
										<button
											class="cursor-pointer text-[13px] text-text-muted hover:text-text"
											onclick={() => (editingId = null)}>Cancel</button
										>
									</div>
								{:else}
									{client.clientName}
								{/if}
							</td>
							<td class="px-4 py-3 text-right whitespace-nowrap">
								{#if editingId !== client.id}
									<button
										type="button"
										class="mr-3 cursor-pointer text-[13px] text-text-secondary transition-colors hover:text-text"
										onclick={() => startEdit(client.id, client.clientName)}
									>
										Edit
									</button>
									<button
										type="button"
										class="cursor-pointer text-[13px] text-danger transition-colors hover:text-danger/80"
										onclick={() => confirmDelete(client.id, client.clientName)}
									>
										Remove
									</button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<ConfirmModal
	bind:open={deleteConfirmOpen}
	title="Remove client"
	message="Remove {deleteClientName}? This action cannot be undone."
	confirmText="Remove"
	onConfirm={handleDelete}
/>
