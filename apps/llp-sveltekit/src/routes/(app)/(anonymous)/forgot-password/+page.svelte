<script lang="ts">
	import Alert from '$lib/components/Alert.svelte';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;

	export let form: ActionData;
	console.log('form: ', form);
</script>

<div class="container ">
	<form method="POST" class="d-grid gap-3 col-md-4 mt-4 mx-auto" novalidate>
		<h1 class="fs-3 text-center">Password Reset</h1>
		<div>
			<label for="email" class="form-label">Email</label>
			<input
				type="text"
				class="form-control"
				class:is-invalid={form?.errors?.email}
				name="email"
				id="email"
				value={form?.data?.email ?? ''}
				required
			/>
			{#if form?.errors?.email}
				<div class="invalid-feedback">{form?.errors?.email[0]}</div>
			{/if}
		</div>
		{#if form?.error}
			<Alert message={form?.message} />
		{/if}
		{#if form?.success}
			<Alert message={form?.message} type="success" />
		{/if}
		<div class="mt-2">
			<button class="btn btn-primary w-100" type="submit">Send Reset Email</button>
		</div>
	</form>
</div>
