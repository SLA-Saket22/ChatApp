import express from 'express';
import cors from 'cors';
import http from 'http';
import "dotenv/config";
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRouter.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from 'socket.io'; 

const app = express();
const server = http.createServer(app);

//initialise socket.io server
export const io = new Server(server, {
    cors: {origin: "*"}
});

// Store online users
export const userSocketMap = {};//{userId: socketId}

//Socket.io connection handler
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log(`User connected: ${userId}`);

    if(userId){
        userSocketMap[userId] = socket.id;
    }

    // Emit online users to all connect clients
    io.emit("getOnlineUser",Object.keys(userSocketMap));

    socket.on("disconnect", ()=>{
        console.log("User Disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers",Object.keys(userSocketMap))
    })
});

//Middlewares
app.use(express.json({ limit: "4mb" }));
app.use(cors());

//Routes setuup
app.use("/api/status", (req, res) => {
    res.send("Hello World!");
});
app.use("/api/auth", userRouter);
app.use("/api/message", messageRouter);

//connect to the database
await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});