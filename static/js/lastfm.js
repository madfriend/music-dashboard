function LastFM() {
    this.api_key = 'a8d89621af7fd4cd295339d82e120d80';
    this.get_url = 'http://ws.audioscrobbler.com/2.0/' +
        '?method=artist.getinfo&artist={{query}}&api_key={{api_key}}&format=json' +
        '&autocorrect=1';
}

LastFM.prototype.makeGetUrl = function(query) {
    return this.get_url
        .replace('{{api_key}}', this.api_key)
        .replace('{{query}}', encodeURIComponent(query))
};

LastFM.prototype.get = function(artist, cb) {
    axios.get(this.makeGetUrl(artist))
        .then(function(response) {
            cb(this.reduceData(response['data']));
        }.bind(this));
};

LastFM.prototype.reduceData = function(data) {
    // console.log(data);
    var match = data.artist;
    var _find = function(size) {
        return function(item) { return item['size'] === size; };
    };
    var img = match.image.find(_find('large'))['#text'];

    return {
        'name': match.name,
        'url': match.url,
        'img': img,
        'id': match.mbid
    };
}