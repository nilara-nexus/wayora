// Wayora shared utilities — browser-only demo data, no live operator integrations.
(() => {
  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) toggle.addEventListener("click", () => nav.classList.toggle("nav-open"));
  window.Wayora = {
    storageKey: "wayora_bookings",
    getBookings() { try { return JSON.parse(localStorage.getItem(this.storageKey) || "[]"); } catch { return []; } },
    saveBookings(items) { localStorage.setItem(this.storageKey, JSON.stringify(items)); },
    money(value) { return new Intl.NumberFormat("en-IN", { style:"currency", currency:"INR", maximumFractionDigits:0 }).format(Number(value) || 0); },
    makeId() { return "WAY-" + new Date().getFullYear() + "-" + Math.random().toString(36).slice(2,8).toUpperCase(); },
    escape(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); },
    prettyDate(value) { if (!value) return "Not selected"; return new Date(value + "T00:00:00").toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }); }
  };
})();