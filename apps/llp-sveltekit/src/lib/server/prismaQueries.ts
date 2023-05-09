import { prisma } from '$lib/server/prisma';
import type { Conversion, ConversionStatus } from '@prisma/client';

export async function updateConversionStatus(
	conversion: Conversion,
	status: ConversionStatus
): Promise<Conversion> {
	return await prisma.conversion.update({
		where: {
			id: conversion.id
		},
		data: {
			status
		}
	});
}
