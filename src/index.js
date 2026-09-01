require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const userRoutes = require('./routes/userRoutes');
const aminRoutes = require('./routes/adminRoutes');
const settingRoutes = require('./routes/settingRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const whatsappWebService = require('./Helper/whatsappWebService');

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        // Initialize all saved WhatsApp sessions after DB connects
        whatsappWebService.initAllSessions(io);
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

// Base Route
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
    res.send('Welcome to the API');
});

// API Routes
app.use('/api/user', userRoutes);
app.use('/api/admin', aminRoutes);
app.use('/api/admin/settings', settingRoutes);
app.use('/api/admin/whatsapp', whatsappRoutes);

// Socket.io connection handling
io.on('connection', async (socket) => {
    console.log(`🔌 Socket client connected: ${socket.id}`);
    
    // Immediately send current sessions list to newly connected client
    try {
        const sessionsList = await whatsappWebService.getAllSessions();
        socket.emit('whatsapp_sessions_list', sessionsList);
    } catch (e) {
        console.error('Error emitting initial sessions list:', e);
    }

    socket.on('disconnect', () => {
        console.log(`🔌 Socket client disconnected: ${socket.id}`);
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
