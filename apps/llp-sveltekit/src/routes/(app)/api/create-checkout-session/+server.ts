import type { RequestHandler } from './$types';
import { PUBLIC_3D_MODEL_PRICE_ID, PUBLIC_VIDEO_PRICE_ID } from '$env/static/public';
import { PRIVATE_STRIPE_SK } from '$env/static/private';
import { error, redirect } from '@sveltejs/kit';
import Stripe from 'stripe';
import { prisma } from '$lib/server/prisma';

const stripe = new Stripe(PRIVATE_STRIPE_SK, {
	apiVersion: '2022-11-15'
});

export const GET: RequestHandler = async ({ url, locals }) => {
	const { user, session } = await locals.validateUser();
	if (!(user && session)) {
		throw error(401, 'Unauthorized');
	}

	const propertyId = url.searchParams.get('propertyId');
	console.log('propertyId: ', propertyId);
	if (!propertyId) {
		throw error(400, 'Missing propertyId');
	}

	const paramKeys = [...url.searchParams.keys()];
	const line_items = paramKeys
		.filter((key) => [PUBLIC_3D_MODEL_PRICE_ID, PUBLIC_VIDEO_PRICE_ID].includes(key))
		.map((key) => {
			return {
				price: key,
				quantity: 1
			};
		});
	if (!line_items.length) {
		throw error(400, 'No line items');
	}

	// get stripe customer id if it exists so fields are pre-filled
	const account = await prisma.account.findUnique({
		where: {
			id: user.userId
		}
	});
	const customerId = account?.stripe_customer_id ?? undefined;
	const customerFields = customerId
		? {
				customer: customerId
		  }
		: {
				customer_email: user.email,
				customer_creation: 'always' as Stripe.Checkout.SessionCreateParams.CustomerCreation
		  };

	// https://stripe.com/docs/api/checkout/sessions/create
	const stripeSession = await stripe.checkout.sessions.create({
		line_items,
		mode: 'payment',
		success_url: `${url.origin}/payment-successful`,
		cancel_url: `${url.origin}/payment-cancelled`,
		automatic_tax: { enabled: true },
		metadata: {
			property_id: propertyId,
			user_id: user.userId,
			site_origin: url.origin
		},
		payment_method_types: ['card'],
		allow_promotion_codes: false,
		...customerFields
	});

	if (!stripeSession || !stripeSession.url) {
		throw error(500, 'Error creating checkout session');
	}

	console.log('stripeSession.url: ', stripeSession.url);
	throw redirect(303, stripeSession.url);
};
