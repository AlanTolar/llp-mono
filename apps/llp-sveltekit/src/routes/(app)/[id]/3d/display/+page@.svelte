<script lang="ts">
	import { BabylonScene } from 'land-model';
	import { PUBLIC_MAPBOX_KEY, PUBLIC_CDN_URL } from '$env/static/public';
	import { dev } from '$app/environment';

	import type { PageData } from './$types';
	export let data: PageData;
	let { prop_geom, model_markers } = data;
</script>

<BabylonScene
	{prop_geom}
	{model_markers}
	debugMode={dev}
	instructionsMode={true}
	fullscreenMode={true}
	backgroundColor="gray"
	cdnUrl={PUBLIC_CDN_URL}
	mapboxToken={PUBLIC_MAPBOX_KEY}
/>
