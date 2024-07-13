import express, { Request, Response } from "express";
import multer from "multer";
import cloudinary from "cloudinary";

import verifyToken from "../middlewares/auth.middleware";
import { body } from "express-validator";
import { HotelType } from "../shared/types";
import Hotel from "../models/hotel";
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
})

const router = express.Router();


router.post('/', verifyToken, [
    body("name").isEmpty().withMessage("hotel name is required"),
    body("city").isEmpty().withMessage("city name is required"),
    body("country").isEmpty().withMessage("country name is required"),
    body("description").isEmpty().withMessage("description is required"),
    body("type").isEmpty().withMessage("hotel type is required"),
    body("pricePerNight").isEmpty().isNumeric().withMessage("price per night is required and must be a number"),
    body("facilities").isEmpty().isArray().withMessage("facilities are required"),
    body("imageUrls")

], upload.array("imageFiles", 6), async (req: Request, res: Response) => {

    try {
        const imageFiles = req.files as Express.Multer.File[];
        const newHotel: HotelType = req.body;

        // const uploadPromises = imageFiles.map(async (image) => {
        //     const b64 = Buffer.from(image.buffer).toString("base64");
        //     const dataURI = "data:" + image.mimetype + ";base64," + b64;

        //     try {
        //         const res = await cloudinary.v2.uploader.upload(dataURI);
        //         return res.url;
        //     } catch (error) {
        //         console.error("Error uploading image to Cloudinary:", error);
        //         throw error; // Propagate the error to handle it in the catch block of your route handler
        //     }
        // });


        // upload the images on cloudinary 
        const uploadUrls = await uploadImages(imageFiles);
        newHotel.imageUrls = uploadUrls;
        newHotel.lastUpdated = new Date();
        newHotel.userId = req.userId;

        const hotel = new Hotel(newHotel);
        await hotel.save();

        res.status(201).send(hotel);

    } catch (error) {
        console.log("unable to create hotel!", error)
    }
})

router.get('/', verifyToken, async (req: Request, res: Response) => {
    try {
        const hotels = await Hotel.find({ userId: req.userId })
        res.json(hotels);
    } catch (error) {
        res.status(500).json({ message: "Error Fetching Hotels" })
    }
})


router.get('/:id', verifyToken, async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
        const hotel = await Hotel.findOne({ _id: id, userId: req.userId })
        res.json(hotel);
    } catch (error) {
        res.status(500).json({ message: "error fetching hotels " })
    }
})



router.put("/:hotelId", verifyToken, upload.array("imageFiles"), async (req: Request, res: Response) => {


    try {
        const updatedHotel: HotelType = req.body;
        updatedHotel.lastUpdated = new Date();
        const hotel = await Hotel.findByIdAndUpdate({
            _id: req.params.hotelId,
            userId: req.userId
        },
            updatedHotel,
            { new: true })
        if (!hotel) {
            return res.status(404).json({ message: "hotel not found" })
        }
        const files = req.files as Express.Multer.File[];
        const updatedImageUrls = await uploadImages(files)
        hotel.imageUrls = [...updatedImageUrls, ...(updatedHotel.imageUrls || [])]

        await hotel.save()
        res.status(201).json(hotel)
    } catch (error) {
        console.log(error)
        res.status(500).json({ mesage: "something went wrong uploading  image files" })
    }

})


async function uploadImages(imageFiles: Express.Multer.File[]) {
    const uploadPromises = imageFiles.map(async (image) => {
        const b64 = Buffer.from(image.buffer).toString("base64");
        let dataURI = "data:" + image.mimetype + ";base64," + b64;
        const res = await cloudinary.v2.uploader.upload(dataURI);
        return res.url;

    });

    const uploadUrls = await Promise.all(uploadPromises);
    return uploadUrls;
}


export default router;