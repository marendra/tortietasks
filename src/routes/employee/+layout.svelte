<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { logOut } from '$lib/services/firebase_service';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children } = $props();

	$effect(() => {
		if (!authStore.loading && !authStore.isEmployee) {
			goto('/admin/dashboard');
		}
	});

	async function handleLogout() {
		await logOut();
		goto('/login');
	}

	const currentPath = $derived($page.url.pathname);
	const isDashboardActive = $derived(
		currentPath === '/employee/dashboard' || currentPath.startsWith('/employee/dashboard/')
	);
	let sidebarOpen = $state(false);
</script>

{#if authStore.isEmployee}
	<div class="flex min-h-screen bg-surface">
		<Sidebar bind:open={sidebarOpen}>
			{#snippet children()}
				<a
					href="/employee/dashboard"
					onclick={() => (sidebarOpen = false)}
					class="flex items-center rounded-md px-3 py-2 text-[13px] font-medium transition-colors {isDashboardActive
						? 'bg-accent-soft text-accent'
						: 'text-text-secondary hover:bg-surface hover:text-text'}"
				>
					Dashboard
				</a>
			{/snippet}
			{#snippet footer()}
				<div class="px-3 py-1.5">
					<p class="text-[13px] font-medium text-text">{authStore.profile?.name ?? 'Employee'}</p>
					<p class="text-xs text-text-muted">{authStore.profile?.role ?? ''}</p>
				</div>
				<button
					type="button"
					class="mt-1 flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:bg-danger-soft hover:text-danger"
					onclick={handleLogout}
				>
					Sign out
				</button>
			{/snippet}
		</Sidebar>

		<!-- Mobile header -->
		<div
			class="fixed inset-x-0 top-0 z-30 flex h-14 items-center border-b border-border bg-surface-raised px-4 md:hidden"
		>
			<button
				type="button"
				class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface"
				onclick={() => (sidebarOpen = true)}
				aria-label="Open menu"
			>
				<svg
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
					/>
				</svg>
			</button>
			<span class="ml-3 text-sm font-semibold tracking-tight text-text">TortieTask</span>
		</div>

		<main class="flex-1 md:ml-56">
			<div class="mx-auto max-w-6xl px-4 pt-18 pb-6 md:px-8 md:py-8 md:pt-8">
				{@render children()}
			</div>
		</main>
	</div>
{/if}
