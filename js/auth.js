/*
 * Banana Game – auth.js
 * VIRTUAL IDENTITY: login, register and logout forms.
 * EVENTS: each form and button gets an event listener.
 *
 * CIS046-3 Software for Enterprise
 * Code written with help from Claude (AI assistant, Anthropic) and reviewed by the student.
 */

function setupAuthEvents() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  // Switch between the two forms
  document.getElementById("show-register").addEventListener("click", (event) => {
    event.preventDefault();
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    hideAuthMessage();
  });

  document.getElementById("show-login").addEventListener("click", (event) => {
    event.preventDefault();
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    hideAuthMessage();
  });

  // LOGIN: runs when the login form is submitted (button click or Enter key)
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // stop the browser from reloading the page

    const username = loginForm.username.value.trim();
    const password = loginForm.password.value;

    if (!username || !password) {
      showAuthMessage("Please enter your username and password.");
      return;
    }

    try {
      const user = await Backend.login(username, password);
      loginForm.reset();
      hideAuthMessage();
      onLoggedIn(user); // in main.js
    } catch (error) {
      showAuthMessage(error.message);
    }
  });

  // REGISTER: check the input first, then create the account
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = registerForm.username.value.trim();
    const email = registerForm.email.value.trim();
    const password = registerForm.password.value;
    const confirm = registerForm.confirm.value;

    const problem = validateRegistration(username, email, password, confirm);
    if (problem) {
      showAuthMessage(problem);
      return;
    }

    try {
      const user = await Backend.register(username, email, password);
      registerForm.reset();
      hideAuthMessage();
      onLoggedIn(user);
    } catch (error) {
      showAuthMessage(error.message);
    }
  });

  // GOOGLE: will be connected when the Java backend can verify Google's ID token
  document.getElementById("google-btn").addEventListener("click", () => {
    showAuthMessage("Google sign-in will be connected in the next stage, together with the Java backend.", "info");
  });

  // LOGOUT
  document.getElementById("logout-btn").addEventListener("click", async () => {
    quitGame(); // stop a running game, if there is one (game.js)
    await Backend.logout();
    document.getElementById("topbar").classList.add("hidden");
    registerForm.classList.add("hidden"); // always come back to the login form
    loginForm.classList.remove("hidden");
    showScreen("login-screen");
  });
}

// Returns an error message, or null if everything is fine
function validateRegistration(username, email, password, confirm) {
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    return "Username must be 3–20 characters: letters, numbers or _.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Please enter a valid email address.";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (password !== confirm) {
    return "Passwords do not match.";
  }
  return null;
}

function showAuthMessage(text, type = "error") {
  const box = document.getElementById("auth-message");
  box.textContent = text;
  box.className = "message " + type;
}

function hideAuthMessage() {
  document.getElementById("auth-message").className = "message hidden";
}
