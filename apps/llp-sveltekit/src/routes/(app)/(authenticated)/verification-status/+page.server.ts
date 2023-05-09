import type { PageServerLoad } from './$types';
import { error, json, redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const load = (async ({ locals, request, fetch }) => {
	const { user, session } = await locals.validateUser();
	if (!(user && session)) {
		throw error(401, 'Unauthorized');
	}
	if (user.emailVerified) {
		throw redirect(302, '/account');
	}

	const justRegistered = request.headers.get('referer')?.includes('/register') || false;
	console.log('justRegistered: ', justRegistered);

	const lastSentVerificationEmail = await prisma.email.findFirst({
		where: {
			accounts: {
				some: {
					id: user.userId
				}
			},
			email_type: 'EMAIL_VERIFICATION'
		},
		orderBy: {
			date_sent: 'desc'
		}
	});

	const sendVerificationEmail = async () => {
		const response = await fetch('/api/send-email-verification');
		return await response.json();
	};

	return {
		sentEmail: lastSentVerificationEmail,
		streamed: {
			otpApiResponse: justRegistered ? sendVerificationEmail() : null
		}
	};
}) satisfies PageServerLoad;
