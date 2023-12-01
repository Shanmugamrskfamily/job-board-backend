//middleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateJWT = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(403).json({ message: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { userId: decoded.userId }; // Make sure userId is correctly assigned
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token.' });
    }
};



module.exports = { authenticateJWT };
