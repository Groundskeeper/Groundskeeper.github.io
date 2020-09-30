// Our input handler that'll process our inputs
var _inputManager = {
	// Keyboard input
	var keysArray : [],			// An array for keys that we're currently pressing
	var keysArrayLocked : [],	// An array for keys that we've already pressed and currently still are pressing

	isKeyPressed : function(keyCode){
		return this.keysArray[keyCode];
	},
	isKeyPressedOnce : function(keyCode){
		if (this.keysArray[keyCode] && !this.keysArrayLocked[keyCode]){
			this.keysArrayLocked[keyCode] = true;
			return true;
		}
		else{
			return false;
		}
	},
	Initialize : function(){
		// Reset everything first .. .
		this.Shutdown();

		// Add the listener events for our keyboard inputs
		window.addEventListener('keydown', function(e){
			inputManager.keysArray[e.keyCode] = true;
		});
		window.addEventListener('keyup', function(e){
			inputManager.keysArray[e.keyCode] = false;
			inputManager.keysArrayLocked[e.keyCode] = false;
		});
	},
	UpPressed : function(){
		return (this.isKeyPressed(38) || this.isKeyPressed(87));
	},
	UpPressedOnce : function(){
		return (this.isKeyPressedOnce(38) || this.isKeyPressedOnce(87));
	},
	DownPressed : function(){
		return (this.isKeyPressed(40) || this.isKeyPressed(83));
	},
	DownPressedOnce : function(){
		return (this.isKeyPressedOnce(40) || this.isKeyPressedOnce(83));
	},
	LeftPressed : function(){
		return (this.isKeyPressed(37) || this.isKeyPressed(65));
	},
	LeftPressedOnce : function(){
		return (this.isKeyPressedOnce(37) || this.isKeyPressedOnce(65));
	},
	RightPressed : function(){
		return (this.isKeyPressed(39) || this.isKeyPressed(68));
	},
	RightPressedOnce : function(){
		return (this.isKeyPressedOnce(39) || this.isKeyPressedOnce(68));
	},
	Shutdown : function(){
		// Empty/delete the keyboard array vars?
		this.keysArray = [];
		this.keysArrayLocked = [];
	}
}

