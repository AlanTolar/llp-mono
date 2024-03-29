import { BackgroundHandler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getBrowser } from './shared/puppeteer';
import { connect } from '@planetscale/database';
import fetch from 'node-fetch';

const conn = connect({ url: process.env.PRIVATE_DATABASE_URL, fetch:fetch})


export async function updateConversionStatus(
	conversionId: string,
	status: string
): Promise<any> {
	const results = await conn.execute('UPDATE conversion SET status = :status WHERE id = :conversionId', { status, conversionId })
	console.log('updateConversionStatus results: ', results);
	return results
}

export async function updateConversionProgress(
	conversionId: string,
	progress: number
): Promise<any> {
	const results = await conn.execute('UPDATE conversion SET processing_progress = :progress WHERE id = :conversionId', { progress, conversionId })
	console.log('updateConversionProgress results: ', results);
	return results
}

export const handler: BackgroundHandler = async (event: HandlerEvent, context: HandlerContext) => {
	if (!event.body) return;
	const { originUrl, propertyId, conversionId } = JSON.parse(event.body);
	const pageUrl = `${originUrl}/${propertyId}/video?superuser-key=${process.env.PRIVATE_SUPERUSER_KEY}&conversion-id=${conversionId}`;
	console.log('pageUrl: ', pageUrl);

	const browser = await getBrowser();
	console.log('browser: ', browser);
	try {
		const page = await browser.newPage();
		console.log('page: ', page);
		// read status updates from the page and update the database
		let lastProgressUpdateTime = Date.now();

		page.on('console', async (msg) => {
			const logObjValue = await msg?.args()?.at(0)?.jsonValue();
			if (logObjValue && typeof logObjValue === 'object') {
				if (
					'update' in logObjValue &&
					typeof logObjValue.update === 'string'
				) {
					console.log(`Current status: ${logObjValue.update}`);
					updateConversionStatus(conversionId, logObjValue.update);
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
		console.log('goto');
		await page.content();
		console.log('content');
		await page.waitForSelector('#convert-animation');
		console.log('waitForSelector');
		updateConversionStatus(conversionId, 'CALLED');
		await page.click('#convert-animation');
		console.log('click convert-animation');
		const crawlerData = await page.waitForSelector('#crawler-data', { timeout: 1000 * 60 * 15 });
		if (!crawlerData) throw new Error('Crawler data not found');
		const { jobId, s3Key } = await crawlerData.evaluate((el) => {
			const textContent = el.textContent;
			if (!textContent) throw new Error('Crawler data not found');
			return JSON.parse(textContent);
		});
		console.log('Puppeteer finished generating video');

		const results = await conn.execute('UPDATE conversion SET job_id = :jobId, s3_key = :s3Key WHERE id = :conversionId', { jobId, s3Key, conversionId })
		console.log('handler results: ', results);
	} catch (error) {
		updateConversionStatus(conversionId, 'ERROR_CRAWLER');
	} finally {
		browser.close();
		console.log('Browser closed');
	}
};
