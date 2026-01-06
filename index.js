// index.js (The Brain)
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static('public'));

let playerPositions = {};

// 1. Minecraft sends positions here
app.post('/api/update', (req, res) => {
    const { user, x, y, z } = req.body;
    playerPositions[user] = { x, y, z };
    
    // Tell everyone on the website where this player is
    io.emit('pos_update', { user, x, y, z });
    res.sendStatus(200);
});

// 2. The Website Connection
io.on('connection', (socket) => {
    console.log('A user connected to Voice Chat');
    
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.broadcast.to(roomId).emit('user-connected', userId);
    });
});

server.listen(3000, () => {
    console.log('VyxelChat is running!');
});

