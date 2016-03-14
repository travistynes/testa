G.GameWindow.GameOver.Messages = {
    win: {
        title: [
            "You won!",
            "Winner!",
            "Congratulations!",
            "YESSS!"
        ],
        footer: [
            "Are you proud of yourself?",
            "You've beat the game!",
            "You've done the impossible.",
            "Winning!"
        ]
    },
    lose: {
        title: [
            "Game Over",
            "Sad",
            "What's the point?",
            "NOOOOOO!"
        ],
        footer: [
            "Don't feel bad.",
            "You're still a winner on the inside.",
            "You've embarrassed yourself.",
            "Disappointing..."
        ]
    }
};

G.GameWindow.GameOver.init = function() {
    // Setup "restart" button event handlers.
    (function() {
        var button = $("#GameOverWindow").find(".restart-button");
        
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
            // Hide the game over window, and the entire game window.
            $("#GameOverWindow").hide();
            $("#GameWindow").hide();
            
            // Show the splash screen.
            $("#SplashScreen").show();
        });
    })();
}();

// Called when the player loses the game.
G.GameWindow.GameOver.lose = function() {
    var win = $("#GameOverWindow");
    
    // Set title and footer.
    win.find(".title").text(G.Utils.getRandomItem(G.GameWindow.GameOver.Messages.lose.title));
    win.find(".footer").text(G.Utils.getRandomItem(G.GameWindow.GameOver.Messages.lose.footer));
    
    // Show the game over window.
    win.show();
};