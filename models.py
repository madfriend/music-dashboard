import os
import urllib.parse
import datetime

from peewee import *

urllib.parse.uses_netloc.append('postgres')
url = urllib.parse.urlparse(os.environ.get('DATABASE_URL'))

db = PostgresqlDatabase(
    url.path[1:],
    user=url.username,
    password=url.password,
    host=url.hostname,
    port=url.port,
    autorollback=True
)


class UserArtist(Model):
    user = CharField()
    artist = CharField()

    class Meta:
        database = db
        indexes = (
            (('user', 'artist'), True),
        )


class ArtistSearchCache(Model):
    query = CharField()
    result = TextField()
    created_date = DateTimeField(default=datetime.datetime.now)

    class Meta:
        database = db


class EventSearchCache(Model):
    mbid = CharField()
    result = TextField()
    created_date = DateTimeField(default=datetime.datetime.now)

    class Meta:
        database = db

class PageLock(Model):
    page = CharField()
    locked = BooleanField()
    hash = CharField()

    class Meta:
        database = db

db.connect()
db.create_tables([
    UserArtist, ArtistSearchCache, EventSearchCache, PageLock],
    safe=True)
