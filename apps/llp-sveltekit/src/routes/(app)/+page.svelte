<script>
	import PricingSection from '$lib/components/PricingSection.svelte';
	import ModelFrame from '$lib/components/ModelFrame.svelte';

	const agentDemoUrl = 'https://demo.landlistingpro.com';
</script>

<!-- Background image -->
<main class="page landing-page">
	<section class="sectionOne">
		<div
			class="p-5 text-center"
			style="
  background-image: url('/mountains-bg.jpg');
  height: 50vh;
  background-size: cover;
"
		>
			<div class="img d-flex justify-content-center align-items-center h-100">
				<img class="mh-100 mw-100" alt="LLP Logo" src="/LLP_large_transparent.png" />
			</div>
		</div>
	</section>

	<section id="model-maker">
		<div class="container pt-5 pb-5">
			<div class="row justify-content-between">
				<div class="d-flex flex-column justify-content-between col-lg-4 pt-2 pb-2">
					<div>
						<h3 class="fw-bold text-center">Model Maker</h3>
						<p class="fst-italic text-center mb-0 mt-2">
							<small>Interactive 3D model to bring your property to life</small>
						</p>
					</div>
					<p class="mt-4 mb-4 flex-grow-1">
						The Model Maker creates an interactive 3D model of your property which can be embedded
						with panoramic and standard photos. The interactive model will have it's own URL on our
						website that you can share with potential buyers!
					</p>
					<div class="row">
						<div class="col-6 d-grid">
							<a class="btn btn-outline-primary" href="/demo/3d" type="button">Live Demo</a>
						</div>
						<div class="col-6 d-grid">
							<a class="btn btn-outline-primary" href="#model-card" type="button">Pricing</a>
						</div>
					</div>
				</div>
				<div class="col-lg-7 text-center pt-2 pb-2">
					<ModelFrame model_url={'/demo/3d/display'} />
				</div>
			</div>
		</div>
	</section>
	<section id="video-maker" style="background: rgb(246,246,246);">
		<div class="container pt-5 pb-5">
			<div class="row justify-content-between">
				<div class="d-flex flex-column justify-content-between col-lg-4 pt-2 pb-2">
					<div>
						<h3 class="fw-bold text-center">Video Maker</h3>
						<p class="fst-italic text-center mb-0 mt-2">
							<small>Customized videos to show off property features</small>
						</p>
					</div>
					<p class="mt-4 mb-4 flex-grow-1">
						The Video Maker creates an elegant and effective film for your property. Users can
						control the camera's movement, shot length and scrolling text to make the film truly
						unique. Try the Video-Maker for free to see all it has to offer!
					</p>
					<div class="row">
						<div class="col-6 d-grid">
							<a class="btn btn-block btn-outline-primary" href="/demo/video" type="button"
								>Live Demo</a
							>
						</div>
						<div class="col-6 d-grid">
							<a class="btn btn-outline-primary" href="#video-card" type="button">Pricing</a>
						</div>
					</div>
				</div>
				<div class="col-lg-7 text-center pt-2 pb-2">
					<video
						class="ratio ratio-16x9"
						src="https://dc2rbl97u4lsg.cloudfront.net/properties/demo/video/clgmmcco80008if106ob5qlzx.mp4"
						autoplay
						muted
						loop
						playsinline
					/>
				</div>
			</div>
		</div>
	</section>
	<section id="map-maker">
		<div class="container pt-5 pb-5">
			<div class="row justify-content-between">
				<div class="d-flex flex-column justify-content-between col-lg-4 pt-2 pb-2">
					<div>
						<h3 class="fw-bold text-center">Map Maker</h3>
						<p class="fst-italic text-center mb-0 mt-2">
							<small>Effective maps in the time it takes to click a button</small>
						</p>
					</div>
					<p class="mt-4 mb-4 flex-grow-1">
						The Map Maker provides simple, intuitive controls to help you efficiently create custom
						maps. Control the camera's movement, boundary style, map style and elevation. Try the
						Map-Maker for free to see all it has to offer!
					</p>
					<div class="row">
						<div class="col-6 d-grid">
							<a class="btn btn-block btn-outline-primary" href="/demo/map" type="button"
								>Live Demo</a
							>
						</div>
						<div class="col-6 d-grid">
							<a class="btn btn-outline-primary" href="#map-card" type="button">Pricing</a>
						</div>
					</div>
				</div>
				<div class="col-lg-7 text-center pt-2 pb-2">
					<div class="ratio ratio-16x9">
						<div id="carouselExampleIndicators" class="carousel slide" data-bs-ride="carousel">
							<div class="carousel-indicators">
								<button
									data-bs-target="#carouselExampleIndicators"
									data-bs-slide-to="0"
									class="active"
								/>
								<button data-bs-target="#carouselExampleIndicators" data-bs-slide-to="1" />
								<button data-bs-target="#carouselExampleIndicators" data-bs-slide-to="2" />
							</div>
							<div class="carousel-inner">
								<div class="carousel-item active">
									<img
										class="d-block w-100"
										src="/map-maker-satellite-16x9.jpeg"
										alt="Satellite Maps"
									/>
									<div class="carousel-caption">
										<h5 class="text-background">Satellite Maps</h5>
									</div>
								</div>
								<div class="carousel-item">
									<img class="d-block w-100" src="/map-maker-street-16x9.jpeg" alt="Street Maps" />
									<div class="carousel-caption">
										<h5 class="text-background">Street Maps</h5>
									</div>
								</div>
								<div class="carousel-item">
									<img
										class="d-block w-100"
										src="/map-maker-zoomed-out-16x9.jpeg"
										alt="Satellite + Street Maps"
									/>
									<div class="carousel-caption">
										<h5 class="text-background">Satellite + Street Maps</h5>
									</div>
								</div>
							</div>
							<style>
								.text-background {
									/* background-color: rgba(0, 0, 0, 0.4);
									padding: 2%; */
									text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
								}
							</style>
							<button
								class="carousel-control-prev"
								data-bs-target="#carouselExampleIndicators"
								type="button"
								data-bs-slide="prev"
							>
								<span class="carousel-control-prev-icon" aria-hidden="true" />
								<span class="visually-hidden">Previous</span>
							</button>
							<button
								class="carousel-control-next"
								data-bs-target="#carouselExampleIndicators"
								type="button"
								data-bs-slide="next"
							>
								<span class="carousel-control-next-icon" aria-hidden="true" />
								<span class="visually-hidden">Next</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
	<section id="site-building-service" style="background: rgb(246,246,246); overflow:hidden;">
		<div class="container pt-5 pb-5">
			<!-- <h2 class="fst-italic fw-bold text-center mb-5  mt-2">
				Want a blazing fast website that has all these features?
			</h2> -->
			<div class="row justify-content-between">
				<div class="d-flex flex-column justify-content-between col-lg-4 pt-2 pb-2">
					<div>
						<h3 class="fw-bold text-center">Custom Website</h3>
						<p class="fst-italic text-center mb-0 mt-2">
							<small>Get a website that brings in sellers and buyers</small>
						</p>
					</div>
					<p class="mt-4 mb-4 flex-grow-1">
						Land Listing Pro can build a website for you that is blazing fast and easy to use.
						Websites will include integration with our 3D models so that any listing can be viewed
						in 3D. Contact us today to get started!
					</p>
					<div class="row">
						<div class="col-6 d-grid">
							<a class="btn btn-block btn-outline-primary" href={agentDemoUrl} type="button"
								>Live Demo</a
							>
						</div>
						<div class="col-6 d-grid">
							<a class="btn btn-outline-primary" href="/contact" type="button">Contact Us</a>
						</div>
					</div>
				</div>
				<div id="preview-container" class="col-lg-7 text-center pt-2 pb-2">
					<div class="embed-responsive embed-responsive-16by9">
						<img
							src="/agent-demo-listing-page.jpeg"
							alt=""
							class="embed-responsive-item img-fluid"
						/>
					</div>
				</div>
			</div>
		</div>
	</section>
	<section
		id="pricing"
		class="p-5"
		style=" background-image: url('/mountains-bg.jpg'); height: 100%; background-repeat: no-repeat;
        background-size: cover; "
	>
		<!-- Import pricing section here -->
		<PricingSection />
		<div class="d-grid gap-2 col-lg-4 col-md-6 mx-auto mt-5">
			<a class="btn fs-3 growBtn p-3" href="/select" type="button">Select Property</a>
		</div>
	</section>
</main>

<style>
	.growBtn {
		transition: all 0.2s ease-in-out;
		background-color: rgb(59, 119, 84);
		color: white;
		border-radius: 1.5rem;
	}

	.growBtn:hover {
		color: white;
		background-color: rgb(59, 119, 84);
		transform: scale(1.1);
	}

	#preview-container {
		position: relative;
	}

	#preview-img {
		position: absolute;
		top: 0;
		/* right: -100px; */
		transition: right 0.3s ease-out;
	}

	/* #site-building-service:hover #preview-img {
		right: 0px;
	} */
</style>
