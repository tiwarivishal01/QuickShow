import Booking from "../models/Booking.js";
import Show from "../models/show.js";

//fn to check availability of seats
export const checkSeatAvailability = async (showId, SelectedSeats) => {
    try {
        const showData = await Show.findById(showId);
        if (!showData) {
            return { success: false, message: "Show not found" };
        }
        const occupiedSeats = showData.occupiedSeat;
        const isAnySeatTaken = SelectedSeats.some(Seat => occupiedSeats[Seat]);

        return !isAnySeatTaken;


    } catch (error) {
        console.log(error);
        return { success: false, message: "Error in checking seat availability" };
    }
}



//

export const createBooking = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { showId, selectedSeats } = req.body;

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

        res.json({ success: true, booking, message: "Booked successfully" });

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