// Our HTML5 Audio-based sound manager that'll manage our sounds
var _soundManager = {
	var sounds : null,
	Initialize : function(){
		// Clear out anything in our sounds object before initializing it
		this.Shutdown();

		// Start fresh!
		this.sounds = {};
	},
	AddSound : function(keyname, filepath, gamesoundtype){
		//  Check to see if the filepath exists
		if (utility.FileExists(filepath)){
			// Check to see if it has already been added
			if (this.sounds.hasOwnProperty(keyname)){
				// Increment the reference count?
				this.sounds[keyname].setAttribute("refCount", parseInt(this.sounds[keyname].getAttribute("refCount")) + 1);
				// At this point it'll fall through to the end of this function where we return a reference the existing item
			}
			else{
				// Add it to the sounds array!
				this.sounds[keyname] = document.createElement("audio");
				this.sounds[keyname].src = filepath;
				this.sounds[keyname].setAttribute("id", filepath.substr(filepath.lastIndexOf("/") + 1));
				this.sounds[keyname].setAttribute("preload", "auto");
				this.sounds[keyname].setAttribute("controls", "none");
				this.sounds[keyname].setAttribute("refCount", 1);
				this.sounds[keyname].setAttribute("gamesoundtype", gamesoundtype);
				this.sounds[keyname].style.display = "none";
				this.sounds[keyname].load();

				// Add it to the HTML
				document.body.appendChild(sounds[keyname]);
			}
		}
		// If not return null
		else{
			// Let the User know we didn't load the sound
			console.log('_soundManager - AddSound() - Sound file at "' + filepath + '" count not be found');
			return null;
		}

		// If successful return the file
		return this.sounds[keyname];
	},
	RemoveSound : function(keyname){
		// Check to make sure we have this sound to even remove it . . .
		if (this.sounds.hasOwnProperty(keyname)){
			// Decrement the refCount attribute for this 	
			var potentialRefCount = parseInt(this.sounds[keyname].getAttribute("refCount")) - 1;

			// If this would be the LAST reference to it then let's actually get rid of it!
			if (potentialRefCount == 0){
				// Remove the HTML audio element
				this.sounds[keyname].remove();

				// Delete the item/property itself
				delete this.sounds[keyname];
			}
			// Otherwise we'll just decrement the refCount attribute
			else{
				this.sounds[keyname].setAttribute("refCount", potentialRefCount);

				// Let the User know we didn't remove the sound just yet but we DID decrement the refCount
				console.log('_soundManager - RemoveSound() - Decremented the "refCount" of sound "' + keyname + '" to ' + this.sounds[keyname].getAttribute("refCount"));
			}

			// Return success
			return true;
		}
		else{
			// Let the User know we couldn't successfully perform the operation
			console.log('_soundManager - RemoveSound() - Could not find a sound with the keyname "' + keyname + '" ');

			// Return failure
			return false;
		}
	},
	Play : function(keyname){
		// If specified which one then do it to just that one item
		if (keyname){
			// If we even HAVE a sound by that name
			if (this.sounds.hasOwnProperty(keyname)){
				this.sounds[keyname].play().catch(function(ex){ 
					console.log("_soundManager - Play() - " + ex.message); 
				});
			}
			// Otherwise we can't do ANYTHING!
			else{
				console.log('_soundManager - Play() - Unable to PLAY sound - Could not find a sound with the keyname "' + keyname + '" ');
			}
		}
		// Otherwise we can't do ANYTHING!
		else{
			console.log("_soundManager - Play() - Unable to PLAY sound - Parameter 'keyname' not specified!")
		}
	},
	Pause : function(keyname){
		// If specified which one then do it to just that one item
		if (keyname){
			// If we even HAVE a sound by that name
			if (this.sounds.hasOwnProperty(keyname)){
				this.sounds[keyname].pause();
			}
			// Otherwise we can't do ANYTHING!
			else{
				console.log('_soundManager - Pause() - Unable to PAUSE sound - Could not find a sound with the keyname "' + keyname + '" ');
			}
		}
		// Otherwise do it to ALL of them!
		else{
			console.log('_soundManager - Pause() - PAUSING all available sounds.');

			for (var i = 0 ; i < Object.keys(this.sounds).length ; i++){
				var curKey = Object.keys(this.sounds)[i];
				this.sounds[curKey].pause();
			}
		}
	},
	Unpause : function(keyname){
		// If specified which one then do it to just that one item
		if (keyname){
			// If we even HAVE a sound by that name
			if (this.sounds.hasOwnProperty(keyname)){
				if (this.sounds[keyname].currentTime > 0)
					this.sounds[keyname].play();
			}
			// Otherwise we can't do ANYTHING!
			else{
				console.log('_soundManager - Unpause() - Unable to UNPAUSE sound - Could not find a sound with the keyname "' + keyname + '" ');
			}
		}
		// Otherwise do it to ALL of them!
		else{
			console.log('_soundManager - Unpause() - UNPAUSING all currently paused sounds.');

			for (var i = 0 ; i < Object.keys(this.sounds).length ; i++){
				var curKey = Object.keys(this.sounds)[i];
				if (this.sounds[curKey].currentTime > 0){
					this.sounds[curKey].play();
				}
			}
		}
	},
	Stop : function(keyname){
		// If specified which one then do it to just that one item
		if (keyname){
			this.sounds[keyname].pause();
			this.sounds[keyname].currentTime = 0;
		}
		// Otherwise do it to ALL of them!
		else{
			
			for (var i = 0 ; i < Object.keys(this.sounds).length ; i++){
				var curKey = Object.keys(this.sounds)[i];
				this.sounds[curKey].pause();
				this.sounds[curKey].currentTime = 0;
			}
		}
	},
	SetVolume : function(keyname, percentage){
		// TODO: This
	}
	Shutdown : function(){
		if (this.sounds){
			// Run through all the "properties" of the sound object and take care of them . . .
			while(Object.keys(this.sounds).length > 0){
				var curIndex = Object.keys(this.sounds).length - 1;
				var curKey = Object.keys(this.sounds)[curIndex];

				// Let's just see what the refCount is for this . . .
				var curRefCount = parseInt(this.sounds[keyname].getAttribute("refCount"));

				// Log what the refCount is before we just obliterate the Audio object anyways
				console.log('_soundManager - Shutdown() - Sound with keyname "' + keyname + '" has a "refCount" of ' + curRefCount);

				// Remove the HTML audio element
				this.sounds[curKey].remove();

				// Delete the item/property itself
				delete this.sounds[curKey];
			}

			// Null out the object
			this.sounds = null;
		}
	}
}

