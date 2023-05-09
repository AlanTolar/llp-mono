import { SESClient } from '@aws-sdk/client-ses';
import { PRIVATE_S3_ACCOUNT_AUTH_TOKEN, PRIVATE_S3_ACCOUNT_ID } from '$env/static/private';

export const sesClient = new SESClient({
	region: 'us-east-1',
	credentials: {
		accessKeyId: PRIVATE_S3_ACCOUNT_ID,
		secretAccessKey: PRIVATE_S3_ACCOUNT_AUTH_TOKEN
	}
});
