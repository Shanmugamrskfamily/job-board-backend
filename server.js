//server.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoute = require('./routes/UserRoute');
const jobsRoutes = require('./routes/JobRoute');
const recruiterRoutes = require('./routes/RecruiterRoute');
const { authenticateJWT } = require('./config/middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
const corsOptions = {
  origin: 'http://localhost:5000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user',authenticateJWT, userRoute);
app.use('/api/recruiter',authenticateJWT, recruiterRoutes);
app.use('/api/jobs', authenticateJWT, jobsRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
