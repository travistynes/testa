G.Player.Assets = {
    mesh: undefined, // The mesh template
    audio: {
        engine: undefined,
        pop: undefined
    }
};

// Add assets to be loaded by the asset manager.
G.Player.Assets.register = function(manager, scene) {
    // Load mesh.
    var mesh = manager.addMeshTask("", "", "./models/ship/", "model.babylon");
    mesh.onSuccess = function(task) {
        var m = task.loadedMeshes[0]; t = task;
        m.position = new BABYLON.Vector3(-10000, 0, 0); // Place our template mesh far away.
        
        G.Player.Assets.mesh = m;
    };
    
    // Load audio.
    var s1 = manager.addBinaryFileTask("", "audio/sounds/thrust1.ogg");
    s1.onSuccess = function(task) {
        var m = new BABYLON.Sound("", task.data, scene, null, { playbackRate: 1, volume: .01, loop: true, autoplay: false });
        
        G.Player.Assets.audio.engine = m;
    };
    
    var pop1Task = manager.addBinaryFileTask("", "audio/sounds/pop1.ogg");
    pop1Task.onSuccess = function(task) {
        var m = new BABYLON.Sound("", task.data, scene, null, { playbackRate: 1, volume: .1, loop: false, autoplay: false });
        
        G.Player.Assets.audio.pop = m;
    };
};

G.Player.Messages = {
    die: [
        "You died.",
        "You had an accident. Be careful.",
        "Whoopsie!",
        "That was ugly."
    ],
    respawn: [
        "Go!",
        "Don't screw this up.",
        "Welcome back."
    ]
};

