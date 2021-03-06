function LastFM(cache) {
    this.cache = cache;
}

LastFM.prototype.makeGetUrl = function(query) {
    return '/api/artist_search/' + encodeURIComponent(query);
};

LastFM.prototype.get = function(artist, cb) {
    if (this.cache && this.cache[artist.toLowerCase()])
        return cb(this.reduceData(this.cache[artist]));

    axios.get(this.makeGetUrl(artist))
        .then(function(response) {
            cb(this.reduceData(response['data']));
        }.bind(this));
};

LastFM.prototype.reduceData = function(data) {
    // console.log(data);
    var match = data.artist;
    if (!match) return false;

    var _find = function(size) {
        return function(item) { return item['size'] === size; };
    };

    var img = match.image.find(_find('large'))['#text'];
    if (img)
      img += '?r=' + Math.random();

    return {
        'name': match.name,
        'url': match.url,
        'img': img,
        'id': match.mbid
    };
}
