<script lang="ts">
	let { name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' } = $props();

	const sizeClasses = {
		sm: 'h-5 w-5 text-[10px]',
		md: 'h-7 w-7 text-xs',
		lg: 'h-9 w-9 text-sm'
	};

	const initials = $derived(
		name
			?.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2) ?? '?'
	);

	const colors = ['bg-neutral-400', 'bg-stone-400', 'bg-zinc-400', 'bg-gray-400', 'bg-slate-400'];
	const colorIndex = $derived(name?.charCodeAt(0) ?? 0);
	const color = $derived(colors[colorIndex % colors.length]);
</script>

<div
	class="inline-flex items-center justify-center rounded-full font-medium text-white {sizeClasses[
		size
	]} {color}"
	title={name}
>
	{initials}
</div>
