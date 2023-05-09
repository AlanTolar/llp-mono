import toGeoJSON from '@mapbox/togeojson';
// import shp from 'shpjs';

// export function shpToGeojson(file: File) {
// 	const fileReader = new FileReader();
// 	fileReader.onload = async (e) => {
// 		const dataURL = e.target?.result as string;
// 		const geojson = await shp(dataURL);
// 		return geojson;
// 	};
// 	fileReader.readAsDataURL(file);
// }

export function kmlToGeojson(file: File): Promise<GeoJSON.FeatureCollection> {
	return new Promise((resolve, reject) => {
		const fileReader = new FileReader();
		fileReader.onload = async (e) => {
			const plainText = e.target?.result as string;
			const parser = new DOMParser();
			const xmlDoc = parser.parseFromString(plainText, 'text/xml');
			const geojson = toGeoJSON.kml(xmlDoc);
			resolve(geojson);
		};
		fileReader.readAsText(file);
	});
}

export function jsonToGeojson(file: File): Promise<GeoJSON.FeatureCollection> {
	return new Promise((resolve, reject) => {
		const fileReader = new FileReader();
		fileReader.onload = async (e) => {
			const plainText = e.target?.result as string;
			const geojson = JSON.parse(plainText);
			resolve(geojson);
		};
		fileReader.readAsText(file);
	});
}

// function to remove z dimension from coordinates
function removeZ(coords: number[][][]) {
	return coords.map((coord) => {
		return coord.map((c) => {
			return c.slice(0, 2);
		});
	});
}

export function geojsonToCoords(geojson: GeoJSON.FeatureCollection) {
	let allCoords: number[][][][] = [];
	geojson.features.forEach((feature) => {
		if (feature.geometry.type === 'Polygon') {
			const polyCoords = feature.geometry.coordinates;
			allCoords.push(polyCoords);
		}
		if (feature.geometry.type === 'MultiPolygon') {
			const multiPolyCoords = feature.geometry.coordinates;
			allCoords = allCoords.concat(multiPolyCoords);
		}
	});
	return allCoords;
}
