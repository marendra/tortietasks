<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';

	$effect(() => {
		if (!authStore.loading) {
			if (authStore.isAdmin) {
				goto('/admin/dashboard');
			} else if (authStore.isEmployee) {
				goto('/employee/dashboard');
			} else {
				goto('/login');
			}
		}
	});
</script>

<div class="flex h-screen items-center justify-center bg-surface">
	<div class="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent"></div>
</div>
