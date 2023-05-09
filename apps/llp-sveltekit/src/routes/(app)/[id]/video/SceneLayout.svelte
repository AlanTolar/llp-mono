<script lang="ts">
	import type { PageData } from './$types';
	import { sceneStore, createDefaultScenes, styleStore, recentSave, updateDB } from './sceneStore';
	import type { defaultScenes } from './sceneStore';
	import { onMount } from 'svelte';
	import Scene from './Scene.svelte';
	import Sortable from 'sortablejs';
	import cuid from 'cuid';

	export let prop_box: PageData['propBox'];
	export let prop_geom: PageData['propGeom'];
	export let prop_center: PageData['propCenter'];
	export let scenes: PageData['scenes'];

	let defaultScenes: defaultScenes;

	function setDefaultScenes() {
		styleStore.set({
			line_color: '#000000',
			line_width: 3,
			fill_color: '#0080ff',
			fill_opacity: 0
		});
		sceneStore.setScenes([
			{ ...defaultScenes.orbit, id: cuid(), scroll_text: 'Located in City, State' },
			{ ...defaultScenes.line, id: cuid(), scroll_text: 'Information about the property' },
			{ ...defaultScenes.flyover, id: cuid(), scroll_text: 'Number of acres' },
			{ ...defaultScenes.orbit_2, id: cuid(), scroll_text: 'Call at 999-999-9999' }
		]);
	}

	let sortableElement: HTMLElement;
	onMount(async () => {
		defaultScenes = await createDefaultScenes(prop_box, prop_center);
		if (!scenes || scenes.length === 0) {
			setDefaultScenes();
		}
		const sortable = new Sortable(sortableElement, {
			handle: '.handle',
			animation: 200,
			onChange: (evt) => {
				const sortedIds = [...new Set(sortable.toArray())];
				console.log('sortedIds: ', sortedIds);
				sceneStore.sortScenes(sortedIds);
			}
		});
	});
</script>

<!-- Control animation scenes -->
<div class="row align-items-end">
	<div class="col-lg-4 col-auto me-auto order-lg-1 order-2 p-0">
		<div class=" ms-1">
			<button
				id="reset_film"
				class="btn btn-primary mb-2 mx-2"
				type="button"
				data-bs-toggle="modal"
				data-bs-target="#resetScenesModal">Reset</button
			>
		</div>
	</div>
	<div class="col-lg-4 order-lg-2 order-1 text-center d-flex justify-content-center">
		<h3 class="fw-bold">Edit Scenes</h3>
		{#if $recentSave}
			<h6 class="fw-bold text-success ms-3 align-self-center">Saved</h6>
		{/if}
	</div>
	<div class="col-lg-4 col-auto order-lg-3 order-3 d-flex justify-content-end p-0 w-full">
		<div class="dropdown">
			<button
				class="btn btn-primary  dropdown-toggle mb-2 mx-2"
				type="button"
				id="styleChangeButton"
				data-bs-toggle="dropdown"
				aria-haspopup="true"
				aria-expanded="false"
			>
				Boundary
			</button>
			<div class="dropdown-menu p-2" aria-labelledby="styleChangeButton">
				<h5 class="font-weight-bold text-center">Fill</h5>
				<form class="h-100 form-control">
					<div class="form-group d-flex aligns-items-center p-1">
						<label class="form-check-label me-3 text-center" for="fill_color_picker">Color</label>
						<input
							id="fill_color_picker"
							type="color"
							bind:value={$styleStore['fill_color']}
							on:change={updateDB}
						/>
					</div>
					<div class="form-group p-1">
						<label class="form-check-label mb-1" for="opacity">Opacity</label>
						<input
							id="opacity"
							type="range"
							class="slider"
							min="0"
							max="1"
							bind:value={$styleStore['fill_opacity']}
							on:change={updateDB}
							step="0.01"
						/>
					</div>
				</form>
				<h5 class="font-weight-bold text-center pt-3">Line</h5>
				<form class="h-100 form-control">
					<div class="form-group d-flex aligns-items-center p-1">
						<label class="form-check-label me-3 text-center" for="line_color_picker">Color</label>
						<input
							id="line_color_picker"
							type="color"
							bind:value={$styleStore['line_color']}
							on:change={updateDB}
						/>
					</div>
					<div class="form-group p-1">
						<label class="form-check-label mb-1" for="line_width">Width</label>
						<input
							id="line_width"
							type="range"
							class="slider"
							min="0"
							max="6"
							bind:value={$styleStore['line_width']}
							on:change={updateDB}
							step="1"
						/>
					</div>
				</form>
			</div>
		</div>

		{#if $sceneStore.length < 6}
			<div class="dropdown me-1">
				<button
					class="btn btn-primary dropdown-toggle mb-2 mx-2"
					type="button"
					id="dropdownMenuButton"
					data-bs-toggle="dropdown"
					aria-haspopup="true"
					aria-expanded="false"
				>
					Add Scene
				</button>
				<div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
					<button on:click={() => sceneStore.addScene(defaultScenes.orbit)} class="dropdown-item"
						>Orbit</button
					>
					<button on:click={() => sceneStore.addScene(defaultScenes.line)} class="dropdown-item"
						>Line</button
					>
					<button on:click={() => sceneStore.addScene(defaultScenes.flyover)} class="dropdown-item"
						>Flyover</button
					>
				</div>
			</div>
		{:else}
			<button id="btnadd" class="btn btn-secondary mb-2 freeze" type="button"> 6 Scene Max </button>
		{/if}
	</div>
</div>

<div bind:this={sortableElement} class="col">
	{#each $sceneStore as scene (scene.id)}
		<Scene {scene} {prop_center} {prop_geom} />
	{/each}
</div>

<!-- Reset Scenes Modal -->
<div class="modal fade" id="resetScenesModal" role="dialog" aria-hidden="true">
	<div class="modal-dialog" role="document">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title">Reset Scenes to Default</h5>
			</div>
			<div class="modal-body">
				Any edits you have made to the video will be lost. This action cannot be undone.
			</div>
			<div class="modal-footer justify-content-center">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
				<button
					type="button"
					class="btn btn-primary"
					data-bs-dismiss="modal"
					on:click={() => setDefaultScenes()}>Confirm</button
				>
			</div>
		</div>
	</div>
</div>
