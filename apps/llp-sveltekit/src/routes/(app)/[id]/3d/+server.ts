import type { RequestHandler } from './$types';
import { error as errorKit, json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { z } from 'zod';

const updateMarkersSchema = z
	.object({
		id: z.string(),
		longitude: z.number(),
		latitude: z.number(),
		s3_key: z.string(),
		pano: z.boolean(),
		order: z.number()
	})
	.array();
// type UpdateMarkersData = z.infer<typeof updateMarkersSchema>;

export const POST: RequestHandler = async ({ request, params, locals }) => {
	const { user, session } = await locals.validateUser();
	if (!(user && session)) throw errorKit(401, 'Unauthorized');

	const property = await prisma.property.findFirstOrThrow({
		where: {
			id: params.id
		},
		include: {
			land_model: true
		}
	});
	if (property.account_id !== user.userId) {
		throw errorKit(403, 'Unauthorized to access this property');
	}
	if (!property.land_model) {
		throw errorKit(404, 'Model Maker does not exist for this property');
	}

	// validate request body
	const data = await request.json();
	const validatedData = updateMarkersSchema.parse(data);

	// update markers in database
	const upsertData = validatedData.map((marker) => {
		return {
			where: { id: marker.id },
			create: marker,
			update: marker
		};
	});
	const markerIds = validatedData.map((marker) => marker.id);

	try {
		await prisma.landModel.update({
			where: {
				property_id: params.id
			},
			data: {
				model_markers: {
					deleteMany: { id: { notIn: markerIds } },
					upsert: upsertData
				}
			},
			include: {
				model_markers: true
			}
		});
		return json({ message: 'Success updating markers' }, { status: 200 });
	} catch (error) {
		console.log('error: ', error);
		throw errorKit(404, 'Error updating markers');
	}
};
