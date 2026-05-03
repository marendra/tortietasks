<script lang="ts">
	import type { TaskStatus } from '$lib/models';

	let { status }: { status: TaskStatus } = $props();

	const iconPaths: Record<TaskStatus, string> = {
		'In Progress':
			'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
		Review:
			'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
		Approved:
			'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
		Completed:
			'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
	};

	const colors: Record<TaskStatus, string> = {
		'In Progress': 'text-blue-500',
		Review: 'text-amber-500',
		Approved: 'text-emerald-500',
		Completed: 'text-neutral-400'
	};
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	class="h-4 w-4 {colors[status]}"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
>
	<path d={iconPaths[status]} />
</svg>
