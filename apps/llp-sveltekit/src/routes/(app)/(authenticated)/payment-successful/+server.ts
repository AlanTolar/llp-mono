import type { RequestHandler } from './$types';
import { redirect } from 'sveltekit-flash-message/server';

export const GET: RequestHandler = async (event) => {
	throw redirect(302, '/account', {
		type: 'success',
		text: 'Successfully purchased property package'
	}, event);
};
