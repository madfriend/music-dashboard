function Songkick() {}

Songkick.prototype.makeEventsUrl = function(mbid) {
    return '/api/events/' + mbid;
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
    events = events.filter(onlyNext8Months);
    events.sort(byProximity);
    topEvents = events.slice(0, 3);
    topEvents.sort(byDate);
    return topEvents.map(this.reduceEvent);
};

Songkick.prototype.reduceEvent = function(event) {
    var dateFmt = {day : 'numeric', month : 'short'};
    var loc = event.location.city.split(',')[0];

    return {
        'id': event.id,
        'url': event.uri,
        'name': event.displayName,
        'date': new Date(event.start.date).toLocaleDateString('ru-RU', dateFmt),
        'location': loc
    };
};

// utils
function byProximity(a, b) {
    var dist1 = distance(a.location.lng, a.location.lat),
        dist2 = distance(b.location.lng, b.location.lat);
    return dist1 - dist2;
}

function onlyNext8Months(event) {
    var now = new Date();
    var timeDiff = Math.abs(now.getTime() - (new Date(event.start.date)).getTime());
    var monthsDiff = Math.ceil(timeDiff / (1000 * 3600 * 24 * 30));
    return monthsDiff <= 8;
}

function byDate(a, b) {
    return a.start.date.localeCompare(b.start.date);
}

function distance(lon, lat) {
    var clon = localStorage.getItem('lon') || 0,
        clat = localStorage.getItem('lat') || 0;
    return Math.sqrt(Math.pow(lon - clon, 2) + Math.pow(lat - clat, 2));
}