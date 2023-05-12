<script lang="ts">
	import { Map, Parcels, Geocoder } from 'map';
	import { LoadingScreen } from 'land-model';
	import { onMount } from 'svelte';
	import '$lib/styles/geocoder-style.css'; //need local style, cdn does not work
	import { BabylonScene } from 'land-model';
	import type { ComponentEvent } from 'land-model';
	import { TabContent, TabPane, Table, Spinner } from 'sveltestrap';
	import type { SoilResponse } from './soilApiTypes';
	import type { WeatherResponse } from './weatherApiTypes';
	import { PUBLIC_RAPIDAPI_KEY, PUBLIC_MAPBOX_KEY, PUBLIC_REPORTALL_KEY } from '$env/static/public';

	import SoilDisplay from './SoilDisplay.svelte';
	import WeatherChart from './WeatherChart.svelte';
	import MapDisplay from './MapDisplay.svelte';
	import { dev } from '$app/environment';

	let backgroundColor = 'gray';
	let infoTab = 'info';
	let prop_geom: number[][][][] | undefined;
	let propertyDetails: {
		owner: string;
		acreage: string;
		address: string;
		latitude: string;
		longitude: string;
	} | null = null;
	let terrainData: ComponentEvent['terrainDataReady'] | null = null;
	let soilData: SoilResponse | null = null;
	let weatherResponse: WeatherResponse | null = null;
	let weatherData: { [key: string]: (number | null)[] } = {};

	$: if (
		infoTab === 'soil' &&
		!soilData &&
		propertyDetails?.latitude &&
		propertyDetails?.longitude
	) {
		getSoilData(propertyDetails.latitude, propertyDetails.longitude);
	}
	$: if (
		infoTab === 'weather' &&
		Object.keys(weatherData).length === 0 &&
		propertyDetails?.latitude &&
		propertyDetails?.longitude
	) {
		getWeatherData(propertyDetails.latitude, propertyDetails.longitude);
	}

	function updateTerrain(e: CustomEvent<ComponentEvent['terrainDataReady']>) {
		terrainData = e.detail;
	}

	async function getSoilData(lat: string, lon: string) {
		const url = new URL('https://rest.isric.org/soilgrids/v2.0/properties/query');
		url.searchParams.set('lon', lon);
		url.searchParams.set('lat', lat);
		const PROPERTIES = ['bdod', 'cec', 'cfvo', 'nitrogen', 'ocd', 'ocs', 'phh2o', 'soc']; // bdod, cec, cfvo, clay, nitrogen, ocd, ocs, phh2o, sand, silt, soc
		PROPERTIES.forEach((p) => url.searchParams.append('property', p));
		const DEPTHS = ['0-5cm', '0-30cm', '5-15cm', '15-30cm', '30-60cm', '60-100cm', '100-200cm']; // 0-5cm, 0-30cm, 5-15cm, 15-30cm, 30-60cm, 60-100cm, 100-200cm
		DEPTHS.forEach((d) => url.searchParams.append('depth', d));
		const VALUES = ['Q0.5']; // Q0.5, Q0.05, Q0.95, mean, uncertainty
		VALUES.forEach((v) => url.searchParams.append('value', v));
		try {
			const response = await fetch(url);
			const data = await response.json();
			soilData = data;
			console.log('soilData: ', soilData);
		} catch (error) {
			console.error(error);
		}
	}

	async function getWeatherData(lat: string, lon: string) {
		const url = new URL('https://meteostat.p.rapidapi.com/point/normals');
		url.searchParams.set('lat', lat);
		url.searchParams.set('lon', lon);
		url.searchParams.set('start', '1991');
		url.searchParams.set('end', '2020');
		const options = {
			method: 'GET',
			headers: {
				'X-RapidAPI-Key': PUBLIC_RAPIDAPI_KEY,
				'X-RapidAPI-Host': 'meteostat.p.rapidapi.com'
			}
		};
		try {
			const response = await fetch(url, options);
			const data = await response.json();
			weatherResponse = data;
			console.log('weatherResponse: ', weatherResponse);
			weatherResponse?.data.forEach((monthData) => {
				Object.entries(monthData).forEach(([key, value]) => {
					if (key === 'month') return;
					if (!weatherData[key]) weatherData[key] = [];
					weatherData[key].push(value);
				});
			});
			console.log('weatherData: ', weatherData);
		} catch (error) {
			console.error(error);
		}
	}

	let map: Map;
	let geocoder: Geocoder;
	let parcels: Parcels;
	onMount(() => {
		map = new Map('map', PUBLIC_MAPBOX_KEY);
		parcels = new Parcels(map, PUBLIC_REPORTALL_KEY);
		parcels.on('selected', () => {
			console.log(parcels);
			terrainData = null;
			soilData = null;
			weatherData = {};
			const features = parcels.features.at(-1);
			if (!features) return;
			propertyDetails = {
				owner: features.owner ?? '',
				acreage: features.acreage_calc?.toFixed(2) ?? '',
				address: features.address ?? '',
				latitude: features.latitude?.toFixed(5) ?? '',
				longitude: features.longitude?.toFixed(5) ?? ''
			};
			prop_geom = parcels.polygonCoords;
		});
		geocoder = new Geocoder(map, PUBLIC_MAPBOX_KEY, undefined);
	});
	let canvasHeight = 0;
	let testBtn = 0;
