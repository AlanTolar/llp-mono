import type { RequestHandler } from './$types';
import { createHmac } from 'crypto';
import { PRIVATE_TRANSLOADIT_SECRET } from '$env/static/private';
import { PUBLIC_TRANSLOADIT_KEY } from '$env/static/public';
import { json, error as errorKit } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { user, session } = await locals.validateUser();
	if (!(user && session)) {
		throw errorKit(401, 'Unauthorized');
	}

	const propertyId = url.searchParams.get('propertyId');
	if (!propertyId) throw errorKit(400, 'Missing propertyId');
	const property = await prisma.property.findFirstOrThrow({
		where: {
			id: propertyId
		}
	});
	if (!property) {
		throw errorKit(404, 'Property does not exist');
	}
	const isOwner = property.account_id === user?.userId;
	if (!isOwner && user?.role !== 'ADMIN') {
		throw errorKit(403, 'Unauthorized to access this property');
	}

	const expires = utcDateString(Date.now() + 1 * 60 * 60 * 1000);
	const params = JSON.stringify({
		auth: {
			key: PUBLIC_TRANSLOADIT_KEY,
			expires
		},
		template_id: '8a016bbca6a641d8b0a751e234f90a01',
		fields: {
			path: `/properties/${propertyId}/model/markers`
		}
	});
	const signatureBytes = createHmac('sha384', PRIVATE_TRANSLOADIT_SECRET).update(
		Buffer.from(params, 'utf-8')
	);
	// The final signature needs the hash name in front, so
	// the hashing algorithm can be updated in a backwards-compatible
	// way when old algorithms become insecure.
	const signature = `sha384:${signatureBytes.digest('hex')}`;
	console.log('signature: ', signature);

	return json({ params, signature });
};

const utcDateString = (ms: number) => {
	return new Date(ms)
		.toISOString()
		.replace(/-/g, '/')
		.replace(/T/, ' ')
		.replace(/\.\d+Z$/, '+00:00');
};
