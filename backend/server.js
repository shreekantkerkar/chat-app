import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
// import { connectDB } from "./config/database";
import { connectDB } from "./config/database.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";

const app = express();
const server = http.createServer(app)

app.use(express.json({limit: "4mb"}));
app.use(cors());

app.use("/api/status",(req,res) => res.send("server is live"));
app.use("/api/auth",userRouter);
app.use("/api/messages",messageRouter);

await connectDB();

const PORT = process.env.PORT || 9000;
server.listen(PORT, () => console.log("server is running on port: " + PORT));