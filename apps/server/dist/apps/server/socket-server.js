"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const url_1 = require("url");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// In-memory store for rooms
const rooms = new Map();
// Create HTTP server
const httpServer = (0, http_1.createServer)((req, res) => {
    const parsedUrl = (0, url_1.parse)(req.url || "", true);
    if (parsedUrl.pathname === "/health") {
        res.writeHead(200);
        res.end("Healthy");
        return;
    }
    // 방 생성 엔드포인트
    if (parsedUrl.pathname === "/rooms" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        });
        req.on("end", () => {
            try {
                const roomData = JSON.parse(body);
                const { roomId, roomName, description, isPasswordProtected, password, createdBy, playlist } = roomData;
                // 새로운 방 생성
                rooms.set(roomId, {
                    roomId,
                    roomName,
                    hostId: (createdBy === null || createdBy === void 0 ? void 0 : createdBy.id) || "",
                    users: [],
                    currentVideo: (playlist === null || playlist === void 0 ? void 0 : playlist.length) > 0 ? {
                        id: playlist[0].id,
                        videoId: playlist[0].videoId,
                        title: playlist[0].title,
                        thumbnailUrl: playlist[0].thumbnailUrl
                    } : null,
                    playlist: playlist || [], // 플레이리스트 전체를 그대로 사용
                    isPlaying: false,
                    currentTime: 0,
                    messages: [],
                    isPasswordProtected,
                    createdAt: Date.now(),
                    autoplay: true,
                });
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true }));
            }
            catch (error) {
                console.error("Error creating room:", error);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Failed to create room" }));
            }
        });
        return;
    }
    res.writeHead(404);
    res.end("Not found");
});
// Create Socket.io server
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || "*", // In production, restrict this to your domain
        methods: ["GET", "POST"],
        credentials: true,
    },
});
// Socket.io connection handler
io.on("connection", (socket) => {
    // Get query parameters
    const { roomId, userId, userName, userImage } = socket.handshake.query;
    console.log(`User ${userName} (${userId}) connected to room ${roomId}`);
    // Join the room
    socket.join(roomId);
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
        rooms.set(roomId, {
            roomId,
            roomName: "YouTube Room",
            hostId: userId, // First user becomes host
            users: [],
            currentVideo: null,
            playlist: [],
            isPlaying: false,
            currentTime: 0,
            messages: [],
            isPasswordProtected: false,
            createdAt: Date.now(),
            autoplay: true,
        });
    }
    // Get room
    const room = rooms.get(roomId);
    // Add user to room if not already present
    const existingUserIndex = room.users.findIndex((u) => u.id === userId);
    if (existingUserIndex === -1) {
        // Add new user
        const user = {
            id: userId,
            name: userName,
            image: userImage,
            isHost: userId === room.hostId,
            socketId: socket.id,
        };
        room.users.push(user);
    }
    else {
        // Update existing user's socket ID
        room.users[existingUserIndex].socketId = socket.id;
    }
    // Send current room state to the new user
    socket.emit("room:state", room);
    // Notify other users that someone joined
    socket.to(roomId).emit("user:joined", {
        id: userId,
        name: userName,
        image: userImage,
        isHost: userId === room.hostId,
    });
    // Handle player state change
    socket.on("player:stateChange", (data) => {
        // Update room state
        room.isPlaying = data.isPlaying;
        room.currentTime = data.currentTime;
        // Broadcast to other users
        socket.to(roomId).emit("player:stateChange", data);
    });
    // Handle autoplay toggle
    socket.on("autoplay:toggle", (data) => {
        // Update room state
        room.autoplay = !data.autoplay; // Toggle autoplay state
        // Broadcast to other users
        socket.to(roomId).emit("autoplay:toggle", {
            autoplay: room.autoplay
        });
    });
    // Handle video change
    socket.on("video:change", (videoId) => {
        // Find the video in the playlist
        const video = room.playlist.find((v) => v.id === videoId);
        if (video) {
            // Update room state
            room.currentVideo = video;
            room.currentTime = 0;
            room.isPlaying = true;
            // Broadcast to other users
            socket.to(roomId).emit("video:change", {
                videoId: video.videoId,
                currentTime: 0,
            });
        }
    });
    // Handle playlist update
    socket.on("playlist:update", (playlist) => {
        // Update room state
        room.playlist = playlist;
        // Broadcast to other users
        socket.to(roomId).emit("playlist:update", playlist);
    });
    // Handle adding a video to playlist
    socket.on("playlist:add", (video) => {
        // Add video to playlist if it doesn't exist
        if (!room.playlist.some((v) => v.id === video.id)) {
            room.playlist.push(video);
        }
        // If no video is currently playing, set this as current
        if (!room.currentVideo) {
            room.currentVideo = video;
            room.currentTime = 0;
            room.isPlaying = true;
            // Notify all users about the video change
            io.to(roomId).emit("video:change", {
                videoId: video.videoId,
                currentTime: 0,
            });
        }
        // Broadcast updated playlist to all users
        io.to(roomId).emit("playlist:update", room.playlist);
    });
    // Handle removing a video from playlist
    socket.on("playlist:remove", (videoId) => {
        // Remove video from playlist
        room.playlist = room.playlist.filter((v) => v.id !== videoId);
        // If current video was removed, set next video as current
        if (room.currentVideo && room.currentVideo.id === videoId) {
            room.currentVideo = room.playlist.length > 0 ? room.playlist[0] : null;
            room.currentTime = 0;
            room.isPlaying = false;
            // Notify all users about the video change
            if (room.currentVideo) {
                io.to(roomId).emit("video:change", {
                    videoId: room.currentVideo.videoId,
                    currentTime: 0,
                });
            }
        }
        // Broadcast updated playlist to all users
        io.to(roomId).emit("playlist:update", room.playlist);
    });
    // Handle chat message
    socket.on("chat:message", (message) => {
        // Create message object
        const chatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            userId,
            userName,
            userImage,
            message,
            timestamp: Date.now(),
        };
        // Add message to room
        room.messages.push(chatMessage);
        // Broadcast to all users including sender
        io.to(roomId).emit("chat:message", chatMessage);
    });
    // Handle room settings update
    socket.on("room:update", (settings) => {
        // Only allow host to update room settings
        if (userId === room.hostId) {
            // Update room settings
            Object.assign(room, settings);
            // Broadcast updated room state to all users
            io.to(roomId).emit("room:state", room);
        }
    });
    // Handle disconnect
    socket.on("disconnect", () => {
        console.log(`User ${userName} (${userId}) disconnected from room ${roomId}`);
        // Remove user from room
        if (room) {
            room.users = room.users.filter((u) => u.id !== userId);
            // If room is empty, remove it after a delay
            if (room.users.length === 0) {
                setTimeout(() => {
                    // Check again if room is still empty
                    const currentRoom = rooms.get(roomId);
                    if (currentRoom && currentRoom.users.length === 0) {
                        rooms.delete(roomId);
                        console.log(`Room ${roomId} removed due to inactivity`);
                    }
                }, 60000); // 1 minute delay
            }
            else if (userId === room.hostId) {
                // If host left, assign a new host
                const newHost = room.users[0];
                room.hostId = newHost.id;
                newHost.isHost = true;
                // Notify all users about the new host
                io.to(roomId).emit("host:changed", {
                    id: newHost.id,
                    name: newHost.name,
                });
            }
            // Notify other users that someone left
            socket.to(roomId).emit("user:left", {
                id: userId,
                name: userName,
            });
        }
    });
});
// Start server
const PORT = process.env.PORT || 3003;
httpServer.listen(PORT, () => {
    console.log(`Socket server running on port ${PORT}`);
});
