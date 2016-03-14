G.Enemy.Block.Assets = {
    mesh: undefined // The mesh template
};

// Add assets to be loaded by the asset manager.
G.Enemy.Block.Assets.register = function(manager) {
    // Load mesh.
    var mesh = manager.addMeshTask("", "", "./models/enemy/blocks/", "block1.babylon");
    mesh.onSuccess = function(task) {
        var m = task.loadedMeshes[0];
        
        m.position = new BABYLON.Vector3(-10000, 0, 0); // Place our template mesh far away.
        
        G.Enemy.Block.Assets.mesh = m;
    };
};

G.Enemy.Block.create = function(scene, position, scaling) {
    var block = {
        ready: true,
        disposed: false,
        attached: true,
        
        acceleration: 10,
        speed: 0,
        maxSpeed: 30
    };
    
    block.init = function() {
        this.createMesh();
        
        scene.registerBeforeRender(function() { block.logic(); });
    };
    
    block.createMesh = function() {
        this.mesh = G.Enemy.Block.Assets.mesh.clone("");
        this.mesh.owner = this;
        
        //this.mesh.material = new BABYLON.StandardMaterial("", scene);
        this.mesh.material.diffuseColor = new BABYLON.Color3(.8, 1, 1);
        this.mesh.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
        
        this.mesh.position = position.clone();
        this.mesh.scaling = scaling.clone();
        this.mesh.ellipsoid = this.mesh.scaling;
        
        this.mesh.checkCollisions = true;
        this.mesh.onCollide = this.onCollide;
        
        this.mesh.computeWorldMatrix(true);
        
        // Give the block a random chance of spawning a pip.
        if(Math.random() < 0) {
            // Create pip. Position to the bottom of the block, like a little dangler.
            var pipPos = new BABYLON.Vector3(this.mesh.position.x, 0, this.mesh.position.z - (this.mesh.scaling.z / 2) - .8);
            var attached = true;
            this.pip = G.Enemy.Pip.create(scene, pipPos, attached);
        }
    };
    
    block.logic = function() {
        // Maintain y position.
        this.yLock();
        
        if(!this.attached) {
            this.fall();
        }
    };
    
    /*
    Stay locked on the y axis. Collisions can cause us to be pushed up or down.
    */
    block.yLock = function() {
        this.mesh.position.y = 0;
        this.mesh.computeWorldMatrix(true);
    };
    
    block.attach = function() {
        if(this.attached) {
            return;
        }
        
        this.attached = true;
        this.speed = 0;
    };
    
    block.drop = function() {
        if(!this.attached) {
            return;
        }
        
        this.attached = false;
        
        // Drop our pip, if we have one.
        if(this.pip && this.pip.attached) {
            this.pip.drop();
        }
    };
    
    block.fall = function() {
        var dt = G.deltaTime;
        
        // Accelerate.
        this.speed += (this.acceleration * dt);
        if(this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed;
        }
        
        // Calculate movement vector.
        var z = this.speed * dt;
        var v = new BABYLON.Vector3(0, 0, -z);
        
        // Move.
        this.mesh.moveWithCollisions(v);
        
        if(this.mesh.position.z < 0) {
            // Shrink block to kill it.
            var amount = 8 * dt;
            var x = this.mesh.scaling.x - amount;
            var z = this.mesh.scaling.z - amount;
            
            // Check if the block has shrunk to 0 and should die.
            if(x <= 0 || z <= 0) {
                // Dispose.
                this.dispose();
            } else {
                this.mesh.scaling.x = x;
                this.mesh.scaling.z = z;
            }
        }
    };
    
    // We collided with object.
    block.onCollide = function(mesh) {
        if(mesh.owner && mesh.owner.blockCollide) {
            mesh.owner.blockCollide(block);
        }
        //this.speed = 0;
        block.attach();
    };
    
    // We were hit by a block.
    block.blockCollide = function(block) {
        
    };
    
    // We were hit by the player.
    block.playerCollide = function(player) {
        // Player dies.
        player.die();
    };
    
    // We were hit by a bullet.
    block.bulletCollide = function(bullet) {
        // Shrink block.
        var amount = 1;
        var x = this.mesh.scaling.x - amount;
        var z = this.mesh.scaling.z - amount;
        
        // Check if the block has shrunk to 0 and should die.
        if(x <= 0 || z <= 0) {
            // Dispose.
            this.dispose();
        } else {
            this.mesh.scaling.x = x;
            this.mesh.scaling.z = z;
            
            // Check if we have a pip.
            if(this.pip && this.pip.attached) {
                // Update our pip's position.
                this.pip.mesh.position.z = this.mesh.position.z - (this.mesh.scaling.z / 2) - .5;
                
                if(bullet.owner === this.pip) {
                    // Our own pip shot us, the bastard!
                } else {
                    // Set our pip's enemy as the one who shot us.
                    this.pip.setEnemy(bullet.owner);
                }
            }
            
            if(!this.pip || bullet.owner !== this.pip) {
                // We were not shot by our own pip. Give a small chance of the block dropping.
                if(Math.random() < 1) {
                    this.drop();
                }
            }
        }
    };
    
    // We were hit by pod.
    block.podCollide = function(pod) {
        // Shrink block.
        var amount = (pod.energy / (pod.maxEnergy / 2));
        var x = this.mesh.scaling.x - amount;
        var z = this.mesh.scaling.z - amount;
        
        // Check if the block has shrunk to 0 and should die.
        if(x <= 0 || z <= 0) {
            // Dispose.
            this.dispose();
        } else {
            this.mesh.scaling.x = x;
            this.mesh.scaling.z = z;
            
            if(this.pip && this.pip.attached) {
                // Update our pip's position.
                this.pip.mesh.position.z = this.mesh.position.z - (this.mesh.scaling.z / 2) - .5;
            }
        }
    };
    
    // We were hit by pip.
    block.pipCollide = function(pip) {
        pip.die();
    };
    
    block.dispose = function() {
        if(this.disposed) {
            return;
        }
        
        this.disposed = true;
        
        // Drop our pip, if we have one.
        if(this.pip && this.pip.attached) {
            this.pip.drop();
        }
        
        // Dispose the mesh.
        this.mesh.dispose();
    };
    
    // Initialize the block.
    block.init();
    
    return block;
};