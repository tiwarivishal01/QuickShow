import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectdb from './config/db.js';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import showRouter from './Routes/showRoutes.js';
import bookingRouter from './Routes/BookingRoutes.js';
import AdminRouter from './Routes/AdminRoutes.js';
import userRouter from './Routes/UserRoutes.js';
import { stripeWebhooks } from './Controllers/stripeWebHooks.js'


const app = express()
const port = 3000;
await connectdb();

// webhook endpoint
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhooks)


//middleware
app.use(express.json())
app.use(cors())
app.use(clerkMiddleware())

//api routes
app.get('/',(req, res)=>res.send('server is live!'))
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use('/api/show', showRouter)
app.use('/api/booking', bookingRouter)
app.use('/api/admin', AdminRouter)
app.use('/api/user', userRouter)


app.listen(port,()=>{
    console.log(`Server is live at http://localhost:${port}`);
    
})