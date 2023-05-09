import type { PageServerLoad } from './$types';
import { error as errorKit } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { calculateBoxAndCenter } from '$lib/server/loadHelpers';

export const load = (async ({ params, locals }) => {
	const { user, session } = await locals.validateUser();
	console.log('user: ', user);
	if (!(user && session) && !locals.demoProperty) {
		throw errorKit(401, 'Unauthorized');
	}

	const property = await prisma.property.findUnique({
		where: {
			id: params.id
		}
	});
	if (!property) {
		throw errorKit(404, 'Property does not exist');
	}
	const isOwner = property.account_id === user?.userId;
	if (!isOwner && !locals.demoProperty && user?.role !== 'ADMIN') {
		throw errorKit(403, 'Unauthorized to access this property');
	}

	const calculated = await calculateBoxAndCenter(property.multi_polygon);
	return { ...property, ...calculated, isOwner };
}) satisfies PageServerLoad;
