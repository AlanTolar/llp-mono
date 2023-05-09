<script lang="ts">
	import { sceneStore } from './sceneStore';
	import { Icon } from 'sveltestrap';
	import { sceneMap } from './map';
	import type { SceneSchema } from './updateScenes/+server';
	import type { PageData } from './$types';
	import { bootstrapPopover } from '$lib/scripts/bootstrap';
	import type mapboxgl from 'mapbox-gl';
	import { onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import Marker from '../3d/Marker.svelte';

	export let scene: SceneSchema;
	export let prop_geom: PageData['propGeom'];
	export let prop_center: PageData['propCenter'];

	let min_height = 0;
	let max_height = 2000;

	const scene_info = {
		orbit: {
			name: 'Orbit',
			header: 'Scene Type: Orbit',
			content:
				'Camera starts at the green marker then moves in a circle for a specified number of degrees while pointed at the blue marker'
		},
		line: {
			name: 'Line',
			header: 'Scene Type: Line',
			content:
				'Camera starts at the green marker then moves in a straight line to the red marker while pointed at the blue marker'
		},
		flyover: {
			name: 'Flyover',
			header: 'Scene Type: Flyover',
			content:
				'Camera starts at the green marker then moves in a straight line to the red marker while pointed directly down at the ground'
		}
	};

	function updateScene(elem: HTMLInputElement, id: string) {
		const value = elem.name === 'scroll_text' ? elem.value : Number(elem.value);
		sceneStore.updateScene(id, { [elem.name]: value });
	}

	let map: mapboxgl.Map;
	let markers: (mapboxgl.Marker | null)[];

	onDestroy(() => {
		if (browser && map) {
			map.remove();
			markers.forEach((marker) => {
				if (marker) marker.remove();
			});
			console.log('map and markers for scene removed');
		}
	});
</script>

<div class="card mb-1" data-id={scene.id}>
	<div class="card-header">
		<div class="d-flex justify-content-between align-items-center">
			<div>
				<Icon name="arrows-move" class="handle fa-lg" style="cursor:grab" />
				<button
					class="btn"
					data-bs-toggle="collapse"
					data-bs-target="#collapse_{scene.id}"
					on:click|once={() => ({ map, markers } = sceneMap(scene, prop_geom, prop_center))}
				>
					<Icon name="chevron-down" class="fa-lg" />
				</button>
			</div>
			<div>
				<h3 class="scene_type m-0" style="display:inline-block;">
					{scene_info[scene.type].name}
				</h3>
				<span
					use:bootstrapPopover
					title={scene_info[scene.type].header}
					data-content={scene_info[scene.type].content}
					><Icon id="btninfo_{scene.id}" name="info-circle" class="fa-lg ms-2" /></span
				>
			</div>
			<div>
				{#if $sceneStore.length > 1}
					<button type="button" class="btn" on:click={() => sceneStore.removeScene(scene.id)}>
						<Icon name="trash" class="fa-lg" />
					</button>
				{:else}
					<span
						use:bootstrapPopover
						title="Scene Minimum: 1"
						data-content="Add another scene first in order to delete this one"
					>
						<button id="btndelete_{scene.id}" class="btn freeze" disabled>
							<Icon name="trash" class="fa-lg" />
						</button></span
					>
				{/if}
			</div>
		</div>
	</div>
	<div id="collapse_{scene.id}" class="collapse">
		<div class="card-body">
			<div class="row">
				<div class="col-md-6 d-flex flex-column justify-content-center mb-1 mt-1">
					<div class="ratio ratio-4x3">
						<div class="embed-responsive-item">
							<div id="map_{scene.id}" class=" w-100 h-100" />
						</div>
					</div>
				</div>

				<div class="col-md-6 mb-3 justify-content-around mb-1 mt-1">
					<form class="h-100 form-control">
						{#if scene.type === 'orbit'}
							<div class="form-group">
								<div class="row">
									<label class="col col-auto" for="deg">Rotation (degrees):</label>
									<div class="col">
										<h6>{scene.deg}</h6>
									</div>
								</div>
								<input
									type="range"
									class="slider"
									min="-360"
									max="360"
									name="deg"
									value={scene.deg}
									on:input={updateScene(this, scene.id)}
								/>
							</div>
						{/if}

						<div class="form-group">
							<div class="row">
								<label class="col col-auto" for="alt">Altitude (meters):</label>
								<div class="col">
									<h6>
										{scene.alt.toFixed(0)}
									</h6>
								</div>
							</div>
							<input
								type="range"
								class="slider"
								min={min_height}
								max={max_height}
								value={scene.alt}
								name="alt"
								on:input={updateScene(this, scene.id)}
							/>
						</div>
						<div class="form-group">
							<div class="row">
								<label class="col col-auto" for="duration">Duration (seconds):</label>
								<div class="col">
									<h6>
										{(scene.duration / 1000).toFixed(0)}
									</h6>
								</div>
							</div>
							<input
								type="range"
								class="slider"
								min="1000"
								max="10000"
								step="1000"
								name="duration"
								value={scene.duration}
								on:input={updateScene(this, scene.id)}
							/>
						</div>
						<div class="form-group">
							<label for="scroll_text">Text:</label>
							<input
								class="form-control"
								type="text"
								name="scroll_text"
								maxlength="45"
								value={scene.scroll_text}
								on:input={updateScene(this, scene.id)}
							/>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
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
