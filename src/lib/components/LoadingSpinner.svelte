<script lang="ts">
	let { size = 'md' }: { size?: 'sm' | 'md' | 'lg' } = $props();

	const sizeClasses = {
		sm: 'h-4 w-4 border-[1.5px]',
		md: 'h-6 w-6 border-2',
		lg: 'h-8 w-8 border-2'
	};
</script>

<div class="flex items-center justify-center">
	<div class="animate-spin rounded-full border-border border-t-accent {sizeClasses[size]}"></div>
</div>
