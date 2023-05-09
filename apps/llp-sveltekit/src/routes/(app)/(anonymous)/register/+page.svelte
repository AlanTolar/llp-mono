<script lang="ts">
	import Alert from '$lib/components/Alert.svelte';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;

	export let form: ActionData;
	console.log('form: ', form);
</script>

<div class="container ">
	<form method="POST" class="d-grid gap-3 col-md-4 mt-5 mx-auto" novalidate>
		<h1 class="fs-3 text-center">Sign Up</h1>
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
		<div class="form-check">
			<input
				class="form-check-input"
				class:is-invalid={form?.errors?.terms}
				type="checkbox"
				name="terms"
				id="terms"
				required
			/>
			<label class="form-check-label" for="terms"> Agree to terms and conditions </label>
			{#if form?.errors?.terms}
				<div class="invalid-feedback">You must agree before submitting.</div>
			{/if}
		</div>
		{#if form?.error}
			<Alert message={form?.message} />
		{/if}
		<div class="d-flex justify-content-between mt-2">
			<button class="btn btn-primary w-100" type="submit">Sign Up</button>
		</div>
		<div class="d-flex justify-content-between mt-2">
			<small class="text-muted mt-auto">
				Already have an account?
				<a class="button secondaryAction" href="/login">Log In</a>
			</small>
		</div>
	</form>
</div>
