<script lang="ts">
	import { Icon, Button, Label, Input } from 'sveltestrap';
	import { page } from '$app/stores';
	import ModelFrame from '$lib/components/ModelFrame.svelte';
	import { PUBLIC_3D_MODEL_PRICE_ID } from '$env/static/public';

	export let s3_path: string | null;
	export let user_access: boolean;
	const displayURL = `${$page.url.origin}${$page.url.pathname}/display`;

	let showIFrame = false;
</script>

<div class="col-lg-8 mx-auto">
	<ModelFrame model_url={`${$page.url.pathname}/display`} />

	<div class="pt-3">
		<h3 class="fw-bold pb-1 d-md-none">Shareable URL:</h3>
		<div class="input-group input-group-lg align-items-center">
			<Label class="fs-4 form-label fw-bold my-2 me-3 d-none d-md-block" for="display-url"
				>Shareable URL:</Label
			>

			<Input class="form-control" id="display-url" readonly value={displayURL} />
			<Button
				id="copyBtn"
				class="input-group-btn float-end"
				color="primary"
				on:click={() => {
					navigator.clipboard.writeText(`${$page.url.origin}${$page.url.pathname}/display`);
				}}
			>
				<Icon name="clipboard" />
			</Button>
			<!-- <Popover placement="top" target="copyBtn" dismissible>URL copied!</Popover> -->
		</div>

		{#if !user_access}
			<div class="alert alert-success alert-dismissible mt-3" role="alert">
				Please note that the 3D model is currently only visible to this account. To make it public
				and shareable
				<strong
					><a
						href="/api/create-checkout-session?{PUBLIC_3D_MODEL_PRICE_ID}&propertyId={$page.params
							.id}"
						class="font-bold">Upgrade 3D Model</a
					></strong
				>.
			</div>
		{/if}
	</div>
</div>
