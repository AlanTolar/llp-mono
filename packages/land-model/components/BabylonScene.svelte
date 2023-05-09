<script context="module" lang="ts">
  export interface ComponentEvent {
    terrainDataReady: {
      terrainURL: string;
      elevationRange: [number, number];
      lonMeters: number;
      latMeters: number;
    };
    event2: { bar: number };
  }
</script>

<script lang="ts">
  import LoadingScreen from './LoadingScreen.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { ParcelCoordinateHelper } from './parcelCoordinateHelper';
  import { BabylonScene, Marker } from './modelScene';
  import { canvasRGB } from 'stackblur-canvas';
  import type { ModelMarker } from '@prisma/client';

  export let prop_geom: number[][][][];
  export let model_markers: ModelMarker[] = [];
  export let debugMode = false;
  export let fullscreenMode = false;
  export let instructionsMode = false;
  export let backgroundColor = '';
  export let cdnUrl: string;
  export let mapboxToken: string;

  let canvasElement: HTMLCanvasElement;
  let canvasContainer: HTMLDivElement;
  let showLoadingScreen = true;
  let babylonScene: BabylonScene | null = null;
  let showDebug = false;
  let showInstructions = false;
  let isFullscreen = false;
  let isTouchDevice: boolean;

  interface DebugImgs {
    [key: string]: string;
  }
  const debugImgs: DebugImgs = {};

  function enterFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      isFullscreen = false;
    } else if (document.fullscreenEnabled) {
      canvasContainer.requestFullscreen();
      isFullscreen = true;
    }
  }

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<ComponentEvent>();

  onMount(async () => {
    isFullscreen = document.fullscreenElement ? true : false;
    isTouchDevice = 'ontouchstart' in document.documentElement ?? false;

    const {
      fetchImages,
      canvasRGBtoGray,
      createCanvas,
      getParcelDimensions,
      canvasOverlay,
      multiPolygonToCanvas,
      heightRangeFromCanvas
    } = await import('./ingredients');

    console.time('Model Creation');

    // get tile ids, relative coordinates, dimensions and coord cropping window
    const coordHelper = new ParcelCoordinateHelper(prop_geom, 0.01);
    // coordHelper.simplifyPolygon([80, 100]);
    const tiles = coordHelper.tileSelection();
    const relativeCoords = coordHelper.boundaryCoordsRelativeToBounds();
    const croppingWindow = coordHelper.tileCroppingWindow();
    console.log('croppingWindow: ', croppingWindow);

    // create satellite image
    const satImgs = await fetchImages('mapbox.satellite', tiles, mapboxToken);
    let satelliteCanvas = createCanvas(tiles, satImgs, croppingWindow);
    const satelliteURL = satelliteCanvas.toDataURL();
    if (debugMode) debugImgs['satellite'] = satelliteURL;

    // create terrain height map
    const terrainImgs = await fetchImages('mapbox.terrain-rgb', tiles, mapboxToken);
    let terrainCanvas = createCanvas(tiles, terrainImgs, croppingWindow);
    const rgbTerrainURL = terrainCanvas.toDataURL();
    if (debugMode) debugImgs['terrain rgb'] = rgbTerrainURL;
    const elevationRange = canvasRGBtoGray(terrainCanvas);
    const maxDimension = Math.max(croppingWindow.xDistance, croppingWindow.yDistance);
    const smoothing = 1 + Math.floor(10000 / maxDimension);
    console.log('smoothing: ', smoothing);
    canvasRGB(terrainCanvas, 0, 0, terrainCanvas.width, terrainCanvas.height, smoothing);
    const terrainURL = terrainCanvas.toDataURL();
    if (debugMode) debugImgs['terrain'] = terrainURL;

    // need parcel dimensions to scale model
    const depth = elevationRange[1] - elevationRange[0];
    const parcelDimensions = getParcelDimensions(croppingWindow, terrainCanvas, depth, 100);
    console.log('parcelDimensions: ', parcelDimensions);
    const outlineThickness = Math.max(
      1,
      Math.round(Math.max(terrainCanvas.width, terrainCanvas.height) * 0.001)
    );

    // add polygon outline to terrain height map for display
    const polygonOutlineCanvas = multiPolygonToCanvas(
      relativeCoords,
      terrainCanvas.width,
      terrainCanvas.height,
      false,
      outlineThickness * 4,
      'yellow'
    );
    const polygonOutlineURL = polygonOutlineCanvas.toDataURL();
    if (debugMode) debugImgs['polygon outline'] = polygonOutlineURL;
    const terrainWithOutlineCanvas = canvasOverlay(terrainCanvas, polygonOutlineCanvas);
    const terrainWithOutlineURL = terrainWithOutlineCanvas.toDataURL();
    if (debugMode) debugImgs['terrain with polygon outline'] = terrainWithOutlineURL;
    dispatch('terrainDataReady', {
      terrainURL: terrainWithOutlineURL,
      elevationRange,
      lonMeters: coordHelper.meterDimensions.x,
      latMeters: coordHelper.meterDimensions.y
    });

    // calculate edge depth to get correct height for dirt mesh
    const polygonOutlineInverseCanvas = multiPolygonToCanvas(
      relativeCoords,
      terrainCanvas.width,
      terrainCanvas.height,
      true,
      outlineThickness
    );
    const polygonOutlineInverseURL = polygonOutlineInverseCanvas.toDataURL();
    if (debugMode) debugImgs['polygon outline inverse'] = polygonOutlineInverseURL;
    const terrainOutlineCanvas = canvasOverlay(terrainCanvas, polygonOutlineInverseCanvas, true);
    const edgeDepthRange = heightRangeFromCanvas(terrainOutlineCanvas, parcelDimensions.depth);
    const maskedTerrainURL = terrainOutlineCanvas.toDataURL();
    if (debugMode) debugImgs['terrain masked by polygon outline inverse'] = maskedTerrainURL;

    // create masked satellite image
    const polygonInverseCanvas = multiPolygonToCanvas(
      relativeCoords,
      satelliteCanvas.width,
      satelliteCanvas.height,
      true
    );
    const polygonInverseURL = polygonInverseCanvas.toDataURL();
    if (debugMode) debugImgs['polygon inverse'] = polygonInverseURL;
    const thickerPolygonInverseCanvas = canvasOverlay(
      polygonInverseCanvas,
      terrainOutlineCanvas // use this outline because it's thinner
    );
    const thickerPolygonInverseURL = thickerPolygonInverseCanvas.toDataURL();
    if (debugMode) debugImgs['polygon inverse + outline'] = thickerPolygonInverseURL;
    const maskedSatelliteCanvas = canvasOverlay(satelliteCanvas, thickerPolygonInverseCanvas, true);
    const maskedSatelliteURL = maskedSatelliteCanvas.toDataURL();
    if (debugMode) debugImgs['satellite masked by polygon inverse + outline'] = maskedSatelliteURL;

    // create babylon scene
    babylonScene = new BabylonScene(canvasElement, parcelDimensions, backgroundColor);
    babylonScene.createDirtMesh(relativeCoords, terrainURL, edgeDepthRange);
    await babylonScene.createGroundPlane(terrainURL, maskedSatelliteURL);

    // add markers to scene
    babylonScene._scene.onReadyObservable.addOnce(() => {
      console.timeLog('Model Creation', 'land mesh created');
      showLoadingScreen = false;
      const activeMarker = model_markers.sort((a, b) => a.order - b.order).at(0);
      model_markers.forEach((marker, index) => {
        const active = marker === activeMarker;
        const imageUrl = marker.s3_key ? cdnUrl + marker.s3_key : null;
        new Marker(
          babylonScene as BabylonScene,
          marker.longitude,
          marker.latitude,
          imageUrl,
          prop_geom,
          active,
          marker.pano,
          coordHelper
        );
      });
      console.timeLog('Model Creation', 'markers created');
    });
  });

  onDestroy(() => {
    if (babylonScene) {
      // need all these to avoid memory leaks
      babylonScene._scene.dispose();
      babylonScene._engine.dispose();
      babylonScene = null;
      canvasElement.remove();
    }
  });

  let canvasHeight = 0;
  let canvasWidth = 0;
