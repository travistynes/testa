G.Item.EnergyCell.Assets = {
    mesh: undefined // The mesh template
};

// Add assets to be loaded by the asset manager.
G.Item.EnergyCell.Assets.register = function(manager) {
    // Load mesh.
    var mesh = manager.addMeshTask("", "", "./models/item/EnergyCell/", "cell.babylon");
    mesh.onSuccess = function(task) {
        var m = task.loadedMeshes[0];
        
        m.position = new BABYLON.Vector3(-10000, 0, 0); // Place our template mesh far away.
        
        G.Item.EnergyCell.Assets.mesh = m;
    };
};

G.Item.EnergyCell.create = function(scene, position, energy) {
    var item = {
        scene: scene,
        ready: true,
        disposed: false,
        createTime: new Date().getTime(),
        
        energy: energy
    };
    
    item.init = function() {
        this.createMesh();
        
        // Play animation.
        var from = 1;
        var to = 38;
        var loop = true;
        var speed = 1;
        var a = scene.beginAnimation(this.mesh.skeleton, from, to, loop, speed, function() {
            // Animation complete.
            
        });
        
        scene.registerBeforeRender(function() { item.logic(); });
    };
    
    item.createMesh = function() {
        this.mesh = G.Item.Key.Assets.mesh.clone("");
        this.mesh.skeleton = G.Item.Key.Assets.mesh.skeleton.clone("");
        this.mesh.owner = this;
        this.mesh.visibility = 1;
        
        this.mesh.material = new BABYLON.StandardMaterial("key", scene);
        this.mesh.material.diffuseColor = new BABYLON.Color3(.8, .7, .5); // Color in the presence of light.
        this.mesh.material.emissiveColor = new BABYLON.Color3(.8, .6, .6); // Color in the absence of any light.
        
        this.mesh.position = position.clone();
        this.mesh.scaling = new BABYLON.Vector3(.5, .5, .5);
        
        this.mesh.computeWorldMatrix(true);
        
        this.mesh.checkCollisions = true;
        //this.mesh.onCollide = this.onCollide;
        //this.mesh.showBoundingBox = true;
    };
    
    item.logic = function() {
        if(!this.ready || this.disposed) {
            return;
        }
        
        this.rotate();
    };
    
    item.rotate = function() {
        var dt = G.deltaTime;
        
        this.mesh.rotation.z += 1 * dt;
    };
    
    item.dispose = function() {
        if(this.disposed) {
            return;
        }
        
        this.disposed = true;
        
        this.mesh.dispose();
    };
    
    // We were hit by player.
    item.playerCollide = function(player) {
        // Give the player our energy.
        var e = this.energy;
        this.energy = 0;
        player.addEnergy(e);
        G.chat.system("Energy +" + e);
        
        this.mesh.checkCollisions = false;
        this.dispose();
    };
    
    // Finish initialization before returning.
    item.init();
    
    return item;
};