G.create = function(engine) {
    var scene = new BABYLON.Scene(engine);
    
    scene.init = function() {
        this.clearColor = new BABYLON.Color3(.1, .1, .1);
        
        // Add light. HemisphericLight takes a vector as the direction to the sky (usually "up").
        this.light = new BABYLON.HemisphericLight("", new BABYLON.Vector3(0, 1, 0), this);
        this.light.groundColor = new BABYLON.Color3(.3, .3, .3);
        this.light.diffuse = new BABYLON.Color3(1, 1, 1); // The color emitted by the light.
        this.light.specular = new BABYLON.Color3(0, 0, 0); // The color of the direct point of light on an object.
        
        // Register to run logic.
        this.registerBeforeRender(function() { scene.logic(); });
    };
    
    scene.logic = function() {
        $("#fpslabel").text(G.engine.fps.toFixed(0));
    };
    
    /*
    Cleanup. Scene.dispose() calls dispose on all meshes, textures, lights, cameras etc.
    So, it isn't necessary to manually dispose them. onDispose is called by scene.dispose.
    We really only need to manually unregister event listeners (keyboard, mouse, etc).
    https://github.com/BabylonJS/Babylon.js/blob/master/src/babylon.scene.js
    */
    scene.onDispose = function() {
        
    };
    
    // Initialize the scene.
    scene.init();
    
    return scene;
};