/*
 * Banana Game – backend.js
 * Everything that talks to OUR backend (login, register, scores, leaderboard).
 *
 * The rest of the code only calls Backend.something(). It does not care whether the data
 * comes from the temporary MockBackend (in this browser) or the real Java server.
 * Switch with CONFIG.USE_MOCK_BACKEND in config.js.
 *
 * CIS046-3 Software for Enterprise
 * Code written with help from Claude (AI assistant, Anthropic) and reviewed by the student.
 */

const Backend = {
  async register(username, email, password) {
    if (CONFIG.USE_MOCK_BACKEND) return MockBackend.register(username, email, password);
    return callServer("/auth/register", "POST", { username, email, password });
  },

  async login(username, password) {
    if (CONFIG.USE_MOCK_BACKEND) return MockBackend.login(username, password);
    return callServer("/auth/login", "POST", { username, password });
  },

  async logout() {
    if (CONFIG.USE_MOCK_BACKEND) return MockBackend.logout();
    return callServer("/auth/logout", "POST");
  },

  // Returns the logged-in user { id, username } or null
  async currentUser() {
    if (CONFIG.USE_MOCK_BACKEND) return MockBackend.currentUser();
    try {
      return await callServer("/auth/me");
    } catch {
      return null;
    }
  },

  async saveScore(levelKey, score, correct) {
    if (CONFIG.USE_MOCK_BACKEND) return MockBackend.saveScore(levelKey, score, correct);
    return callServer("/scores", "POST", { difficulty: levelKey, score, correct });
  },

  async getLeaderboard(levelKey) {
    if (CONFIG.USE_MOCK_BACKEND) return MockBackend.getLeaderboard(levelKey);
    return callServer("/leaderboard?difficulty=" + levelKey);
  },
};

// ---------------------------------------------------------------------------
// REAL backend: sends HTTP requests with JSON to the Java server.
// credentials: "include" makes the browser send the session cookie (HttpOnly) the server set.
// ---------------------------------------------------------------------------
async function callServer(path, method = "GET", body) {
  let response;
  try {
    response = await fetch(CONFIG.BACKEND_URL + path, {
      method: method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch only throws when the server can't be reached at all
    throw new Error("Can't connect to the game server. Is it running?");
  }

  if (response.status === 401) {
    throw new Error("Your session has expired. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Something went wrong on the server.");
  }
  return data;
}

// ---------------------------------------------------------------------------
// TEMPORARY fake backend so the frontend can be built and tested first.
// Data is kept in this browser's localStorage. This is NOT secure:
//  - SHA-256 without a salt is weak for passwords. The Java backend will use BCrypt.
//  - Anyone can edit localStorage. The real server will check everything itself.
// ---------------------------------------------------------------------------
const MockBackend = {
  load(key) {
    return JSON.parse(localStorage.getItem(key) || "[]");
  },

  save(key, list) {
    localStorage.setItem(key, JSON.stringify(list));
  },

  // Turn a password into a SHA-256 hash (hex text), so we never store the real password
  async hash(text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  },

  async register(username, email, password) {
    const users = this.load("bg_users");
    const taken = users.some(u => u.username.toLowerCase() === username.toLowerCase());
    if (taken) throw new Error("That username is already taken.");

    const user = {
      id: Date.now(),
      username: username,
      email: email,
      passwordHash: await this.hash(password),
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    this.save("bg_users", users);
    return this.startSession(user);
  },

  async login(username, password) {
    const users = this.load("bg_users");
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    const hash = await this.hash(password);

    // Same message for "no such user" and "wrong password", so attackers can't
    // find out which usernames exist.
    if (!user || user.passwordHash !== hash) {
      throw new Error("Invalid username or password.");
    }
    return this.startSession(user);
  },

  // Remember who is logged in for this browser tab only (sessionStorage)
  startSession(user) {
    const publicUser = { id: user.id, username: user.username };
    sessionStorage.setItem("bg_session", JSON.stringify(publicUser));
    return publicUser;
  },

  async currentUser() {
    return JSON.parse(sessionStorage.getItem("bg_session") || "null");
  },

  async logout() {
    sessionStorage.removeItem("bg_session");
  },

  async saveScore(levelKey, score, correct) {
    const user = await this.currentUser();
    if (!user) throw new Error("Your session has expired. Please log in again.");

    const scores = this.load("bg_scores");
    scores.push({
      userId: user.id,
      username: user.username,
      difficulty: levelKey,
      score: score,
      correct: correct,
      playedAt: new Date().toISOString(),
    });
    this.save("bg_scores", scores);
    return { saved: true };
  },

  async getLeaderboard(levelKey) {
    return this.load("bg_scores")
      .filter(s => s.difficulty === levelKey)
      // Highest score first. If two scores are equal, whoever got it first ranks higher.
      .sort((a, b) => b.score - a.score || a.playedAt.localeCompare(b.playedAt))
      .slice(0, 10);
  },
};
