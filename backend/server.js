// Import required packages
const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const authenticateToken = require("./middleware/auth");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to allow frontend requests
app.use((req, res, next) => {
res.setHeader("Access-Control-Allow-Origin", "*");

res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
);
res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
);
if (req.method === "OPTIONS") {
    return res.sendStatus(204);
}
next();

});

// Middleware to read JSON data
app.use(express.json());

// Authentication routes
app.use("/api/auth", authRoutes);

// Define the Task schema
const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        completed: {
            type: Boolean,
            default: false
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        }
    },
    {
        timestamps: true
    }
);

// Create the Task model
const Task = mongoose.model("Task", taskSchema);

// Home route
app.get("/", (req, res) => {
    res.send("Welcome to TaskFlow Backend!");
});

// Debug route
app.get("/api/debug", (req, res) => {
    res.json({
        message: "TaskFlow backend is running",
        database: mongoose.connection.name,
        databaseConnected: mongoose.connection.readyState === 1
    });
});

// GET: Retrieve all tasks
app.get("/api/tasks", authenticateToken, async (req, res) => {
    try {
       const tasks = await Task.find({
    userId: req.userId
}).sort({ createdAt: -1 });

        console.log("Tasks retrieved:", tasks.length);

        res.status(200).json(tasks);
    } catch (error) {
        console.error("GET task error:", error);

        res.status(500).json({
            message: "Failed to retrieve tasks."
        });
    }
});

// POST: Add a new task
app.post("/api/tasks", authenticateToken, async (req, res) => {
    try {
        const { title } = req.body;

        if (typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                message: "Task title is required."
            });
        }

        const task = await Task.create({
            title: title.trim(),
            userId: req.userId
        });

        console.log("Task created:", task._id);

        res.status(201).json(task);
    } catch (error) {
        console.error("POST task error:", error);

        res.status(500).json({
            message: "Failed to create task."
        });
    }
});

// PATCH: Mark a task as completed or incomplete
app.patch("/api/tasks/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { completed } = req.body;

        console.log("PATCH request received for ID:", id);

        // Validate the MongoDB ID
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid MongoDB task ID."
            });
        }

        // Validate the completion status
        if (typeof completed !== "boolean") {
            return res.status(400).json({
                message: "A boolean completed value is required."
            });
        }

        // Update the task
       const task = await Task.findOneAndUpdate(
    {
        _id: id,
        userId: req.userId
    },
    {
        completed: completed
    },
    {
        new: true,
        runValidators: true
    }
);
        if (!task) {
            return res.status(404).json({
                message: "Task not found in MongoDB."
            });
        }

        console.log("Task updated:", task._id);

        res.status(200).json({
            message: "Task updated successfully.",
            task: task
        });
    } catch (error) {
        console.error("PATCH task error:", error);

        res.status(500).json({
            message: "Failed to update task."
        });
    }
});

// DELETE: Remove a task
app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        console.log("DELETE request received for ID:", id);

        // Validate the MongoDB ID
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid MongoDB task ID."
            });
        }

        // Delete the task
        const task = await Task.findOneAndDelete({
            _id: id,
            userId: req.userId
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found in MongoDB."
            });
        }

        console.log("Task deleted:", task._id);

        res.status(200).json({
            message: "Task deleted successfully."
        });
    } catch (error) {
        console.error("DELETE task error:", error);

        res.status(500).json({
            message: "Failed to delete task."
        });
    }
});

// Connect to MongoDB and start the server
async function startServer() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing from the .env file.");
        }

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected successfully!");
        console.log("Database:", mongoose.connection.name);

        app.listen(PORT, () => {
            console.log(`TaskFlow server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();