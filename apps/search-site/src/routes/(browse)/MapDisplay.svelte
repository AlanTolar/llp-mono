<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	export let heightMapImage: string;
	export let containerHeight: number;
	console.log('containerHeight: ', containerHeight);
	export let depth = 10;
	export let xDistance = 1000;
	export let yDistance = 1000;
	let margin = { top: 20, right: 20, bottom: 40, left: 50 };
	const numberOfSteps = 5000;

	function setAxis() {
		// Clear previous elements
		d3.select('#x-axis').selectAll('*').remove();
		d3.select('#y-axis').selectAll('*').remove();
		d3.select('#color-scale').selectAll('*').remove();

		// x and y axis
		const xAxis = d3
			.axisBottom(d3.scaleLinear().domain([0, xDistance]).range([0, imgWidth]))
			.ticks(5)
			.tickFormat((d) => `${d} m`);
		const yAxis = d3
			.axisLeft(d3.scaleLinear().domain([0, yDistance]).range([imgHeight, 0]))
			.ticks(5)
			.tickFormat((d) => `${d} m`);
		d3.select<SVGGElement, unknown>('#x-axis').call((g) => xAxis(g));
		d3.select<SVGGElement, unknown>('#y-axis').call((g) => yAxis(g));

		// depth color scale
		const colorScale = d3.scaleSequential(d3.interpolateGreys).domain([0, depth]);
		const legend = d3
			.select('#color-scale')
			.selectAll('rect')
			.data(Array.from({ length: numberOfSteps }, (v, i) => i * (depth / numberOfSteps)))
			.enter()
			.append('rect')
			.attr('x', 0)
			.attr('y', (d, i) => i * (imgHeight / numberOfSteps))
			.attr('width', 20)
			.attr('height', imgHeight / numberOfSteps)
			.attr('fill', (d, i) => colorScale(d));

		// max depth label
		d3.select('#color-scale')
			.append('text')
			.attr('x', 25)
			.attr('y', 12)
			.text(`${depth.toFixed(1)} m`);
		// min depth label
		d3.select('#color-scale')
			.append('text')
			.attr('x', 25)
			.attr('y', imgHeight)
			.attr('dy', '-0.3em')
			.text('0 m');
	}

	let imgHeight = 0;
	let imgWidth = 0;
	let imgElement: HTMLImageElement;
	onMount(() => {
		imgSizeObserver.observe(imgElement);
	});

	const imgSizeObserver = new ResizeObserver((entries) => {
		// console.log('1: imgWidth: ', imgWidth, 'imgHeight: ', imgHeight);
		const imgElement = entries[0];
		imgWidth = imgElement.contentRect.width;
		imgHeight = imgElement.contentRect.height;
		// console.log('2: imgWidth: ', imgWidth, 'imgHeight: ', imgHeight);
		setAxis();
	});
</script>

<div class="container">
	<div class="height-map" style="max-width: 80%">
		<img
			bind:this={imgElement}
			src={heightMapImage}
			style="max-height:{containerHeight * 0.8}px;max-width: 100%"
			alt="Height Map"
		/>
		<svg
			class="axes"
			width={imgWidth + margin.left + margin.right}
			height={imgHeight + margin.top + margin.bottom}
		>
			<g id="x-axis" transform="translate({margin.left}, {imgHeight + margin.top})" />
			<g id="y-axis" transform="translate({margin.left}, {margin.top})" />
		</svg>
		<div class="color-scale">
			<svg id="color-scale" width="100" height={imgHeight} />
		</div>
	</div>
</div>

<style>
	.container {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.height-map {
		position: relative;
		padding: 0px;
	}

	.axes {
		position: absolute;
		top: -20px;
		left: -50px;
	}

	.color-scale {
		position: absolute;
		top: 0px;
		right: -110px;
	}

	#color-scale text {
		font-size: 12px;
		fill: #000;
	}
</style>
