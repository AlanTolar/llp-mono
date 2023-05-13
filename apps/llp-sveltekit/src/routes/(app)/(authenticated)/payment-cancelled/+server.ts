import type { RequestHandler } from './$types';
import { redirect } from 'sveltekit-flash-message/server';

export const GET: RequestHandler = async (event) => {
	throw redirect(302, '/account', {
		type: 'danger',
		text: 'Exited checkout process'
	}, event);
};
