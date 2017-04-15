import os
import json
import datetime
import random
import sys
import string
import hashlib

from flask import Flask, render_template, request, url_for, jsonify
import requests

from models import UserArtist as UA, \
                   ArtistSearchCache as ArtistCache, \
                   EventSearchCache as EventCache, \
                   Page



app = Flask(__name__, static_url_path='/static')

json_ok = {'status': 'ok'}
json_nok =  {'status': 'fail'}

def hash(string):
    salt = '8NSCV-$@VM--as%,12AAc_14-23++012x,'
    s = (string + salt).encode()
    return hashlib.sha512(s).hexdigest()

@app.route('/favicon.ico')
def favicon():
    return ''

@app.route('/<user>')
def hello(user):
    artists = UA.select().where(UA.user == user)
    artists = list(map(lambda A: A.artist, artists))

    try:
        page = Page.get(Page.user == user)
        has_pin = True
    except Page.DoesNotExist:
        has_pin = False

    if len(artists) == 0:
        has_pin = False

    lf_cache = dict()
    for artist in artists:
        try:
            lf_cache[artist] = json.loads(
                ArtistCache.get(ArtistCache.query == artist.lower()).result)
        except ValueError:
            pass

    return render_template('me.html', artists=json.dumps(artists), user=user,
        r=random.random(), lf_cache=json.dumps(lf_cache), has_pin=json.dumps(has_pin))

@app.route('/api/users')
def users():
    return json.dumps(list(map(lambda A: A.user, UA.select(UA.user).distinct())))

@app.route('/api/add', methods=['POST'])
def add():
    d = request.get_json()
    try:
        page = Page.get(Page.user == d['user'])
        if page.pin_hash != hash(d['pin']):
            return jsonify(json_nok)
    except Page.DoesNotExist:
        pass

    UA.create(user=d['user'], artist=d['artist'].lower())
    return jsonify(json_ok)

@app.route('/api/delete', methods=['POST'])
def delete():
    d = request.get_json()
    try:
        page = Page.get(Page.user == d['user'])
        if page.pin_hash != hash(d['pin']):
            return jsonify(json_nok)
    except Page.DoesNotExist:
        pass

    q = UA.delete().where(
        UA.user == d['user'], UA.artist == d['artist'])
    q.execute()
    return jsonify(json_ok)

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

@app.route('/api/lock', methods=['POST'])
def set_lock():
    d = request.get_json()
    user = d['user']
    pin = d['pin']

    try:
        page = Page.get(Page.user==user)
        return jsonify(json_nok)
    except Page.DoesNotExist:
        page = Page.create(user=user, pin_hash=hash(pin))
        return jsonify(json_ok)

@app.route('/api/check-lock', methods=['POST'])
def check_lock():
    d = request.get_json()
    user = d['user']
    pin = d['pin']

    try:
        page = Page.get(Page.user==user)
        return jsonify(json_ok if hash(pin) == page.pin_hash else json_nok)

    except Page.DoesNotExist:
        return jsonify(json_ok)

@app.route('/')
def index():
    return 'goto /username'

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
