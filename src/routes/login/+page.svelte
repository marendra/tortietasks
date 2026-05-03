<script lang="ts">
	import { signIn } from '$lib/services/firebase_service';
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	$effect(() => {
		if (authStore.isAuthenticated) {
			if (authStore.isAdmin) goto('/admin/dashboard');
			else if (authStore.isEmployee) goto('/employee/dashboard');
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;
		try {
			await signIn(email, password);
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Login failed';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-surface px-4">
	<div class="w-full max-w-sm">
		<div class="mb-10 text-center">
			<h1 class="text-xl font-semibold tracking-tight text-text">TortieTask</h1>
			<p class="mt-1.5 text-sm text-text-secondary">Sign in to continue</p>
		</div>

		<form class="space-y-4" onsubmit={handleSubmit}>
			<div>
				<label
					for="email"
					class="mb-1.5 block text-xs font-medium tracking-wider text-text-secondary uppercase"
					>Email</label
				>
				<input
					id="email"
					type="email"
					required
					class="block w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
					placeholder="you@company.com"
					bind:value={email}
				/>
			</div>

			<div>
				<label
					for="password"
					class="mb-1.5 block text-xs font-medium tracking-wider text-text-secondary uppercase"
					>Password</label
				>
				<input
					id="password"
					type="password"
					required
					class="block w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
					placeholder="Enter your password"
					bind:value={password}
				/>
			</div>

			{#if error}
				<p class="text-sm text-danger">{error}</p>
			{/if}

			<button
				type="submit"
				disabled={loading}
				class="flex w-full cursor-pointer items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
			>
				{#if loading}
					<div
						class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
					></div>
				{:else}
					Sign In
				{/if}
			</button>
		</form>
	</div>
</div>
