# Lift Library frontend

The React/Vite app is the only frontend. Flask remains the API and serves the production React build.

## Local development

1. Start Flask from the repository root: `python server/httpserver.py` (API at `http://127.0.0.1:8080`).
2. In another terminal, run `cd react` and `npm run dev`.
3. Open the Vite URL shown in the terminal. Vite proxies `/api` requests to Flask.

## Production build

From `react`, run `npm run build`. Then start Flask; it serves `react/dist` and the API from the same origin. Set `LIFTLIBRARY_SECRET_KEY` to a persistent, randomly generated secret before deployment so login sessions remain valid across restarts. The app generates an ephemeral key when the variable is omitted, suitable only for local development.

The server stores users and lifts in `server/liftlibrary.db`. Passwords are hashed by the Python backend; browser code only communicates with the API.
