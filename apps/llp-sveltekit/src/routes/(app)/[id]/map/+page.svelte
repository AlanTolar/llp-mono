<script lang="ts">
	import type { PageData } from './$types';
	import { onDestroy, onMount, tick } from 'svelte';
	import { createMap } from './map';
	import { browser } from '$app/environment';

	export let data: PageData;
	console.log('data: ', data);
	const { name: propName, propGeom, propBox, propCenter } = data;

	const is_owner = true;
	let style = 'satellite-v9';
	let ratioClass = 'ratio-4x3';
	let map: createMap;
	$: if (ratioClass && map) {
		tick().then(() => {
			map.map.resize();
			map.recenter();
		});
	}

	onMount(() => {
		map = new createMap(propBox, propCenter, propGeom, style, propName);
	});

	onDestroy(() => {
		if (browser && map.map) {
			map.map.remove();
			console.log('map removed');
		}
	});
</script>

{#if !is_owner}
	<div class="alert alert-primary alert-dismissible fade show text-center" role="alert">
		You are viewing the Map Maker as a guest, therefore certain functionality may be limited.
		<a href="/select/" class="alert-link">Select a property</a> to create your own maps!
	</div>
{/if}

<div class="block-heading text-center m-5">
	<h2 class="fw-bold">{propName}</h2>
	<!-- <p>Use the controls to create maps for your listing!</p> -->
</div>
<section class="mb-xl-5 mb-md-4 mb-3 mx-2">
	<div class="container">
		<div class="row">
			<div class="col-xl-8">
				<!-- Mapbox Map -->
				<div class="ratio {ratioClass}" style="position:relative;">
					<div id="map-holder" class="embed-responsive-item">
						<div id="map" class="w-100 h-100" />
					</div>
				</div>
			</div>

			<div id="prop-info-div" class="col-xl-4 mt-xl-0 mt-5 disable-dbl-tap-zoom">
				<!-- controls -->
				<div class="d-flex flex-row flex-wrap justify-content-center" oncontextmenu="return false;">
					<!-- rotation -->
					<div class="col mb-5">
						<h5 class="text-center fw-bold">Rotation</h5>
						<div class="d-flex flex-row justify-content-center mt-1">
							<button aria-label="Space Holder" class="button invisible"
								><i class="bi-arrow-up" aria-hidden="true" /></button
							>
							<button
								aria-label="Rotate Up"
								class="button pitch-btn"
								on:pointerdown={(e) => {
									if (e.isPrimary) map.pitch_start(-5);
								}}
								on:touchstart={() => map.pitch_start(-5)}
							>
								<i class="bi-arrow-up" aria-hidden="true" />
							</button>
							<button aria-label="Space Holder" class="button invisible"
								><i class="bi-arrow-up" aria-hidden="true" /></button
							>
						</div>
						<div class="d-flex flex-row justify-content-center">
							<button
								aria-label="Rotate Left"
								class="button bearing-btn"
								on:pointerdown={() => map.bearing_start(5)}
								on:touchstart={() => map.bearing_start(5)}
							>
								<i class="bi-arrow-left" aria-hidden="true" style="user-select: none;" />
							</button>
							<button aria-label="Space Holder" class="button invisible"
								><i class="bi-arrow-up" aria-hidden="true" /></button
							>
							<div
								class="button bearing-btn"
								on:pointerdown={() => map.bearing_start(-5)}
								on:touchstart={() => map.bearing_start(-5)}
							>
								<button aria-label="Rotate Right" class="button">
									<i class="bi-arrow-right" aria-hidden="true" />
								</button>
							</div>
						</div>
						<div class="d-flex flex-row justify-content-center">
							<button aria-label="Space Holder" class="button invisible"
								><i class="bi-arrow-up" aria-hidden="true" /></button
							>
							<button
								aria-label="Rotate Down"
								class="button pitch-btn"
								on:pointerdown={() => map.pitch_start(5)}
								on:touchstart={() => map.pitch_start(5)}
							>
								<i class="bi-arrow-down" aria-hidden="true" /></button
							>
							<button aria-label="Space Holder" class="button invisible"
								><i class="bi-arrow-up" aria-hidden="true" /></button
							>
						</div>
					</div>
					<!-- zoom -->
					<div class="col mb-5">
						<h5 class="text-center fw-bold">Zoom</h5>
						<div class="d-flex flex-column text-center">
							<div class="p-1">
								<button
									aria-label="Zoom In"
									class="button zoom-btn"
									on:pointerdown={() => map.zoom_start(0.1)}
									on:touchstart={() => map.zoom_start(0.1)}
								>
									<i class="bi-plus" aria-hidden="true" />
								</button>
							</div>
							<div class="p-1">
								<button
									aria-label="Zoom Out"
									class="button zoom-btn"
									on:pointerdown={() => map.zoom_start(-0.1)}
									on:touchstart={() => map.zoom_start(-0.1)}
								>
									<i class="bi-dash" aria-hidden="true" />
								</button>
							</div>
						</div>
					</div>
					<style>
						.disable-dbl-tap-zoom {
							touch-action: manipulation;
							user-select: none;
						}
					</style>
					<!-- options -->
					<div class="col-12 mb-5">
						<!-- map style -->
						<div class="card mb-1">
							<div class="card-header">
								<div class="d-flex justify-content-between align-items-center">
									<button
										id="collapse_btn"
										class="btn"
										data-bs-toggle="collapse"
										data-bs-target="#collapse_style"
										aria-expanded="false"
										aria-controls="collapse_style"
									>
										<i class="fs-4 bi-chevron-down" />
									</button>
									<h5>Style</h5>
									<div class="form-check form-switch invisible">
										<input class="form-check-input" type="checkbox" checked />
									</div>
								</div>
							</div>
							<div id="collapse_style" class="collapse">
								<div class="card-body d-flex justify-content-center text-center gap-4">
									<div class="btn-group-toggle btn-group-vertical" data-toggle="buttons">
										<label id="satellite-v9" class="btn btn-outline-primary text-nowrap">
											<input
												type="radio"
												bind:group={style}
												value="satellite-v9"
												on:change={() => map.toggleStyle('satellite-v9')}
											/>
											satellite</label
										>
										<label id="streets-v11" class="btn btn-outline-primary text-nowrap">
											<input
												type="radio"
												bind:group={style}
												value="streets-v11"
												on:change={() => map.toggleStyle('streets-v11')}
											/>
											streets</label
										>
										<label id="satellite-streets-v11" class="btn btn-outline-primary text-nowrap">
											<input
												type="radio"
												bind:group={style}
												value="satellite-streets-v11"
												on:change={() => map.toggleStyle('satellite-streets-v11')}
											/>
											satellite + streets</label
										>
									</div>
									<div class="btn-group-toggle btn-group-vertical" data-toggle="buttons">
										<label id="dimensions-16x9" class="btn btn-outline-primary text-nowrap">
											<input type="radio" bind:group={ratioClass} value="ratio-16x9" />
											16x9</label
										>
										<label id="dimensions-4x3" class="btn btn-outline-primary text-nowrap">
											<input type="radio" bind:group={ratioClass} value="ratio-4x3" />
											4x3</label
										>
										<label id="dimensions-square" class="btn btn-outline-primary text-nowrap">
											<input type="radio" bind:group={ratioClass} value="ratio-1x1" />
											square</label
										>
									</div>
								</div>
							</div>
						</div>
						<!-- boundary -->
						<div class="card mb-1">
							<div class="card-header">
								<div class="d-flex justify-content-between align-items-center">
									<button
										id="collapse_btn"
										class="btn"
										data-bs-toggle="collapse"
										data-bs-target="#collapse_boundary"
									>
										<i class="fs-4 bi-chevron-down" />
									</button>
									<h5>Boundary</h5>
									<div class="form-check form-switch">
										<input
											class="form-check-input"
											type="checkbox"
											id="boundarySwitch"
											on:click={() => map.boundaryToggle()}
											checked
										/>
									</div>
								</div>
							</div>
							<div id="collapse_boundary" class="collapse">
								<div class="card-body justify-content-around">
									<h5 class="font-weight-bold text-center">Fill</h5>
									<form class="h-100 form-control">
										<div class="form-group d-flex aligns-items-center p-1">
											<label class="form-check-label me-3 text-center" for="fill_color_picker"
												>Color</label
											>
											<input id="fill_color_picker" type="color" value="#0080ff" />
										</div>
										<div class="form-group p-1">
											<label class="form-check-label mb-1" for="opacity">Opacity</label>
											<input
												id="opacity"
												type="range"
												class="slider"
												min="0"
												max="1"
												value="0.15"
												step="0.01"
											/>
										</div>
									</form>
									<h5 class="font-weight-bold text-center pt-3">Line</h5>
									<form class="h-100 form-control">
										<div class="form-group d-flex aligns-items-center p-1">
											<label class="form-check-label me-3 text-center" for="line_color_picker"
												>Color</label
											>
											<input id="line_color_picker" type="color" value="#000000" />
										</div>
										<div class="form-group p-1">
											<label class="form-check-label mb-1" for="line_width">Width</label>
											<input
												id="line_width"
												type="range"
												class="slider"
												min="0"
												max="10"
												value="3"
												step="1"
											/>
										</div>
									</form>
								</div>
							</div>
						</div>
						<!-- elevation -->
						<div class="card mb-1">
							<div class="card-header">
								<div class="d-flex justify-content-between align-items-center">
									<button id="collapse_btn" class="btn invisible">
										<i class="fs-4 bi-chevron-down" />
									</button>
									<h5>Elevation</h5>
									<div class="form-check form-switch">
										<input
											class="form-check-input"
											type="checkbox"
											id="elevSwitch"
											checked
											on:click={() => map.elevToggle()}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- buttons -->
				<div class="d-flex flex-row flex-wrap justify-content-center">
					<div class="col text-center mb-3">
						<button
							id="reset-btn"
							class="btn btn-lg btn-secondary center"
							type="button"
							on:click={() => map.recenter()}>Recenter</button
						>
					</div>
					<div class="col text-center">
						<button
							id="screenshot-btn"
							class="btn btn-lg btn-primary center"
							type="button"
							on:click={() => map.ImgGrab()}>Screenshot</button
						>
					</div>
				</div>

				<p class="mt-3">
					<b>Elevation Glitches: </b>If an issue, try removing ad-blockers and security shields set
					by your browser for this site.
				</p>
				<p class="mt-3">
					<b>iOS Compatibility: </b>Screenshots do not work for iOS devices. Use a computer or
					Android device.
				</p>
				<!-- Form info missing alert -->
				<div id="warnings" />
			</div>
		</div>
	</div>
</section>

<svelte:head>
	<link href="https://api.mapbox.com/mapbox-gl-js/v2.5.1/mapbox-gl.css" rel="stylesheet" />
</svelte:head>

<style>
	.button {
		text-align: center;
		cursor: pointer;
		outline: none;
		color: #fff;
		background-color: #00915c;
		border: none;
		border-radius: 10px;
		height: 50px;
		width: 50px;
		box-shadow: 0 4px #999;
	}

	.button > i {
		font-size: 20px;
		-webkit-text-stroke: 3px white;
	}

	/* .button:hover {
		background-color: #00662a;
	} */

	.button:active {
		background-color: #00662a;
		box-shadow: 0 5px #665;
		transform: translateY(4px);
	}

	.slider {
		-webkit-appearance: none;
		width: 100%;
		height: 15px;
		border-radius: 5px;
		background: #d3d3d3;
		outline: none;
		opacity: 0.7;
		-webkit-transition: 0.2s;
		transition: opacity 0.2s;
	}

	/* Mouse-over effects */
	.slider:hover {
		opacity: 1;
		/* Fully shown on mouse-over */
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 25px;
		height: 25px;
		border-radius: 50%;
		background: #0439aa;
		cursor: pointer;
	}

	.slider::-moz-range-thumb {
		width: 25px;
		height: 25px;
		border-radius: 50%;
		background: #0439aa;
		cursor: pointer;
	}
</style>
