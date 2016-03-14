G.SplashScreen.Messages = {
    intro: [
        "Pilot the ship to the exit. It is easy.",
        "The easiest game you'll ever play!",
        "Fly. Don't crash.",
        "Quick and easy gameplay. Revolutionary!",
        "So easy your granny can do it."
    ]
};

G.SplashScreen.init = function() {
    // Setup "Easy" mode button.
    (function() {
        var button = $("#SplashScreen-easyButton");
        
        // Hover handlers.
        $(button).hover(function() {
            // Hover over.
            $(this).addClass("buttonHover");
        },
        function() {
            // Hover off.
            $(this).removeClass("buttonHover");
        });
        
        // Click handler.
        $(button).click(function() {
            // Highlight the selected mode button.
            $(".modeButton").removeClass("buttonClick");
            $(this).addClass("buttonClick");
            
            // Set mode.
            G.mapman.mode = G.MapManager.modes.easy;
        });
        
        // Show button.
        button.show();
    })();
    
    // Setup "Normal" mode button.
    (function() {
        var button = $("#SplashScreen-normalButton");
        
        // Hover handlers.
        $(button).hover(function() {
            // Hover over.
            $(this).addClass("buttonHover");
        },
        function() {
            // Hover off.
            $(this).removeClass("buttonHover");
        });
        
        // Click handler.
        $(button).click(function() {
            // Set border color to highlight the selected mode.
            $(".modeButton").removeClass("buttonClick");
            $(this).addClass("buttonClick");
            
            // Set mode.
            G.mapman.mode = G.MapManager.modes.normal;
        });
        
        // Show button.
        button.show();
    })();
    
    // Setup "Map 1" button.
    (function() {
        var button = $("#SplashScreen-map1Button");
        
        // Hover handlers.
        $(button).hover(function() {
            // Hover over.
            $(this).addClass("buttonHover");
        },
        function() {
            // Hover off.
            $(this).removeClass("buttonHover");
        });
        
        // Click handler.
        $(button).click(function() {
            // Hide the splash screen.
            $("#SplashScreen").hide();
            
            // Start the game.
            G.mapman.loadMap(1);
        });
        
        // Show button.
        button.show();
    })();
    
    // Setup "Map 2" button.
    (function() {
        var button = $("#SplashScreen-map2Button");
        
        // Hover handlers.
        $(button).hover(function() {
            // Hover over.
            $(this).addClass("buttonHover");
        },
        function() {
            // Hover off.
            $(this).removeClass("buttonHover");
        });
        
        // Click handler.
        $(button).click(function() {
            // Hide the splash screen.
            $("#SplashScreen").hide();
            
            // Start the game.
            G.mapman.loadMap(2);
        });
        
        // Show button.
        button.show();
    })();
    
    // Set random splash screen properties.
    var opts = [
        { backgroundImage: "url('css/game/SplashScreen/images/background1.png')", titleColor: "#FFFFFF", footerColor: "BBBA8E" },
        { backgroundImage: "url('css/game/SplashScreen/images/background2.png')", titleColor: "#A01F1F", footerColor: "#000000" }
    ];
    
    var o = G.Utils.getRandomItem(opts);
    var screen = $("#SplashScreen");
    screen.css("background-image", o.backgroundImage);
    screen.find(".title").css("color", o.titleColor);
    screen.find(".footer").css("color", o.footerColor);
    
    // Set splash screen intro message.
    G.SplashScreen.setIntroMessage();
    
    // Show the splash screen.
    screen.show();
};

G.SplashScreen.setIntroMessage = function() {
    var win = $("#SplashScreen");
    
    // Set intro message.
    win.find(".intro").text(G.Utils.getRandomItem(G.SplashScreen.Messages.intro));
};

G.SplashScreen.setMessage = function() {
    var message = "";
    if(G.mapman.scores.length > 0) {
        var o = G.Utils.getRandomItem(G.mapman.scores);
        
        message = "Your top score on " + o.title + " is " + o.score + " seconds.";
    } else {
        message = "You don't have any hi-scores yet.";
    }
    
    $("#SplashScreen-message").html(message);
};

// Initialize the splash screen as soon as this file is loaded.
G.SplashScreen.init();