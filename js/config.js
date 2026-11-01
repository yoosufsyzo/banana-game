/*
 * Banana Game – config.js
 * All game settings in ONE place, so they are easy to find and change.
 * CIS046-3 Software for Enterprise
 * Code written with help from Claude (AI assistant, Anthropic) and reviewed by the student.
 */

const CONFIG = {
  // Marc Conrad's Banana API (third-party web service). Returns JSON: { question, solution }
  BANANA_API_URL: "https://marcconrad.com/uob/banana/api.php",

  // How many times we try the Banana API before showing an error
  MAX_API_RETRIES: 3,

  // true  = use the temporary "fake" backend inside the browser (backend.js → MockBackend)
  // false = talk to the real Java backend at BACKEND_URL
  USE_MOCK_BACKEND: true,
  BACKEND_URL: "http://localhost:8080/api",

  // The three difficulty levels
  LEVELS: {
    EASY:   { name: "Easy",   seconds: 60, lives: 5, points: 10 },
    MEDIUM: { name: "Medium", seconds: 45, lives: 3, points: 20 },
    HARD:   { name: "Hard",   seconds: 30, lives: 3, points: 30 },
  },

  // Timer turns red when this many seconds are left
  WARNING_SECONDS: 10,
};
