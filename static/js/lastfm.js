function LastFM() {
    this.api_key = 'a8d89621af7fd4cd295339d82e120d80';
    this.search_url = 'http://ws.audioscrobbler.com/2.0/' +
        '?method=artist.search&artist={{query}}&api_key={{api_key}}&format=json';
}

LastFM.prototype.makeSearchUrl = function(query) {
    return this.search_url
        .replace('{{api_key}}', this.api_key)
        .replace('{{query}}', encodeURIComponent(query))
};

LastFM.prototype.search = function(artist, cb) {
    axios.get(this.makeSearchUrl(artist))
        .then(function(response) {
            cb(this.reduceData(response['data']));
        }.bind(this));
};

LastFM.prototype.reduceData = function(data) {
    // console.log(data);
    var match = data.results.artistmatches.artist[0];
    return {
        'name': match.name,
        'url': match.url,
        'img': match.image,
        'id': match.mbid
    };
}