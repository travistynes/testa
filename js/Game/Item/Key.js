G.Item.Key.Assets = {
    mesh: undefined // The mesh template
};

// Add assets to be loaded by the asset manager.
G.Item.Key.Assets.register = function(manager) {
    // Load mesh.
    var mesh = manager.addMeshTask("", "", "./models/item/Key/", "key.babylon");
    mesh.onSuccess = function(task) {
        var m = task.loadedMeshes[0];
        
        m.position = new BABYLON.Vector3(-10000, 0, 0); // Place our template mesh far away.
        
        G.Item.Key.Assets.mesh = m;
    };
};

G.Item.Key.create = function(scene, position) {
    var item = {
        scene: scene,
        ready: true,
        disposed: false,
        createTime: new Date().getTime(),
        alive: true,
        owner: undefined,
        
        directionToOwner: undefined,
        distanceToOwner: 0,
        followDistance: 10,
        acceleration: 15,
        speed: 0,
        maxSpeed: 15
    };
    
    item.init = function() {
        this.createMesh();
        //this.createLight();
        
        // Play animation.
        var from = 1;
        var to = 38;
        var loop = true;
        var speed = 2;
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
        this.mesh.scaling = new BABYLON.Vector3(1, 1, 1);
        
        this.mesh.computeWorldMatrix(true);
        
        this.mesh.checkCollisions = true;
        this.mesh.onCollide = this.onCollide;
        //this.mesh.showBoundingBox = true;
    };
    
    item.createLight = function() {
        var position = new BABYLON.Vector3(0, 10, 0);
        var light = new BABYLON.PointLight("", position, scene);
        light.range = 40;
        light.intensity = .3;
        light.diffuse = new BABYLON.Color3(0, 0, 1);
        light.specular = new BABYLON.Color3(1, 1, 1);
        light.parent = this.mesh;
    };
    
    item.logic = function() {
        if(!this.ready || this.disposed) {
            return;
        }
        
        // Perform movement.
        this.followOwner();
    };
    
    item.followOwner = function() {
        if(!this.owner && !this.directionToOwner) {
            return;
        }
        
        var dt = G.deltaTime;
        var m = this.mesh;
        
        if(this.owner) {
            // Look at our owner. This is for fun, not necessary for movement calculations.
            //m.lookAt(this.owner.mesh.position);
            
            // Get direction vector and distance to owner.
            var o = this.owner.mesh;
            
            var path = new BABYLON.Path3D([m.position, o.position]);
            this.directionToOwner = path.getTangents()[0];
            
            // Get distance to owner. Each element is the distance from the first point passed in the path (ie. the first element is always 0).
            this.distanceToOwner = path.getDistances()[1];
        }
        
        if(this.owner && this.distanceToOwner > this.followDistance) {
            // Accelerate.
            this.speed += (this.acceleration * dt);
            if(this.speed > this.maxSpeed) {
                this.speed = this.maxSpeed;
            }
        } else {
            // Decelerate, even if we suddenly lose our owner.
            this.speed -= (this.acceleration * dt);
            if(this.speed < 0) {
                this.speed = 0;
            }
        }
        
        // Calculate the movement vector.
        var x = this.directionToOwner.x * this.speed * dt;
        var z = this.directionToOwner.z * this.speed * dt;
        var f = new BABYLON.Vector3(x, 0, z);
        
        // Move.
        //m.moveWithCollisions(f);
        m.locallyTranslate(f);
        
        // Stay locked on the y axis. Collisions can push the object up or down.
        m.position.y = 0;
        
        m.computeWorldMatrix(true);
    };
    
    // We collided with object.
    item.onCollide = function(mesh) {
        if(mesh.owner && mesh.owner.keyCollide) {
            mesh.owner.keyCollide(item);
        }
    };
    
    // We were hit by player.
    item.playerCollide = function(player) {
        if(this.owner === player) {
            // The player is our owner.
        } else {
            // The player will now become our owner.
            this.owner = player;
            this.owner.keys++; // Add to key count.
            this.mesh.checkCollisions = false;
            G.chat.system("Key acquired.");
            
            // Destroy key.
            this.dispose();
        }
    };
    
    // Called when the player drops the key (player dies).
    item.drop = function() {
        // Position the key where the player dropped it, so the key isn't lost inside the map.
        this.mesh.position = this.owner.mesh.position.clone();
        
        this.owner.key = null;
        this.owner = null;
        this.speed = 0;
        this.mesh.checkCollisions = true;
        
        G.chat.system("Dropped key.");
    };
    
    item.dispose = function() {
        if(this.disposed) {
            return;
        }
        
        this.disposed = true;
        
        this.mesh.dispose();
    };
    
    // Finish initialization before returning.
    item.init();
    
    return item;
};