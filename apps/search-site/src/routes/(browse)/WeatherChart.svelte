<script lang="ts">
	import { onMount } from 'svelte';

	export let series: { name: string; data: (number | null)[] }[];
	export let title: string;
	export let unit: string;

	const allSeries = series
		?.map((s) => s.data)
		.flat()
		.filter((elements) => {
			return elements !== null;
		});
	const max = Math.max(...allSeries);
	const min = Math.min(...allSeries);
	const range = max - min;
	const floor = Math.floor(min - range * 0.1);
	const ceil = Math.ceil(max + range * 0.1);

	let chartElement: HTMLDivElement;
	onMount(async () => {
		const { default: ApexCharts } = await import('apexcharts');
		const options: ApexCharts.ApexOptions = {
			series,
			chart: {
				height: 350,
				type: 'line',
				dropShadow: {
					enabled: true,
					color: '#000',
					top: 18,
					left: 7,
					blur: 10,
					opacity: 0.2
				},
				toolbar: {
					show: false
				},
				zoom: {
					enabled: false
				}
			},
			colors: ['#242424', '#77B6EA', '#f7685e'],
			dataLabels: {
				enabled: true
			},
			stroke: {
				curve: 'smooth'
			},
			title: {
				text: `${title} (${unit})`,
				align: 'left'
			},
			grid: {
				borderColor: '#e7e7e7',
				row: {
					colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
					opacity: 0.5
				},
				padding: {
					top: 0,
					right: 25,
					bottom: 0,
					left: 25
				}
			},
			markers: {
				size: 1
			},
			xaxis: {
				categories: [
					'Jan',
					'Feb',
					'Mar',
					'Apr',
					'May',
					'Jun',
					'Jul',
					'Aug',
					'Sep',
					'Oct',
					'Nov',
					'Dec'
				],
				title: {
					text: 'Month'
				}
			},
			yaxis: {
				title: {
					text: `${title} (${unit})`
				},
				min: floor,
				max: ceil,
				forceNiceScale: true,
				decimalsInFloat: 0
			},
			legend: {
				position: 'top',
				horizontalAlign: 'right',
				floating: true,
				offsetY: -25,
				offsetX: -5
			},
			tooltip: {
				enabled: true,
				y: {
					formatter: (value, opts) => {
						return `${value} ${unit}`;
					}
				}
			}
		};
		const chart = new ApexCharts(chartElement, options);
		chart.render();
	});
</script>

<div id="chart" bind:this={chartElement} />
