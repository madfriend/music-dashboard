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
        'location': loc,
        'distance': distance(event.location.lng, event.location.lat)
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
    return getDistanceFromLatLonInKm(lat, lon, clat, clon);
}


function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1);
  var a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}