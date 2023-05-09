<script lang="ts">
	import type { ModelMarker } from '@prisma/client';
	import MarkerComponent from './Marker.svelte';
	import { Map, Marker } from './map';
	import Sortable from 'sortablejs';
	import { onDestroy, onMount } from 'svelte';
	import { Alert } from 'sveltestrap';
	import cuid from 'cuid';
	import { bootstrapTooltip } from '$lib/scripts/bootstrap';
	import { browser } from '$app/environment';

	export let isOwner: boolean;
	export let prop_geom: number[][][][];
	export let prop_center: { lat: number; lng: number };
	export let model_markers: ModelMarker[];

	let markers: Marker[] = [];
	let map: Map;

	let sortableElement: HTMLElement;
	let sortable: Sortable;
	let sortedIds: string[] = [];
	function setMarkerOrder() {
		let order = 1;
		sortedIds = [...new Set(sortable.toArray())];
		sortedIds.forEach((id, i) => {
			const marker = markers.find((marker) => marker.markerData.id === id);
			if (marker) {
				marker.markerData.order = order;
				marker.element.innerHTML = `${order}`;
				order++;
			}
		});
		markers = [...markers];
	}

	onMount(async () => {
		map = new Map('map', prop_center.lat, prop_center.lng);
		map.map.on('load', () => {
			map.boundaryData(prop_geom);
			map.boundaryLine();
			map.setBbox(prop_geom);
		});
		sortable = new Sortable(sortableElement, {
			handle: '.handle',
			animation: 200,
			onChange: (evt) => setMarkerOrder()
		});
		markers = model_markers.map((markerData) => {
			const newMarker = new Marker(map, prop_geom, markerData);
			return newMarker;
		});
	});

	onDestroy(() => {
		if (browser && map.map) {
			map.map.remove();
			markers.forEach((marker) => marker.marker.remove());
			console.log('map and markers removed');
		}
	});

	function addMarker() {
		const newMarkerData = {
			id: cuid(),
			longitude: prop_center.lng,
			latitude: prop_center.lat,
			s3_key: '',
			pano: false,
			order: markers.length + 1
		} as ModelMarker;
		const newMarker = new Marker(map, prop_geom, newMarkerData);
		markers = [...markers, newMarker];
	}

	function deleteMarker(event: CustomEvent<{ id: string }>) {
		markers = markers.filter((marker, i) => marker.markerData.id !== event.detail.id);
		imagesCurrentlyUploading = imagesCurrentlyUploading.filter((id) => id !== event.detail.id);
		setMarkerOrder();
	}

	let updateError: string | null = null;
	let updateSuccess: string | null = null;
	let model_updating = false;
	async function updateModelData() {
		model_updating = true;
		updateError = null;
		updateSuccess = null;
		const markersData = markers.map((marker) => marker.markerData);
		const response = await fetch('', {
			method: 'POST',
			body: JSON.stringify(markersData),
			headers: {
				'content-type': 'application/json'
			}
		});
		const data = await response.json();
		updateError = !response.ok ? data.message : null;
		updateSuccess = response.ok ? data.message : null;
		model_updating = false;
		document.getElementById('model-iframe').src += '';
		document.getElementById('prop-title').scrollIntoView({ behavior: 'smooth' });
	}

	let imagesCurrentlyUploading: string[] = [];
	function uploadImageStart(event: CustomEvent<{ id: string }>) {
		imagesCurrentlyUploading = [...imagesCurrentlyUploading, event.detail.id];
	}
	function uploadImageEnd(event: CustomEvent<{ id: string }>) {
		imagesCurrentlyUploading = imagesCurrentlyUploading.filter((id) => id !== event.detail.id);
	}
</script>

<div class="row">
	<div class="col-lg-7">
		<!-- Mapbox Map -->
		<div class="ratio ratio-4x3">
			<div class="embed-responsive-item">
				<div id="map" class=" w-100 h-100" />
			</div>
		</div>
	</div>

	<div class="col-lg-5 pt-lg-0 pt-3">
		<!-- markers -->
		<style>
			.sortable-fallback > div.hide-if-sort {
				visibility: hidden;
			}
		</style>

		<div bind:this={sortableElement} id="markers_id" class="col-lg-10 col-11">
			{#each markers as marker (marker.markerData.id)}
				<MarkerComponent
					{marker}
					{isOwner}
					on:deleteMarker={deleteMarker}
					on:uploadImageStart={uploadImageStart}
					on:uploadImageEnd={uploadImageEnd}
				/>
			{/each}
		</div>
		<div class="d-flex flex-row flex-wrap justify-content-around pt-4">
			{#if markers.length < 10}
				<button class="btn btn-primary" type="button" on:click={addMarker}>Add Marker</button>
			{:else}
				<span
					class="d-inline-block"
					use:bootstrapTooltip
					title="Delete a marker first in order to add another"
				>
					<button id="btnadd" class="btn btn-secondary mb-2 freeze" type="button">
						10 Marker Max
					</button>
				</span>
			{/if}

			{#if !isOwner}
				<span
					class="d-inline-block"
					use:bootstrapTooltip
					title="Models can only be updated by the owner"
				>
					<button id="btnupdate" class="btn btn-secondary freeze" type="button" disabled
						>Update Model</button
					>
				</span>
			{:else if imagesCurrentlyUploading.length > 0}
				<span
					class="d-inline-block"
					use:bootstrapTooltip
					title="Uploading {imagesCurrentlyUploading.length} image(s) to the server. Please wait until the upload is complete before updating the model."
				>
					<button id="uploadingBtn" class="btn btn-secondary" type="button"> Uploading... </button>
				</span>
			{:else if model_updating}
				<span
					class="d-inline-block"
					use:bootstrapTooltip
					title="Please wait until the update is complete before updating the model again."
				>
					<button id="updatingBtn" class="btn btn-secondary" type="button">Updating...</button>
				</span>
			{:else}
				<button id="updateBtn" class="btn btn-primary" type="button" on:click={updateModelData}
					>Update Model</button
				>
			{/if}
		</div>
		<div class="pt-3">
			<Alert
				color="danger"
				isOpen={typeof updateError === 'string'}
				toggle={() => (updateError = null)}
				fade={false}
			>
				{updateError}
			</Alert>
			<Alert
				color="success"
				isOpen={typeof updateSuccess === 'string'}
				toggle={() => (updateSuccess = null)}
				fade={false}
			>
				{updateSuccess}
			</Alert>
		</div>
	</div>
</div>
