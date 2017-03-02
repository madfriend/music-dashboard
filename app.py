import os
from flask import Flask
from models import UserArtist as UA

app = Flask(__name__)

@app.route("/<user>")
def hello(user):
    artists = UA.select().where(UA.user == user)
    artists = map(lambda A: A.artist, artists)
    return artists

@app.route("/api/add/<user>/<artist>")
def add(user, artist):
    return UA.create(user=user, artist=artist)

@app.route("/api/delete/<user>/<artist>")
def delete(user, artist):
    return UA.delete().where(
        UA.user == user, UA.artist == artist)

@app.route("/")
def index():
    return 'goto /<username>'

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)