<script></script>

<div class="pricing container">
	<h2 class="fst-italic fw-bold text-center mt-2">
		Sell your land faster for more money with our marketing tools.
	</h2>
	<div class="row justify-content-center">
		<!-- Map Maker -->
		<div class="col-md-6 col-lg-4 col-xxl-3 mt-5">
			<div id="map-card" class="card hover-effect">
				<div class="card-body">
					<h1 class="card-title text-muted text-uppercase text-center pb-2">Map Maker</h1>
					<h2 class="card-price text-center fs-2 pb-1">Free</h2>
					<hr />
					<div class="d-flex flex-column">
						<ul class="list-unstyled text-start align-self-center">
							<li><i class="bi bi-check" />Customizable boundary style</li>
							<li><i class="bi bi-check" />Simple camera controls</li>
							<li><i class="bi bi-check" />Downloadable PNG images</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
		<!-- Video Maker -->
		<div class="col-md-6 col-lg-4 col-xxl-3 mt-5">
			<div id="video-card" class="card hover-effect">
				<div class="card-body">
					<h1 class="card-title text-muted text-uppercase text-center pb-2">Video Maker</h1>
					<h2 class="card-price text-center fs-2 pb-1">Free</h2>
					<hr />
					<div class="d-flex flex-column">
						<ul class="list-unstyled text-start align-self-center">
							<li><i class="bi bi-check" />Customizable scenes</li>
							<li><i class="bi bi-check" />Preview video in real time</li>
							<li><i class="bi bi-check" />Export MP4 videos</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
		<!-- Model Maker -->
		<div class="col-md-6 col-lg-4 col-xxl-3 mt-5">
			<div id="model-card" class="card hover-effect">
				<div class="card-body">
					<h1 class="card-title text-muted text-uppercase text-center pb-2">Model Maker</h1>
					<h2 class="card-price text-center fs-2 pb-1">
						$135<span class="period">/property</span>
					</h2>
					<hr />
					<div class="d-flex flex-column">
						<ul class="list-unstyled text-start align-self-center">
							<li class="fw-bold" style="color: rgb(59, 119, 84);">
								<i class="bi bi-check" />First three properties are free
							</li>
							<li><i class="bi bi-check" />Embed photos and panoramas</li>
							<li><i class="bi bi-check" />Shareable URL</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
		<!-- Custom Website -->
		<div class="col-md-6 col-lg-4 col-xxl-3 mt-5">
			<div id="model-card" class="card hover-effect">
				<div class="card-body">
					<h1 class="card-title text-muted text-uppercase text-center pb-2">Custom Website</h1>
					<h2 class="card-price text-center fs-2 pb-1">Negotiated</h2>
					<hr />
					<div class="d-flex flex-column">
						<ul class="list-unstyled text-start align-self-center">
							<li><i class="bi bi-check" />Custom domain name</li>
							<li><i class="bi bi-check" />Customizable design</li>
							<li><i class="bi bi-check" />Unlimited pages</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.pricing .card {
		border: none;
		border-radius: 1rem;
		transition: all 0.2s;
		box-shadow: 0 0.5rem 1rem 0 rgba(0, 0, 0, 0.1);
	}

	.pricing hr {
		margin: 1.5rem 0;
	}

	.pricing .card-title {
		margin: 0.5rem 0;
		font-size: 0.9rem;
		letter-spacing: 0.1rem;
		font-weight: bold;
	}

	.pricing .card-price {
		font-size: 3rem;
		margin: 0;
	}

	.pricing .card-price .period {
		font-size: 0.8rem;
	}

	.pricing ul li {
		margin-bottom: 1rem;
	}

	.pricing .text-muted {
		opacity: 0.7;
	}

	.not-selectable {
		background-color: rgb(226, 226, 226);
	}

	.selected {
		background-color: rgb(220, 255, 204);
	}

	/* Hover Effects on Card */

	@media (min-width: 992px) {
		.hover-effect:hover {
			margin-top: -0.25rem;
			margin-bottom: 0.25rem;
			box-shadow: 0 0.5rem 1rem 0 rgba(0, 0, 0, 0.3);
		}
	}
</style>
