import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import {
	PRIVATE_S3_ACCOUNT_AUTH_TOKEN,
	PRIVATE_S3_ACCOUNT_ID,
	PRIVATE_S3_BUCKET_NAME
} from '$env/static/private';

export const GET: RequestHandler = async ({ url }) => {
	// const { user, session } = await locals.validateUser();
	// if (!(user && session)) {
	// 	throw error(401, 'Unauthorized');
	// }

	const fileName = url.searchParams.get('fileName');
	const fileType = url.searchParams.get('fileType');
	if (!fileName || !fileType) throw error(400, 'Missing fileName or fileType');

	const s3Client = new S3Client({
		region: 'us-east-1',
		credentials: {
			accessKeyId: PRIVATE_S3_ACCOUNT_ID,
			secretAccessKey: PRIVATE_S3_ACCOUNT_AUTH_TOKEN
		}
	});

	const post = await createPresignedPost(s3Client, {
		Bucket: PRIVATE_S3_BUCKET_NAME,
		Key: fileName,
		Fields: {
			acl: 'public-read',
			'Content-Type': fileType
		},
		Expires: 600 // seconds
		// Conditions: [['content-length-range', 0, 1048576 * 5]]
	});
	return new Response(JSON.stringify(post));
};
