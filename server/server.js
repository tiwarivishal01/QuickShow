import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectdb from './config/db.js';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import showRouter from './Routes/showRoutes.js';


const app = express()
const port = 3000;
await connectdb();


//middleware
app.use(express.json())
app.use(cors())
app.use(clerkMiddleware())

//api routes
app.get('/',(req, res)=>res.send('server is live!'))
app.use('/api/show', showRouter)
app.use("/api/inngest", serve({ client: inngest, functions }));


app.listen(port,()=>{
    console.log(`Server is live at http://localhost:${port}`);
    
})