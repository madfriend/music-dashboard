var lastfm = new LastFM(LF_CACHE);
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
        pinInput: '',

        artistCache: {},
        eventsCache: {},

        fullscreen: false,
        show_inactive: true,

        has_pin: LOCKED,
        locked: LOCKED,

        modalVisible: false

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
        },

        locksApply: function() {
            return (this.locked && this.has_pin) || (!this.locked && !this.has_pin);
        }
    },

    delimiters: ['((', '))'],

    created: function() {
        this.sortedArtists.map(this.addToCache, this);
    },

    methods: {
        show: function(artist) {
            if (!this.artistCache[artist]) return false;
            var mbid = this.artistCache[artist].id;
            if (!this.show_inactive && this.eventsCache[mbid].length === 0)
                return false;
            return true;
        },

        artistClass: function(artist) {
            if (!this.artistCache[artist]) return '';
            var mbid = this.artistCache[artist].id;
            if (!this.eventsCache[mbid] || this.eventsCache[mbid].length === 0)
                return '';
            return 'on-tour';
        },

        addArtist: function() {
            var value = this.newArtist && this.newArtist.trim();
            value = value.toLowerCase();

            if (!value || this.artists.indexOf(value) !== -1) {
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
                artist: value,
                pin: localStorage.getItem('pin')
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
                artist: artist,
                pin: localStorage.getItem('pin')
            });
        },

        loadedImage: function(e) {
            var parent = e.target.parentElement.parentElement;
            var l_color = localStorage.getItem(e.target.src + '-light');
            var d_color = localStorage.getItem(e.target.src + '-dark');

            if (!l_color || !d_color) {
                var vibrant = new Vibrant(e.target);
                var swatches = vibrant.swatches();

                l_color = '#cccccc';
                d_color = '#111111';

                if (swatches['LightVibrant'])
                    l_color = swatches['LightVibrant'].getHex();

                if (swatches['DarkMuted'])
                    d_color = swatches['DarkMuted'].getHex();

                localStorage.setItem(e.target.src + '-light', l_color);
                localStorage.setItem(e.target.src + '-dark', d_color);
            }

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
            // if (all_events.length >= 5) {
            //     return all_events.slice(0, 5);
            // }
            return all_events;
        },

        // setPin, checkPin
        setPin: function() {
            var pin = this.pinInput.trim();
            if (!pin) return false;
            var that = this;

            axios.post('/api/lock', {
                user: this.username,
                pin: pin
            }).then(function(response) {
                that.has_pin = (response['data']['status'] === 'ok');
                that.modalVisible = false;
            }).catch(console.log);
        },

        checkPin: function() {
            var pin = this.pinInput.trim();
            if (!pin) return false;
            var that = this;

            axios.post('/api/check-lock', {
                user: this.username,
                pin: pin
            }).then(function(response) {
                that.locked = !(response['data']['status'] === 'ok');
                localStorage.setItem('pin', pin);
                that.modalVisible = false;
            }).catch(console.log);
        },

    }
});
