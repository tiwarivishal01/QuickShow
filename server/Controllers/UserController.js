import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";

//api controller fn to get user booking
export const getUserBookings = async (req, res) => {
    try {
        const auth = req.auth();
        const { userId } = auth;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const user = userId;
        const bookings = await Booking.find({ user }).populate({
            path: "show",
            populate: { path: "movie" }
        }).sort({ createdAt: -1 })
        res.json({ success: true, bookings });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}


//api controller to add favorite movie in clerk meta data
export const updateFavorites = async (req, res) => {
    try {
        const { movieId } = req.body;
        const auth = req.auth();
        const { userId } = auth;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const user = await clerkClient.users.getUser(userId);
        if (!user.privateMetadata.favorites) {
            user.privateMetadata.favorites = [];
        }

        if (!user.privateMetadata.favorites.includes(movieId)) {
            user.privateMetadata.favorites.push(movieId);
        } else {
            user.privateMetadata.favorites = user.privateMetadata.favorites.filter(item => item !== movieId);
        }
        await clerkClient.users.updateUserMetadata(userId, { privateMetadata: user.privateMetadata });
        res.json({ success: true, message: "favorite added updated." });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

//get favorite
export const getFavorites = async (req, res) => {
    try {
        const auth = req.auth();
        const { userId } = auth;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const user = await clerkClient.users.getUser(userId);
        const favorites = user.privateMetadata.favorites;

        //get movie from db
        const movies = await Movie.find({_id:{$in: favorites}});

        res.json({success:true, movies});
    } catch(error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
