// Backend API addresses
const AUTH_API_URL = "http://localhost:3000/api/auth";
const TASK_API_URL = "http://localhost:3000/api/tasks";

// Store the login session in the browser.
// The token is removed when the user logs out.
let authToken = sessionStorage.getItem("taskflowToken");
let currentUser = JSON.parse(
    sessionStorage.getItem("taskflowUser") || "null"
);

// Get HTML elements
const loginSection = document.getElementById("loginSection");
const signupSection = document.getElementById("signupSection");
const dashboardSection = document.getElementById("dashboardSection");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const loginMessage = document.getElementById("loginMessage");
const signupMessage = document.getElementById("signupMessage");

const showSignupButton = document.getElementById("showSignup");
const showLoginButton = document.getElementById("showLogin");
const logoutButton = document.getElementById("logoutButton");

const welcomeMessage = document.getElementById("welcomeMessage");

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const message = document.getElementById("message");

// Show a message on the webpage
function showMessage(text) {
message.textContent = text;
}

// Show Login, Signup, or Dashboard
function showScreen(screen) {
loginSection.hidden = screen !== "login";
signupSection.hidden = screen !== "signup";
dashboardSection.hidden = screen !== "dashboard";
}

// Return common headers for authenticated task requests
function getAuthHeaders(extraHeaders = {}) {
return {
...extraHeaders,
Authorization: `Bearer ${authToken}`
};
}

// Clear the current login session
function clearSession() {
authToken = null;
currentUser = null;

sessionStorage.removeItem("taskflowToken");
sessionStorage.removeItem("taskflowUser");
taskList.replaceChildren();

}

// Handle expired or invalid login sessions
function handleUnauthorized() {
clearSession();
showScreen("login");
loginMessage.textContent = "Your session has expired. Please log in again.";
}

// Open Signup screen
showSignupButton.addEventListener("click", () => {
signupForm.reset();
signupMessage.textContent = "";
showScreen("signup");
});

// Open Login screen
showLoginButton.addEventListener("click", () => {
loginForm.reset();
loginMessage.textContent = "";
showScreen("login");
});

// Create a new account
signupForm.addEventListener("submit", async (event) => {
event.preventDefault();

signupMessage.textContent = "Creating your account...";
const name = document.getElementById("signupName").value.trim();
const email = document.getElementById("signupEmail").value.trim();
const password = document.getElementById("signupPassword").value;
try {
    const response = await fetch(`${AUTH_API_URL}/signup`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Could not create your account.");
    }
    signupForm.reset();
    showScreen("login");
    loginMessage.textContent = "Account created successfully! Please log in.";
} catch (error) {
    signupMessage.textContent = error.message;
    console.error("Signup error:", error);
}

});

