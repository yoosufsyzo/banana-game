/*
 * Banana Game – game.js
 * The game itself: loading puzzles, the countdown timer, checking answers, lives and score.
 * EVENTS: button clicks, keyboard presses, the image "load" event, the timer (setInterval).
 * It also SENDS its own custom events (see emit below), e.g. "game:correct" and "gameover",
 * so other files (sound.js, main.js) can react without game.js knowing about them.
 *
 * CIS046-3 Software for Enterprise
 * Code written with help from Claude (AI assistant, Anthropic) and reviewed by the student.
 */

// Everything we need to remember while a game is running
const game = {
  levelKey: null,     // "EASY", "MEDIUM" or "HARD"
  level: null,        // the settings for that level (from CONFIG.LEVELS)
  score: 0,
  lives: 0,
  correct: 0,
  wrong: 0,
  solution: null,     // the right answer for the current puzzle (from the Banana API)
  chosenDigit: null,  // the digit the player picked
  timeLeft: 0,
  timerId: null,
  running: false,          // is a game in progress?
  waitingForAnswer: false, // can the player answer right now?
};

// Shortcut so we don't repeat document.getElementById everywhere
function el(id) {
  return document.getElementById(id);
}

// Send our own custom event, e.g. emit("game:correct").
// Any file can listen with document.addEventListener("game:correct", ...)
function emit(eventName, detail = {}) {
  document.dispatchEvent(new CustomEvent(eventName, { detail: detail }));
}

// ---------------------------------------------------------------------------
// EVENT LISTENERS (set up once when the page loads)
// ---------------------------------------------------------------------------
function setupGameEvents() {
  el("start-btn").addEventListener("click", () => startGame(selectedLevel));

  // One listener per keypad button
  document.querySelectorAll(".key").forEach(key => {
    key.addEventListener("click", () => chooseDigit(Number(key.dataset.digit)));
  });

  el("submit-btn").addEventListener("click", submitAnswer);
  document.addEventListener("keydown", handleKeyboard);

  // The timer only starts when the puzzle picture has actually arrived
  el("puzzle-img").addEventListener("load", onPuzzleImageLoaded);
  el("puzzle-img").addEventListener("error", () => {
    if (game.running) showPuzzleError("The puzzle picture could not be loaded.");
  });

  el("retry-btn").addEventListener("click", loadNextPuzzle);
  el("error-home-btn").addEventListener("click", quitGame);
  el("quit-btn").addEventListener("click", quitGame);
}

// ---------------------------------------------------------------------------
// GAME FLOW
// ---------------------------------------------------------------------------
function startGame(levelKey) {
  const level = CONFIG.LEVELS[levelKey];
  game.levelKey = levelKey;
  game.level = level;
  game.score = 0;
  game.lives = level.lives;
  game.correct = 0;
  game.wrong = 0;
  game.running = true;

  el("level-badge").textContent = level.name;
  el("level-badge").className = "badge " + levelKey.toLowerCase();
  game.timeLeft = level.seconds; // show a full timer until the first puzzle arrives
  updateTimerDisplay();
  updateHud();
  showScreen("game-screen");
  emit("game:start", { levelKey: levelKey });
  loadNextPuzzle();
}

async function loadNextPuzzle() {
  stopTimer();
  game.waitingForAnswer = false;
  clearChoice();
  hideFeedback();
  setPuzzleState("loading");

  try {
    const puzzle = await fetchPuzzle(); // bananaApi.js
    if (!game.running) return;          // player quit while we were waiting
    game.solution = puzzle.solution;
    el("puzzle-img").src = puzzle.imageUrl; // → fires the "load" event when ready
  } catch (error) {
    if (game.running) showPuzzleError(error.message);
  }
}

// Runs when the puzzle image has finished loading
function onPuzzleImageLoaded() {
  if (!game.running) return;
  setPuzzleState("ready");
  game.waitingForAnswer = true;
  startTimer();
}

function submitAnswer() {
  if (!game.waitingForAnswer) return;
  if (game.chosenDigit === null) {
    showFeedback("Pick a digit first.", "info");
    return;
  }

  stopTimer();
  game.waitingForAnswer = false;

  if (game.chosenDigit === game.solution) {
    game.score += game.level.points;
    game.correct++;
    showFeedback(`Correct! +${game.level.points} points`, "good");
    emit("game:correct");
  } else {
    game.wrong++;
    game.lives--;
    showFeedback(`Not quite. The answer was ${game.solution}. −1 life`, "error");
    emit("game:wrong");
  }

  updateHud();
  goToNextStep();
}

