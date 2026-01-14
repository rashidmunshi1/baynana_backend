require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const aminRoutes = require('./routes/adminRoutes');
const cors = require('cors')
const app = express();
const path = require("path");


// Middleware
app.use(express.json());
app.use(cors());
// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

// Base Route
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));



app.use('/api/user', userRoutes);
app.use('/api/admin', aminRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