// Log in an existing user
loginForm.addEventListener("submit", async (event) => {
event.preventDefault();

loginMessage.textContent = "Logging in...";
const email = document.getElementById("loginEmail").value.trim();
const password = document.getElementById("loginPassword").value;
try {
    const response = await fetch(`${AUTH_API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Login failed.");
    }
    if (!data.token || !data.user) {
        throw new Error("The server did not return a valid login session.");
    }
    authToken = data.token;
    currentUser = data.user;
    sessionStorage.setItem("taskflowToken", authToken);
    sessionStorage.setItem("taskflowUser", JSON.stringify(currentUser));
    loginForm.reset();
    loginMessage.textContent = "";
    welcomeMessage.textContent = `Welcome, ${currentUser.name}!`;
    showScreen("dashboard");
    await loadTasks();
} catch (error) {
    loginMessage.textContent = error.message;
    console.error("Login error:", error);
}

});

// Log out the current user
logoutButton.addEventListener("click", () => {
clearSession();

loginForm.reset();
loginMessage.textContent = "You have logged out successfully.";
showScreen("login");

});

// Load tasks from the backend for the logged-in user
async function loadTasks() {
if (!authToken) {
return;
}

try {
    const response = await fetch(TASK_API_URL, {
        headers: getAuthHeaders()
    });
    const data = await response.json();
    if (response.status === 401) {
        handleUnauthorized();
        return;
    }
    if (!response.ok) {
        throw new Error(data.message || "Could not load tasks.");
    }
    taskList.replaceChildren();
    data.forEach(displayTask);
    showMessage("");
    console.log("Tasks received from backend:", data);
} catch (error) {
    showMessage("Could not load tasks: " + error.message);
    console.error("Load tasks error:", error);
}

}

// Display one task
function displayTask(task) {
const li = document.createElement("li");
li.className = "task-item";

const taskId = task._id || task.id;
const checkbox = document.createElement("input");
checkbox.type = "checkbox";
checkbox.checked = task.completed;
checkbox.setAttribute("aria-label", "Mark task as completed");
const title = document.createElement("span");
title.className = "task-title";
title.textContent = task.title;
if (task.completed) {
    title.classList.add("completed");
}
// Update task completion status
checkbox.addEventListener("change", async () => {
    try {
        if (!task._id) {
            throw new Error("This task has no MongoDB ID.");
        }
        const response = await fetch(
            `${TASK_API_URL}/${encodeURIComponent(taskId)}`,
            {
                method: "PATCH",
                headers: getAuthHeaders({
                    "Content-Type": "application/json"
                }),
                body: JSON.stringify({
                    completed: checkbox.checked
                })
            }
        );
        const data = await response.json();
        if (response.status === 401) {
            handleUnauthorized();
            return;
        }
        if (!response.ok) {
            throw new Error(data.message || "Could not update task.");
        }
        showMessage("Task updated successfully!");
        await loadTasks();
    } catch (error) {
        checkbox.checked = task.completed;
        showMessage(error.message);
        console.error("Update task error:", error);
    }
});
// Delete task button
const deleteButton = document.createElement("button");
deleteButton.textContent = "Delete";
deleteButton.className = "delete-button";
deleteButton.addEventListener("click", async () => {
    try {
        if (!task._id) {
            throw new Error("This task has no MongoDB ID.");
        }
        const response = await fetch(
            `${TASK_API_URL}/${encodeURIComponent(taskId)}`,
            {
                method: "DELETE",
                headers: getAuthHeaders()
            }
        );
        const data = await response.json();
        if (response.status === 401) {
            handleUnauthorized();
            return;
        }
        if (!response.ok) {
            throw new Error(data.message || "Could not delete task.");
        }
        showMessage("Task deleted successfully!");
        await loadTasks();
    } catch (error) {
        showMessage(error.message);
        console.error("Delete task error:", error);
    }
});
li.append(checkbox, title, deleteButton);
taskList.appendChild(li);

}

// Add a new task
taskForm.addEventListener("submit", async (event) => {
    event.preventDefault();

if (!authToken) {
    handleUnauthorized();
    return;
}
const title = taskInput.value.trim();
if (!title) {
    showMessage("Please enter a task.");
    return;
}
try {
    const response = await fetch(TASK_API_URL, {
        method: "POST",
        headers: getAuthHeaders({
            "Content-Type": "application/json"
        }),
        body: JSON.stringify({ title })
    });
    const data = await response.json();
    if (response.status === 401) {
        handleUnauthorized();
        return;
    }
    if (!response.ok) {
        throw new Error(data.message || "Could not add task.");
    }
    taskInput.value = "";
    showMessage("Task added successfully!");
    await loadTasks();
} catch (error) {
    showMessage(error.message);
    console.error("Add task error:", error);
}

});

// Start the app
async function initializeApp() {
if (authToken && currentUser) {
welcomeMessage.textContent = `Welcome, ${currentUser.name}!`;
showScreen("dashboard");
await loadTasks();
} else {
clearSession();
showScreen("login");
}
}

initializeApp();