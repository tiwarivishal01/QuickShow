import { inngest } from '../inngest/index.js';
import Stripe from 'stripe';
import Booking from '../models/Booking.js';

export const stripeWebhooks = async (req, res) => {
  console.log('Stripe webhook received');
  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('Webhook signature verified');
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    console.log('Event type:', event.type);
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const bookingId = session?.metadata?.bookingId;
        console.log('Booking ID from metadata:', bookingId);
        if (bookingId) {
          await Booking.findByIdAndUpdate(bookingId, {
            isPaid: true,
            paymentLink: '',
          }
          )
          //send comnfirmation mail
          console.log('Sending app/show.booked event for booking ID:', bookingId);
          await inngest.send({
            name: 'app/show.booked',
            data: {
              bookingId
            }
          })

          console.log(`Booking ${bookingId} marked as paid via checkout.session.completed.`);
        } else {
          console.warn('No bookingId in session metadata');
        }
        break;
      }
      case 'payment_intent.succeeded': {
        // Fallback in case you rely on payment_intent events
        const paymentIntent = event.data.object;
        try {
          const sessionList = await stripeInstance.checkout.sessions.list({
            payment_intent: paymentIntent.id,
          });
          const session = sessionList.data[0];
          const bookingId = session?.metadata?.bookingId;
          if (bookingId) {
            await Booking.findByIdAndUpdate(bookingId, {
              isPaid: true,
              paymentLink: '',
            });
            console.log(`✅ Booking ${bookingId} marked as paid via payment_intent.succeeded.`);
          }
        } catch (e) {
          console.error('Error resolving session from payment_intent:', e);
        }
        break;
      }
      default:
        console.log('Unhandled event type:', event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Internal server error.');
  }
};