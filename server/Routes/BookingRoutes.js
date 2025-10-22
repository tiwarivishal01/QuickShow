import express from "express";
import { createBooking, getOccupiedSeats } from "../Controllers/BookingController.js";

const bookingRouter = express.Router();

bookingRouter.post('/create-booking', createBooking);

bookingRouter.get('/seats/:showId', getOccupiedSeats);


export default bookingRouter;