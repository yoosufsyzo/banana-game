/*
 * Banana Game – main.js
 * Starts the app, switches between screens, remembers the chosen level in a cookie
 * (helpers in cookies.js), and handles the end of a game.
 *
 * CIS046-3 Software for Enterprise
 * Code written with help from Claude (AI assistant, Anthropic) and reviewed by the student.
 */

// ---------------------------------------------------------------------------
// SCREENS
// ---------------------------------------------------------------------------
function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(screen => screen.classList.add("hidden"));
  document.getElementById(screenId).classList.remove("hidden");

  // Highlight the matching menu button, and hide the menu during a game
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.screen === screenId);
  });
  document.getElementById("main-nav").classList.toggle("hidden", screenId === "game-screen");

  if (screenId === "leaderboard-screen") showLeaderboard();
}

function onLoggedIn(user) {
  document.getElementById("user-name").textContent = user.username;
  document.getElementById("user-avatar").textContent = user.username.charAt(0).toUpperCase();
  document.getElementById("topbar").classList.remove("hidden");
  showScreen("levels-screen");
}

// ---------------------------------------------------------------------------
// LEVEL SELECTION
// ---------------------------------------------------------------------------
let selectedLevel = "MEDIUM";

function selectLevel(levelKey) {
  selectedLevel = levelKey;
  document.querySelectorAll(".level").forEach(card => {
    card.classList.toggle("selected", card.dataset.level === levelKey);
  });
  setCookie("lastLevel", levelKey, 30);
}

function setupLevelEvents() {
  document.querySelectorAll(".level").forEach(card => {
    card.addEventListener("click", () => selectLevel(card.dataset.level));
  });

  // Use the level saved in the cookie, if it is a real level name
  const saved = getCookie("lastLevel");
  selectLevel(CONFIG.LEVELS[saved] ? saved : "MEDIUM");
}

// ---------------------------------------------------------------------------
// GAME OVER: listens for the custom "gameover" event sent by game.js
// ---------------------------------------------------------------------------
let lastResult = null;

document.addEventListener("gameover", (event) => {
  lastResult = event.detail;
  const levelName = CONFIG.LEVELS[lastResult.levelKey].name;

  // Different title depending on HOW the game ended
  if (lastResult.reason === "complete") {
    document.getElementById("over-title").textContent = "Well done!";
    document.getElementById("over-level").textContent =
      `${levelName} level · all ${lastResult.totalPuzzles} puzzles finished`;
  } else {
    document.getElementById("over-title").textContent = "Game over";
    document.getElementById("over-level").textContent = `${levelName} level · all lives used`;
  }
  document.getElementById("over-score").textContent = lastResult.score;
  document.getElementById("over-correct").textContent = lastResult.correct;
  document.getElementById("over-wrong").textContent = lastResult.wrong;
  showScreen("gameover-screen");
  saveResult();
});

async function saveResult() {
  const status = document.getElementById("save-status");
  const againBtn = document.getElementById("save-again-btn");
  status.textContent = "Saving your score…";
  status.className = "message info";
  againBtn.classList.add("hidden");

  try {
    await Backend.saveScore(lastResult.levelKey, lastResult.score, lastResult.correct);
    status.textContent = "✓ Score saved to your account";
    status.className = "message good";
  } catch (error) {
    // Keep the result so the player can try again
    status.textContent = "Your score wasn't saved: " + error.message;
    status.className = "message error";
    againBtn.classList.remove("hidden");
  }
}

function setupNavEvents() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => showScreen(btn.dataset.screen));
  });
  document.getElementById("save-again-btn").addEventListener("click", saveResult);
  document.getElementById("play-again-btn").addEventListener("click", () => startGame(lastResult.levelKey));
  document.getElementById("view-board-btn").addEventListener("click", () => {
    leaderboardLevel = lastResult.levelKey;
    showScreen("leaderboard-screen");
  });
}

// ---------------------------------------------------------------------------
// START: runs once when the page has loaded
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  setupAuthEvents();
  setupLevelEvents();
  setupGameEvents();
  setupLeaderboardEvents();
  setupNavEvents();
  setupSoundEvents();
  setupEffectEvents();

  const user = await Backend.currentUser();
  if (user) {
    onLoggedIn(user);
  } else {
    showScreen("login-screen");
  }
});
