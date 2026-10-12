
(() => {
  const $ = id => document.getElementById(id);

  const loginForm = $("loginForm");
  const signupForm = $("signupForm");
  const loginTab = $("loginTab");
  const signupTab = $("signupTab");
  const message = $("message");

  const USERS_KEY = "wayora_users";
  const SESSION_KEY = "wayora_session";

  function getUsers() {
    try {
      const value = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function normalizeEmail(value) {
    return value.trim().toLowerCase();
  }

  function normalizePhone(value) {
    return value.replace(/[\s()-]/g, "");
  }

  function showMessage(text, type = "error") {
    message.textContent = text;
    message.className = "message " + type;
  }

  function setMode(mode) {
    const signup = mode === "signup";

    loginForm.hidden = signup;
    signupForm.hidden = !signup;
    loginTab.classList.toggle("active", !signup);
    signupTab.classList.toggle("active", signup);

    $("heading").textContent = signup
      ? "Start your journey."
      : "Welcome aboard.";

    $("intro").textContent = signup
      ? "Create your account to discover a simpler way to travel."
      : "Sign in to continue your journey with Wayora.";

    showMessage("");
  }

  loginTab.addEventListener("click", () => setMode("login"));
  signupTab.addEventListener("click", () => setMode("signup"));

  async function hashPassword(password) {
    if (!globalThis.crypto?.subtle) {
      throw new Error("Secure hashing requires HTTPS or localhost.");
    }

    const bytes = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest("SHA-256", bytes);

    return Array.from(new Uint8Array(digest))
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function saveSession(user) {
    // Never place the password or password hash in the session.
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      loginTime: Date.now()
    }));

    const requested = new URLSearchParams(location.search).get("next");
    const allowed = ["index.html", "booking.html", "history.html", "enquiry.html"];

    const destination = allowed.includes(requested)
      ? requested
      : "index.html";

    location.replace(destination);
  }

  signupForm.addEventListener("submit", async event => {
    event.preventDefault();

    const name = $("fullName").value.trim();
    const email = normalizeEmail($("signupEmail").value);
    const phone = normalizePhone($("signupPhone").value);
    const password = $("signupPassword").value;
    const confirm = $("confirmPassword").value;

    if (name.length < 2) {
      return showMessage("Please enter your full name.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return showMessage("Enter a valid email address.");
    }

    if (!/^\+?[0-9]{10,15}$/.test(phone)) {
      return showMessage("Enter a valid phone number with country code if needed.");
    }

    if (password.length < 8) {
      return showMessage("Your password must contain at least 8 characters.");
    }

    if (password !== confirm) {
      return showMessage("Passwords do not match.");
    }

    const users = getUsers();

    if (users.some(user =>
      normalizeEmail(user.email) === email ||
      normalizePhone(user.phone) === phone
    )) {
      return showMessage("That email or phone number is already registered. Please log in.");
    }

    const button = signupForm.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = "Creating account…";

    try {
      const user = {
        id: crypto.randomUUID(),
        name,
        email,
        phone,
        passwordHash: await hashPassword(password)
      };

      users.push(user);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      showMessage("Account created successfully. Signing you in…", "success");
      saveSession(user);
    } catch (error) {
      showMessage(error.message || "Could not create your account.");
    } finally {
      button.disabled = false;
      button.textContent = "Create my account →";
    }
  });

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    const identifier = $("loginId").value.trim();
    const password = $("loginPassword").value;

    if (!identifier || !password) {
      return showMessage("Enter your email or phone number and password.");
    }

    const users = getUsers();
    const email = normalizeEmail(identifier);
    const phone = normalizePhone(identifier);

    const user = users.find(item =>
      normalizeEmail(item.email) === email ||
      normalizePhone(item.phone) === phone
    );

    if (!user) {
      return showMessage("Account not found. Please sign up first.");
    }

    try {
      const hash = await hashPassword(password);

      if (hash !== user.passwordHash) {
        return showMessage("Incorrect password. Please try again.");
      }

      showMessage("Login successful. Welcome to Wayora!", "success");
      saveSession(user);
    } catch (error) {
      showMessage(error.message || "Login failed. Please try again.");
    }
  });

  // If already signed in, don't show the login screen again.
  if (sessionStorage.getItem(SESSION_KEY)) {
    location.replace("index.html");
  }
})();
