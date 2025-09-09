import { generateToken } from "../config/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs"
import cloudinary from "../config/cloudinary.js";

export const signup = async(req,res) => {
    const {fullName, email, password, bio} = req.body;
    try{
        if(!fullName || !email || !password || !bio) {
            return res.json({success: false, message: "Missing Details"})
        }

        const user = await User.findOne({email});
        if(user) {
            return res.json({success: false, message: "user already exists"})
        }

        const salt = await bcrypt.genSalt(10);
        const hasedPass = await bcrypt.hash(password, salt);

        const newUser = await User.create({fullName, email, password:hasedPass, bio});

        const token = generateToken(newUser._id)

        res.json({success: true, userData: newUser, token, message: "Account created successfully"})
    }catch(err) {
        console.log(err)
        res.json({success: false, messgae : err.message})
    }
}


export const signin = async(req,res) => {
    try{
        const {email, password} = req.body;
        const userData = await User.findOne({email});

        const isPassCorrect = await bcrypt.compare(password, userData.password)

        if(!isPassCorrect){
            res.json({success: false, message: "Invalid Credentials"})
        }

        const token = generateToken(userData._id)

        res.json({success: true, userData, token, message: "Login successfully"})
    }catch(err) {
        console.log(err)
        res.json({success: false, messgae : err.message})
    }
}


export const checkAuth = (req,res) => {
    res.json({success: true, user: req.user});
}


export const updateProfile =  async(req,res) => {
    try{
        const {profilePic, bio, fullName} = req.body;
        
        const userId = req.user._id;
        let updateUser;

        if(!profilePic) {
            updateUser = await User.findByIdAndUpdate(userId,{bio,fullName},{new:true});
        }else {
            const upload = await cloudinary.uploader.upload(profilePic)
            updateUser = await User.findByIdAndUpdate(userId, {profilePic:upload.secure_url,bio,fullName},
            {new:true});

            res.json({success:true, user:updateUser})
        }

    }catch(err) {
        console.log(err.message);
        res.json({success:false, message: err.message})
    }
}