// Define namespaces objects.
var G = {
    Utils: {
        MessageBox: {},
        MusicPlayer: {}
    },
    SplashScreen: {},
    GameWindow: {
        GUI: {},
        MapWin: {},
        GameOver: {}
    },
    Camera: {
        TrackCamera: {}
    },
    MapManager: {
        Map1: {},
        Map2: {}
    },
    Player: {},
    Enemy: {
        Block: {},
        Pip: {},
        Podder: {
            Pod: {}
        }
    },
    Item: {
        MapGoal: {},
        SpawnPoint: {},
        Bullet: {},
        Key: {},
        EnergyCell: {}
    }
};

G.init = function() {
    // Disable right click context menu on the canvas.
    $("body").on("contextmenu", "#viewport", function(e) { return false; });
    
    // Create engine.
    G.canvas = document.getElementById("viewport");
    var engine = new BABYLON.Engine(G.canvas, true);
    G.engine = engine;
    
    // Set hardware scaling level for better performance (1 is default, full resolution, 2 is half resolution, etc.).
    G.engine.setHardwareScalingLevel(1.5); // 2 may be a bit too blurry.
    
    // Create message box object for adding messages.
    G.chat = G.Utils.MessageBox.create("messageBox");
    G.chat.system("Welcome to TEST A.");
    
    // Window resize listener.
    window.addEventListener("resize", function() { G.updateViewport(engine); });
    
    // Create map manager.
    G.mapman = G.MapManager.create();
    G.SplashScreen.setMessage(); // Set the splash screen message.
    
    // Create music player.
    G.musicPlayer = G.Utils.MusicPlayer.create()
    
    // Click the normal mode button on the splash screen by default.
    var button = $("#SplashScreen-normalButton");
    button.click();
    
    // Start render loop.
    engine.runRenderLoop(function() {
        if(!G.activeScene) {
            return;
        }
        
        /*
        Calculate the delta time using the engine.fps which is averaged over the past 60 frames.
        This leads to smoother motion than using the engine.deltaTime which changes each frame
        and causes noticeable jerky motion.
        */
        G.deltaTime = 1 / engine.fps;
        
        /*
        The engine.fps is an average over the past 60 frames. When the real framerate changes,
        the engine.fps can take about a second to "catch up" to the real framerate.
        
        This leads to two scenarios:
        1) If the framerate drops, for about a second we are using an out of date fps for motion
        and can see a noticeable slow down (framerate lag). This isn't really a problem.
        
        2) If the framerate increases, we get the opposite outcome, which is a big problem.
        This can happen when the game tab is not active. If the user is browsing another tab,
        the engine is running a low framerate to save power. The engine.fps can be as low as 5 fps.
        When the user switches to the game tab, the real framerate can jump back to 60, but for about
        a second our motion is calculated using a framerate of 5 and things move too fast.
        The player can fall through platforms, and other bad things. To fix this, we check that
        if the real framerate differs from the averaged framerate by a large amount,
        just stop rendering the game until the engine.fps reflects reality.
        */
        var instantFramerate = 1 / (engine.deltaTime / 1000);
        if(instantFramerate - engine.fps > 30 // This condition handles the above described problem on some laptops, as expected, but not on my chromebook for some reason.
            || engine.fps < 10 // For some reason the above condition still allows fast motion on my chromebook. This condition handles it. I need to figure this one out sometime.
            ) {
            //console.log("real: " + instantFramerate + ", fps: " + engine.fps);
            return;
        }
        
        G.activeScene.render();
    });
};

// Lose game.
G.lose = function() {
    G.GameWindow.GameOver.lose();
};

// Win game.
G.win = function() {
    G.GameWindow.GameOver.win();
};

G.loadScene = function(engine) {
    BABYLON.SceneLoader.Load("./models/test/", "pip.babylon", engine, function(newScene) {
        newScene.executeWhenReady(function() {
            var scene = newScene;
            
            // Add light.
            //var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
            //light.groundColor = new BABYLON.Color3(.3, .3, .3);
            
            // Add camera
            var alpha = -Math.PI / 2;
            var beta = Math.PI / 3;
            var radius = 7;
            var camera = new BABYLON.ArcRotateCamera("Camera", alpha, beta, radius, BABYLON.Vector3.Zero(), scene);
            camera.inertia = .9;
            
            scene.activeCamera = camera;
            scene.activeCamera.attachControl(G.canvas); // Enable default keyboard/mouse control.
            
            G.activeScene = scene;
        });
    }, function(progress) {
        
    });
};

G.updateViewport = function(engine) {
    engine.resize();
};

// Initialize the game when the dom is fully loaded. This includes the javascript files loaded in the body in index.html.
window.addEventListener("DOMContentLoaded", G.init);
