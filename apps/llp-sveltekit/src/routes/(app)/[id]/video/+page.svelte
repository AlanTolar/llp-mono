<script lang="ts">
	import type { PageData } from './$types';
	import { sceneStore, styleStore } from './sceneStore';
	import AnimationLayout from './AnimationLayout.svelte';
	import ConversionLayout from './ConversionLayout.svelte';
	import SceneLayout from './SceneLayout.svelte';
	import { onMount } from 'svelte';
	export let data: PageData;

	const {
		name: prop_name,
		propGeom: prop_geom,
		propBox: prop_box,
		propCenter: prop_center,
		scenes,
		map_style,
		conversions,
		conversionIdFromCrawler,
		isOwner
	} = data;
	const logo_url = '/favicon.png';

	// add scenes to store here so that they are available whether or not ScenesLayout is rendered (i.e. if page is being crawled)
	onMount(async () => {
		if (scenes && scenes.length > 0) {
			sceneStore.importScenes(scenes);
		}
		console.log('map_style: ', map_style);

		if (map_style) {
			styleStore.set(map_style);
		}
	});
</script>

<svelte:head>
	<link href="https://api.mapbox.com/mapbox-gl-js/v2.5.1/mapbox-gl.css" rel="stylesheet" />
</svelte:head>

<div class="block-heading text-center m-5">
	<h2 class="fw-bold">{prop_name}</h2>
</div>

<section class="mb-xl-5 mb-md-4 mb-3 mx-2">
	<div class="container border p-3">
		<AnimationLayout {prop_geom} {prop_center} {logo_url} {map_style} {conversionIdFromCrawler} />
	</div>
</section>

{#if !conversionIdFromCrawler}
	<section class="my-xl-5 my-md-4 my-3 mx-2">
		<div class="container border p-3">
			<SceneLayout {prop_box} {prop_geom} {prop_center} {scenes} />
		</div>
	</section>

	<section class=" my-xl-5 my-md-4 my-3 mx-2">
		<div class="container border p-3">
			<ConversionLayout {conversions} {isOwner} />
		</div>
	</section>
{/if}
