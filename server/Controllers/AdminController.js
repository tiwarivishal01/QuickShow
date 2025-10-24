import Booking from "../models/Booking.js";
import Show from "../models/show.js";
import User from "../models/user.js";
import { clerkClient } from "@clerk/express";

//api to check is user is admin
export const checkAdminStatus = async (req, res) => {
    try {
        const auth = req.auth();
        const { userId } = auth;
        
        if (!userId) {
            return res.json({ success: true, isAdmin: false });
        }

        const user = await clerkClient.users.getUser(userId);
        const isAdmin = user.privateMetadata?.role === 'admin';
        
        res.json({ success: true, isAdmin });
    } catch (error) {
        console.error('Error checking admin status:', error);
        res.json({ success: true, isAdmin: false });
    }
}

// api to get dashboard data
export const getDashboardData = async (req, res) => {
  try {
    const bookings = await Booking.find({ isPaid: true });
    const activeShows = await Show.find({ showDatetime: { $gte: new Date() } }).populate('movie');
   

    const totalUser = await User.countDocuments();

    const dashboardData = {
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((acc, booking) => acc + booking.amount, 0),
      activeShows,
      totalUser,
    }

    res.json({ success: true, dashboardData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}

//api to get all shows
export const getAllShows = async (req, res) => {
    try {
        const shows = await Show.find({ showDatetime: { $gte: new Date() } }).populate('movie').sort({ showDatetime: 1 });
        const validShows = shows.filter(show => show.movie !== null);
        res.json({ success: true, shows: validShows });
    } catch (error) {
        res.json({ success: false, message: error.message });
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
        res.json({ success: true, bookings });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}