</script>

<svelte:head>
	<link href="https://api.mapbox.com/mapbox-gl-js/v2.5.1/mapbox-gl.css" rel="stylesheet" />
</svelte:head>
<div class="row p-0 m-0" style="width: 100vw; height: 100vh;">
	<div class="col-xl-7 p-0 m-0">
		<div id="map-holder">
			<div id="map" style="width: 100%; height: 100vh;" />
		</div>
	</div>
	<div
		id="info-panel"
		class="col-xl-5 p-0 m-0 d-flex flex-column"
		style="background-color:{backgroundColor};max-height:100vh;"
	>
		<div id="model-container" class="ratio ratio-16x9 w-100" style="max-height:50vh;">
			{#key prop_geom || testBtn}
				{#if prop_geom}
					<BabylonScene
						{prop_geom}
						debugMode={dev}
						fullscreenMode={true}
						{backgroundColor}
						mapboxToken={PUBLIC_MAPBOX_KEY}
						on:terrainDataReady={updateTerrain}
					/>
				{:else}
					<LoadingScreen text="Select Property on Map" loading={false} />
				{/if}
			{/key}
		</div>

		<!-- <button on:click={() => testBtn++}>Test</button>
		{testBtn} -->

		<TabContent
			class="pt-3 px-3 flex-fill d-flex flex-column flex-grow-1"
			style="overflow: hidden;"
			on:tab={(e) => (infoTab = e.detail.toString())}
		>
			<TabPane tabId="info" active style="overflow: hidden; height:100%;">
				<span class="text-black" slot="tab"> Info </span>
				<div class="scrollable-div min-h-100">
					{#if propertyDetails}
						<Table>
							<tbody>
								{#each Object.entries(propertyDetails) as [key, value]}
									<tr>
										<td class="fw-bold text-capitalize">{key}</td>
										<td>{value}</td>
									</tr>
								{/each}
							</tbody>
						</Table>
						<button
							class="btn btn-primary mt-5"
							type="button"
							data-bs-toggle="collapse"
							data-bs-target="#reportallJSON"
						>
							View JSON
						</button>
						<div class="collapse" id="reportallJSON">
							<div class="card card-body">
								<pre>{JSON.stringify(parcels.features, undefined, 2)}</pre>
							</div>
						</div>
					{/if}
				</div>
			</TabPane>
			<TabPane tabId="terrain" style="overflow: hidden; height:100%;">
				<span class="text-black" slot="tab"> Terrain </span>

				<div bind:clientHeight={canvasHeight} style="overflow: hidden; height:100%;">
					<div class="scrollable-div">
						{#if prop_geom}
							{#if terrainData}
								{@const depth = terrainData.elevationRange[1] - terrainData.elevationRange[0]}
								<Table>
									<tbody>
										<tr>
											<td class="fw-bold text-capitalize">Min Elevation</td>
											<td>{terrainData.elevationRange[0].toFixed(1)} meters</td>
										</tr>
										<tr>
											<td class="fw-bold text-capitalize">Max Elevation</td>
											<td>{terrainData.elevationRange[1].toFixed(1)} meters</td>
										</tr>
										<tr>
											<td class="fw-bold text-capitalize">Property Height</td>
											<td>{depth.toFixed(1)} meters</td>
										</tr>
									</tbody>
								</Table>

								<h1 class="fs-4 py-3 text-center">Terrain Grayscale Map</h1>
								<MapDisplay
									heightMapImage={terrainData.terrainURL}
									containerHeight={canvasHeight}
									{depth}
									xDistance={terrainData.lonMeters}
									yDistance={terrainData.latMeters}
								/>
							{:else}
								<div class="d-flex flex-column align-items-center justify-content-center flex-fill">
									<Spinner color="primary" />
									<p class="text-center">Retrieving Terrain Data</p>
								</div>
							{/if}
						{/if}
					</div>
				</div>
			</TabPane>
			<TabPane tabId="soil" style="overflow: hidden; height:100%;">
				<span class="text-black" slot="tab"> Soil </span>
				<div class="scrollable-div">
					{#if prop_geom}
						{#if soilData}
							<div class="d-flex flex-wrap justify-content-around">
								{#each soilData.properties.layers as data}
									<SoilDisplay {data} />
								{/each}
							</div>
							<button
								class="btn btn-primary mt-5"
								type="button"
								data-bs-toggle="collapse"
								data-bs-target="#soilJSON"
							>
								View JSON
							</button>
							<div class="collapse" id="soilJSON">
								<div class="card card-body">
									<pre>{JSON.stringify(soilData, undefined, 2)}</pre>
								</div>
							</div>
						{:else}
							<div class="d-flex flex-column align-items-center justify-content-center flex-fill">
								<Spinner color="primary" />
								<p class="text-center">Retrieving Soil Data</p>
							</div>
						{/if}
					{/if}
				</div>
			</TabPane>
			<TabPane tabId="weather" style="overflow: hidden; height:100%;">
				<span class="text-black" slot="tab"> Weather </span>
				<div class="scrollable-div">
					{#if prop_geom}
						{#if Object.keys(weatherData).length > 0}
							{#if weatherData['tavg'].filter((d) => d).length > 0}
								<WeatherChart
									series={[
										{
											name: 'Avg Temp',
											data: weatherData['tavg']
										},

										{
											name: 'Min Temp',
											data: weatherData['tmin']
										},
										{
											name: 'Max Temp',
											data: weatherData['tmax']
										}
									]}
									title={'Temperature'}
									unit={'°C'}
								/>
							{/if}
							{#if weatherData['prcp'].filter((d) => d).length > 0}
								<WeatherChart
									series={[
										{
											name: 'Avg Precipitation',
											data: weatherData['prcp']
										}
									]}
									title={'Precipitation'}
									unit={'mm'}
								/>
							{/if}
							{#if weatherData['wspd'].filter((d) => d).length > 0}
								<WeatherChart
									series={[
										{
											name: 'Avg Wind Speed',
											data: weatherData['wspd']
										}
									]}
									title={'Wind Speed'}
									unit={'km/h'}
								/>
							{/if}
							{#if weatherData['pres'].filter((d) => d).length > 0}
								<WeatherChart
									series={[
										{
											name: 'Avg Pressure',
											data: weatherData['pres']
										}
									]}
									title={'Pressure'}
									unit={'hPa'}
								/>
							{/if}
							{#if weatherData['tsun'].filter((d) => d).length > 0}
								<WeatherChart
									series={[
										{
											name: 'Avg Sunshine',
											data: weatherData['tsun']
										}
									]}
									title={'Sunshine'}
									unit={'minutes'}
								/>
							{/if}
							<button
								class="btn btn-primary mt-5"
								type="button"
								data-bs-toggle="collapse"
								data-bs-target="#weatherJSON"
							>
								View JSON
							</button>
							<div class="collapse" id="weatherJSON">
								<div class="card card-body">
									<pre>{JSON.stringify(weatherResponse, undefined, 2)}</pre>
								</div>
							</div>
						{:else}
							<div class="d-flex flex-column align-items-center justify-content-center flex-fill">
								<Spinner color="primary" />
								<p class="text-center">Retrieving Weather Data</p>
							</div>
						{/if}
					{/if}
				</div>
			</TabPane>
		</TabContent>
	</div>
</div>

<style>
	/* ===== Scrollbar CSS ===== */
	/* Firefox */
	* {
		scrollbar-width: auto;
		scrollbar-color: #000000 #ffffff;
	}

	/* Chrome, Edge, and Safari */
	*::-webkit-scrollbar {
		width: 10px;
	}

	*::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.2);
	}

	*::-webkit-scrollbar-thumb {
		background-color: #000000;
		border-radius: 12px;
		border: 2px solid #ffffff;
	}

	#info-panel {
		overflow: hidden;
	}
	.scrollable-div {
		overflow-y: scroll;
		overflow-x: hidden;
		padding: 20px;
		flex-grow: 1;
		height: 100%;
	}

	.info-imgs {
		max-height: 100;
	}
</style>
