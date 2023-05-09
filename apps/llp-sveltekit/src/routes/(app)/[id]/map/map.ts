import mapboxgl from 'mapbox-gl';
import { PUBLIC_MAPBOX_KEY } from '$env/static/public';

const mapbox_key = PUBLIC_MAPBOX_KEY;
mapboxgl.accessToken = mapbox_key;

export class createMap {
	public bbox_array;
	public center_array;
	public style;
	public map!: mapboxgl.Map;
	public geom;
	public property_name;

	constructor(bbox, center, geom, style, property_name) {
		this.style = `mapbox://styles/mapbox/${style}`;
		this.bbox_array = [
			[bbox.min.lng, bbox.min.lat],
			[bbox.max.lng, bbox.max.lat]
		];
		this.center_array = center;
		this.geom = geom;
		this.property_name = property_name;
		this.setMap();
	}

	setMap() {
		if (this.map) this.map.remove();
		this.map = new mapboxgl.Map({
			container: 'map',
			zoom: 14,
			center: this.center_array,
			style: this.style,
			interactive: false,
			preserveDrawingBuffer: true
		});
		this.map.on('load', () => {
			this.addElev();
			this.addGeom();
			this.addSky();
			this.map.setPitch(60);
			this.recenter();

			// edit mapbox attribute
			let btm_right_attr = document.querySelector('.mapboxgl-ctrl-bottom-right').firstChild;
			// decompact attribute and remove compact button
			if (btm_right_attr.classList.contains('mapboxgl-compact')) {
				btm_right_attr.classList.remove('mapboxgl-compact');
				btm_right_attr.getElementsByTagName('button')[0].remove();
			}

			// Remove feedback text
			// btm_right_attr.firstChild.getElementsByClassName('mapbox-improve-map')[0].remove();
			// make canvas max height and width to fix html2canvas sizing issues
			let canvas_elem = document.querySelector('.mapboxgl-canvas');
			canvas_elem.classList.add('h-100');
			canvas_elem.classList.add('w-100');

			let fill_color_elem = document.getElementById('fill_color_picker');
			fill_color_elem.addEventListener('input', (event) => {
				this.map.setPaintProperty(`boundary_fill`, 'fill-color', fill_color_elem.value);
			});
			let opacity_elem = document.getElementById('opacity');
			opacity_elem.addEventListener('input', (event) => {
				this.map.setPaintProperty(`boundary_fill`, 'fill-opacity', parseFloat(opacity_elem.value));
			});
			let line_color_elem = document.getElementById('line_color_picker');
			line_color_elem.addEventListener('input', (event) => {
				this.map.setPaintProperty(`boundary_outline`, 'line-color', line_color_elem.value);
			});
			let line_width_elem = document.getElementById('line_width');
			line_width_elem.addEventListener('input', (event) => {
				this.map.setPaintProperty(
					`boundary_outline`,
					'line-width',
					parseInt(line_width_elem.value)
				);
			});
		});
	}

	recenter() {
		this.map.setCenter(this.center_array);
		this.map.fitBounds(this.bbox_array, {
			padding: { top: 100, bottom: 100, left: 100, right: 100 },
			linear: false
		});
	}

	ImgGrab() {
		const dataUrl = this.map.getCanvas().toDataURL('image/jpeg', 0.5);
		const img = document.createElement('a');
		img.href = dataUrl;
		img.download = `${this.property_name}.jpeg`;
		img.type = 'Map Maker Download';
		document.body.appendChild(img);
		img.click();
		document.body.removeChild(img);

		// // addWarning('Check downloads for screenshot');
		// if (document.contains(document.getElementById('img-message')))
		// 	document.getElementById('img-message').remove();

		// html2canvas(document.querySelector('#map'), {
		// 	width: document.querySelector('#map').clientWidth,
		// 	height: document.querySelector('#map').clientHeight
		// 	// windowWidth: document.querySelector("#map").clientWidth,
		// 	// windowHeight: document.querySelector("#map").clientHeight,
		// }).then((canvas) => {
		// 	console.log(
		// 		document.querySelector('#map').clientWidth,
		// 		document.querySelector('#map').clientHeight
		// 	);
		// 	console.log(
		// 		parseFloat(document.querySelector('#map').style.width.split('px')[0]),
		// 		parseFloat(document.querySelector('#map').style.height.split('px')[0])
		// 	);
		// 	var a = document.createElement('a');
		// 	a.href = canvas.toDataURL();
		// 	a.download = `${this.property_name}.png`;
		// 	a.type = 'Map Maker Download';
		// 	document.body.appendChild(a);
		// 	a.click();
		// 	document.body.removeChild(a);
		// });
	}

