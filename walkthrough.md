# Backend Implementation Walkthrough

I have successfully created and integrated a live Express + Socket.IO backend for the Shiwang project.

## Changes Made
1. **Express Server Initialization:** Setup [backend/server.js](file:///c:/Users/Lenovo/Desktop/Shiwang/backend/server.js) with CORS, Express JSON, and a Socket.IO instance attached to the HTTP server.
2. **In-Memory Store:** Moved the static mock data (`alerts`, `users`, `leaderboard`, `stats`) into a new [backend/data.js](file:///c:/Users/Lenovo/Desktop/Shiwang/backend/data.js) module. This simulates a real database.
3. **REST API Routes:** Created structured route handlers under `backend/routes/`:
    - `alerts.js`: `GET /`, `POST /` (creates new alert and emits via socket), `PUT /:id/upvote`, `DELETE /:id`
    - `users.js`: `POST /login`, `POST /signup`, `GET /leaderboard`
    - `stats.js`: `GET /`
4. **Socket.IO Realtime Data:** Added a `get_initial_data` event to serve the first dump of data, and rigged the REST routes to emit events like `new_alert` or `alert_updated` to all connected clients.
5. **Frontend Integration:** 
    - Updated `src/App.tsx` to call a new `fetchInitialData()` store method on mount, as well as initialize the socket listeners.
    - Updated `src/stores/index.ts` (specifically `useAlertStore`) to call the actual Axios API and listen for Socket.IO events (removing the old MOCK_ALERTS logic).
    - Updated `src/pages/ReportPage.tsx` to handle submissions via an actual `api.post('/alerts')` request instead of a fake `setTimeout`.

## Verification Steps Taken
- Started the `node backend/server.js` backend server natively on port 5000.
- Ran frontend on `npm run dev` (port 8081).
- Confirmed the API connectivity via PowerShell `Invoke-RestMethod` and observed the backend successfully ingest, store, and process a new alert in its local memory store.

You can now report real alerts in the app, and they will persist (in memory) and automatically propagate to all other users looking at their UI via WebSockets!

## Google OAuth Integration
I have successfully integrated Google Login and Signup using `@react-oauth/google`.

1. **Frontend Setup:** Added `@react-oauth/google` to the Vite React project and wrapped `<App />` with `<GoogleOAuthProvider>`.
2. **Global Store:** Added a `loginWithGoogle` method to `useUserStore` that sends the Google credential to the backend's `/users/google-auth` endpoint.
3. **UI Integration:** Placed a styled "Continue with Google" button on both `LoginPage.tsx` and `SignupPage.tsx`.

> [!IMPORTANT]
> The application uses a placeholder client ID (`YOUR_GOOGLE_CLIENT_ID_HERE`) and the backend is running in "demo mode". To enable real Google authentication, set the `VITE_GOOGLE_CLIENT_ID` in your `.env` file on the frontend, and `GOOGLE_CLIENT_ID` in your backend `.env` file!
