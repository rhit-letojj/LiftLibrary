import os
import secrets
from pathlib import Path

import flask
from werkzeug.utils import safe_join

import dataservice


ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIST = ROOT / "react" / "dist"

app = flask.Flask(
    __name__,
    static_folder=str(FRONTEND_DIST / "assets"),
    static_url_path="/assets",
)
app.secret_key = os.environ.get("LIFTLIBRARY_SECRET_KEY") or secrets.token_hex(32)
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
)


def request_data():
    data = flask.request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def authenticated_username():
    username = flask.session.get("username")
    if not isinstance(username, str):
        return None
    return username


def require_login():
    username = authenticated_username()
    if username is None:
        return None, (flask.jsonify(error="Please log in to continue."), 401)
    return username, None


@app.get("/api/options")
def options():
    return flask.jsonify(dataservice.get_options())


@app.get("/api/session")
def session_status():
    return flask.jsonify(username=authenticated_username())


@app.post("/api/register")
def register():
    data = request_data()
    username = data.get("username")
    password = data.get("password")

    if not isinstance(username, str) or not isinstance(password, str):
        return flask.jsonify(error="Username and password are required."), 400

    try:
        dataservice.create_user(username, password)
    except ValueError as error:
        status = 409 if str(error) == "Username already exists." else 400
        return flask.jsonify(error=str(error)), status

    return flask.jsonify(message="Account created."), 201


@app.post("/api/login")
def login():
    data = request_data()
    username = data.get("username")
    password = data.get("password")

    if not isinstance(username, str) or not isinstance(password, str):
        return flask.jsonify(error="Username and password are required."), 400

    username = username.strip()
    if not dataservice.authenticate_user(username, password):
        return flask.jsonify(error="Incorrect username or password."), 401

    flask.session.clear()
    flask.session["username"] = username
    return flask.jsonify(message="Logged in.", username=username)


@app.post("/api/logout")
def logout():
    flask.session.clear()
    return flask.jsonify(message="Logged out.")


@app.get("/api/lifts")
def list_lifts():
    username, error = require_login()
    if error:
        return error

    lifts = dataservice.get_prs(username)
    return flask.jsonify([
        {"id": lift_id, **lift}
        for lift_id, lift in lifts.items()
        if isinstance(lift, dict)
    ])


@app.post("/api/lifts")
def create_lift():
    username, error = require_login()
    if error:
        return error

    try:
        lift_id = dataservice.add_lift(username, request_data())
    except ValueError as validation_error:
        return flask.jsonify(error=str(validation_error)), 400

    return flask.jsonify(id=lift_id), 201


@app.patch("/api/lifts/<lift_id>")
def update_lift(lift_id):
    username, error = require_login()
    if error:
        return error

    try:
        updated = dataservice.update_lift(username, lift_id, request_data())
    except ValueError as validation_error:
        return flask.jsonify(error=str(validation_error)), 400
    if not updated:
        return flask.jsonify(error="Lift not found."), 404
    return flask.jsonify(message="Lift updated.")


@app.delete("/api/lifts/<lift_id>")
def delete_lift(lift_id):
    username, error = require_login()
    if error:
        return error
    if not dataservice.delete_lift(username, lift_id):
        return flask.jsonify(error="Lift not found."), 404
    return flask.jsonify(message="Lift deleted.")


@app.get("/", defaults={"path": ""})
@app.get("/<path:path>")
def serve_react(path):
    if path == "api" or path.startswith("api/"):
        return flask.jsonify(error="API endpoint not found."), 404

    index_path = FRONTEND_DIST / "index.html"
    if not index_path.is_file():
        return (
            "React build not found. Run `npm run build` in the react directory.",
            503,
            {"Content-Type": "text/plain; charset=utf-8"},
        )

    candidate = safe_join(str(FRONTEND_DIST), path) if path else None
    if candidate and os.path.isfile(candidate):
        return flask.send_from_directory(str(FRONTEND_DIST), path)
    return flask.send_from_directory(str(FRONTEND_DIST), "index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    app.run(host="0.0.0.0", port=port)