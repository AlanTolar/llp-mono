import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/prisma';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
	const property = await prisma.property.findUnique({
		where: {
			id: params.id
		},
		include: {
			land_model: true
		}
	});
	if (!property) {
		return json({ error: 'Property does not exist' }, { status: 404 });
	}
	return json(property.land_model, { status: 200 });
};
