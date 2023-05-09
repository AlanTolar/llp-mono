import mapboxgl from 'mapbox-gl';
import type { FillLayer, LineLayer } from 'mapbox-gl';
import * as turf from '@turf/turf';
import { createNanoEvents } from 'nanoevents';
import type { Emitter } from 'nanoevents';
import { PUBLIC_MAPBOX_KEY } from '$env/static/public';
import type { ModelMarker } from '@prisma/client';

export class Map {
	public map: mapboxgl.Map;

	constructor(containerId: string, lat: number, lng: number) {
		mapboxgl.accessToken = PUBLIC_MAPBOX_KEY;
		this.map = new mapboxgl.Map({
			container: containerId,
			style: 'mapbox://styles/mapbox/satellite-v9',
			center: { lng, lat },
			zoom: 14,
			doubleClickZoom: true
		});
		this.map.addControl(new mapboxgl.FullscreenControl());
	}

	setCenter(lng: number, lat: number) {
		this.map.setCenter([lng, lat]);
	}

	setBbox(bounds: number[][][][], markers: mapboxgl.Marker[] = [], padding = 40) {
		const allCoords = bounds.flat(2);
		markers.forEach((marker) => {
			if (marker) {
				allCoords.push([marker.getLngLat().lng, marker.getLngLat().lat]);
			}
		});
		const bbox = turf.bbox(turf.lineString(allCoords)) as [number, number, number, number];

		this.map.fitBounds(bbox, {
			padding: padding,
			linear: true
		});
	}

	boundaryData(bounds: number[][][][]) {
		const mapSource = this.map.getSource('boundary_data');
		if (!mapSource) {
			this.map.addSource(`boundary_data`, {
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

	boundaryLine(line_color = '#000', line_width = 3) {
		const lineLayer = this.map.getLayer('boundary_outline');
		if (!lineLayer) {
			this.map.addLayer({
				id: `boundary_outline`,
				type: 'line',
				source: `boundary_data`,
				layout: {},
				paint: {
					'line-color': line_color,
					'line-width': line_width
				}
			});
		}
	}
}

export class Marker {
	public marker: mapboxgl.Marker;
	public S3Path: string | undefined;
	public pano = false;
	public element: HTMLElement;

	constructor(
		private readonly map: Map,
		public geom: number[][][][],
		public markerData: ModelMarker
	) {
		this.element = this.createMarkerElement();
		this.marker = new mapboxgl.Marker({
			element: this.element,
			draggable: true
		})
			.setLngLat([markerData.longitude, markerData.latitude])
			.addTo(this.map.map);

		this.markerInsidePolygonCheck();
		this.marker.on('drag', () => {
			const lngLat = this.marker.getLngLat();
			this.markerData.longitude = lngLat.lng;
			this.markerData.latitude = lngLat.lat;
			this.markerInsidePolygonCheck();
		});
	}

	remove() {
		this.marker.remove();
	}

	createMarkerElement() {
		const el = document.createElement('div');
		el.style.color = 'white';
		el.style.fontSize = '20px';
		el.style.fontWeight = 'bold';

		el.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
		el.style.borderRadius = '50%';
		el.style.borderColor = 'black';
		el.style.borderStyle = 'solid';
		el.style.borderWidth = '2px';

		el.style.display = 'flex';
		el.style.justifyContent = 'center';
		el.style.alignItems = 'center';
		el.style.width = '30px';
		el.style.height = '30px';
		el.style.cursor = 'pointer';

		el.innerHTML = this.markerData.order.toString();
		return el;
	}

	markerInsidePolygonCheck() {
		const polygons = this.geom.map((polygon) => turf.polygon(polygon, { name: 'poly1' }));
		const point = turf.point([this.markerData.longitude, this.markerData.latitude]);
		// check if marker in one of the polygons
		let in_poly = false;
		polygons.forEach((polygon) => {
			if (turf.booleanPointInPolygon(point, polygon)) in_poly = true;
		});
		this.element.style.borderColor = in_poly ? 'black' : 'red';
	}
}
