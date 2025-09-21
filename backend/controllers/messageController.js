import User from "../models/User.js"
import Message from "../models/Message.js"
import cloudinary from "../config/cloudinary.js"
import {io , userSocketMap} from "../server.js"

export const getUsersForSidebar = async (req,res) => {
    try{
        const userId = req.user._id;
        const filteredUsers = await User.find({_id : {$ne: userId}}).select("-password");

        const unseenMessages = {}
        const promises = filteredUsers.map(async (user) => {
            const message = await Message.find({senderId: user._id, receiverId: userId, seen: false})
            if(message.length > 0) {
                unseenMessages[user._id] = message.length
            }
        })
        await Promise.all(promises);
        res.json({success: true, users: filteredUsers, unseenMessages});
    }catch(err) {
        console.log(err.message);
        res.json({success: false, message: err.message});
    }
}


export const getMessages = async (req,res) => {
    try{
        const {id: selectedUserId} = req.params;
        const myId = req.user._id;
        const messages = await Message.find({
            $or: [
                {senderId: myId, receiverId: selectedUserId},
                {senderId: selectedUserId, receiverId: myId},
            ]
        })

        await Message.updateMany({senderId: selectedUserId, receiverId: myId}, {seen: true});

        res.json({success: true, messages});
    }catch(err) {
        console.log(err.message);
        res.json({success: false, message: err.message});
    }
}


export const markMessageAsSeen = async (req,res) => {
    try{
        const {id} = req.params;
        await Message.findOneAndUpdate(id, {seen: true});
        res.json({success: true});
    }catch(err) {
        console.log(err.message);
        res.json({success: false, message: err.message});
    }
}


export const sendMessage = async(req,res) => {
    try{
        const {text,image} = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;
        let imageUrl;
        if(image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl
        })

        // Emit the new message to the receiver's socket
        const receiverSocketId = userSocketMap[receiverId];
        if(receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage",newMessage);
        }

        res.json({success: true, newMessage});

    }catch(err) {
        console.log(err.message);
        res.json({success: false, message: err.message});
    }
}