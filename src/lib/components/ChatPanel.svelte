<script lang="ts">
	import { tick } from 'svelte';
	import type { TaskMessage, User } from '$lib/models';
	import { createMessagesStore } from '$lib/stores/messages.svelte';
	import { sendTaskMessage } from '$lib/services/firebase_service';
	import { authStore } from '$lib/stores/auth.svelte';
	import ChatMessage from './ChatMessage.svelte';

	let {
		taskId,
		participants,
		usersMap
	}: {
		taskId: string;
		participants: string[];
		usersMap: Map<string, User>;
	} = $props();

	const messagesStore = createMessagesStore();
	let newMessage = $state('');

	$effect(() => {
		messagesStore.start(taskId);
		return () => messagesStore.stop();
	});
	let sending = $state(false);
	let chatContainer: HTMLDivElement;

	$effect(() => {
		if (messagesStore.messages.length > 0) {
			tick().then(() => {
				if (chatContainer) {
					chatContainer.scrollTop = chatContainer.scrollHeight;
				}
			});
		}
	});

	async function handleSend() {
		const text = newMessage.trim();
		if (!text || !authStore.user) return;
		sending = true;
		try {
			await sendTaskMessage({
				taskId,
				senderId: authStore.user.uid,
				text,
				participants
			});
			newMessage = '';
		} finally {
			sending = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}
</script>

<div
	class="flex h-full min-h-[300px] flex-col rounded-lg border border-border bg-surface-raised lg:min-h-0"
>
	<div class="flex items-center justify-between border-b border-border px-4 py-2.5">
		<h3 class="text-[11px] font-medium tracking-wider text-text-muted uppercase">Discussion</h3>
		<span class="text-[11px] text-text-muted">{messagesStore.messages.length} messages</span>
	</div>

	<div bind:this={chatContainer} class="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
		{#if messagesStore.loading}
			<div class="flex h-24 items-center justify-center">
				<div class="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent"></div>
			</div>
		{:else if messagesStore.messages.length === 0}
			<p class="py-8 text-center text-sm text-text-muted">No messages yet</p>
		{:else}
			{#each messagesStore.messages as message (message.id)}
				<ChatMessage
					{message}
					sender={usersMap.get(message.senderId)}
					isMe={message.senderId === authStore.user?.uid}
				/>
			{/each}
		{/if}
	</div>

	<div class="border-t border-border p-3">
		<div class="flex gap-2">
			<input
				type="text"
				placeholder="Write a message..."
				class="focus:accent flex-1 rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-[13px] text-text placeholder:text-text-muted focus:border-accent focus:ring-1 focus:outline-none"
				bind:value={newMessage}
				onkeydown={handleKeydown}
				disabled={sending}
			/>
			<button
				type="button"
				disabled={sending || !newMessage.trim()}
				class="cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
				onclick={handleSend}
			>
				Send
			</button>
		</div>
	</div>
</div>