G.Player.create = function(scene, map) {
    var player = {
        ready: false,
        disposed: false,
        alive: true,
        
        runTime: undefined, // Current run time.
        startTime: new Date(), // Start time of current run.
        
        energy: 0,
        energyCostPerFrame: 0,
        
        speed: 0,
        moveForward: false,
        turnLeft: false,
        turnRight: false,
        moveCost: 15,
        turnCost: 5,
        
        engineEmitter: new BABYLON.Mesh.CreateBox("", 1, scene), // Engine particle system emitter location
        leftThrustEmitter: new BABYLON.Mesh.CreateBox("", 1, scene),
        rightThrustEmitter: new BABYLON.Mesh.CreateBox("", 1, scene),
        
        bullet: {},
        fireShot: false,
        bulletCost: 20,
        lastShotTime: 0, // Last shot time in milliseconds.
        shotDelay: 500, // Time delay before next shot can be fired, in milliseconds.
        
        cutEngine: false,
        engineStallCost: 10,
        lastEngineStallTime: 0,
        engineStallDuration: 300,
        
        deathCost: 25,
        respawnCost: 25,
        
        keys: 0,
        flightPath: [],
        bestFlightPathMeshes: [],
        lastPathTrackTime: 0
    };
    
    player.init = function() {
        // Create mesh.
        this.createMesh();
        
        // Add event listeners.
        window.addEventListener("keydown", this.keydown, false);
        window.addEventListener("keyup", this.keyup, false);
        
        // Set starting energy.
        this.addEnergy(map.mode.player.maxEnergy);
        this.energy = map.mode.player.maxEnergy; // addEnergy currently disabled.
        
        // Show the best flight path if it is toggled on.
        this.toggleBestFlightPath($("#flightPathCheckBox").prop("checked"));
        
        // Register to run logic.
        scene.registerBeforeRender(function() { player.logic(); });
    };
    
    player.createMesh = function() {
        this.mesh = G.Player.Assets.mesh.clone("");
        this.mesh.owner = this;
        
        this.mesh.material.emissiveColor = {r: .2, g: .2, b: .2};
        this.mesh.material.diffuseColor = {r: 1, g: 1, b: 1};
        this.mesh.material.specularColor = {r: 1, g: 1, b: 1};
        
        // Position.
        this.mesh.position = map.mode.player.spawnPoint.clone();
        
        // Rotate to face up.
        this.mesh.rotation.y = -Math.PI / 2;
        
        // Scale.
        var scale = .5;
        this.mesh.scaling = {x: scale, y: scale, z: scale};
        
        this.mesh.computeWorldMatrix(true);
        
        // Register for collisions.
        this.mesh.checkCollisions = true;
        this.mesh.onCollide = this.onCollide;
        
        // Create particle system.
        this.createParticleSystem();
        
        this.ready = true;
    };
    
    player.modeChanged = function() {
        // Reset some fields.
        //this.speed = 0;
        this.moveForward = false;
    };
    
    /*
    Note: This is an event handler called by window on the "keydown" event.
    The 'this' reference will not refer to 'player', but to 'window'. So we need
    to access the player's properties and methods through 'player', not 'this'.
    */
    player.keydown = function(e) {
        var key = e.keyCode;
        
        switch(key) {
            case 87:
                // w
                player.moveForward = true;
                player.fireShot = true;
                break;
            case 83:
                // s
                break;
            case 65:
                // a
                player.turnLeft = true;
                player.bullet.turnLeft = true;
                break;
            case 68:
                // d
                player.turnRight = true;
                player.bullet.turnRight = true;
                break;
            case 32:
                // spacebar
                player.cutEngine = true;
                break;
        }
    };
    
    player.keyup = function(e) {
        var key = e.keyCode;
        switch(key) {
            case 87:
                // w
                player.moveForward = false;
                player.fireShot = false;
                break;
            case 83:
                // s
                break;
            case 65:
                // a
                player.turnLeft = false;
                player.bullet.turnLeft = false;
                break;
            case 68:
                // d
                player.turnRight = false;
                player.bullet.turnRight = false;
                break;
            case 32:
                // spacebar
                player.cutEngine = false;
                break;
        }
    };
    
    player.logic = function() {
        if(!this.ready || this.disposed) {
            return;
        }
        
        var dt = G.deltaTime;
        
        if(this.alive) {
            this.move();
            this.stallEngine();
            this.checkBounds();
            this.trackFlightPath();
            
            if(map.mode.player.gunEnabled) {
                this.shoot();
            }
        }
        
        // Decrease resources.
        this.addEnergy(-(this.energyCostPerFrame * dt));
        
        // Update run time.
        this.updateRunTime();
    };
    
    player.move = function() {
        var dt = G.deltaTime;
        
        var m = this.mesh;
        var accel = map.mode.player.acceleration * dt;
        var canMove = true;
        
        if(map.mode.player.forcefly) {
            if(!this.cutEngine) {
                // Force fly.
                this.moveForward = true;
            } else {
                // Cut engine.
                this.moveForward = false;
            }
        }
        
        // Check energy requirement.
        var require = this.moveCost * dt;
        if(this.energy < require || this.energy === 0) {
            accel = 0;
            canMove = false;
        }
        
        if(this.moveForward && canMove) {
            // Remove energy.
            this.addEnergy(-require);
            
            // Accelerate.
            this.enginePS.start();
            this.speed += accel;
            if(this.speed > map.mode.player.maxSpeed) {
                this.speed = map.mode.player.maxSpeed;
            }
        } else {
            // Decelerate.
            this.enginePS.stop();
            this.speed -= (map.mode.player.acceleration * dt);
            if(this.speed < 0) {
                this.speed = 0;
            }
        }
        
        // Calculate the forward vector.
        var x = Math.cos(m.rotation.y) * this.speed * dt;
        var z = Math.sin(m.rotation.y) * this.speed * dt;
        var f = new BABYLON.Vector3(x, 0, -z);
        
        // Apply gravity.
        f = f.add(map.mode.map.gravity.multiplyByFloats(dt, dt, dt));
        
        // Move.
        //m.movePOV(this.speed, 0, 0); // This works, but doesn't test for collisions.
        m.moveWithCollisions(f);
        
        // Play engine thrust sound.
        if(this.speed === 0) {
            // Stop engine sound if it is playing.
            if(G.Player.Assets.audio.engine.isPlaying) {
                G.Player.Assets.audio.engine.stop();
            }
        } else {
            // Play engine sound.
            if(!G.Player.Assets.audio.engine.isPlaying) {
                G.Player.Assets.audio.engine.play();
            }
            
            var maxVolume = .01;
            var maxPlaybackRate = 2;
            G.Player.Assets.audio.engine.setVolume((this.speed / map.mode.player.maxSpeed) * maxVolume);
            G.Player.Assets.audio.engine.setPlaybackRate((this.speed / map.mode.player.maxSpeed) * maxPlaybackRate);
        }
        
        // Perform left/right rotations.
        require = this.turnCost * dt;
        var canTurn = true;
        if(this.energy < require || this.energy === 0 || this.bullet.alive) {
            canTurn = false;
        }
        
        if(this.turnLeft && canTurn) {
            // Remove energy.
            this.addEnergy(-require);
            
            this.rightThrustPS.start();
            
            //m.rotate(BABYLON.Axis.Y, -map.mode.player.turnSpeed, BABYLON.Space.WORLD);
            m.rotation.y -= (map.mode.player.turnSpeed * dt);
        } else {
            this.rightThrustPS.stop();
        }
        
        if(this.turnRight && canTurn) {
            // Remove energy.
            this.addEnergy(-require);
            
            this.leftThrustPS.start();
            
            //m.rotate(BABYLON.Axis.Y, map.mode.player.turnSpeed, BABYLON.Space.LOCAL);
            m.rotation.y += (map.mode.player.turnSpeed * dt);
        } else {
            this.leftThrustPS.stop();
        }
        
        // Stay locked on the y axis. Collisions can push us up or down.
        if(!map.mode.player.devjump) {
            m.position.y = map.mode.player.spawnPoint.y;
        }
        
        m.computeWorldMatrix(true);
    };
    
    player.shoot = function() {
        if(!this.fireShot || this.bullet.alive) {
            return;
        }
        
        // Check if a shot can be fired.
        var d = new Date().getTime();
        if(d < this.lastShotTime + this.shotDelay) {
            return;
        }
        
        // Check if there is enough energy to fire a bullet.
        if(this.energy < this.bulletCost) {
            return;
        }
        
        // Calculate the shot direction unit vector.
        var x = Math.cos(this.mesh.rotation.y);
        var z = Math.sin(this.mesh.rotation.y); // Rotations are negative counter clockwise, resulting in a "backwards" direction.
        var direction = new BABYLON.Vector3(x, 0, -z);
        
        // Spawn bullet and set it as our current bullet.
        this.bullet = G.Item.Bullet.create(scene, this, direction);
        
        // Make the bullet the camera's current target.
        map.trackCamera.addTarget(this.bullet.mesh);
        
        this.lastShotTime = d;
        
        // Remove energy.
        this.addEnergy(-this.bulletCost);
    };
    
    player.stallEngine = function() {
        if(!this.cutEngine) {
            return;
        }
        
        if(map.mode.name === "dev") {
            if(!map.mode.player.devjump) {
                map.mode.player.devjump = true;
                
                var oPos = this.mesh.position.y;
                
                // Raise up above the map.
                this.mesh.position.y = 50;
                
                setTimeout(function() {
                    // Reset y position.
                    player.mesh.position.y = oPos;
                    map.mode.player.devjump = false;
                }, 1000);
            }
            
            return;
        }
        
        // Check if engine can be stalled.
        var d = new Date().getTime();
        if(d < this.lastEngineStallTime + this.engineStallDuration) {
            return;
        }
        
        if(this.energy < this.engineStallCost) {
            return;
        }
        
        this.lastEngineStallTime = d;
        
        // Remove energy.
        this.addEnergy(-this.engineStallCost);
    };
    
    /*
    If we go out of bounds, we need to die. Important if we run out
    of energy while flying and fall. Energy isn't quite 0, but we can't move.
    */
    player.checkBounds = function() {
        var x = this.mesh.position.x;
        var z = this.mesh.position.z;
        var bounds = map.mode.map.bounds;
        var buffer = 50;
        
        if(x < bounds.left - buffer || x > bounds.right + buffer || z < bounds.bottom - buffer || z > bounds.top + buffer) {
            G.chat.system("Out of bounds!");
            
            this.die();
        }
    };
    
    /*
    Track the flight path by creating markers at the player's position periodically.
    */
    player.trackFlightPath = function() {
        var now = new Date().getTime();
        
        if(now < this.lastPathTrackTime + 100) {
            return;
        }
        
        this.lastPathTrackTime = now;
        
        // Save player's current position.
        this.flightPath.push(this.mesh.position.clone());
    };
    
    player.resetFlightPath = function() {
        this.flightPath = [];
    };
    
    player.toggleBestFlightPath = function(showPath) {
        if(!showPath) {
            // Clear the flight path meshes.
            for(var a = 0; a < this.bestFlightPathMeshes.length; a++) {
                var mesh = this.bestFlightPathMeshes[a];
                mesh.dispose();
            }
        } else {
            // Make the current flight path the previous, and clear the current.
            this.bestFlightPathMeshes = [];
            
            var segments = 1;
            var diameter = .5;
            
            for(var a = 0; a < map.hiscore.flightPath.length; a++) {
                var pos = map.hiscore.flightPath[a];
                var mesh = new BABYLON.Mesh.CreateSphere("", segments, diameter, scene);
                
                mesh.material = new BABYLON.StandardMaterial("", scene);
                mesh.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
                mesh.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
                //material.diffuseTexture = new BABYLON.Texture("textures/crate.gif", scene);
                mesh.visibility = .3;
                
                mesh.position = new BABYLON.Vector3(pos.x, pos.y, pos.z);
                mesh.scaling = {x: 1, y: 1, z: 1};
                mesh.isPickable = false;
                
                mesh.computeWorldMatrix(true);
                
                this.bestFlightPathMeshes.push(mesh);
            }
        }
    };
    
    player.addEnergy = function(e) {
        return;
        
        this.energy += e;
        //console.trace();
        if(this.energy > map.mode.player.maxEnergy) {
            this.energy = map.mode.player.maxEnergy;
        } else if(this.energy < 0) {
            this.energy = 0;
        }
        
        var p = (this.energy / map.mode.player.maxEnergy) * 100;
        $("#energyBar").width(String(p) + "%");
    };
    
    player.updateRunTime = function() {
        if(!this.ready || !this.alive) {
            return;
        }
        
        this.runTime = (new Date().getTime() - this.startTime.getTime()) / 1000;
        $("#mapTimer").html(this.runTime.toFixed(2));
    }
    
    /*
    Create player particle systems.
    https://github.com/BabylonJS/Babylon.js/wiki/12-Particles
    */
    player.createParticleSystem = function() {
        // Engine particle system.
        this.engineEmitter.parent = this.mesh;
        this.engineEmitter.movePOV(1.5, 0, 0); // Move back from the player a bit.
        this.engineEmitter.scaling = new BABYLON.Vector3(.5, .5, .5); // Scale down so the particle stream is narrower.
        this.engineEmitter.isPickable = false; // Disable picking (which would block rays).
        this.engineEmitter.visibility = false;
        
        var enginePS = new BABYLON.ParticleSystem("", 200, scene);
        enginePS.particleTexture = new BABYLON.Texture("textures/particle1.png", scene);
        enginePS.textureMask = new BABYLON.Color4(.1, .5, .5, 1);
        enginePS.emitRate = 200;
        enginePS.minEmitPower = .3;
        enginePS.maxEmitPower = .3;
        enginePS.minLifeTime = .03;
        enginePS.maxLifeTime = .04;
        enginePS.minSize = .3;
        enginePS.maxSize = .4;
        enginePS.direction1 = new BABYLON.Vector3(-100, 0, 0);
        enginePS.direction2 = new BABYLON.Vector3(-100, 0, 0);
        enginePS.emitter = this.engineEmitter;
        this.enginePS = enginePS;
        
        // Left thrust particle system.
        this.leftThrustEmitter.parent = this.mesh;
        this.leftThrustEmitter.movePOV(0, 0, -1);
        this.leftThrustEmitter.scaling = new BABYLON.Vector3(.5, .5, .5);
        this.leftThrustEmitter.isPickable = false;
        this.leftThrustEmitter.visibility = false;
        
        var leftThrustPS = new BABYLON.ParticleSystem("", 100, scene);
        leftThrustPS.particleTexture = new BABYLON.Texture("textures/particle1.png", scene);
        leftThrustPS.textureMask = new BABYLON.Color4(.8, .5, .3, 1);
        leftThrustPS.emitRate = 100;
        leftThrustPS.minEmitPower = .3;
        leftThrustPS.maxEmitPower = .3;
        leftThrustPS.minLifeTime = .04;
        leftThrustPS.maxLifeTime = .05;
        leftThrustPS.minSize = .3;
        leftThrustPS.maxSize = .3;
        leftThrustPS.direction1 = new BABYLON.Vector3(10, 0, 100);
        leftThrustPS.direction2 = new BABYLON.Vector3(10, 0, 100);
        leftThrustPS.emitter = this.leftThrustEmitter;
        this.leftThrustPS = leftThrustPS;
        
        // Right thrust particle system.
        this.rightThrustEmitter.parent = this.mesh;
        this.rightThrustEmitter.movePOV(0, 0, 1);
        this.rightThrustEmitter.scaling = new BABYLON.Vector3(.5, .5, .5);
        this.rightThrustEmitter.isPickable = false;
        this.rightThrustEmitter.visibility = false;
        
        var rightThrustPS = new BABYLON.ParticleSystem("", 100, scene);
        rightThrustPS.particleTexture = new BABYLON.Texture("textures/particle1.png", scene);
        rightThrustPS.textureMask = new BABYLON.Color4(.8, .5, .3, 1);
        rightThrustPS.emitRate = 100;
        rightThrustPS.minEmitPower = .3;
        rightThrustPS.maxEmitPower = .3;
        rightThrustPS.minLifeTime = .04;
        rightThrustPS.maxLifeTime = .05;
        rightThrustPS.minSize = .3;
        rightThrustPS.maxSize = .3;
        rightThrustPS.direction1 = new BABYLON.Vector3(0, 0, -100);
        rightThrustPS.direction2 = new BABYLON.Vector3(0, 0, -100);
        rightThrustPS.emitter = this.rightThrustEmitter;
        this.rightThrustPS = rightThrustPS;
    };
    
    player.explode = function() {
        // Create particle system.
        var ps = new BABYLON.ParticleSystem("", 5000, scene);
        ps.particleTexture = new BABYLON.Texture("textures/particle1.png", scene);
        ps.textureMask = new BABYLON.Color4(.3, .8, .8, 1);
        ps.manualEmitCount = 5000; // One shot particle emission
        ps.minEmitPower = 1;
        ps.maxEmitPower = 2;
        ps.minLifeTime = .4;
        ps.maxLifeTime = .5;
        ps.minSize = .4;
        ps.maxSize = .4;
        ps.targetStopDuration = ps.maxLifeTime; // Should be at least maxLifeTime. Without setting this, system won't auto dispose even when disposeOnStop is true.
        ps.disposeOnStop = true;
        
        var dir = 25;
        ps.direction1 = new BABYLON.Vector3(dir, -dir, -dir);
        ps.direction2 = new BABYLON.Vector3(-dir, dir, dir);
        ps.emitter = this.mesh.position.clone();
        ps.start();
    };
    
    player.die = function() {
        if(!this.alive) {
            return;
        }
        
        G.chat.warn(G.Utils.getRandomItem(G.Player.Messages.die));
        
        // Disable the player.
        this.alive = false;
        this.mesh.checkCollisions = false;
        this.mesh.visibility = .2;
        this.speed = 0;
        this.turnLeft = false;
        this.turnRight = false;
        this.enginePS.stop();
        this.leftThrustPS.stop();
        this.rightThrustPS.stop();
        
        // Play death sound.
        G.Player.Assets.audio.pop.play();
        
        // Explode.
        this.explode();
        
        // Remove energy.
        this.addEnergy(-this.deathCost);
        
        if(this.energy > this.respawnCost) {
            // Start respawn timer.
            var counter = 1;
            function f() {
                if(player.disposed) {
                    return;
                }
                
                if(counter == 0) {
                    // Respawn.
                    player.respawn();
                } else {
                    counter--;
                    setTimeout(f, 500);
                }
            }
            setTimeout(f, 500);
        } else {
            // Player is out of energy. Game over.
            G.lose();
        }
    };
    
    player.respawn = function() {
        if(this.alive) {
            return;
        }
        
        // Respawn the player.
        this.alive = true;
        this.startTime = new Date();
        this.mesh.checkCollisions = true;
        this.mesh.visibility = 1;
        this.mesh.rotation.y = -Math.PI / 2; // Point straight up.
        
        // Use player spawn point, if set, or the map setting spawn point.
        if(this.spawnPoint) {
            this.mesh.position = this.spawnPoint.clone();
        } else {
            this.mesh.position = map.mode.player.spawnPoint.clone();
        }
        
        // Remove energy.
        this.addEnergy(-this.respawnCost);
        
        // Reset the player's flight path.
        this.resetFlightPath();
        
        G.chat.info(G.Utils.getRandomItem(G.Player.Messages.respawn));
    };
    
    // We collided with object.
    player.onCollide = function(mesh) {
        if(mesh.owner && mesh.owner.playerCollide) {
            mesh.owner.playerCollide(player);
        }
    };
    
    // We were hit by a bullet.
    player.bulletCollide = function(bullet) {
        this.die();
    };
    
    // We were hit by a pod.
    player.podCollide = function(pod) {
        if(pod.owner === this) {
            // This is our pod. Take it's energy.
            this.addEnergy(pod.energy);
        } else {
            // We don't own this pod. We lose energy in the amount of the pod's energy.
            this.addEnergy(-pod.energy);
        }
    };
    
    // Cleanup.
    player.dispose = function() {
        if(this.disposed) {
            return;
        }
        
        this.disposed = true;
        
        // Remove listeners.
        window.removeEventListener("keydown", player.keydown, false);
        window.removeEventListener("keyup", player.keyup, false);
    };
    
    // Finish initialization before returning.
    player.init();
    
    return player;
};