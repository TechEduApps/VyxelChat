const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware to handle JSON data from Minecraft
app.use(express.json());

// IMPORTANT: This tells Render to serve your index.html from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Store player data in memory
let playerPositions = {};

// 1. API for Minecraft to send data (/api/update)
app.post('/api/update', (req, res) => {
    const { user, x, y, z } = req.body;
    
    if (!user) return res.status(400).send("No username provided");

    // Save the position
    playerPositions[user] = { x, y, z, lastUpdate: Date.now() };
    
    // Broadcast this position to everyone on the website
    io.emit('pos_update', { user, x, y, z });
    
    res.status(200).send("Updated");
});

// 2. Socket.io logic for the Voice Chat website
io.on('connection', (socket) => {
    console.log('New user connected to web interface: ' + socket.id);

    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        // Tell others in the room that a new person is here to start a call
        socket.to(roomId).emit('user-connected', userId);
        console.log(`User ${userId} joined room ${roomId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Use Render's port or default to 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`VyxelChat Server is LIVE on port ${PORT}`);
});

