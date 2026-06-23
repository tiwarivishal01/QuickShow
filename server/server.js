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
const port = process.env.PORT || 3000;
await connectdb();

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhooks)


//middleware
app.use(express.json())

// CORS: allow specific origins and credentials for dev/prod
const allowedOrigins = [
  'http://localhost:5173',
  'https://quick-show-flax.vercel.app',
  'https://quickshow-alpha-one.vercel.app',
  'https://quick-show-zpwi.vercel.app',
  'https://quickshow-production-b1c8.up.railway.app'
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
};
app.use(cors(corsOptions))
// removed invalid wildcard preflight route causing path-to-regexp error
// app.options('*', cors(corsOptions))

app.use(clerkMiddleware())

//api routes
app.get('/',(req, res)=>res.send('server is live!'))
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use('/api/show', showRouter)
app.use('/api/booking', bookingRouter)
app.use('/api/admin', AdminRouter)
app.use('/api/user', userRouter)



if (process.env.VERCEL !== '1') {
    app.listen(port, () => {
        console.log(`Server is live at http://localhost:${port}`);
    });
}

export default app;