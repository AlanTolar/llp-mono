<script lang="ts">
	import type { PageData } from './$types';
	import { conversionStore, hasActiveConversion, modifiedConversionStore } from './conversionStore';
	import { PUBLIC_CDN_URL, PUBLIC_PUSHER_KEY, PUBLIC_PUSHER_CLUSTER } from '$env/static/public';
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { bootstrapTooltip } from '$lib/scripts/bootstrap';

	export let conversions: PageData['conversions'];
	export let isOwner: PageData['isOwner'];

	let pollConversionInterval: NodeJS.Timeout;
	onMount(async () => {
		conversionStore.initConversions(conversions);
		// poll server for updates to the conversion status
		pollConversionInterval = setInterval(() => {
			if ($hasActiveConversion) {
				conversionStore.refreshConversions($page.url.pathname);
			}
		}, 5000);
	});
	onDestroy(() => {
		clearInterval(pollConversionInterval);
		console.log('clearing interval');
	});

	function create_date(timestamp: Date) {
		let date = new Date(timestamp);
		const options = {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		};
		const date_formatted = date.toLocaleDateString('en-US', options);
		return date_formatted;
	}

	let previewVideoUrl: string;
</script>

<div class="row align-items-end">
	<div class="col-lg-4 order-lg-1 order-2">
		{#if !isOwner}
			<span
				class="d-inline-block"
				use:bootstrapTooltip
				title="Only the owner of this property can convert the animation to a video."
			>
				<button class="btn mb-2 btn-secondary freeze" type="button" disabled
					>Convert to Video</button
				>
			</span>
		{:else if $hasActiveConversion}
			<span
				class="d-inline-block"
				use:bootstrapTooltip
				title="Can convert only one video at a time. New conversion can be started once current conversion finishes or fails."
			>
				<button id="convert-btn" class="btn mb-2 btn-secondary freeze" type="button" disabled
					>Converting...</button
				>
			</span>
		{:else}
			<button
				class="btn mb-2 btn-primary"
				on:click={() => conversionStore.createConversion($page.url.pathname)}
				type="button">Convert to Video</button
			>
		{/if}
	</div>
	<div class="col-lg-4 order-lg-2 order-1 text-center align-self-center">
		<h3 class="fw-bold">Convert & Download</h3>
	</div>
</div>

<table class="table table-hover">
	<thead>
		<tr>
			<th class="text-center" style="width: 30%;">Date/Time</th>
			<th class="text-center">Status</th>
			<th class="text-center" style="width: 20%;" />
		</tr>
	</thead>
	<tbody>
		{#each $modifiedConversionStore as conversion (conversion.id)}
			<tr>
				<td class="align-middle">{create_date(conversion.date_created)}</td>
				<td class="align-middle">
					{#if conversion.progress}
						<br />
						<div class="progress">
							<div class="progress-bar" role="progressbar" style="width: {conversion.progress}%">
								{conversion.progress}%
							</div>
						</div>
						<div class="w-100">
							<span class="fs-6 fw-light text-wrap">{conversion.statusMessage}</span>
						</div>
					{:else}
						{conversion.statusMessage}
					{/if}
				</td>
				<td class="text-center align-middle">
					{#if conversion.status === 'COMPLETED'}
						<button
							class="btn btn-primary"
							type="button"
							data-bs-toggle="modal"
							data-bs-target="#videoPreviewModal"
							on:click={() => {
								previewVideoUrl = `${PUBLIC_CDN_URL}${conversion.s3_key}.mp4`;
							}}
						>
							<i class="bi bi-eye" />
						</button>
						<a href={`${PUBLIC_CDN_URL}${conversion.s3_key}.mp4`} download>
							<button class="btn btn-primary" type="button">
								<i class="bi bi-download" />
							</button>
						</a>

						<button
							class="btn btn-primary"
							type="button"
							on:click={() => {
								navigator.clipboard.writeText(`${PUBLIC_CDN_URL}${conversion.s3_key}.mp4`);
							}}
						>
							<i class="bi bi-clipboard" />
						</button>
					{/if}
				</td>
			</tr>
		{/each}
	</tbody>
</table>

{#if $conversionStore.length === 0}
	<br />
{/if}

<!-- Preview Video Model -->
<div class="modal fade" id="videoPreviewModal" role="dialog" aria-hidden="true">
	<div class="modal-dialog" role="document">
		<div class="modal-content">
			<video class="modal-body" src={previewVideoUrl} controls muted />
			<div class="modal-footer justify-content-center">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
				<a href={previewVideoUrl} download={previewVideoUrl}>
					<button type="button" class="btn btn-primary" data-bs-dismiss="modal">Go To URL</button>
				</a>
			</div>
		</div>
	</div>
</div>
