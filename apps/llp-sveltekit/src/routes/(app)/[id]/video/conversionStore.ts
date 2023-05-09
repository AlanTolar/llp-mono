import { writable, derived } from 'svelte/store';
import type { Conversion } from '@prisma/client';
import { DateTime } from 'luxon';

const conversions = writable<Conversion[]>([]);
export const conversionStore = {
	subscribe: conversions.subscribe,
	initConversions: (conversionsArray: Conversion[]) => {
		conversions.set(conversionsArray);
	},
	createConversion: async (originUrl: string) => {
		const response = await fetch(`${originUrl}/createConversionCrawler`);
		const data = await response.json();
		if (data.conversion) {
			conversions.update((items) => {
				const newConversion = data.conversion as Conversion;
				return [newConversion, ...items];
			});
		}
	},
	refreshConversions: async (originUrl: string) => {
		const response = await fetch(`${originUrl}/getConversionStatus`);
		const data = await response.json();
		console.log('data: ', data);
		if (data.conversions) {
			console.log('data.conversions: ', data.conversions);
			conversions.set(data.conversions);
		}
	}
};

export const modifiedConversionStore = derived(conversions, ($conversions) => {
	return $conversions.map((conversion) => {
		let statusMessage = 'test';
		let progress: number | null = 0;
		switch (conversion.status) {
			case 'REQUESTED':
				statusMessage = 'Requesting a server to start converting animation to video';
				progress = 1;
				break;
			case 'CALLED':
				statusMessage = 'Animation conversion process started';
				progress = 5;
				break;
			case 'ANIMATION_PROCESSING':
				// eslint-disable-next-line no-case-declarations
				const animationProcessed = conversion.processing_progress
					? Math.round(conversion.processing_progress * 100)
					: 0;
				statusMessage = `${animationProcessed}% of animation has been converted to WebM`;
				progress = 5 + Math.round(animationProcessed * (60 / 100));
				break;
			case 'WEBM_UPLOADING':
				statusMessage = 'WebM file being uploaded to storage';
				progress = 65;
				break;
			case 'CREATING_JOB':
				statusMessage = 'Creating a job to convert WebM to MP4';
				progress = 70;
				break;
			case 'JOB_CREATED':
				statusMessage = 'WebM file in queue to be transcoded to MP4';
				progress = 70;
				break;
			case 'TRANSCODING':
				// eslint-disable-next-line no-case-declarations
				const webmProcessed = conversion.transcoding_progress
					? Math.round(conversion.transcoding_progress * 100)
					: 0;
				statusMessage = `${webmProcessed}% of WebM video has been transcoded to MP4`;
				progress = 80 + Math.round(webmProcessed * (20 / 100));
				break;
			case 'COMPLETED':
				statusMessage = 'Finished! MP4 can be downloaded and streamed';
				progress = 100;
				break;
			case 'ERROR_CRAWLER':
				statusMessage = 'Conversion from animation to WebM failed';
				progress = null;
				break;
			case 'ERROR_CONVERT':
				statusMessage = 'Conversion from WebM to MP4 failed';
				progress = null;
				break;
			case 'CANCELED':
				statusMessage = 'Conversion process cancelled by user';
				progress = null;
				break;
			default:
				statusMessage = 'State of conversion is unknown';
				progress = null;
				break;
		}

		return {
			...conversion,
			statusMessage,
			progress
		};
	});
});

export const hasActiveConversion = derived(conversions, ($conversions) => {
	return $conversions.some((conversion) => {
		const maxConversionAge = 1000 * 60 * 15;
		const dateCreated = DateTime.fromISO(conversion.date_created);
		const dateCreatedPlusMaxAge = dateCreated.plus({
			milliseconds: maxConversionAge
		});
		const conversionExpired = DateTime.now() > dateCreatedPlusMaxAge;
		const conversionStatusIsActive = [
			'REQUESTED',
			'CALLED',
			'ANIMATION_PROCESSING',
			'WEBM_UPLOADING',
			'CREATING_JOB',
			'JOB_CREATED',
			'TRANSCODING'
		].includes(conversion.status);
		return conversionStatusIsActive && !conversionExpired;
	});
});
