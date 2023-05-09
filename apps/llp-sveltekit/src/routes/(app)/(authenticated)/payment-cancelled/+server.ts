import type { RequestHandler } from './$types';
import { redirect } from 'sveltekit-flash-message/server';

export const GET: RequestHandler = async (event) => {
	const message = {
		type: 'danger',
		message: 'Exited checkout process'
	} as const;
	throw redirect(302, '/account', message, event);
};
