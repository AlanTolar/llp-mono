<script lang="ts">
	import BabylonScene from '$lib/3d/BabylonScene.svelte';

	import type { PageData } from './$types';
	export let data: PageData;
	let { prop_geom, model_markers } = data;
</script>

<BabylonScene
	{prop_geom}
	{model_markers}
	debugMode={false}
	instructionsMode={true}
	fullscreenMode={true}
	backgroundColor="gray"
/>
