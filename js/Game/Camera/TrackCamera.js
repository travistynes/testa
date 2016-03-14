G.Camera.TrackCamera.create = function(scene, position) {
    var camera = new BABYLON.FreeCamera("", position.clone(), scene);
    camera.disposed = false; // Adding this manually, it doesn't exist on the babylon.camera.js camera.
    
    camera.init = function() {
        this.target = undefined;
        this.targets = [],
        this.fov = .5;
        this.maxZoomIn = 65;
        this.maxZoomOut = 100;
        this.topdownView = true;
        this.rotation.x = 1.5; // Look straight down (rotate 90 degrees on the x axis). This isn't quite Math.PI / 2 because it glitches out.
        this.position.y = this.maxZoomOut; // Raise the camera up the y axis (zoom out).
        this.speed = 600;
        
        //camera.attachControl(G.canvas, true); // Enable default keyboard/mouse control of the camera.
        
        // Add event listeners.
        window.addEventListener("wheel", this.wheel, false);
        
        // Register to run logic.
        scene.registerBeforeRender(function() { camera.logic(); });
    };
    
    camera.logic = function() {
        this.trackTarget();
    };
    
    camera.trackTarget = function() {
        if(this.target && this.target.owner.disposed) {
            // Revert to our previous target, if we have one.
            this.target = this.targets.pop();
        }
        
        if(this.target === undefined) {
            return;
        }
        
        var dt = G.deltaTime;
        
        // Get direction to target.
        var path = new BABYLON.Path3D([this.position, this.target.position]);
        var direction = path.getTangents()[0];
        
        // Get distance to target. Each element is the distance from the first point passed in the path (ie. the first element is always 0).
        this.distance = path.getDistances()[1];
        
        //this.position.x = this.target.position.x;
        //this.position.z = this.target.position.z;
        
        // Calculate the movement vector.
        var x = direction.x * this.speed * dt;
        var z = direction.z * this.speed * dt;
        
        this.position.x += x;
        this.position.z += z;
    };
    
    camera.addTarget = function(target) {
        // Save the current target for later use.
        if(this.target) {
            this.targets.push(this.target);
        }
        
        // Update our current target.
        this.target = target;
    };
    
    /*
    Mouse wheel event handler.
    */
    camera.wheel = function(e) {
        if(camera != scene.activeCamera) {
            return;
        }
        
        if(e.deltaY > 0) {
            // Mouse wheel down scroll. Zoom out.
            camera.position.y += 5;
            
            // Don't allow zooming out too far.
            if(camera.position.y > camera.maxZoomOut) {
                camera.position.y = camera.maxZoomOut;
            }
        } else if(e.deltaY < 0) {
            // Mouse wheel up scroll. Zoom in.
            camera.position.y -= 5;
            
            // Don't allow zooming in too far.
            if(camera.position.y < camera.maxZoomIn) {
                camera.position.y = camera.maxZoomIn;
            }
        }
        
        if(!camera.topdownView) {
            camera.setTarget(camera.target.position); // Rotate to look at the target.
        }
    };
    
    /*
    babylon.camera.js has a dispose method, but it doesn't call an onDispose callback so we can cleanup.
    So, I have to override dispose but still call the original dispose.
    https://github.com/BabylonJS/Babylon.js/blob/master/src/Cameras/babylon.camera.js
    */
    camera.dispose = function() {
        if(this.disposed) {
            return;
        }
        
        this.disposed = true;
        
        // Remove listeners.
        window.removeEventListener("wheel", camera.wheel, false);
        
        // Call original dispose.
        BABYLON.Camera.prototype.dispose.call(camera);
    };
    
    // Finish initialization before returning.
    camera.init();
    
    return camera;
};