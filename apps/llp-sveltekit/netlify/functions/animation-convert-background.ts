import { BackgroundHandler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getBrowser } from './shared/puppeteer';
import { prisma } from './shared/prisma';
import { ConversionStatus } from '@prisma/client';
import type { Conversion } from '@prisma/client';

export async function updateConversionStatus(
	conversionId: string,
	status: ConversionStatus
): Promise<Conversion> {
	return await prisma.conversion.update({
		where: {
			id: conversionId
		},
		data: {
			status
		}
	});
}

export async function updateConversionProgress(
	conversionId: string,
	progress: number
): Promise<Conversion> {
	return await prisma.conversion.update({
		where: {
			id: conversionId
		},
		data: {
			processing_progress: progress
		}
	});
}

export const handler: BackgroundHandler = async (event: HandlerEvent, context: HandlerContext) => {
	if (!event.body) return;
	const { originUrl, propertyId, conversionId } = JSON.parse(event.body);
	const pageUrl = `${originUrl}/${propertyId}/video?superuser-key=${process.env.PRIVATE_SUPERUSER_KEY}&conversion-id=${conversionId}`;
	console.log('pageUrl: ', pageUrl);

	const browser = await getBrowser();
	try {
		const page = await browser.newPage();
		// read status updates from the page and update the database
		let lastProgressUpdateTime = Date.now();

		page.on('console', async (msg) => {
			const logObjValue = await msg?.args()?.at(0)?.jsonValue();
			if (logObjValue && typeof logObjValue === 'object') {
				if (
					'update' in logObjValue &&
					typeof logObjValue.update === 'string' &&
					logObjValue.update in ConversionStatus
				) {
					console.log(`Current status: ${logObjValue.update}`);
					updateConversionStatus(conversionId, logObjValue.update as ConversionStatus);
				}
				if ('progress' in logObjValue && typeof logObjValue.progress === 'number') {
					console.log(`Processing progress: ${logObjValue.progress}`);
					if (Date.now() - lastProgressUpdateTime > 1000) {
						updateConversionProgress(conversionId, logObjValue.progress);
						lastProgressUpdateTime = Date.now();
					}
				}
			}
		});

		await page.goto(pageUrl);
		await page.content();
		await page.waitForSelector('#convert-animation');
		updateConversionStatus(conversionId, 'CALLED');
		await page.click('#convert-animation');
		const crawlerData = await page.waitForSelector('#crawler-data', { timeout: 1000 * 60 * 15 });
		if (!crawlerData) throw new Error('Crawler data not found');
		const { jobId, s3Key } = await crawlerData.evaluate((el) => {
			const textContent = el.textContent;
			if (!textContent) throw new Error('Crawler data not found');
			return JSON.parse(textContent);
		});
		console.log('Puppeteer finished generating video');

		await prisma.conversion.update({
			where: {
				id: conversionId
			},
			data: {
				job_id: jobId as string,
				s3_key: s3Key as string
			}
		});
	} catch (error) {
		updateConversionStatus(conversionId, 'ERROR_CRAWLER');
	} finally {
		browser.close();
		console.log('Browser closed');
	}
};
