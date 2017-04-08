import os
import json
import datetime

from flask import Flask, render_template, request, url_for
import requests

from models import UserArtist as UA, \
                   ArtistSearchCache as ArtistCache, \
                   EventSearchCache as EventCache


app = Flask(__name__, static_url_path='/static')
json_ok = '{status: "ok"}'

@app.route('/<user>')
def hello(user):
    artists = UA.select().where(UA.user == user)
    artists = list(map(lambda A: A.artist, artists))
    return render_template('me.html', artists=json.dumps(artists), user=user)

@app.route('/api/add', methods=['POST'])
def add():
    d = request.get_json()
    UA.create(user=d['user'], artist=d['artist'].lower())
    return json_ok

@app.route('/api/delete', methods=['POST'])
def delete():
    d = request.get_json()
    q = UA.delete().where(
        UA.user == d['user'], UA.artist == d['artist'].lower())
    q.execute()
    return json_ok

@app.route('/api/events/<mbid>')
def songkick(mbid):
    try:
        day_ago = datetime.datetime.now() - datetime.timedelta(days=1)
        return EventCache.get(
            EventCache.mbid == mbid, EventCache.created_date < day_ago).result

    except EventCache.DoesNotExist:
        url = ('http://api.songkick.com/api/3.0/'
               'artists/mbid:{mbid}/calendar.json?apikey={api_key}')
        url = url.format(api_key='zAW2XV2c43Uzvbvw', mbid=mbid)
        result = requests.get(url).text
        EventCache.create(mbid=mbid, result=result)
        return result

@app.route('/api/artist_search/<query>')
def lastfm(query):
    try:
        return ArtistCache.get(ArtistCache.query == query.lower()).result
    except ArtistCache.DoesNotExist:
        url = ('http://ws.audioscrobbler.com/2.0/'
               '?method=artist.getinfo&artist={query}&api_key={api_key}'
               '&format=json&autocorrect=1')
        url = url.format(api_key='a8d89621af7fd4cd295339d82e120d80', query=query)
        result = requests.get(url).text

        ArtistCache.create(query=query.lower(), result=result)
        return result

@app.route('/')
def index():
    return 'goto /username'

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)