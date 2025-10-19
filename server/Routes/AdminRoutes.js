import express from 'express';
import { protectAdmin } from '../middleware/auth.js';
import { getAllBookings, getAllShows, getDashboardData, checkAdminStatus } from '../Controllers/AdminController.js';

const AdminRouter = express.Router();

// Route to check admin status without requiring admin privileges
AdminRouter.get('/is-admin', checkAdminStatus);
// Protected admin routes
AdminRouter.get('/dashboard', protectAdmin, getDashboardData);
AdminRouter.get('/all-shows', protectAdmin, getAllShows);
AdminRouter.get('/all-bookings', protectAdmin, getAllBookings);

export default AdminRouter;