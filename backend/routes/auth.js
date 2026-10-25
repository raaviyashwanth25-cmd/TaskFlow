const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// SIGNUP API
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Name, email, and password are required."
            });
        }

        // Basic email validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email.trim())) {
            return res.status(400).json({
                message: "Please enter a valid email address."
            });
        }

        // Require a minimum password length
        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters."
            });
        }

        // Check if the user already exists
        const existingUser = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (existingUser) {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create the user
        const user = await User.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword
        });

        res.status(201).json({
            message: "Account created successfully.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        // Handle duplicate email race conditions
        if (error.code === 11000) {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        console.error("Signup error:", error);

        res.status(500).json({
            message: "Failed to create account."
        });
    }
});

// LOGIN API
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        // Find the user
        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        // Compare the password with its hash
        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        // Check that the JWT secret is configured
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing from the .env file.");

            return res.status(500).json({
                message: "Authentication is not configured."
            });
        }

        // Generate a JWT
        const token = jwt.sign(
            {
                userId: user._id.toString()
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        res.status(200).json({
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            message: "Login failed."
        });
    }
});

module.exports = router;