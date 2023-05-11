<script lang="ts">
	import { Alert } from 'sveltestrap';
	import type { Marker } from './map';
	import { PUBLIC_CDN_URL } from '$env/static/public';
	import { createEventDispatcher, onMount } from 'svelte';
	import { page } from '$app/stores';
	import cuid from 'cuid';
	import Uppy from '@uppy/core';
	import FileInput from '@uppy/file-input';
	import StatusBar from '@uppy/status-bar';
	import '@uppy/core/dist/style.css';
	import '@uppy/status-bar/dist/style.css';
	import '@uppy/file-input/dist/style.css';
	import Transloadit from '@uppy/transloadit';
	import { bootstrapTooltip } from '$lib/scripts/bootstrap';

	export let isOwner: boolean;
	export let marker: Marker;
	let imageError: string | null = null;
	let latitude = marker.markerData.latitude;
	let longitude = marker.markerData.longitude;
	let imageUrl = marker.markerData.s3_key;
	let showImageInput = imageUrl ? false : true;
	const inputId = `image-input-${marker.markerData.id}`;
	const progressId = `image-progress-${marker.markerData.id}`;

	const deleteMarkerDispatch = createEventDispatcher<{ deleteMarker: { id: string } }>();
	const uploadImageStartDispatch = createEventDispatcher<{ uploadImageStart: { id: string } }>();
	const uploadImageEndDispatch = createEventDispatcher<{ uploadImageEnd: { id: string } }>();

	onMount(async () => {
		if (isOwner) initUppy();
	});

	let uppy: Uppy;
	function initUppy() {
		uppy = new Uppy({
			debug: true,
			autoProceed: true,
			restrictions: {
				maxNumberOfFiles: 1,
				maxFileSize: 5 * 1024 * 1024,
				allowedFileTypes: ['image/*']
			},
			onBeforeFileAdded: (currentFile, files) => {
				// update name on data (file object), meta and UppyFile
				const name = `${cuid()}.${currentFile.extension}}`;
				const fileObject = currentFile.data;
				Object.defineProperty(fileObject, 'name', {
					writable: true,
					value: name
				});
				const modifiedFile = { ...currentFile, name, meta: { ...currentFile.meta, name } };
				return modifiedFile;
			}
		});

		uppy
			.use(FileInput, { target: `#${inputId}`, pretty: true })
			.use(StatusBar, {
				target: `#${progressId}`,
				hideUploadButton: true,
				hideAfterFinish: false
			})
			.use(Transloadit, {
				async assemblyOptions(file) {
					const res = await fetch(`/api/transloadit-params?propertyId=${$page.params.id}`);
					const settings = await res.json();
					console.log('settings: ', settings);
					return settings;
				},
				waitForEncoding: true,
				alwaysRunAssembly: true
				// fields: {
				// 	path: `/properties/${$page.params.id}/model/markers`
				// }
			});

		uppy.on('transloadit:complete', (assembly) => {
			const compressedUrl = assembly.results.compress_image[0].ssl_url;
			const compressedPath = compressedUrl?.split('.com/').pop();
			if (compressedPath) {
				imageUrl = compressedPath;
				marker.markerData.s3_key = compressedPath;
			}
			imageError = null;
			showImageInput = false;
		});

		uppy.on('upload', (data) => {
			uploadImageStartDispatch('uploadImageStart', { id: marker.markerData.id });
		});
		uppy.on('complete', (result) => {
			uploadImageEndDispatch('uploadImageEnd', { id: marker.markerData.id });
		});
		uppy.on('upload-success', (file, response) => {
			// console.log('file: ', file);
		});
		uppy.on('error', (error) => {
			imageError = 'Error uploading image';
		});

		uppy.on('restriction-failed', (file, error) => {
			imageError = error.message;
		});
	}

	marker.marker.on('drag', function () {
		const lngLat = marker.marker.getLngLat();
		latitude = lngLat.lat;
		longitude = lngLat.lng;
	});

	function deleteMarker() {
		marker.remove();
		deleteMarkerDispatch('deleteMarker', { id: marker.markerData.id });
	}
</script>

<div class="row" data-id={marker.markerData.id}>
	<div class="hide-if-sort col-lg-2 col-sm-1 col-2 fw-bold fs-2 pt-1 text-center">
		{marker.markerData.order}
	</div>
	<div class="col-lg-10 col-sm-11 col-10 mb-1">
		<div class="card">
			<div class="card-header d-flex flex-row justify-content-between align-items-center">
				<div class="col-auto">
					<button type="button" class="btn handle" style="cursor:grab"
						><i class="bi-arrows-move" /></button
					>
					<button
						class="btn"
						data-bs-toggle="collapse"
						data-bs-target="#collapse_boundary_{marker.markerData.id}"
					>
						<i class="bi-chevron-down" />
					</button>
				</div>
				<h5 class="col text-truncate">
					Marker {marker.markerData.order}
				</h5>
				<button type="button" class="btn" on:click={deleteMarker}><i class="bi-trash" /></button>
			</div>
			<div
				id="collapse_boundary_{marker.markerData.id}"
				class="card-body justify-content-around collapse"
			>
				<p>
					<span class="fw-bold">Longitude:</span>
					{latitude.toFixed(5)}
				</p>
				<p>
					<span class="fw-bold">Latitude:</span>
					{longitude.toFixed(5)}
				</p>

				<div>
					<label for="formFile" class="col-form-label fw-bold">File</label>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					{#if imageUrl}
						<span
							class="ms-2 link-secondary"
							on:click={() => {
								showImageInput = !showImageInput;
								isOwner ?? uppy.cancelAll();
							}}
							style="cursor:pointer"
							>{showImageInput ? '(Cancel)' : '(Change Image)'}
						</span>
					{/if}

					{#if isOwner}
						<div id={inputId} style:display={showImageInput ? 'block' : 'none'} />
					{:else}
						<div style:display={showImageInput ? 'block' : 'none'}>
							<span
								class="d-inline-block"
								use:bootstrapTooltip
								title="Images can only be updated by the owner"
							>
								<button id="btnupdate" class="btn btn-secondary freeze" type="button" disabled
									>Update Image</button
								>
							</span>
						</div>
					{/if}
					{#if !showImageInput}
						<div class="mt-1 mb-3">
							<a
								href={PUBLIC_CDN_URL + imageUrl}
								target="_blank"
								rel="noreferrer"
								class="link-dark"
							>
								Marker {marker.markerData.order}</a
							>
						</div>
					{/if}
					<div id={progressId} />

					<Alert
						color="danger"
						isOpen={typeof imageError === 'string'}
						toggle={() => (imageError = null)}
						fade={false}
					>
						{imageError}
					</Alert>
				</div>

				<div class="form-check py-4">
					<label class="form-check-label fw-bold" for="flexCheckDefault"> Panorama </label>
					<input
						class="form-check-input"
						type="checkbox"
						checked={marker.markerData.pano}
						id="flexCheckDefault"
						name="pano"
						on:input={(e) => {
							marker.markerData.pano = e.target?.checked;
						}}
					/>
				</div>
			</div>
		</div>
	</div>
</div>
