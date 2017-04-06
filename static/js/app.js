var lastfm = new LastFM();
var songkick = new Songkick();

assureLocation();

function assureLocation() {
    var lon = localStorage.getItem('lon'),
        lat = localStorage.getItem('lon');

    if (!lon || !lat) {
        navigator.geolocation.getCurrentPosition(function(pos) {
            localStorage.setItem('lon', pos.coords.longitude);
            localStorage.setItem('lat', pos.coords.latitude);
        });
    };
}

var app = new Vue({
    el: '#app',

    data: {
        artists: ARTISTS,
        username: USER,
        newArtist: '',
        artistCache: {},
        eventsCache: {}
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
            if (this.artistCache[artist]) return true;
            var that = this;

            lastfm.get(artist, function(result) {
                Vue.set(that.artistCache, artist, result);

                songkick.events(result.id, function(events) {
                    console.log(result.id, events);
                    Vue.set(that.eventsCache, result.id, events);
                });
            });
        },
        removeArtist: function(artist) {
            this.artists.splice(this.artists.indexOf(artist), 1);
            axios.post('/api/delete', {
                user: this.username,
                artist: artist
            });
        }
    }
});