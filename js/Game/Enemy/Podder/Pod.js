G.Enemy.Podder.Pod.create = function(scene, x, z) {
    var pod = {
        ready: true,
        disposed: false,
        createTime: new Date().getTime(),
        alive: true,
        owner: undefined,
        
        directionToOwner: undefined,
        distanceToOwner: 0,
        followDistance: 30,
        acceleration: 25,
        speed: 0,
        maxSpeed: 20,
        
        energy: 0,
        maxEnergy: 300,
        energyAllowableOverload: 50, // How much over maxEnergy is allowed.
        energyDrip: Math.random() * (40 - 20) + 20, // Not all pods are equally energy efficient.
        
        color: new BABYLON.Color3(0, 1, .5),
        fullEnergyColor: new BABYLON.Color3(0, .5, .7),
    };
    
    // Closed variables.
    var driftSpeed = 1;
    var max = driftSpeed;
    var min = -driftSpeed;
    var driftX = Math.random() * (max - min) + min;
    var driftY = Math.random() * (max - min) + min;
    var driftZ = Math.random() * (max - min) + min;
    
    pod.init = function() {
        this.createMesh();
        
        // Set starting energy.
        this.addEnergy(150);
        
        scene.registerBeforeRender(function() { pod.logic(); });
    };
    
    pod.createMesh = function() {
        var segments = 6; // sphere property (name, segments, diameter, scene)
        var diameter = 3;
        
        this.mesh = new BABYLON.Mesh.CreateSphere("", segments, diameter, scene);
        this.mesh.owner = this;
        this.mesh.material = new BABYLON.StandardMaterial("", scene);
        this.mesh.material.diffuseColor = this.color; // Color in the presence of light.
        this.mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 1); // Color in the absence of any light.
        //material.diffuseTexture = new BABYLON.Texture("textures/crate.gif", scene);
        
        this.mesh.visibility = .4;
        
        this.mesh.position = new BABYLON.Vector3(x, 0, z);
        //this.mesh.rotation.y = player.mesh.rotation.y;
        
        this.mesh.computeWorldMatrix(true);
        
        this.mesh.checkCollisions = true;
        this.mesh.onCollide = this.onCollide;
        //pod.mesh.showBoundingBox = true;
    };
    
    pod.logic = function() {
        if(!this.ready || this.disposed) {
            return;
        }
        
        this.dripEnergy();
        
        // Perform movement.
        this.drift();
        this.followOwner();
    };
    
    pod.drift = function() {
        var dt = G.deltaTime;
        var m = this.mesh;
        
        m.moveWithCollisions(new BABYLON.Vector3(driftX * dt, 0, driftZ * dt));
        
        // Stay locked on the y axis. Collisions can push the object up or down.
        m.position.y = 0;
    };
    
    pod.followOwner = function() {
        if(!this.owner && !this.directionToOwner) {
            return;
        }
        
        var dt = G.deltaTime;
        var m = this.mesh;
        
        if(this.owner) {
            // Get unit direction vector and distance to owner.
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
            // Decelerate.
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
        m.moveWithCollisions(f);
        
        // Stay locked on the y axis. Collisions can push the object up or down.
        m.position.y = 0;
        
        m.computeWorldMatrix(true);
    };
    
    pod.addEnergy = function(e) {
        this.energy += e;
        
        if(this.energy > this.maxEnergy + this.energyAllowableOverload) {
            // We have more energy than our capacity allows.
            var excessEnergy = this.energy - this.maxEnergy;
            
            this.die();
        } else if(this.energy < 0) {
            this.energy = 0;
            
            // We're out of energy, and must die.
            this.die();
        }
        
        var scale = this.energy * .01;
        this.mesh.scaling = { x: scale, y: scale, z: scale };
        //this.mesh.material.diffuseColor = this.energy < this.maxEnergy ? this.color : this.fullEnergyColor;
    };
    
    pod.dripEnergy = function() {
        var dt = G.deltaTime;
        var drip = this.energyDrip * dt;
        
        if(this.owner) {
            // Drip energy to owner at a faster rate.
            drip *= 2;
            this.owner.addEnergy(drip);
        }
        
        this.addEnergy(-drip);
    };
    
    pod.explode = function() {
        // Create particle system.
        var ps = new BABYLON.ParticleSystem("", 2000, scene);
        ps.particleTexture = new BABYLON.Texture("textures/particle1.png", scene);
        ps.textureMask = new BABYLON.Color4(.6, .5, .3, 1);
        ps.manualEmitCount = 2000; // One shot particle emission
        ps.minEmitPower = 7 * (this.energy / this.maxEnergy);
        ps.maxEmitPower = 7 * (this.energy / this.maxEnergy);
        ps.minLifeTime = .3;
        ps.maxLifeTime = .3;
        ps.minSize = .5 * (this.energy / this.maxEnergy);
        ps.maxSize = .5 * (this.energy / this.maxEnergy);
        ps.targetStopDuration = ps.maxLifeTime; // Should be at least maxLifeTime. Without setting this, system won't auto dispose even when disposeOnStop is true.
        ps.disposeOnStop = true;
        
        var dir = 7 * (this.energy / this.maxEnergy);
        ps.direction1 = new BABYLON.Vector3(dir, -dir, -dir);
        ps.direction2 = new BABYLON.Vector3(-dir, dir, dir);
        ps.emitter = this.mesh.position.clone();
        ps.start();
    };
    
    pod.die = function() {
        if(!this.alive) {
            return;
        }
        
        // Disable the object.
        this.alive = false;
        this.mesh.checkCollisions = false;
        
        // Explode.
        this.explode();
        
        // Dispose.
        this.dispose();
    };
    
    pod.dispose = function() {
        if(this.disposed) {
            return;
        }
        
        this.disposed = true;
        
        // Dispose the mesh.
        this.mesh.dispose();
    };
    
    // We collided with object.
    pod.onCollide = function(mesh) {
        if(mesh.owner && mesh.owner.podCollide) {
            mesh.owner.podCollide(pod);
        }
        
        pod.die();
    };
    
    // We were hit by a pod.
    pod.podCollide = function(p) {
        // Take the amount of energy in the pod.
        this.addEnergy(p.energy);
    };
    
    // We were hit by bullet.
    pod.bulletCollide = function(bullet) {
        var owner = bullet.owner;
        
        if(this.owner !== undefined && this.owner === owner) {
            // Our owner shot us. Transfer bullet energy to ourself.
            pod.addEnergy(bullet.energy);
        } else {
            // Make the one who shot us our owner.
            this.owner = owner;
            
            // Copy some of the owner's properties.
            this.acceleration = owner.acceleration / 2;
            this.maxSpeed = owner.maxSpeed * 1.5;
        }
    };
    
    // We were hit by player.
    pod.playerCollide = function(player) {
        if(this.owner === player) {
            // The player is our owner. Give it our energy.
            player.addEnergy(this.energy);
            
            this.die();
        } else {
            // The player isn't our owner. Take it's energy in the amount of our energy.
            player.addEnergy(-this.energy);
            
            this.die();
        }
    };
    
    // We were hit by pip.
    pod.pipCollide = function(pip) {
        this.die();
    };
    
    // We were hit by key.
    pod.keyCollide = function(key) {
        this.die();
    };
    
    // Finish initialization before returning.
    pod.init();
    
    return pod;
};