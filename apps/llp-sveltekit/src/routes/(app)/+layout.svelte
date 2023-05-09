<script lang="ts">
	import { initFlash } from 'sveltekit-flash-message/client';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { beforeNavigate } from '$app/navigation';
	export let data: PageData;

	const flash = initFlash(page);
	beforeNavigate((nav) => {
		if ($flash && nav.from?.url.toString() != nav.to?.url.toString()) {
			$flash = undefined;
		}
	});

	let navBarElement: HTMLElement;
	function closeNavbar() {
		if (navBarElement.classList.contains('show')) {
			navBarElement.classList.remove('show');
		}
	}
</script>

<div class="d-flex flex-column" style="min-height: 100%;">
	<nav class="navbar navbar-expand-lg navbar-light bg-light static-top">
		<div class="container">
			<a href="/" on:click={closeNavbar}>
				<img class="me-2" style="height:40px" src="/favicon.ico" alt="" id="preload-img" /></a
			>
			<a class="navbar-brand fw-bold fs-2" href="/" on:click={closeNavbar}>Land Listing Pro</a>
			<button data-bs-toggle="collapse" class="navbar-toggler" data-bs-target="#navcol-1">
				<span class="navbar-toggler-icon" />
			</button>
			<div bind:this={navBarElement} class="collapse navbar-collapse text-nowrap" id="navcol-1">
				<ul class="navbar-nav ms-auto">
					{#if data.user}
						<li class="mx-3 fs-5">
							<a class="nav-link" href="/account" on:click={closeNavbar}>My Properties</a>
						</li>
						<li class="mx-3 fs-5">
							<a class="nav-link" href="/select" on:click={closeNavbar}>Select Property</a>
						</li>
						<li class="mx-3 fs-5">
							<form method="POST" action="/logout">
								<button type="submit" class="btn btn-link nav-link text-decoration-none"
									>Logout</button
								>
							</form>
						</li>
					{:else}
						<li class="mx-3 fs-5">
							<a class="nav-link" href="/login" on:click={closeNavbar}>Login</a>
						</li>
						<li class="mx-3 fs-5">
							<a class="nav-link" href="/register" on:click={closeNavbar}>Register</a>
						</li>
					{/if}
				</ul>
			</div>
		</div>
	</nav>
	{#if $flash}
		{@const bg = $flash.type == 'success' ? '#3D9970' : '#FF4136'}
		<!-- <div style:background-color={bg} class="flash">{$flash.message}</div> -->
		<div
			class="flash alert alert-{$flash.type} alert-dismissible fade show text-center"
			role="alert"
		>
			{$flash.message}
			<button type="button" class="btn-close me-auto" data-bs-dismiss="alert" aria-label="Close" />
		</div>
	{/if}
	<div class="flex-grow">
		<slot />
	</div>
</div>

<footer class="bg-dark text-center text-white mt-auto footer">
	<!-- Grid container -->
	<div class="container p-4 pb-0">
		<!-- Section: Social media -->
		<section class="mb-4">
			<a class="mx-3 link-light" href="/contact">Contact Us</a>
			<!-- <a class="mx-3 link-light" href="/faq">FAQ</a> -->
			<a class="mx-3 link-light" href="/terms">Terms & Conditions</a>
			<a class="mx-3 link-light" href="/privacy">Privacy Policy</a>
		</section>
		<!-- Section: Social media -->
	</div>
	<!-- Grid container -->

	<!-- Copyright -->
	<div class="text-center p-3" style="background-color: rgba(0, 0, 0, 0.2);">
		<p>Land Listing Pro, Copyright © {new Date().getFullYear()}</p>
	</div>
	<!-- Copyright -->
</footer>
