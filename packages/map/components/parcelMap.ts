import mapboxgl from 'mapbox-gl';
import type { FillLayer, LineLayer } from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import * as turf from '@turf/turf';
import { createNanoEvents } from 'nanoevents';
import type { Emitter } from 'nanoevents';

interface ParcelEvents {
	selected: (parcels: Parcels) => void;
}
interface ParcelFeatures {
	county_id?: number;
	cty_row_id?: number;
	OBJECTID?: number;
	parcel_id?: string;
	county_name?: string;
	muni_name?: string;
	state_abbr?: string;
	address?: string;
	addr_number?: string;
	addr_street_type?: string;
	census_zip?: string;
	owner?: string;
	mail_address1?: string;
	mail_addressnumber?: string;
	mail_streetname?: string;
	mail_streetnameposttype?: string;
	mail_placename?: string;
	mail_statename?: string;
	mail_zipcode?: string;
	owner_occupied?: boolean;
	ngh_code?: string;
	land_use_code?: string;
	land_use_class?: string;
	legal_desc1?: string;
	school_district?: string;
	acreage_calc?: number;
	census_block?: number;
	census_blkgrp?: number;
	census_tract?: number;
	latitude?: number;
	longitude?: number;
	elevation?: number;
	robust_id?: string;
	last_updated?: string;
	addr_street_name?: string;
	addr_street_prefix?: string;
	addr_street_suffix?: string;
	physcity?: string;
	physzip?: string;
	coordinates: number[][][][];
	unknown: unknown;
}

export class Parcels {
	public parcelIds: (string | number)[] = [];
	public polygonCoords: number[][][][] = [];
	public emitter: Emitter;
	public features: ParcelFeatures[] = [];

	constructor(private readonly map: Map, private readonly reportallKey: string) {
		this.map.map.on('load', () => {
			this.addDataSource();
			this.addClickLayer();
			this.addBoundaryLayer();
			this.map.map.on('click', (e) => {
				this.handleParcelClick(e);
			});
			this.map.map.on('mouseenter', 'parcels-fill', () => {
				this.map.map.getCanvas().style.cursor = 'pointer';
			});
			this.map.map.on('mouseleave', 'parcels-fill', () => {
				this.map.map.getCanvas().style.cursor = '';
			});
		});
		this.emitter = createNanoEvents<ParcelEvents>();
	}

	on<E extends keyof ParcelEvents>(event: E, callback: ParcelEvents[E]) {
		return this.emitter.on(event, callback);
	}

	addDataSource() {
		// add overlay api to map
		const vectorUrl =
			'https://reportallusa.com/api/rest_services/client=' +
			this.reportallKey +
			'/ParcelsVectorTile/MapBoxVectorTileServer/tile/{z}/{x}/{y}.mvt';
		this.map.map.addSource('parcels', {
			type: 'vector',
			tiles: [vectorUrl],
			minzoom: 14,
			maxzoom: 17,
			promoteId: { parcels: 'robust_id' }
		});
	}

	addClickLayer() {
		// An additional transparent polygon ("fill") layer, to support click-to-identify (show popup) polygons.
		const parcelsFill: FillLayer = {
			id: 'parcels-fill',
			source: 'parcels',
			'source-layer': 'parcels',
			type: 'fill',
			paint: {
				'fill-outline-color': 'transparent',
				'fill-color': 'transparent'
			}
		};
		this.map.map.addLayer(parcelsFill);
	}

	addBoundaryLayer() {
		// Line layer which renders the parcel boundaries. Supports variable line width and other styling options.
		const parcelsLine: LineLayer = {
			id: 'parcels-line',
			source: 'parcels',
			'source-layer': 'parcels',
			type: 'line',
			paint: {
				'line-width': 3,
				'line-color': '#ffa748'
			}
		};
		this.map.map.addLayer(parcelsLine);
	}

	hideLayers() {
		this.map.map.setLayoutProperty('parcels-fill', 'visibility', 'none');
		this.map.map.setLayoutProperty('parcels-line', 'visibility', 'none');
	}

	showLayers() {
		this.map.map.setLayoutProperty('parcels-fill', 'visibility', 'visible');
		this.map.map.setLayoutProperty('parcels-line', 'visibility', 'visible');
	}

	requestParcel(robustId: string | number) {
		const detailsUrl =
			'https://reportallusa.com/api/rest_services/client=' +
			this.reportallKey +
			'/Parcels/MapServer/0/query?where=robust_id=%27' +
			robustId +
			'%27&outSR=4326&f=geojson';
		fetch(detailsUrl)
			.then((response) => response.json())
			.then((data) => {
				const newPolygonCoords = data.features[0].geometry.coordinates;
				this.polygonCoords = this.polygonCoords.concat(newPolygonCoords);
				this.map.boundaryData(this.polygonCoords);
				this.map.boundaryLine();
				this.map.boundaryFill();
				this.map.setBbox(this.polygonCoords);

				const featureProps = data.features[0].properties;
				featureProps.address = this.createAddress(featureProps);
				featureProps.coordinates = this.polygonCoords;
				this.features = [...this.features, featureProps];
				this.emitter.emit('selected', this);
			});
	}