	easing(t) {
		return t * (2 - t);
	}

	pitch_start(degrees) {
		this.map.easeTo({
			pitch: this.map.getPitch() + degrees,
			easing: this.easing
		});
		const pitch_counter = setInterval(() => {
			this.map.easeTo({
				pitch: this.map.getPitch() + degrees * 3,
				easing: this.easing
			});
		}, 250);
		document.addEventListener('pointerup', () => {
			clearInterval(pitch_counter);
		});
	}

	bearing_start(degrees) {
		this.map.easeTo({
			bearing: this.map.getBearing() + degrees,
			easing: this.easing
		});
		const bearing_counter = setInterval(() => {
			this.map.easeTo({
				bearing: this.map.getBearing() + degrees * 5,
				easing: this.easing
			});
		}, 250);
		document.addEventListener('pointerup', () => {
			clearInterval(bearing_counter);
		});
	}

	zoom_start(level) {
		this.map.easeTo({
			zoom: this.map.getZoom() + level,
			easing: this.easing
		});
		const zoom_counter = setInterval(() => {
			this.map.easeTo({
				zoom: this.map.getZoom() + level * 5,
				easing: this.easing
			});
		}, 250);
		document.addEventListener('pointerup', () => {
			clearInterval(zoom_counter);
		});
	}

	elevToggle() {
		if (document.getElementById('elevSwitch').checked === true) {
			this.map.setTerrain({ source: 'mapbox-dem', exaggeration: 1 });
		} else {
			this.map.setTerrain();
		}
	}

	boundaryToggle() {
		if (document.getElementById('boundarySwitch').checked === true) {
			this.addGeom();
		} else {
			this.map.removeLayer(`boundary_fill`);
			this.map.removeLayer(`boundary_outline`);
		}
	}

	toggleStyle(style_input) {
		this.style = 'mapbox://styles/mapbox/' + style_input;
		this.setMap(this.style);
		document.getElementById('elevSwitch').checked = true;
	}

	addGeom() {
		// Add the GeoJSON data.
		if (!this.map.getSource(`boundary_data`)) {
			this.map.addSource(`boundary_data`, {
				type: 'geojson',
				data: {
					type: 'Feature',
					properties: {},
					geometry: {
						type: 'MultiPolygon',
						coordinates: this.geom
					}
				}
			});
		}
		if (this.map.getLayer(`boundary_fill`)) this.map.removeLayer(`boundary_fill`);
		// Add a new layer to visualize the polygon.
		this.map.addLayer({
			id: `boundary_fill`,
			type: 'fill',
			source: `boundary_data`, // reference the data source
			layout: {},
			paint: {
				'fill-color': document.getElementById('fill_color_picker').value,
				'fill-opacity': parseFloat(document.getElementById('opacity').value)
			}
		});
		if (this.map.getLayer(`boundary_outline`)) this.map.removeLayer(`boundary_outline`);
		// Add a black outline around the polygon.
		this.map.addLayer({
			id: `boundary_outline`,
			type: 'line',
			source: `boundary_data`,
			layout: {},
			paint: {
				'line-color': document.getElementById('line_color_picker').value,
				'line-width': parseInt(document.getElementById('line_width').value)
			}
		});
	}

	addElev() {
		// Add the terrain data.
		if (!this.map.getSource('mapbox-dem')) {
			this.map.addSource('mapbox-dem', {
				type: 'raster-dem',
				url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
				tileSize: 512
				// 'maxzoom': 14,
				// 'volatile': true,
			});
		}
		this.map.setTerrain({ source: 'mapbox-dem', exaggeration: 1 });
	}

	addSky() {
		// add a sky layer that will show when the map is highly pitched
		this.map.addLayer({
			id: 'sky',
			type: 'sky',
			paint: {
				'sky-type': 'atmosphere',
				'sky-atmosphere-sun': [0.0, 0.0],
				'sky-atmosphere-sun-intensity': 15
			}
		});
	}
}
