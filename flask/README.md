# LiftLibrary
Web application that visualizes a barbell loaded with the plates a user selects. Supports multiple barbells, lb and kg plates, and collars, and lets users save personal records (PRs) to a personal library.

The frontend is the React/Vite app in `../react`; Flask provides the JSON API and serves the built app.

## Development

- Start the backend from the repository root with `python server/httpserver.py`.
- Start the frontend in a second terminal with `cd react` and `npm run dev`.
- Open the Vite URL. API calls are proxied to Flask on port 8080.

## Production

Build the frontend with `npm run build` in `react`, then start Flask. `python server/httpserver.py` serves the production frontend from `react/dist` and provides `/api` routes on port 8080; `python server/flask-frontend.py` runs it on port 80. Set `LIFTLIBRARY_SECRET_KEY` to a persistent random secret in the deployment environment. Without it, an ephemeral key is generated, and sessions will not survive server restarts.
