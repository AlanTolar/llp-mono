import type { PageServerLoad, Actions } from './$types';
import { z } from 'zod';
import { prisma } from '$lib/server/prisma';
import { error as errorKit, redirect } from '@sveltejs/kit';
import { uploadJsonToS3 } from '$lib/server/s3/upload';
import { nanoid } from 'nanoid';
import { dev } from '$app/environment';

export const load = (async ({ locals }) => {
	const { user, session } = await locals.validateUser();
	if (!(user && session)) {
		throw errorKit(401, 'Unauthorized');
	}
	if (!user.emailVerified) {
		throw redirect(302, '/verification-status');
	}
}) satisfies PageServerLoad;

const selectPropertySchema = z.object({
	title: z
		.string({ required_error: 'Title is required' })
		.min(1, { message: 'Title is required' })
		.max(200, { message: 'Title must be less than 200 characters' }),
	geometries: z.string(),
	report_all: z.string()
});
type SelectPropertyData = z.infer<typeof selectPropertySchema>;

export const actions: Actions = {
	selectProperty: async ({ request, locals, url, fetch }) => {
		const { user, session } = await locals.validateUser();
		if (!(user && session)) {
			throw errorKit(401, 'Unauthorized');
		}

		const formData = Object.fromEntries(await request.formData()) as SelectPropertyData;
		const parseResult = selectPropertySchema.safeParse(formData);
		if (!parseResult.success) {
			const { fieldErrors: errors } = parseResult.error.flatten();
			return {
				data: { title: formData.title },
				errors
			};
		}
		const geometries = JSON.parse(formData.geometries);

		try {
			const updatedUser = await prisma.account.update({
				where: { id: user.userId },
				data: {
					free_properties: {
						decrement: 1
					}
				},
				select: {
					free_properties: true
				}
			});

			console.log('updatedUser: ', updatedUser);
			const freeAccess =
				updatedUser.free_properties >= 0 || ['ADMIN', 'FREEBIES'].includes(user.role);

			const property = await prisma.property.create({
				data: {
					id: nanoid(6),
					name: formData.title,
					multi_polygon: geometries,
					account: {
						connect: {
							id: user.userId
						}
					},
					animation: {
						create: {
							user_access: true
						}
					},
					land_model: {
						create: {
							user_access: freeAccess
						}
					}
				},
				include: {
					land_model: true,
					animation: true
				}
			});
			console.log('property: ', property);
			uploadJsonToS3(formData.report_all, `properties/${property.id}/report_all.json`);
		} catch (error) {
			console.log('error: ', error);
			throw errorKit(500, 'Internal Server Error');
		}

		throw redirect(302, '/account');
	}
};
