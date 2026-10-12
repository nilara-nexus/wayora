(() => {
  "use strict";

  const container = document.getElementById("bookingHistory");
  const modal = document.getElementById("cancelModal");
  const summary = document.getElementById("bookingSummary");

  if (!container || !modal || !window.Wayora || !window.WayoraAuth) {
    console.error("Wayora booking history could not initialize.");
    return;
  }

  let filter = "all";
  let pendingId = null;
  let previousFocus = null;

  // --------------------------------------------------
  // CURRENT USER / AUTHENTICATION
  // --------------------------------------------------

  const currentSession = window.WayoraAuth.getSession();

  if (!currentSession || currentSession.userId == null) {
    window.location.replace(
      "auth.html?next=" + encodeURIComponent("history.html")
    );
    return;
  }

  const currentUserId = String(currentSession.userId);

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  function escapeHTML(value) {
    const str = String(value ?? "");

    if (typeof Wayora.escape === "function") {
      return Wayora.escape(str);
    }

    return str.replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function amount(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, number) : 0;
  }

  function money(value) {
    return `INR ${amount(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  function format12(value) {
    const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);

    if (!match) return value || "Not provided";

    const hour = Number(match[1]);

    return `${hour % 12 || 12}:${match[2]} ${
      hour >= 12 ? "PM" : "AM"
    }`;
  }

  function prettyDate(value) {
    if (!value) return "Not provided";

    if (typeof Wayora.prettyDate === "function") {
      return Wayora.prettyDate(value);
    }

    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) return String(value);

    const date = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    );

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function getAllBookings() {
    const bookings = Wayora.getBookings();
    return Array.isArray(bookings) ? bookings : [];
  }

  // Show only bookings belonging to the logged-in user.
  function getCurrentUserBookings() {
    return getAllBookings().filter(booking =>
      booking &&
      booking.userId != null &&
      String(booking.userId) === currentUserId
    );
  }

  function findBooking(id) {
    return getCurrentUserBookings().find(
      booking => String(booking.id) === String(id)
    );
  }

  function getPeople(booking) {
    if (
      Array.isArray(booking.passengerDetails) &&
      booking.passengerDetails.length
    ) {
      return booking.passengerDetails;
    }

    return [{
      name: booking.fullName || "Traveller",
      age: booking.age
    }];
  }

  function getMode(booking) {
    const modes = {
      bus: { icon: "BUS", name: "Bus" },
      train: { icon: "TRAIN", name: "Train" },
      flight: { icon: "FLIGHT", name: "Flight" }
    };

    return modes[booking.mode] || {
      icon: "TRAVEL",
      name: booking.modeName || "Journey"
    };
  }

  // --------------------------------------------------
  // CANCELLATION POLICY
  // --------------------------------------------------

  function refundPolicy(booking) {
    const match = String(booking.travelDate || "").match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

    if (!match) {
      return {
        days: null,
        percent: 0,
        label: "Travel date unavailable"
      };
    }

    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);

    const departure = new Date(year, month, day);

    if (
      departure.getFullYear() !== year ||
      departure.getMonth() !== month ||
      departure.getDate() !== day
    ) {
      return {
        days: null,
        percent: 0,
        label: "Travel date unavailable"
      };
    }

    const now = new Date();

    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const days = Math.round(
      (departure.getTime() - today.getTime()) / 86400000
    );

    if (days >= 5) {
      return {
        days,
        percent: 90,
        label: "5 or more days before departure"
      };
    }

    if (days >= 3) {
      return {
        days,
        percent: 70,
        label: "3-4 days before departure"
      };
    }

    if (days >= 1) {
      return {
        days,
        percent: 50,
        label: "1-2 days before departure"
      };
    }

    return {
      days,
      percent: 0,
      label: "Less than 1 day before departure"
    };
  }

  // --------------------------------------------------
  // EMPTY STATE
  // --------------------------------------------------

  function emptyState() {
    let title;
    let description;

    if (filter === "Confirmed") {
      title = "No confirmed bookings.";
      description = "Your confirmed journeys will appear here.";
    } else if (filter === "Cancelled") {
      title = "No cancelled tickets.";
      description = "Cancelled bookings will appear here.";
    } else {
      title = "Your next journey starts here.";
      description =
        "Complete a booking and your ticket details will appear here.";
    }

    return `
      <div class="empty-state">
        <div class="empty-icon">↗</div>
        <h3>${escapeHTML(title)}</h3>
        <p>${escapeHTML(description)}</p>
        <a class="btn btn-primary" href="booking.html">
          Explore journeys →
        </a>
      </div>
    `;
  }

  // --------------------------------------------------
  // BOOKING CARDS
  // --------------------------------------------------

  function ticketHTML(booking) {
    const cancelled = booking.status === "Cancelled";
    const mode = getMode(booking);
    const people = getPeople(booking);

    const seats = Array.isArray(booking.seats)
      ? booking.seats.join(", ") || "Not assigned"
      : booking.seats || "Not assigned";

    const names = people
      .map(person => person.name || "Traveller")
      .join(", ");

    const status = cancelled ? "CANCELLED" : "CONFIRMED";

    const modeIcon = {
      BUS: "🚌",
      TRAIN: "🚂",
      FLIGHT: "✈️"
    }[mode.icon] || "↗";

    return `
      <article class="ticket-card ${
        cancelled ? "ticket-cancelled" : ""
      }">

        <aside class="ticket-rail">
          <span class="ticket-mode"
            aria-label="${escapeHTML(mode.name)}">
            ${modeIcon}
          </span>

          <small>${escapeHTML(booking.modeName || mode.name)}</small>
          <b>${escapeHTML(booking.id || "No reference")}</b>
        </aside>

        <div class="ticket-main">

          <div class="ticket-topline">
            <span class="ticket-status ${
              cancelled ? "cancelled-status" : ""
            }">
              ${status}
            </span>

            <span style="font-size:11px;color:#78869a">
              ${escapeHTML(prettyDate(booking.travelDate))}
            </span>
          </div>

          <div class="ticket-route">
            <div>
              <small>FROM</small>
              <b>${escapeHTML(booking.origin || "Not provided")}</b>
            </div>

            <span class="route-arrow" aria-label="to">→</span>

            <div>
              <small>TO</small>
              <b>${escapeHTML(booking.destination || "Not provided")}</b>
            </div>
          </div>

          <div class="ticket-meta">

            <span>
              <small>DEPARTURE</small>
              <b>${escapeHTML(format12(booking.departureTime))}</b>
            </span>

            <span>
              <small>ARRIVAL</small>
              <b>${escapeHTML(format12(booking.arrivalTime))}</b>
            </span>

            <span>
              <small>PASSENGERS</small>
              <b>${Number(booking.passengers) || people.length}</b>
            </span>

            <span>
              <small>SERVICE</small>
              <b>${escapeHTML(booking.serviceName || "Demo service")}</b>
            </span>

            <span>
              <small>SEATS</small>
              <b>${escapeHTML(seats)}</b>
            </span>

            <span>
              <small>TRAVELLERS</small>
              <b>${escapeHTML(names)}</b>
            </span>

            <span>
              <small>TOTAL FARE</small>
              <b>${escapeHTML(money(booking.fare))}</b>
            </span>

            <span>
              <small>TRAVEL DATE</small>
              <b>${escapeHTML(prettyDate(booking.travelDate))}</b>
            </span>

            <span>
              <small>BOOKING REFERENCE</small>
              <b>${escapeHTML(booking.id || "Not provided")}</b>
            </span>

          </div>

          ${
            cancelled
              ? `
                <div class="refund-status">
                  Estimated demo refund: ${escapeHTML(
                    money(booking.refundAmount)
                  )}.
                  Refund percentage: ${
                    Number(booking.refundPercent) || 0
                  }%.
                  No actual refund was processed.
                </div>
              `
              : ""
          }

          <div class="ticket-actions">

            <button
              class="btn btn-small btn-dark"
              type="button"
              data-action="download"
              data-id="${escapeHTML(booking.id)}">
              Download PDF
            </button>

            ${
              cancelled
                ? ""
                : `
                  <button
                    class="btn btn-small btn-outline"
                    type="button"
                    data-action="cancel"
                    data-id="${escapeHTML(booking.id)}">
                    Cancel booking
                  </button>
                `
            }

          </div>
        </div>
      </article>
    `;
  }

  // --------------------------------------------------
  // RENDER CURRENT USER'S BOOKINGS
  // --------------------------------------------------

  function render() {
    const bookings = getCurrentUserBookings();

    const filtered = bookings
      .filter(booking =>
        filter === "all" || booking.status === filter
      )
      .sort((a, b) =>
        String(b.createdAt || "").localeCompare(
          String(a.createdAt || "")
        )
      );

    if (summary) {
      summary.textContent =
        `${filtered.length} ${
          filtered.length === 1 ? "booking" : "bookings"
        } · Your bookings on this device`;
    }

    container.innerHTML = filtered.length
      ? filtered.map(ticketHTML).join("")
      : emptyState();

    document.querySelectorAll(".filter-chip").forEach(button => {
      const active = button.dataset.filter === filter;

      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  // --------------------------------------------------
  // CANCELLATION MODAL
  // --------------------------------------------------

  function openCancel(id) {
    const booking = findBooking(id);

    if (!booking || booking.status === "Cancelled") return;

    pendingId = String(id);
    previousFocus = document.activeElement;

    const policy = refundPolicy(booking);
    const fare = amount(booking.fare);

    const refund = Math.round(
      (fare * policy.percent / 100) * 100
    ) / 100;

    const retained = Math.round(
      (fare - refund) * 100
    ) / 100;

    let departureMessage;

    if (policy.days === null) {
      departureMessage = "The travel date is unavailable.";
    } else if (policy.days < 0) {
      departureMessage = "The travel date is in the past.";
    } else if (policy.days === 0) {
      departureMessage = "Departure is scheduled for today.";
    } else {
      departureMessage = `Departure is in ${policy.days} day(s).`;
    }

    document.getElementById("cancelDetails").textContent =
      `${booking.modeName || getMode(booking).name}: ` +
      `${booking.origin || "—"} to ${booking.destination || "—"}. ` +
      `${departureMessage} ${policy.label}. ` +
      "This demo cancellation cannot be undone.";

    document.getElementById("cancelAmount").textContent = money(fare);

    document.getElementById("refundAmount").textContent =
      `${money(refund)} (${policy.percent}%)`;

    document.getElementById("retainedAmount").textContent =
      money(retained);

    document.getElementById("refundNote").textContent =
      "Demo policy: 90% refund 5+ days before departure, " +
      "70% at 3-4 days, 50% at 1-2 days, and no refund within " +
      "24 hours. Estimates only; no real money is moved.";

    modal.classList.remove("hidden");

    document.getElementById("confirmCancel").focus();
  }

  function closeCancel() {
    modal.classList.add("hidden");
    pendingId = null;

    if (previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus();
    }

    previousFocus = null;
  }

  function confirmCancellation() {
    if (!pendingId) return;

    // Preserve bookings belonging to other users.
    const bookings = getAllBookings();

    // Verify both booking ID and owner before changing anything.
    const booking = bookings.find(item =>
      String(item.id) === String(pendingId) &&
      item.userId != null &&
      String(item.userId) === currentUserId
    );

    if (!booking || booking.status === "Cancelled") {
      closeCancel();
      render();
      return;
    }

    const policy = refundPolicy(booking);
    const fare = amount(booking.fare);

    booking.status = "Cancelled";
    booking.cancelledAt = new Date().toISOString();
    booking.refundPercent = policy.percent;

    booking.refundAmount = Math.round(
      (fare * policy.percent / 100) * 100
    ) / 100;

    booking.refundDueDate = "Demo only - no real refund";

    Wayora.saveBookings(bookings);

    closeCancel();
    render();
  }

  // --------------------------------------------------
  // PDF TICKET DOWNLOAD
  // --------------------------------------------------

  function downloadTicket(id) {
    // Only allow downloading tickets owned by this user.
    const booking = findBooking(id);

    if (!booking) {
      alert("This booking could not be found in your account.");
      return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert(
        "The PDF library could not load. " +
        "Check your internet connection and try again."
      );
      return;
    }

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true
    });

    const C = {
      navy: [19, 34, 56],
      ink: [35, 48, 67],
      muted: [111, 124, 143],
      line: [222, 228, 236],
      pale: [246, 248, 251],
      white: [255, 255, 255],
      green: [36, 116, 81],
      red: [177, 61, 61]
    };

    const W = 210;
    const M = 15;
    const CW = W - M * 2;

    const cancelled = booking.status === "Cancelled";
    const people = getPeople(booking);
    const mode = getMode(booking);

    const fill = color => doc.setFillColor(...color);
    const stroke = color => doc.setDrawColor(...color);
    const textColor = color => doc.setTextColor(...color);

    function write(
      value,
      x,
      y,
      size = 8,
      color = C.ink,
      bold = false,
      options = {}
    ) {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      textColor(color);
      doc.text(String(value ?? "-"), x, y, options);
    }

    function line(x1, y1, x2, y2) {
      stroke(C.line);
      doc.setLineWidth(0.3);
      doc.line(x1, y1, x2, y2);
    }

    function box(x, y, width, height, color = C.pale) {
      fill(color);
      doc.roundedRect(x, y, width, height, 2, 2, "F");
    }

    function wrap(value, width, maxLines = 2) {
      const lines = doc.splitTextToSize(
        String(value || "Not provided"),
        width
      );

      if (lines.length <= maxLines) return lines;

      const result = lines.slice(0, maxLines);
      const last = result[maxLines - 1];

      result[maxLines - 1] = last.length > 3
        ? last.slice(0, -3) + "..."
        : last;

      return result;
    }

    function section(label, y) {
      write(label.toUpperCase(), M, y, 8, C.navy, true);
      line(M, y + 3, W - M, y + 3);
    }

    // HEADER
    fill(C.navy);
    doc.rect(0, 0, W, 37, "F");

    write("WAYORA", M, 16, 20, C.white, true);
    write("JOURNEYS MADE SIMPLE", M, 23, 7, C.white, true);

    write("E-TICKET", W - M, 16, 10, C.white, true, {
      align: "right"
    });

    write("DEMO DOCUMENT", W - M, 23, 7, C.white, false, {
      align: "right"
    });

    // BOOKING REFERENCE
    box(M, 44, CW, 17, C.pale);

    write("BOOKING REFERENCE", M + 5, 50, 6.5, C.muted, true);
    write(booking.id || "Not provided", M + 5, 57, 12, C.navy, true);

    write("STATUS", W - M - 48, 50, 6.5, C.muted, true);

    write(
      cancelled ? "CANCELLED" : "CONFIRMED",
      W - M - 48,
      57,
      9,
      cancelled ? C.red : C.green,
      true
    );

    // ROUTE CARD
    box(M, 67, CW, 45, C.white);

    stroke(C.line);
    doc.roundedRect(M, 67, CW, 45, 2, 2, "S");

    write("FROM", M + 6, 75, 6.5, C.muted, true);
    write("TO", M + 105, 75, 6.5, C.muted, true);

    wrap(booking.origin, 77, 2).forEach((value, index) => {
      write(value, M + 6, 83 + index * 5, 10, C.navy, true);
    });

    wrap(booking.destination, 76, 2).forEach((value, index) => {
      write(value, M + 105, 83 + index * 5, 10, C.navy, true);
    });

    write("→", M + 89, 85, 7, C.muted, true, {
      align: "center"
    });

    write("TRAVEL DATE", M + 6, 105, 6, C.muted, true);

    write(
      prettyDate(booking.travelDate),
      M + 32,
      105,
      7.5,
      C.ink,
      true
    );

    if (booking.returnDate) {
      write("RETURN", M + 105, 105, 6, C.muted, true);

      write(
        prettyDate(booking.returnDate),
        M + 125,
        105,
        7,
        C.ink,
        true
      );
    }

    // JOURNEY DETAILS
    section("Journey details", 124);

    const details = [
      ["TRANSPORT", booking.modeName || mode.name],
      ["SERVICE", booking.serviceName || "Demo service"],
      ["DEPARTURE", format12(booking.departureTime)],
      ["ARRIVAL", format12(booking.arrivalTime)],
      ["TRAVEL CLASS", booking.travelClass || "Standard"],
      [
        "SEATS",
        Array.isArray(booking.seats)
          ? booking.seats.join(", ") || "Not assigned"
          : booking.seats || "Not assigned"
      ],
      ["PASSENGERS", String(booking.passengers || people.length)],
      [
        "BOOKED ON",
        booking.createdAt
          ? new Date(booking.createdAt).toLocaleDateString("en-IN")
          : "Not provided"
      ]
    ];

    const colW = (CW - 8) / 2;
    const detailStart = 133;

    details.forEach((detail, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);

      const x = M + col * (colW + 8);
      const y = detailStart + row * 18;

      write(detail[0], x, y, 6, C.muted, true);

      wrap(detail[1], colW, 2).forEach((value, lineIndex) => {
        write(value, x, y + 7 + lineIndex * 4, 8, C.ink, true);
      });
    });

    // PASSENGER DETAILS
    const passengerY = 208;

    section(`Passenger details (${people.length})`, passengerY);

    let passengerLineY = passengerY + 10;

    people.slice(0, 4).forEach((person, index) => {
      const name =
        `${index + 1}. ${person.name || `Passenger ${index + 1}`}`;

      write(name, M + 2, passengerLineY, 7.5, C.ink, true);

      write(
        person.age ? `Age ${person.age}` : "Age not provided",
        W - M - 2,
        passengerLineY,
        7,
        C.muted,
        false,
        { align: "right" }
      );

      passengerLineY += 7;
    });

    if (people.length > 4) {
      write(
        `Additional passengers: ${people.length - 4}`,
        M + 2,
        passengerLineY,
        7,
        C.muted
      );

      passengerLineY += 7;
    }

    // CONTACT DETAILS
    const contactY = Math.max(243, passengerLineY + 3);

    section("Booking contact", contactY);

    write("EMAIL", M + 2, contactY + 10, 6, C.muted, true);

    write(
      wrap(booking.email || "Not provided", 77, 1)[0],
      M + 2,
      contactY + 16,
      7,
      C.ink
    );

    write("PHONE", M + 105, contactY + 10, 6, C.muted, true);

    write(
      wrap(booking.phone || "Not provided", 75, 1)[0],
      M + 105,
      contactY + 16,
      7,
      C.ink
    );

    // TOTAL FARE
    const fareY = 267;

    fill(C.navy);
    doc.roundedRect(M, fareY, CW, 13, 2, 2, "F");

    write("TOTAL BOOKING FARE", M + 5, fareY + 8, 7, C.white, true);

    write(
      money(booking.fare),
      W - M - 5,
      fareY + 8,
      10,
      C.white,
      true,
      { align: "right" }
    );

    // FOOTER
    line(M, 285, W - M, 285);

    write(
      "WAYORA | JOURNEYS MADE SIMPLE",
      M,
      290,
      6,
      C.muted,
      true
    );

    write(
      "DEMO ONLY - NOT VALID FOR TRAVEL",
      W - M,
      290,
      6,
      C.muted,
      true,
      { align: "right" }
    );

    write(
      cancelled
        ? `Cancellation record. Estimated demo refund: ${
            money(booking.refundAmount)
          } (${Number(booking.refundPercent) || 0}%)`
        : "No live reservation or real payment was made.",
      W / 2,
      295,
      5.5,
      C.muted,
      false,
      { align: "center" }
    );

    const safeId = String(booking.id || "ticket")
      .replace(/[^a-z0-9_-]/gi, "-")
      .slice(0, 60);

    doc.save(`Wayora-${safeId}-ticket.pdf`);
  }

  // --------------------------------------------------
  // EVENT LISTENERS
  // --------------------------------------------------

  document.querySelectorAll(".filter-chip").forEach(button => {
    button.addEventListener("click", () => {
      filter = button.dataset.filter || "all";
      render();
    });
  });

  container.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;

    if (button.dataset.action === "download") {
      downloadTicket(id);
    }

    if (button.dataset.action === "cancel") {
      openCancel(id);
    }
  });

  const closeButton = document.getElementById("closeCancel");
  const keepButton = document.getElementById("keepBooking");
  const confirmButton = document.getElementById("confirmCancel");

  if (closeButton) {
    closeButton.addEventListener("click", closeCancel);
  }

  if (keepButton) {
    keepButton.addEventListener("click", closeCancel);
  }

  if (confirmButton) {
    confirmButton.addEventListener("click", confirmCancellation);
  }

  modal.addEventListener("click", event => {
    if (event.target === modal) {
      closeCancel();
    }
  });

  document.addEventListener("keydown", event => {
    if (
      event.key === "Escape" &&
      !modal.classList.contains("hidden")
    ) {
      closeCancel();
    }
  });

  // Refresh if bookings change in another browser tab.
  window.addEventListener("storage", event => {
    if (event.key === "wayora_bookings") {
      render();
    }
  });

  // Initialize the booking history page.
  render();
})();