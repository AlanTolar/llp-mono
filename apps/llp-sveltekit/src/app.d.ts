import type { PrismaClient, UserRole } from '@prisma/client';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			validate: import('@lucia-auth/sveltekit').Validate;
			validateUser: import('@lucia-auth/sveltekit').ValidateUser;
			setSession: import('@lucia-auth/sveltekit').SetSession;
			superuser: boolean;
			demoProperty: boolean;
		}
		interface PageData {
			flash?: { type: 'success' | 'danger'; message: string };
		}
		// interface Platform {}
	}
	// eslint-disable-next-line no-var
	var __prisma: PrismaClient;

	/// <reference types="lucia-auth" />
	declare namespace Lucia {
		type Auth = import('$lib/server/lucia').Auth;
		type UserAttributes = {
			email: string;
			email_verified: boolean;
			role: UserRole;
		};
	}
}

export {};
