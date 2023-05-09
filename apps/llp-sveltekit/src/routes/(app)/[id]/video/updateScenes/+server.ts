import type { RequestHandler } from './$types';
import { error as errorKit, json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { z } from 'zod';

const sceneSchema = z.object({
	id: z.string(),
	scroll_text: z.string(),
	duration: z.number(),
	start: z.number().array().length(2),
	alt: z.number(),
	type: z.enum(['line', 'orbit', 'flyover']),
	end: z.number().array().length(2).optional(),
	target: z.number().array().length(2).optional(),
	deg: z.number().optional()
});
const styleSchema = z.object({
	fill_color: z.string(),
	fill_opacity: z.number(),
	line_color: z.string(),
	line_width: z.number()
});

const updateSchema = z.object({
	scenes: sceneSchema.array().optional(),
	styles: styleSchema.optional()
});

export type SceneSchema = z.infer<typeof sceneSchema>;
export type StyleSchema = z.infer<typeof styleSchema>;
type UpdateSchema = z.infer<typeof updateSchema>;

export const POST: RequestHandler = async ({ request, params, locals }) => {
	const { user, session } = await locals.validateUser();
	if (!(user && session)) throw errorKit(401, 'Unauthorized');

	const property = await prisma.property.findFirstOrThrow({
		where: {
			id: params.id
		},
		include: {
			animation: true
		}
	});
	if (property.account_id !== user.userId && user?.role !== 'ADMIN')
		throw errorKit(403, 'Unauthorized to access this property');
	if (!property.animation) throw errorKit(404, 'Video Maker does not exist for this property');

	// validate request body
	const data = await request.json();
	const validatedData = updateSchema.parse(data);
	console.log('validatedData: ', validatedData);
	// const validatedData = styleSchema.parse(data.styles);
	// console.log('validatedData: ', validatedData);

	// update markers in database
	try {
		await prisma.animation.update({
			where: {
				property_id: params.id
			},
			data: {
				map_style: validatedData.styles,
				scenes: validatedData.scenes
			}
		});
	} catch (error) {
		console.log('error: ', error);
		throw errorKit(500, 'Error updating video');
	}

	return json({ message: 'Success updating scenes and styles' }, { status: 200 });
};
