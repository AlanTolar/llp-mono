// import { createReadStream } from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import type { PutObjectCommandInput } from '@aws-sdk/client-s3';
import {
	PRIVATE_S3_ACCOUNT_AUTH_TOKEN,
	PRIVATE_S3_ACCOUNT_ID,
	PRIVATE_S3_BUCKET_NAME
} from '$env/static/private';

export async function uploadJsonToS3(body: PutObjectCommandInput['Body'], fileName: string) {
	const s3Client = new S3Client({
		region: 'us-east-1',
		credentials: {
			accessKeyId: PRIVATE_S3_ACCOUNT_ID,
			secretAccessKey: PRIVATE_S3_ACCOUNT_AUTH_TOKEN
		}
	});
	console.log('Client created');

	const uploadCommand = new PutObjectCommand({
		Bucket: PRIVATE_S3_BUCKET_NAME,
		Key: fileName,
		Body: body
	});
	console.log('Command created');

	const response = await s3Client.send(uploadCommand);
	console.log('response: ', response);
}
