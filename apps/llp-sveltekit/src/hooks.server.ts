import { handleHooks } from '@lucia-auth/sveltekit';
import { auth } from '$lib/server/lucia';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { PRIVATE_SUPERUSER_KEY } from '$env/static/private';

export const customHandle: Handle = async ({ resolve, event }) => {
	const superuserKey = event.url.searchParams.get('superuser-key');
	event.locals.superuser = superuserKey === PRIVATE_SUPERUSER_KEY;

	event.locals.demoProperty = event.params.id === 'demo';

	return resolve(event);
};

export const handle: Handle = sequence(handleHooks(auth), customHandle);
