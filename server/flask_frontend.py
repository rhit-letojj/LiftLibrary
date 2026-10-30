import flask
app = flask.Flask(__name__,
            static_url_path='',
            static_folder='') #this is for demo purposes, we will run a separate frontend
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8081)