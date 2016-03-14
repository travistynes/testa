G.Utils.MusicPlayer.create = function() {
    var player = {
        tracks: [
            "audio/music/music1.ogg",
            "audio/music/music2.ogg",
            "audio/music/music3.ogg",
            "audio/music/music4.ogg"
        ],
        currentTrackNumber: 0,
        audio: document.createElement("AUDIO"), // Audio element
    };
    
    player.playNextTrack = function() {
        // If track is playing, stop it.
        if(!this.audio.paused) {
            this.audio.pause();
        }
        
        // Load next track.
        this.currentTrackNumber++;
        if(this.currentTrackNumber > this.tracks.length - 1) { this.currentTrackNumber = 0; }
        this.audio.src = this.tracks[this.currentTrackNumber];
    };
    
    player.init = function() {
        // The entire media can be played without interruption, assuming the download rate remains at least at the current level.
        this.audio.oncanplaythrough = function() {
            // Play track.
            player.audio.play();
        };
        
        // Sent when playback completes. Doesn't fire on pause, but when track plays to end.
        this.audio.onended = function() {
            // Play next track.
            player.playNextTrack();
        };
        
        // Set volume.
        this.audio.volume = .05;
        
        // Load first track. Setting src begins loading the file.
        this.currentTrackNumber = Math.floor(Math.random() * this.tracks.length);
        this.audio.src = this.tracks[this.currentTrackNumber];
    };
    
    // Initialize player.
    player.init();
    
    return player;
};