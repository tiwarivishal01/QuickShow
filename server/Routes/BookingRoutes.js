import express from "express";
import { createBooking } from "../Controllers/BookingController.js";

const bookingRouter = express.Router();

bookingRouter.post('/create', createBooking);

bookingRouter.get('/seats/:showId', getOccupiedSeats);


export default bookingRouter;