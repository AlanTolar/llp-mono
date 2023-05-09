import type { PageServerLoad, Actions } from './$types';
import { error as errorKit } from '@sveltejs/kit';
import { redirect } from 'sveltekit-flash-message/server';
import { prisma } from '$lib/server/prisma';
import { z } from 'zod';
import { userOwnsProperty } from '$lib/server/loadHelpers';

export const load = (async ({ locals }) => {
	const { user, session } = await locals.validateUser();
	if (!(user && session)) {
		throw errorKit(401, 'Unauthorized');
	}
	if (!user.emailVerified) {
		throw redirect(302, '/verification-status');
	}

	let properties = await prisma.property.findMany({
		where: {
			OR: [{ account_id: user.userId }, { id: 'demo' }]
		},
		select: {
			id: true,
			name: true,
			date_created: true,
			animation: {
				select: {
					id: true,
					user_access: true
				}
			},
			land_model: {
				select: {
					id: true,
					user_access: true
				}
			}
		},
		orderBy: {
			date_created: 'desc'
		}
	});
	// move demo property to the bottom of the list
	const demoProperty = properties.find((p) => p.id === 'demo');
	if (demoProperty) {
		properties = properties.filter((p) => p.id !== 'demo');
		properties.push(demoProperty);
	}

	return {
		listings: properties
	};
}) satisfies PageServerLoad;

const titleSchema = z
	.string()
	.min(1, { message: 'Title is required' })
	.max(200, { message: 'Title must be less than 200 characters' });

export const actions: Actions = {
	renameProperty: async ({ request, locals, url }) => {
		const { user, session } = await locals.validateUser();
		if (!(user && session)) {
			throw errorKit(401, 'Unauthorized: user not logged in');
		}

		const propertyId = url.searchParams.get('id');
		if (!propertyId) throw errorKit(400, 'Bad Request');
		const isOwner = await userOwnsProperty(user.userId, propertyId);
		if (!isOwner) throw errorKit(401, 'Unauthorized: user does not own property');

		const formData = Object.fromEntries(await request.formData());
		const parseResult = titleSchema.safeParse(formData.new_name);
		if (!parseResult.success) {
			const { fieldErrors: errors } = parseResult.error.flatten();
			return {
				data: { title: formData.new_name },
				errors
			};
		}
		const newName = parseResult.data;

		try {
			await prisma.property.update({
				where: { id: propertyId },
				data: { name: newName }
			});
			return { status: 202 };
		} catch (error) {
			console.log('error: ', typeof error);
			throw errorKit(500, 'Internal Server Error');
		}
	},

	deleteProperty: async ({ locals, url }) => {
		const { user, session } = await locals.validateUser();
		if (!(user && session)) {
			throw errorKit(401, 'Unauthorized: user not logged in');
		}

		const propertyId = url.searchParams.get('id');
		if (!propertyId) throw errorKit(400, 'Bad Request');
		const isOwner = await userOwnsProperty(user.userId, propertyId);
		if (!isOwner) throw errorKit(401, 'Unauthorized: user does not own property');

		try {
			await prisma.property.delete({
				where: { id: propertyId }
			});
			return { status: 202 };
		} catch (error) {
			console.log('error: ', error);
			throw errorKit(500, 'Internal Server Error');
		}
	},

	deleteAccount: async (event) => {
		const { locals } = event;
		const { user, session } = await locals.validateUser();
		if (!(user && session)) {
			throw errorKit(401, 'Unauthorized: user not logged in');
		}

		try {
			await prisma.user.delete({
				where: { id: user.userId }
			});
		} catch (error) {
			console.log('error: ', typeof error);
			throw errorKit(500, 'Internal Server Error');
		}
		// throw redirect(302, '/');
		const message = {
			type: 'danger',
			message: 'Account successfully deleted'
		} as const;
		throw redirect(302, '/', message, event);
	}
};
