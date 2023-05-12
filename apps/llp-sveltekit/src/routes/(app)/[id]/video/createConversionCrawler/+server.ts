import type { RequestHandler } from './$types';
import { error as errorKit, json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { SceneSchema } from '../updateScenes/+server';
import { dev } from '$app/environment';

export const GET: RequestHandler = async ({ params, locals, url, fetch }) => {
	const { user, session } = await locals.validateUser();
	if (!(user && session)) {
		throw errorKit(401, 'Unauthorized');
	}

	const property = await prisma.property.findFirstOrThrow({
		where: {
			id: params.id
		},
		include: {
			animation: true
		}
	});
	if (property.account_id !== user.userId && user?.role !== 'ADMIN') {
		throw errorKit(403, 'Unauthorized to access this property');
	}
	if (!property.animation) {
		throw errorKit(404, 'Video Maker does not exist for this property');
	}
	if (!property.animation.scenes || !property.animation.map_style) {
		throw errorKit(400, 'Video Maker is missing scenes or map style');
	}

	const scenes = property.animation.scenes as SceneSchema[];
	const videoDuration = scenes.reduce((acc, scene) => acc + scene.duration, 0);
	const conversion = await prisma.conversion.create({
		data: {
			animation: {
				connect: {
					id: property.animation.id
				}
			},
			scenes: property.animation.scenes,
			map_style: property.animation.map_style,
			video_duration: videoDuration
		}
	});

	// crawlVideo(url.origin, params.id, conversion);
	const functionDomain = dev ? 'http://localhost:9000' : '';
	// const functionDomain = dev ? 'http://localhost:8888' : '';
	// const functionDomain = ''
	const response = await fetch(
		functionDomain + '/.netlify/functions/animation-convert-background',
		{
			method: 'POST',
			body: JSON.stringify({
				originUrl: url.origin,
				propertyId: params.id,
				conversionId: conversion.id
			})
		}
	);
	if (response.status !== 202) {
		throw errorKit(500, 'Failed to start conversion');
	}

	return json({ status: 201, conversion, message: 'Conversion created and crawler started' });
};
