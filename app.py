import os
import json
from flask import Flask, render_template, request
from models import UserArtist as UA

app = Flask(__name__)
json_ok = '{status: "ok"}'

@app.route('/<user>')
def hello(user):
    artists = UA.select().where(UA.user == user)
    artists = list(map(lambda A: A.artist, artists))
    return render_template('me.html', artists=json.dumps(artists), user=user)

@app.route('/api/add', methods=['POST'])
def add():
    d = request.get_json()
    UA.create(user=d['user'], artist=d['artist'])
    return json_ok

@app.route('/api/delete', methods=['POST'])
def delete():
    d = request.get_json()
    UA.delete().where(
        UA.user == d['user'], UA.artist == d['artist'])
    return json_ok

@app.route('/')
def index():
    return 'goto /username'

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)