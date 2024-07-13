import express, { Request, Response } from "express";
import { check, validationResult } from "express-validator";
import User from "../models/user";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";
import verifyToken from "../middlewares/auth.middleware";


const router = express.Router();

router.post('/login', [
    check("email", " email is required").isEmail(),
    check("password", "password length must be at least 6 characters").isLength({ min: 6, })
], async (req: Request, res: Response) => {
    const errors = validationResult(req); //TTT
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array() })
    }

    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            res.status(400).json({ message: "invalid credentials" })
        }

        if (user) {
            const isMatch = await bcrypt.compare(password, user.password );
            if (!isMatch) {
                res.status(400).json({ message: "invalid credentials" })
            }
    
        }
    
        const token =  jwt.sign({ userId: user?.id },///TTT
            process.env.JWT_SECRET_KEY as string,
            { expiresIn: "1d" })

        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 86400000
        })
        res.status(200).json({ userId: user?._id })
    }

    catch (error) {

    }
})

router.get('/validate-token', verifyToken,  (req:Request, res: Response)=>{
    res.status(200).send({userId: req.userId})
})

router.post("/logout", (req:Request, res:Response)=>{
    res.cookie("auth_token", "", {
        expires: new Date(0)
    })
  res.send()
})


export default router;
