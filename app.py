import os
import json
from flask import Flask, render_template
from models import UserArtist as UA

app = Flask(__name__)

@app.route("/<user>")
def hello(user):
    artists = UA.select().where(UA.user == user)
    artists = list(map(lambda A: A.artist, artists))
    return render_template('me.html', artists=json.dumps(artists))

@app.route("/api/add/<user>/<artist>")
def add(user, artist):
    UA.create(user=user, artist=artist)
    return True

@app.route("/api/delete/<user>/<artist>")
def delete(user, artist):
    UA.delete().where(
        UA.user == user, UA.artist == artist)
    return True

@app.route("/")
def index():
    return 'goto /username'

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)