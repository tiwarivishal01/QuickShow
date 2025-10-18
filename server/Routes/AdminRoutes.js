import express from 'express';
import { protectAdmin } from '../middleware/auth.js';
import { getAllBookings, getAllShows, getDashboardData, isAdmin } from '../Controllers/AdminController.js';


const AdminRouter = express.Router();

AdminRouter.get('/is-admin',protectAdmin, isAdmin);
AdminRouter.get('/dashboard',protectAdmin,getDashboardData);
AdminRouter.get('/all-shows',protectAdmin,getAllShows);
AdminRouter.get('/all-bookings',protectAdmin,getAllBookings);


export default AdminRouter;