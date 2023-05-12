import { writable, derived, get } from 'svelte/store';
import type { SceneSchema, StyleSchema } from './updateScenes/+server';
import { PUBLIC_MAPBOX_KEY } from '$env/static/public';
import cuid from 'cuid';
import * as turf from '@turf/turf';
import { browser } from '$app/environment';

type bbox = {
	max: { lat: number; lng: number };
	min: { lat: number; lng: number };
};
type center = { lng: number; lat: number };
export type defaultScenes = {
	orbit: SceneSchema;
	line: SceneSchema;
	flyover: SceneSchema;
	orbit_2: SceneSchema;
};
export async function createDefaultScenes(bbox: bbox, center: center): Promise<defaultScenes> {
	const response = await fetch(
		`https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/${center.lng},${center.lat}.json?layers=contour&limit=50&access_token=${PUBLIC_MAPBOX_KEY}`,
		{ method: 'GET' }
	);
	const json = await response.json();

	const allFeatures = json.features;
	const elevations = allFeatures.map((feature: any) => feature.properties.ele);
	const highestElevation = Math.max(...elevations);

	const lon_dis = bbox.max.lng - bbox.min.lng;
	const lat_dis = bbox.max.lat - bbox.min.lat;
	const max_dis = Math.max(lon_dis, lat_dis);

	const bbox_hypotenuse = turf.distance(
		turf.point([bbox.min.lng, bbox.min.lat]),
		turf.point([bbox.max.lng, bbox.max.lat])
	);
	const height = highestElevation + bbox_hypotenuse * 1000;

	return {
		orbit: {
			type: 'orbit',
			start: [center.lng + max_dis, center.lat],
			deg: 60,
			alt: height,
			duration: 7000,
			target: [center.lng, center.lat],
			scroll_text: ''
		},
		line: {
			type: 'line',
			start: [center.lng, center.lat - lat_dis * 1.5],
			end: [center.lng, center.lat - lat_dis],
			alt: height,
			duration: 7000,
			target: [center.lng, center.lat],
			scroll_text: ''
		},
		flyover: {
			type: 'flyover',
			start: [center.lng - lon_dis / 3, center.lat - lat_dis / 3],
			end: [center.lng + lon_dis / 3, center.lat + lat_dis / 3],
			alt: height,
			duration: 7000,
			scroll_text: ''
		},
		orbit_2: {
			type: 'orbit',
			start: [center.lng - max_dis, center.lat],
			deg: 60,
			alt: height,
			duration: 9000,
			target: [center.lng, center.lat],
			scroll_text: ''
		}
	};
}

export type sceneNoId = Omit<SceneSchema, 'id'>;
export type sceneOptional = Partial<SceneSchema>;
const scenes = writable<SceneSchema[]>([]);
export const sceneStore = {
	subscribe: scenes.subscribe,
	importScenes: (scenesArray: SceneSchema[]) => {
		scenes.set(scenesArray);
	},
	setScenes: (scenesArray: SceneSchema[]) => {
		scenes.set(scenesArray);
		updateDB();
	},
	addScene: (sceneData: sceneNoId) => {
		scenes.update((items) => {
			const newScene = {
				...sceneData,
				id: cuid()
			};
			return [...items, newScene];
		});
		updateDB();
	},
	updateScene: (id: string, sceneData: sceneOptional) => {
		scenes.update((items) => {
			const sceneIndex = items.findIndex((i) => i.id === id);
			const updatedScene = { ...items[sceneIndex], ...sceneData };
			const updatedScenes = [...items];
			updatedScenes[sceneIndex] = updatedScene;
			return updatedScenes;
		});
		updateDB();
	},
	removeScene: (id: string) => {
		scenes.update((items) => {
			return items.filter((i) => i.id !== id);
		});
		updateDB();
	},
	sortScenes: (sceneOrder: string[]) => {
		scenes.update((items) => {
			const orderedScenes = sceneOrder.map((i) => items.find((scene) => scene.id == i));
			return orderedScenes;
		});
		updateDB();
	}
};

export type styleOptional = Partial<StyleSchema>;
export const styleStore = writable<StyleSchema>({
	line_color: '#000000',
	line_width: 3,
	fill_color: '#0080ff',
	fill_opacity: 0
});

