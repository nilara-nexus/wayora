# Wayora — Travel Booking Demo

A responsive front-end demo for bus, train, and flight journey searches, passenger/seat selection, booking history, cancellation estimates, and PDF tickets.

## Run
1. Extract the project ZIP.
2. Open `index.html` in a modern browser.
3. Choose Bus, Train, or Flight, enter an Indian city name, destination, and travel date.
4. Select a demo departure, enter passenger details, select seats, and confirm the demo booking.
5. Open Booking History to download the ticket PDF.

## Route estimates and important limits
- Major Indian cities are included in a local coordinate directory. Each searched city pair gets a distance estimate based on its coordinates and transport-mode adjustment factors; estimated duration and fare vary by distance and mode. The route preview uses the same origin and destination, and displays the same estimated distance and duration shown in the service cards. A Google Maps directions link is provided for visual reference.
- Departure slots are sample demo times. Arrival times are calculated from each route's estimated duration and are displayed in 12-hour AM/PM format. Routes crossing midnight are marked as arriving the next day.
- Map distance and journey duration are estimates and are not calculated from a live routing API. Google Maps may show a different route/distance. The demo is not connected to live bus operators, Indian Railways, airlines, inventory, or payment providers and cannot guarantee actual routes, schedules, fares, availability, or ticket validity. Use official operator sources before real travel.
- For city names not recognized by the local directory, the app says route details are not available for that city pair in this demo. This is not a claim that real-world transport is unavailable.
- PDF tickets are clearly marked as demo tickets and are not valid for travel.

## Files
- `index.html` — home page
- `booking.html`, `booking.js` — journey search and booking flow
- `history.html`, `history.js` — booking history, cancellation demo, and PDF ticket
- `enquiry.html`, `enquiry.js` — enquiry form
- `style.css` — responsive styling
- `assets/` — transport and decorative images
