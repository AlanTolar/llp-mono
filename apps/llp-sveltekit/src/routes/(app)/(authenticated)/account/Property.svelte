<script lang="ts">
	import type { Property } from '@prisma/client';
	import { createEventDispatcher } from 'svelte';
	import type { PageData } from './$types';
	import { PUBLIC_3D_MODEL_PRICE_ID, PUBLIC_VIDEO_PRICE_ID } from '$env/static/public';

	export let property: PageData['listings'][number];
	export let index: number;

	const modalOpenedDispatch = createEventDispatcher();
	const editPropertyPermission = property.id !== 'demo';
</script>

<div class="card my-2">
	<div class="card-header">
		<div class="row">
			<div class="col-md-2 col-3 align-self-center">
				<button class="btn" data-bs-toggle="collapse" data-bs-target="#collapse_{index}">
					<i class="bi bi-chevron-down" />
				</button>
			</div>
			<div class="col-md-8 col-6 text-center align-self-center">
				<span>{property.name}</span>
			</div>
			<div class="col-md-2 col-3 align-self-center">
				<div class="d-flex text-nowrap justify-content-end">
					{#if editPropertyPermission}
						<button
							class="btn"
							data-bs-toggle="modal"
							data-bs-target="#removePropModal"
							on:click={() => modalOpenedDispatch('modalActivated', property.id)}
						>
							<i class="bi-trash" />
						</button>
						<button
							class="btn"
							data-bs-toggle="modal"
							data-bs-target="#renamePropModal"
							on:click={() => modalOpenedDispatch('modalActivated', property.id)}
						>
							<i class="bi-pencil" />
						</button>
					{:else}
						<button class="frozen link-secondary btn">
							<i class="bi-trash" />
						</button>
						<button class="frozen link-secondary btn">
							<i class="bi-pencil" />
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<div id="collapse_{index}" class="collapse card-body py-4">
		<div class="text-center">
			<a class="btn btn-outline-primary text-nowrap m-1" href="/{property.id}/map" type="button"
				>Map Maker</a
			>
			<!-- {#if property.animation?.user_access} -->
			<a class="btn btn-outline-primary text-nowrap m-1" href="/{property.id}/video" type="button"
				>Video Maker</a
			>
			<!-- {:else}
				<a class="btn btn-outline-secondary text-nowrap m-1 disabled" href="#" type="button"
					>Video Maker</a
				>
			{/if} -->
			<!-- {#if property.land_model?.user_access} -->
			<a class="btn btn-outline-primary text-nowrap m-1" href="/{property.id}/3d" type="button"
				>Model Maker</a
			>
			<!-- {:else}
				<a class="btn btn-outline-secondary text-nowrap m-1 disabled" href="#" type="button"
					>Model Maker</a
				>
			{/if} -->
		</div>
		<div class="row justify-content-around">
			<div class="col-lg-6 pt-4">
				<div class="d-flex flex-column">
					<div class="text-start align-self-center">
						<div class="p-1">
							<span class="fw-bold">Date Created:</span>
							{property.date_created}
						</div>
						<!-- <div class="p-1">
                          <span class="fw-bold">Access Until:</span> {property.date_expire}
                        </div> -->
						{#if !property.animation?.user_access || !property.land_model?.user_access}
							<div class="p-1">
								<div class="fw-bold me-1">
									Add Package (<a
										href="#"
										class="link-secondary"
										data-bs-toggle="modal"
										data-bs-target="#pricingModal">Package Summary</a
									>):
								</div>

								{#if !property.animation?.user_access && !property.land_model?.user_access}
									<div class="d-grid gap-2">
										<a
											type="button"
											class="btn btn-primary m-1 purchase-url"
											href="/api/create-checkout-session?{PUBLIC_3D_MODEL_PRICE_ID}&{PUBLIC_VIDEO_PRICE_ID}&propertyId={property.id}"
										>
											Model & Video Maker
										</a>
									</div>
								{/if}
								{#if !property.land_model?.user_access}
									<div class="d-grid gap-2">
										<a
											type="button"
											class="btn btn-primary m-1 purchase-url"
											href="/api/create-checkout-session?{PUBLIC_3D_MODEL_PRICE_ID}&propertyId={property.id}"
										>
											Upgrade 3D Model (Publicly Accessible URL)
										</a>
									</div>
								{/if}
								{#if !property.animation?.user_access}
									<div class="d-grid gap-2">
										<a
											type="button"
											class="btn btn-primary m-1 purchase-url"
											href="/api/create-checkout-session?{PUBLIC_VIDEO_PRICE_ID}&propertyId={property.id}"
										>
											Video Maker
										</a>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- {% include "users/partials/access_list.html" with property=property %} -->
		</div>
	</div>
</div>
