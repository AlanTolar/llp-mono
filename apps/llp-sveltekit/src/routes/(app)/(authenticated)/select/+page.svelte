<script lang="ts">
	import type { PageData } from './$types';
	import { Map, Geocoder, Parcels } from '$lib/scripts/parcelMap';
	import { onMount } from 'svelte';
	import { kmlToGeojson, jsonToGeojson, geojsonToCoords } from './helpers';
	import * as turf from '@turf/turf';
	import '$lib/styles/geocoder-style.css';
	import { enhance } from '$app/forms';

	export let data: PageData;

	let selectionMethod: 'address' | 'coordinate' | 'file' = 'address';
	let phase: 'selection' | 'details' | 'confirmation' = 'selection';
	let coordinateFormat: 'degree' | 'degreeMinute' | 'degreeMinuteSecond' = 'degreeMinuteSecond';
	let title = '';
	let geometries: string;
	let reportallResponse: string;

	let propertyDetails: {
		owner: string;
		acreage: string;
		address: string;
		latitude: string;
		longitude: string;
	} | null = null;

	let selectBlocker = false;
	let noParcelFound = false;

	let map: Map;
	let geocoder: Geocoder;
	let geocoderElement: HTMLElement;
	let parcels: Parcels;
	onMount(() => {
		map = new Map('map');
		parcels = new Parcels(map);
		parcels.on('selected', () => {
			phase = 'details';
			const features = parcels.features.at(-1);
			if (!features) {
				noParcelFound = true;
				return;
			}
			propertyDetails = {
				owner: features.owner ?? '',
				acreage: features.acreage_calc?.toFixed(2) ?? '',
				address: features.address ?? '',
				latitude: features.latitude?.toFixed(5) ?? '',
				longitude: features.longitude?.toFixed(5) ?? ''
			};
			title = features.address || '';
			geometries = JSON.stringify(parcels.polygonCoords);
			reportallResponse = JSON.stringify(parcels.features);
		});
		geocoder = new Geocoder(map, geocoderElement);
	});

	async function handleFileSubmit(event: SubmitEvent) {
		const formData = new FormData(event.target as HTMLFormElement);
		const file = formData.get('file-input') as File;
		const fileType = file.name.split('.')[1];

		let geojson = null;
		if (fileType === 'kml') geojson = await kmlToGeojson(file);
		if (fileType === 'geojson' || fileType === 'json') geojson = await jsonToGeojson(file);

		if (geojson) {
			const coords = geojsonToCoords(geojson);
			const multiPoly = turf.multiPolygon(coords);
			const center = turf.center(multiPoly);
			const centerCoords = center.geometry.coordinates as [number, number];

			map.boundaryData(coords);
			map.boundaryLine();
			map.boundaryFill();
			map.map.flyTo({ center: centerCoords, zoom: 14, duration: 2000 });

			phase = 'details';
			title = file.name.split('.')[0];
		} else {
			alert('File type not supported');
		}
	}

	function handleCoordSubmit(event: SubmitEvent) {
		const formData = new FormData(event.target as HTMLFormElement);
		let lat = Number(formData.get('lat-degree'));
		if (formData.has('lat-minute')) lat += Number(formData.get('lat-minute')) / 60;
		if (formData.has('lat-second')) lat += Number(formData.get('lat-second')) / 3600;
		let lng = Number(formData.get('lng-degree'));
		if (formData.has('lng-minute')) lng += Number(formData.get('lng-minute')) / 60;
		if (formData.has('lng-second')) lng += Number(formData.get('lng-second')) / 3600;
		lng *= -1;

		map.addMarker(lng, lat);
		map.map.flyTo({ center: [lng, lat], zoom: 14, duration: 2000 });
		map.fireClick(lng, lat);
	}

	function changeMethod() {
		if (selectionMethod === 'file') parcels?.hideLayers();
		else parcels?.showLayers();
	}
</script>

<svelte:head>
	<link href="https://api.mapbox.com/mapbox-gl-js/v2.5.1/mapbox-gl.css" rel="stylesheet" />
</svelte:head>

