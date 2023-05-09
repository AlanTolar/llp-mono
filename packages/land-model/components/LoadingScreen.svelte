<script lang="ts">
	import { Spinner } from 'sveltestrap';

	export let text = '';
	export let backgroundColor = '';
	export let loading = true;

	let containerWidth = 0;
</script>

<div
	class="d-flex flex-column justify-content-center align-items-center h-100 text-center"
	bind:clientWidth={containerWidth}
	style="background-color: {backgroundColor}; overflow: hidden;"
>
	<img src="/favicon.png" alt="Logo" style="width: 20%;" />
	<div>
		<span
			class="mb-4 text-center"
			style="font-size: {containerWidth / 15}px; font-weight: semi-bold;"
		>
			{text}
		</span>
		{#if loading}
			<Spinner class="" color="primary" />
		{/if}
	</div>
</div>
