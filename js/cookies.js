/*
 * Banana Game – cookies.js
 * Small helpers to save and read cookies (VIRTUAL IDENTITY / preferences).
 * Used for the player's last level (lastLevel) and sound on/off (sound).
 *
 * These are normal cookies that JavaScript can read, so they only hold harmless
 * preferences. The login session cookie from the Java server is HttpOnly instead,
 * so JavaScript can't read it (protects against stolen sessions).
 *
 * CIS046-3 Software for Enterprise
 * Code written with help from Claude (AI assistant, Anthropic) and reviewed by the student.
 */

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  const match = document.cookie.split("; ").find(row => row.startsWith(name + "="));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}
