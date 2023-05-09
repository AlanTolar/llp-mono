<script lang="ts">
	import MarkerLayout from './MarkerLayout.svelte';
	import ModelLayout from './ModelLayout.svelte';

	import type { PageData } from './$types';
	export let data: PageData;
	const {
		name: prop_name,
		propGeom: prop_geom,
		propBox: prop_box,
		propCenter: prop_center,
		land_model: { s3_path, failed_generate, model_markers, user_access },
		isOwner
	} = data;
</script>

<div class="block-heading text-center m-5">
	<h2 id="prop-title" class="fw-bold">{prop_name}</h2>
</div>

<section class="mb-xl-5 mb-md-4 mb-3 mx-2">
	<div class="container border p-3">
		<ModelLayout {s3_path} {user_access} />
	</div>
</section>

<section class="mb-xl-5 mb-md-4 mb-3 mx-2">
	<div class="container border p-3">
		<h3 class="text-center fw-bold pb-2">Edit Markers</h3>
		<MarkerLayout {isOwner} {prop_geom} {prop_center} {model_markers} />
	</div>
</section>

<svelte:head>
	<link href="https://api.mapbox.com/mapbox-gl-js/v2.5.1/mapbox-gl.css" rel="stylesheet" />
</svelte:head>
