import type { RequestHandler } from './$types';
import { PRIVATE_STRIPE_WEBHOOK_SECRET, PRIVATE_STRIPE_SK } from '$env/static/private';
import { PUBLIC_3D_MODEL_PRICE_ID, PUBLIC_VIDEO_PRICE_ID } from '$env/static/public';
import Stripe from 'stripe';
import { error, json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

const stripe = new Stripe(PRIVATE_STRIPE_SK, {
	apiVersion: '2022-11-15'
});

export const POST: RequestHandler = async ({ request, url }) => {
	const payload = await request.text();
	if (!payload) {
		throw error(400, 'No payload');
	}
	const sig = request.headers.get('stripe-signature');
	if (!sig) {
		throw error(400, 'No signature');
	}

	let stripeEvent: Stripe.Event;
	try {
		stripeEvent = stripe.webhooks.constructEvent(payload, sig, PRIVATE_STRIPE_WEBHOOK_SECRET);
	} catch (err) {
		throw error(400, 'Webhook Error: ' + err.message);
	}

	console.log('stripeEvent.type: ', stripeEvent.type);
	switch (stripeEvent.type) {
		case 'checkout.session.completed': {
			// https://stripe.com/docs/api/checkout/sessions/object
			const checkoutSessionNoLineItems = stripeEvent.data.object as Stripe.Checkout.Session;
			const creationOrigin = checkoutSessionNoLineItems.metadata?.site_origin;
			if (creationOrigin !== url.origin) {
				return json(
					{
						message: `Ignoring checkout.session.completed event. Was created at ${creationOrigin} but this is ${url.origin}`
					},
					{ status: 200 }
				);
			}

			const checkoutSession = await stripe.checkout.sessions.retrieve(
				checkoutSessionNoLineItems.id,
				{
					expand: ['line_items']
				}
			);
			const priceIds = checkoutSession.line_items?.data.map((item) => item.price?.id);
			const propertyUpdates = { land_model: {}, animation: {} };
			if (priceIds?.includes(PUBLIC_3D_MODEL_PRICE_ID)) {
				propertyUpdates.land_model = {
					update: {
						user_access: true
					}
				};
			}
			if (priceIds?.includes(PUBLIC_VIDEO_PRICE_ID)) {
				propertyUpdates.animation = {
					update: {
						user_access: true
					}
				};
			}

			// update customer stripe id if live payment
			const stripeCustomerUpdate = checkoutSession.livemode
				? { stripe_customer_id: checkoutSession.customer?.toString() ?? '' }
				: {};

			try {
				await prisma.$transaction([
					// create purchase entry in database
					prisma.purchase.create({
						data: {
							stripe_payment_intent: checkoutSession.payment_intent?.toString() ?? '',
							paid: checkoutSession.payment_status === 'paid',
							live_payment: checkoutSession.livemode,
							checkout_session_object: JSON.stringify(checkoutSession),
							account: {
								connect: {
									id: checkoutSession.metadata?.user_id
								}
							},
							property: {
								connect: {
									id: checkoutSession.metadata?.property_id
								}
							}
						}
					}),

					//give user access to purchased items and update customer_id
					prisma.account.update({
						where: {
							id: checkoutSession.metadata?.user_id
						},
						data: {
							...stripeCustomerUpdate,
							properties: {
								update: {
									where: {
										id: checkoutSession.metadata?.property_id
									},
									data: propertyUpdates
								}
							}
						}
					})
				]);

				return json(
					{
						message: 'Checkout session completed. Purchase entry created and user_access granted.'
					},
					{ status: 200 }
				);
			} catch (err) {
				throw error(500, { message: 'Error creating purchase entry', error: err });
			}
		}
		case 'payment_intent.succeeded': {
			// https://stripe.com/docs/api/payment_intents/object
			const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;

			try {
				const updatePurchase = await prisma.purchase.updateMany({
					where: {
						stripe_payment_intent: paymentIntent.id
					},
					data: {
						paid: true
					}
				});
				return json(
					{
						message: `Payment intent update attempted. Result from prisma: ${JSON.stringify(
							updatePurchase
						)}`
					},
					{ status: 200 }
				);
			} catch (err) {
				throw error(500, { message: 'Error updating purchase entry', error: err });
			}
		}
	}

	return json({ message: 'Webhook received but no action taken' }, { status: 200 });
};
