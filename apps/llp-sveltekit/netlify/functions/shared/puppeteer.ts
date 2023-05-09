import puppeteer from 'puppeteer-core';
import type { Browser, Page } from 'puppeteer-core';

export async function getBrowser(): Promise<Browser> {
	console.log('process.env.CONTEXT: ', process.env.CONTEXT);
	if (process.env.CONTEXT === 'dev') {
		return puppeteer.launch({
			headless: true,
			defaultViewport: {
				width: 1920,
				height: 1080,
				deviceScaleFactor: 2
			},
			executablePath:
				'/Users/alantolar/.cache/puppeteer/chrome/mac-1095492/chrome-mac/Chromium.app/Contents/MacOS/Chromium'
		});
	} else {
		const endpoint = `wss://chrome.browserless.io/?token=${process.env.PRIVATE_BROWSERLESS_KEY}&--window-size=1200,900`;
		console.log('endpoint: ', endpoint);
		return puppeteer.connect({
			browserWSEndpoint: endpoint
		});
	}
}

export async function crawlAttemptLoop(
	browser: Browser,
	browserSession: () => Promise<void>,
	failedCrawlAttempts?: () => Promise<void>
) {
	let attempts = 0;
	let success = false;
	while (attempts < 3 && !success) {
		console.log('Starting attempt: ', attempts + 1);
		try {
			await browserSession();
			console.log('Puppeteer execution successful');
			success = true;
		} catch (error) {
			browser.close();
			console.log(error);
			attempts++;
			if (attempts === 3 && failedCrawlAttempts) {
				await failedCrawlAttempts();
			}
		}
	}
}

export async function consoleLogPage(page: Page) {
	page.on('console', (msg) => {
		for (let i = 0; i < msg.args().length; ++i) {
			console.log(`${i}: ${msg.args()[i]}`);
		}
	});
}