<div class="container">
	<div id="api-usage-alert" class="alert alert-warning d-none" role="alert">
		<div>
			<strong id="api-parcel-count" /> parcel selections used (<strong id="api-parcel-limit" /> per hour
			limit). Property search will be temporarily prevented once the parcel selection limit is exceeded.
		</div>
	</div>
	{#if selectBlocker}
		<div class="alert alert-secondary" role="alert">
			Property search temporarily prevented for <strong id="api-cooldown-time" /> minutes.
		</div>
	{/if}

	<div class="row">
		<div id="prop-info-div" class="col-xl-5 mt-5">
			<div id="search" class:d-none={phase !== 'selection'}>
				<h4 class="text-center fw-bold">Property Selection</h4>
				{#if selectBlocker}
					<div class="p-3 text-center">Property search temporarily prevented</div>
				{/if}
				<div class="my-3">
					<label for="" class="fw-bold">Method:</label>
					<div class="px-3">
						<div class="form-check">
							<input
								class="form-check-input"
								type="radio"
								id="address-search-radio"
								bind:group={selectionMethod}
								value={'address'}
								on:change={changeMethod}
							/>
							<label class="form-check-label" for="address-search-radio"> Address Search </label>
						</div>
						<div class="form-check">
							<input
								class="form-check-input"
								type="radio"
								id="coordinate-search-radio"
								bind:group={selectionMethod}
								value={'coordinate'}
								on:change={changeMethod}
							/>
							<label class="form-check-label" for="coordinate-search-radio">
								Coordinate Search
							</label>
						</div>
						<div class="form-check">
							<input
								class="form-check-input"
								type="radio"
								id="file-import-radio"
								bind:group={selectionMethod}
								value={'file'}
								on:change={changeMethod}
							/>
							<label class="form-check-label" for="file-import-radio">
								File Import (KML/GeoJSON)
							</label>
						</div>
					</div>

					<div
						bind:this={geocoderElement}
						id="geocoder"
						class="geocoder mt-5"
						class:d-none={selectionMethod !== 'address'}
					/>

					<div id="coordinate-search" class="mt-3" class:d-none={selectionMethod !== 'coordinate'}>
						<label for="" class="fw-bold">Format:</label>

						<div class="px-3">
							<div class="form-check">
								<input
									class="form-check-input"
									type="radio"
									id="degrees-radio"
									bind:group={coordinateFormat}
									value={'degreeMinuteSecond'}
								/>
								<label class="form-check-label" for="degrees-radio"> DDD° MM' SS.S” </label>
							</div>
							<div class="form-check">
								<input
									class="form-check-input"
									type="radio"
									id="minutes-radio"
									bind:group={coordinateFormat}
									value={'degreeMinute'}
								/>
								<label class="form-check-label" for="minutes-radio"> DDD° MM.MMM' </label>
							</div>
							<div class="form-check">
								<input
									class="form-check-input"
									type="radio"
									id="seconds-radio"
									bind:group={coordinateFormat}
									value={'degree'}
								/>
								<label class="form-check-label" for="seconds-radio"> DDD.DDDDD° </label>
							</div>
						</div>

						<form action="" on:submit|preventDefault={handleCoordSubmit}>
							<div class="mt-5">
								<h6 class="fw-bold">Latitude</h6>
								<div class="input-group">
									<input
										type="number"
										min="0"
										max="180"
										step="0.0001"
										name="lat-degree"
										class="form-control check-value"
									/>
									<h4 class="fw-bold my-auto ps-1 pe-3">°</h4>
									{#if coordinateFormat === 'degreeMinute' || coordinateFormat === 'degreeMinuteSecond'}
										<input
											type="number"
											min="0"
											max="60"
											step="0.01"
											name="lat-minute"
											class="form-control check-value"
										/>
										<h4 class="fw-bold my-auto ps-1 pe-3">'</h4>
									{/if}
									{#if coordinateFormat === 'degreeMinuteSecond'}
										<input
											type="number"
											min="0"
											max="60"
											step="1"
											name="lat-second"
											class="form-control check-value"
										/>
										<h4 class="fw-bold my-auto ps-1 pe-3">''</h4>
									{/if}
									<h4 class="fw-bold my-auto ps-1 pe-3">N</h4>
								</div>
							</div>
							<div class="mt-3">
								<h6 class="fw-bold">Longitude</h6>
								<div class="input-group">
									<input
										type="number"
										min="0"
										max="180"
										step="0.01"
										name="lng-degree"
										class="form-control check-value"
									/>
									<h4 class="fw-bold my-auto ps-1 pe-3">°</h4>
									{#if coordinateFormat === 'degreeMinute' || coordinateFormat === 'degreeMinuteSecond'}
										<input
											type="number"
											min="0"
											max="60"
											step="0.01"
											name="lng-minute"
											class="form-control check-value"
										/>
										<h4 class="fw-bold my-auto ps-1 pe-3">'</h4>
									{/if}
									{#if coordinateFormat === 'degreeMinuteSecond'}
										<input
											type="number"
											min="0"
											max="60"
											step="0.01"
											name="lng-second"
											class="form-control check-value"
										/>
										<h4 class="fw-bold my-auto ps-1 pe-3">''</h4>
									{/if}
									<h4 class="fw-bold my-auto ps-1 pe-3">W</h4>
								</div>
							</div>

							<div class="d-grid gap-2 col-sm-6 mx-auto mt-3">
								<button id="search_coords" class="btn btn-primary" type="submit">
									Search Coordinates
								</button>
							</div>
						</form>
					</div>

					<form
						id="file"
						class="mt-5"
						class:d-none={selectionMethod !== 'file'}
						on:submit|preventDefault={handleFileSubmit}
					>
						<div class="input-group has-validation">
							<input
								class="form-control"
								type="file"
								name="file-input"
								accept=".kml, .geojson, .json"
							/>
							<div class="invalid-feedback">File type or format is invalid</div>
						</div>
						<div class="d-grid gap-2 col-sm-6 mx-auto mt-3">
							<button type="submit" class="btn btn-primary"> Import File </button>
						</div>
					</form>
				</div>
			</div>

			{#if phase === 'details'}
				<div id="results">
					<h4 class="text-center fw-bold">Property Details</h4>
					{#if noParcelFound}
						<div class="m-3">
							<strong>No parcel found.</strong> Click an available parcel on the map, search again,
							or message the coordinates and/or address through the
							<a class="link-secondary" href="/contact">Contact Us</a> page.
						</div>
					{:else}
						<table class="table text-center">
							<tbody id="parcel_info" class="text-start">
								<tr>
									<td class="fw-bold">Owner</td>
									<td id="owner" class="parcel_detail">
										{propertyDetails?.owner || ''}
									</td>
								</tr>
								<tr>
									<td class="fw-bold">Acres</td>
									<td id="acreage_calc" class="parcel_detail">
										{propertyDetails?.acreage || ''}
									</td>
								</tr>
								<tr>
									<td class="fw-bold">Latitude</td>
									<td id="latitude" class="parcel_detail">
										{propertyDetails?.latitude || ''}
									</td>
								</tr>
								<tr>
									<td class="fw-bold">Longitude</td>
									<td id="longitude" class="parcel_detail">
										{propertyDetails?.longitude || ''}
									</td>
								</tr>
								<tr>
									<td class="fw-bold">Address</td>
									<td id="address" class="parcel_detail">
										{propertyDetails?.address || ''}
									</td>
								</tr>
							</tbody>
						</table>

						<div class="alert alert-secondary alert-dismissible" role="alert">
							<strong>Tip:</strong> Hold <strong>ALT</strong> or <strong>CTRL</strong> while
							clicking to select multiple parcels.
							<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" />
						</div>
						<form action="?/selectProperty" method="POST" use:enhance>
							<div class="w-100 mb-3">
								<label for="title" class="form-label">Property Name*</label>
								<input type="text" name="title" bind:value={title} class="form-control" />
								<div class="form-text">
									Custom name for the property (defaults to address if available)
								</div>
								<input type="hidden" name="geometries" id="geometries" bind:value={geometries} />
								<input
									type="hidden"
									name="report_all"
									id="report_all"
									bind:value={reportallResponse}
								/>
							</div>

							<!-- buttons -->
							<div class="d-flex flex-row flex-wrap justify-content-center mb-3">
								<div class="col text-center">
									<button
										id="search-again-btn"
										class="btn btn-secondary center"
										type="button"
										on:click={() => (phase = 'selection')}>Search Again</button
									>
								</div>
								<div class="col text-center">
									<button id="submit-btn" class="btn btn-primary center" type="submit"
										>Select Property</button
									>
								</div>
							</div>
						</form>
					{/if}

					<!-- Form info missing alert -->
					<div id="warnings" />
				</div>
			{/if}
		</div>
		<div class="col-xl-7 mt-5">
			<!-- Mapbox Map -->
			<div class="ratio ratio-4x3 position:relative;">
				<div id="map-holder" class="embed-responsive-item">
					<div id="map" class="w-100 h-100" />
				</div>
			</div>
			<p class="m-1">
				<strong>Note:</strong> If you are having trouble searching or importing parcel boundaries,
				then message us through the <a class="link-secondary" href="/contact">Contact Us</a> page.
			</p>
		</div>
	</div>
</div>
