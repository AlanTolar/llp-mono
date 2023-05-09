import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { z } from 'zod';
import { checkMediaConvertStatus } from '$lib/server/awsUtils';

export const GET: RequestHandler = async ({ url, locals, params }) => {
	const { user, session } = await locals.validateUser();
	if (!(user && session)) throw error(401, 'Unauthorized');

	let conversions = await prisma.conversion.findMany({
		where: {
			animation: {
				property: {
					id: params.id
				}
			}
		},
		orderBy: { date_created: 'desc' },
		take: 10
	});
	conversions = await checkMediaConvertStatus(conversions);

	return json({ status: 200, message: 'Success', conversions: conversions });
};
