/*
 * Banana Game – effects.js
 * Little banana animations:
 *  - a burst of bananas when the player answers correctly
 *  - banana rain when the player finishes all the puzzles
 *
 * EVENTS: like sound.js, this file only LISTENS to the game's custom events.
 * Each banana removes itself when its CSS animation ends ("animationend" event).
 *
 * CIS046-3 Software for Enterprise
 * Code written with help from Claude (AI assistant, Anthropic) and reviewed by the student.
 */

// Create one flying banana. The CSS class decides how it moves (see style.css).
function makeBanana(className, x, y, extraStyle) {
  const banana = document.createElement("span");
  banana.className = "fx-banana " + className;
  banana.textContent = "🍌";
  banana.style.left = x + "px";
  banana.style.top = y + "px";
  Object.assign(banana.style, extraStyle);
  // Clean up: remove the banana from the page when its animation has finished
  banana.addEventListener("animationend", () => banana.remove());
  document.body.appendChild(banana);
}

// A small burst of bananas flying out of the answer box
function bananaBurst() {
  const box = document.getElementById("answer-box").getBoundingClientRect();
  const centreX = box.left + box.width / 2;
  const centreY = box.top + box.height / 2;
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6;
    makeBanana("fx-burst", centreX, centreY, {
      "--dx": Math.cos(angle) * 90 + "px",   // how far it flies sideways
      "--dy": Math.sin(angle) * 70 - 40 + "px", // and up/down
    });
  }
}

// Bananas falling from the top of the screen
function bananaRain() {
  for (let i = 0; i < 30; i++) {
    makeBanana("fx-rain", Math.random() * window.innerWidth, -40, {
      animationDelay: Math.random() * 1.5 + "s",
      animationDuration: 2 + Math.random() * 1.5 + "s",
      fontSize: 20 + Math.random() * 20 + "px",
    });
  }
}

function setupEffectEvents() {
  document.addEventListener("game:correct", bananaBurst);
  document.addEventListener("gameover", (event) => {
    if (event.detail.reason === "complete") bananaRain();
  });
}
