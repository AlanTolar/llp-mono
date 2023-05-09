import type { PageServerLoad } from './$types';
import { error as errorKit, type Actions, json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { calculateBoxAndCenter } from '$lib/server/loadHelpers';
import type { SceneSchema, StyleSchema } from './updateScenes/+server';
import { checkMediaConvertStatus } from '$lib/server/awsUtils';
import type { Conversion } from '@prisma/client';

export const load = (async ({ params, locals, url }) => {
	const { user, session } = await locals.validateUser();
	if (!(user && session) && !locals.demoProperty && !locals.superuser) {
		throw errorKit(401, 'Unauthorized');
	}

	const property = await prisma.property.findUnique({
		where: {
			id: params.id
		},
		include: {
			animation: {
				include: {
					conversions: {
						orderBy: { date_created: 'desc' },
						take: 10
					}
				}
			}
		}
	});
	if (!property) {
		throw errorKit(404, 'Property does not exist');
	}
	const isOwner = property.account_id === user?.userId;
	if (!isOwner && !locals.demoProperty && !locals.superuser && user?.role !== 'ADMIN') {
		throw errorKit(403, 'Unauthorized to access this property');
	}
	const animation = property.animation;
	if (!animation) {
		throw errorKit(404, 'Video Maker does not exist for this property');
	}
	if (!animation.user_access) {
		throw errorKit(404, 'Video Maker has not been purchased for this property');
	}

	// If the user is a crawler, then we want to return the conversion that was specified in the query string
	const conversionIdFromCrawler = locals.superuser && url.searchParams.get('conversion-id');
	let conversions: Conversion[];
	let scenes: SceneSchema[] | null;
	let map_style: StyleSchema | null;
	if (conversionIdFromCrawler) {
		const crawledConversion = animation.conversions.find(
			(conversion) => conversion.id === conversionIdFromCrawler
		);
		if (crawledConversion) {
			conversions = [];
			scenes = crawledConversion.scenes as SceneSchema[] | null;
			map_style = crawledConversion.map_style as StyleSchema | null;
		} else {
			throw errorKit(404, 'Conversion being crawled does not exist');
		}
	} else {
		// Otherwise, we want to return the latest conversion
		conversions = await checkMediaConvertStatus(animation.conversions);
		scenes = animation.scenes as SceneSchema[] | null;
		map_style = animation.map_style as StyleSchema | null;
	}

	const animationId = animation.id;
	const calculated = await calculateBoxAndCenter(property.multi_polygon);
	return {
		...property,
		animationId,
		scenes,
		map_style,
		...calculated,
		conversions,
		conversionIdFromCrawler,
		isOwner
	};
}) satisfies PageServerLoad;
