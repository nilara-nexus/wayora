
(() => {
  "use strict";

  // ============================================
  // WAYORA CENTRAL AUTHENTICATION
  // File: wayora-auth.js
  // ============================================

  const SESSION_KEY = "wayora_session";
  const USERS_KEY = "wayora_users";

  const protectedPages = [
    "index.html",
    "booking.html",
    "history.html",
    "enquiry.html"
  ];

  const page = location.pathname.split("/").pop() || "index.html";

  // --------------------------------------------
  // SESSION HELPERS
  // --------------------------------------------

  function getSession() {
    try {
      const session = JSON.parse(
        sessionStorage.getItem(SESSION_KEY) || "null"
      );

      if (
        !session ||
        session.userId === undefined ||
        session.userId === null ||
        String(session.userId).trim() === ""
      ) {
        return null;
      }

      return session;
    } catch (error) {
      console.error("Unable to read Wayora session:", error);
      return null;
    }
  }

  function setSession(user) {
    if (!user || user.userId == null) {
      throw new Error("A valid Wayora user is required.");
    }

    const session = {
      userId: String(user.userId),
      name: String(user.name || "Traveller"),
      email: String(user.email || "")
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

    return session;
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function isAuthenticated() {
    return getSession() !== null;
  }

  function getCurrentUserId() {
    const session = getSession();
    return session ? String(session.userId) : null;
  }

  // --------------------------------------------
  // REDIRECT HELPERS
  // --------------------------------------------

  function redirectToLogin() {
    const nextPage = protectedPages.includes(page)
      ? page
      : "index.html";

    location.replace(
      "auth.html?next=" + encodeURIComponent(nextPage)
    );
  }

  function redirectAfterLogin() {
    const params = new URLSearchParams(location.search);
    const requestedPage = params.get("next");

    // Only allow known local pages.
    const destination = protectedPages.includes(requestedPage)
      ? requestedPage
      : "index.html";

    location.replace(destination);
  }

  // --------------------------------------------
  // PROTECT PAGES
  // --------------------------------------------

  const session = getSession();

  if (protectedPages.includes(page) && !session) {
    redirectToLogin();
    return;
  }

  if (page === "auth.html" && session) {
    redirectAfterLogin();
    return;
  }

  // --------------------------------------------
  // NAVIGATION ACCOUNT / LOGOUT
  // --------------------------------------------

  function addAccountNavigation() {
    const currentSession = getSession();

    if (!currentSession) return;

    const nav = document.querySelector(".main-nav");
    const cta = document.querySelector(".nav-cta");

    // Add the logged-in user's name.
    if (nav && !document.getElementById("accountNav")) {
      const account = document.createElement("span");

      account.id = "accountNav";
      account.textContent = "Hi, " + currentSession.name;

      account.style.cssText = [
        "font-size:13px",
        "font-weight:700",
        "padding:8px",
        "color:inherit"
      ].join(";");

      nav.appendChild(account);
    }

    // Add logout button.
    if (cta && !document.getElementById("logoutButton")) {
      const logout = document.createElement("button");

      logout.id = "logoutButton";
      logout.type = "button";
      logout.textContent = "Logout";

      logout.style.cssText = [
        "border:0",
        "border-radius:10px",
        "padding:12px 18px",
        "background:#071a2f",
        "color:white",
        "cursor:pointer",
        "font:600 13px 'DM Sans',sans-serif"
      ].join(";");

      logout.addEventListener("click", () => {
        clearSession();

        location.replace("auth.html");
      });

      cta.replaceWith(logout);
    }
  }

  // --------------------------------------------
  // AUTHENTICATION UTILITIES
  // --------------------------------------------

  function getUsers() {
    try {
      const users = JSON.parse(
        localStorage.getItem(USERS_KEY) || "[]"
      );

      return Array.isArray(users) ? users : [];
    } catch (error) {
      console.error("Unable to read Wayora users:", error);
      return [];
    }
  }

  function findUserById(userId) {
    if (userId == null) return null;

    return getUsers().find(
      user => String(user.userId ?? user.id) === String(userId)
    ) || null;
  }

  // --------------------------------------------
  // SHARED WAYORA API
  // --------------------------------------------

  window.WayoraAuth = Object.freeze({
    getSession,
    setSession,
    clearSession,
    isAuthenticated,
    getCurrentUserId,
    findUserById,
    redirectAfterLogin,
    redirectToLogin
  });

  // --------------------------------------------
  // INITIALIZE NAVIGATION
  // --------------------------------------------

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      addAccountNavigation
    );
  } else {
    addAccountNavigation();
  }
})();
