<script lang="ts">
	import type { PageData } from './$types';
	import { Spinner, Icon } from 'sveltestrap';
	import {
		sceneStore,
		durationRngDerived,
		styleStore,
		animationStore,
		animationLength
	} from './sceneStore';
	import { onDestroy, onMount } from 'svelte';
	import type { Map } from 'mapbox-gl';
	import { videoMap, updateCameraPosition } from './map';
	import { drawCanvas } from './drawCanvas';
	import { s3PostPresignUrl } from '$lib/scripts/clientS3Upload';
	import cuid from 'cuid';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	// import type {CCapture} from 'ccapture.js';

	export let prop_geom: PageData['propGeom'];
	export let prop_center: PageData['propCenter'];
	export let map_style: PageData['map_style'];
	export let logo_url: string;
	export let conversionIdFromCrawler: false | null | string;

	let map: Map;
	let capturer: CCapture;
	let mapCanvas: HTMLCanvasElement;
	let mergeCanvas: HTMLCanvasElement;
	let mapIsSet = false;
	let logo: HTMLImageElement;

	onMount(async () => {
		capturer = new CCapture({ format: 'webm', framerate: 30, quality: 40 });
		map = videoMap(prop_geom, prop_center, $styleStore);
		map.once('load', function () {
			mapCanvas = map.getCanvas();
			const mergeCanvasElem = document.getElementById('merge-canvas');
			if (!mergeCanvasElem) throw new Error('merge-canvas not found');
			mergeCanvas = mergeCanvasElem as HTMLCanvasElement;
		});
		map.once('idle', function () {
			mapIsSet = true;
			// add function to window so that puppeteer can access it
			window.recordRun = runRecord;
		});
		// update mergeCanvas when map changes without animation running
		map.on('idle', function () {
			if (!animationRunning) renderFrame();
		});
		logo = new Image();
		logo.src = logo_url;
	});

	if (map_style) styleStore.set(map_style);
	styleStore.subscribe((value) => {
		if (map && map.isStyleLoaded()) {
			map.setPaintProperty(`boundary_fill`, 'fill-color', value.fill_color);
			map.setPaintProperty(`boundary_fill`, 'fill-opacity', value.fill_opacity);
			map.setPaintProperty(`boundary_outline`, 'line-color', value.line_color);
			map.setPaintProperty(`boundary_outline`, 'line-width', value.line_width);
		}
	});

	onDestroy(() => {
		if (browser && map) {
			map.remove();
			console.log('map for animation removed');
		}
	});

	// Set the logo image
	const scroll_duration = 500;
	function renderFrame() {
		if (!mapCanvas || !mergeCanvas) return;
		const currentScene = $sceneStore.at(sceneIndex);
		let scrollText = '';
		let bannerPosition = 0;
		if (currentScene) {
			scrollText = currentScene.scroll_text;
			const scrollPhase = scroll_duration / currentScene.duration;
			bannerPosition =
				(Math.min(animationPhase, 1 - animationPhase, scrollPhase) / (scrollPhase + 0.0000001)) *
					mapCanvas.width -
				mapCanvas.width;
		}
		drawCanvas(mapCanvas, mergeCanvas, logo, scrollText, bannerPosition);
	}

	//////////////

	function runRecord() {
		// await warmupRender();
		crawlerData = undefined;
		recording = true;
		numFramesRecorded = 0;
		animationRunning = true;
		lastTime = Date.now();
		animationTime = 0;
		sceneIndex = -1;
		frame(animationTime);
		capturer.start();
		console.log({ update: 'ANIMATION_PROCESSING' });
	}

	let conversionId: string;
	let crawlerData: { jobId: string; s3Key: string } | undefined;
	async function uploadVideo(blob: Blob) {
		conversionId = conversionIdFromCrawler || cuid();

		// upload webm to s3
		console.log({ update: 'WEBM_UPLOADING' });
		const s3Path = `properties/${$page.params.id}/video`;
		const videoUpload = s3PostPresignUrl(`${s3Path}/${conversionId}.webm`, 'video/webm', blob);
		const uploadResponse = await videoUpload;
		if (!uploadResponse.ok) {
			console.log({ update: 'ERROR_CRAWLER' });
			throw new Error('WebM upload failed');
		}

		// trigger MediaConvert job
		console.log({ update: 'CREATING_JOB' });
		const res = await fetch(
			`${$page.url.pathname}/createMediaConvertJob?filePath=${encodeURIComponent(
				s3Path
			)}&fileName=${encodeURIComponent(conversionId)}`
		);
		const data = await res.json();
		if (!data.Job) {
			console.log({ update: 'ERROR_CRAWLER' });
			throw new Error('MediaConvert job creation failed');
		}
		console.log({ update: 'JOB_CREATED' });
		crawlerData = { jobId: data.Job.Id, s3Key: `${s3Path}/${conversionId}` };
		window.CRAWLER_DATA = crawlerData;
	}

	////////////
	let lastTime = 0;
	let animationRunning = false;
	let animationTime = 0;
	let sceneIndex = 0;
	let animationPhase = 0;
	let recording = false;
	let numFramesRecorded = 0;
	// run one frame if paused when the map inits or the scenes change
	$: if ($sceneStore && map && !animationRunning) {
		frame(animationTime);
	}
	async function frame() {
		if ($sceneStore.length === 0) return;

		// Use time to find correct scene and when scene started
		const currentSceneIndex = $durationRngDerived.findIndex(
			(rng) => animationTime >= rng[0] && animationTime <= rng[1]
		);
		const isNewScene = currentSceneIndex !== sceneIndex;
		sceneIndex = currentSceneIndex;
		const sceneStartTime = $durationRngDerived.at(sceneIndex)?.at(0);
		if (typeof sceneStartTime !== 'number') throw new Error('sceneStartTime is undefined');

		// Calculate animation phase between 0 & 1 then move camera
		const currentAnimation = $animationStore.at(sceneIndex);
		if (!currentAnimation) throw new Error('currentAnimation is undefined');
		animationPhase = (animationTime - sceneStartTime) / currentAnimation.duration;
		let [position, altitude, target] = currentAnimation.animate(animationPhase);
		updateCameraPosition(position, altitude, target, map);

		// render frame and capture if recording
		renderFrame();
		if (recording) {
			// pause animation for once second to allow mapbox to load
			// if (isNewScene) {
			// 	await new Promise((resolve) => setTimeout(resolve, 3000));
			// }
			capturer.capture(mergeCanvas);
			numFramesRecorded++;
			if (numFramesRecorded % 10 === 0) {
				console.log({ progress: animationTime / $animationLength });
			}
		}

		// Update time
		const time = Date.now();
		if (animationRunning) animationTime += time - lastTime;
		lastTime = time;

		// Stop animation and set time to end if it's past the end
		if (animationTime >= $animationLength) {
			animationRunning = false;
			animationTime = $animationLength;
		}

		if (animationRunning) window.requestAnimationFrame(frame);

		if (recording && !animationRunning) {
			capturer.stop();
			capturer.save((blob) => uploadVideo(blob));
			recording = false;
		}
	}

	async function warmupRender() {
		const numberOfFrames = 12;
		const timePerFrame = 1000;
		const position = [prop_center.lng, prop_center.lat];
		const altitude =
			$sceneStore.map((scene) => scene.alt).reduce((a, b) => a + b, 0) / $sceneStore.length;
		let i = 0;
		while (i < numberOfFrames) {
			// point camera in circle around property, changine angle every frame
			const target = [
				prop_center.lng + Math.cos((i / numberOfFrames) * Math.PI * 2) * 0.005,
				prop_center.lat + Math.sin((i / numberOfFrames) * Math.PI * 2) * 0.005
			];
			updateCameraPosition(position, altitude, target, map);
			renderFrame();
			i++;
			await new Promise((resolve) => setTimeout(resolve, timePerFrame));
		}
	}

	const toggleAnimation = () => {
		animationRunning = !animationRunning;
		lastTime = Date.now();
		if (animationTime >= $animationLength) animationTime = 0;
		if (animationRunning) frame(animationTime);
	};

	function timestamp(millis: number) {
		const minutes = Math.floor(millis / 60000);
		const seconds = ((millis % 60000) / 1000).toFixed(0).padStart(2, '0');
		return minutes + ':' + seconds;
	}

	///////////////////////