	handleParcelClick(e: mapboxgl.MapMouseEvent & mapboxgl.EventData) {
		const features = this.map.map.queryRenderedFeatures(e.point, {
			layers: ['parcels-fill']
		});
		if (!features || features.length === 0) return console.log('no parcel');
		const feature = features[0];
		const robustId = feature.id;

		if (!robustId) return console.log('no robust id');
		if (this.parcelIds.includes(robustId)) return console.log('already selected');

		const keyHeldDown = e.originalEvent.altKey || e.originalEvent.ctrlKey;
		if (keyHeldDown) {
			this.parcelIds = [...this.parcelIds, robustId];
		} else {
			this.parcelIds = [robustId];
			this.polygonCoords = [];
		}

		this.requestParcel(robustId);
	}

	createAddress(features: ParcelFeatures) {
		let address_1 = '';
		let address_2 = '';
		// 'addr_number', 'addr_street_name', 'addr_street_type', 'physcity', 'state_abbr', 'physzip'
		if (features.addr_street_name && features.addr_street_name != 'Null') {
			if (features.addr_number) address_1 += features.addr_number + ' ';
			if (features.addr_street_prefix) address_1 += features.addr_street_prefix + ' ';
			address_1 += features.addr_street_name;
			if (features.addr_street_suffix) address_1 += ' ' + features.addr_street_suffix;
			if (features.addr_street_type) address_1 += ' ' + features.addr_street_type;
		}
		//
		if (features.physcity && features.state_abbr) {
			address_2 = ', ' + features.physcity + ' ,' + features.state_abbr;
		}
		if (features.physcity && features.state_abbr && features.physzip) {
			address_2 = ', ' + features.physcity + ', ' + features.state_abbr + ' ' + features.physzip;
		}
		//
		let address = address_1 + address_2;
		if (address === '0') address = '';
		return address;
	}
}

export class Map {
	public map: mapboxgl.Map;

	constructor(containerId: string, public readonly mapboxKey: string) {
		mapboxgl.accessToken = this.mapboxKey;
		this.map = new mapboxgl.Map({
			container: containerId,
			style: 'mapbox://styles/mapbox/satellite-v9',
			center: { lng: -95.69, lat: 37.6 },
			zoom: 4,
			doubleClickZoom: true
		});
		this.map.addControl(new mapboxgl.FullscreenControl(), 'top-left');
		this.map.addControl(new mapboxgl.NavigationControl(), 'top-left');

		// delay resize until fullscreen is complete
		document.addEventListener('fullscreenchange', () => {
			requestAnimationFrame(() => {
				console.log('resize now');
				this.map.resize();
			});
		});

		this.map.on('load', () => {
			this.map.resize();
		});
	}

	addMarker(lng: number, lat: number) {
		new mapboxgl.Marker().setLngLat([lng, lat]).addTo(this.map);
	}

	setCenter(lng: number, lat: number) {
		this.map.setCenter([lng, lat]);
	}

	fireClick(lng: number, lat: number) {
		this.map.once('idle', () => {
			console.log('lng: ', lng, 'lat: ', lat);
			const coord = new mapboxgl.LngLat(lng, lat);
			this.map.fire('click', {
				lngLat: coord,
				point: this.map.project(coord),
				originalEvent: 'search'
			});
		});
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
		const mapSource = this.map.getSource('boundary_data') as mapboxgl.GeoJSONSource;
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

	boundaryFill(fill_color = '#0080ff', fill_opacity = 0.15) {
		const fillLayer = this.map.getLayer('boundary_fill');
		if (!fillLayer) {
			this.map.addLayer({
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

export class Geocoder {
	public geocoder: MapboxGeocoder;

	constructor(
		private map: Map,
		public readonly mapboxKey: string,
		element: HTMLElement | undefined
	) {
		if (element) {
			this.geocoder = new MapboxGeocoder({
				accessToken: this.mapboxKey,
				countries: 'us',
				flyTo: { zoom: 14, duration: 2000 },
				placeholder: 'Ex: 123 Main Street',
				reverseGeocode: true
			});
			element.appendChild(this.geocoder.onAdd(this.map.map));
		} else {
			this.geocoder = new MapboxGeocoder({
				accessToken: this.mapboxKey
			});
			map.map.addControl(this.geocoder, 'top-right');
		}

		this.geocoder.on('result', (e) => {
			const lng = e.result.center[0];
			const lat = e.result.center[1];
			this.map.fireClick(lng, lat);
		});
	}
}
