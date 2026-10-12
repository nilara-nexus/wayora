
(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);

  // -----------------------------------------------
  // WAYORA AUTHENTICATION
  // -----------------------------------------------
  const auth = window.WayoraAuth;

  if (!auth || !auth.isAuthenticated()) {
    location.replace(
      "auth.html?next=" + encodeURIComponent("booking.html")
    );
    return;
  }

  const currentUserId = auth.getCurrentUserId();

  if (currentUserId == null || !window.Wayora) {
    console.error(
      "Wayora authentication or booking storage is unavailable."
    );
    return;
  }

  // -----------------------------------------------
  // INITIAL SETTINGS
  // -----------------------------------------------
  let mode = ["bus", "train", "flight"].includes(params.get("mode"))
    ? params.get("mode")
    : "bus";

  let selectedSeats = [];
  let selectedService = null;

  const baseFares = {
    bus: 850,
    train: 1250,
    flight: 5200
  };

  const multipliers = {
    Standard: 1,
    Comfort: 1.45,
    Premium: 2.1,
    Sleeper: 1,
    "3 AC": 1.45,
    "2 AC": 1.9,
    "Chair Car": 1.2,
    "1 AC": 2.7,
    Economy: 1,
    "Premium Economy": 1.55,
    Business: 3.3,
    First: 5.5
  };

  const modeNames = {
    bus: "Bus",
    train: "Train",
    flight: "Flight"
  };

  const modeFields = {
    bus: "busFields",
    train: "trainFields",
    flight: "flightFields"
  };

  // -----------------------------------------------
  // DATE SETUP
  // -----------------------------------------------
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());

  $("travelDate").min = today.toISOString().slice(0, 10);

  function currentClass() {
    if (mode === "bus") return $("travelClass").value;
    if (mode === "train") return $("trainClass").value;
    return $("cabin").value;
  }

  function fare() {
    const unitFare =
      selectedService?.price ||
      baseFares[mode] * (multipliers[currentClass()] || 1);

    return Math.round(
      unitFare * Number($("passengers").value || 1)
    );
  }

  // -----------------------------------------------
  // DEMO TRANSPORT SERVICES
  // -----------------------------------------------
  const serviceCatalog = {
    bus: [
      {
        name: "Wayora Coastal Express",
        type: "Non-AC Seater",
        depart: "06:15",
        arrive: "10:45",
        duration: "4h 30m",
        price: 850,
        route: "Wayora route",
        stops: [
          "Origin Bus Terminal",
          "Central Bus Stand",
          "Destination Bus Terminal"
        ]
      },
      {
        name: "Wayora CityLink",
        type: "AC Seater",
        depart: "09:00",
        arrive: "13:20",
        duration: "4h 20m",
        price: 680,
        route: "Wayora route",
        stops: [
          "Origin Bus Terminal",
          "Highway Rest Stop",
          "Destination Bus Terminal"
        ]
      },
      {
        name: "Wayora Premium Roadliner",
        type: "Volvo Multi-Axle",
        depart: "12:30",
        arrive: "16:40",
        duration: "4h 10m",
        price: 1050,
        route: "Wayora route",
        stops: [
          "Origin Bus Terminal",
          "Destination Bus Terminal"
        ]
      },
      {
        name: "Wayora Night Voyager",
        type: "AC Sleeper",
        depart: "21:30",
        arrive: "02:15",
        duration: "4h 45m",
        price: 920,
        route: "Wayora route",
        stops: [
          "Origin Bus Terminal",
          "Destination Bus Terminal"
        ]
      }
    ],

    train: [
      {
        name: "Southern Intercity Express",
        type: "Express",
        depart: "06:40",
        arrive: "10:25",
        duration: "3h 45m",
        price: 420,
        route: "Railway route",
        stops: [
          "Origin Junction",
          "Central Junction",
          "Destination Junction"
        ]
      },
      {
        name: "Regional Passenger",
        type: "Passenger",
        depart: "09:15",
        arrive: "14:00",
        duration: "4h 45m",
        price: 220,
        route: "Railway route",
        stops: [
          "Origin Junction",
          "Town Station",
          "Destination Junction"
        ]
      },
      {
        name: "Coastal Superfast",
        type: "Superfast",
        depart: "15:20",
        arrive: "18:35",
        duration: "3h 15m",
        price: 620,
        route: "Railway route",
        stops: [
          "Origin Junction",
          "Destination Junction"
        ]
      },
      {
        name: "Overnight Mail",
        type: "Mail/Express",
        depart: "22:10",
        arrive: "03:50",
        duration: "5h 40m",
        price: 540,
        route: "Railway route",
        stops: [
          "Origin Junction",
          "Destination Junction"
        ]
      }
    ],

    flight: [
      {
        name: "Wayora Air Connect · Demo 101",
        type: "First",
        depart: "07:10",
        arrive: "08:25",
        duration: "1h 15m",
        price: 5200,
        route: "Airport-to-airport",
        stops: [
          "Origin Airport",
          "Destination Airport"
        ]
      },
      {
        name: "Wayora Air Connect · Demo 204",
        type: "Economy",
        depart: "11:40",
        arrive: "13:00",
        duration: "1h 20m",
        price: 6100,
        route: "Airport-to-airport",
        stops: [
          "Origin Airport",
          "Destination Airport"
        ]
      },
      {
        name: "Wayora Air Connect · Demo 318",
        type: "Premium Economy",
        depart: "16:25",
        arrive: "17:40",
        duration: "1h 15m",
        price: 7400,
        route: "Airport-to-airport",
        stops: [
          "Origin Airport",
          "Destination Airport"
        ]
      },
      {
        name: "Wayora Air Connect · Demo 420",
        type: "Business",
        depart: "20:50",
        arrive: "22:10",
        duration: "1h 20m",
        price: 5600,
        route: "Airport-to-airport",
        stops: [
          "Origin Airport",
          "Destination Airport"
        ]
      }
    ]
  };

  // -----------------------------------------------
  // CITY COORDINATES
  // -----------------------------------------------
  const cities = {
    chennai: [13.0827, 80.2707],
    bengaluru: [12.9716, 77.5946],
    bangalore: [12.9716, 77.5946],
    pondicherry: [11.9416, 79.8083],
    puducherry: [11.9416, 79.8083],
    madurai: [9.9252, 78.1198],
    coimbatore: [11.0168, 76.9558],
    trichy: [10.7905, 78.7047],
    tiruchirappalli: [10.7905, 78.7047],
    salem: [11.6643, 78.146],
    vellore: [12.9165, 79.1325],
    tirunelveli: [8.7139, 77.7567],
    thanjavur: [10.787, 79.1378],
    erode: [11.341, 77.7172],
    tiruppur: [11.1085, 77.3411],
    dindigul: [10.3673, 77.9803],
    karaikal: [10.9254, 79.838],
    cuddalore: [11.748, 79.7714],
    villupuram: [11.9401, 79.4861],
    kanchipuram: [12.8185, 79.6947],
    hyderabad: [17.385, 78.4867],
    vijayawada: [16.5062, 80.648],
    visakhapatnam: [17.6868, 83.2185],
    vizag: [17.6868, 83.2185],
    tirupati: [13.6288, 79.4192],
    kochi: [9.9312, 76.2673],
    ernakulam: [9.9816, 76.2999],
    thiruvananthapuram: [8.5241, 76.9366],
    trivandrum: [8.5241, 76.9366],
    calicut: [11.2588, 75.7804],
    kozhikode: [11.2588, 75.7804],
    thrissur: [10.5276, 76.2144],
    mumbai: [19.076, 72.8777],
    pune: [18.5204, 73.8567],
    nagpur: [21.1458, 79.0882],
    delhi: [28.6139, 77.209],
    "new delhi": [28.6139, 77.209],
    gurugram: [28.4595, 77.0266],
    gurgaon: [28.4595, 77.0266],
    noida: [28.5355, 77.391],
    jaipur: [26.9124, 75.7873],
    ahmedabad: [23.0225, 72.5714],
    surat: [21.1702, 72.8311],
    vadodara: [22.3072, 73.1812],
    kolkata: [22.5726, 88.3639],
    bhubaneswar: [20.2961, 85.8245],
    patna: [25.5941, 85.1376],
    lucknow: [26.8467, 80.9462],
    kanpur: [26.4499, 80.3319],
    varanasi: [25.3176, 82.9739],
    agra: [27.1767, 78.0081],
    amritsar: [31.634, 74.8723],
    chandigarh: [30.7333, 76.7794],
    indore: [22.7196, 75.8577],
    bhopal: [23.2599, 77.4126],
    ranchi: [23.3441, 85.3096],
    guwahati: [26.1445, 91.7362],
    mysuru: [12.2958, 76.6394],
    mysore: [12.2958, 76.6394],
    mangaluru: [12.9141, 74.856],
    mangalore: [12.9141, 74.856],
    hubballi: [15.3647, 75.124],
    belagavi: [15.8497, 74.4977],
    shimla: [31.1048, 77.1734],
    dehradun: [30.3165, 78.0322],
    srinagar: [34.0837, 74.7973],
    jammu: [32.7266, 74.857],
    goa: [15.2993, 74.124],
    panaji: [15.4909, 73.8278],
    raipur: [21.2514, 81.6296],
    jodhpur: [26.2389, 73.0243],
    udaipur: [24.5854, 73.7125],
    jabalpur: [23.1815, 79.9864],
    gwalior: [26.2183, 78.1828],
    meerut: [28.9845, 77.7064],
    bareilly: [28.367, 79.4304],
    "kozhikode city": [11.2588, 75.7804]
  };

  const normalizePlace = value =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/,.*$/, "");

  const cityCoords = name =>
    cities[normalizePlace(name)] || null;

  // -----------------------------------------------
  // ROUTE AND FARE ESTIMATES
  // -----------------------------------------------
  function routeEstimate(origin, dest) {
    const a = cityCoords(origin);
    const b = cityCoords(dest);

    if (!a || !b) return null;

    const rad = x => x * Math.PI / 180;
    const dLat = rad(b[0] - a[0]);
    const dLon = rad(b[1] - a[1]);

    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(a[0])) *
      Math.cos(rad(b[0])) *
      Math.sin(dLon / 2) ** 2;

    const airKm =
      6371 * 2 *
      Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

    const factors = {
      bus: 1.28,
      train: 1.18,
      flight: 1
    };

    const km = Math.max(
      8,
      Math.round(airKm * factors[mode])
    );

    const speed = {
      bus: 48,
      train: 62,
      flight: 700
    }[mode];

    let minutes = Math.max(
      mode === "flight" ? 65 : mode === "train" ? 30 : 35,
      Math.round(
        km / speed * 60 +
        (mode === "bus" ? 45 : mode === "train" ? 30 : 110)
      )
    );

    if (mode === "flight" && km > 1800) {
      minutes += Math.round(km / 1000 * 8);
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    const duration = hours
      ? `${hours}h ${String(mins).padStart(2, "0")}m`
      : `${mins}m`;

    const farePerKm = {
      bus: 1.25,
      train: 0.72,
      flight: 4.1
    }[mode];

    const estimatedFare = Math.max(
      mode === "flight" ? 2200 : mode === "train" ? 90 : 150,
      Math.round(km * farePerKm / 10) * 10
    );

    const stops = [];

    if (mode !== "flight" && airKm > 250) {
      stops.push("Intermediate stop (route estimate)");
    }

    return {
      km,
      minutes,
      duration,
      fare: estimatedFare,
      stops,
      airKm: Math.round(airKm)
    };
  }

  function addMinutes(time, minutes) {
    const [h, m] = time.split(":").map(Number);
    const total = (h * 60 + m + minutes) % (24 * 60);

    return (
      String(Math.floor(total / 60)).padStart(2, "0") +
      ":" +
      String(total % 60).padStart(2, "0")
    );
  }

  function format12(time) {
    const [hh, mm] = time.split(":").map(Number);
    const suffix = hh >= 12 ? "PM" : "AM";
    const h = hh % 12 || 12;

    return `${h}:${String(mm).padStart(2, "0")} ${suffix}`;
  }

  function routeStops(service) {
    const origin = $("origin").value.trim();
    const destination = $("destination").value.trim();

    if (mode === "bus") {
      return [
        origin + " Bus Stand",
        ...(service.stops || []),
        destination + " Bus Stand"
      ];
    }

    if (mode === "train") {
      return [
        origin + " Railway Station",
        ...(service.stops || []),
        destination + " Railway Station"
      ];
    }

    return [
      origin + " Airport",
      destination + " Airport"
    ];
  }

  // -----------------------------------------------
  // BOOKING STORAGE HELPERS
  // -----------------------------------------------
  function getSeatBookings() {
    const bookings = window.Wayora.getBookings();
    return Array.isArray(bookings) ? bookings : [];
  }

  function getBookedSeats() {
    if (!selectedService || !$("travelDate").value) {
      return [];
    }

    const serviceName = selectedService.name;
    const travelDate = $("travelDate").value;
    const origin = normalizePlace($("origin").value);
    const destination = normalizePlace($("destination").value);

    return getSeatBookings()
      .filter(booking => {
        return (
          booking.status !== "Cancelled" &&
          booking.mode === mode &&
          booking.serviceName === serviceName &&
          booking.travelDate === travelDate &&
          normalizePlace(booking.origin) === origin &&
          normalizePlace(booking.destination) === destination
        );
      })
      .flatMap(booking => {
        if (Array.isArray(booking.seats)) {
          return booking.seats;
        }

        return booking.seats ? [booking.seats] : [];
      })
      .map(seat => String(seat));
  }

  function isSeatBooked(seat) {
    return getBookedSeats().includes(String(seat));
  }

  // Check seat availability against the latest stored bookings.
  function findConflictingSeats(booking) {
    const allBookings = getSeatBookings();

    const bookedSeats = new Set(
      allBookings
        .filter(item =>
          item.status !== "Cancelled" &&
          item.mode === booking.mode &&
          item.serviceName === booking.serviceName &&
          item.travelDate === booking.travelDate &&
          normalizePlace(item.origin) ===
            normalizePlace(booking.origin) &&
          normalizePlace(item.destination) ===
            normalizePlace(booking.destination)
        )
        .flatMap(item => {
          if (Array.isArray(item.seats)) {
            return item.seats;
          }

          return item.seats ? [item.seats] : [];
        })
        .map(String)
    );

    return booking.seats.filter(seat =>
      bookedSeats.has(String(seat))
    );
  }

  // -----------------------------------------------
  // DISPLAY SERVICES
  // -----------------------------------------------
  function renderServices() {
    const panel = $("journeyResults");

    if (!panel) return;

    const origin = $("origin").value.trim();
    const dest = $("destination").value.trim();
    const date = $("travelDate").value;

    selectedService = null;
    selectedSeats = [];

    if (!origin || !dest || !date) {
      panel.innerHTML = `
        <div class="results-empty">
          <b>Find your journey</b>
          <p>
            Enter your origin, destination and date
            to view available demo services.
          </p>
        </div>
      `;

      renderSeats();
      updateSummary();
      return;
    }

    if (origin.toLowerCase() === dest.toLowerCase()) {
      panel.innerHTML = `
        <div class="results-empty">
          <b>Choose two different places</b>
          <p>Your origin and destination must be different.</p>
        </div>
      `;

      renderSeats();
      updateSummary();
      updateRouteMap(null);
      return;
    }

    const routeInfo = routeEstimate(origin, dest);

    if (!routeInfo) {
      panel.innerHTML = `
        <div class="results-empty">
          <b>Route details are not available for this city pair</b>
          <p>
            Wayora cannot estimate this route because one or both
            places are not in its current city directory.
            Try a supported city name.
          </p>
          <small>
            Missing route data does not mean real-world transport is unavailable.
          </small>
        </div>
      `;

      renderSeats();
      updateSummary();
      updateRouteMap(null);
      return;
    }

    const icon =
      mode === "bus" ? "🚌" :
      mode === "train" ? "🚆" : "✈️";

    const routeLabel =
      mode === "bus" ? "Bus route" :
      mode === "train" ? "Train route" : "Flight route";

    const services = serviceCatalog[mode].map((service, index) => ({
      ...service,
      duration: routeInfo.duration,
      minutes: routeInfo.minutes,
      distance: routeInfo.km,
      price: routeInfo.fare +
        index * (
          mode === "flight" ? 350 :
          mode === "train" ? 75 : 60
        ),
      arrive: addMinutes(service.depart, routeInfo.minutes),
      stops: routeInfo.stops
    }));

    panel.innerHTML = `
      <div class="results-heading">
        <div>
          <span class="eyebrow">
            <span></span>
            <h3>${modeNames[mode].toUpperCase()} SCHEDULE</h3>
          </span>
          <h3>Configured ${modeNames[mode].toLowerCase()} routes</h3>
          <p>
            ${Wayora.escape(origin)} → ${Wayora.escape(dest)}
            · ${routeInfo.km} km estimated
            · ${Wayora.escape(Wayora.prettyDate(date))}
          </p>
        </div>
        <span class="results-icon">${icon}</span>
      </div>

      <div class="service-list">
        ${services.map((service, index) => `
          <article class="service-card">
            <div class="service-icon">${icon}</div>

            <div class="service-content">
              <b>${Wayora.escape(service.name)}</b>

              <small>
                ${Wayora.escape(service.type)}
                · ${Wayora.escape(routeLabel)}
              </small>

              <div class="service-times">
                <b>${format12(service.depart)}</b>
                <span>${service.duration} · ${service.distance} km</span>
                <b>
                  ${format12(service.arrive)}
                  ${service.arrive < service.depart ? " (+1 day)" : ""}
                </b>
              </div>

              <small class="service-route">
                ${Wayora.escape(routeStops(service).join(" → "))}
              </small>
            </div>

            <div class="service-price">
              <b>${Wayora.money(service.price)}</b>
              <small>per passenger · demo</small>
              <button
                type="button"
                class="btn btn-small btn-dark"
                data-service="${index}">
                Select
              </button>
            </div>
          </article>
        `).join("")}
      </div>

      <p class="demo-schedule-note">
        Distance, journey duration, arrival time and fares are estimates.
        Departure slots are demo times, not live operator schedules
        or availability.
      </p>
    `;

    panel.querySelectorAll("[data-service]").forEach(button => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.service);

        selectedService = {
          ...services[index],
          stops: routeStops(services[index]),
          routeLabel
        };

        panel.querySelectorAll(".service-card").forEach(card => {
          card.classList.remove("service-selected");
        });

        button.closest(".service-card")
          .classList.add("service-selected");

        panel.querySelectorAll("[data-service]").forEach(otherButton => {
          otherButton.textContent =
            otherButton === button ? "Selected" : "Select";
        });

        // IMPORTANT:
        // Rebuild the seat map after selecting the service.
        // Previously booked seats are now disabled immediately.
        selectedSeats = [];
        renderSeats();
        updateSummary();

        $("formMessage").textContent =
          "Selected " + selectedService.name +
          ". Choose your seats and enter passenger details.";
      });
    });

    renderSeats();
    updateSummary();
    updateRouteMap(routeInfo);
  }

  // -----------------------------------------------
  // MAP PREVIEW
  // -----------------------------------------------
  function updateRouteMap(routeInfo) {
    const origin = $("origin").value.trim();
    const dest = $("destination").value.trim();

    if (!origin || !dest || !routeInfo) return;

    const travelMode =
      mode === "bus" ? "driving" :
      mode === "train" ? "transit" : "driving";

    const mapUrl =
      "https://www.google.com/maps/dir/?api=1" +
      "&origin=" + encodeURIComponent(origin) +
      "&destination=" + encodeURIComponent(dest) +
      "&travelmode=" + travelMode;

    $("routeMap").src =
      "https://www.google.com/maps?output=embed" +
      "&saddr=" + encodeURIComponent(origin) +
      "&daddr=" + encodeURIComponent(dest);

    const sideMap = document.querySelector(".side-map");
    let metrics = document.getElementById("routeMapMetrics");

    if (!metrics && sideMap) {
      metrics = document.createElement("div");
      metrics.id = "routeMapMetrics";
      metrics.className = "route-map-metrics";
      $("routeMap").before(metrics);
    }

    if (metrics) {
      metrics.innerHTML = `
        <b>${routeInfo.km.toLocaleString()} km estimated</b>
        <span>${Wayora.escape(routeInfo.duration)} estimated</span>
        <a
          href="${mapUrl}"
          target="_blank"
          rel="noopener noreferrer">
          Open directions ↗
        </a>
        <small>
          Map route is a visual guide. Wayora distances and durations
          are estimates, not live operator or map API calculations.
        </small>
      `;
    }

    const note = document.querySelector(".side-map>small");

    if (note) {
      note.textContent =
        mode === "bus"
          ? "Road directions preview · estimated Wayora bus journey."
          : mode === "train"
            ? "Directions preview for the same city pair · rail distance is an estimate."
            : "City-pair directions preview · flight distance is estimated airport-to-airport.";
    }
  }

  // -----------------------------------------------
  // BOOKING SUMMARY
  // -----------------------------------------------
  function updateSummary() {
    $("sumOrigin").textContent =
      $("origin").value.trim() || "Your starting point";

    $("sumDestination").textContent =
      $("destination").value.trim() || "Your destination";

    $("sumMode").textContent = modeNames[mode];

    $("sumDate").textContent =
      Wayora.prettyDate($("travelDate").value);

    $("sumPassengers").textContent =
      $("passengers").value +
      (Number($("passengers").value) === 1
        ? " person"
        : " persons");

    $("sumTotal").textContent = Wayora.money(fare());

    const serviceLine = document.getElementById("sumService");

    if (serviceLine) {
      serviceLine.textContent = selectedService
        ? selectedService.name
        : "Select a service above";
    }

    $("seatHint").textContent =
      `Select ${$("passengers").value} seat` +
      `${Number($("passengers").value) > 1 ? "s" : ""}`;
  }

  // -----------------------------------------------
  // ADDITIONAL PASSENGER FIELDS
  // -----------------------------------------------
  function renderPassengerFields() {
    const wrap = $("additionalPassengers");
    const count = Number($("passengers").value);

    const old = Array.from(
      wrap.querySelectorAll("[data-passenger-index]")
    );

    const values = old.map(card => ({
      name: card.querySelector('[data-field="name"]')?.value || "",
      age: card.querySelector('[data-field="age"]')?.value || "",
      gender: card.querySelector('[data-field="gender"]')?.value || ""
    }));

    wrap.innerHTML = "";

    for (let i = 2; i <= count; i++) {
      const value = values[i - 2] || {};
      const card = document.createElement("section");

      card.className = "passenger-detail-card";
      card.dataset.passengerIndex = String(i);

      card.innerHTML = `
        <div class="passenger-card-heading">
          <span>${String(i).padStart(2, "0")}</span>
          <div>
            <b>Passenger ${i}</b>
            <small>Enter details for this traveller</small>
          </div>
        </div>

        <div class="form-grid">
          <label>
            Full name
            <input
              data-field="name"
              required
              autocomplete="off"
              placeholder="Passenger ${i} full name"
              value="${Wayora.escape(value.name)}">
          </label>

          <label>
            Age
            <input
              data-field="age"
              required
              type="number"
              min="1"
              max="120"
              placeholder="Age"
              value="${Wayora.escape(value.age)}">
          </label>

          <label>
            Gender (optional)
            <select data-field="gender">
              <option value="">Prefer not to say</option>
              <option
                ${value.gender === "Female" ? "selected" : ""}>
                Female
              </option>
              <option
                ${value.gender === "Male" ? "selected" : ""}>
                Male
              </option>
              <option
                ${value.gender === "Other" ? "selected" : ""}>
                Other
              </option>
            </select>
          </label>
        </div>
      `;

      wrap.appendChild(card);
    }
  }

  function collectPassengers() {
    const people = [{
      name: $("fullName").value.trim(),
      age: Number($("age").value),
      email: $("email").value.trim(),
      phone: $("phone").value.trim(),
      gender: ""
    }];

    $("additionalPassengers")
      .querySelectorAll("[data-passenger-index]")
      .forEach(card => {
        people.push({
          name: card.querySelector('[data-field="name"]').value.trim(),
          age: Number(card.querySelector('[data-field="age"]').value),
          gender:
            card.querySelector('[data-field="gender"]').value || ""
        });
      });

    return people;
  }

  // -----------------------------------------------
  // SEAT MAP
  // -----------------------------------------------
  function renderSeats() {
    const map = $("seatMap");

    if (!map) return;

    map.innerHTML = "";
    selectedSeats = [];

    const count = Number($("passengers").value) || 1;

    map.className = "seat-map seat-map-" + mode;

    const seatTop = document.querySelector(
      ".seat-map-top span:first-child"
    );

    if (seatTop) {
      seatTop.textContent =
        mode === "flight"
          ? "FRONT / COCKPIT"
          : mode === "train"
            ? "TRAIN COACH"
            : "FRONT / DRIVER";
    }

    const rows = mode === "flight" ? 6 : 8;
    const cols = mode === "flight" ? 6 : 4;

    for (let r = 1; r <= rows; r++) {
      const row = document.createElement("div");
      row.className = "seat-row";

      for (let c = 1; c <= cols; c++) {
        if (
          (mode === "flight" && c === 4) ||
          (mode === "train" && c === 3)
        ) {
          const aisle = document.createElement("span");
          aisle.className = "seat-aisle";
          row.appendChild(aisle);
        }

        const letter = String.fromCharCode(64 + c);

        const seat =
          (mode === "flight"
            ? "F"
            : mode === "train"
              ? "T"
              : "B") +
          r +
          letter;

        // Booked seats are disabled only for the selected service,
        // route and departure date.
        const serviceSelected = Boolean(selectedService);
        const booked = serviceSelected && isSeatBooked(seat);

        const button = document.createElement("button");
        button.type = "button";
        button.className = "seat" + (booked ? " occupied" : "");
        button.textContent = seat;
        button.disabled = booked || !serviceSelected;

        button.setAttribute(
          "aria-label",
          seat + (
            booked
              ? ", unavailable"
              : serviceSelected
                ? ", available"
                : ", select a service first"
          )
        );

        if (booked) {
          button.title = "This seat has already been booked";
        } else if (!serviceSelected) {
          button.title = "Select a transport service first";
        }

        button.addEventListener("click", () => {
          if (!selectedService) {
            $("formMessage").textContent =
              "Please select a transport service first.";
            return;
          }

          // Recheck current storage before allowing selection.
          if (isSeatBooked(seat)) {
            button.classList.remove("selected");
            button.classList.add("occupied");
            button.disabled = true;

            selectedSeats = selectedSeats.filter(
              selected => selected !== seat
            );

            $("formMessage").textContent =
              "Sorry, this seat has already been booked. Please select another.";

            $("seatHint").textContent =
              `${selectedSeats.length} of ${count} selected`;

            return;
          }

          if (selectedSeats.includes(seat)) {
            selectedSeats = selectedSeats.filter(
              selected => selected !== seat
            );

            button.classList.remove("selected");
          } else if (selectedSeats.length < count) {
            selectedSeats.push(seat);
            button.classList.add("selected");
          } else {
            $("formMessage").textContent =
              `Please select only ${count} seat${count > 1 ? "s" : ""}.`;

            return;
          }

          $("formMessage").textContent = "";

          $("seatHint").textContent =
            `${selectedSeats.length} of ${count} selected`;
        });

        row.appendChild(button);
      }

      map.appendChild(row);
    }

    $("seatHint").textContent = selectedService
      ? `Select ${count} seat${count > 1 ? "s" : ""}`
      : "Select a service first";
  }

  // -----------------------------------------------
  // TRANSPORT MODE
  // -----------------------------------------------
  function setMode(next) {
    mode = next;

    selectedService = null;
    selectedSeats = [];

    document.querySelectorAll(".mode-tab").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.mode === mode
      );
    });

    Object.entries(modeFields).forEach(([key, id]) => {
      $(id).classList.toggle("hidden", key !== mode);
    });

    $("classWrap").classList.toggle("hidden", mode !== "bus");

    $("returnWrap").classList.toggle(
      "hidden",
      mode !== "flight" ||
      $("tripType").value !== "Round trip"
    );

    renderSeats();
    updateSummary();

    if (
      $("origin").value.trim() &&
      $("destination").value.trim() &&
      $("travelDate").value
    ) {
      renderServices();
    }
  }

  document.querySelectorAll(".mode-tab").forEach(button => {
    button.addEventListener("click", () => {
      if (["bus", "train", "flight"].includes(button.dataset.mode)) {
        setMode(button.dataset.mode);
      }
    });
  });

  // -----------------------------------------------
  // FORM INPUT EVENTS
  // -----------------------------------------------
  [
    "origin",
    "destination",
    "travelDate",
    "passengers",
    "travelClass",
    "trainClass",
    "cabin"
  ].forEach(id => {
    $(id).addEventListener("input", () => {
      if (["origin", "destination", "travelDate"].includes(id)) {
        renderServices();
      } else {
        updateSummary();
      }

      if (id === "passengers") {
        renderSeats();
        renderPassengerFields();
      }
    });
  });

  $("tripType").addEventListener("change", () => {
    $("returnWrap").classList.toggle(
      "hidden",
      $("tripType").value !== "Round trip"
    );

    $("returnDate").required =
      $("tripType").value === "Round trip";
  });

  $("travelDate").addEventListener("change", () => {
    $("returnDate").min = $("travelDate").value;
  });

  // -----------------------------------------------
  // INITIALIZE BOOKING PAGE
  // -----------------------------------------------
  renderPassengerFields();
  setMode(mode);

  // -----------------------------------------------
  // CONFIRM BOOKING
  // -----------------------------------------------
  $("bookingForm").addEventListener("submit", event => {
    event.preventDefault();

    // Verify authentication before booking.
    if (!auth.isAuthenticated()) {
      location.replace(
        "auth.html?next=" + encodeURIComponent("booking.html")
      );
      return;
    }

    const verifiedUserId = auth.getCurrentUserId();

    if (
      verifiedUserId == null ||
      String(verifiedUserId) !== String(currentUserId)
    ) {
      $("formMessage").textContent =
        "Your session changed. Please sign in again before booking.";
      return;
    }

    if (!selectedService) {
      $("formMessage").textContent =
        "Please search and select a service first.";

      $("journeyResults").scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      return;
    }

    if (
      selectedSeats.length !== Number($("passengers").value)
    ) {
      $("formMessage").textContent =
        `Please select ${$("passengers").value} seat` +
        `${Number($("passengers").value) > 1 ? "s" : ""} before confirming.`;

      return;
    }

    if (
      mode === "flight" &&
      $("tripType").value === "Round trip" &&
      (
        !$("returnDate").value ||
        $("returnDate").value < $("travelDate").value
      )
    ) {
      $("formMessage").textContent =
        "Please choose a return date on or after your departure date.";

      return;
    }

    const paymentInput = document.querySelector(
      'input[name="payment"]:checked'
    );

    if (!paymentInput) {
      $("formMessage").textContent =
        "Please select a payment method.";
      return;
    }

    // Recheck seat availability using the latest stored bookings.
    const bookingCandidate = {
      mode,
      serviceName: selectedService.name,
      travelDate: $("travelDate").value,
      origin: $("origin").value.trim(),
      destination: $("destination").value.trim(),
      seats: selectedSeats.slice()
    };

    const conflictingSeats = findConflictingSeats(bookingCandidate);

    if (conflictingSeats.length > 0) {
      $("formMessage").textContent =
        "Seat " + conflictingSeats.join(", ") +
        " has already been booked. Please select another seat.";

      renderSeats();
      return;
    }

    const booking = {
      id: Wayora.makeId(),
      userId: String(verifiedUserId),

      createdAt: new Date().toISOString(),
      status: "Confirmed",

      mode,
      modeName: modeNames[mode],

      origin: $("origin").value.trim(),
      destination: $("destination").value.trim(),
      travelDate: $("travelDate").value,

      returnDate:
        mode === "flight" && $("tripType").value === "Round trip"
          ? $("returnDate").value
          : "",

      passengers: Number($("passengers").value),
      travelClass: currentClass(),
      seats: selectedSeats.slice(),

      fullName: $("fullName").value.trim(),
      email: $("email").value.trim(),
      phone: $("phone").value.trim(),
      age: Number($("age").value),

      passengerDetails: collectPassengers(),

      fare: fare(),
      unitFare: selectedService.price,
      payment: paymentInput.value,

      serviceName: selectedService.name,
      departureTime: selectedService.depart,
      arrivalTime: selectedService.arrive,
      duration: selectedService.duration,
      distanceKm: selectedService.distance,
      routeStops: selectedService.stops,
      routeLabel: selectedService.routeLabel,

      preferences:
        mode === "bus"
          ? `${$("busType").value}; boarding: ${
              $("boarding").value || "Not specified"
            }; drop: ${$("dropPoint").value || "Not specified"}`
          : mode === "train"
            ? `Train: ${$("trainName").value || "Any available"}; berth: ${
                $("berth").value
              }`
            : `Airline: ${$("airline").value || "Any airline"}; trip: ${
                $("tripType").value
              }; seat: ${$("flightSeat").value}`,

      refundAmount: 0,
      cancelledAt: ""
    };

    // -----------------------------------------------
    // FINAL AVAILABILITY CHECK AND SAVE
    // -----------------------------------------------
    // Read the latest list again so we don't overwrite bookings
    // that were added after this page was first opened.
    const latestBookings = Wayora.getBookings();

    if (!Array.isArray(latestBookings)) {
      $("formMessage").textContent =
        "Booking storage is unavailable. Please try again.";
      return;
    }

    const bookedSeatsNow = new Set(
      latestBookings
        .filter(item =>
          item.status !== "Cancelled" &&
          item.mode === booking.mode &&
          item.serviceName === booking.serviceName &&
          item.travelDate === booking.travelDate &&
          normalizePlace(item.origin) ===
            normalizePlace(booking.origin) &&
          normalizePlace(item.destination) ===
            normalizePlace(booking.destination)
        )
        .flatMap(item =>
          Array.isArray(item.seats)
            ? item.seats
            : item.seats ? [item.seats] : []
        )
        .map(String)
    );

    const seatsTaken = booking.seats.filter(seat =>
      bookedSeatsNow.has(String(seat))
    );

    if (seatsTaken.length > 0) {
      $("formMessage").textContent =
        "Seat " + seatsTaken.join(", ") +
        " is no longer available. Please select different seats.";

      renderSeats();
      return;
    }

    // Save exactly once. Preserve all existing bookings.
    latestBookings.unshift(booking);
    Wayora.saveBookings(latestBookings);

    // Refresh the map so the newly booked seats turn unavailable.
    renderSeats();

    $("formMessage").textContent =
      "Booking confirmed! Your unique booking number is " +
      booking.id +
      ". Opening your ticket history…";

    const submitButton = document.querySelector(".submit-booking");

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Booking confirmed ✓";
    }

    setTimeout(() => {
      location.href =
        "history.html?new=" + encodeURIComponent(booking.id);
    }, 900);
  });

  // -----------------------------------------------
  // LIVE REFRESH WHEN STORAGE CHANGES IN ANOTHER TAB
  // -----------------------------------------------
  window.addEventListener("storage", event => {
    if (
      event.key === "wayora_bookings" ||
      event.key === null
    ) {
      renderSeats();
    }
  });

  // Refresh when the user returns to the booking tab.
  window.addEventListener("focus", () => {
    renderSeats();
  });

  // Refresh when the page becomes visible again.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      renderSeats();
    }
  });
})();
