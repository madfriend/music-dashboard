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
        },

        artistById: function() {
            var out = {};
            for (a in this.artistCache) {
                out[this.artistCache[a].id] = this.artistCache[a];
            }
            return out;
        }
    },

    delimiters: ['((', '))'],

    created: function() {
        this.sortedArtists.map(this.addToCache, this);
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
                if (!result) return false;

                Vue.set(that.artistCache, artist, result);
                songkick.events(result.id, function(events) {
                    Vue.set(that.eventsCache, result.id, events);
                });
            });
        },

        removeArtist: function(artist) {
            this.artists.splice(this.artists.indexOf(artist), 1);
            var mbid = this.artistCache[artist].id;
            delete this.artistCache[artist];
            delete this.eventsCache[mbid];

            axios.post('/api/delete', {
                user: this.username,
                artist: artist
            });
        },

        loadedImage: function(e) {
            var parent = e.target.parentElement.parentElement;
            var vibrant = new Vibrant(e.target);
            var swatches = vibrant.swatches();

            var l_color = '#cccccc',
                d_color = '#111111';

            if (swatches['LightVibrant'])
                l_color = swatches['LightVibrant'].getHex();

            if (swatches['DarkMuted'])
                d_color = swatches['DarkMuted'].getHex();

            parent.style.backgroundColor = d_color;
            parent.querySelector('.desc').style.color = l_color;
        },

        compareArtists: function(a1, a2) {
            if (!this.artistCache[a1]) return 1;
            if (!this.artistCache[a2]) return -1;

            var id1 = this.artistCache[a1].id;
            var id2 = this.artistCache[a2].id;

            if (!this.eventsCache[id1]) return 1;
            if (!this.eventsCache[id2]) return -1;

            var m1, m2;
            var getDist = function(e) { return e.distance; };
            var M = Number.MAX_VALUE;

            m1 = Math.min.apply(null, this.eventsCache[id1].map(getDist)) || M;
            m2 = Math.min.apply(null, this.eventsCache[id2].map(getDist)) || M;

            return m1 - m2;
        },

        closestEvents: function() {
            var all_events = [];
            var byFirst = function(a, b) {
                return a[0] - b[0];
            };

            for (mbid in this.eventsCache) {
                this.eventsCache[mbid].forEach(function(evt) {
                    all_events.push([evt.distance, mbid, evt]);
                });
            }

            all_events.sort(byFirst);

            if (all_events.length >= 5) {
                return all_events.slice(0, 5);
            }
            return all_events;
        }
    }
});