// Our texture manager that'll manage or textures
var _textureManager = {
	var textures : null,
	Initialize : function(){
		this.Shutdown();

		// Start fresh!
		this.textures = [];
	},
	AddTexture : function(filepath){
		// Check to see if the filepath exists
		if (utility.FileExists(filepath)){
			// Check to see if it has already been added
			var filename = filepath.substr(filepath.lastIndexOf("/") + 1);

			// If this filename already exists in the array then just reference the existing one . . .
			for (var i = 0 ; i < this.textures.length ; i++){
				var curFilename = this.textures[i].src.substr(this.textures[i].src.lastIndexOf("/") + 1);

				if (curFilename == filename){
					// Increment the reference count?
					this.textures[i].setAttribute("refCount", parseInt(this.textures.getAttribute("refCount")) + 1);
					// Return the existing item
					return this.textures[i];
				}
			}

			// If we're at this point then we didn't find it in the array, so let's add it!
			this.textures.push(new Image());
			this.textures[this.textures.length - 1].src = filepath;
			this.textures[i].setAttribute("refCount", 1);

			// Return the latest!
			return this.textures[this.textures.length - 1];
		}
		// If not return null
		else{
			// Let the User know we didn't load the texture
			console.log('_textureManager - AddTexture() - Texture at "' + filepath + '" could not be found.');
			return null;
		}
	},
	RemoveTexture : function(filepath){
		// Check to make sure we have this texture to even remove it . . .
		for (var i = 0 ; i < this.textures.length ; i++){
			// If we do have the texture . . .
			if (this.textures[i].src = filepath){
				// What if we were to decrement the refCount . . .
				var potentialRefCount = parseInt(this.sounds[keyname].getAttribute("refCount")) - 1;

				// If this would be the LAST reference to it then let's actually get rid of it!
				if (potentialRefCount == 0){
					// Delete the image itself
					delete textures[i];
					// Splice the array to get rid of this one item
					this.textures.splice(i, 1);
					// Let the User know the good news!
					console.log('_textureManager - RemoveTexture() - Successfully removed texture with filepath "' + filepath + '"');
				}
				else{
					this.textures[i].setAttribute("refCount", potentialRefCount);
					console.log('_textureManager - RemoveTexture() - Decremented the "refCount" of texture with the filepath "' + filepath + '" to ' + this.textures[i].getAttribute("refCount"));
				}
 
				return true;
			}
		}

		// If we've gotten to this point then we've failed to do anything.
		console.log('_textureManager - RemoveTexture() - Unable to find a texture with the filepath "' + filepath + '" to remove');
		return false;
	},
	Shutdown : function(){
		if (this.textures){
			while(this.textures.length > 0){
				var curIndex = this.textures.length - 1;

				// Let's just see what the refCount is for this . . .
				var curRefCount = parseInt(this.textures[curIndex].getAttribute("refCount"));

				// Log what the refCount is before we just obliterate the Audio object anyways
				console.log('_textureManager - Shutdown() - Texture with filepath "' + this.textures[curIndex].src + '" has a "refCount" of ' + curRefCount);

				// Delete the image itself
				delete textures[curIndex];

				// Remove this spot from the array
				this.textures.pop();
			}

			// Null out the array
			this.textures = null;
		}
	}
}

