import type { PageServerLoad, Actions } from './$types';
import { error as errorKit } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { calculateBoxAndCenter } from '$lib/server/loadHelpers';

export const load = (async ({ params, locals }) => {
	const { user, session } = await locals.validateUser();
	if (!(user && session) && !locals.demoProperty) {
		throw errorKit(401, 'Unauthorized');
	}

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
	const isOwner = property.account_id === user?.userId;
	if (!isOwner && !locals.demoProperty && user?.role !== 'ADMIN') {
		throw errorKit(403, 'Unauthorized to access this property');
	}
	if (!property.land_model) {
		throw errorKit(404, 'Model Maker does not exist for this property');
	}

	const land_model = property.land_model;
	const name = property.name;
	const calculated = await calculateBoxAndCenter(property.multi_polygon);
	return { name, ...calculated, isOwner, land_model };
}) satisfies PageServerLoad;
