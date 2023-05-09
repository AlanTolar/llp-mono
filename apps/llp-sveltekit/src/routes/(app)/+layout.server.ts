import type { LayoutServerLoad } from './$types';
import { loadFlashMessage } from 'sveltekit-flash-message/server';

export const load = loadFlashMessage(async ({ locals }) => {
	const { user, session } = await locals.validateUser();
	return { user };
}) satisfies LayoutServerLoad;
