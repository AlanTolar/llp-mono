<script lang="ts">
	import type { Layer } from './soilApiTypes';

	export let data: Layer;

	const soilProperties = [
		{
			abbr: 'phh2o',
			name: 'Soil pH',
			label: 'Soil pH',
			description:
				'Soil pH affects nutrient availability and overall soil health. Extremely acidic or alkaline soils may limit plant growth and reduce agricultural productivity. Knowing the pH helps determine if any soil amendments are necessary.',
			unit: 'pH',
			evaluation: [
				{
					label: 'Highly acidic (Poor)',
					range: [0, 4.5],
					score: 0
				},
				{
					label: 'Moderately acidic (Fair)',
					range: [4.5, 5.5],
					score: 50
				},
				{
					label: 'Neutral (Good)',
					range: [5.5, 7.5],
					score: 100
				},
				{
					label: 'Moderately alkaline (Fair)',
					range: [7.5, 8.5],
					score: 50
				},
				{
					label: 'Highly alkaline (Poor)',
					range: [8.5, 14],
					score: 0
				}
			]
		},
		{
			abbr: 'soc',
			name: 'Soil organic carbon content',
			label: 'Carbon Content',
			description:
				'Organic carbon plays a crucial role in soil fertility and overall soil health. It influences water-holding capacity, soil structure, and nutrient availability. Higher organic carbon content is generally desirable for productive soils.',
			unit: 'g/kg',
			evaluation: [
				{
					label: 'Very low (Poor)',
					range: [0, 0.5],
					score: 0
				},
				{
					label: 'Low (Fair)',
					range: [0.5, 1.5],
					score: 25
				},
				{
					label: 'Moderate (Good)',
					range: [1.5, 3],
					score: 50
				},
				{
					label: 'High (Very Good)',
					range: [3, 6],
					score: 75
				},
				{
					label: 'Very high (Excellent)',
					range: [6, Infinity],
					score: 100
				}
			]
		},
		{
			abbr: 'ocd',
			name: 'Organic carbon density',
			label: 'Carbon Density',
			description:
				'Organic carbon plays a crucial role in soil fertility and overall soil health. It influences water-holding capacity, soil structure, and nutrient availability. Higher organic carbon content is generally desirable for productive soils.',
			unit: 'kg/dm³',
			evaluation: [
				{
					label: 'Very low (Poor)',
					range: [0, 50],
					score: 0
				},
				{
					label: 'Low (Fair)',
					range: [50, 150],
					score: 25
				},
				{
					label: 'Moderate (Good)',
					range: [150, 300],
					score: 50
				},
				{
					label: 'High (Very Good)',
					range: [300, 600],
					score: 75
				},
				{
					label: 'Very high (Excellent)',
					range: [600, Infinity],
					score: 100
				}
			]
		},
		{
			abbr: 'nitrogen',
			name: 'Total nitrogen',
			label: 'Total Nitrogen',
			description:
				'Nitrogen is an essential nutrient for plant growth, and its presence in soil directly affects crop productivity. Adequate nitrogen levels are necessary for healthy plant growth and high agricultural yields.',
			unit: 'g/kg',
			evaluation: [
				{
					label: 'Very low (Poor)',
					range: [0, 0.05],
					score: 0
				},
				{
					label: 'Low (Fair)',
					range: [0.05, 0.15],
					score: 25
				},
				{
					label: 'Moderate (Good)',
					range: [0.15, 0.25],
					score: 50
				},
				{
					label: 'High (Very Good)',
					range: [0.25, 0.5],
					score: 75
				},
				{
					label: 'Very high (Excellent)',
					range: [0.5, Infinity],
					score: 100
				}
			]
		},
		{
			abbr: 'cec',
			name: 'Cation Exchange Capacity',
			label: 'Cation Exchange Capacity',
			description:
				"CEC is a measure of the soil's ability to retain and exchange essential plant nutrients such as calcium, magnesium, and potassium. Soils with high CEC values can hold more nutrients, making them more fertile and better for crop production.",
			unit: 'cmol(c)/kg',
			evaluation: [
				{
					label: 'Very low (Poor)',
					range: [0, 5],
					score: 0
				},
				{
					label: 'Low (Fair)',
					range: [5, 10],
					score: 25
				},
				{
					label: 'Moderate (Good)',
					range: [10, 20],
					score: 50
				},
				{
					label: 'High (Very Good)',
					range: [20, 40],
					score: 75
				},
				{
					label: 'Very high (Excellent)',
					range: [40, Infinity],
					score: 100
				}
			]
		},
		{
			abbr: 'clay_sand_silt',
			name: 'Proportions of clay, sand, and silt',
			label: 'Proportions of Clay, Sand, and Silt',
			description:
				"These properties determine the soil's texture and have a significant impact on water-holding capacity, drainage, aeration, and nutrient availability. The ideal soil composition varies depending on the crops being grown and the desired drainage characteristics.",
			unit: '%',
			evaluation: [
				{
					label: 'Poor',
					range: [50, 70],
					score: 0
				},
				{
					label: 'Fair',
					range: [35, 50],
					score: 25
				},
				{
					label: 'Good',
					range: [20, 35],
					score: 50
				},
				{
					label: 'Very Good',
					range: [10, 20],
					score: 75
				},
				{
					label: 'Excellent',
					range: [0, 10],
					score: 100
				}
			]
		},
		{
			abbr: 'bdod',
			name: 'Bulk density of the fine earth fraction',
			label: 'Bulk Density',
			description:
				'Bulk density is an indicator of soil compaction and porosity. Soils with lower bulk density values have better aeration and water-holding capacity. Extremely high or low values may indicate issues with soil structure that could affect plant growth.',
			unit: 'kg/dm³',
			evaluation: [
				{
					label: 'Very low (Poor)',
					range: [0, 1.0],
					score: 0
				},
				{
					label: 'Low (Fair)',
					range: [1.0, 1.3],
					score: 25
				},
				{
					label: 'Moderate (Good)',
					range: [1.3, 1.6],
					score: 50
				},
				{
					label: 'High (Very Good)',
					range: [1.6, 1.8],
					score: 75
				},
				{
					label: 'Very high (Excellent)',
					range: [1.8, Infinity],
					score: 100
				}
			]
		},
		{
			abbr: 'cfvo',
			name: 'Volumetric fraction of coarse fragments',
			label: 'Coarse Fragments',
			description:
				'The presence of coarse fragments in the soil may affect its workability and root penetration. Depending on the land use and crop type, high coarse fragment content may be undesirable.',
			unit: 'cm³/100cm³',
			evaluation: [
				{
					label: 'Very high (Poor)',
					range: [50, Infinity],
					score: 0
				},
				{
					label: 'High (Fair)',
					range: [35, 50],
					score: 25
				},
				{
					label: 'Moderate (Good)',
					range: [20, 35],
					score: 50
				},
				{
					label: 'Low (Very Good)',
					range: [10, 20],
					score: 75
				},
				{
					label: 'Very low (Excellent)',
					range: [0, 10],
					score: 100
				}
			]
		},
		{
			abbr: 'ocs',
			name: 'Organic carbon stocks',
			label: 'Carbon Stocks',
			description:
				"Organic carbon stocks provide information on the total amount of organic carbon stored in the soil. This information might be useful in assessing the potential for carbon sequestration or evaluating the land's environmental value. However, it might be less crucial for evaluating soil fertility for crop production.",
			unit: 'kg/m²',
			evaluation: [
				{
					label: 'Very low (Poor)',
					range: [0, 5],
					score: 0
				},
				{
					label: 'Low (Fair)',
					range: [5, 10],
					score: 25
				},
				{
					label: 'Moderate (Good)',
					range: [10, 20],
					score: 50
				},
				{
					label: 'High (Very Good)',
					range: [20, 40],
					score: 75
				},
				{
					label: 'Very high (Excellent)',
					range: [40, Infinity],
					score: 100
				}
			]
		}
	];

	const soilProperty = soilProperties.find((property) => property.abbr === data.name);

	// Function to convert values to shades of brown using HSL
	function valueToColor(value: number, depthLabel?: string) {
		if (!soilProperty) {
			throw new Error(`Soil property ${data.name} not found`);
		}
		const evaluationLevel = soilProperty.evaluation.find((level) => {
			const [min, max] = level.range;
			if (value >= min && value <= max) {
				return true;
			}
		});
		if (!evaluationLevel) {
			throw new Error(`Evaluation level not found for ${data.name} and value ${value}`);
		}
		// console.log(
		// 	`${data.name} is ${value} ${
		// 		data.unit_measure.target_units
		// 	} at ${depthLabel}\nEvaluation:\n${JSON.stringify(evaluationLevel, 0, 2)}`
		// );

		let hue = 30; // Brown
		let saturation = 50;
		let lightness = (100 - evaluationLevel.score) * 0.6 + 20;
		return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
	}
</script>

{#if data.depths.filter((depth) => depth.values['Q0.5']).length > 0}
	<div class="container">
		<h1 class="text-center fs-5 mb-3">{soilProperty?.label}</h1>
		{#each data.depths as depth, i}
			{@const value = depth.values['Q0.5'] / data.unit_measure.d_factor}
			<div class="range" style="background-color: {valueToColor(value, depth.label)};">
				{#if i === 0}
					<div class="first-label">0 cm</div>
				{/if}
				<div class="label">{depth.range.bottom_depth} {depth.range.unit_depth}</div>
				<div class="text-center fw-bold">
					{value}
					{soilProperty?.unit}
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: end;
		width: 200px;
		margin: 15px;
	}
	.row {
		position: relative;
		display: flex;
		flex-direction: row;
	}

	.first-label {
		position: absolute;
		transform: translate(-115%, -110%);
	}
	.label {
		position: absolute;
		transform: translate(-115%, 110%);
	}

	.range {
		position: relative;
		width: 80%;
		padding: 1rem 0rem;
		border: 1px solid #ccc;
	}
</style>
