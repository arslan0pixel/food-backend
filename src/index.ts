import express, { Request, Response } from "express";
import 'dotenv/config';
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/auth";
import myHotelRoutes from "./routes/my.hotels";
import hotels  from "./routes/hotels"
import myBookingsRoutes from "./routes/my-bookings"


import {v2 as cloudinary} from "cloudinary";
import path from "path";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ,
    api_key: process.env.CLOUDINARY_API_KEY ,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const dbConnection = () => {
    mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string, { dbName: "hotel" }).then(() => {
        console.log("Connection established",)
    }).catch(() => {
        console.log("could not connect to MongoDB")
    })
}
dbConnection();


const app = express();
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials:true,
    
}));

// app.use(express.static(path.join(__dirname, "../../frontend/dist")))

app.get('/api/test', async (req: Request, res: Response) => {
    res.json({ message: "hello im arslan from express" });
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/my-hotels', myHotelRoutes)
app.use('/api/hotels', hotels)
app.use('/api/my-bookings', myBookingsRoutes)

// app.get("*", (req: Request, res: Response) => {
//     res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
//   });

const port = 7000
app.listen(port, () => {
    console.log(`server is listening at port -${port}`)
})


