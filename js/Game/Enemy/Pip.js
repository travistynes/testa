/*
The pip is a little guy that can be positioned and if shot and hit by a bullet,
will act as a turret and begin firing at the thing that shot it.
*/
G.Enemy.Pip.Assets = {
    mesh: undefined // The mesh template
};

// Add assets to be loaded by the asset manager.
G.Enemy.Pip.Assets.register = function(manager) {
    // Load mesh.
    var mesh = manager.addMeshTask("", "", "./models/enemy/Pip/", "pip.babylon");
    mesh.onSuccess = function(task) {
        var m = task.loadedMeshes[0];
        
        m.position = new BABYLON.Vector3(-10000, 0, 0); // Place our template mesh far away.
        
        G.Enemy.Pip.Assets.mesh = m;
    };
};

G.Enemy.Pip.create = function(scene, position, attached) {
    var pip = {
        ready: true,
        disposed: false,
        alive: true,
        enemy: undefined,
        attached: attached, // Is the pip attached to an object (block, etc). If not, he will fall.
        
        energy: 0,
        maxEnergy: 5000,
        bulletCost: 50,
        lastShotTime: 0, // Last shot time in milliseconds.
        shotDelay: 300, // Time delay before next shot can be fired, in milliseconds.
        aggroDistance: 20, // Distance to enemy that will trigger shooting.
        hitsRemaining: 1, // Number of times we can be shot before we die.
        inactiveVisibility: .5,
        
        acceleration: 25,
        speed: 0,
        maxSpeed: 30,
        
        shieldOpen: false,
        shieldOpening: false
    };
    
    pip.init = function() {
        this.createMesh();
        //this.createDebugMeshes();
        
        // Set starting energy.
        this.addEnergy(this.maxEnergy);
        
        scene.registerBeforeRender(function() { pip.logic(); });
    };
    
    pip.createMesh = function() {
        this.mesh = G.Enemy.Pip.Assets.mesh.clone("");
        this.mesh.skeleton = G.Enemy.Pip.Assets.mesh.skeleton.clone("");
        this.mesh.owner = this;
        this.mesh.visibility = this.inactiveVisibility;
        
        this.mesh.material = new BABYLON.StandardMaterial("", scene); // Comment this line out if there is a texture.
        this.mesh.material.diffuseColor = new BABYLON.Color3(.8, 1, .7);
        this.mesh.material.emissiveColor = new BABYLON.Color3(1, 0, .5);
        this.mesh.material.specularColor = new BABYLON.Color3(1, 1, 1);
        
        // Position.
        this.mesh.position = position.clone();
        
        // Face down.
        this.mesh.rotation.y = Math.PI / 2;
        
        // Turn off picking so a ray cast from the mesh position doesn't hit the mesh itself.
        //this.mesh.isPickable = false;
        
        this.mesh.checkCollisions = true;
        this.mesh.onCollide = this.onCollide;
        
        this.mesh.computeWorldMatrix(true);
    };
    
    /*
    These meshes are used as visual indicators only. Normally this function shouldn't
    be called.
    */
    pip.createDebugMeshes = function() {
        this.rayhit = new BABYLON.Mesh.CreateSphere("", 1, 1, scene);
        this.rayhit.isPickable = false;
        
        var segments = 5;
        var diameter = this.aggroDistance * 2;
        this.aggroBubble = new BABYLON.Mesh.CreateSphere("", segments, diameter, scene);
        this.aggroBubble.owner = this;
        this.aggroBubble.isPickable = false;
        this.aggroBubble.parent = this.mesh;
        this.aggroBubble.visibility = .1;
    };
    
    pip.logic = function() {
        if(!this.ready || this.disposed) {
            return;
        }
        
        // Maintain y position.
        this.yLock();
        
        if(this.alive) {
            // Check for aggro.
            this.checkAggro();
            
            // Look for our enemy.
            this.lookForEnemy();
            
            if(!this.attached) {
                this.fall();
            }
        }
    };
    
    /*
    Stay locked on the y axis. Collisions can cause us to be pushed up or down.
    */
    pip.yLock = function() {
        this.mesh.position.y = 0;
        this.mesh.computeWorldMatrix(true);
    };
    
    pip.checkAggro = function() {
        if(this.enemy) {
            return;
        }
        
        // If the player is within our aggro range, make him our enemy.
        var player = G.mapman.currentMap.player;
        var o = player.mesh;
        var m = this.mesh;
        
        var path = new BABYLON.Path3D([m.position, o.position]);
        var direction = path.getTangents()[0];
        
        // Get distance. Each element is the distance from the first point passed in the path (ie. the first element is always 0).
        var distance = path.getDistances()[1];
        
        if(distance <= this.aggroDistance) {
            // Make the player our enemy.
            this.setEnemy(player);
        }
    };
    
    pip.lookForEnemy = function() {
        if(!this.enemy || !this.enemy.alive) {
            return;
        }
        
        // Get unit direction vector and distance to enemy.
        var o = this.enemy.mesh;
        var m = this.mesh;
        
        var path = new BABYLON.Path3D([m.position, o.position]);
        var direction = path.getTangents()[0];
        
        // Get distance to owner. Each element is the distance from the first point passed in the path (ie. the first element is always 0).
        var distance = path.getDistances()[1];
        
        // Rotate toward the enemy. This is for fun, not necessary for any calculations when shooting.
        m.rotation.y = Math.atan2(-direction.z, direction.x);
        
        /*
        Cast a ray to the enemy.
        The pip needs to keep isPickable = true. If it isnt, and a pip is another pip's enemy,
        then the ray cast to the enemy pip will never hit since it isn't pickable.
        We can't use our position (center) as the ray origin, because the ray will always
        hit ourself. We need to use the unit direction vector to the enemy to
        position the ray origin just outside of our mesh boundary.
        */
        var origin = m.position.clone();
        origin.x += (direction.x * m.scaling.x);
        origin.z += (direction.z * m.scaling.z);
        
        var ray = new BABYLON.Ray(origin, direction, this.aggroDistance);
        var pick = scene.pickWithRay(ray);
        
        if(pick.hit && pick.pickedMesh === this.enemy.mesh) {
            // We have line of sight to the enemy.
            this.mesh.visibility = 1;
            
            if(this.rayhit) {
                this.rayhit.position = pick.pickedPoint;
                this.rayhit.visibility = 1;
            }
            
            // Shoot.
            if(this.shieldOpen) {
                this.shoot(direction);
            }
        } else {
            // No line of sight to enemy.
            this.mesh.visibility = this.inactiveVisibility;
            
            if(this.rayhit) {
                this.rayhit.visibility = 0;
            }
        }
    };
    
    pip.shoot = function(direction) {
        // Check if a shot can be fired.
        var d = new Date().getTime();
        if(d < this.lastShotTime + this.shotDelay) {
            return;
        }
        
        // Check if there is enough energy to fire a bullet.
        if(this.energy < this.bulletCost) {
            return;
        }
        
        // Spawn bullet.
        var bullet = G.Item.Bullet.create(scene, this, direction);
        
        this.lastShotTime = d;
        
        // Remove energy.
        this.addEnergy(-this.bulletCost);
    };
    
    pip.drop = function() {
        if(!this.attached) {
            return;
        }
        
        this.attached = false;
        
        // Set a death timer.
        setTimeout(function() {
            pip.die();
        }, 1500);
    };
    
    pip.fall = function() {
        var dt = G.deltaTime;
        
        // Accelerate.
        this.speed += (this.acceleration * dt);
        if(this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed;
        }
        
        // Calculate movement vector.
        var z = this.speed * dt;
        var v = new BABYLON.Vector3(0, 0, -z);
        
        // Apply gravity.
        //v = v.add(scene.map.gravity.multiplyByFloats(dt, dt, dt));
        
        // Move.
        this.mesh.moveWithCollisions(v);
    };
    
    pip.addEnergy = function(e) {
        this.energy += e;
        
        if(this.energy > this.maxEnergy) {
            this.energy = this.maxEnergy;
        } else if(this.energy < 0) {
            this.energy = 0;
        }
    };
    
    pip.setEnemy = function(enemy) {
        this.enemy = enemy;
        
        // Open our shield.
        this.openShield();
    };
    
    pip.openShield = function() {
        // If the shield isn't open, open it.
        if(!this.shieldOpen && !this.shieldOpening) {
            this.shieldOpening = true;
            
            // Play animation.
            var from = 1;
            var to = 30;
            var loop = false;
            var speed = 2;
            var a = scene.beginAnimation(this.mesh.skeleton, from, to, loop, speed, function() {
                // Animation complete.
                pip.shieldOpen = true;
            });
        }
    };
    
    pip.explode = function() {
        // Create particle system.
        var ps = new BABYLON.ParticleSystem("", 5000, scene);
        ps.particleTexture = new BABYLON.Texture("textures/particle1.png", scene);
        ps.textureMask = new BABYLON.Color4(.2, .4, .3, 1);
        ps.manualEmitCount = 5000; // One shot particle emission
        ps.minEmitPower = 7;
        ps.maxEmitPower = 8;
        ps.minLifeTime = .3;
        ps.maxLifeTime = .4;
        ps.minSize = .8;
        ps.maxSize = .9;
        ps.targetStopDuration = ps.maxLifeTime; // Should be at least maxLifeTime. Without setting this, system won't auto dispose even when disposeOnStop is true.
        ps.disposeOnStop = true;
        
        var dir = 1;
        ps.direction1 = new BABYLON.Vector3(dir, -dir, -dir);
        ps.direction2 = new BABYLON.Vector3(-dir, dir, dir);
        ps.emitter = new BABYLON.Vector3(this.mesh.position.x, 0, this.mesh.position.z);
        ps.start();
    };
    
    pip.die = function() {
        if(!this.alive || this.disposed) {
            return;
        }
        
        this.alive = false;
        
        // Explode.
        this.explode();
        
        // Dispose.
        this.dispose();
    };
    
    // We collided with object.
    pip.onCollide = function(mesh) {
        if(mesh.owner && mesh.owner.pipCollide) {
            mesh.owner.pipCollide(pip);
        }
    };
    
    // We were hit by player.
    pip.playerCollide = function(player) {
        
    };
    
    // We were hit by bullet.
    pip.bulletCollide = function(bullet) {
        if(bullet.owner === this) {
            // We shot ourself.
            //this.die();
        } else {
            // Set our enemy as the one who shot us.
            this.setEnemy(bullet.owner);
            
            // We can only be damaged if our shield is open.
            if(this.shieldOpen) {
                this.hitsRemaining--;
            }
            
            if(this.hitsRemaining === 0) {
                // Detach.
                this.drop();
            }
        }
    };
    
    pip.dispose = function() {
        if(this.disposed) {
            return;
        }
        
        this.disposed = true;
        
        if(this.rayhit) {
            this.rayhit.dispose();
        }
        
        if(this.aggroBubble) {
            this.aggroBubble.dispose();
        }
        
        // Dispose the mesh.
        this.mesh.dispose();
    };
    
    // Initialize the pip.
    pip.init();
    
    return pip;
};