// middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
require('dotenv').config();

const authenticateJWT = async (req, res, next) => {
    const token = req.header('x-auth-token');
    
    if (!token) return res.status(403).json({ message: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user role from the User model
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        req.user = { userId: decoded.userId, role: user.role }; 
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token.' });
    }
};

module.exports = { authenticateJWT };