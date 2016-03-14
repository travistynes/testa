G.Item.MapGoal.Assets = {
    audio: {
        chime: undefined
    }
};

G.Item.MapGoal.Assets.register = function(manager, scene) {
    // Load audio.
    var t = manager.addBinaryFileTask("", "audio/sounds/chime1.ogg");
    t.onSuccess = function(task) {
        var m = new BABYLON.Sound("", task.data, scene, null, { playbackRate: 1, volume: .05, loop: false, autoplay: false });
        
        G.Item.MapGoal.Assets.audio.chime = m;
    };
};

G.Item.MapGoal.create = function(scene, position, scaling) {
    var item = {
        scene: scene,
        ready: true,
        disposed: false,
        used: false
    };
    
    item.init = function() {
        this.createMesh();
        
        scene.registerBeforeRender(function() { item.logic(); });
    };
    
    item.createMesh = function() {
        this.mesh = new BABYLON.Mesh.CreateBox("", 1, scene);
        this.mesh.owner = this;
        
        this.mesh.material = new BABYLON.StandardMaterial("", scene);
        this.mesh.material.diffuseColor = new BABYLON.Color3(.2, .1, .8); // Color in the presence of light.
        this.mesh.material.emissiveColor = new BABYLON.Color3(.1, .4, .6); // Color in the absence of any light.
        this.mesh.visibility = .4;
        
        this.mesh.position = position.clone();
        this.mesh.scaling = scaling.clone();
        
        this.mesh.computeWorldMatrix(true);
        
        //this.mesh.checkCollisions = true;
        //this.mesh.onCollide = this.onCollide;
        //this.mesh.showBoundingBox = true;
    };
    
    item.logic = function() {
        if(this.ready && !this.used) {
            this.waitForPlayer();
        }
    };
    
    // We collided with object.
    item.onCollide = function(mesh) {
        
    };
    
    // We were hit by player.
    item.waitForPlayer = function() {
        if(!this.ready || this.used) {
            return;
        }
        
        var player = G.mapman.currentMap.player;
        
        if(!this.mesh.intersectsPoint(player.mesh.position)) {
            return;
        }
        
        // Player hit us. Check if all keys acquired.
        var map = G.mapman.currentMap;
        var need = map.keys.length;
        
        if(map.mode.map.needKey && player.keys < need) {
            // No key.
            G.chat.warn(player.keys + "/" + need + " keys.");
            
            // Temporarily disable the goal to prevent spam.
            this.ready = false;
            setTimeout(function() {
                item.ready = true;
            }, 2000);
        } else {
            G.chat.system("Goal!");
            this.used = true;
            this.mesh.visibility = .8;
            player.ready = false; // Stop player logic, basically pauses player.
            
            // Play chime.
            G.Item.MapGoal.Assets.audio.chime.play();
            
            // Celebrate.
            this.celebrate();
            
            // Show the map win window.
            G.GameWindow.MapWin.win();
        }
    };
    
    item.celebrate = function() {
        // Explosion.
        this.explode();
    };
    
    item.explode = function() {
        // Create particle system.
        var ps = new BABYLON.ParticleSystem("", 10000, scene);
        ps.particleTexture = new BABYLON.Texture("textures/particle1.png", scene);
        ps.textureMask = new BABYLON.Color4(.8, .8, .8, 1);
        ps.manualEmitCount = 10000; // One shot particle emission
        ps.minEmitPower = 1;
        ps.maxEmitPower = 2;
        ps.minLifeTime = .5;
        ps.maxLifeTime = .6;
        ps.minSize = .4;
        ps.maxSize = .5;
        ps.targetStopDuration = ps.maxLifeTime; // Should be at least maxLifeTime. Without setting this, system won't auto dispose even when disposeOnStop is true.
        ps.disposeOnStop = true;
        
        var dir = 25;
        ps.direction1 = new BABYLON.Vector3(dir, -dir, dir);
        ps.direction2 = new BABYLON.Vector3(-dir, dir, dir);
        ps.emitter = this.mesh.position.clone();
        ps.start();
    };
    
    // Finish initialization before returning.
    item.init();
    
    return item;
};