TaskFlow — Full-Stack Task Management Application

TaskFlow is a full-stack web application that helps users manage their daily tasks. Users can create an account, log in securely, add tasks, view their task list, mark tasks as completed, and delete tasks.

Features

* User registration and login
* Password hashing using bcrypt
* JWT-based authentication
* Create and view tasks
* Mark tasks as completed
* Delete tasks
* MongoDB database integration
* User-specific task management
* Responsive web interface

Technologies Used

Frontend

* HTML5
* CSS3
* JavaScript

Backend

* Node.js
* Express.js
* REST APIs
* JSON Web Tokens (JWT)
* bcryptjs

Database

* MongoDB
* Mongoose

Project Structure

TaskFlow/
├── backend/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   └── auth.js
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── .gitignore
└── README.md

Getting Started

Prerequisites

Install the following before running the project:

* Node.js and npm
* MongoDB connection
* Visual Studio Code (recommended)

1. Clone the repository

git clone https://github.com/raaviyashwanth25-cmd/TaskFlow.git
cd TaskFlow

2. Install backend dependencies

cd backend
npm install

3. Configure environment variables

Create a .env file inside the backend folder.

Add your own configuration:

MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret

Replace the example values with your own credentials. Never upload your .env file or share your secrets publicly.

4. Start the backend

From the backend folder, run:

node server.js

The backend should start on port 3000 if that is the port configured in your application.

5. Open the frontend

Open frontend/index.html using the VS Code Live Server extension.

The frontend connects to the backend running locally at http://localhost:3000.

Authentication and Security

* Passwords are hashed before being stored.
* JWTs are used to authenticate protected API requests.
* Task operations are scoped to the authenticated user.
* Environment variables are used to keep sensitive configuration out of source control.

Project Purpose

This project was developed as a full-stack development capstone to practice frontend development, backend API creation, database integration, and authentication.

Author

Raavi Yashwanth

GitHub: https://github.com/raaviyashwanth25-cmd