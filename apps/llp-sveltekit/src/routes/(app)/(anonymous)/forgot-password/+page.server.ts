import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { z } from 'zod';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.validate();
	if (session) {
		throw redirect(302, '/account');
	}
};

const emailSchema = z.object({
	email: z
		.string({ required_error: 'Email is required' })
		.min(1, { message: 'Email is required' })
		.max(64, { message: 'Email must be less than 64 characters' })
		.email({ message: 'Email must be a valid email address' })
});
type EmailData = z.infer<typeof emailSchema>;

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const formData = Object.fromEntries(await request.formData()) as EmailData;
		const { email } = formData;
		try {
			emailSchema.parse(formData);
		} catch (err) {
			const { fieldErrors: errors } = err.flatten();
			return {
				data: { email },
				errors
			};
		}

		try {
			const response = await fetch(`/api/send-password-reset?email=${email}`);
			const data = await response.json();
			console.log('data: ', data);
			return {
				success: true,
				message: `Password reset email sent to ${formData.email}`
			};
		} catch (err) {
			console.log('err: ', err);
			return {
				success: false,
				message: 'Server error'
			};
		}
	}
};
