// Users and storage key (use AppStorage wrapper)
let users = [];
const STORAGE_KEY = "freshShelfUsers";

function loadUsers() {
  try {
    const stored = window.AppStorage ? AppStorage.get(STORAGE_KEY) : null;
    if (stored) {
      users = stored;
      console.log("✓ Loaded users:", users);
    } else {
      users = [];
      console.log("No users found in storage, starting fresh");
    }
  } catch (error) {
    console.error("❌ Error loading users:", error);
    users = [];
    try { if (window.AppStorage) AppStorage.remove(STORAGE_KEY); } catch (e) { console.error(e); }
  }
}

function saveUsers() {
  try {
    if (window.AppStorage) {
      AppStorage.set(STORAGE_KEY, users);
      console.log("✓ Saved users to AppStorage:", users);
    } else {
      const jsonData = JSON.stringify(users);
      try { localStorage.setItem(STORAGE_KEY, jsonData); } catch (e) {}
      try { sessionStorage.setItem(STORAGE_KEY, jsonData); } catch (e) {}
      console.log("✓ Saved users to storages (fallback)");
    }
  } catch (error) {
    console.error("❌ Error saving users:", error);
    alert("Error saving data. Try using a different browser or clearing storage.");
  }
}

// Load users on page load
loadUsers();
console.log("Current users on page load:", users);

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

console.log("Auth elements - LoginForm:", !!loginForm, "RegisterForm:", !!registerForm);

// REGISTER
if (registerForm) {
  console.log("✓ Setting up register form listener");
  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("regUsername").value.trim();
    const password = document.getElementById("regPassword").value.trim();

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("REGISTER ATTEMPT");
    console.log("Username:", username, "| Password length:", password.length);

    // Validation
    if (!username || !password) {
      console.warn("⚠ Empty fields detected");
      alert("Please fill in all fields.");
      return;
    }

    if (username.length < 3) {
      alert("Username must be at least 3 characters long.");
      return;
    }

    if (password.length < 3) {
      alert("Password must be at least 3 characters long.");
      return;
    }

    // Reload latest users
    loadUsers();
    console.log("Users before checking duplicates:", users);

    // Check for duplicate username (case-insensitive)
    const userExists = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (userExists) {
      console.warn("❌ Username already exists:", username);
      alert("Username already exists. Please choose another.");
      return;
    }

    // Add new user
    const newUser = { username, password };
    users.push(newUser);
    console.log("✓ New user created:", newUser);
    console.log("Total users now:", users);
    
    // Save to storage
    saveUsers();

    // Verify save
    loadUsers();
    console.log("✓ Verification: users after save:", users);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");

    alert("✓ Registered successfully! Redirecting to login...");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 500);
  });
}

// LOGIN
if (loginForm) {
  console.log("✓ Setting up login form listener");
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("LOGIN ATTEMPT");
    console.log("Username:", username, "| Password length:", password.length);

    if (!username || !password) {
      console.warn("⚠ Empty fields detected");
      alert("Please fill in all fields.");
      return;
    }

    // Load fresh user data
    loadUsers();
    console.log("Available users for login:", users);

    if (users.length === 0) {
      console.error("❌ No users registered!");
      alert("No users found. Please register first.");
      return;
    }

    // Find matching user
    const user = users.find(u => {
      const usernameMatch = u.username.toLowerCase() === username.toLowerCase();
      const passwordMatch = u.password === password;
      console.log(`Checking user "${u.username}": username=${usernameMatch}, password=${passwordMatch}`);
      return usernameMatch && passwordMatch;
    });

    if (user) {
      console.log("✓ LOGIN SUCCESSFUL!", user.username);
      try {
        if (window.AppStorage) AppStorage.set("currentUser", user);
      } catch (e) {}
      try { sessionStorage.setItem("currentUser", JSON.stringify(user)); } catch (e) {}
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      setTimeout(() => {
        window.location.href = "index.html";
      }, 300);
    } else {
      console.error("❌ LOGIN FAILED - No matching credentials");
      console.log("Expected username:", username, "| Expected password length:", password.length);
      console.log("Available users:", users.map(u => ({ username: u.username, passwordLen: u.password.length })));
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
      alert("❌ Invalid credentials. \n\nMake sure you:\n1. Are using the same username\n2. Are using the same password\n3. Have registered first\n\nCheck browser console (F12) for details.");
    }
  });
}