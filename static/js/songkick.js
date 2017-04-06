function Songkick() {
    this.api_key = 'zAW2XV2c43Uzvbvw';
    this.events_url = 'http://api.songkick.com/api/3.0/' +
                        'artists/mbid:{{mbid}}/calendar.json?apikey={{api_key}}';

}

Songkick.prototype.makeEventsUrl = function(mbid) {
    return this.events_url
        .replace('{{api_key}}', this.api_key)
        .replace('{{mbid}}', mbid);
};

Songkick.prototype.events = function(mbid, cb) {
    axios.get(this.makeEventsUrl(mbid))
        .then(function(response) {
            cb(this.reduceData(response['data']));
        }.bind(this));
};

Songkick.prototype.reduceData = function(data) {
    var events = data.resultsPage.results.event || [];
    if (events.length === 0) return [];
    events.sort(byProximity);
    topEvents = events.slice(0, 5);
    topEvents.sort(byDate);
    return topEvents.map(this.reduceEvent);
};

Songkick.prototype.reduceEvent = function(event) {
    var dateFmt = {day : 'numeric', month : 'short', year: 'numeric'};

    return {
        'id': event.id,
        'url': event.uri,
        'name': event.displayName,
        'date': new Date(event.start.date).toLocaleDateString('ru-RU', dateFmt),
        'location': event.location.city
    };
};

// utils
function byProximity(a, b) {
    var dist1 = distance(a.location.lng, a.location.lat),
        dist2 = distance(b.location.lng, b.location.lat);
    return dist1 - dist2;
}

function byDate(a, b) {
    return a.start.date.localeCompare(b.start.date);
}

function distance(lon, lat) {
    var clon = localStorage.getItem('lon') || 0,
        clat = localStorage.getItem('lat') || 0;
    return Math.sqrt(Math.pow(lon - clon, 2) + Math.pow(lat - clat, 2));
}