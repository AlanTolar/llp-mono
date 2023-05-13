import type { RequestHandler } from './$types';
import { emailVerificationToken } from '$lib/server/token.js';
import { auth } from '$lib/server/lucia.js';
import { LuciaTokenError } from '@lucia-auth/tokens';
import { error } from '@sveltejs/kit';
import { redirect } from 'sveltekit-flash-message/server';

export const GET: RequestHandler = async (event) => {
	const { url, locals } = event;
	const tokenParams = url.searchParams.get('token');
	if (!tokenParams) throw error(400, 'Missing token');

	try {
		const token = await emailVerificationToken.validate(tokenParams);
		await auth.updateUserAttributes(token.userId, {
			email_verified: true
		});
		await auth.invalidateAllUserSessions(token.userId);
		const session = await auth.createSession(token.userId);
		locals.setSession(session);
	} catch (e) {
		if (e instanceof LuciaTokenError && e.message === 'EXPIRED_TOKEN') {
			// expired token/link
			// generate new token and send new link
		}
		if (e instanceof LuciaTokenError && e.message === 'INVALID_TOKEN') {
			// invalid link
		}
		throw error(400, 'Invalid token');
	}

	throw redirect(302, '/account', {
		type: 'success',
		text: 'Successfully verified email address! Select a property to get started.'
	}, event);
};
