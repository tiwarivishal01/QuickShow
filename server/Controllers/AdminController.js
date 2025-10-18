import Booking from "../models/Booking.js";
import Show from "../models/show.js";
import User from "../models/user.js";



//api to check is user is admin



export const isAdmin = async (req, res) => {

    res.json({ success: true, isAdmin: true });
}


// api to get dashboard datad

export const getDashboardData = async (req, res) => {
    try {
        const bookings = await Booking.find({ isPaid: true });
        const activeShows = await Show.find({ showDatetime: { $gte: new Date() } }).populate('movie');
        const totalUser = await User.countDocuments();
        const dashboardData = {
            totalBookings: bookings.length,
            totalRevenue: bookings.reduce((acc, booking) => acc + booking.amount, 0),
            activeShows: activeShows.length,
            totalUser: totalUser,
        }

        res.json({ success: true, dashboardData })


    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })


    }
}


//api to get all shows

export const getAllShows = async (req, res) => {
    try {
        const shows = await Show.find({ showDatetime: { $gte: new Date() } }).populate('movie').sort({ showDatetime: 1 });
        res.json({ success: true, shows })


    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })


    }
}

//api to get all bookings
export const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({}).populate('user').populate({
            path: 'show',
            populate: {
                path: 'movie',
            }
        }).sort({ createdAt: -1 });
        res.json({ success: true, bookings })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })


    }
}
