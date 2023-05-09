import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { MediaConvertClient, CreateJobCommand } from '@aws-sdk/client-mediaconvert';
import {
	PRIVATE_S3_ACCOUNT_AUTH_TOKEN,
	PRIVATE_S3_ACCOUNT_ID,
	PRIVATE_S3_BUCKET_NAME
} from '$env/static/private';

export const GET: RequestHandler = async ({ url }) => {
	const filePath = url.searchParams.get('filePath');
	const fileName = url.searchParams.get('fileName');
	if (!fileName || !filePath) throw error(400, 'Missing fileName or filePath');

	const client = new MediaConvertClient({
		region: 'us-east-1',
		credentials: {
			accessKeyId: PRIVATE_S3_ACCOUNT_ID,
			secretAccessKey: PRIVATE_S3_ACCOUNT_AUTH_TOKEN
		},
		endpoint: 'https://q25wbt2lc.mediaconvert.us-east-1.amazonaws.com'
	});
	const fileInput = `s3://${PRIVATE_S3_BUCKET_NAME}/${filePath}/${fileName}.webm`;
	const fileOutput = `s3://${PRIVATE_S3_BUCKET_NAME}/${filePath}/${fileName}`;
	const command = new CreateJobCommand({
		Queue: 'arn:aws:mediaconvert:us-east-1:348405475143:queues/Default',
		UserMetadata: {},
		Role: 'arn:aws:iam::348405475143:role/service-role/MediaConvert_Default_Role',
		Settings: {
			TimecodeConfig: {
				Source: 'ZEROBASED'
			},
			OutputGroups: [
				{
					Name: 'File Group',
					Outputs: [
						{
							ContainerSettings: {
								Container: 'MP4',
								Mp4Settings: {}
							},
							VideoDescription: {
								CodecSettings: {
									Codec: 'H_264',
									H264Settings: {
										MaxBitrate: 5000000,
										RateControlMode: 'QVBR',
										SceneChangeDetect: 'TRANSITION_DETECTION'
									}
								}
							},
							AudioDescriptions: [
								{
									CodecSettings: {
										Codec: 'AAC',
										AacSettings: {
											Bitrate: 96000,
											CodingMode: 'CODING_MODE_2_0',
											SampleRate: 48000
										}
									}
								}
							]
						}
					],
					OutputGroupSettings: {
						Type: 'FILE_GROUP_SETTINGS',
						FileGroupSettings: {
							Destination: fileOutput
						}
					}
				}
			],
			Inputs: [
				{
					AudioSelectors: {
						'Audio Selector 1': {
							DefaultSelection: 'DEFAULT'
						}
					},
					VideoSelector: {},
					TimecodeSource: 'ZEROBASED',
					FileInput: fileInput
				}
			]
		},
		AccelerationSettings: {
			Mode: 'DISABLED'
		},
		StatusUpdateInterval: 'SECONDS_10',
		Priority: 0
	});
	const response = await client.send(command);
	console.log('CreateJobCommand response: ', response);
	return json(response);
};
