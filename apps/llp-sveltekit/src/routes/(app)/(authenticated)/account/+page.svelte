<script lang="ts">
	import Property from './Property.svelte';
	import type { PageData } from './$types';
	import PricingSection from '$lib/components/PricingSection.svelte';

	export let data: PageData;
	const { listings, user } = data;

	let clickedPropertyId: number;
</script>

<main class="page">
	<section class="my-5">
		<div class="container">
			<ul class="nav nav-tabs" id="myTab" role="tablist">
				<li class="nav-item" role="presentation">
					<button
						class="nav-link active"
						id="properties-tab"
						data-bs-toggle="tab"
						data-bs-target="#properties"
						type="button"
						role="tab"
						aria-controls="properties"
						aria-selected="true">Properties</button
					>
				</li>
				<li class="nav-item" role="presentation">
					<button
						class="nav-link"
						id="profile-tab"
						data-bs-toggle="tab"
						data-bs-target="#profile"
						type="button"
						role="tab"
						aria-controls="profile"
						aria-selected="false">Profile</button
					>
				</li>
			</ul>
			<div class="tab-content" id="myTabContent">
				<div
					class="tab-pane fade show active"
					id="properties"
					role="tabpanel"
					aria-labelledby="properties-tab"
				>
					<div class="col-xl-8 col-lg-10 mx-auto m-4">
						{#if user?.email}
							{#if listings}
								{#each listings as property, index}
									<Property
										{property}
										{index}
										on:modalActivated={(event) => (clickedPropertyId = event.detail)}
									/>
								{/each}
							{/if}
						{:else}
							<h3 class="text-center">
								Verification Email Sent to <span class="fw-bold">test@email.com</span>
							</h3>
							<ul class="p-3">
								<li class="p-1">
									Click the link in the verification email to <strong>access your purchases</strong
									>.
								</li>
								<li class="p-1">
									If you need to change your email and/or resend the verification email then go to
									the <a class="link-secondary" href="/accounts/email/">Email Details</a> page.
								</li>
								<li class="p-1">
									If you have trouble verifying your email, reach out to us through the <a
										class="link-secondary"
										href="/contact">Contact Us</a
									> page.
								</li>
							</ul>
						{/if}
					</div>
				</div>

				<div class="tab-pane fade" id="profile" role="tabpanel" aria-labelledby="profile-tab">
					<div class="col-xl-4 col-lg-5 col-md-6 mx-auto m-4">
						<!-- Create a section that displays current user info, like name, email and account created date -->
						<h3 class="text-center pb-3">Profile</h3>
						<div class="pb-5">
							{#if user?.email}
								<div class="d-flex justify-content-between">
									<span class="fw-bold">Email:</span>
									<span>{user?.email}</span>
								</div>
							{/if}
							{#if user?.name}
								<div class="d-flex justify-content-between">
									<span class="fw-bold">Name:</span>
									<span>{user?.name}</span>
								</div>
							{/if}
							{#if user?.created}
								<div class="d-flex justify-content-between">
									<span class="fw-bold">Account Created:</span>
									<span>{user?.created}</span>
								</div>
							{/if}
						</div>
						<div class="d-flex flex-column gap-3" />

						<div class="d-flex flex-column flex-md-row justify-content-center gap-4">
							<button
								class="btn btn-outline-danger"
								data-bs-toggle="modal"
								data-bs-target="#deleteAccountModal"
							>
								<i class="bi-trash" />
								Delete Account
							</button>
							<a class="btn btn-outline-primary" href="/reset-password">
								<i class="bi-key" />
								Reset Password
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Pricing Modal -->
	<div class="modal fade p-3" id="pricingModal" role="dialog" aria-hidden="true">
		<div class="modal-dialog modal-xl" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title fw-bold text-center">Package Pricing</h5>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" />
				</div>
				<div
					class="modal-body"
					style=" background-image: url('/mountains-bg.jpg'); height: 100%; background-repeat: no-repeat;
            background-size: cover; "
				>
					<PricingSection />
				</div>
			</div>
		</div>
	</div>
	<!-- Remove Property Modal -->
	<div class="modal fade" id="removePropModal" role="dialog" aria-hidden="true">
		<div class="modal-dialog" role="document">
			<form method="POST" action="?/deleteProperty&id={clickedPropertyId}" class="modal-content">
				<div class="modal-body">Do you want to delete this property?</div>
				<div class="modal-footer justify-content-center">
					<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
					<button
						id="remove-property-btn"
						type="submit"
						class="btn btn-danger"
						data-bs-dismiss="modal">Delete</button
					>
				</div>
			</form>
		</div>
	</div>
	<!-- Rename Property Modal -->
	<div class="modal fade" id="renamePropModal" role="dialog" aria-hidden="true">
		<div class="modal-dialog" role="document">
			<form method="POST" action="?/renameProperty&id={clickedPropertyId}" class="modal-content">
				<div class="modal-body">
					<div class="form-group">
						<label for="new_name">Property Name:</label>
						<input class="form-control" name="new_name" type="text" id="new_name" />
					</div>
				</div>
				<div class="modal-footer justify-content-center">
					<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
					<button
						id="rename-property-btn"
						type="submit"
						class="btn btn-primary"
						data-bs-dismiss="modal">Rename</button
					>
				</div>
			</form>
		</div>
	</div>

	<!-- Delete account model -->
	<div class="modal fade" id="deleteAccountModal" role="dialog" aria-hidden="true">
		<div class="modal-dialog" role="document">
			<form method="POST" action="?/deleteAccount" class="modal-content">
				<div class="modal-body">
					Do you want to permanently delete your account? All data associated with your will be
					deleted.
				</div>
				<div class="modal-footer justify-content-center">
					<button type="button" class="btn btn-secondary" data-bs-dismiss="modal"
						>No, Keep My Account</button
					>
					<button
						id="delete-account-btn"
						type="submit"
						class="btn btn-danger"
						data-bs-dismiss="modal">Yes, Permanently Delete</button
					>
				</div>
			</form>
		</div>
	</div>
</main>
