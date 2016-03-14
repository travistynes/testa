G.GameWindow.MapWin.Messages = {
    win: {
        title: [
            "Good Job!",
            "Win!",
            "Winner",
            "Too Easy",
            "Not Bad",
            "Oh Baby!",
            "Mama Mia!",
            "Papa Pia!"
        ],
        footer: [
            "It's a miracle from heaven.",
            "You're special and unique, like a snowflake.",
            "What!",
            "That was the most amazing thing that has ever happened.",
            "You should tell your friends that you're finally a winner.",
            "Congratulations.",
            "You should feel very proud of yourself."
        ]
    }
};

G.GameWindow.MapWin.init = function() {
    // Setup "ready" button event handlers.
    (function() {
        var button = $("#MapWinWindow").find(".ready-button");
        
        // Hover handlers.
        var defaultBGColor = $(button).css("background-color");
        $(button).hover(function() {
            // Hover over.
            $(this).css("cursor", "pointer");
            $(this).css("background-color", "#13C0DC");
        },
        function() {
            // Hover off.
            $(this).css("cursor", "default");
            $(this).css("background-color", defaultBGColor);
        });
        
        // Click handler.
        $(button).click(function() {
            // Quit current map.
            G.mapman.quitMap();
        });
    })();
}();

// Called when the player beats the map.
G.GameWindow.MapWin.win = function() {
    var win = $("#MapWinWindow");
    var map = G.mapman.currentMap;
    
    // Set title and footer.
    win.find(".title").text(G.Utils.getRandomItem(G.GameWindow.MapWin.Messages.win.title));
    win.find(".footer").text(G.Utils.getRandomItem(G.GameWindow.MapWin.Messages.win.footer));
    
    // Calculate score.
    var player = G.mapman.currentMap.player;
    var score = Number(player.runTime.toFixed(2));
    
    // Save hi-score.
    var newHiscore = false;
    if(score < map.hiscore.score || isNaN(map.hiscore.score)) {
        // New hi-score.
        newHiscore = true;
        G.mapman.scores[G.mapman.currentMapNumber - 1] = { title: map.title, score: score, flightPath: player.flightPath };
        localStorage.scores = JSON.stringify(G.mapman.scores);
    }
    
    // Set stats.
    var html = "Map: " + map.title + "<br>";
    html += "Time: " + score + " seconds.<br>"
    html += (newHiscore ? "New hi-score!" : "") + "<br>";
    
    win.find(".stats").html(html);
    
    // Show the window.
    win.show();
};