import mapboxgl from 'mapbox-gl';
import { sceneStore } from './sceneStore';
import { PUBLIC_MAPBOX_KEY } from '$env/static/public';

export function videoMap(bounds, center, style) {
	mapboxgl.accessToken = PUBLIC_MAPBOX_KEY;

	const map = new mapboxgl.Map({
		container: 'map',
		center: center,
		zoom: 14,
		style: 'mapbox://styles/mapbox/satellite-v9',
		interactive: false,
		preserveDrawingBuffer: true
	});

	map.on('load', () => {
		add_boundary(map, bounds, style['line_color'], style['line_width']);
		fill_bounds(map, style['fill_color'], style['fill_opacity']);
		map.addSource('mapbox-dem', {
			type: 'raster-dem',
			url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
			tileSize: 512
		});
		map.setTerrain({ source: 'mapbox-dem', exaggeration: 1 });
		map.addLayer({
			id: 'sky',
			type: 'sky',
			paint: {
				'sky-type': 'atmosphere',
				'sky-atmosphere-sun': [0.0, 90.0],
				'sky-atmosphere-sun-intensity': 15
			}
		});
	});
	return map;
}

export function sceneMap(scene, bounds, center) {
	mapboxgl.accessToken = PUBLIC_MAPBOX_KEY;

	const map = new mapboxgl.Map({
		container: `map_${scene.id}`,
		center: center,
		zoom: 10,
		style: 'mapbox://styles/mapbox/satellite-v9',
		doubleClickZoom: true
	});
	map.addControl(new mapboxgl.FullscreenControl());
	map.addControl(new mapboxgl.NavigationControl());
	map.on('load', () => add_boundary(map, bounds));

	let [marker_start, marker_end, marker_target] = [null, null, null];

	if (scene.type === 'line' || scene.type === 'flyover') {
		add_line(map, scene.start, scene.end);
		marker_start = add_marker(map, scene, 'green', 'start');
		marker_end = add_marker(map, scene, 'red', 'end');
		line_update(map, marker_start, marker_end);
		if (scene.target) marker_target = add_marker(map, scene, 'blue', 'target');
	}

	if (scene.type === 'orbit') {
		marker_start = add_marker(map, scene, 'green', 'start');
		marker_target = add_marker(map, scene, 'blue', 'target');
	}

	const markers = [marker_start, marker_end, marker_target];
	map.on('load', () => set_bounds(map, bounds, markers));
	map.on('resize', () => set_bounds(map, bounds, markers));

	return { map, markers };
}

function add_marker(map, scene, color, coord_type) {
	const coords = scene[coord_type];
	const marker = new mapboxgl.Marker({
		draggable: true,
		color: color
	})
		.setLngLat(coords)
		.addTo(map);

	marker.on('drag', function (e) {
		// get longitude and latitude data from marker
		const lngLat = this.getLngLat();
		// set new coordinates in store
		let updated_data;
		if (coord_type === 'start') updated_data = { start: [lngLat.lng, lngLat.lat] };
		if (coord_type === 'end') updated_data = { end: [lngLat.lng, lngLat.lat] };
		if (coord_type === 'target') updated_data = { target: [lngLat.lng, lngLat.lat] };
		sceneStore.updateScene(scene.id, updated_data);
	});
	return marker;
}

// set line data to update map line
function line_update(map, marker_start, marker_end) {
	[marker_start, marker_end].forEach((marker) => {
		marker.on('drag', function (e) {
			map.getSource('line_data').setData({
				type: 'Feature',
				properties: {},
				geometry: {
					type: 'LineString',
					coordinates: [
						[marker_start.getLngLat().lng, marker_start.getLngLat().lat],
						[marker_end.getLngLat().lng, marker_end.getLngLat().lat]
					]
				}
			});
		});
	});
}

function add_line(map, start_coords, end_coords) {
	map.on('load', () => {
		map.addSource('line_data', {
			type: 'geojson',
			data: {
				type: 'Feature',
				properties: {},
				geometry: {
					type: 'LineString',
					coordinates: [start_coords, end_coords]
				}
			}
		});
		map.addLayer({
			id: 'line_outline',
			type: 'line',
			source: 'line_data',
			layout: {},
			paint: {
				'line-color': '#000',
				'line-width': 3
			}
		});
	});
}

export function add_boundary(map, bounds, line_color = '#000', line_width = 3) {
	const mapSource = map.getSource('boundary_data');
	if (typeof mapSource === 'undefined') {
		map.addSource(`boundary_data`, {
			type: 'geojson',
			data: {
				type: 'Feature',
				properties: {},
				geometry: {
					type: 'MultiPolygon',
					coordinates: bounds
				}
			}
		});
		map.addLayer({
			id: `boundary_outline`,
			type: 'line',
			source: `boundary_data`,
			layout: {},
			paint: {
				'line-color': line_color,
				'line-width': line_width
			}
		});
	} else {
		mapSource.setData({
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'MultiPolygon',
				coordinates: bounds
			}
		});
	}
}

export function toggle_fill(map) {
	const fillLayer = map.getLayer('boundary_fill');
	if (typeof fillLayer === 'undefined') {
		fill_bounds(map);
	} else {
		map.removeLayer('boundary_fill');
	}
}

export function fill_bounds(map, fill_color = '#0080ff', fill_opacity = 0.15) {
	const fillLayer = map.getLayer('boundary_fill');
	if (typeof fillLayer === 'undefined') {
		map.addLayer({
			id: `boundary_fill`,
			type: 'fill',
			source: `boundary_data`,
			layout: {},
			paint: {
				'fill-color': fill_color,
				'fill-opacity': fill_opacity
			}
		});
	}
}

export function set_bounds(map, bounds, markers = [], padding = 40) {
	const all_coords = bounds.flat(2);

	markers.forEach((marker) => {
		if (marker) {
			all_coords.push([marker.getLngLat().lng, marker.getLngLat().lat]);
		}
	});

	const lons = all_coords.map((x) => x[0]);
	const lats = all_coords.map((x) => x[1]);
	const new_bbox = [
		[Math.min(...lons), Math.max(...lats)],
		[Math.max(...lons), Math.min(...lats)]
	];

	map.fitBounds(new_bbox, {
		padding: padding,
		linear: true
	});
}

export function updateCameraPosition(position, altitude, target, map) {
	const camera = map.getFreeCameraOptions();
	camera.position = mapboxgl.MercatorCoordinate.fromLngLat(position, altitude);
	camera.lookAtPoint(target);
	map.setFreeCameraOptions(camera);
}
