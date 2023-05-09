<script lang="ts">
	import Alert from '$lib/components/Alert.svelte';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;

	export let form: ActionData;
	console.log('form: ', form);
</script>

<div class="lg:container ">
	<form method="POST" class="d-grid gap-3 col-md-4 mt-5 mx-auto" novalidate>
		<h1 class="fs-3 text-center">Reset Password</h1>
		<div>
			<label for="password" class="form-label">Password</label>
			<input
				type="password"
				class="form-control"
				class:is-invalid={form?.errors?.password}
				name="password"
				id="password"
				required
			/>
			{#if form?.errors?.password}
				<div class="invalid-feedback">{form?.errors?.password[0]}</div>
			{/if}
		</div>
		<div>
			<label for="passwordConfirm" class="form-label">Confirm Password</label>
			<input
				type="password"
				class="form-control"
				class:is-invalid={form?.errors?.passwordConfirm}
				name="passwordConfirm"
				id="passwordConfirm"
				required
			/>
			{#if form?.errors?.passwordConfirm}
				<div class="invalid-feedback">{form?.errors?.passwordConfirm[0]}</div>
			{/if}
		</div>
		{#if form?.error}
			<Alert message={form?.message} />
		{/if}
		<div class="col-6">
			<button class="btn btn-primary w-full" type="submit">Reset Password</button>
		</div>
	</form>
</div>
