const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Please log in to access this resource."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Store the authenticated user's ID
        req.userId = decoded.userId;

        // Continue to the requested route
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token. Please log in again."
        });
    }
}

module.exports = authenticateToken;