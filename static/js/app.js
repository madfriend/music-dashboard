var lastfm = new LastFM();

var app = new Vue({
    el: '#app',

    data: {
        artists: ARTISTS,
        username: USER,
        newArtist: '',
        artistCache: {}
    },

    computed: {
        sortedArtists: function() {
            return this.artists.concat().sort();
        }
    },

    delimiters: ['((', '))'],

    created: function() {
        this.artists.map(this.addToCache, this);
    },

    methods: {
        addArtist: function() {
            var value = this.newArtist && this.newArtist.trim();
            if (!value) {
                return;
            }
            this.artists.push(value);
            this.addToCache(value);
            this.saveArtist(value);
            this.newArtist = '';

        },
        saveArtist: function(value) {
            axios.post('/api/add', {
                user: this.username,
                artist: value
            });
        },
        addToCache: function(artist) {
            lastfm.search(artist, function(result) {
                Vue.set(this.artistCache, artist, result);
            }.bind(this));
                // Vue.set(this.artistCache, artist, {'name': artist.toUpperCase()});

        }
    }
});