import os
import urlparse
from peewee import *

urlparse.uses_netloc.append("postgres")
url = urlparse.urlparse(os.environ["DATABASE_URL"])

db = PostgresqlDatabase(
    url.path[1:],
    user=url.username,
    password=url.password,
    host=url.hostname,
    port=url.port
)

class UserArtist(Model):
    user = CharField()
    artist = CharField()

    class Meta:
        database = db
        indexes = (
            (('user', 'artist'), True),
        )

db.connect()
db.create_tables([UserArtist], safe=True)