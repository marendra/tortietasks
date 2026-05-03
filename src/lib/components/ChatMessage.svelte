<script lang="ts">
	import type { TaskMessage } from '$lib/models';
	import type { User } from '$lib/models';
	import { formatDate } from '$lib/utils';
	import UserAvatar from './UserAvatar.svelte';

	let {
		message,
		sender,
		isMe
	}: {
		message: TaskMessage;
		sender: User | undefined;
		isMe: boolean;
	} = $props();
</script>

<div class="flex gap-2 {isMe ? 'flex-row-reverse' : ''}">
	<div class="hidden sm:block">
		<UserAvatar name={sender?.name ?? 'Unknown'} size="sm" />
	</div>
	<div class="max-w-[85%] sm:max-w-[70%]">
		<div class="flex items-center gap-2 {isMe ? 'justify-end' : ''}">
			<span class="text-[11px] font-medium text-text-secondary">{sender?.name ?? 'Unknown'}</span>
			<span class="text-[10px] text-text-muted">{formatDate(message.createdAt)}</span>
		</div>
		<div
			class="mt-1 rounded-lg px-3 py-2 text-[13px] leading-relaxed {isMe
				? 'bg-accent text-white'
				: 'border border-border bg-neutral-50 text-text'}"
		>
			{message.text}
			{#if message.fileUrl}
				<div class="mt-1.5">
					<a
						href={message.fileUrl}
						target="_blank"
						class="text-[12px] underline {isMe ? 'text-white/80' : 'text-accent'}"
					>
						View attachment
					</a>
				</div>
			{/if}
		</div>
	</div>
</div>
