import { auth } from '$lib/server/lucia';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { z } from 'zod';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.validate();
	if (session) {
		throw redirect(302, '/account');
	}
};

const registerSchema = z
	.object({
		email: z
			.string({ required_error: 'Email is required' })
			.min(1, { message: 'Email is required' })
			.max(64, { message: 'Email must be less than 64 characters' })
			.email({ message: 'Email must be a valid email address' }),
		password: z
			.string({ required_error: 'Password is required' })
			.min(6, { message: 'Password must be at least 6 characters' })
			.max(32, { message: 'Password must be less than 32 characters' })
			.trim(),
		passwordConfirm: z
			.string({ required_error: 'Password is required' })
			.min(6, { message: 'Password must be at least 6 characters' })
			.max(32, { message: 'Password must be less than 32 characters' })
			.trim(),
		terms: z.enum(['on'], { required_error: 'You must accept the terms and conditions' })
	})
	.superRefine(({ passwordConfirm, password }, ctx) => {
		if (passwordConfirm !== password) {
			ctx.addIssue({
				code: 'custom',
				message: 'Password and Confirm Password must match',
				path: ['password']
			});
			ctx.addIssue({
				code: 'custom',
				message: 'Password and Confirm Password must match',
				path: ['passwordConfirm']
			});
		}
	});
type RegisterData = z.infer<typeof registerSchema>;

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = Object.fromEntries(await request.formData()) as RegisterData;
		const { email, password } = formData;

		const parseResult = registerSchema.safeParse(formData);
		if (!parseResult.success) {
			const { fieldErrors: errors } = parseResult.error.flatten();
			return {
				data: { email: email },
				errors
			};
		}

		try {
			const user = await auth.createUser({
				primaryKey: {
					providerId: 'email',
					providerUserId: email,
					password
				},
				attributes: {
					email,
					email_verified: false
				}
			});
			const session = await auth.createSession(user.userId);
			locals.setSession(session);

			await prisma.account.create({
				data: {
					user: {
						connect: {
							id: user.userId
						}
					}
				}
			});
		} catch (err) {
			console.error(err);
			return fail(400, { error: 'Invalid credentials', message: 'Could not register user' });
		}

		throw redirect(302, '/verification-status');
	}
};
