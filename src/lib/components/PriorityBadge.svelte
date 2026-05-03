<script lang="ts">
	import type { TaskPriority } from '$lib/models';

	let { priority }: { priority: TaskPriority } = $props();

	const styles: Record<TaskPriority, string> = {
		High: 'bg-red-50 text-red-600 border-red-100',
		Medium: 'bg-amber-50 text-amber-600 border-amber-100',
		Low: 'bg-slate-50 text-slate-500 border-slate-100'
	};
</script>

<span
	class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium {styles[
		priority
	]}"
>
	{priority}
</span>
