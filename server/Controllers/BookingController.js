import Booking from "../models/Booking.js";
import Show from "../models/show.js";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//fn to check availability of seats
export const checkSeatAvailability = async (showId, SelectedSeats) => {
    try {
        const showData = await Show.findById(showId);
        if (!showData) {
            return false;
        }
        const occupiedSeats = showData.occupiedSeat || {};
        const isAnySeatTaken = SelectedSeats.some(Seat => occupiedSeats[Seat]);

        return !isAnySeatTaken;

    } catch (error) {
        console.log(error);
        return false;
    }
}



//

export const createBooking = async (req, res) => {
    try {
        // Get user ID from Clerk auth
        const { userId } = req.auth || {};
        const { showId, selectedSeats } = req.body;
        const { origin } = req.headers;

        console.log('Auth object:', req.auth);
        console.log('User ID:', userId);
        console.log('Request body:', req.body);

        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        if (!showId || !selectedSeats || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
            return res.status(400).json({ success: false, message: "Show ID and selected seats are required" });
        }

        //check if seat is available for selected show
        const isAvailable = await checkSeatAvailability(showId, selectedSeats);

        if (!isAvailable) {
            return res.status(400).json({ success: false, message: "Seats are not available" });
        }

        //get the show details
        const showData = await Show.findById(showId).populate('movie');

        if (!showData) {
            return res.status(404).json({ success: false, message: "Show not found" });
        }

        //create a new booking
        const booking = await Booking.create({
            user: userId,
            show: showId,
            amount: showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats,
        })

        // Mark seats as occupied
        selectedSeats.forEach((seat) => {
            showData.occupiedSeat[seat] = userId;
        })
        showData.markModified('occupiedSeat');
        await showData.save();

        // Create Stripe checkout session
        try {
            if (!process.env.STRIPE_SECRET_KEY) {
                res.json({ success: true, booking, message: "Booking created but Stripe not configured" });
                return;
            }
            
            const line_items = [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: showData.movie.title,
                    },
                    unit_amount: Math.floor(booking.amount) * 100,
                },
                quantity: 1
            }];

            const session = await stripe.checkout.sessions.create({
                success_url: `${origin}/loading/my-bookings?success=true`,
                cancel_url: `${origin}/my-bookings?canceled=true`,
                line_items: line_items,
                mode: 'payment',
                metadata: {
                    bookingId: booking._id.toString(),
                },
                expires_at: Math.floor(Date.now() / 1000) + 1800, // expires in 30 minutes
            });

            booking.paymentLink = session.url;
            await booking.save();

            res.json({ success: true, booking, url: session.url });
        } catch (stripeError) {
            // If Stripe fails, still return success but without payment URL
            res.json({ success: true, booking, message: "Booking created but payment setup failed" });
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Error in creating booking" });
    }
}




export const getOccupiedSeats = async (req, res) => {
    try {
        const { showId } = req.params;

        if (!showId) {
            return res.status(400).json({ success: false, message: "Show ID is required" });
        }

        const showData = await Show.findById(showId);

        if (!showData) {
            return res.status(404).json({ success: false, message: "Show not found" });
        }

        const occupiedSeats = Object.keys(showData.occupiedSeat || {});
        res.json({ success: true, occupiedSeats });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Error in getting occupied seats" });
    }
}



