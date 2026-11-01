/*
 * Banana Game – bananaApi.js
 * INTEROPERABILITY: gets a puzzle from Marc Conrad's Banana API (a PHP web service on
 * another server). We only need to agree on HTTP + JSON to work with it.
 *
 * Banana API documentation: https://marcconrad.com/uob/banana/doc.php
 * Example reply:  { "question": "https://.../puzzle.png", "solution": 5 }
 *
 * CIS046-3 Software for Enterprise
 * Code written with help from Claude (AI assistant, Anthropic) and reviewed by the student.
 */

// Small helper: wait for some milliseconds (used between retries)
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Ask the Banana API for one puzzle.
// Returns { imageUrl, solution } or throws an Error after all retries fail.
async function fetchPuzzle() {
  for (let attempt = 1; attempt <= CONFIG.MAX_API_RETRIES; attempt++) {
    try {
      const response = await fetch(CONFIG.BANANA_API_URL + "?out=json");

      // The server answered, but with an error code (e.g. 500)
      if (!response.ok) {
        throw new Error("Banana API returned HTTP " + response.status);
      }

      const data = await response.json();

      // Check the reply has the two fields we rely on
      if (!data.question || data.solution === undefined) {
        throw new Error("Banana API sent an unexpected reply");
      }

      return {
        imageUrl: data.question,         // link to the puzzle picture
        solution: Number(data.solution), // the missing digit (0–9)
      };
    } catch (error) {
      console.warn(`Banana API attempt ${attempt} failed:`, error.message);
      if (attempt < CONFIG.MAX_API_RETRIES) {
        await wait(1000 * attempt); // wait a bit longer each time: 1s, 2s…
      }
    }
  }

  // All attempts failed
  throw new Error("We couldn't get a puzzle from the Banana API. Check your internet connection and try again.");
}
