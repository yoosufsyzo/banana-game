# Banana Game (frontend)

CIS046-3 Software for Enterprise, Assignment 1.

A timed puzzle game built around **Marc Conrad's Banana API**. The puzzle comes from the API. Login, levels, the timer, scores and the leaderboard are built around it.

. Each file says this in its header comment. Puzzles come from Marc Conrad's Banana API: https://marcconrad.com/uob/banana/

---

## How to run it

1. Install **Visual Studio Code** and the **Live Server** extension.
2. Open the `banana-game` folder in VS Code.
3. Right-click `index.html` and choose **Open with Live Server**.
4. The game opens at `http://127.0.0.1:5500`.

Don't just double-click `index.html`. Cookies don't work on `file://` pages, and some browsers block the API call.

---

## Files

| File | What it does | Theme |
|---|---|---|
| `index.html` | All 5 screens: login, levels, game, game over, leaderboard | – |
| `css/style.css` | How everything looks | – |
| `js/config.js` | All settings in one place (level times, API address) | – |
| `js/bananaApi.js` | Asks the Banana API for a puzzle and retries if it fails | **Interoperability** |
| `js/backend.js` | Login, register, save score, leaderboard. Uses a temporary fake backend until the Java server is ready | **Interoperability**, **Virtual identity** |
| `js/auth.js` | Login and register forms, input checks, logout | **Virtual identity**, **Events** |
| `js/game.js` | Timer, checking answers, lives, score, keyboard | **Events** |
| `js/leaderboard.js` | Top 10 table for each level | – |
| `js/main.js` | Starts the app, switches screens, level cookie, game over | **Events**, **Virtual identity** |

---

## How one round works

1. The player clicks **Start game** (a *click event*).
2. `fetchPuzzle()` sends an HTTP request to the Banana API and gets JSON back: `{ question: "<image link>", solution: 5 }`.
3. The image link is put into `<img>`. When the picture arrives, the **`load` event** starts the timer.
4. `setInterval` counts down every second. At 10 seconds left the timer turns red.
5. The player clicks a digit or types it (*click* and *keydown* events), then presses **Submit** or **Enter**.
6. The answer is compared with the solution. The game adds points, or takes away a life.
7. When the lives reach 0, `game.js` sends a custom **`gameover`** event. `main.js` listens for it, shows the results and saves the score.

---

## The temporary backend

The Java backend isn't built yet, so `backend.js` has a `MockBackend` that stores users and scores in the browser (`localStorage`). This lets the whole frontend be tested now.

- Passwords are hashed with SHA-256 before they are stored. This is **only temporary**. The Java backend will use **BCrypt**, which is slower and salted, so it is much harder to crack.
- When the Java server is ready, set `USE_MOCK_BACKEND: false` in `config.js`. No other file needs to change, because they all call `Backend.login()` and so on, not the mock directly.

---

## Error handling

| Problem | What happens |
|---|---|
| Banana API down or slow | Tries 3 times (waits 1s, then 2s), then shows "Puzzle server unavailable" with **Try again** |
| Puzzle image fails to load | Shows the same error box |
| Wrong login | "Invalid username or password." (doesn't say which one was wrong) |
| Bad registration input | Clear message, e.g. "Passwords do not match." |
| Score can't be saved | The score is kept and a **Save again** button appears |
| Java server not running (later) | "Can't connect to the game server." |
| Session expired (later) | "Your session has expired. Please log in again." |

---

## Next steps

1. Java backend (Spring Boot + MySQL): register, login with BCrypt, HttpOnly session cookie, scores, leaderboard.
2. Google sign-in (OAuth 2.0), verified by the Java backend.
3. Switch `USE_MOCK_BACKEND` to `false`.