function handleTimeUp() {
  game.waitingForAnswer = false;
  game.wrong++;
  game.lives--;
  showFeedback(`Time's up! The answer was ${game.solution}. −1 life`, "error");
  emit("game:timeup");
  updateHud();
  goToNextStep();
}

// How many puzzles the player has answered so far (right, wrong or timed out)
function puzzlesAnswered() {
  return game.correct + game.wrong;
}

// After an answer: wait 1.5 s so the player can read the feedback, then continue.
// The game ends when the lives run out OR all the puzzles of the level are done.
function goToNextStep() {
  setTimeout(() => {
    if (!game.running) return;
    if (game.lives <= 0) {
      endGame("lives");
    } else if (puzzlesAnswered() >= game.level.puzzles) {
      endGame("complete");
    } else {
      loadNextPuzzle();
    }
  }, 1500);
}

// reason is "complete" (all puzzles done) or "lives" (no lives left)
function endGame(reason) {
  game.running = false;
  stopTimer();

  // Our own custom event. game.js doesn't need to know what happens next;
  // main.js listens for "gameover" and shows the results and saves the score.
  const result = {
    levelKey: game.levelKey,
    reason: reason,
    score: game.score,
    correct: game.correct,
    wrong: game.wrong,
    totalPuzzles: game.level.puzzles,
  };
  emit("gameover", result);
}

function quitGame() {
  if (!game.running) return;
  game.running = false;
  stopTimer();
  emit("game:quit");
  showScreen("levels-screen");
}

// ---------------------------------------------------------------------------
// TIMER
// ---------------------------------------------------------------------------
function startTimer() {
  game.timeLeft = game.level.seconds;
  updateTimerDisplay();

  // setInterval runs this function every 1000 ms (1 second)
  game.timerId = setInterval(() => {
    game.timeLeft--;
    updateTimerDisplay();
    emit("game:tick", { timeLeft: game.timeLeft });
    if (game.timeLeft <= 0) {
      stopTimer();
      handleTimeUp();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(game.timerId);
  game.timerId = null;
}

// ---------------------------------------------------------------------------
// PLAYER INPUT
// ---------------------------------------------------------------------------
function chooseDigit(digit) {
  if (!game.waitingForAnswer) return;
  game.chosenDigit = digit;
  el("answer-box").textContent = digit;
  document.querySelectorAll(".key").forEach(key => {
    key.classList.toggle("selected", Number(key.dataset.digit) === digit);
  });
}

function clearChoice() {
  game.chosenDigit = null;
  el("answer-box").textContent = "?";
  document.querySelectorAll(".key").forEach(key => key.classList.remove("selected"));
}

function handleKeyboard(event) {
  if (el("game-screen").classList.contains("hidden")) return; // only during the game
  if (/^[0-9]$/.test(event.key)) {
    chooseDigit(Number(event.key));
  } else if (event.key === "Enter") {
    event.preventDefault();
    submitAnswer();
  }
}

// ---------------------------------------------------------------------------
// DISPLAY HELPERS
// ---------------------------------------------------------------------------
function updateHud() {
  el("score-text").textContent = game.score;
  // e.g. "3 / 10": the puzzle the player is on now
  const current = Math.min(puzzlesAnswered() + 1, game.level.puzzles);
  el("puzzle-text").textContent = `${current} / ${game.level.puzzles}`;
  el("lives-text").textContent =
    "❤️".repeat(Math.max(game.lives, 0)) + "🤍".repeat(game.level.lives - Math.max(game.lives, 0));
}

function updateTimerDisplay() {
  el("time-text").textContent = game.timeLeft + "s";
  el("time-bar").style.width = (game.timeLeft / game.level.seconds) * 100 + "%";
  el("timer-box").classList.toggle("danger", game.timeLeft <= CONFIG.WARNING_SECONDS);
}

// Show exactly one of: "loading", "ready" (the image) or "error"
function setPuzzleState(state) {
  el("puzzle-loading").classList.toggle("hidden", state !== "loading");
  el("puzzle-img").classList.toggle("hidden", state !== "ready");
  el("puzzle-error").classList.toggle("hidden", state !== "error");
}

function showPuzzleError(text) {
  stopTimer();
  game.waitingForAnswer = false;
  el("puzzle-error-text").textContent = text;
  setPuzzleState("error");
}

function showFeedback(text, type) {
  el("feedback").textContent = text;
  el("feedback").className = "message " + type;
}

function hideFeedback() {
  el("feedback").className = "message hidden";
}
