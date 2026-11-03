import flask
import json
import dataservice
import os

app = flask.Flask(__name__,
            static_url_path='',
            static_folder="public") # can run as an integrated server

# When you want to support multiple origins, you need to check the request origin and set the Access-Control-Allow-Origin header accordingly. You should never use a wildcard (*) for multiple origins as it allows all origins.
ALLOWED_ORIGINS = [
    "http://csse280-03.csse.rose-hulman.edu:80",
    "http://csse280-03.csse.rose-hulman.edu",
    "https://csse280-03.csse.rose-hulman.edu:8081",
    "http://localhost",
    "http://127.0.0.1",
]

# https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
# https://fetch.spec.whatwg.org/#http-cors-protocol

@app.after_request
def add_cors_headers( response ):
    
    if flask.request.headers.get("Origin") in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = flask.request.headers.get("Origin")
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"

    # The answer now depends on which origin asked, so tell any cache to keep
    # a separate copy per Origin instead of handing one site's answer to another
    response.headers["Vary"] = "Origin"

    return response

@app.post("/api/register")
def register():
    data = flask.request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        data = {}
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
    data = flask.request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        data = {}
    username = data.get("username")
    password = data.get("password")

    if not isinstance(username, str) or not isinstance(password, str):
        return flask.jsonify(error="Username and password are required."), 400

    if not dataservice.authenticate_user(username, password):
        return flask.jsonify(error="Incorrect username or password."), 401

    return flask.jsonify(message="Logged in.", username=username), 200


@app.get("/shutdown")
def shutdown():
    os._exit(0)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080)
