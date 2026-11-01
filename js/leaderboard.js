/*
 * Banana Game – leaderboard.js
 * Shows the top 10 scores for the chosen level.
 *
 * CIS046-3 Software for Enterprise
 * Code written with help from Claude (AI assistant, Anthropic) and reviewed by the student.
 */

let leaderboardLevel = "MEDIUM";

function setupLeaderboardEvents() {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      leaderboardLevel = tab.dataset.level;
      showLeaderboard();
    });
  });
}

async function showLeaderboard() {
  // Highlight the selected tab
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.level === leaderboardLevel);
  });

  const body = document.getElementById("leaderboard-body");
  const status = document.getElementById("leaderboard-status");
  body.innerHTML = "";
  status.textContent = "Loading…";

  try {
    const rows = await Backend.getLeaderboard(leaderboardLevel);
    const me = await Backend.currentUser();
    status.textContent = rows.length ? "" : "No scores yet for this level. Be the first!";

    rows.forEach((row, index) => {
      const tr = document.createElement("tr");
      if (me && row.username === me.username) tr.classList.add("me");

      const cells = [index + 1, row.username, row.score, row.correct, formatDate(row.playedAt)];
      cells.forEach(value => {
        const td = document.createElement("td");
        // textContent (not innerHTML) so a username like <script> is shown as text, not run
        td.textContent = value;
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
  } catch (error) {
    status.textContent = error.message;
  }
}

function formatDate(isoText) {
  return new Date(isoText).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
