import { MediaConvertClient, GetJobCommand } from '@aws-sdk/client-mediaconvert';
import { PRIVATE_S3_ACCOUNT_AUTH_TOKEN, PRIVATE_S3_ACCOUNT_ID } from '$env/static/private';
import type { Conversion } from '@prisma/client';
import { updateConversionStatus } from '$lib/server/prismaQueries';
import { prisma } from '$lib/server/prisma';

export async function checkMediaConvertStatus(conversions: Conversion[]): Promise<Conversion[]> {
	const client = new MediaConvertClient({
		region: 'us-east-1',
		credentials: {
			accessKeyId: PRIVATE_S3_ACCOUNT_ID,
			secretAccessKey: PRIVATE_S3_ACCOUNT_AUTH_TOKEN
		},
		endpoint: 'https://q25wbt2lc.mediaconvert.us-east-1.amazonaws.com'
	});

	const updatedConversions = await Promise.all(
		conversions.map(async (conversion) => {
			if (conversion.status && ['JOB_CREATED', 'TRANSCODING'].includes(conversion.status)) {
				if (!conversion.job_id) {
					return await updateConversionStatus(conversion, 'ERROR_CONVERT');
				}

				const jobDetails = await client.send(new GetJobCommand({ Id: conversion.job_id }));
				console.log('MediaConvert job status: ', jobDetails.Job?.Status);
				if (jobDetails.Job?.Status === 'PROGRESSING') {
					const transcodingProgress = jobDetails.Job?.JobPercentComplete || 0;
					if (conversion.status === 'TRANSCODING') {
						return await prisma.conversion.update({
							where: {
								id: conversion.id
							},
							data: {
								transcoding_progress: transcodingProgress / 100
							}
						});
					} else {
						return await updateConversionStatus(conversion, 'TRANSCODING');
					}
				}
				if (jobDetails.Job?.Status === 'ERROR') {
					return await updateConversionStatus(conversion, 'ERROR_CONVERT');
				}
				if (jobDetails.Job?.Status === 'COMPLETE') {
					return await updateConversionStatus(conversion, 'COMPLETED');
				}
				return conversion;
			}
			return conversion;
		})
	);
	return updatedConversions;
}
