import express from 'express';
import { createBooking, getOccupiedSeats, confirmStripeSession, refreshPaymentLink } from '../Controllers/BookingController.js';

const bookingRouter = express.Router();

bookingRouter.post('/create-booking', createBooking);
bookingRouter.get('/seats/:showId', getOccupiedSeats);
bookingRouter.post('/confirm-session', confirmStripeSession);
bookingRouter.post('/refresh-payment', refreshPaymentLink);

export default bookingRouter;