import type { PageServerLoad } from './$types';
import { error as errorKit } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { parseGeomJSON } from '$lib/server/loadHelpers';

export const load = (async ({ params, locals }) => {
	const { user, session } = await locals.validateUser();
	// if (!(user && session) && !locals.demoProperty) {
	// 	throw errorKit(401, 'Unauthorized');
	// }

	const property = await prisma.property.findUnique({
		where: {
			id: params.id
		},
		include: {
			land_model: {
				include: {
					model_markers: true
				}
			}
		}
	});
	if (!property) {
		throw errorKit(404, 'Property does not exist');
	}
	if (!property?.land_model) {
		throw errorKit(404, 'No model found for this property');
	}
	const isOwner = property.account_id === user?.userId;
	if (!property.land_model.user_access && !isOwner) {
		throw errorKit(
			404,
			'Model Maker Upgrade has not been purchased for this property. If you are the owner, upgrade your account to make your 3D model visible to everyone.'
		);
	}

	return {
		prop_geom: parseGeomJSON(property?.multi_polygon),
		s3_path: property?.land_model?.s3_path,
		model_markers: property?.land_model?.model_markers,
		failed_generate: property?.land_model?.failed_generate,
		date_created: property?.land_model?.date_created
	};
}) satisfies PageServerLoad;
