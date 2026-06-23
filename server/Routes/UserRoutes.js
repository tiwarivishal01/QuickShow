import express from 'express'
import { getFavorites, getUserBookings, updateFavorites } from '../Controllers/UserController.js';


const userRouter = express.Router();

userRouter.get("/bookings", getUserBookings)
userRouter.post("/update-favorite",updateFavorites)
userRouter.get("/favorite",getFavorites)



export default userRouter;