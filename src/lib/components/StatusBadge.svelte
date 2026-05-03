<script lang="ts">
	import type { TaskStatus } from '$lib/models';

	let { status }: { status: TaskStatus } = $props();

	const styles: Record<TaskStatus, string> = {
		'In Progress': 'bg-blue-50 text-blue-600',
		Review: 'bg-amber-50 text-amber-600',
		Approved: 'bg-emerald-50 text-emerald-600',
		Completed: 'bg-neutral-100 text-neutral-500'
	};
</script>

<span
	class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium {styles[status]}"
>
	{status}
</span>