</script>

<svelte:head>
  <script src="https://cdn.lordicon.com/ritcuqlt.js"></script>
</svelte:head>

<div
  bind:clientHeight={canvasHeight}
  bind:clientWidth={canvasWidth}
  bind:this={canvasContainer}
  class="whole-screen"
>
  <canvas
    bind:this={canvasElement}
    class="whole-screen"
    style="background-color: {backgroundColor};"
  />
  <div class:d-none={!showLoadingScreen} id="loadingScreen" class="whole-screen">
    <LoadingScreen text="Loading 3D Model" {backgroundColor} />
  </div>
  {#if debugMode}
    <div id="debug-btn">
      <i
        class="bi bi-bug-fill"
        on:click={() => (showDebug = true)}
        on:keypress={() => (showDebug = true)}
      />
    </div>

    <div
      id="debugScreen"
      class="whole-screen"
      class:d-none={!showDebug}
      on:click={() => (showDebug = false)}
      on:keydown={(e) => {
        if (e.key === 'Escape') showDebug = false;
      }}
    >
      <div class="d-flex justify-content-center pt-3 gap-5">
        <button on:click={() => (babylonScene ? babylonScene.exportScene(`babylon.glb`) : null)}
          >Download Model (.glb)</button
        >
      </div>
      <div class="d-flex justify-content-center pt-3 pb-3 gap-2 flex-wrap">
        {#each Object.entries(debugImgs) as [key, value]}
          <div class="m-3">
            <p class="text-wrap">{key}</p>
            <img
              src={value}
              alt={key}
              class="debug-img"
              style="max-width: {canvasWidth * 0.8}px; max-height: {canvasHeight * 0.5}px"
            />
          </div>
        {/each}
      </div>
    </div>
  {/if}
  <!-- {#if fullscreenMode && isTouchDevice === false} -->
  <button id="fullscreenButton" on:click={enterFullscreen}>
    {#if isFullscreen}
      <i class="bi bi-fullscreen-exit" />
    {:else}
      <i class="bi bi-arrows-fullscreen" />
    {/if}
  </button>
  <!-- {/if} -->
  {#if instructionsMode}
    <div id="info-btn">
      <i
        class="bi bi-info-circle-fill justify-content-center"
        on:click={() => (showInstructions = true)}
        on:keypress={() => (showInstructions = true)}
      />
    </div>
    <div
      id="instructions"
      class="whole-screen d-flex h-100 text-center"
      class:d-none={!showInstructions}
      on:click={() => (showInstructions = false)}
      on:keydown={(e) => {
        if (e.key === 'Escape') showInstructions = false;
      }}
    >
      <div class="flex-grow-1 align-self-center">
        {#key isTouchDevice}
          <lord-icon
            class="animated-icon"
            src={isTouchDevice
              ? '/1665-zoom-in-two-fingers-outline-edited.json'
              : '/1318-computer-mouse-mouse-scrolling-outline-edited.json'}
            trigger="loop"
            colors="primary:#121331,secondary:#08a88a"
            stroke="70"
          />
        {/key}
        <h5>Zoom</h5>
      </div>
      <div class="mx-auto flex-shrink-1" style="width:30%; margin-top: 10%;">
        <h2 class="fs-2">
          {isTouchDevice ? 'Tap' : 'Click'} anywhere to start
        </h2>
      </div>
      <div class="flex-grow-1 align-self-center">
        {#key isTouchDevice}
          <lord-icon
            class="animated-icon"
            src={isTouchDevice
              ? '/1444-swipe-left-right-outline-edited.json'
              : 'https://cdn.lordicon.com/pndvzexs.json'}
            trigger="loop"
            colors="primary:#121331,secondary:#08a88a"
            stroke="70"
          />
        {/key}
        <h5>Rotate</h5>
      </div>
    </div>
  {/if}
</div>

<style>
  #loadingScreen {
    cursor: default;
  }

  #debugScreen {
    cursor: default;
    background: rgba(255, 255, 255, 0.4);
    overflow-y: scroll;
  }

  .whole-screen {
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    background-position: center center;
    background-repeat: no-repeat;
    background-attachment: fixed;
    background-size: cover;
    cursor: grab;
  }

  #debug-btn {
    color: white;
    position: absolute;
    bottom: 5px;
    right: 10px;
    font-size: 30px;
    cursor: pointer;
    background-size: 100% 100%;
  }

  .debug-img {
    display: block;
    width: auto;
    height: auto;
  }

  #instructions {
    background: rgba(255, 255, 255, 0.4);
    cursor: pointer;
  }

  #fullscreenButton {
    position: absolute;
    z-index: 1000;
    top: 10px;
    left: 10px;
    width: 2.5rem;
    height: 2.5rem;
    /* aspect-ratio: 1/1; */
    text-align: center;
    background-color: #fff;
    color: #333;
    /* border: 1px solid #ccc; */
    cursor: pointer;
  }
  #fullscreenButton:hover {
    background-color: #f0f0f0;
  }

  #fullscreenButton > i {
    font-size: 1.5rem;
    -webkit-text-stroke: 1.5px;
  }

  #info-btn {
    color: white;
    position: absolute;
    top: 5px;
    right: 10px;
    font-size: 30px;
    cursor: pointer;
    background-size: 100% 100%;
  }

  .animated-icon {
    width: 50%;
    height: auto;
    max-height: 80%;
    aspect-ratio: 1/1;
  }
</style>