// Our item manager that'll keep track of all of our items
var _itemManager = {
	var idCounter : 0,
	var items : null,
	Initialize : function(){
		// Clear out anything in our items array before initializing it
		this.Shutdown();

		// Reset the idCounter
		this.idCounter = 0;
	},
	AddItem : function(numcopy, filepath){
		//  Check to see if the filepath exists
		if (utility.FileExists(filepath)){

			// Do this numcopy times
			for (var c = 0; c < numcopy ; c++){
				// Read the item file 
				var newItem = utility.ReadJSONFile(filepath);

				// Modify the "executeonfinish", "ai" and "collided" properties so that they are strings instead of arrays.
				if (newItem.hasOwnProperty("states")){
					// Go through each "state" in the "states" property
					for (var s = 0 ; s < Object.keys(newItem.states).length ; s++){
						var curState = Object.keys(newItem.states)[s];

						// Look at each "frame" object in the current state's "frames" property
						for (var f = 0 ; f < newItem.states[curState].frames.length ; f++){
							
							/*
							// If it has an "executeonfinish" property . . .
							if (newItem.states[curState].frames[f].hasOwnProperty("executeonfinish")){
								var concatenatedString = "";

								// . . . Loop through each item in that array and string it all together . . .
								for (var s = 0 ; s < newItem.states[curState].frames[f]["executeonfinish"].length ; s++){
									concatenatedString += newItem.states[curState].frames[f]["executeonfinish"][s];
								}

								// . . . and replace that property.
								newItem.states[curState].frames[f]["executeonfinish"] = concatenatedString;
							}
							//*/
							utility.ConvertArrayToString(newItem.states[curState].frames[f], "executeonfinish");
						}
					}
				}

				// Modify the "executeonfinish", "ai" and "collided" properties so that they are strings instead of arrays.
				/*
				if (newItem.hasOwnProperty("ai")){
					var concatenatedString = "";

					for (var a = 0 ; a < newItem["ai"].length ; a++){
						concatenatedString += newItem["ai"][a];
					}

					newItem["ai"] = concatenatedString;
				}
				//*/
				utility.ConvertArrayToString(newItem, "ai");

				// Modify the "executeonfinish", "ai" and "collided" properties so that they are strings instead of arrays.
				/*
				if (newItem.hasOwnProperty("collided")){
					var concatenatedString = "";

					for (var a = 0 ; a < newItem["collided"].length ; a++){
						concatenatedString += newItem["collided"][a];
					}

					newItem["collided"] = concatenatedString;
				}
				//*/
				utility.ConvertArrayToString(newItem, "collided");

				// Set the id of this item
				newItem.id = this.idCounter++;

				// Add it to the items array
				this.items.push(newItem);
			}

			// If successful return the last item added (which should be an item of this particular type)
			return this.items[this.items.length - 1];
		}
		// If not return null
		else{
			// Let the User know we didn't load the item
			console.log('_itemManager - AddItem() - Item file at "' + filepath + '" count not be found');
			return null;
		}
	},
	RemoveItem : function(identifier){
		// Run through all the items to find the item by the identifier	
		for (var i = 0 ; i < this.items.length ; i++){
			if (
				(!isNaN(identifier) && this.items[i].id == identifier) ||
				(isNaN(identifier) && this.items[i].name == identifier)
			){
				// REMOVE THE ITEM!
				console.log('_itemManager - RemoveItem() - Removing: ' + this.items[i]);

				// Unload texture reference
				gameEngine.textureManager.RemoveTexture(this.texture.src);

				//	Run through each "state"/property in the "states" object
				while(Object.keys(this.states).length > 0){
					// Our current "state" object that we're looking at (e.g., "dying", "idle", etc.)
					var curState = Object.keys(this.states)[Object.keys(this.states).length - 1];

					// Run through the "frames" array of the current state (curState) that we're looking at
					for(var f = 0 ; f < this.states[curState].frames.length ; f++){
						
						// Delete EACH data member (e.g., "duration", "hitbox", "executeonfinish", etc.) of this current frame object.
						while(Object.keys(this.states[curState].frames[f]).length > 0){
							var curFrame = this.states[curState].frames[f];
							var curIndex = Object.Keys(curFrame).length - 1;
							var curKey = Object.Keys(curFrame)[curIndex];

							delete this.states[curState].frames[f][curKey];
						}

						// Then delete that particular element in the "frames" array
						delete this.states[curState].frames[f];
					}
					
					// Then finally 0 out "frames" array for this current state
					this.states[curState].frames.length = 0;

					//	Then finally delete the current state you're looking at (e.g., "dying")
					delete this.states[curState];
				}

				// Delete the object!
				delete this.items[i];

				// Splice the item array!
				this.items.splice(i,1);

				console.log('_itemManager - RemoveItem() - Successfully removed item with ' + (isNaN(identifier) ? '"name"' : '"id"') + ' of ' + identifier);
				return true;
			}
		}

		// If we're at this point then we didn't remove anything
		console.log('_itemManager - RemoveItem() - Could not find an item with "id" or "name" matching "' + identifier + '"');
		return false;
	},
	Shutdown : function(){
		if (this.items){
			while(this.items.length > 0){
				var curId = this.items[this.items.length - 1].id

				this.RemoveItem(curId);

				// // Free up the references
				// this.items[this.items.length - 1].unload();
				// // Delete the item itself
				// delete items[this.items.length - 1];
				// // Remove this spot from the array
				// this.items.pop();
			}

			// Null out the array
			this.items = null;
		}
	}
}

