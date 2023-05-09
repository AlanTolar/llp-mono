import puppeteer from 'puppeteer';

export async function crawlAttemptLoop(
	pageUrl: string,
	browserSession: (pageUrl: string) => Promise<void>,
	failedCrawlAttempts?: () => Promise<void>
) {
	let attempts = 0;
	let success = false;
	while (attempts < 3 && !success) {
		console.log('Starting attempt: ', attempts + 1);
		try {
			await browserSession(pageUrl);
			success = true;
		} catch (error) {
			console.log(error);
			attempts++;
			if (attempts === 3 && failedCrawlAttempts) {
				await failedCrawlAttempts();
			}
		}
	}
}

export async function startBrowserSession(pageUrl: string, consoleLogs = false, headless = true) {
	const browser = await puppeteer.launch({
		defaultViewport: {
			width: 1920,
			height: 1080,
			deviceScaleFactor: 2
		},
		headless
	});
	const page = await browser.newPage();
	if (consoleLogs) {
		page.on('console', (msg) => {
			for (let i = 0; i < msg.args().length; ++i) {
				console.log(`${i}: ${msg.args()[i]}`);
			}
		});
	}
	await page.goto(pageUrl);
	await page.content();
	return { browser, page };
}
