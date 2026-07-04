/**
 * Shared helpers used across all frontend pages.
 *
 * IMPORTANT: Update API_BASE if your XAMPP project folder name is different.
 * This assumes the project sits at: htdocs/resume-builder/
 * so the backend is reachable at:   http://localhost/resume-builder/backend/api
 */
const API_BASE = "http://localhost/resume-builder/backend/api";

async function apiRequest(endpoint, { method = "GET", body = null } = {}) {
  const opts = {
    method,
    credentials: "include", // send the PHP session cookie
    headers: {},
  };
  if (body) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }

  let res, data;
  try {
    res = await fetch(`${API_BASE}/${endpoint}`, opts);
    data = await res.json();
  } catch (err) {
    return { success: false, message: "Could not reach the server. Is XAMPP (Apache + MySQL) running?" };
  }
  return data;
}

function showMsg(el, text, type = "error") {
  if (!el) return;
  el.textContent = text;
  el.className = `form-msg ${type}`;
}

/** Redirects to login.html if the user has no active session. Used on protected pages. */
async function guardAuth() {
  const res = await apiRequest("check_session.php");
  if (!res.logged_in) {
    window.location.href = "login.html";
    return null;
  }
  return res.user;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function formatDate(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr.replace(" ", "T"));
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