// Our CANVAS-based renderer
var _displayManager = {
	var onScreenCanvas = null,
	var offScreenCanvas = null,

	var context = null,

	var viewFrustum :  null,

	var reqFrameAnimFrameID : 0,

	// Loads up a fresh set of canvases based on passed in width and height values
	Initialize = function(displayWidth, displayHeight){
		// Clean up/reset things first
		this.Shutdown();

		// Our off-screen canvas
		this.offScreenCanvas = document.createElement("canvas");
		this.offScreenCanvas.width = displayWidth;
		this.offScreenCanvas.height = displayHeight;

		// Our on-screen canvas
		this.onScreenCanvas = document.createElement("canvas");
		this.onScreenCanvas.width = this.offScreenCanvas.width;
		this.onScreenCanvas.height = this.offScreenCanvas.height;
		document.body.appendChild(this.onScreenCanvas);

		// The context that we'll be using
		this.context = this.offScreenCanvas.getContext("2d");
		this.context.imageSmoothingEnabled = true;		// Is this doing anything for ya?

		// Set the viewFrustum boundaries
		this.viewFrustum = { 
			minX: 0, 
			minY : 0, 
			maxX: this.offScreenCanvas.width, 
			maxY : this.offScreenCanvas.height
		};

		// Utilizing requestAnimationFrame() instead of setInterval()
		var start = null;

		// Our requestAnimationFrame function
		function step(timestamp) {
			if (!start) 
				start = timestamp;

			// This is supposed to be used as a timeslice
			var progress = timestamp - start;

			// Clear the canvas rect
			_displayManager.context.clearRect(0, 0, _displayManager.offScreenCanvas.width, _displayManager.offScreenCanvas.height);

			// Render whatever gameEngine says to, be it a gameState's stuff or a Lanscape message
			gameEngine.Render();

			// Put the offscreen canvas context data onto the onscreen canvas context
			_displayManager.onScreenCanvas.getContext("2d").putImageData(_displayManager.context.getImageData(0, 0, _displayManager.offScreenCanvas.width, _displayManager.offScreenCanvas.height), 0, 0);

			// Recursively call it!
			window.requestAnimationFrame(step);
		}

		// Kick it off!
		this.reqFrameAnimFrameID = window.requestAnimationFrame(step);
	},
	GenerateHTML = function(){
		
	},
	Shutdown = function(){
		// Null the "context" reference
		this.context = null;

		// Get rid of the onScreenCanvas
		if (this.onScreenCanvas){
			this.onScreenCanvas.parentNode.removeChild(this.onScreenCanvas);
			this.onScreenCanvas = null;
		}

		// Get rid of the offScreenCanvas
		if (this.offScreenCanvas){
			this.offScreenCanvas.parentNode.removeChild(this.offScreenCanvas);
			this.offScreenCanvas = null;
		}

		// Null out the viewFrustum object
		this.viewFrustum = null;

		// Cancel the requestAnimationFrame
		window.cancelAnimationFrame(this.reqFrameAnimFrameID);

		// Zero out the ID of that requestAnimationFrame
		this.reqFrameAnimFrameID = 0;

		// Kill all the html??
		document.html();
	}
}

