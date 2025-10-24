import { inngest } from '../inngest/index.js';
import Stripe from 'stripe';
import Booking from '../models/Booking.js';

export const stripeWebhooks = async (req, res) => {
  console.log('Stripe webhook received');
  
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Stripe secret key not configured');
    return res.status(500).json({ error: 'Payment service not configured' });
  }
  
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
            })
            //send confirmation email
            console.log(`[WEBHOOK] Sending Inngest event for bookingId: ${bookingId}`);
            await inngest.send({
              name: 'app/show.booked',
              data: {
                bookingId: bookingId,
              },
            });
            console.log(`[WEBHOOK] Inngest event sent successfully for bookingId: ${bookingId}`);
  



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