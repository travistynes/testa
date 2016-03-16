# Test: A

This is a WebGL game using the babylon.js webgl library. Run it on a web server and open index.html in your browser to play.

Use A and D to turn left and right. Spacebar will stall the engine into a free fall. Carrot can be played without ever stalling the engine once you get good enough.

Coding of the game is basically complete, which is my main interest, so development is halted. Only the map "Carrot" is finished. The second map "Sloop" is incomplete - Making maps that are fun is difficult and time consuming. I don't make the maps. My wife does the Blender (modeling, texturing, animation, etc). If we complete another map I will add it.

Use the code as you like, for whatever purpose you want.

On a side note: I am convinced that WebGL is the future of gaming. There is no reason we can't play World of Warcraft in one browser tab and Counter Strike in another, while browsing the web in another. Stream loading of assets as needed will become essential, but is better anyway. Games are already too big (20+ gigs in some cases). Reinstalling games is a hassle and takes too long. In a browser the game is available from any computer, regardless of OS.

Creating a GUI in html/css (as we did in Test: A) is very powerful. It's so obvious that I didn't realize at first that it was even an option. But that is exactly what html and css are naturally suited for. The tight integration of game code with html/css feels weird at first. It's unexpected, mostly because it makes that aspect of game development (the GUI) so easy.

Just like html/css for the GUI follows so naturally in a browser, networking is built in from the beginning when developing for the browser. This is normally part of the game engine (if it exists at all) or added with an external library. Again, network/server communication becomes trivial when the game is in the browser. It follows so naturally that it seems obvious in hindsight.

With WebGL, 3D graphics using the GPU is now possible, and it uses...OpenGL. The browser has become a great game development platform, and continues to improve.