// Our new and hopefully improved gameEngine object that abstracts a lot of the functionality to outside managers
var gameEngine = {
	// The current version of this gameEngine
	version : 2.0.0.0,

	// Reference to our input manager object
	inputManager : _inputManager,

	// Reference to our sound manager object
	soundManager : _soundManager,

	// Reference to our texture manager object
	textureManager : _textureManager,

	// Reference to our item manager object
	itemManager : _itemManager,

	// Reference to our display manager object
	displayManager : _displayManager,

	// The current gameState that we're in (e.g., "menu", "game", etc.)
	gameState : null,

	// For testing and debugging and logging
	debugMode : false,

	// Are we currently in landscape mode?
	isLandscape : true,

	// Which message in the landscapeMessage array are we using? Start off with 0.
	curLandscapeMessageIndex : 0,

	// The ID of the setInterval
	intervalTimerID : 0,

	// An array of messages to display to the User whenever they fall out of Landscape mode
	landscapeMessages : [
						"Please adjust your device so you are viewing this in landscape mode.",
						"No seriously, this game is better experienced in landscape mode.",
						"IF YOU DO NOT ADJUST YOUR DEVICE TO LANDSCAPE MODE THEN WE HAVE A PROBLEM.",
						"Look, try as you might this game will only continue in landscape mode.",
						"All right I'll level with you - I just need the screen height to be less than the screen width.",
						"LANDSCAPE MODE - DO YOU SPEAK IT?!",
						],

	// Our standard increment of time
	timeslice = 20,

	Initialize : function(){
		// Initialize our managers
		this.inputManager.Initialize();
		this.soundManager.Initialize();
		this.itemManager.Initialize();
		this.displayManager.Initialize();

		// Build up the HTML of our page
		this.displayManager.GenerateHTML();

		// Set an interval functionality
		this.intervalTimerID = setInterval(function (){
			gameEngine.Update();
		}, this.timeslice);
	},
		var http = new XMLHttpRequest();
		http.open('HEAD', filepath, false);
		http.send();
		return http.status != 404;
	},
	LoadLevel : function(levelObject){
		var error = false;

		// Find out what kind of level it is
		if (levelObject.levelType){
			switch (levelObject.levelType){
				case "auto-scroll-X":
					// Make sure the "filepath" properties in all of the "backgroundtiles" object can be found.
					if (levelObject.backgroundtiles){
						for (var bt = 0 ; bt < levelObject.backgroundtiles.length ; bt++){
							var filepath = levelObject.backgroundtiles[bt].filepath;

							if (!utility.FileExists(filepath)){
								error = true;
								console.log('gameEngine - LoadLevel() - Could not find the file located at "' + filepath + '".');
							}
						}
					}
					else{
						error = true;
						console.log('gameEngine - LoadLevel() - Could not find the property "backgroundtiles" in object "levelObject".');
					}

					// TODO: Set up an array of 2 objects according to the "backgroundtiles" property of the levelObject
					if (!error){
						// Create an array that we'll need to remember to get rid of on UnloadLevel()
						this.gameEngineBackgroundTiles = [];

						// Run through the backgroundtiles array and for each "isStartingBackground" we'll add 2 copies of it into the "this.gameEngineBackgroundTiles" array
						for (var bt = 0 ; bt < levelObject.backgroundtiles.length ; bt++){
							if (levelObject.backgroundtiles[bt].isStartingBackground){
								for (var times = 0 ; times < 2 ; times++){
									this.gameEngineBackgroundTiles.push({
										image : this.textureManager.AddTexture(levelObject.backgroundtiles[bt].filepath),
										x: 0,
										y: 0,
										speedx: 0,
										speedy: 0,
										z: levelObject.backgroundtiles[bt].zplane,
										needsReset: false
									});
								}
							}
						}
					}

					break;
				case "auto-scroll-Y":
					break;
				case "auto-scroll-Z":
					break;
				case "manual-scroll-X":
					break;
				case "manual-scroll-Y":
					break;
				case "manual-scroll-Z":
					break;
			}
		}

		// Load up the sounds!
		if (levelObject.sounds){
			for(var i = 0 ; i < levelObject.sounds.length ; i++){
				if (!this.soundManager.AddSound(levelObject.sounds[i].keyname, levelObject.sounds[i].filepath, levelObject.sounds[i].type)){
					error = true;
					console.log('gameEngine - LoadLevel() - Could not find the file located at "' + filepath + '".');
				}
			}
		}

		// Load up the items!
		if (levelObject.items){
			for(var i = 0 ; i < levelObject.items.length ; i++){
				if (!this.itemManager.AddItem(levelObject.items[i])){
					error = true;
					console.log('gameEngine - LoadLevel() - Could not find the file located at "' + filepath + '".');
				}
			}
		}

		// Write a message informing the User of an error occurring when attempting to load the level file
		if (error){
			console.log('gameEngine - LoadLevel() - Error occurred! Commencing UnloadLevel() . . .');
			this.UnloadLevel();
		}
	},
	UnloadLevel : function(){
		this.soundManager.Shutdown();
		this.textureManager.Shutdown();
		this.itemManager.Shutdown();
		console.log('gameEngine - UnloadLevel() - SUCCESS!');
	},
	EnterGameState : function(gs){
		// Exit out of our current gameState
		if (this.gameState != null){
			this.gameState.Shutdown();
		}

		// Load up our new gameState
		this.gameState = gs;

		// Initialize your gameState!
		this.gameState.Initialize();
	},
	Update(){
		// If we're in landscape mode then we're good
		if (this.isLandscape){
			// If the gameState is ready to process their loop functions . . .
			if (this.gameState.isReady()){
				this.gameState.GetInput();
				this.gameState.Update();
			}

			// Check to see if we lost Landscape mode at any point in time
			if (window.innerHeight > window.innerWidth){
				this.isLandscape = false;
			}
		}
		else{
			// If the gameState is ready to Pause() . . .
			if (this.gameState.isReady()){
				// Stop everything! The music, the sounds, the clock - EVERYTHING!
				this.soundManager.Pause();
			}

			// Check to see if we gained Landscape mode at any point in time
			if (window.innerHeight < window.innerWidth){
				// Set the isLandscape to true
				this.isLandscape = true;
				
				// Unpause all sounds that were in the middle of playing
				this.soundManager.Unpause();
				
				// Select a random landscape message for next time
				this.curLandscapeMessageIndex = Math.floor(Math.random()* this.landscapeMessages.length);
			}
		}
	},
	Render(){
		if (this.isLandscape){
			// TODO: Render this.landscapeMessages[this.curLandscapeMessageIndex]
		}
		else{
			this.gameState.Render();
		}
	},
	Shutdown : function(){
		this.inputManager.Shutdown();
		this.soundManager.Shutdown();
		this.textureManager.Shutdown();
		this.itemManager.Shutdown();
		this.displayManager.Shutdown();

		// Clear out our timer
		clearInterval(this.this.intervalTimerID);
	}
}

// A handy utility class that contains some general functions
var utility = {
	ReadJSONFile : function(filepath){
		var request = new XMLHttpRequest();

		request.open("GET", filepath, false);
		request.overrideMimeType("application/json");
		request.send(null);

		return JSON.parse(request.responseText);
	},
	FileExists : function(filepath){
		var http = new XMLHttpRequest();
		http.open('HEAD', filepath, false);
		http.send();
		return http.status != 404;
	},
	CheckCollision : function(obj1, obj2){
		return false;
	},
	ConvertArrayToString(parentObj, propName){
		if (parentObj.hasOwnProperty(propName)){
			var concatenatedString = "";

			for (var a = 0 ; a < parentObj[propName].length ; a++){
				concatenatedString += parentObj[propName][a];
			}

			parentObj[propName] = concatenatedString;
		}
	}
}