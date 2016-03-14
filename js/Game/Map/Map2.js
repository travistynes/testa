G.MapManager.Map2.Assets = {
    mesh: undefined // The mesh template
};

// Add assets to be loaded by the asset manager.
G.MapManager.Map2.Assets.register = function(manager, scene) {
    // Load mesh.
    var mesh = manager.addMeshTask("", "", "./models/map/Map2/", "map.babylon");
    mesh.onSuccess = function(task) {
        var m = task.loadedMeshes[0];
        
        G.MapManager.Map2.Assets.mesh = m;
    };
};

G.MapManager.Map2.create = function() {
    var map = {
        title: "Sloop",
        ready: false,
        disposed: false,
        scene: G.create(G.engine),
        
        mode: undefined,
        modes: {
            dev: {
                name: "dev",
                map: {
                    bounds: undefined,
                    gravity: new BABYLON.Vector3(0, 0, 0),
                    touchkill: false,
                    needKey: false
                },
                player: {
                    spawnPoint: new BABYLON.Vector3(0, 0, 0),
                    maxEnergy: 10000,
                    maxSpeed: 35,
                    acceleration: 60,
                    turnSpeed: Math.PI / 180 * 180,
                    forcefly: false,
                    gunEnabled: false,
                    devjump: false // True during a dev jump
                }
            },
            easy: {
                name: "easy",
                map: {
                    bounds: undefined,
                    gravity: new BABYLON.Vector3(0, 0, -30),
                    touchkill: true,
                    needKey: true
                },
                player: {
                    spawnPoint: new BABYLON.Vector3(0, 0, 0),
                    maxEnergy: 3000,
                    maxSpeed: 35,
                    acceleration: 30,
                    turnSpeed: Math.PI / 180 * 50,
                    forcefly: true,
                    gunEnabled: false
                }
            },
            normal: {
                name: "normal",
                map: {
                    bounds: undefined,
                    gravity: new BABYLON.Vector3(0, 0, -30),
                    touchkill: true,
                    needKey: true
                },
                player: {
                    spawnPoint: new BABYLON.Vector3(0, 0, 0),
                    maxEnergy: 2000,
                    maxSpeed: 50,
                    acceleration: 30,
                    turnSpeed: Math.PI / 180 * 120,
                    forcefly: true,
                    gunEnabled: false
                }
            }
        }
    };
    
    /*
    Load map.
    https://github.com/BabylonJS/Babylon.js/wiki/Using-AssetsManager
    http://doc.babylonjs.com/tutorials/16._Playing_sounds_and_music#loading-a-sound-using-the-assets-manager
    */
    map.load = function() {
        // Load map assets.
        var manager = new BABYLON.AssetsManager(this.scene);
        manager.useDefaultLoadingScreen = false; // Don't show the default babylon loading screen.
        
        // Register assets that need to be loaded.
        G.MapManager.Map2.Assets.register(manager, map.scene);
        G.Player.Assets.register(manager, map.scene);
        G.Enemy.Block.Assets.register(manager);
        G.Enemy.Pip.Assets.register(manager);
        G.Item.Key.Assets.register(manager);
        G.Item.EnergyCell.Assets.register(manager);
        G.Item.Bullet.Assets.register(manager, map.scene);
        G.Item.SpawnPoint.Assets.register(manager, map.scene);
        G.Item.MapGoal.Assets.register(manager, map.scene);
        
        // Called when the asset manager has finished loading assets.
        manager.onFinish = function(tasks) {
            // Assets are ready. Finish creating the map.
            map.init();
            
            // The map is loaded and ready.
            map.ready = true;
            
            map.onReady();
        };
        
        // Start loading assets.
        manager.load();
    };
    
    map.init = function() {
        // Set hiscore.
        this.hiscore = G.mapman.scores[G.mapman.currentMapNumber - 1] || { title: this.title, score: NaN, flightPath: [] };
        
        // Set mode.
        var modes = G.MapManager.modes;
        if(G.mapman.mode === modes.dev) {
            this.mode = this.modes.dev;
        } else if(G.mapman.mode === modes.easy) {
            this.mode = this.modes.easy;
        } else if(G.mapman.mode === modes.normal) {
            this.mode = this.modes.normal;
        }
        
        this.createMesh();
        this.bounds = this.createBounds();
        this.backgroundFar = this.createFarBackground();
        this.backgroundNear = this.createNearBackground();
        this.foreground = this.createForeground();
        this.keys = this.createKeys();
        //this.energyCells = this.createEnergyCells();
        //this.pips = this.createPips();
        //this.checkpoint = this.createCheckPoint();
        this.mapGoal = this.createMapGoal();
        
        // Create player.
        this.player = this.createPlayer();
        
        // Create cameras.
        this.createCameras();
        
        // Start map animations.
        //this.animate();
        
        this.scene.registerBeforeRender(function() { map.logic(); });
    };
    
    map.createMesh = function() {
        this.mesh = G.MapManager.Map2.Assets.mesh;
        //this.mesh.skeleton = G.MapManager.Map2.Assets.mesh.skeleton;
        this.mesh.owner = this;
        
        //this.mesh.material = new BABYLON.StandardMaterial("", this.scene);
        this.mesh.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
        this.mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
        
        this.mesh.position = new BABYLON.Vector3(0, 0, 0);
        this.mesh.scaling = new BABYLON.Vector3(1.3, 1.3, 1.3);
        this.mesh.rotation.y = Math.PI / 2;
        
        this.mesh.checkCollisions = true;
        //this.mesh.onCollide = this.onCollide;
        
        this.mesh.computeWorldMatrix(true);
    };
    
    // Create map bounds based on map mesh.
    map.createBounds = function() {
        // Get map bounding box.
        var bb = this.mesh.getBoundingInfo().boundingBox;
        var minX = bb.minimumWorld.x;
        var maxX = bb.maximumWorld.x;
        var minZ = bb.minimumWorld.z;
        var maxZ = bb.maximumWorld.z;
        
        var bounds = { left: minX, right: maxX, bottom: minZ, top: maxZ };
        
        this.modes.dev.map.bounds = bounds;
        this.modes.easy.map.bounds = bounds;
        this.modes.normal.map.bounds = bounds;
        
        return bounds;
    };
    
    map.createFarBackground = function() {
        var bounds = this.bounds;
        
        var plane = BABYLON.Mesh.CreatePlane("", 10.0, this.scene);
        plane.material = new BABYLON.StandardMaterial("", this.scene);
        plane.material.diffuseTexture = new BABYLON.Texture("textures/map/map1/background_far.png", this.scene);
        
        // Center to map mesh.
        var x = bounds.left + ((bounds.right - bounds.left) / 2);
        var z = bounds.bottom + ((bounds.top - bounds.bottom) / 2);
        
        plane.position = new BABYLON.Vector3(x, -100, z);
        plane.scaling = new BABYLON.Vector3(75, 75, 1);
        plane.rotation.x = Math.PI / 2;
        
        // Set random rotation on y.
        plane.rotation.y = Math.random() * (2 * Math.PI);
        
        plane.isPickable = false;
        
        return plane;
    };
    
    map.createNearBackground = function() {
        var bounds = this.bounds;
        
        var plane = BABYLON.Mesh.CreatePlane("", 10.0, this.scene);
        plane.material = new BABYLON.StandardMaterial("", this.scene);
        plane.material.diffuseTexture = new BABYLON.Texture("textures/map/map1/background_near.png", this.scene);
        
        // Center to map mesh.
        var x = bounds.left + ((bounds.right - bounds.left) / 2);
        var z = bounds.bottom + ((bounds.top - bounds.bottom) / 2);
        
        plane.position = new BABYLON.Vector3(x, -50, z);
        plane.scaling = new BABYLON.Vector3(75, 75, 1);
        plane.rotation.x = Math.PI / 2;
        plane.visibility = .5;
        
        // Set random rotation on y.
        plane.rotation.y = Math.random() * (2 * Math.PI);
        
        plane.isPickable = false;
        
        return plane;
    };
    
    /*
    Notes on foreground.
    This image should be almost completely transparent. It shrouds the entire view and is
    obtrusive if not careful.
    In gimp, I used a transparent background with white airbrush, 100% opacity,
    circle fuzzy (size 03) and "apply jitter" enabled. Then quickly run once over the canvas.
    In code, the foreground is set to 5% opacity. This gives a subtle cloud / atmospheric effect in-game.
    */
    map.createForeground = function() {
        var bounds = this.bounds;
        
        var plane = BABYLON.Mesh.CreatePlane("", 10.0, this.scene);
        plane.material = new BABYLON.StandardMaterial("", this.scene);
        plane.material.diffuseTexture = new BABYLON.Texture("textures/map/map1/foreground.png", this.scene);
        
        // Center to map mesh.
        var x = bounds.left + ((bounds.right - bounds.left) / 2);
        var z = bounds.bottom + ((bounds.top - bounds.bottom) / 2);
        
        plane.position = new BABYLON.Vector3(x, 20, z);
        plane.scaling = new BABYLON.Vector3(75, 75, 1);
        plane.rotation.x = Math.PI / 2;
        plane.visibility = .05;
        
        // Set random rotation on y.
        plane.rotation.y = Math.random() * (2 * Math.PI);
        
        plane.isPickable = false;
        
        return plane;
    };
    
    map.createCameras = function() {
        // Create a camera that will follow the player.
        this.trackCamera = G.Camera.TrackCamera.create(this.scene, this.player.mesh.position);
        this.trackCamera.addTarget(this.player.mesh);
        
        // Set the active camera.
        this.scene.activeCamera = this.trackCamera;
    };
    
    map.createKeys = function() {
        var bounds = this.bounds;
        var keys = [];
        
        //keys.push(G.Item.Key.create(this.scene, new BABYLON.Vector3(0.09, 0, 218.46)));
        
        return keys;
    };
    
    map.createEnergyCells = function() {
        var cells = [];
        
        var energy = 100;
        
        /*
        cells.push(G.Item.EnergyCell.create(this.scene, new BABYLON.Vector3(41.6, 0, 4.5), energy));
        cells.push(G.Item.EnergyCell.create(this.scene, new BABYLON.Vector3(76.2, 0, 4.5), energy));
        cells.push(G.Item.EnergyCell.create(this.scene, new BABYLON.Vector3(56.9, 0, 35.7), energy));
        cells.push(G.Item.EnergyCell.create(this.scene, new BABYLON.Vector3(5.9, 0, 21.5), energy));
        cells.push(G.Item.EnergyCell.create(this.scene, new BABYLON.Vector3(36.3, 0, 46.9), energy));
        cells.push(G.Item.EnergyCell.create(this.scene, new BABYLON.Vector3(2.6, 0, 72.3), energy));
        cells.push(G.Item.EnergyCell.create(this.scene, new BABYLON.Vector3(59.6, 0, 67.1), energy));
        cells.push(G.Item.EnergyCell.create(this.scene, new BABYLON.Vector3(2.2, 0, 96.9), energy));
        cells.push(G.Item.EnergyCell.create(this.scene, new BABYLON.Vector3(46.2, 0, 124.5), energy));
        cells.push(G.Item.EnergyCell.create(this.scene, new BABYLON.Vector3(-0.6, 0, 164.9), energy));
        cells.push(G.Item.EnergyCell.create(this.scene, new BABYLON.Vector3(57.1, 0, 152.9), energy));
        */
        
        return cells;
    };
    
    map.createPips = function() {
        var pips = [];
        
        var attached = true;
        pips.push(G.Enemy.Pip.create(this.scene, new BABYLON.Vector3(24.3, 0, 138.14), attached));
        pips.push(G.Enemy.Pip.create(this.scene, new BABYLON.Vector3(42.23, 0, 157.39), attached));
        pips.push(G.Enemy.Pip.create(this.scene, new BABYLON.Vector3(65.48, 0, 185.0), attached));
        pips.push(G.Enemy.Pip.create(this.scene, new BABYLON.Vector3(45.73, 0, 222.56), attached));
        pips.push(G.Enemy.Pip.create(this.scene, new BABYLON.Vector3(24.5, 0, 242.41), attached));
        
        return pips;
    };
    
    map.createCheckPoint = function() {
        var position = new BABYLON.Vector3(0.15, 0, 226.39);
        var scaling = new BABYLON.Vector3(4, 2, 4);
        var energy = 500;
        var checkpoint = G.Item.SpawnPoint.create(this.scene, position, scaling, energy);
        
        return checkpoint;
    };
    
    map.createMapGoal = function() {
        var position = new BABYLON.Vector3(0, 0, 150.6);
        var scaling = new BABYLON.Vector3(4, 2, 3);
        var mapGoal = G.Item.MapGoal.create(this.scene, position, scaling);
        
        return mapGoal;
    };
    
    map.createPlayer = function() {
        var player = G.Player.create(this.scene, this);
        p = player;
        
        return player;
    };
    
    map.setMode = function(mode) {
        this.player.modeChanged();
        
        // Apply settings.
        this.mode = mode;
    };
    
    map.logic = function() {
        // Rotate background.
        this.rotateBackground();
        
        this.mesh.computeWorldMatrix(true);
    };
    
    map.rotateBackground = function() {
        var dt = G.deltaTime;
        
        this.backgroundFar.rotation.y += (.03 * dt);
        this.backgroundNear.rotation.y -= (.03 * dt);
        this.foreground.rotation.y += (.005 * dt);
    };
    
    map.animate = function() {
        // Play animation.
        var from = 1;
        var to = 80;
        var loop = true;
        var speed = 1;
        var a = this.scene.beginAnimation(this.mesh.skeleton, from, to, loop, speed, function() {
            // Animation complete (won't happen on a looping animation).
        });
    };
    
    // We were hit by the player.
    map.playerCollide = function(player) {
        if(this.mode.map.touchkill) {
            // Player dies.
            player.die();
        }
    };
    
    map.dispose = function() {
        if(this.disposed) {
            return;
        }
        
        this.disposed = true;
        
        // Dispose player to cleanup event handlers.
        this.player.dispose();
        
        // Dispose the scene.
        this.scene.dispose();
    };
    
    // Load map.
    map.load();
    
    return map;
};