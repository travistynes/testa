G.GameWindow.GUI.init = function() {
    // Setup "Best Path" checkbox handlers.
    (function() {
        // Set focus event handler.
        var checkbox = $("#flightPathCheckBox");
        
        // Change handler.
        checkbox.change(function() {
            // Toggle drawing the best flight path on the map.
            var player = G.mapman.currentMap.player;
            player.toggleBestFlightPath(this.checked);
        });
        
        // Focus handler.
        checkbox.focus(function() {
            // Unfocus the checkbox when focused (clicked). When focused, spacebar toggles the checkbox. We don't want that.
            $(this).blur();
        });
    })();
    
    // Setup "Dev" button event handlers.
    (function() {
        var button = $("#gui-devButton");
        
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
            // Switch mode.
            G.mapman.currentMap.setMode(G.mapman.currentMap.modes.dev);
        });
    })();
    
    // Setup "Easy" button event handlers.
    (function() {
        var button = $("#gui-easyButton");
        
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
            // Switch mode.
            G.mapman.currentMap.setMode(G.mapman.currentMap.modes.easy);
        });
    })();
    
    // Setup "Normal" button event handlers.
    (function() {
        var button = $("#gui-normalButton");
        
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
            // Switch mode.
            G.mapman.currentMap.setMode(G.mapman.currentMap.modes.normal);
        });
    })();
    
    // Setup "Quit" button event handlers.
    (function() {
        var button = $("#gui-quitButton");
        
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
            // Quit the map.
            G.mapman.quitMap();
        });
    })();
}();

G.GameWindow.GUI.showMapTitle = function(title) {
    // Show map title.
    var m = $("#mapTitle");
    m.text(title);
    m.show();
    
    // Fade title out after a timeout.
    setTimeout(function () {
        m.fadeOut(2000);
    }, 3000);
};

G.GameWindow.GUI.setHiScore = function(hiscore) {
    var hiscore = isNaN(hiscore) ? " - " : hiscore;
    $("#mapHiScore").text("Hi-score: " + hiscore);
};