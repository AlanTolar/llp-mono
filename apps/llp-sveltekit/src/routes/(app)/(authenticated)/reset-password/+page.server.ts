import { auth } from '$lib/server/lucia';
import { fail, error } from '@sveltejs/kit';
import { redirect } from 'sveltekit-flash-message/server';
import type { Actions, PageServerLoad } from './$types';
import { z } from 'zod';

export const load = (async ({ locals }) => {
	const { user, session } = await locals.validateUser();
	if (!(user && session)) {
		throw error(401, 'Unauthorized');
	}
}) satisfies PageServerLoad;

const changePasswordSchema = z
	.object({
		password: z
			.string({ required_error: 'Password is required' })
			.min(6, { message: 'Password must be at least 6 characters' })
			.max(32, { message: 'Password must be less than 32 characters' })
			.trim(),
		passwordConfirm: z
			.string({ required_error: 'Password is required' })
			.min(6, { message: 'Password must be at least 6 characters' })
			.max(32, { message: 'Password must be less than 32 characters' })
			.trim()
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
type PasswordData = z.infer<typeof changePasswordSchema>;

export const actions: Actions = {
	default: async (event) => {
		const { request, locals } = event;
		const { user, session } = await locals.validateUser();
		if (!(user && session)) {
			throw error(401, 'Unauthorized');
		}

		const formData = Object.fromEntries(await request.formData()) as PasswordData;
		const { password } = formData;

		const parseResult = changePasswordSchema.safeParse(formData);
		if (!parseResult.success) {
			const { fieldErrors: errors } = parseResult.error.flatten();
			return {
				errors
			};
		}

		try {
			await auth.updateKeyPassword('email', user.email, password);
		} catch (err) {
			console.error(err);
			return fail(400, { error: 'Invalid credentials', message: 'Could not reset password' });
		}

		const message = {
			type: 'success',
			message: 'Password successfully changed'
		} as const;
		throw redirect(302, '/account', message, event);
	}
};
