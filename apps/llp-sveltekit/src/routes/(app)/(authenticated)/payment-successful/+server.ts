import type { RequestHandler } from './$types';
import { redirect } from 'sveltekit-flash-message/server';

export const GET: RequestHandler = async (event) => {
	const message = {
		type: 'success',
		message: 'Successfully purchased property package'
	} as const;
	throw redirect(302, '/account', message, event);
};
