import { BackgroundHandler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getBrowser, consoleLogPage } from './shared/puppeteer';
import { prisma } from './shared/prisma';

export const handler: BackgroundHandler = async (event: HandlerEvent, context: HandlerContext) => {
	if (!event.body) return;
	const { originUrl, propertyId } = JSON.parse(event.body);
	const pageUrl = `${originUrl}/${propertyId}/3d/generate?superuser-key=${process.env.PRIVATE_SUPERUSER_KEY}`;
	console.log('pageUrl: ', pageUrl);

	await prisma.landModel.update({
		where: { property_id: propertyId },
		data: {
			date_created: new Date(),
			s3_path: null,
			failed_generate: false
		}
	});

	const browser = await getBrowser();
	try {
		const page = await browser.newPage();
		await consoleLogPage(page);
		await page.goto(pageUrl);
		await page.content();
		await page.waitForFunction(() => typeof create3DModel === 'function');
		await page.evaluate(() => create3DModel());
		console.log('Puppeteer finished generating 3D model');

		await prisma.landModel.update({
			where: { property_id: propertyId },
			data: {
				s3_path: `properties/${propertyId}/model`,
				failed_generate: false
			}
		});
	} catch (error) {
		console.log('error: ', error);
		await prisma.landModel.update({
			where: { property_id: propertyId },
			data: {
				failed_generate: true
			}
		});
	} finally {
		if (browser) {
			browser.close();
		}
	}
};
