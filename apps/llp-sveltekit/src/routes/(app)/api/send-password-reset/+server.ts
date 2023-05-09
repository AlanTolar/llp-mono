import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { passwordResetToken } from '$lib/server/token.js';
import { sesClient } from '$lib/server/email/ses.js';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { prisma } from '$lib/server/prisma';

export const GET: RequestHandler = async ({ url, locals }) => {
	const email = url.searchParams.get('email');
	if (!email) throw error(400, 'Missing email');
	const user = await prisma.user.findFirst({
		where: { email }
	});
	if (!user) throw error(400, 'User not found');

	// check for password-reset token rather than email sent because emails could be sent concurrently
	const lastToken = await prisma.key.findFirst({
		where: {
			user_id: user.id,
			id: {
				contains: 'password-reset'
			}
		},
		orderBy: {
			created_at: 'desc'
		}
	});
	if (lastToken) {
		const timeTilNewToken = lastToken.created_at - Date.now() + 1000 * 60;
		if (timeTilNewToken > 0) {
			throw error(
				500,
				`Password reset email can only be sent once a minute. Wait another ${Math.round(
					timeTilNewToken / 1000
				)} seconds and try again`
			);
		}
	}

	// create verification link
	const verificationLink = new URL(`${url.origin}/api/verify-password-reset`);
	const token = await passwordResetToken.issue(user.id);
	verificationLink.searchParams.set('token', token.toString());

	const command = new SendEmailCommand({
		Destination: {
			ToAddresses: [user.email]
		},
		Message: {
			Subject: {
				Charset: 'UTF-8',
				Data: 'Reset your password'
			},
			Body: {
				Text: {
					Charset: 'UTF-8',
					Data: `Reset your account password by clicking on this link: ${verificationLink.href}`
				}
			}
		},
		Source: 'contact@landlistingpro.com'
	});

	try {
		await sesClient.send(command);
		const sentEmail = await prisma.email.create({
			data: {
				accounts: {
					connect: {
						id: user.id
					}
				},
				email_type: 'PASSWORD_RESET',
				email_state: 'SENT'
			}
		});
		console.log('sentEmail: ', sentEmail);
		return json({ status: 200, message: 'OTP email sent', sentEmail });
	} catch (err) {
		throw error(500, { message: 'Error sending OTP email', error: err });
	}
};
