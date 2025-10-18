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
        const { origin } = req.headers;
        //check if seat is availbe for selected show
        const isAvailble = await checkSeatAvailability(showId, selectedSeats);

        if (!isAvailble) {
            return res.status(400).json({ success: false, message: "Seats are not available" });

        }

        //get the show details

        const showData = await Show.findById(showId).populate('movie');

        //create a new booking
        const booking = await Booking.create({
            user: userId,
            show: showId,
            amount: showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats,
        })

        selectedSeats.map((seat) => {
            showData.occupiedSeat[seat] = userId;
        })
        showData.markModified('occupiedSeat');
        await showData.save();

        //stripe gateway for payment



        res.json({ success: true, booking, message: "Booked successfully" });


    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Error in creating booking" });
    }
}




export const getOccupiedSeats = async (req, res) => {


    try {


        const { showId } = req.params;

        const showData = await Show.findById(showId);

        const occupiedSeats = Object.keys(showData.occupiedSeat);
        res.json({ success: true, occupiedSeats });


    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Error in getting occupied seats" });
    }
}



