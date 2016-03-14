G.Enemy.Podder.create = function(scene, position) {
    var podder = {
        ready: true,
        disposed: false,
        
        followDistance: 10,
        acceleration: .005,
        speed: 0,
        maxSpeed: .10,
        rotateSpeed: Math.PI / 180 * .3,
        
        pods: [], // List of pods.
        maxPods: 5, // Maximum pods the podder can maintain at any given time.
        lastCreateTime: 0, // Last pod creation time in milliseconds.
        createDelay: 100 // Time delay before next pod can be created, in milliseconds.
    };
    
    podder.init = function() {
        this.createMesh();
        
        scene.registerBeforeRender(function() { podder.logic(); });
    };
    
    podder.createMesh = function() {
        var diameter = 1;
        this.mesh = new BABYLON.Mesh.CreateBox("", diameter, scene);
        this.mesh.owner = this;
        this.mesh.material = new BABYLON.StandardMaterial("", scene);
        this.mesh.material.diffuseColor = new BABYLON.Color3(1, 1, .5);
        //material.diffuseTexture = new BABYLON.Texture("textures/crate.gif", scene);
        
        this.mesh.visibility = 0;
        
        // Position.
        this.mesh.position = position.clone();
        
        this.mesh.computeWorldMatrix();
    };
    
    podder.logic = function() {
        if(!this.ready || this.disposed) {
            return;
        }
        
        this.rotate();
        this.managePods();
    };
    
    podder.rotate = function() {
        this.mesh.rotation.y += this.rotateSpeed;
    };
    
    podder.managePods = function() {
        // Recalculate list of pods, removing those that are "dead".
        var b = [];
        $.each(this.pods, function(index, o) {
            if(!o.disposed) {
                b.push(o);
            }
        });
        this.pods = b;
        
        // Create new pods.
        this.createPods();
    };
    
    podder.createPods = function() {
        // Check if a pod can be created.
        var d = new Date().getTime();
        if(d < this.lastCreateTime + this.createDelay) {
            return;
        }
        
        if(this.pods.length >= this.maxPods) {
            return;
        }
        
        // Spawn pod.
        var range = 8;
        var maxX = this.mesh.position.x + range;
        var minX = this.mesh.position.x - range;
        var maxZ = this.mesh.position.z + range;
        var minZ = this.mesh.position.z - range;
        var x = Math.random() * (maxX - minX) + minX;
        var z = Math.random() * (maxZ - minZ) + minZ;
        
        var pod = G.Enemy.Podder.Pod.create(scene, x, z);
        
        // Add pod to list.
        this.pods.push(pod);
        
        this.lastCreateTime = d;
    };
    
    podder.dispose = function() {
        if(this.disposed) {
            return;
        }
        
        this.disposed = true;
    };
    
    // Finish initialization before returning.
    podder.init();
    
    return podder;
};