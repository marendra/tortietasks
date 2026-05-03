<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { authStore } from '$lib/stores/auth.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let { children } = $props();

	const isLoginPage = $derived($page.url.pathname === '/login');

	$effect(() => {
		if (!authStore.loading) {
			if (!authStore.isAuthenticated && !isLoginPage) {
				goto('/login');
			}
		}
	});
</script>

<svelte:head>
	<title>TortieTask</title>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if authStore.loading}
	<div class="flex h-screen items-center justify-center bg-surface">
		<div class="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent"></div>
	</div>
{:else}
	{@render children()}
{/if}
