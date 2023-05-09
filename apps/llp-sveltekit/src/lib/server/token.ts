import { auth } from './lucia.js';
import { idToken, LuciaTokenError } from '@lucia-auth/tokens';

export const emailVerificationToken = idToken(auth, 'email-verification', {
	timeout: 60 * 60 // 1 hour
});

export const passwordResetToken = idToken(auth, 'password-reset', {
	timeout: 60 * 60 // 1 hour
});
