<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { createUsersStore } from '$lib/stores/users.svelte';
	import { createClientsStore } from '$lib/stores/clients.svelte';
	import {
		topLevelTaskStream,
		updateTopLevelTask,
		uploadFileToR2,
		addTaskFile
	} from '$lib/services/firebase_service';
	import TaskHeader from '$lib/components/TaskHeader.svelte';
	import ChatPanel from '$lib/components/ChatPanel.svelte';
	import FileList from '$lib/components/FileList.svelte';
	import type { Task } from '$lib/models';

	const taskId = $derived($page.params.taskId!);
	const usersStore = createUsersStore();
	const clientsStore = createClientsStore();

	let task = $state<Task | null>(null);
	let loading = $state(true);
	let uploadLoading = $state(false);
	let uploadError = $state<string | null>(null);

	$effect(() => {
		loading = true;
		const unsub = topLevelTaskStream(taskId, (t) => {
			task = t;
			loading = false;
		});
		return unsub;
	});

	async function handleStatusChange(status: Task['status']) {
		if (!task) return;
		await updateTopLevelTask(taskId, { status }, task.assignorId);
	}

	async function handleFileUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || !task || !authStore.user || !taskId) return;

		uploadLoading = true;
		uploadError = null;
		try {
			const result = await uploadFileToR2(file);
			if (!result.success) {
				const stepLabel = { presign: 'get upload URL', upload: 'upload file', save: 'save metadata' }[result.step ?? 'upload'];
				uploadError = `Failed to ${stepLabel}: ${result.error}`;
				console.error('[Upload]', result);
				return;
			}
			await addTaskFile({
				taskId,
				uploadedBy: authStore.user.uid,
				fileName: file.name,
				fileUrl: result.publicUrl!,
				fileSize: file.size,
				mimeType: file.type,
				participants: task.participants
			});
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Upload failed';
			uploadError = `Failed to save metadata: ${message}`;
			console.error('[Upload] Save step failed:', err);
		} finally {
			uploadLoading = false;
			input.value = '';
		}
	}
</script>

{#if loading}
	<div class="flex h-64 items-center justify-center">
		<div class="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent"></div>
	</div>
{:else if !task}
	<div class="flex h-64 flex-col items-center justify-center text-text-muted">
		<p class="text-sm">Task not found</p>
		<a href="/employee/dashboard" class="mt-2 text-[13px] text-accent hover:underline"
			>Back to dashboard</a
		>
	</div>
{:else}
	<div class="space-y-5">
		<div class="flex items-center gap-1.5 text-[13px] text-text-muted">
			<a href="/employee/dashboard" class="transition-colors hover:text-text">Dashboard</a>
			<span>/</span>
			<span class="truncate text-text-secondary">{task.title}</span>
		</div>

		<TaskHeader
			{task}
			usersMap={usersStore.usersMap}
			clientsMap={clientsStore.clientsMap}
			isAdmin={false}
			onStatusChange={handleStatusChange}
		/>

		<div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
			<div class="min-h-[350px] lg:col-span-2 lg:min-h-0">
				<ChatPanel {taskId} participants={task.participants} usersMap={usersStore.usersMap} />
			</div>

			<div class="space-y-4">
				<div class="rounded-lg border border-border bg-surface-raised p-4">
					<h3 class="mb-2.5 text-[11px] font-medium tracking-wider text-text-muted uppercase">
						Upload file
					</h3>
					<label
						class="flex cursor-pointer items-center justify-center rounded-md border border-dashed border-border p-3 transition-colors hover:border-accent/40 hover:bg-accent-soft"
					>
						{#if uploadLoading}
							<div
								class="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent"
							></div>
						{:else}
							<span class="text-[13px] text-text-muted">Click to upload</span>
						{/if}
						<input
							type="file"
							class="hidden"
							onchange={handleFileUpload}
							disabled={uploadLoading}
						/>
					</label>
					{#if uploadError}
						<p class="mt-2 text-[12px] text-danger">{uploadError}</p>
					{/if}
				</div>

				<FileList {taskId} usersMap={usersStore.usersMap} canApprove={false} />
			</div>
		</div>
	</div>
{/if}