</script>

<!-- <svelte:head>
	<script src="/cjs/CCapture.all.min.js"></script>
</svelte:head> -->

<!-- Mapbox Map -->
<div class="col-lg-8 mx-auto">
	<div id="map" class="ratio ratio-16x9">
		<canvas class:visible={mapIsSet} id="merge-canvas" style="z-index: 50;" />
		<div class:visible={mapIsSet} class="container text-center h-100">
			<div class="row h-100">
				<div class="col align-self-center">
					<div>
						<h3 class="mb-4">Animation Loading</h3>
						<Spinner class="text-center" color="primary" />
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
<div class="row">
	<div class="col-sm-auto col-6 order-sm-1 order-2 d-flex flex-row align-items-center mt-3">
		<button
			id="play-btn"
			class="btn btn-lg {animationRunning ? 'btn-danger' : 'btn-success'}"
			type="button"
			on:click={toggleAnimation}
		>
			<Icon name={animationRunning ? 'stop-fill' : 'play-fill'} class="fa-lg" />
		</button>
		<h6 class="fw-bold ms-3" id="timestamp">
			{timestamp(animationTime)}/{timestamp($animationLength)}
		</h6>
	</div>

	<div class="col-sm col-12 order-sm-2 order-1 d-flex flex-wrap align-items-center mt-3">
		<input
			type="range"
			min="0"
			max={$animationLength}
			bind:value={animationTime}
			class="slider"
			id="slider"
		/>
	</div>
</div>

{#if conversionIdFromCrawler}
	<div class="row">
		{#if mapIsSet}
			<div class="col-sm-auto col-6 order-sm-1 order-2 d-flex flex-row align-items-center mt-3">
				<button id="convert-animation" on:click={runRecord}>Convert</button>
			</div>
		{/if}

		{#if crawlerData}
			<div
				id="crawler-data"
				class="col-sm col-12 order-sm-2 order-1 d-flex flex-wrap align-items-center mt-3"
				data-crawler-data={crawlerData}
			>
				{JSON.stringify(crawlerData)}
			</div>
		{/if}
	</div>
{/if}

<!-- Form info missing alert -->
<div id="warnings" />

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

	#animations {
		position: absolute;
		z-index: 100;
		height: 100%;
		width: 100%;
	}

	#scroll_div {
		position: absolute;
		background-color: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
	}

	#scroll_text {
		position: absolute;
		color: white;
	}

	#logo_div {
		position: absolute;
		background-color: rgba(255, 255, 255, 1);
		border-radius: 0 0 50% 0;
		width: 9%;
		height: 16%;
		z-index: 101;
	}

	#logo_img {
		width: 70%;
		height: 70%;
		margin-left: 12%;
		margin-top: 12%;
	}
</style>
