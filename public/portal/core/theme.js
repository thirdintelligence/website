/* Theme: dark is the default. Choice persists per browser (no credentials). */
import { icon } from "./icons.js";

const KEY = "thirdi-portal-theme";

export function initTheme() {
  const saved = localStorage.getItem(KEY);
  apply(saved === "light" ? "light" : "dark"); // default dark
}

export function currentTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function apply(mode) {
  document.documentElement.dataset.theme = mode;
}

export function toggleTheme() {
  const next = currentTheme() === "light" ? "dark" : "light";
  apply(next);
  try { localStorage.setItem(KEY, next); } catch { /* private mode */ }
  syncToggle();
  return next;
}

export function themeToggleButton() {
  return `<button class="btn btn-icon btn-ghost theme-toggle" id="theme-toggle" type="button"
    aria-label="Toggle light and dark theme" title="Toggle theme">${icon(currentTheme() === "light" ? "moon" : "sun")}</button>`;
}

export function syncToggle() {
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.innerHTML = icon(currentTheme() === "light" ? "moon" : "sun");
}
