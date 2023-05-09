import { prisma } from '$lib/server/prisma';
import type { Prisma } from '@prisma/client';
import { error as errorKit } from '@sveltejs/kit';
import * as z from 'zod';
import * as turf from '@turf/turf';

export async function userOwnsProperty(userId: string, propertyId: string): Promise<boolean> {
	const property = await prisma.property.findUnique({
		where: {
			id: propertyId
		}
	});
	if (!property) {
		return false;
	}
	if (property.account_id !== userId) {
		return false;
	}
	return true;
}

interface GeomBoxCenter {
	propGeom: number[][][][];
	propBox: {
		max: { lat: number; lng: number };
		min: { lat: number; lng: number };
	};
	propCenter: { lng: number; lat: number };
}

export function parseGeomJSON(geom: Prisma.JsonValue): number[][][][] {
	const nestedNumberArraySchema = z.array(z.array(z.array(z.array(z.number()))));
	const geomParseResult = nestedNumberArraySchema.safeParse(geom);
	if (!geomParseResult.success) {
		throw errorKit(500, 'Property geometry is invalid');
	}
	return geomParseResult.data;
}

export async function calculateBoxAndCenter(geom: Prisma.JsonValue): Promise<GeomBoxCenter> {
	const geomArray = parseGeomJSON(geom);
	const multiPolygon = turf.multiPolygon(geomArray);
	const bboxArray = turf.bbox(multiPolygon);
	const bbox = {
		minX: bboxArray[0],
		minY: bboxArray[1],
		maxX: bboxArray[2],
		maxY: bboxArray[3]
	};
	const center = turf.center(multiPolygon).geometry.coordinates as [number, number];
	return {
		propGeom: geomArray,
		propBox: {
			max: { lat: bbox.maxY, lng: bbox.maxX },
			min: { lat: bbox.minY, lng: bbox.minX }
		},
		propCenter: { lng: center[0], lat: center[1] }
	};
}
