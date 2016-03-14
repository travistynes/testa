G.Item.Bullet.Assets = {
    audio: {
        pops: []
    }
};

G.Item.Bullet.Assets.register = function(manager, scene) {
    // Load audio.
    var pop1Task = manager.addBinaryFileTask("", "audio/sounds/pop1.ogg");
    pop1Task.onSuccess = function(task) {
        var m = new BABYLON.Sound("", task.data, scene, null, { playbackRate: 1, volume: .1, loop: false, autoplay: false });
        
        G.Item.Bullet.Assets.audio.pops.push(m);
    };
    
    var pop2Task = manager.addBinaryFileTask("", "audio/sounds/pop2.ogg");
    pop2Task.onSuccess = function(task) {
        var m = new BABYLON.Sound("", task.data, scene, null, { playbackRate: 1, volume: .1, loop: false, autoplay: false });
        
        G.Item.Bullet.Assets.audio.pops.push(m);
    };
    
    var pop3Task = manager.addBinaryFileTask("", "audio/sounds/pop3.ogg");
    pop3Task.onSuccess = function(task) {
        var m = new BABYLON.Sound("", task.data, scene, null, { playbackRate: 1, volume: .1, loop: false, autoplay: false });
        
        G.Item.Bullet.Assets.audio.pops.push(m);
    };
};

G.Item.Bullet.create = function(scene, owner, direction) {
    var bullet = {
        ready: true,
        disposed: false,
        createTime: new Date().getTime(),
        alive: true,
        owner: owner,
        energy: owner.bulletCost,
        speed: owner.bulletCost,
        direction: direction.clone(),
        ttl: 5000, // Time to live in milliseconds
        
        turnLeft: false,
        turnRight: false,
        turnSpeed: Math.PI / 180 * 180
    };
    
    bullet.init = function() {
        this.createMesh();
        
        // Play pop sound.
        var pop = G.Utils.getRandomItem(G.Item.Bullet.Assets.audio.pops);
        pop.play();
        
        scene.registerBeforeRender(function() { bullet.logic(); });
    };
    
    bullet.createMesh = function() {
        var segments = 1;
        var diameter = .5;
        
        // Create mesh.
        this.mesh = new BABYLON.Mesh.CreateSphere("", segments, diameter, scene);
        this.mesh.owner = this;
        
        this.mesh.material = new BABYLON.StandardMaterial("", scene);
        this.mesh.material.diffuseColor = new BABYLON.Color3(.8, 1, .7);
        this.mesh.material.emissiveColor = new BABYLON.Color3(1, 0, .5);
        //material.diffuseTexture = new BABYLON.Texture("textures/crate.gif", scene);
        
        // Scale.
        this.mesh.scaling = {x: 1, y: 1, z: 1};
        
        // Position outside of the owner's mesh so we don't hit the owner.
        this.mesh.position = owner.mesh.position.clone();
        this.mesh.rotation.y = Math.atan2(-direction.z, direction.x); // Convert direction vector to rotation so we face forward.
        this.mesh.movePOV(-2, 0, 0); // Move forward so not colliding with the owner.
        
        /*
        From: http://www.html5gamedevs.com/topic/18720-issue-with-intersecting-meshes-on-initialization/
        
        When you update the position, actually nothing is done by Babylon: mesh positions are not *really* updated.
        Positions are updated when the world matrix of the mesh is updated: this step is done at the very first render.
        That's why you have this behaviour:
        - collision at first frame
        - render
        - world matrix updated
        - no more collision
         
        To fix your issue, you have to force the first update of the world matrix:
        mesh.computeWorldMatrix(true);
        */
        this.mesh.computeWorldMatrix(true);
        
        // Turn off picking so we don't block a ray cast.
        this.mesh.isPickable = false;
        
        // Register for collisions.
        //this.mesh.checkCollisions = true;
        this.mesh.onCollide = bullet.onCollide;
        //this.mesh.showBoundingBox = true;
    };
    
    bullet.logic = function() {
        if(!this.ready || this.disposed) {
            return;
        }
        
        // Check if the bullet ttl has expired.
        if(new Date().getTime() > this.createTime + this.ttl) {
            // Dispose the bullet.
            this.dispose();
            
            return;
        }
        
        // Perform movement.
        this.move();
    };
    
    bullet.move = function() {
        var dt = G.deltaTime;
        var m = this.mesh;
        
        // Perform left/right rotations.
        if(this.turnLeft) {
            m.rotation.y -= (this.turnSpeed * dt);
        }
        
        if(this.turnRight) {
            m.rotation.y += (this.turnSpeed * dt);
        }
        
        // Calculate the forward vector.
        var x = Math.cos(m.rotation.y) * this.speed * dt;
        var z = Math.sin(m.rotation.y) * this.speed * dt;
        var f = new BABYLON.Vector3(x, 0, -z);
        
        // Move.
        //m.movePOV(this.speed, 0, 0); // This works, but doesn't test for collisions.
        m.moveWithCollisions(f);
        
        // Stay locked on the y axis. Collisions can push the object up or down.
        m.position.y = 0;
        
        m.computeWorldMatrix(true);
    };
    
    bullet.explode = function() {
        // Create particle system.
        var ps = new BABYLON.ParticleSystem("", 200, scene);
        ps.particleTexture = new BABYLON.Texture("textures/particle1.png", scene);
        ps.textureMask = new BABYLON.Color4(.1, .8, .8, 1);
        ps.manualEmitCount = 200; // One shot particle emission
        ps.minEmitPower = 5;
        ps.maxEmitPower = 5;
        ps.minLifeTime = .3;
        ps.maxLifeTime = .3;
        ps.targetStopDuration = ps.maxLifeTime; // Should be at least maxLifeTime. Without setting this, system won't auto dispose even when disposeOnStop is true.
        ps.disposeOnStop = true;
        
        var dir = 1;
        ps.direction1 = new BABYLON.Vector3(dir, -dir, -dir);
        ps.direction2 = new BABYLON.Vector3(-dir, dir, dir);
        ps.emitter = new BABYLON.Vector3(this.mesh.position.x, 0, this.mesh.position.z);
        ps.start();
    };
    
    bullet.die = function() {
        if(!this.alive) {
            return;
        }
        
        // Disable the object.
        this.alive = false;
        
        // Explode.
        this.explode();
        
        // Dispose.
        this.dispose();
    };
    
    bullet.dispose = function() {
        if(this.disposed) {
            return;
        }
        
        this.disposed = true;
        this.alive = false;
        
        // Dispose the mesh.
        this.mesh.dispose();
    };
    
    // We collided with object.
    bullet.onCollide = function(mesh) {
        //console.log("bullet");
        if(mesh.owner && mesh.owner.bulletCollide) {
            mesh.owner.bulletCollide(bullet);
        }
        
        bullet.die();
    };
    
    // Finish initialization before returning.
    bullet.init();
    
    return bullet;
};