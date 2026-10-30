import flask
import json
import dataservice
import os

app = flask.Flask(__name__,
            static_url_path='',
            static_folder="public") # can run as an integrated server

# When you want to support multiple origins, you need to check the request origin and set the Access-Control-Allow-Origin header accordingly. You should never use a wildcard (*) for multiple origins as it allows all origins.
ALLOWED_ORIGINS = ["http://csse280-03.csse.rose-hulman.edu:8080", "https://csse280-03.csse.rose-hulman.edu:8081"]

# https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
# https://fetch.spec.whatwg.org/#http-cors-protocol

@app.after_request
def add_cors_headers( response ):
    
    if flask.request.headers.get("Origin") in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = flask.request.headers.get("Origin")
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE"

    # The answer now depends on which origin asked, so tell any cache to keep
    # a separate copy per Origin instead of handing one site's answer to another
    response.headers["Vary"] = "Origin"

    return response

@app.get("/shutdown")
def shutdown():
    os._exit(0)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8081)