// change to just duration
export const durationRngDerived = derived(scenes, ($scenes) => {
	if ($scenes.length > 0) {
		let duration = 0;
		const duration_rngs = $scenes.map((scene) => {
			const old_duration = duration;
			duration += scene.duration;
			return [old_duration, duration];
		});
		return duration_rngs;
	} else {
		return [];
	}
});

export const animationLength = derived(scenes, ($scenes) => {
	if ($scenes.length > 0) {
		return $scenes.reduce((acc, scene) => acc + scene.duration, 0);
	} else {
		return 0;
	}
});

function lerp(a: number[], b: number[], t: number) {
	if (Array.isArray(a) && Array.isArray(b)) {
		const new_coord = [];
		for (let i = 0; i < Math.min(a.length, b.length); i++)
			new_coord[i] = a[i] * (1.0 - t) + b[i] * t;
		return new_coord;
	} else {
		return a * (1.0 - t) + b * t;
	}
}

function lat_lon_adj(cy: number, cx: number) {
	const y_dis = turf.distance(turf.point([cx, cy + 0.1]), turf.point([cx, cy - 0.1]));
	const x_dis = turf.distance(turf.point([cx + 0.1, cy]), turf.point([cx - 0.1, cy]));
	return y_dis / x_dis;
}

function cerp(
	cy: number,
	cx: number,
	py: number,
	px: number,
	r: number,
	rad: number,
	a: number,
	t: number,
	adj: number
) {
	const new_coord = [cx + r * Math.sin(t * rad + a) * adj, cy + r * Math.cos(t * rad + a)];
	return new_coord;
}

function angle360(cx: number, cy: number, ex: number, ey: number) {
	const dy = ey - cy;
	const dx = ex - cx;
	let theta = Math.atan2(dy, dx); // range (-PI, PI]
	theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
	if (theta < 0) theta = 360 + theta; // range [0, 360)
	return theta;
}

// derived store for array of animations
export const animationStore = derived(scenes, ($scenes) => {
	return $scenes.map((scene) => {
		const { type: pathType } = scene;
		if (pathType === 'orbit') {
			const [cx, cy] = scene.target;
			const [px, py] = scene.start;
			// angle to add
			const rad = -scene.deg * (Math.PI / 180);
			// starting angle
			const a = angle360(cy, cx, py, px) * (Math.PI / 180);
			// distance of camera from target
			const r = ((py - cy) ** 2 + (px - cx) ** 2) ** (1 / 2);
			// calculate lat lon adjustment to make perfect circle
			const circle_adj = lat_lon_adj(cy, cx);
			return {
				duration: scene.duration,
				animate: (phase: number) => {
					// interpolate camera position while keeping focus on a target lat/lng
					const position = cerp(cy, cx, py, px, r, rad, a, phase, circle_adj);
					const altitude = lerp(scene.alt, scene.alt, phase);

					return [position, altitude, scene.target];
				}
			};
		} else {
			return {
				duration: scene.duration,
				animate: (phase: number) => {
					// interpolate camera position while keeping focus on a target lat/lng
					const position = lerp(scene.start, scene.end, phase);
					const altitude = lerp(scene.alt, scene.alt, phase);
					const aim = scene.target ? scene.target : lerp(scene.start, scene.end, phase + 0.0000001);

					return [position, altitude, aim];
				}
			};
		}
	});
});

let mostRecentUpdateTime = 0;
let last_save_time = 0;

export const recentSave = writable(false);

export function updateDB() {
	if (!browser) return; // prevent running on server
	const thisUpdateCalledAt = Date.now();
	mostRecentUpdateTime = thisUpdateCalledAt;
	const outboundData = {
		scenes: get(sceneStore),
		styles: get(styleStore)
	};
	const updatePath = `${window.location.pathname}/updateScenes`;
	setTimeout(async function () {
		// if another update has been called since this one, don't do anything
		if (thisUpdateCalledAt !== mostRecentUpdateTime) return;

		// update db
		const response = await fetch(updatePath, {
			method: 'POST',
			body: JSON.stringify(outboundData),
			headers: {
				'content-type': 'application/json'
			}
		});
		console.log('response: ', response);
		if (response.ok) {
			const this_save_time = Date.now();
			last_save_time = this_save_time;
			recentSave.set(true);
			setTimeout(function () {
				if (this_save_time === last_save_time) recentSave.set(false);
			}, 5000);
		}
	}, 2000);
}
