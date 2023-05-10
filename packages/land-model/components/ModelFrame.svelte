<script lang="ts">
	import { LoadingScreen } from 'land-model';
	import { onDestroy, onMount } from 'svelte';

	export let model_url: string;

	let modelIframe: HTMLIFrameElement | undefined;
	onDestroy(() => {
		// not sure if this is necessary to prevent memory leaks
		if (modelIframe) {
			modelIframe.src = 'about:blank';
			modelIframe.remove();
			modelIframe = undefined;
		}
	});
</script>

<div id="model-container" class="ratio ratio-16x9">
	<LoadingScreen text={'Loading 3D Model'} />
	<iframe
		bind:this={modelIframe}
		id="model-iframe"
		loading="lazy"
		sandbox="allow-scripts"
		src={model_url}
		class="w-100 h-100"
		allow="fullscreen"
		scrolling="no"
		title="3D Model"
	/>
</div>
