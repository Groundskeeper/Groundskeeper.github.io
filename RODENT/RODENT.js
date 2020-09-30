///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//					|--TODO--|
//			GAMEPLAY:
//	* Fill out the level!
//		* Add some stuff after the barrels explode and before the group melee spawn
//		* Add stuff starting at 95 seconds - enemyMelees? barricade Concretes?
//	* Program the boss AI
//		* Program some attacks at certain times
//	* Implement Speech Boxes and Speech Portraits
//
//			TECHNICAL:
//	* Keep the timestamp as a backup in case we encounter a song that doesn't play or CAN'T be played
//		* So far it's being used to FLASH the text in the gsMenu state
//		* In gsGame it's used for warningFlashingTimer and cameraShakeFrequency
//		* Should this be a check done up front on launch of the game or continuously on the fly to see whether or not we can play sounds?
//	* Implement use of onLoad and/or onError for the assets.
//		* Perhaps check it against a manifest as defined by the level files or something . . .
//
//			OPTIMIZATION:
//	* Replace eval calls with function() calls
//
//			TOUCHSCREEN:
//
//			ASSETS:
//	* Speech Portraits
//		* Still frame like Final Fantasy portraits
//	* Speech Blocks
//		* Like Final Fantasy blocks
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//					|--FIX--|
//			GAMEPLAY:
//	* The touch divs are out of place when viewing it "scaled" now that we've implemented the meta scaling tag
//		* The MenuOption divs
//		* This may in fact be an opportunity to undo TEXT rendering and make them all into floating html elements
//	* The music doesn't pause when going into landscape mode?
//		* This happened while in MENU gamestate
//
//			TECHNICAL:
//	* FireFox Mobile
//		* Lags like crazy when enemies are on screen
//		* Doesn't seem to continue after a certain point. Possibly an unhandled error?
//		* IntroScreen doesn't display unless paused??
//	* FireFox Focus
//		* Music doesn't play
//			* Same with DuckDuckGo on Android
//			* Most likely due to the music thing.
//	* Chrome Mobile
//		* Synchronization errors
//		* Max brightness doesn't seem to go 100% like it doesn't on desktop
//
//			OPTIMIZATION:
//
//			TOUCHSCREEN:
//
//			ASSETS:
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//					|--ICING--|
//			GAMEPLAY:
//	* Should each worldItem be its own file?
//		* We could leverage JSON.parse()
//		* Modify the gameEngine LoadItems() to take this into account?
//	* Simplify the input calls
//		* Like do a single function like "Up()" or "UpOnce()" inside of the gameEngine object and THAT will call all the various keyboard, joystick, touch, etc functions
//		* Perhaps create an "INPUTHANDLER OBJECT" or something and conditionally render the joystickUI and conditionally create the joystickDivs IF we have them.
//	* Create a dynamic worldItem loading thing so we aren't holding SOO much stuff in memory. - ("load_asset")
//		* Load the boss stuff only when needed
//	* Wait to set the intervals and requestAnimationFrames until AFTER everything has been successfully loaded.
//
//			TECHNICAL:
//	* Dynamically generate the html file to the point where all you have to do is just include the js file onto an html page
//		 * Already stubbed out the "GenerateHTML()" function in the gameEngine object. 
//			* Call this in the Init() function?
//
//			OPTIMIZATION:
//	* Perhaps handle the "hasUserTouchedDocumentYet" slightly differently so we don't have to ALWAYS check it?
//		* Like load up the eventlisteners to take into account hasUserTouchedDocumentYet and then when it's true DELETE those listeners
//			* Same with the interval and/or requestAnimationFrame calls
//	* Perhaps handle the music playing differently as well? Like so we don't have to do a "readyState" check every frame?
//
//			TOUCHSCREEN:
//
//			ASSETS:
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

"use strict;"

//////////////////////////
//	"SINGLETON" OBJECTS	//
//////////////////////////

// Our MENU gamestate object
var gsMenu = {
	title : "menu",
	worldObjects : [],
	backgroundTiles : [],
	playerObj : null,			// A handle to the worldItem with a name of "player"

	minY : 0,	// The current HIGHEST point we can move the playerObj on screen
	maxY : 0,	// The current LOWEST point we can move the playerObj on screen
	minX : 0,	// The current farthest LEFT point we can move the playerObj on screen
	maxX : 0,	// The current farthest RIGHT point we can move the playerObj on screen

	curMenuScreen : null,
	curMenuOption : 0,

	isStarting : false,			// Are we about to start the game?

	timestamp : 0,				// So far only used for flashing the "Start" option when we're starting the game

	backgroundNeg1 : null,		// Used to show how far the player got before they died. Otherwise if null then we'll just show the default stuff.
	background0 : null,			// Used to show how far the player got before they died. Otherwise if null then we'll just show the default stuff.
	backgroundPos1 : null,		// Used to show how far the player got before they died. Otherwise if null then we'll just show the default stuff.

	menuScreens : [],

	Initialize : function(){
		Log("Initializing MENU gamestate");

		this.minY = 250;
		this.minX = 0;
		this.maxY = gameEngine.canvas.height - 45;	// The current LOWEST point we can move the playerObj on screen
		this.maxX = gameEngine.canvas.width - 10;	// The current farthest RIGHT point we can move the playerObj on screen

		this.timestamp = 0;
		this.isStarting = false;

		var xmlDoc = gameEngine.ReadXMLFile("Menu.xml");
		var xmlDocItems = gameEngine.ReadXMLFile("MenuItems.xml");

		// Set up our backgroundTiles
		var tiles = xmlDoc.getElementsByTagName("backgroundtile");
		this.backgroundTiles = gameEngine.loadBackgroundTiles(tiles);

		// Set the background speeds
		for (var i = 0 ; i < this.backgroundTiles.length ; i++)
			this.backgroundTiles[i].speedX = this.backgroundTiles[i].z == 0 ?  -30 : -2.5;

		// Update the backgrounds with the furthest the player has been!
		if (this.background0 != null){
			// Run through the backgroundTiles array and find all the backgroundTiles that are of this zPlane and change their source
			for (var j = 0; j < this.backgroundTiles.length; j++) {
				if (this.backgroundNeg1 != null && this.backgroundTiles[j].z == -1){
					this.backgroundTiles[j].image.src = this.backgroundNeg1;
				}
				if (this.background0 != null && this.backgroundTiles[j].z == 0){
					this.backgroundTiles[j].image.src = this.background0;
				}
				if (this.backgroundPos1 != null && this.backgroundTiles[j].z == 1){
					this.backgroundTiles[j].image.src = this.backgroundPos1;
				}
			}
		}

		// Set up our sounds
		var sounds = xmlDoc.getElementsByTagName("sound");
		gameEngine.loadSounds(sounds);

		// Our world items and their animation/hitbox data
		var items = xmlDocItems.getElementsByTagName("worlditem");
		this.worldObjects = gameEngine.loadItems(items);

		// This should never happen but JUST IN CASE
		if (this.worldObjects.length == 0)
			Log("No worldObjects found!");

		// Set the playerObj variable by running through the worldObjects array and locating the item named "player"
		for (var i = 0 ; i < this.worldObjects.length ; i ++){
			if (this.worldObjects[i].name == "player"){
				this.playerObj = this.worldObjects[i];
				break;
			}
		}

		// Set up our menuScreens
		var screens = xmlDoc.getElementsByTagName("menuscreen");
		for (var i = 0 ; i < screens.length ; i++){
			var title = gameEngine.GetEventTagValue(screens[i], "title");

			// Our menu options for this screen
			var menuoptions = screens[i].getElementsByTagName("menuoption")

			// temp array of menuOption items
			var tempMenuOptions = [];

			// Get all the menuOption items for this screen
			for (var j = 0 ; j < menuoptions.length ; j++){
				var text = gameEngine.GetEventTagValue(menuoptions[j], "text");
				var onselect = gameEngine.GetEventTagValue(menuoptions[j], "onselect");
				var onleft = gameEngine.GetEventTagValue(menuoptions[j], "onleft");
				var onright = gameEngine.GetEventTagValue(menuoptions[j], "onright");

				var font = gameEngine.GetEventTagValue(menuoptions[j], "font");
				var fontsize = gameEngine.GetEventTagValue(menuoptions[j], "fontsize");
				var position = gameEngine.GetEventTagValue(menuoptions[j], "position");
				var x = gameEngine.GetEventTagValue( menuoptions[j].getElementsByTagName("position")[0], "x" );
					if (x.toLowerCase() == "center")
						x = gameEngine.canvas.width/2;
				var y = gameEngine.GetEventTagValue( menuoptions[j].getElementsByTagName("position")[0], "y" );

				// Add it to our temp menuOption array
				tempMenuOptions.push(new menuOption(text, onselect, onleft, onright, font, fontsize, parseInt(x), parseInt(y)));
			}

			// Add it to our menuScreen array!
			this.menuScreens.push(new menuScreen(title, tempMenuOptions));
		}

		// This should never happen but just in case
		if (this.menuScreens.length <= 0){
			Log("No menuScreens found!");
		}

		// Find the menuScreen with a title of "Main"
		this.ChangeMenuScreen("Main");

		Log("Initialized MENU gamestate");
	},
	Exit : function(){
		Log("===Unloading MENU gamestate===");

		// curMenuScreen
		Log("Unloading curMenuScreen");
			this.curMenuScreen = null;

		// worldObjects array
		Log("Releasing references to the items in the worldObjects array");
		for (var i = 0 ; i < this.worldObjects.length ; i++){
			// If we haven't already unloaded it earlier
			if (this.worldObjects[i] != null){
				this.worldObjects[i].unload();
				this.worldObjects[i] = null;
			}
		}
		Log("Emptying out the worldObjects array");
		while (this.worldObjects.length > 0){
			this.worldObjects.pop();
		}

		// backgroundTiles array
		Log("Releasing references to the items in the backgroundTiles array");
		for (var i = 0 ; i < this.backgroundTiles.length ; i++){
			if (this.backgroundTiles[i] != null){
				this.backgroundTiles[i].unload();
				this.backgroundTiles[i] = null;
			}
		}
		Log("Emptying out the backgroundTiles array");
		while (this.backgroundTiles.length > 0){
			this.backgroundTiles.pop();
		}

		// Same with the playerObj . . .
		Log("Releasing references to the playerObj");
		this.playerObj = null;

		// gameEngine soundArray
		Log("Unloading the soundArray object");
		for (var i = 0 ; i < Object.keys(gameEngine.soundArray).length ; i++){
			// If we haven't already unloaded it earlier
			if (gameEngine.soundArray[Object.keys(gameEngine.soundArray)[i]] != null){
				gameEngine.soundArray[Object.keys(gameEngine.soundArray)[i]].unload();
				gameEngine.soundArray[Object.keys(gameEngine.soundArray)[i]] = null;
			}
		}
		Log("Emptying out the soundArray");
		gameEngine.soundArray = [];

		// menuScreens array
		Log("Releasing references to the items in the menuScreens array");
		for (var i = 0 ; i < this.menuScreens.length ; i++){
			// If we haven't already unloaded it earlier
			if (this.menuScreens[i] != null){
				this.menuScreens[i].unload();
				this.menuScreens[i] = null;
			}
		}
		Log("Emptying out the menuScreens array");
		while (this.menuScreens.length > 0){
			this.menuScreens.pop();
		}

		// imagesArray
		Log("Releasing references to the images in the imagesArray");
		for (var i = 0 ; i < gameEngine.imagesArray.length ; i++){
			gameEngine.imagesArray[i] = null;
		}
		Log("Emptying out the imagesArray");
		while (gameEngine.imagesArray.length > 0){
			gameEngine.imagesArray.pop();
		}

		// Kill ALL the DOM objects
		this.ChangeMenuDomElements();

		Log("===Unloaded MENU gamestate===");
	},
	GetInput : function(){
		// Reset the player speed here?
		this.playerObj.speedX = 0;
		this.playerObj.speedY = 0;

		// If the game is starting then let's keep the player from being able to move the cursor
		if (!this.isStarting){
			// LEFT ARROW or A
			if (gameEngine.isKeyPressedOnce(37) || gameEngine.isKeyPressedOnce(65) || gameEngine.isJoystickMoved("movementDiv", "left") || gameEngine.isJoystickMoved("shootingDiv", "left")) {
				// Execute the code if it has any!
				eval(this.curMenuScreen.menuOptions[this.curMenuOption].onleft);
			}
			// RIGHT ARROW or D
			if (gameEngine.isKeyPressedOnce(39) || gameEngine.isKeyPressedOnce(68) || gameEngine.isJoystickMoved("movementDiv", "right") || gameEngine.isJoystickMoved("shootingDiv", "right")) {
				// Execute the code if it has any!
				eval(this.curMenuScreen.menuOptions[this.curMenuOption].onright);
			}
			// UP or W
			if (gameEngine.isKeyPressedOnce(38) || gameEngine.isKeyPressedOnce(87) || gameEngine.isJoystickMoved("movementDiv", "up") || gameEngine.isJoystickMoved("shootingDiv", "up")) {
				// Play the sound
				gameEngine.soundArray["MoveCursor"].play();
				// Decrement the current option
				this.curMenuOption--;
				// Wrap it around if necessary
				if (this.curMenuOption < 0)
					this.curMenuOption = this.curMenuScreen.menuOptions.length - 1;
			}
			// DOWN or S
			if (gameEngine.isKeyPressedOnce(40) || gameEngine.isKeyPressedOnce(83) || gameEngine.isJoystickMoved("movementDiv", "down") || gameEngine.isJoystickMoved("shootingDiv", "down")) {
				// Play the sound
				gameEngine.soundArray["MoveCursor"].play();
				// Decrement the current option
				this.curMenuOption++;
				// Wrap it around if necessary
				if (this.curMenuOption >= this.curMenuScreen.menuOptions.length)
					this.curMenuOption = 0;
			}
			// ENTER
			if (gameEngine.isKeyPressedOnce(13)|| gameEngine.isElementTouchedOnce("startButtonDiv")) {
				if (typeof(this.curMenuScreen.menuOptions[this.curMenuOption].onselect) != "undefined" &&
					this.curMenuScreen.menuOptions[this.curMenuOption].onselect != null &&
					this.curMenuScreen.menuOptions[this.curMenuOption].onselect != ""){
						// Execute the code if it has any!
						eval(this.curMenuScreen.menuOptions[this.curMenuOption].onselect);
						// Play the sound
						gameEngine.soundArray["ConfirmSelection"].play();
				}
				else{
					alert(this.curMenuScreen.menuOptions[this.curMenuOption].text + " has not yet been implemented!");
				}
			}

			// Run through the elements with the menuOption class and check to see if they got hit
			for (var i = 0 ; i < document.getElementsByClassName("menuOption").length ; i++){
				if (gameEngine.isElementTouchedOnce(document.getElementsByClassName("menuOption")[i].id)){
					// Set the curMenuOption . . .
					this.curMenuOption = i;
					// Execute the code if it has any!
					eval(this.curMenuScreen.menuOptions[this.curMenuOption].onselect);
					// Play the sound
					gameEngine.soundArray["ConfirmSelection"].play();
				}
			}
		}
	},
	Update : function(){
		if (gameEngine.soundArray["backgroundsong"].sound.readyState != 4){
			Log(this.timestamp + " - 'backgroundsong' readyState is " + gameEngine.soundArray["backgroundsong"].sound.readyState);
			return;
		}
		else if ((gameEngine.soundArray["backgroundsong"].sound.currentTime <= 0 || gameEngine.soundArray["backgroundsong"].sound.ended) && !this.isStarting){
			gameEngine.soundArray["backgroundsong"].play();
		}

		// Increment the timestamp
		this.timestamp += gameEngine.timeslice;

		/////////
		// AI! //
		/////////
		if (this.isStarting){
			// Speed the player off screen and then start the game
			this.playerObj.moveToCoordinate((gameEngine.canvas.width + 200), 400, 60, 10, function(){gameEngine.EnterGameState(gsGame);});
		}
		else{
			// Make sure the playerObj sits in that one spot unless moved
			this.playerObj.moveToCoordinate(350, 400, this.playerObj.movementSpeed, 0, null);
		}

		// Update the backgroundTiles - Move the background and see if it needs to update its needsReset variable
		for (var i = 0; i < this.backgroundTiles.length; i++){
			this.backgroundTiles[i].update();
		}

		// Stitch the backgroundTiles as needed.
		// If a backgroundTile has moved completely offscreen set their x-position to the end of the last one that doesn't needReset so it'll maintain a seamless loop
		// Do this by finding the one tile of this same plane that does NOT need resetting whose x position is the FURTHEST away from 0.
		for (var i = 0; i < this.backgroundTiles.length; i++){
			if (this.backgroundTiles[i].needsReset){
				var largestXposition = this.backgroundTiles[i].x;

				var tempArray = Array.from(this.backgroundTiles);
				tempArray.sort(function(a,b){ return b.x - a.x });

				for (var j = 0 ; j < tempArray.length ; j++){
					// If the Z-planes match AND it doesn't need resetting AND its x-position is larger than what we currently have stored in largestXposition, let's save it
					if (this.backgroundTiles[i].z == tempArray[j].z && !tempArray[j].needsReset && tempArray[j].x > largestXposition){
						largestXposition = tempArray[j].x;
					}
				}

				this.backgroundTiles[i].x = (largestXposition + gameEngine.canvas.width);
				this.backgroundTiles[i].needsReset = false;
			}
		}

		// Update worldObjects
		for (var i = 0; i < this.worldObjects.length; i++) {
			if (this.worldObjects[i] != null && this.worldObjects[i].active){
				try{
					this.worldObjects[i].update();
				}
				catch(ex){
					Log(this.worldObjects[i].name + " - " + ex.message);
				}
			}
		}
	},
	Render : function(){
		if (gameEngine.soundArray["backgroundsong"].sound.readyState != 4){
			Log(this.timestamp + " - 'backgroundsong' readyState is " + gameEngine.soundArray["backgroundsong"].sound.readyState);

			// Write out LOADING
			gameEngine.context.fillStyle = "WHITE";
			gameEngine.context.font = "20px Arial";
			gameEngine.context.textAlign = "center";
			gameEngine.context.fillText("LOADING . . .", gameEngine.canvas.width - 50, gameEngine.canvas.height - 20);

			return;
		}

		// Render the -1 backgrounds
		for (var i = 0; i < this.backgroundTiles.length; i++) {
			if (this.backgroundTiles[i].z == -1){
				this.backgroundTiles[i].render();
			}
		}

		// Render the 0 backgrounds
		for (var i = 0; i < this.backgroundTiles.length; i++) {
			if (this.backgroundTiles[i].z == 0){
				this.backgroundTiles[i].render();
			}
		}

		// Render world objects
		for (var i = 0; i < this.worldObjects.length; i++) {
			if (this.worldObjects[i] != null && this.worldObjects[i].active){
				this.worldObjects[i].render();
			}
		}

		// "WRITE" the menu options onto the canvas
		ctx = gameEngine.context;
		ctx.textAlign = "center";

		// Write the TITLE of the game
		ctx.font = "72px Bungee";
		ctx.fillStyle = "Black";
		ctx.fillText("R.O.D.E.N.T", (gameEngine.canvas.width/2), 150);

		for (var i = 0 ; i < this.curMenuScreen.menuOptions.length ; i++){
			// This option's font specification
			ctx.font = this.curMenuScreen.menuOptions[i].fontsize + " " + this.curMenuScreen.menuOptions[i].font;

			if (this.isStarting && this.curMenuScreen.menuOptions[i] == "Start"){
				// If we're starting the game then let's flash the "Start" option
				ctx.fillStyle = (this.timestamp%100) ? " Red" : "White";
			}
			else{
				// otherwise, the currently selected one is RED
				ctx.fillStyle = i == this.curMenuOption ? " Red" : "White";
			}

			// Write 'em out!
			ctx.fillText(
				(i == this.curMenuOption ? ">" : "") + this.curMenuScreen.menuOptions[i].text + (i == this.curMenuOption ? "<" : ""),
				this.curMenuScreen.menuOptions[i].x,
				this.curMenuScreen.menuOptions[i].y
			);

			// Special considerations for the volume options
			if (this.curMenuScreen.menuOptions[i].text == "Music Volume"){
				var volumeString = "";
				for (var v = 0 ; v < Math.round(gameEngine.musicVolume * 10) ; v++)
					volumeString += "|";

				ctx.fillText(volumeString,
					this.curMenuScreen.menuOptions[i].x,
					this.curMenuScreen.menuOptions[i].y + 50
				);
			}
			else if (this.curMenuScreen.menuOptions[i].text == "SFX Volume"){
				var volumeString = "";
				for (var v = 0 ; v < Math.round(gameEngine.sfxVolume * 10) ; v++)
					volumeString += "|";

				ctx.fillText(volumeString,
					this.curMenuScreen.menuOptions[i].x,
					this.curMenuScreen.menuOptions[i].y + 50
				);
			}
		}

		// Write the version at the bottom
		gameEngine.context.font = "12px arial";
		ctx.fillStyle = "black";
		gameEngine.context.fillText("v. " + gameEngine.version, 50, gameEngine.canvas.height - 15);
	},
	ChangeMenuScreen : function(menuScreenTitle){
		// Search for a menuScreen with a matching title as the one that we were given.
		for (var i = 0 ; this.menuScreens.length ; i++){
			// If we found it . . .
			if (this.menuScreens[i].title == menuScreenTitle){
				// Set it to that menuScreen
				this.curMenuScreen = this.menuScreens[i];
				// Reset the curMenuOption to 0 so it sits at the top
				this.curMenuOption = 0;

				// Change out the DOM elements for this new menuscreen!
				this.ChangeMenuDomElements();

				// Get outta this function
				return;
			}
		}

		// If we get to this point in this function then that means we didn't find a menuScreen with that title!
		Log("Could not find menuScreen with title " + menuScreenTitle);
	},
	ChangeMenuDomElements : function(){
		// .remove() any dom elements that are of class "menuOption"
		var els = document.getElementsByClassName("menuOption");
		while(els.length > 0){
			els[els.length - 1].remove();
		}

		// If we have a current Menu screen, let's find its menuOptions and create the elements for them
		if (this.curMenuScreen != null){
			for (var curOpt = 0 ; curOpt < this.curMenuScreen.menuOptions.length ; curOpt++){
				var el = document.createElement("div");
				document.getElementsByTagName("body")[0].appendChild(el);
				el.id = "menuOption_" + this.curMenuScreen.menuOptions[curOpt].text;
				el.className = "menuOption";

				el.style.height = this.curMenuScreen.menuOptions[curOpt].fontsize;
				el.style.width = this.curMenuScreen.menuOptions[curOpt].text.length * parseInt(this.curMenuScreen.menuOptions[curOpt].fontsize.substring(0, this.curMenuScreen.menuOptions[curOpt].fontsize.indexOf("px"))) + "px";

				// Offset it by the HEIGHT of the font
				el.style.top = this.curMenuScreen.menuOptions[curOpt].y - parseInt(el.style.height.substring(0, el.style.height.indexOf("px")));
				// So I think we're always gonna do a CENTER text align so we need to take that into account and offset the element's LEFT position by HALF of what the width is
				el.style.left = this.curMenuScreen.menuOptions[curOpt].x - (parseInt(el.style.width.substring(0, el.style.width.indexOf("px")))/2);
			}
		}
	}
}

// Our GAME gamestate object
var gsGame = {
	title : "game",
	worldObjects: [],			// Our array of all items in the world
	allEvents : [],				// Our array of events that we run through during the game

	credits : [],

	backgroundTiles : [],		// Our array of backgroundTile objects. There should only be a maximum of 6 items - 3 for a z-plane of 0 and 3 for a z-plane of -1
	backgroundSpeedXNeg1 : 0,	// The speed at which the backgroundTiles objects with a z-index of -1 scroll by
	backgroundSpeedX0: 0,		// The speed at which the backgroundTiles objects with a z-index of 0 scroll by
	backgroundSpeedXPos1 : 0,	// The speed at which the backgroundTiles objects with a z-index of 1 scroll by

	backgroundSpeedYNeg1 : 0,	// The speed at which the backgroundTiles objects with a z-index of -1 tilt
	backgroundSpeedY0 : 0,		// The speed at which the backgroundTiles objects with a z-index of 0 tilt
	backgroundSpeedYPos1 : 0,	// The speed at which the backgroundTiles objects with a z-index of 1 tilt

	playerObj : null,			// A handle to the worldItem with a name of "player"
	playerMaxIdleTime : 2,		// The maximum amount of time that we'll count down from to determine when we should return to the "idle" state
	playerInvincible : false,
	playerMaxLives : 5,
	playerLives : 0,

	// enemy/bosses with health bars
	enemyBomberObj : null,
	enemyGorillaObj : null,
	enemyVehicleYellowObj : null,
	enemyVehiclePinkObj : null,
	enemyVehicleBlackObj : null,
	enemyVehicleBlueObj : null,
	lastHitEnemy : "",

	timestamp : 0,				// The current time during gameplay
	speedfactor : 1,			// Modifier to speed. Expressed in decimals. 0.5 is half speed meaning durations are twice as long and movements are half as fast.

	gamePaused : false,			// Is the game paused?
	gameOver : false,			// Are we in a game over situation?
	isCutscene : false,			// Are we in the middle of a cutscene?
	rollCredits : false,		// Are we rolling the credits?

	minY : 0,					// The current HIGHEST point we can move the playerObj on screen
	maxY : 0,					// The current LOWEST point we can move the playerObj on screen
	minX : 0,					// The current farthest LEFT point we can move the playerObj on screen
	maxX : 0,					// The current farthest RIGHT point we can move the playerObj on screen

	curCutsceneBarHeight : 0,	// The current height of our cutscene bars
	maxCutsceneBarHeight : 0,	// The limit to which our cutscene bars will grow

	speechOrText : null,		// Any current speech or text to display at the bottom of the screen, preferably during a cutscene

	screenOverlay : null,		// Any current screen overlay to display. Can be used to intro a level or just generally to show whatever

	cameraShakeFrequency : 0,	// The number that we'll use to mod the timestamp by to determine the camera shake
	fillRectBrightLevel : 0,	// The brightness level for a rect that we'll use to brighten up the screen for like a blinding white light!

	warningFlashingTimer : -1,		// A variable we'll use to do a "flashing red light" thing. If the value is -1 we won't do anything with it. Otherwise we'll increment it with the timestamp. Odd numbers it'll be a light pink? Even numbers it'll be a deeper red.

	playerIsRespawning : false,		// Is the player respawning?
	drawPlayerRespawnFrame : true,	// Draw the player this frame?
	playerRespawnTimer : 0,			// How much longer till we are no longer "respawning"?
	maxPlayerRespawnTimer : 2,		// The maximum amount of time to be in a "respawn" state

	Initialize: function(){
		Log("Initializing GAME gamestate");

		// Reset the timestamp!
		this.timestamp = 0;

		// Make sure the speedFactor is back to 1
		this.speedfactor = 1;

		// Reset our min/max variables
		this.minY = 250;
		this.maxY = gameEngine.canvas.height - 10;
		this.minX = 10;
		this.maxX = gameEngine.canvas.width - 10;

		// The default level of brightness of our fillRect
		this.fillRectBrightLevel = 0;

		// Reset our cameraShakeFrequency
		this.cameraShakeFrequency = 0;

		// Set the initial background speeds
		this.backgroundSpeedXNeg1 = 0;
		this.backgroundSpeedX0 = 0;
		this.backgroundSpeedX1 = 0;

		// Set our cutscene bar height variables
		this.curCutsceneBarHeight = 0;
		this.maxCutsceneBarHeight = 50;

		// Reset our "state" variables
		this.gamePaused = false;
		this.gameOver = false;
		this.isCutscene = false;

		// Read in our XML files
		var xmlDoc = gameEngine.ReadXMLFile("Level1.xml");
		var xmlDocItems = gameEngine.ReadXMLFile("Level1Items.xml");
		var creditsDoc = gameEngine.ReadXMLFile("Credits.xml");

		// Our credit slides
		var slides = creditsDoc.getElementsByTagName("slide");
		for(var i = 0 ; i < slides.length ; i++){
			var duration = gameEngine.GetEventTagValue(slides[i], "duration");
			var font = gameEngine.GetEventTagValue(slides[i], "font");
			var fontsize = gameEngine.GetEventTagValue(slides[i], "fontsize");
			var fontcolor = gameEngine.GetEventTagValue(slides[i], "fontcolor");
			var alignment = gameEngine.GetEventTagValue(slides[i], "alignment");
			var text = gameEngine.GetEventTagValue(slides[i], "text");

			// Push this onto our creditSlide array
			this.credits.push(
			{
				duration: parseFloat(duration), 
				status : "new", 
				font: font, 
				fontsize : parseInt(fontsize), 
				fontcolor : fontcolor, 
				alignment : alignment, 
				text: text
			});
		}

		// Get the filenames of our sounds
		// Convert the xml <event> elements into individual items in an array. This way we can easily add new <events> to the array whenever we want.
		this.allEvents = Array.prototype.slice.call(xmlDoc.getElementsByTagName("event"), 0);

		// Set up our backgroundTiles
		var tiles = xmlDoc.getElementsByTagName("backgroundtile");
		this.backgroundTiles = gameEngine.loadBackgroundTiles(tiles);

		// Set up our sounds
		var sounds = xmlDoc.getElementsByTagName("sound");
		gameEngine.loadSounds(sounds);

		// Our world items and their animation/hitbox data
		var items = xmlDocItems.getElementsByTagName("worlditem");
		this.worldObjects = gameEngine.loadItems(items);

		// Run through the worldObjects array and . . .
		for (var i = 0 ; i < this.worldObjects.length ; i ++){
			// Set the playerObj variable by locating the item named "player"
			if (this.worldObjects[i].name == "player"){
				this.playerObj = this.worldObjects[i];
				this.playerObj.idleTimer = 0;
			}
			// And the same for the enemyBomberObj
			else if (this.worldObjects[i].name == "enemyBomber"){
				this.enemyBomberObj = this.worldObjects[i];
			}
			// And the same for the enemyGorillaObj
			else if (this.worldObjects[i].name == "enemyGorilla"){
				this.enemyGorillaObj = this.worldObjects[i];
			}
			// And the same for the enemyVehicleYellowObj
			else if (this.worldObjects[i].name == "enemyVehicleYellow"){
				this.enemyVehicleYellowObj = this.worldObjects[i];
			}
			// And the same for the enemyVehiclePinkObj
			else if (this.worldObjects[i].name == "enemyVehiclePink"){
				this.enemyVehiclePinkObj = this.worldObjects[i];
			}
			// And the same for the enemyVehicleBlackObj
			else if (this.worldObjects[i].name == "enemyVehicleBlack"){
				this.enemyVehicleBlackObj = this.worldObjects[i];
			}
			// And the same for the enemyVehicleBlueObj
			else if (this.worldObjects[i].name == "enemyVehicleBlue"){
				this.enemyVehicleBlueObj = this.worldObjects[i];
			}
		}
		// Reset our warningFlashingTimer
		this.warningFlashingTimer = -1;

		// Empty out the speechOrText variable
		this.speechOrText = null;

		// Set up our the screenOverlay variable.
		this.screenOverlay = new Image();

		// Play it!
		gameEngine.soundArray["backgroundsong"].play();

		// Initialize the timer
		this.timestamp = 0 - gameEngine.timeslice;

		// Reset the life count
		this.playerLives = this.playerMaxLives;

		Log("Initialized GAME gamestate");
	},
	Exit : function(){
		Log("===Unloading GAME gamestate===");

		// worldObjects array
		Log("Releasing references to the items in the worldObjects array");
		for (var i = 0 ; i < this.worldObjects.length ; i++){
			if (this.worldObjects[i] != null){
				this.worldObjects[i].unload();
				this.worldObjects[i] = null;
			}
		}
		Log("Emptying out the worldObjects array");
		while (this.worldObjects.length > 0){
			this.worldObjects.pop();
		}

		// backgroundTiles array
		Log("Releasing references to the items in the backgroundTiles array");
		for (var i = 0 ; i < this.backgroundTiles.length ; i++){
			if (this.backgroundTiles[i] != null){
				this.backgroundTiles[i].unload();
				this.backgroundTiles[i] = null;
			}
		}

		Log("Emptying out the backgroundTiles array");
		while (this.backgroundTiles.length > 0){
			this.backgroundTiles.pop();
		}

		// Same with the playerObj . . .
		Log("Releasing references to the playerObj");
		this.playerObj = null;

		// . . . and the enemyBomberObj
		Log("Releasing references to the enemyBomberObj");
		this.enemyBomberObj = null;

		// . . . and the enemyGorillaObj
		Log("Releasing references to the enemyGorillaObj");
		this.enemyGorillaObj = null;

		// . . . and the enemyVehicleYellowObj
		Log("Releasing references to the enemyVehicleYellowObj");
		this.enemyVehicleYellowObj = null;
		
		// . . . and the enemyVehiclePinkObj
		Log("Releasing references to the enemyVehiclePinkObj");
		this.enemyVehiclePinkObj = null;
		
		// . . . and the enemyVehicleBlackObj
		Log("Releasing references to the enemyVehicleBlackObj");
		this.enemyVehicleBlackObj = null;
		
		// . . . and the enemyVehicleBlueObj
		Log("Releasing references to the enemyVehicleBlueObj");
		this.enemyVehicleBlueObj = null;

		// allEvents array
		Log("Releasing references to the items in the allEvents array");
		for (var i = 0 ; i < this.allEvents.length ; i++){
			this.allEvents[i] = null;
		}
		Log("Emptying out the allEvents array");
		while(this.allEvents.length > 0){
			this.allEvents.pop();
		}

		// gameEngine soundArray
		Log("Unloading the soundArray object");
		for (var i = 0 ; i < Object.keys(gameEngine.soundArray).length ; i++){
			// If we haven't already unloaded it earlier
			if (gameEngine.soundArray[Object.keys(gameEngine.soundArray)[i]] != null){
				gameEngine.soundArray[Object.keys(gameEngine.soundArray)[i]].unload();
				gameEngine.soundArray[Object.keys(gameEngine.soundArray)[i]] = null;
			}
		}
		Log("Emptying out the soundArray");
		gameEngine.soundArray = [];

		// screenOverlay
		Log("Releasing screenOverlay reference");
		this.screenOverlay = null;

		// imagesArray
		Log("Releasing references to the images in the imagesArray");
		for (var i = 0 ; i < gameEngine.imagesArray.length ; i++){
			gameEngine.imagesArray[i] = null;
		}
		Log("Emptying out the imagesArray");
		while (gameEngine.imagesArray.length > 0){
			gameEngine.imagesArray.pop();
		}

		Log("===Unloaded GAME gamestate===");
	},
	GetInput : function(){
		// As long as we're not dying, in the middle of a cutscene, not paused, in the middle of a GameOver and not rolling credits, then let's take some input!
		if (this.playerObj.curState != "dying" && 
			!this.gamePaused && 
			!this.isCutscene && 
			!this.gameOver &&
			!this.rollCredits){
			// A is pressed AND D is NOT pressed
			if (gameEngine.isKeyPressed(65) && !gameEngine.isKeyPressed(68) || gameEngine.isJoystickMoved("movementDiv", "left")) {
				if (this.playerObj.x - this.playerObj.movementSpeed > this.minX){
						this.playerObj.speedX = -this.playerObj.movementSpeed;
				}
			}
			// D is pressed AND A is NOT pressed
			if (gameEngine.isKeyPressed(68) && !gameEngine.isKeyPressed(65) || gameEngine.isJoystickMoved("movementDiv", "right")) {
				if (this.playerObj.x + this.playerObj.movementSpeed < this.maxX){
					this.playerObj.speedX = this.playerObj.movementSpeed;
				}
			}
			// W is pressed AND S is NOT pressed
			if (gameEngine.isKeyPressed(87) && !gameEngine.isKeyPressed(83) || gameEngine.isJoystickMoved("movementDiv", "up")) {
				if (this.playerObj.y - this.playerObj.movementSpeed > this.minY){
					this.playerObj.speedY = -this.playerObj.movementSpeed;
				}
			}
			// S is pressed AND W is NOT pressed
			if (gameEngine.isKeyPressed(83) && !gameEngine.isKeyPressed(87) || gameEngine.isJoystickMoved("movementDiv", "down")) {
				if (this.playerObj.y + this.playerObj.movementSpeed < this.maxY){
					this.playerObj.speedY = this.playerObj.movementSpeed;
				}
			}

			// These are only here for testing purposes. Turn this to false later
			if (gameEngine.debugMode){
				// END button
				if (gameEngine.isKeyPressedOnce(35)){
					this.enemyVehiclePinkObj.changeState("robot_shoot_down");
				}
				// PGUP button
				if (gameEngine.isKeyPressedOnce(33)){
					this.enemyVehicleYellowObj.changeState("robot_launch_missiles");
				}
				// PGDN button
				if (gameEngine.isKeyPressedOnce(34)){
					this.enemyGorillaObj.changeState("robot_attack");
				}
				// MINUS button
				if (gameEngine.isKeyPressedOnce(109)){
					this.enemyVehicleBlueObj.changeState("robot_smash");
				}
				// PLUS button
				if (gameEngine.isKeyPressedOnce(107)){
					this.enemyVehicleBlackObj.changeState("robot_smash");
				}
				// Backslash (\) button
				if (gameEngine.isKeyPressedOnce(220)){
					this.TriggerEvent("spawn_item", 0, "<type>enemyVehicleYellow</type><posx>0</posx><posy>200</posy><speedx>0</speedx><speedy>0</speedy><state>robot_enter</state>");
					this.TriggerEvent("spawn_item", 0, "<type>enemyVehicleBlack</type><posx>0</posx><posy>200</posy><speedx>0</speedx><speedy>0</speedy><state>robot_swing_arm_out</state>");
					this.TriggerEvent("spawn_item", 0, "<type>enemyVehicleBlue</type><posx>0</posx><posy>200</posy><speedx>0</speedx><speedy>0</speedy><state>robot_swing_arm_out</state>");
					this.TriggerEvent("spawn_item", 0, "<type>enemyVehiclePink</type><posx>0</posx><posy>200</posy><speedx>0</speedx><speedy>0</speedy><state>robot_idle</state>");
					this.TriggerEvent("spawn_item", 0, "<type>enemyGorilla</type><posx>0</posx><posy>200</posy><speedx>0</speedx><speedy>0</speedy><state>robot_idle</state>");
				}
				// Backspace
				if (gameEngine.isKeyPressedOnce(8)){
					this.TriggerEvent("clear_enemies", 0, "");
					// TODO: remove this later?
					gsGame.playerObj.changeState("dying");
				}
			}

			// Arrow Keys or joystick
			if (gameEngine.isKeyPressed(37) || gameEngine.isJoystickMoved("shootingDiv", "left") ||
				gameEngine.isKeyPressed(38) || gameEngine.isJoystickMoved("shootingDiv", "up") ||
				gameEngine.isKeyPressed(39) || gameEngine.isJoystickMoved("shootingDiv", "right") ||
				gameEngine.isKeyPressed(40) || gameEngine.isJoystickMoved("shootingDiv", "down")){

				// Set the idleTimer
				this.playerObj.idleTimer = gameEngine.soundArray["backgroundsong"].sound.currentTime;

				// Determine the state
				// RIGHT
				if (!gameEngine.isKeyPressed(37) && !gameEngine.isKeyPressed(38) && gameEngine.isKeyPressed(39) && !gameEngine.isKeyPressed(40) ||
					gameEngine.isJoystickMoved("shootingDiv", "right") && !gameEngine.isJoystickMoved("shootingDiv", "up") && !gameEngine.isJoystickMoved("shootingDiv", "down")){
					this.playerObj.changeState("shoot_right");
					this.playerObj.Shoot("shoot_right", this.playerObj.bulletOriginX, this.playerObj.bulletOriginY);
				}
				// UP and RIGHT
				else if (!gameEngine.isKeyPressed(37) && gameEngine.isKeyPressed(38) && gameEngine.isKeyPressed(39) && !gameEngine.isKeyPressed(40) ||
					gameEngine.isJoystickMoved("shootingDiv", "right") && gameEngine.isJoystickMoved("shootingDiv", "up") && !gameEngine.isJoystickMoved("shootingDiv", "down")){
					this.playerObj.changeState("shoot_upright");
					this.playerObj.Shoot("shoot_upright", this.playerObj.bulletOriginX, this.playerObj.bulletOriginY);
				}
				// UP
				else if (!gameEngine.isKeyPressed(37) && gameEngine.isKeyPressed(38) && !gameEngine.isKeyPressed(39) && !gameEngine.isKeyPressed(40) ||
					gameEngine.isJoystickMoved("shootingDiv", "up") && !gameEngine.isJoystickMoved("shootingDiv", "right") && !gameEngine.isJoystickMoved("shootingDiv", "left")){
					this.playerObj.changeState("shoot_up");
					this.playerObj.Shoot("shoot_up", this.playerObj.bulletOriginX, this.playerObj.bulletOriginY);
				}
				// UP and LEFT
				else if (gameEngine.isKeyPressed(37) && gameEngine.isKeyPressed(38) && !gameEngine.isKeyPressed(39) && !gameEngine.isKeyPressed(40) ||
					gameEngine.isJoystickMoved("shootingDiv", "up") && gameEngine.isJoystickMoved("shootingDiv", "left")){
					this.playerObj.changeState("shoot_upleft");
					this.playerObj.Shoot("shoot_upleft", this.playerObj.bulletOriginX, this.playerObj.bulletOriginY);
				}
				// LEFT
				else if (gameEngine.isKeyPressed(37) && !gameEngine.isKeyPressed(38) && !gameEngine.isKeyPressed(39) && !gameEngine.isKeyPressed(40) ||
					gameEngine.isJoystickMoved("shootingDiv", "left") && !gameEngine.isJoystickMoved("shootingDiv", "up") && !gameEngine.isJoystickMoved("shootingDiv", "down")){
					this.playerObj.changeState("shoot_left");
					this.playerObj.Shoot("shoot_left", this.playerObj.bulletOriginX, this.playerObj.bulletOriginY);
				}
				// DOWN and LEFT
				else if (gameEngine.isKeyPressed(37) && !gameEngine.isKeyPressed(38) && !gameEngine.isKeyPressed(39) && gameEngine.isKeyPressed(40) ||
					gameEngine.isJoystickMoved("shootingDiv", "down") && gameEngine.isJoystickMoved("shootingDiv", "left")){
					this.playerObj.changeState("shoot_downleft");
					this.playerObj.Shoot("shoot_downleft", this.playerObj.bulletOriginX, this.playerObj.bulletOriginY);
				}
				// DOWN
				else if (!gameEngine.isKeyPressed(37) && !gameEngine.isKeyPressed(38) && !gameEngine.isKeyPressed(39) && gameEngine.isKeyPressed(40) ||
					gameEngine.isJoystickMoved("shootingDiv", "down") && !gameEngine.isJoystickMoved("shootingDiv", "right") && !gameEngine.isJoystickMoved("shootingDiv", "left")){
					this.playerObj.changeState("shoot_down");
					this.playerObj.Shoot("shoot_down", this.playerObj.bulletOriginX, this.playerObj.bulletOriginY);
				}
				// DOWN and RIGHT
				else if (!gameEngine.isKeyPressed(37) && !gameEngine.isKeyPressed(38) && gameEngine.isKeyPressed(39) && gameEngine.isKeyPressed(40) ||
					gameEngine.isJoystickMoved("shootingDiv", "down") && gameEngine.isJoystickMoved("shootingDiv", "right")){
					this.playerObj.changeState("shoot_downright");
					this.playerObj.Shoot("shoot_downright", this.playerObj.bulletOriginX, this.playerObj.bulletOriginY);
				}
				else{
					Log(this.timestamp + " - " + "Could not determine the player state when attempting to shoot.");
				}
			}
		}

		// ENTER or ESCAPE
		if (gameEngine.isKeyPressedOnce(13) || gameEngine.isKeyPressedOnce(27) || gameEngine.isElementTouchedOnce("startButtonDiv")) {

			if (this.gameOver){
				// If we're in GameOver mode then pressing ENTER or ESCAPE will return us to the main menu
				gameEngine.soundArray["gameoversong"].stop();
				// Enter the main menu state
				gameEngine.EnterGameState(gsMenu);
				// Get outta this!
				return;
			}
			// If we're rolling credits AND we're done with them the credits . . .
			else if (this.rollCredits && gameEngine.soundArray["backgroundsong"].sound.ended){
				// Reset the rollCredits variable
				this.rollCredits = false;

				// Stop and RESET the song
				gameEngine.soundArray["backgroundsong"].stop();

				// If we're rolling credits AND the song is over then let's have this key press be the one that sends us back to the main menu!
				gameEngine.EnterGameState(gsMenu);
			}

			// Toggle the pause
			this.PauseGame(!this.gamePaused);
		}
	},
	Update : function(){
		// Make sure we're ready to play 
		if (gameEngine.soundArray["backgroundsong"].sound.readyState != 4){
			Log(this.timestamp + " - 'backgroundsong' readyState is " + gameEngine.soundArray["backgroundsong"].sound.readyState);
			return;
		}

		if (!this.gamePaused && !this.gameOver){
			// Update the timestamp
			this.timestamp += gameEngine.timeslice;

			// Update our warningFlashingTimer if it's greater than -1
			if (this.warningFlashingTimer > -1){
				this.warningFlashingTimer = parseInt(this.timestamp/1000);
			}
			
			// Event Triggering
			// Run through all of the "allEvents" items that we got the from the XML and process them accordingly by their status
			for (var i = 0 ; i < this.allEvents.length ; i++){
				// Ignore Nulled out ones . . .
				if (this.allEvents[i] == null)
					continue;

				var eventStatus = gameEngine.GetEventTagValue(this.allEvents[i], "status");

				// Don't do anything with this "processed" event, just skip it!
				if (eventStatus == "processed"){
					continue;
				}

				var eventTimestamp = parseFloat(gameEngine.GetEventTagValue(this.allEvents[i], "timestamp"));
				var eventDuration = parseFloat(gameEngine.GetEventTagValue(this.allEvents[i], "duration"));
				var eventAction = gameEngine.GetEventTagValue(this.allEvents[i], "action");

				var curTime = gameEngine.soundArray["backgroundsong"].sound.currentTime;

				switch(eventStatus){
					case "new":
						// Simple: If it hasn't happened yet, let's process it!
						if (eventTimestamp <= curTime){
							// Otherwise we'll set the event status to "inprogress" and let the switch statement fall through to the "inprogress" case where we process it like normal
							gameEngine.SetEventTagValue(this.allEvents[i], "status", "inprogress");
						}
						else{
							continue;
						}

						// Fall through to the inprogress state . . .

					case "inprogress":
						switch(eventAction){
							case "change_variable":
								var variable = gameEngine.GetEventTagValue(this.allEvents[i], "variable");
								var increment = gameEngine.GetEventTagValue(this.allEvents[i], "increment");
								var targetValue = gameEngine.GetEventTagValue(this.allEvents[i], "targetvalue");

								if (typeof(this[variable]) == "undefined"){
									Log(this.timestamp + " - " + "Could not find a variable named " + variable + " to change.");
									break;
								}

								// If the increment is 0 then we want the change to be instantaneous
								if (increment == 0){
									// If it's a number let's parse it as a float
									if (!isNaN(targetValue)){
										this[variable] = parseFloat(targetValue);
									}
									// If it's a BOOLEAN . . .
									else if (targetValue.toLowerCase() == "true" || targetValue.toLowerCase() == "false"){
										this[variable] = (targetValue.toLowerCase() == "true");
									}
									// Otherwise we'll just throw it in as is
									else{
										this[variable] = targetValue;
									}
								}
								else{
									// If we're DECREMENTING and we haven't hit that point yet . . . 
									if (	(parseFloat(increment) < 0 && this[variable] > parseFloat(targetValue)) ||
											(parseFloat(increment) > 0 && this[variable] < parseFloat(targetValue))){
										this[variable] += parseFloat(increment);
									}
								}

								// If we're messing with the minY or maxY then we'll make sure the player and other enemies are within the new bounds.
								if (variable == "minY"){
									if (this.playerObj.y < this.minY){
										this.playerObj.y = this.minY;
									}
								}
								if (variable == "maxY"){
									if (this.playerObj.y > this.maxY){
										this.playerObj.y = this.maxY;
									}
								}

								// If variable begins with "backgroundSpeedX" then make sure to apply it to the backgroundTiles
								if (variable.indexOf("backgroundSpeedX") != -1){
									// Run through all of the background tiles . . .
									for (var j = 0; j < this.backgroundTiles.length ; j++){
										// Is this a negative 1 speed?
										if (variable.indexOf("Neg1") != -1){
											if (this.backgroundTiles[j].z == -1)
												this.backgroundTiles[j].speedX = parseFloat(this[variable]);
										}
										// Is this a positive 1 speed?
										else if (variable.indexOf("Pos1") != -1){
											if (this.backgroundTiles[j].z == 1)
												this.backgroundTiles[j].speedX = parseFloat(this[variable]);
										}
										// Is this a 0 speed?
										else{
											if (this.backgroundTiles[j].z == 0)
												this.backgroundTiles[j].speedX = parseFloat(this[variable]);
										}
									}
								}

								// If variable begins with "backgroundSpeedY" then make sure to apply it to the backgroundTiles
								if (variable.indexOf("backgroundSpeedY") != -1){
									// Run through all of the background tiles . . .
									for (var j = 0; j < this.backgroundTiles.length ; j++){
										// Is this a negative 1 speed?
										if (variable.indexOf("Neg1") != -1){
											if (this.backgroundTiles[j].z == -1)
												this.backgroundTiles[j].speedY = parseFloat(this[variable]);
										}
										// Is this a positive 1 speed?
										else if (variable.indexOf("Pos1") != -1){
											if (this.backgroundTiles[j].z == 1)
												this.backgroundTiles[j].speedY = parseFloat(this[variable]);
										}
										// Is this a 0 speed?
										else{
											if (this.backgroundTiles[j].z == 0)
												this.backgroundTiles[j].speedY = parseFloat(this[variable]);
										}
									}
								}
								
								break;
							case "cutscene":
								// If this is the first time we've entered in (based on the above grabbed "eventStatus" variable) then let's set this.isCutscene to true
								if (eventStatus == "new"){
									this.isCutscene = true;
								}

								if (this.isCutscene){
									// If it's a cutscene make sure the bars are brought up until they're maxed out.
									if (this.curCutsceneBarHeight < this.maxCutsceneBarHeight){
										this.curCutsceneBarHeight += 5;
									}
								}
								else
								{
									// Otherwise we'll shrink them till they're done and then we'll say it's done and processed.
									this.curCutsceneBarHeight -= 5;

									if (this.curCutsceneBarHeight < 0){
										this.curCutsceneBarHeight = 0;
										gameEngine.SetEventTagValue(this.allEvents[i], "status", "processed");
									}
								}

								// Finally let's see if the cutscene duration is over so we can start to exit out of cutscene mode
								if (curTime >= (eventTimestamp + eventDuration)){
									this.isCutscene = false;
								}
								break;
							case "spawn_item":
								// Find out the type and the position
								var type = gameEngine.GetEventTagValue(this.allEvents[i], "type");
								var item = this.GetFirstInactiveWithName(type);

								if (typeof(item) != "undefined" && item != null){
									var posX = gameEngine.GetEventTagValue(this.allEvents[i], "posx");
									var posY = gameEngine.GetEventTagValue(this.allEvents[i], "posy");
									var speedX = gameEngine.GetEventTagValue(this.allEvents[i], "speedx");
									var speedY = gameEngine.GetEventTagValue(this.allEvents[i], "speedy");
									var state = gameEngine.GetEventTagValue(this.allEvents[i], "state");

									// For the barrel and guard and stuff . . .
									var minY = gameEngine.GetEventTagValue(this.allEvents[i], "minY");
									var maxY = gameEngine.GetEventTagValue(this.allEvents[i], "maxY");

									// Reset the variables
									item.changeState(state);
									item.health = item.maxHealth;
									item.x = (posX == "canvasWidth") ? gameEngine.canvas.width : parseInt(posX);
									item.y = (posY == "this.playerObj.y") ? this.playerObj.y : parseInt(posY);
									item.speedX = (speedX == "this.backgroundSpeedX0") ? this.backgroundSpeedX0 : parseFloat(speedX);
									item.speedY = parseFloat(speedY);
									item.active = true;

									// Optional stuff for the flying items?
									if (typeof(item.reachedPeak) != "undefined")
										item.reachedPeak = false;
									if (!isNaN(minY) && typeof(item.minY) != "undefined")
										item.minY = minY;
									if (!isNaN(maxY) && typeof(item.maxY) != "undefined")
										item.maxY = maxY;
								}
								else{
									Log(this.timestamp + " - " + "Could not spawn_item of type " + type + " at " + eventTimestamp);
								}
								break;
							case "move_actor":
								// The name of the object we're looking for
								var actorValue = gameEngine.GetEventTagValue(this.allEvents[i], "actor");
								// The speed at which we will move. If it's 0 then it's a teleport
								var actorSpeed = gameEngine.GetEventTagValue(this.allEvents[i], "speed");
								// The coordinates of where we're trying to move it to
								var targetPosX = gameEngine.GetEventTagValue(this.allEvents[i], "targetpositionx");
								var targetPosY = gameEngine.GetEventTagValue(this.allEvents[i], "targetpositiony");

								// Our worldObject variable
								var actor = null;

								if (typeof(actorValue) != "undefined" && actorValue != null){
									for (var curObj = 0 ; curObj < this.worldObjects.length ; curObj++){
										if (this.worldObjects[curObj] != null && this.worldObjects[curObj].name == actorValue && this.worldObjects[curObj].active){
											actor = this.worldObjects[curObj];
											break;
										}
									}
								}
								if (actor != null){
									if (actorSpeed == 0){
										actor.x = parseInt(targetPosX);
										actor.y = parseInt(targetPosY);
									}
									else{
										// Reset the actor speed
										actor.speedX = parseFloat(0);
										actor.speedY = parseFloat(0);

										// Call the moveToCoordinate function. 
										// Important: there can be no callback function, because if this event had a long duration and the target coordinates were reached then it'd forever keep trying to fire it off!
										actor.moveToCoordinate(targetPosX, targetPosY, parseFloat(actorSpeed), 5, null);
									}
								}
								else{
									Log(this.timestamp + " - " + "Could not find an actor by the name of " + actorValue + " to move.");
								}
								break;
							case "speechortext":
								if (curTime >= (eventTimestamp + eventDuration)){
									// We're done with this speechOrText thing, let's null it out!
									this.speechOrText = null;
								}
								else{
									// Set up the speechOrText object
									this.speechOrText = {
										font : gameEngine.GetEventTagValue(this.allEvents[i], "font"),
										color: gameEngine.GetEventTagValue(this.allEvents[i], "color"),
										text : gameEngine.GetEventTagValue(this.allEvents[i], "text"),
										actor : gameEngine.GetEventTagValue(this.allEvents[i], "actor"),
										quadrant : gameEngine.GetEventTagValue(this.allEvents[i], "quadrant")
									};
								}

								break;
							case "screenoverlay":
								if (curTime >= (eventTimestamp + eventDuration)){
									// We're done with this screenOverlay let's blank out its src
									this.screenOverlay.src = "";
								}
								else{
									// Set the source for this image
									this.screenOverlay.src = gameEngine.GetEventTagValue(this.allEvents[i], "image");
								}
								break;
							case "change_background":
								var filename = gameEngine.GetEventTagValue(this.allEvents[i], "filename");
								var zPlane = gameEngine.GetEventTagValue(this.allEvents[i], "zplane");

								// Run through the backgroundTiles array and find all the backgroundTiles that are of this zPlane and change their source
								for (var j = 0; j < this.backgroundTiles.length; j++) {
									if (this.backgroundTiles[j].z == zPlane){
										this.backgroundTiles[j].image.src = filename;
									}
								}

								// Update the gsMenu background variables so we know what to show during the "attract" mode
								if (zPlane == -1){
									gsMenu.backgroundNeg1 = filename;
								}
								else if (zPlane == 0){
									gsMenu.background0 = filename;
								}
								else if (zPlane == 1){
									gsMenubackgroundPos1 = filename;
								}
								
								break;
							case "change_state":
								var actorName = gameEngine.GetEventTagValue(this.allEvents[i], "actor");
								var newState = gameEngine.GetEventTagValue(this.allEvents[i], "newState");
								var foundActor = false;

								for (var curActor = 0 ; curActor < this.worldObjects.length ; curActor++){
									if (this.worldObjects[curActor] != null && this.worldObjects[curActor].name == actorName && this.worldObjects[curActor].active){
										// Don't interrupt "dying"
										if (this.worldObjects[curActor] != "dying"){
											this.worldObjects[curActor].changeState(newState);
											foundActor = true;
										}
										break;
									}
								}

								if (!foundActor){
									// If we get to this point then we didn't find one that met our criteria . . .
									Log(this.timestamp + " - " + "Could not find an object with the name " + actorName + " that was active to change their state to " + newState);
								}
								break;
							case "clear_enemies":
								// Run through the worldObjects array and "kill" anything "enemy" object that is active
								for (var curActor = 0 ; curActor < this.worldObjects.length ; curActor++){
									if (this.worldObjects[curActor] != null && this.worldObjects[curActor].name.indexOf("enemy") != -1 && this.worldObjects[curActor].active){
										this.worldObjects[curActor].changeState("dying");
									}
								}

								break;
							case "unload_asset":
								var assetName = gameEngine.GetEventTagValue(this.allEvents[i], "assetname");								
								var shortenList = false;

								// Run through the worldItems and find the items with a name of (assetName) and unload them
								for (var curActor = 0 ; curActor < this.worldObjects.length ; curActor++){
									if (this.worldObjects[curActor] != null && this.worldObjects[curActor].name == assetName){
										this.worldObjects[curActor].unload();
										this.worldObjects[curActor] = null;
										shortenList = true;
									}
								}

								// If we nulled anything let's shorten the worldObjects array by removing them
								if (shortenList){
									for (var curActor = 0; curActor < this.worldObjects.length; curActor++) {
										if (this.worldObjects[curActor] == null){
											Log("Shortening the worldObjects list. BEFORE: " + this.worldObjects.length);
											this.worldObjects.splice(curActor,1);
											Log("Shortening the worldObjects list. AFTER: " + this.worldObjects.length);
											// Start over!
											curActor = -1;
										}
									}
								}

								break;
							default:
								break;
						}	// End switch(eventAction)

						break;
					default:
						break;
				}	// End switch(eventStatus)

				// If the duration is over then we can mark it as done (unless it's a cutscene, because that will mark the "processed" flag manually)
				if (eventAction != "cutscene" && curTime >= (eventTimestamp + eventDuration)){
					// Mark this item's status as "processed"
					gameEngine.SetEventTagValue(this.allEvents[i], "status", "processed");
					// Null it out? Perhaps this'll help with memory allocation
					this.allEvents[i] = null;
				}
			}	// End this.allEvents for-loop

			// Update the backgroundTiles - Move the background and see if it needs to update its needsReset variable
			for (var i = 0; i < this.backgroundTiles.length; i++){
				this.backgroundTiles[i].update();
			}

			// Stitch the backgroundTiles as needed.
			// If a backgroundTile has moved completely offscreen set their x-position to the end of the last one that doesn't needReset so it'll maintain a seamless loop
			// Do this by finding the one tile of this same plane that does NOT need resetting whose x position is the FURTHEST away from 0.
			for (var i = 0; i < this.backgroundTiles.length; i++){
				if (this.backgroundTiles[i].needsReset){
					var largestXposition = this.backgroundTiles[i].x;

					var tempArray = Array.from(this.backgroundTiles);
					tempArray.sort(function(a,b){ return b.x - a.x });

					for (var j = 0 ; j < tempArray.length ; j++){
						// If the Z-planes match AND it doesn't need resetting AND its x-position is larger than what we currently have stored in largestXposition, let's save it
						if (this.backgroundTiles[i].z == tempArray[j].z && !tempArray[j].needsReset && tempArray[j].x > largestXposition){
							largestXposition = tempArray[j].x;
						}
					}

					this.backgroundTiles[i].x = (largestXposition + gameEngine.canvas.width);
					this.backgroundTiles[i].needsReset = false;
				}
			}

			// Update worldObjects
			for (var i = 0; i < this.worldObjects.length; i++) {
				if (this.worldObjects[i] != null && this.worldObjects[i].active){
					try{
						this.worldObjects[i].update();
					}
					catch(ex){
						Log(this.timestamp + " - " + this.worldObjects[i].name + " - " + ex.message);
					}
				}
			}

			// Reset the player speed
			this.playerObj.speedX = 0;
			this.playerObj.speedY = 0;

			// If enough time has passed since we last input a command then go to Idle
			if (!this.isCutscene && 
				(gameEngine.soundArray["backgroundsong"].sound.currentTime - this.playerObj.idleTimer > this.playerMaxIdleTime) && 
				this.playerObj.curState != "idle" &&
				this.playerObj.curState != "dying"){
				this.playerObj.changeState("idle");
			}

			// Collision checks!
			for (var i = 0; i < this.worldObjects.length; i++) {
				// Only bother if the object is active
				if (this.worldObjects[i] != null && this.worldObjects[i].active){
					// Run through ALL the worldObjects . . .
					for (var j = 0; j < this.worldObjects.length; j++) {
						// Don't check against itself AND don't check against inactive objects
						if (i != j && this.worldObjects[j] != null && this.worldObjects[j].active){
							// Don't check player-related objects against other player-related objects
							if (this.worldObjects[i].name.indexOf("player") == 0 && this.worldObjects[j].name.indexOf("player") == 0){
								// Move onto the next item.
								break;
							}
							else{
								// Do a standard hitbox-to-hitbox collision check
								if (this.CheckCollision(this.worldObjects[i], this.worldObjects[j])){
									this.worldObjects[i].collided(j);
									this.worldObjects[j].collided(i);
								}
							}
						}
					}
				}
			}

			// Sort the worldObjects according to the perceived "z-plane" which I think we can reasonably base on their y-position
			this.worldObjects.sort(function(a,b){ return a.y - b.y });
		}
	},
	Render : function(){
		if (gameEngine.soundArray["backgroundsong"].sound.readyState != 4){
			Log(this.timestamp + " - 'backgroundsong' readyState is " + gameEngine.soundArray["backgroundsong"].sound.readyState);

			// Write out LOADING
			gameEngine.context.fillStyle = "WHITE";
			gameEngine.context.font = "20px Arial";
			gameEngine.context.textAlign = "center";
			gameEngine.context.fillText("LOADING . . .", gameEngine.canvas.width - 50, gameEngine.canvas.height - 20);

			return;
		}

		// Render the -1 plane backgrounds
		for (var i = 0; i < this.backgroundTiles.length; i++) {
			if (this.backgroundTiles[i].z == -1){
				this.backgroundTiles[i].render();
			}
		}

		// Render the bosses that appear "between" the -1 and 0 plane backgrounds?
		if (this.enemyBomberObj != null && this.enemyBomberObj.active){
			this.enemyBomberObj.render();
		}
		// . . . this means making sure we render the "robot" modes BEFORE the 0-plane backgrounds
		if (this.enemyGorillaObj != null && this.enemyGorillaObj.active && (this.enemyGorillaObj.curState.indexOf("robot") != -1 || this.enemyGorillaObj.curState == "dying")){
			this.enemyGorillaObj.render();
		}
		if (this.enemyVehicleYellowObj != null && this.enemyVehicleYellowObj.active && (this.enemyVehicleYellowObj.curState.indexOf("robot") != -1 || this.enemyVehicleYellowObj.curState == "dying")){
			this.enemyVehicleYellowObj.render();
		}
		// If you're ACTIVE . . . AND you're in ROBOT mode OR you're dying . . . AND you're not doing a robot_smash
		if (this.enemyVehicleBlackObj != null && this.enemyVehicleBlackObj.active && (this.enemyVehicleBlackObj.curState.indexOf("robot") != -1 || this.enemyVehicleBlackObj.curState == "dying") && this.enemyVehicleBlackObj.curState != "robot_smash"){
			this.enemyVehicleBlackObj.render();
		}
		// If you're ACTIVE . . . AND you're in ROBOT mode OR you're dying . . . AND you're not doing a robot_smash
		if (this.enemyVehicleBlueObj != null && this.enemyVehicleBlueObj.active && (this.enemyVehicleBlueObj.curState.indexOf("robot") != -1 || this.enemyVehicleBlueObj.curState == "dying") && this.enemyVehicleBlueObj.curState != "robot_smash"){
			this.enemyVehicleBlueObj.render();
		}
		if (this.enemyVehiclePinkObj != null && this.enemyVehiclePinkObj.active && (this.enemyVehiclePinkObj.curState.indexOf("robot") != -1 || this.enemyVehiclePinkObj.curState == "dying")){
			this.enemyVehiclePinkObj.render();
		}

		// Render the 0 plane backgrounds
		for (var i = 0; i < this.backgroundTiles.length; i++) {
			if (this.backgroundTiles[i].z == 0){
				this.backgroundTiles[i].render();
			}
		}

		// Render the enemyVehicles . . . or if you're smashing
		if (this.enemyGorillaObj != null && this.enemyGorillaObj.active && this.enemyGorillaObj.curState.indexOf("robot") == -1){
			this.enemyGorillaObj.render();
		}
		if (this.enemyVehicleYellowObj != null && this.enemyVehicleYellowObj.active && this.enemyVehicleYellowObj.curState.indexOf("robot") == -1){
			this.enemyVehicleYellowObj.render();
		}
		if (this.enemyVehicleBlackObj != null && this.enemyVehicleBlackObj.active && (this.enemyVehicleBlackObj.curState.indexOf("robot") == -1 || this.enemyVehicleBlackObj.curState == "robot_smash")){
			this.enemyVehicleBlackObj.render();
		}
		if (this.enemyVehicleBlueObj != null && this.enemyVehicleBlueObj.active && (this.enemyVehicleBlueObj.curState.indexOf("robot") == -1 || this.enemyVehicleBlueObj.curState == "robot_smash")){
			this.enemyVehicleBlueObj.render();
		}
		if (this.enemyVehiclePinkObj != null && this.enemyVehiclePinkObj.active && this.enemyVehiclePinkObj.curState.indexOf("robot") == -1){
			this.enemyVehiclePinkObj.render();
		}

		// Render world objects . . . cept for the bosses and transition stuff
		for (var i = 0; i < this.worldObjects.length; i++) {
			if (this.worldObjects[i] != null &&
				this.worldObjects[i].active && 
				this.worldObjects[i].name != "building" &&
				this.worldObjects[i].name != "tunnelEntrance" &&
				this.worldObjects[i].name != "tunnelExit" &&
				this.worldObjects[i].name != "enemyBomber" && 
				this.worldObjects[i].name != "enemyGorilla" &&
				(this.worldObjects[i].name.indexOf("enemyVehicle") == -1 || this.worldObjects[i].name == "enemyVehiclePinkBullet")
			){
				this.worldObjects[i].render();
			}
		}

		// Render the +1 plane backgrounds
		for (var i = 0; i < this.backgroundTiles.length; i++) {
			if (this.backgroundTiles[i].z == 1){
				this.backgroundTiles[i].render();
			}
		}

		// Render the transition objects (like the tunnel entrance, tunnel exit, the building, etc.)
		for (var i = 0; i < this.worldObjects.length; i++) {
			if (this.worldObjects[i] != null && this.worldObjects[i].active && 
				(
					this.worldObjects[i].name == "building" || 
					this.worldObjects[i].name == "tunnelEntrance" || 
					this.worldObjects[i].name == "tunnelExit"
				)){
				this.worldObjects[i].render();
			}
		}

		// UI stuff
		if (!this.isCutscene){
			// Render Player Health Bar
			gameEngine.context.fillStyle = "Red";
			gameEngine.context.fillRect(30, 30, gsGame.playerObj.health * 5, 10);

			// Player lives
			gameEngine.context.fillStyle = "white";
			gameEngine.context.font = "12px arial";
			gameEngine.context.fillText("x " + gsGame.playerLives, 30, 50);

			// Render enemyBomber Health Bar
			if (gsGame.enemyBomberObj.active && gsGame.lastHitEnemy.indexOf("Bomber") != -1){
				gameEngine.context.fillStyle = "Red";
				gameEngine.context.fillRect(300, gameEngine.canvas.height - 30, gsGame.enemyBomberObj.health, 10);
			}

			// Render enemyGorilla Health Bar
			if (gsGame.enemyGorillaObj.active && gsGame.lastHitEnemy.indexOf("Gorilla") != -1){
				gameEngine.context.fillStyle = "RGB(239,1,102)";
				gameEngine.context.fillRect(300, gameEngine.canvas.height - 30, gsGame.enemyGorillaObj.health * 2, 10);
			}

			// Render the other enemyVehicle Health Bars based on who you hit last.
			switch(gsGame.lastHitEnemy){
				case "enemyVehicleYellow":
					if (gsGame.enemyVehicleYellowObj.active){
						gameEngine.context.fillStyle = "RGB(255,201,14)";
						gameEngine.context.fillRect(300, gameEngine.canvas.height - 30, gsGame.enemyVehicleYellowObj.health * 2.5, 10);
					}
					break;
				case "enemyVehiclePink":
					if (gsGame.enemyVehiclePinkObj.active){
						gameEngine.context.fillStyle = "RGB(255,174,201)";
						gameEngine.context.fillRect(300, gameEngine.canvas.height - 30, gsGame.enemyVehiclePinkObj.health * 2.5, 10);
					}
					break;
				case "enemyVehicleBlack":
					if (gsGame.enemyVehicleBlackObj.active){
						gameEngine.context.fillStyle = "RGB(85,85,85)";
						gameEngine.context.fillRect(300, gameEngine.canvas.height - 30, gsGame.enemyVehicleBlackObj.health * 2.5, 10);
					}
					break;
				case "enemyVehicleBlue":
					if (gsGame.enemyVehicleBlueObj.active){
						gameEngine.context.fillStyle = "RGB(0,162,232)";
						gameEngine.context.fillRect(300, gameEngine.canvas.height - 30, gsGame.enemyVehicleBlueObj.health * 2.5, 10);
					}
					break;
			}
		}

		// Warning Flashing Timer?
		if (this.warningFlashingTimer > -1){
			gameEngine.context.fillStyle = (this.warningFlashingTimer % 2) ? color = "rgba(255,25,25,0.5)" : "rgba(255,50,50,0.1)";
			gameEngine.context.fillRect(0, 0, gameEngine.canvas.width, gameEngine.canvas.height);
		}

		// Render the screenOverlay if we have an image to draw . . .
		if (this.screenOverlay.src != ""){
			gameEngine.context.drawImage(this.screenOverlay, 0, 0, gameEngine.canvas.width, gameEngine.canvas.height);
		}

		// Render the cutscene bars
		if (this.isCutscene || this.curCutsceneBarHeight > 0){
			if (gameEngine.context.fillStyle != "RGB(30,30,30)"){
				gameEngine.context.fillStyle = "RGB(30,30,30)";
			}

			// Top bar
			gameEngine.context.fillRect(0, 0, gameEngine.canvas.width, this.curCutsceneBarHeight);
			// Bottom bar
			gameEngine.context.fillRect(0, (gameEngine.canvas.height-this.curCutsceneBarHeight), gameEngine.canvas.width, this.curCutsceneBarHeight);

			// Write the word Cutscene at the bottom
			gameEngine.context.font = "15px arial";
			ctx.fillStyle = "white";
			gameEngine.context.fillText("-CUTSCENE-", 50, gameEngine.canvas.height - 15);
		}

		// Render any speechOrText if we have any . . .
		if (this.speechOrText != null){

			gameEngine.context.font = this.speechOrText.font;
			gameEngine.context.fillStyle = this.speechOrText.color;
			gameEngine.context.textAlign = "center";
			gameEngine.context.textBaseline = "middle";

			// Modify this to take into account QUADRANTS and PORTRAITS!
			if (this.speechOrText.actor != null && this.speechOrText.actor != ""){
				// We're gonna be drawing a portrait and a dialog box!
				// Now let's look at the "quadrant" value to see WHERE we're gonna draw it
				if (this.speechOrText.quadrant != null && this.speechOrText.quadrant != ""){
					// If it's quadrant 1 or 3 then put it on the LEFT side of the screen if it's 2 or 4 put it on the RIGHT side of the screen, otherwise put it in the middle of the screen
					var quadX = (this.speechOrText.quadrant == 1 || this.speechOrText.quadrant == 3) ? 40 : (this.speechOrText.quadrant == 2 || this.speechOrText.quadrant == 4) ? gameEngine.canvas.width - 40 : (gameEngine.canvas.width/2);
					// If it's quadrant 1 or 2 then put it on the TOP half of the screen if it's 3 or 4 put it on the BOTTOM half of the screen, otherwise put it in the middle of the screen
					var quadY = (this.speechOrText.quadrant == 1 || this.speechOrText.quadrant == 2) ? 40 : (gameEngine.canvas.height - this.maxCutsceneBarHeight) + (this.maxCutsceneBarHeight/2);

					// "Drawr it!"
					// Draw the dialog box/portrait hex THEN write the text on top of it!
					if (this.speechOrText.quadrant == 1 || this.speechOrText.quadrant == 3){
						// Draw it regularly
					}
					else if (this.speechOrText.quadrant == 2 || this.speechOrText.quadrant == 4){
						// Draw it flipped horizontally
					}

					// Write the text!
					gameEngine.context.fillText(this.speechOrText.text, (gameEngine.canvas.width/2), quadY);
				}
			}
			else{
				// Write it like normal
				gameEngine.context.fillText(this.speechOrText.text, (gameEngine.canvas.width/2), (gameEngine.canvas.height - this.maxCutsceneBarHeight) + (this.maxCutsceneBarHeight/2));
			}
		}

		// Render our BrightnessRect
		if (this.fillRectBrightLevel > 0){
			gameEngine.context.fillStyle = "rgba(255,255,255," + this.fillRectBrightLevel + ")";
			gameEngine.context.fillRect(0, 0, gameEngine.canvas.width, gameEngine.canvas.height);
		}

		// Dim the screen if we're paused
		if (this.gamePaused){
			gameEngine.context.fillStyle = "rgba(0,0,0,0.5)";
			gameEngine.context.fillRect(0, 0, gameEngine.canvas.width, gameEngine.canvas.height);

			gameEngine.context.font = "75px Bungee";
			ctx.fillStyle = "white";
			gameEngine.context.textAlign = "center";
			gameEngine.context.fillText("PAUSED", gameEngine.canvas.width/2, gameEngine.canvas.height/2);
		}

		// If we're gameOver'd then write a message on the screen!
		if (this.gameOver){
			// Tint the screen
			gameEngine.context.fillStyle = "rgba(0,0,0,0.5)";
			gameEngine.context.fillRect(0, 0, gameEngine.canvas.width, gameEngine.canvas.height);

			// Write out GAME OVER!
			gameEngine.context.fillStyle = "red";
			gameEngine.context.font = "100px Chango";
			gameEngine.context.textAlign = "center";
			gameEngine.context.fillText("GAME OVER!", gameEngine.canvas.width/2, gameEngine.canvas.height/2);
		}
		else if (this.rollCredits){
			// Run through the credits slides . . .
			for (var c = 0 ; c < this.credits.length ; c++){
				if (this.credits[c].status == "new"){
					this.credits[c].status = "inprogress";
					// this.credits[c].startTime = parseInt(this.timestamp);
					this.credits[c].startTime = gameEngine.soundArray["backgroundsong"].sound.currentTime;
				}

				// If we're currently dealing with one, let's not do anything just yet . . .
				if (this.credits[c].status == "inprogress"){
					// If we're done with this then let's mark it as such
					//if (this.credits[c].duration > 0 && this.timestamp > (this.credits[c].startTime + this.credits[c].duration) ){
					if (this.credits[c].duration > 0 && gameEngine.soundArray["backgroundsong"].sound.currentTime > (this.credits[c].startTime + this.credits[c].duration) ){
						this.credits[c].status = "processed";
						break;
					}

					// If it hasn't reached opacity yet keep bringing it up
					gameEngine.context.fillStyle = this.credits[c].fontcolor;
					gameEngine.context.font = this.credits[c].fontsize + "px " + this.credits[c].font;
					gameEngine.context.textAlign = "center";

					// Break out the text 
					var text = this.credits[c].text.split("\\n");

					// Write it out!
					for (var t = 0 ; t < text.length ; t++)
						gameEngine.context.fillText(text[t], gameEngine.canvas.width/2, 200 + (t * this.credits[c].fontsize));

					// Break outta the loop so we don't keep hitting all of them before we want to
					break;
				}
			}

			// Show them the "Press ENTER or ESC to return to Main Menu" message
			if (gameEngine.soundArray["backgroundsong"].sound.ended){
				gameEngine.context.font = "15px arial";
				ctx.fillStyle = "gray";
				gameEngine.context.fillText("Press ENTER or ESC to return to Main Menu", gameEngine.canvas.width/2, gameEngine.canvas.height - 50);
			}
		}

		if (gameEngine.debugMode){
			// Just for DEBUGGING purposes
			ctx = gameEngine.context;
			ctx.font = "20px arial";
			ctx.fillStyle = "white";
			ctx.textAlign = "left";
			ctx.fillText(this.timestamp, 20, 20);
			ctx.fillText(gameEngine.soundArray["backgroundsong"].sound.currentTime, 100, 20);
		}
	},
	PauseGame : function(pauseIt){
		// If you're already in the desired pause state then don't do anything . . .
		if (this.gamePaused == pauseIt){
			return;
		}

		if (!this.gameOver){
			// PAUSE the GAME!
			this.gamePaused = pauseIt;

			if (this.gamePaused){
				// Pause the music
				gameEngine.soundArray["backgroundsong"].pause();
				// Play the Pause sound
				gameEngine.soundArray["Pause"].play();
			}
			else{
				// Resume the music
				gameEngine.soundArray["backgroundsong"].play(true);
			}
		}
	},
	CheckCollision : function(item1, item2){
		// If BOTH items are bullets, return false. We don't care if bullet's hit bullets.
		if (item1.name.indexOf("Bullet") >= 0 && item2.name.indexOf("Bullet") >= 0){
			return false;
		}
		// If ONE item is a bullet do a line-to-rectangle check. We'll need to check to make sure that based on the previous and current position of a bullet didn't "phase through" an object
		// If NEITHER is a bullet then do a rectangle-to-rectangle check. This is the standard hitbox-to-hitbox check
		else{
			return this.CheckHitboxToHitbox(item1, item2);
		}
	},
	CheckHitboxToHitbox : function(item1, item2){
		if (item1.hitboxHeight == 0 || item1.hitboxWidth == 0 || item2.hitboxHeight == 0 || item2.hitboxWidth == 0 )
			return false;

		var leftmostobject = (item1.x <= item2.x) ? item1 : item2;
		var rightmostobject = (item1.x <= item2.x) ? item2 : item1;

		// Check collision along the x-axis
		var xplane = false
		// If righmostobject's LEFT side is touching or inside leftmostobject's RIGHT side . . .
		if (rightmostobject.hitboxX <= (leftmostobject.hitboxX + leftmostobject.hitboxWidth)){
			xplane = true;
		}

		// If we're good on the x-plane then let's futher check the y-plane . . .
		if (xplane){
			var topmostobject = (item1.y <= item2.y) ? item1 : item2;
			var bottommostobject = (item1.y <= item2.y) ? item2 : item1;

			// If the topmostobject's BOTTOM is touching or inside the bottommostobject's TOP side . . .
			return ((topmostobject.hitboxY + topmostobject.hitboxHeight) >= bottommostobject.hitboxY);
		}
		else {
			return false;
		}
	},
	TriggerEvent : function(action, duration, otherData){
		var totalString = "" +
			"<event>" +
			"<timestamp>" + (gameEngine.soundArray["backgroundsong"].sound.currentTime) + "</timestamp>" +			
			"<duration>" + duration + "</duration>" +
			"<action>" + action + "</action>" +
			"<status>new</status>" +
			otherData +
			"</event>";

		this.allEvents.push( new DOMParser().parseFromString(totalString, "text/xml"));
	},
	GameOver : function(){
		this.gameOver = true;
		gameEngine.soundArray["backgroundsong"].stop();
		gameEngine.soundArray["gameoversong"].play();
	},
	GetFirstInactiveWithName : function(name){
		for (var i = 0; i < this.worldObjects.length ; i++){
			if (this.worldObjects[i] != null && 
				this.worldObjects[i].name == name && 
				this.worldObjects[i].active == false){
				return this.worldObjects[i];
			}
		}
		// If we don't find anything by the time the for-loop is finished then we'll return null
		return null;
	}
}

// Our gameEngine object
var gameEngine = {
	// The version of our game!
	version : "1.0.0.0",

	hasUserTouchedDocumentYet : false,

	// Our canvas object
	canvas : null,

	// Our current gameState (e.g., gsMenu, gsGame, etc.)
	gameState : null,

	// Our standard increment of milliseconds between "frames"
	timeslice : 20,

	// Keyboard input
	keysArray : [],
	keysArrayLocked : [],

	// TouchScreen input
	elementTouched : [],
	elementTouchedLocked : [],

	// Joystick input
	joystickSensitivity : 20,

	movementID : null,
	movementStart : {x:0, y:0},
	movementCurrent : {x:0, y:0},

	shootingID : null,
	shootingStart : {x:0, y:0},
	shootingCurrent : {x:0, y:0},

	// Asset arrays
	imagesArray : [],
	soundArray : [],

	// Volume variables
	sfxVolume : 1.0,
	musicVolume : 1.0,

	// For testing and debugging and logging
	debugMode : false,

	// Are we currently in landscape mode?
	isLandscape : true,

	// Which message in the landscapeMessage array are we using?
	curLandscapeMessageIndex : 0,

	// An array of messages to display to the User whenever they fall out of Landscape mode
	landscapeMessages : [
						"Please adjust your device so you are viewing this in landscape mode.",
						"No seriously, this game is better experienced in landscape mode.",
						"IF YOU DO NOT ADJUST YOUR DEVICE TO LANDSCAPE MODE THEN WE HAVE A PROBLEM.",
						"Look, try as you might this game will only continue in landscape mode.",
						"All right I'll level with you - I just need the screen height to be less than the screen width.",
						"LANDSCAPE MODE - DO YOU SPEAK IT?!",
						],

	// FUNCTIONS!
	Initialize : function () {
		// Generate the HTML for the page
		this.GenerateHTML();

		// Set the timeslice; the milliseconds between "frames"
		this.timeslice = 20;

		// The offscreen canvas
		this.canvas = document.createElement("canvas");
		this.canvas.width = 1200;
		this.canvas.height = 675;

		// The onscreen canvas element
		this.onscreenCanvas = document.getElementById("canvas");
		this.onscreenCanvas.width = this.canvas.width;
		this.onscreenCanvas.height = this.canvas.height;

		// NOTE: This getContext() parameter is CASE-SENSITIVE!
		this.context = this.canvas.getContext("2d");
		// Is this doing anything for ya?
		this.context.imageSmoothingEnabled = true;

		// Set up the joystick Divs
		var movementDiv = document.getElementById("movementDiv");
		movementDiv.style.height = this.onscreenCanvas.height;
		movementDiv.style.width = this.onscreenCanvas.width/2;
		movementDiv.style.left = this.onscreenCanvas.offsetLeft;

		var shootingDiv = document.getElementById("shootingDiv");
		shootingDiv.style.height = this.onscreenCanvas.height;
		shootingDiv.style.width = this.onscreenCanvas.width/2;
		shootingDiv.style.left = movementDiv.offsetLeft + movementDiv.offsetWidth;

		//Set up the faceButtons
		var startButtonDiv = document.getElementById("startButtonDiv");
		startButtonDiv.style.width = 200;
		startButtonDiv.style.top = this.onscreenCanvas.offsetTop + this.onscreenCanvas.height;
		startButtonDiv.style.left = this.onscreenCanvas.offsetLeft + this.onscreenCanvas.width/2 - startButtonDiv.offsetWidth/2;

		// Utilizing requestAnimationFrame() instead of setInterval()
		var start = null;

		function step(timestamp) {
			if (!start) 
				start = timestamp;

			var progress = timestamp - start;

			// Clear the canvas rect
			gameEngine.context.clearRect(0, 0, gameEngine.canvas.width, gameEngine.canvas.height);			

			if (!gameEngine.hasUserTouchedDocumentYet){
				ctx = gameEngine.context;
				ctx.textAlign = "center";
				ctx.fillStyle = "White";
				ctx.font = "12px Bungee";
				ctx.fillText("Press any key or touch the screen to continue . . .", (gameEngine.canvas.width/2), (gameEngine.canvas.height/2));
			}
			else{
				// Checks to see if we're in landscape mode and render appropriately
				if (gameEngine.isLandscape){
					gameEngine.gameState.Render();
					gameEngine.RenderJoystickUI();
				}
				else{
					gameEngine.RenderLandscapeMessage();
				}
			}

			// Put the offscreen canvas context data onto the onscreen canvas context
			var offscreenImage = gameEngine.canvas.getContext("2d").getImageData(0,0, gameEngine.canvas.width, gameEngine.canvas.height);
			gameEngine.onscreenCanvas.getContext("2d").putImageData(offscreenImage, 0, 0);

			window.requestAnimationFrame(step);
		}

		// Kick it off!
		window.requestAnimationFrame(step);

		// Set up the intervaled function for input and logic
		setInterval(function () {			
			if (!gameEngine.hasUserTouchedDocumentYet)
				return;

			// Checks to see if we're in landscape mode
			if (gameEngine.isLandscape){
				gameEngine.gameState.GetInput();
				gameEngine.gameState.Update();

				// Check to see if we lost Landscape mode
				if (window.innerHeight > window.innerWidth){
					gameEngine.isLandscape = false;
				}
			}
			else{
				// If we're in the game then Pause it.
				if (gameEngine.gameState.title == "game"){
					gameEngine.gameState.PauseGame(true);
				}

				// Check to see if we gained Landscape mode
				if (window.innerHeight < window.innerWidth){
					gameEngine.isLandscape = true;
					gameEngine.curLandscapeMessageIndex = Math.floor(Math.random()* gameEngine.landscapeMessages.length);
				}
			}
		}, this.timeslice);

		// Keyboard controls!
		window.addEventListener('keydown', function(e){
			gameEngine.keysArray[e.keyCode] = true;
			if (!gameEngine.hasUserTouchedDocumentYet) 
				gameEngine.hasUserTouchedDocumentYet = true;
		});
		window.addEventListener('keyup', function(e){
			gameEngine.keysArray[e.keyCode] = false;
			gameEngine.keysArrayLocked[e.keyCode] = false;
		});

		// Touchscreen controls!
		document.body.addEventListener("touchstart", function(e){
			e.preventDefault();
			if (!gameEngine.hasUserTouchedDocumentYet) 
				gameEngine.hasUserTouchedDocumentYet = true;
			gameEngine.processTouch(e);
			gameEngine.processJoystickTouch(e);
		});		
		document.body.addEventListener("touchmove", function(e){
			e.preventDefault();
			gameEngine.processTouch(e);
			gameEngine.processJoystickTouch(e);
		});
		document.body.addEventListener("touchend", function(e){
			e.preventDefault();
			gameEngine.processTouch(e);
			gameEngine.processJoystickTouch(e);
		});	
		document.body.addEventListener("touchcancel", function(e){
			e.preventDefault();
			gameEngine.processTouch(e);
			gameEngine.processJoystickTouch(e);
		});

		// Enter the initial game state
		this.EnterGameState(gsMenu);
	},
	EnterGameState : function(gs){
		// Exit out of our current gameState
		if (this.gameState != null){
			this.gameState.Exit();
		}

		// Load up our new gameState
		this.gameState = gs;

		// Initialize your game state!
		this.gameState.Initialize();
	},
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
	processTouch : function(e){
		// Reset all the elementTouched items to start with . . .
		for(var prop in this.elementTouched){
			this.elementTouched[prop] = false;
		}

		// Run through all the "touches" list to see what fingers are still there and where they are
		for(var i = 0 ; i < e.touches.length ; i++){
			// document.elementFromPoint will give us where the touchpoint is over
			var curTarget = (document.elementFromPoint(e.touches[i].clientX, e.touches[i].clientY) != null) ? document.elementFromPoint(e.touches[i].clientX, e.touches[i].clientY).id : null;

			// Is the element being touched by this current touch anything we care about?
			if (curTarget != null && 
				curTarget != "" && 
				curTarget.indexOf("canvas") < 0){
				this.elementTouched[curTarget] = true;
			}
		}

		// Run through our array that we have since filled out with what we've determined has been touched . . .
		for(var prop in this.elementTouched){
			// Adjust the locked array if necessary. If we haven't set anything as false then it's not touched.
			if (this.elementTouched[prop] == false){
				this.elementTouchedLocked[prop] = false;
			}
		}
	},
	isElementTouched : function(elementName){
		return this.elementTouched[elementName];
	},
	isElementTouchedOnce : function(elementName){
		if (this.elementTouched[elementName] && !this.elementTouchedLocked[elementName]){
			this.elementTouchedLocked[elementName] = true;
			return true;
		}
		else{
			return false;
		}
	},
	processJoystickTouch : function(e){
		switch(e.type){
			case "touchstart":
				// Grab the first finger that's touching this element
				if (e.target.id == "movementDiv"){
					this.movementID = e.changedTouches[0].identifier;
					this.movementStart.x = e.changedTouches[0].pageX;
					this.movementStart.y = e.changedTouches[0].pageY;
					this.movementCurrent.x = e.changedTouches[0].pageX;
					this.movementCurrent.y = e.changedTouches[0].pageY;
				}
				else if (e.target.id == "shootingDiv"){
					this.shootingID = e.changedTouches[0].identifier;
					this.shootingStart.x = e.changedTouches[0].pageX;
					this.shootingStart.y = e.changedTouches[0].pageY;
					this.shootingCurrent.x = e.changedTouches[0].pageX;
					this.shootingCurrent.y = e.changedTouches[0].pageY;
				}
				break;
			case "touchmove":
				// Run through the changedTouches list and find the touch object that matches the stored movementId and grab its X-Y values
				for (var i = 0 ; i < e.changedTouches.length; i++){
					if (e.changedTouches[i].identifier == (e.target.id == "movementDiv" ? this.movementID : this.shootingID)){
						if (e.target.id == "movementDiv"){
							this.movementCurrent.x = e.changedTouches[i].pageX;
							this.movementCurrent.y = e.changedTouches[i].pageY;
						}
						else if (e.target.id == "shootingDiv"){
							this.shootingCurrent.x = e.changedTouches[i].pageX;
							this.shootingCurrent.y = e.changedTouches[i].pageY;
						}

						break;
					}
				}
				break;
			case "touchend":
			case "touchcancel":
				if (e.target.id == "movementDiv"){
					this.movementID = null;
					this.movementStart.x = 0;
					this.movementStart.y = 0;
					this.movementCurrent.x = 0;
					this.movementCurrent.y = 0;
				}
				else if (e.target.id == "shootingDiv"){
					this.shootingID = null
					this.shootingStart.x = 0;
					this.shootingStart.y = 0;
					this.shootingCurrent.x = 0;
					this.shootingCurrent.y = 0;
				}
				break;
		}
	},
	isJoystickMoved : function(elem, direction){
		// Make sure we passed in a legitimate element to check against
		if (elem.indexOf("movement") == -1 && elem.indexOf("shooting") == -1){
			direction = "";
		}

		switch (direction.toLowerCase()){
			case "up":
				if (elem == "movementDiv"){
					return this.movementID != null && (this.movementStart.y > this.movementCurrent.y) && (this.movementStart.y - this.movementCurrent.y) > this.joystickSensitivity;
				}
				else if (elem == "shootingDiv"){
					return this.shootingID != null && (this.shootingStart.y > this.shootingCurrent.y) && (this.shootingStart.y - this.shootingCurrent.y) > this.joystickSensitivity;
				}
				break;
			case "left":
				if (elem == "movementDiv"){
					return this.movementID != null && (this.movementStart.x > this.movementCurrent.x) && (this.movementStart.x - this.movementCurrent.x) > this.joystickSensitivity;
				}
				else if (elem == "shootingDiv"){
					return this.shootingID != null && (this.shootingStart.x > this.shootingCurrent.x) && (this.shootingStart.x - this.shootingCurrent.x) > this.joystickSensitivity;
				}
				break;
			case "down":
				if (elem == "movementDiv"){
					return this.movementID != null && (this.movementStart.y < this.movementCurrent.y) && (this.movementCurrent.y - this.movementStart.y) > this.joystickSensitivity;
				}
				else if (elem == "shootingDiv"){
					return this.shootingID != null && (this.shootingStart.y < this.shootingCurrent.y) && (this.shootingCurrent.y - this.shootingStart.y) > this.joystickSensitivity;
				}
				break;
			case "right":
				if (elem == "movementDiv"){
					return this.movementID != null && (this.movementStart.x < this.movementCurrent.x) && (this.movementCurrent.x - this.movementStart.x) > this.joystickSensitivity;
				}
				else if (elem == "shootingDiv"){
					return this.shootingID != null && (this.shootingStart.x < this.shootingCurrent.x) && (this.shootingCurrent.x - this.shootingStart.x) > this.joystickSensitivity;
				}
				break;
			default:
				Log("Could not determine the direction [" + direction + "] in the element [" + elem + "].");
				return false;
				break;
		}
	},
	loadItems : function(items){
		var worldObjects = [];

		// Let's roll through all of them!
		for (var i = 0 ; i < items.length ; i++){
			// Set up this worldItem's info and push it into the worldObjects array.
			var name = this.GetEventTagValue(items[i], "name");
			var filename = this.GetEventTagValue(items[i], "spritesheet");
			var maxHealth = parseInt(this.GetEventTagValue(items[i], "maxHealth"));
			var health = parseInt(this.GetEventTagValue(items[i], "health"));
			var baseDamage = this.GetEventTagValue(items[i], "basedmg");
			var x = parseInt(this.GetEventTagValue(items[i], "x"));
			var y = parseInt(this.GetEventTagValue(items[i], "y"));
			var active = this.GetEventTagValue(items[i], "active") == "true";
			var rateOfFire = parseFloat(this.GetEventTagValue(items[i], "rateoffire"));
			var movementSpeed = parseFloat(this.GetEventTagValue(items[i], "movementSpeed"));
			var maxLifespan = parseInt(this.GetEventTagValue(items[i], "maxLifespan"));
			var lifespan = parseInt(this.GetEventTagValue(items[i], "lifespan"));
			var reachedPeak = this.GetEventTagValue(items[i], "reachedPeak");
			var minY = parseInt(this.GetEventTagValue(items[i], "minY"));
			var maxY = parseInt(this.GetEventTagValue(items[i], "maxY"));
			var ai = this.GetEventTagValue(items[i], "ai");
			var collisionlogic = this.GetEventTagValue(items[i], "collided");

			// Based on the "numCopies" attribute of this worldItem push this worldItem into the worldObjects array that many times.
			var numCopies = items[i].getAttribute("numCopies");

			if (numCopies == null)
				numCopies = 1;

			// Now that this worldItem is ALL finally set up let's pop it into the worldObjects array
			for (var copy = 0 ; copy < numCopies ; copy++){
				// Set the properties of this item
				var tempWorldItem = new worldItem();
				tempWorldItem.name = name;
				tempWorldItem.maxHealth = maxHealth;
				tempWorldItem.health = health;
				if (!isNaN(baseDamage))
					tempWorldItem.baseDamage = baseDamage;
				tempWorldItem.x = x;
				tempWorldItem.y = y;
				tempWorldItem.movementSpeed = movementSpeed;
				if (!isNaN(maxLifespan))
					tempWorldItem.maxLifespan = maxLifespan;
				if (!isNaN(lifespan))
					tempWorldItem.lifespan = lifespan;
				tempWorldItem.active = active;
				tempWorldItem.oldX = x;
				tempWorldItem.oldY = y;
				if (!isNaN(rateOfFire))
					tempWorldItem.rateOfFire = rateOfFire;
				tempWorldItem.speedX = 0;
				tempWorldItem.speedY = 0;
				tempWorldItem.lastTimeBulletFired = 0;
				if (reachedPeak != null)
					tempWorldItem.reachedPeak = reachedPeak;
				if (!isNaN(minY))
					tempWorldItem.minY = minY;
				if (!isNaN(maxY))
					tempWorldItem.maxY = maxY;
				if (ai != null)
					tempWorldItem.AI = ai;
				if (collisionlogic != null)
					tempWorldItem.CollisionLogic = collisionlogic;

				// Create the "states" array
				tempWorldItem.states = [];

				// Image properties
				tempWorldItem.image = this.AddImageToImageArray(filename);

				// Set up the states and its frames
				var states = items[i].getElementsByTagName("state");

				for (var j = 0 ; j < states.length ; j++){
					var statename = this.GetEventTagValue(states[j], "name");
					var stateFrames = states[j].getElementsByTagName("frame");
					var tempFrames = [];

					for (var k = 0 ; k < stateFrames.length ; k++){
						var tempFrame = new stateFrame();

						// Get the data of these blocks
						var duration = this.GetEventTagValue(stateFrames[k], "duration");
						var anchorData = stateFrames[k].getElementsByTagName("anchorpoint")[0];
						var animationData = stateFrames[k].getElementsByTagName("animation")[0];
						var hitboxData = stateFrames[k].getElementsByTagName("hitbox")[0];
						var bulletOriginData = stateFrames[k].getElementsByTagName("bulletorigin");
						var executeOnFinish = this.GetEventTagValue(stateFrames[k], "executeonfinish");

						// Duration of this frame
						tempFrame.duration = parseFloat(duration);

						// Anchorpoint data
						tempFrame.anchor.x = parseInt(this.GetEventTagValue(anchorData, "x"));
						tempFrame.anchor.y = parseInt(this.GetEventTagValue(anchorData, "y"));

						// Animation data
						tempFrame.animation.x = parseInt(this.GetEventTagValue(animationData, "x"));
						tempFrame.animation.y = parseInt(this.GetEventTagValue(animationData, "y"));
						tempFrame.animation.height = parseInt(this.GetEventTagValue(animationData, "height"));
						tempFrame.animation.width = parseInt(this.GetEventTagValue(animationData, "width"));

						// Hitbox data
						tempFrame.hitbox.x = parseInt(this.GetEventTagValue(hitboxData, "x"));
						tempFrame.hitbox.y = parseInt(this.GetEventTagValue(hitboxData, "y"));
						tempFrame.hitbox.height = parseInt(this.GetEventTagValue(hitboxData, "height"));
						tempFrame.hitbox.width = parseInt(this.GetEventTagValue(hitboxData, "width"));

						// Do we have it?
						if (bulletOriginData != null && bulletOriginData.length > 0){
							tempFrame.bulletOrigin.x = parseInt(this.GetEventTagValue(bulletOriginData[0], "x"));
							tempFrame.bulletOrigin.y = parseInt(this.GetEventTagValue(bulletOriginData[0], "y"));
						}							
						if (executeOnFinish != null && executeOnFinish.length > 0){
							tempFrame.executeOnFinish = executeOnFinish;
						}

						// Giant Enemy Robot specific stuff
						if (name.indexOf("enemyVehicleYellow") != -1){
							var headpos = stateFrames[k].getElementsByTagName("headpos")[0];
							if (typeof(headpos) != "undefined" && headpos != null){
								tempFrame.headpos = { 
									x: parseInt(this.GetEventTagValue(headpos, "x")),
									y: parseInt(this.GetEventTagValue(headpos, "y"))
								}
							}

							var leftarmpos = stateFrames[k].getElementsByTagName("leftarmpos")[0];
							if (typeof(leftarmpos) != "undefined" && leftarmpos != null){
								tempFrame.leftarmpos = { 
									x: parseInt(this.GetEventTagValue(leftarmpos, "x")),
									y: parseInt(this.GetEventTagValue(leftarmpos, "y"))
								}
							}

							var rightarmpos = stateFrames[k].getElementsByTagName("rightarmpos")[0];
							if (typeof(rightarmpos) != "undefined" && rightarmpos != null){
								tempFrame.rightarmpos = { 
									x: parseInt(this.GetEventTagValue(rightarmpos, "x")),
									y: parseInt(this.GetEventTagValue(rightarmpos, "y"))
								}
							}

							var hippos = stateFrames[k].getElementsByTagName("hippos")[0];
							if (typeof(hippos) != "undefined" && hippos != null){
								tempFrame.hippos = { 
									x: parseInt(this.GetEventTagValue(hippos, "x")),
									y: parseInt(this.GetEventTagValue(hippos, "y"))
								}
							}
						}

						// Now that this particular frame is set up, let's push it into the tempFrames array
						tempFrames.push(tempFrame);
					}

					// Now that we've got all of our pertinent data for THIS particular state, let's assemble it . . 
					var tempState = new itemState();
					tempState.name = statename;
					tempState.frames = tempFrames;
					// . . . and save it to the states object. So now the "states" property of this worldItem object has a property named whatever the value of "statename" is.
					tempWorldItem.states[tempState.name] = tempState;
				}

				// Now that we're all done with this object, let's push it into the worldObjects array!
				worldObjects.push(tempWorldItem);
			}
		}

		return worldObjects;
	},
	loadSounds : function(sounds){
		for (var i = 0 ; i < sounds.length ; i++){
			var keyname = this.GetEventTagValue(sounds[i], "keyname");
			var filename = this.GetEventTagValue(sounds[i], "filename");
			var type = this.GetEventTagValue(sounds[i], "type");

			this.soundArray[keyname] = new sound(filename, type);
		}

		// Set the volumes		
		this.SetVolume("music", this.musicVolume);	
		this.SetVolume("sfx", this.sfxVolume);
	},
	loadBackgroundTiles : function(tiles){
		var backgroundTiles = [];

		for (var i = 0 ; i < tiles.length ; i++){
			// The filename of this backgroundTile (e.g., "Background_CitySkyline.png", etc.)
			var filename = gameEngine.GetEventTagValue(tiles[i], "filename") == null ? "" : gameEngine.GetEventTagValue(tiles[i], "filename");

			// Is this particular tile a startingBackground?
			var isStartingBackground = tiles[i].getAttribute("isStartingBackground") == null ? false : tiles[i].getAttribute("isStartingBackground");

			// If this is one we should setup
			if (isStartingBackground){
				// The Z-Plane of this backgroundTile
				var zplane = gameEngine.GetEventTagValue(tiles[i], "zplane");
				for (var j = 0 ; j < 2 ; j++){
					backgroundTiles.push(new backgroundTile(filename, parseInt(j * gameEngine.canvas.width), 0, parseInt(zplane), 0, 0));
				}
			}
		}

		return backgroundTiles;
	},
	SetVolume : function(type, percentage){
		// Max out the limits
		if (percentage > 1.0)
			percentage = 1.0;
		else if (percentage < 0)
			percentage = 0;

		if (type == "sfx"){
			this.sfxVolume = percentage;
		}
		else{
			this.musicVolume = percentage;
		}

		// Run through all the sounds and set their volume
		for (var i = 0 ; i < Object.keys(gameEngine.soundArray).length ; i++){
			if (gameEngine.soundArray[Object.keys(gameEngine.soundArray)[i]].type == type){
				gameEngine.soundArray[Object.keys(gameEngine.soundArray)[i]].setVolume(percentage);
			}
		}
	},
	GetEventTagValue : function(eventItem, tagName){
		if (eventItem.getElementsByTagName(tagName).length > 0 && eventItem.getElementsByTagName(tagName)[0].childNodes.length > 0){
			return eventItem.getElementsByTagName(tagName)[0].childNodes[0].nodeValue;
		}
		else{
			return null;
		}
	},
	SetEventTagValue : function(eventItem, tagName, newValue){
		eventItem.getElementsByTagName(tagName)[0].childNodes[0].nodeValue = newValue;
	},
	AddImageToImageArray : function(filename){
		// If this filename already exists in the imagesArray then just reference the existing one . . .
		for (var j = 0 ; j < this.imagesArray.length ; j ++){
			// Let's see if we already have this file in our imagesArray. If we do we'll just reference it instead of loading up a new one.
			var curFilename = this.imagesArray[j].src.substring(this.imagesArray[j].src.lastIndexOf("/") + 1, this.imagesArray[j].src.length);

			if (curFilename == filename){
				return this.imagesArray[j];
			}
		}

		// If at this point it hasn't been set then we don't have it in the imagesArray
		this.imagesArray.push(new Image());
		this.imagesArray[this.imagesArray.length - 1].src = filename;

		return this.imagesArray[this.imagesArray.length - 1];
	},
	ReadXMLFile : function(filename){
		var xmlhttp = new XMLHttpRequest();
		var parser = new DOMParser();

		if (xmlhttp.overrideMimeType){
			xmlhttp.overrideMimeType("text/xml");
		}
		xmlhttp.open("GET", filename, false);
		xmlhttp.send();

		return parser.parseFromString(xmlhttp.response,"text/xml");
	},
	RenderJoystickUI : function(){
		// The following block will be replaced by the gameStates' Render()
		if (this.movementID != null){
			// Draw the outer MOVEMENT circle
			this.context.beginPath();
			this.context.arc(this.movementStart.x - this.canvas.offsetLeft, this.movementStart.y - this.canvas.offsetTop, 50, 0, 2 * Math.PI);
			this.context.lineWidth = 5;
			this.context.strokeStyle = "white";
			this.context.stroke();

			// Draw the inner MOVMENT circle				
			this.context.beginPath();
			this.context.arc(this.movementCurrent.x - this.canvas.offsetLeft, this.movementCurrent.y - this.canvas.offsetTop, 10, 0, 2 * Math.PI);
			this.context.lineWidth = 5;
			this.context.strokeStyle = "white";
			this.context.stroke();
		}
		if (this.shootingID != null){
			// Draw the outer MOVEMENT circle
			this.context.beginPath();
			this.context.arc(this.shootingStart.x - this.canvas.offsetLeft, this.shootingStart.y - this.canvas.offsetTop, 50, 0, 2 * Math.PI);
			this.context.lineWidth = 5;
			this.context.strokeStyle = "red";
			this.context.stroke();

			// Draw the inner MOVMENT circle				
			this.context.beginPath();
			this.context.arc(this.shootingCurrent.x - this.canvas.offsetLeft, this.shootingCurrent.y - this.canvas.offsetTop, 10, 0, 2 * Math.PI);
			this.context.lineWidth = 5;
			this.context.strokeStyle = "red";
			this.context.stroke();
		}
	},
	RenderLandscapeMessage : function(){
		ctx = gameEngine.context;
		ctx.textAlign = "center";
		ctx.fillStyle = "White";
		ctx.font = "12px Bungee";

		ctx.fillText(this.landscapeMessages[this.curLandscapeMessageIndex], (gameEngine.canvas.width/2), (gameEngine.canvas.height/2));
	},
	GetCurrentTime : function(){
		return gameEngine.soundArray["backgroundsong"].sound.currentTime;
	},
	GenerateHTML : function(){
		/*
		<script src="RODENT.min.js"></script>
<html>
	<head>
		<meta name ='viewport' content='width=device-width, width=device-height, initial-scale=0.4'>

		<link href='https://fonts.googleapis.com/css?family=Do+Hyeon' rel='stylesheet'>
		<link href='https://fonts.googleapis.com/css?family=Titillium+Web' rel='stylesheet'>
		<link href='https://fonts.googleapis.com/css?family=Chango' rel='stylesheet'>
		<link href='https://fonts.googleapis.com/css?family=Carter+One' rel='stylesheet'>
		<link href='https://fonts.googleapis.com/css?family=Bungee' rel='stylesheet'>

		<style>
			body{
				background-color:black;

				text-align:center;
				vertical-align:middle;

				margin:0px;
				padding:0px;

				font-family: 'Do Hyeon', sans-serif;
				font-family: 'Titillium Web', sans-serif;
				font-family: 'Chango', cursive;
				font-family: 'Carter One', cursive;
				font-family: 'Bungee', cursive;
			}

			canvas{
				background-color:#ffffff00;
				
				margin-left:auto;
				margin-right:auto;
				left:0;
				right:0;
				position: absolute;

				touch-action:none;
			}

			.joystick{
				background-color:#ffffff00;

				top:0px;
				left:0px;
				position:absolute;

				touch-action:none;
			}

			.menuOption{
				background-color:#ffffff00;

				margin-left:auto;
				margin-right:auto;
				left:0;
				right:0;
				position:absolute;

				color:white;

				touch-action:none;
			}

			.faceButton{
				background-color:gray;

				margin-left:auto;
				margin-right:auto;
				margin-top:10px;				
				position:absolute;

				vertical-align:middle;
				line-height:50px;
				font-size:25px;
				font-family:"Bungee";

				border-radius:10px;

				touch-action:none;
			}
		</style>
	</head>
	<body onload="gameEngine.Initialize()">
		<canvas id="canvas">Your browser does not support canvas elements.</canvas>
		<div id="movementDiv" class="joystick"></div>
		<div id="shootingDiv" class="joystick"></div>
		<div id="startButtonDiv" class="faceButton">Start</div>
	</body>
</html>
		*/
	}
}

// Our general GLOBAL LOGGING function
function Log(message){
	if(gameEngine.debugMode)
		console.log(message);
}

//////////////////////
//	gsGame STUFF	//
//////////////////////

// Our constructor for backgroundTiles
function backgroundTile(imageFilename, posX, posY, posZ, speedX, speedY){
	this.image = gameEngine.AddImageToImageArray(imageFilename);
	this.x = posX;
	this.y = posY;
	this.z = posZ;
	this.speedX = speedX;
	this.speedY = 0;
	this.needsReset = false;

	this.update = function(){
		// Add the speed to the x-position
		if (gsGame.speedfactor != 1){
			this.x += Math.ceil(this.speedX * gsGame.speedfactor);
			this.y += Math.ceil(this.speedY * gsGame.speedfactor);
		}
		else{
			this.x += Math.ceil(this.speedX);
			this.y += Math.ceil(this.speedY);
		}

		// If the edge of my width is less-than or equal to zero then I'm offscreen and need a reset
		if ((this.x + gameEngine.canvas.width) <= 0){
			this.needsReset = true;
		}
	}

	this.render = function(){
		if (gsGame.cameraShakeFrequency > 0){
			gameEngine.context.drawImage(this.image, (gsGame.timestamp%gsGame.cameraShakeFrequency) ? this.x - 10 : this.x, (gsGame.timestamp%gsGame.cameraShakeFrequency) ? this.y - 10: this.y, gameEngine.canvas.width, gameEngine.canvas.height);
		}
		else{
			gameEngine.context.drawImage(this.image, this.x, this.y, gameEngine.canvas.width, gameEngine.canvas.height);
		}
	}

	this.unload = function(){
		this.image = null;
	}
}

//////////////////
//	WORLD ITEMS	//
//////////////////
// Our constructor for worldItems
function worldItem(){
	// An array of itemState objects inside of it.
	this.states = null;

	// Our current state (e.g., "idle", "shoot_up", etc.)
	this.curState = "idle";

	// The current frame of whatever state we're in. We always start it off at zero whenever we enter a new frame
	this.curFrame = 0;

	// The timer we keep to determine how far into the frame we're in. It's in milliseconds
	this.frameTimer = 0;

	// The speed at which we can move.
	this.movementSpeed = 0;

	// The update function
	this.update = function(){

		// Player Respawn logic
		if (this.name == "player" && gsGame.playerIsRespawning){
			console.log("sadasda");
			if (gameEngine.GetCurrentTime() - gsGame.playerRespawnTimer > gsGame.maxPlayerRespawnTimer)
				gsGame.playerIsRespawning = false;
		}

		/////////
		// AI! //
		/////////
		if (typeof(this.AI) != "undefined" && this.AI != null)
			eval(this.AI);

		// Are we done with this current animation frame?
		if ((gameEngine.soundArray["backgroundsong"].sound.currentTime - this.frameTimer) >= this.states[this.curState].frames[this.curFrame].duration){

			// Does this frame have anything we need to do?
			if (this.states[this.curState].frames[this.curFrame].executeOnFinish != null){
				eval(this.states[this.curState].frames[this.curFrame].executeOnFinish);
			}

			// Set the new "starting point" for the frameTimer
			this.frameTimer = gameEngine.soundArray["backgroundsong"].sound.currentTime;

			// . . . move onto the next frame
			this.curFrame++;

			// If need be . . . let's reset to 0 so we're "looping" the animation
			if (this.curFrame >= this.states[this.curState].frames.length){
				this.curFrame = 0;

				// If this thing dying then we'll deactivate it now that it's done with its "dying" animation
				if (this.curState == "dying"){
					this.active = false;
					return;
				}
			}
		}

		// Record the previous position
		this.oldX = this.x;
		this.oldY = this.y;

		// If the speedfactor is not just the usual 1, then let's figure how much we need to modify this object's speed by
		if (gsGame.speedfactor != 1){
			this.x += (this.speedX * gsGame.speedfactor);
			this.y += (this.speedY * gsGame.speedfactor);
		}
		else{
			// Update the position with the speed
			this.x += this.speedX;
			this.y += this.speedY;
		}

		// If it's off screen (by 100 pixels) then it's inactive . . . for bullets, missiles and barrels and things whose health is 0 or are "dying"
		if (	(this.name.toLowerCase().indexOf("bullet") > -1 || 
				this.name.toLowerCase().indexOf("barrel") > -1 || 
				this.name.toLowerCase().indexOf("missile") > -1 || 
				this.name.toLowerCase().indexOf("barricade") > -1 || 
				this.name.toLowerCase().indexOf("building") > -1 || 
				this.health <= 0 || 
				this.curState == "dying" || 
				this.curState == "empty" ) && 
			(this.x >= gameEngine.canvas.width + 100 || this.x <= - 100 || this.y <= -100 || this.y >= gameEngine.canvas.height + 100)){
			this.active = false;
			return;
		}

		// Transition objects need a bit more of a buffer . . . 
		if (this.name.indexOf("tunnel") > -1){
			if (this.x <= -100){
				this.active = false;
				return;
			}
		}

		// Caluclate frame data for animation/hitbox/bulletOrigin purposes
		this.calculateFrameData();
	}
	// The render function
	this.render = function(){
		// If you got hit, we'll crank up the brightness before we draw the image
		if (this.gotHit){
			// TODO: Currently disabling this as it's causing a massive slowdown in both Chrome AND FireFox
			//gameEngine.context.filter = "brightness(1000%)";
		}

		// Draw the current frame of this worldItem's current state
		if (this.animationWidth != 0 && this.animationHeight != 0){
			if (gsGame.playerIsRespawning && this.name == "player"){
				if (gsGame.drawPlayerRespawnFrame){
					gameEngine.context.drawImage(this.image, this.animationX, this.animationY, this.animationWidth, this.animationHeight, (this.x - (this.anchorpointX - this.animationX)), (this.y - (this.anchorpointY - this.animationY)), this.animationWidth, this.animationHeight);
				}

				// Toggle the drawPlayerRespawnFrame variable
				gsGame.drawPlayerRespawnFrame = !gsGame.drawPlayerRespawnFrame;
			}
			else{
				gameEngine.context.drawImage(this.image, this.animationX, this.animationY, this.animationWidth, this.animationHeight, (this.x - (this.anchorpointX - this.animationX)), (this.y - (this.anchorpointY - this.animationY)), this.animationWidth, this.animationHeight);
			}
		}

		// Now that we've drawn it with that flash, let's reset it
		if (this.gotHit){
			// TODO: Currently disabling this as it's causing a massive slowdown in both Chrome AND FireFox
			//gameEngine.context.filter = "brightness(100%)";
			this.gotHit = false;
		}

		// Draw the hitbox info
		if (false){
			gameEngine.context.fillStyle = "red";
			gameEngine.context.strokeRect(this.hitboxX, this.hitboxY, this.hitboxWidth, this.hitboxHeight);
		}
	}
	// Our function to handle changes of state
	this.changeState = function(nameOfState){
		// Don't bother doing anything if we already are the state that we're trying to change to.
		if (this.curState == nameOfState)
			return;

		// If we don't have the a state by the name of whatever is coming in then we'll default to "idle"
		if (typeof(this.states[nameOfState]) == 'undefined'){
			Log(this.timestamp + " - No state by the name of " + nameOfState + " for item with the name of " + this.name);
			return;
		}

		// If you're leaving . . .
		if (this.active && (this.curState.indexOf("leaving") != -1)){
			// . . . the only thing you can changeState to is "dying"
			if (nameOfState != "dying"){
				// You're not allowed to change state while "leaving" unless it's to change to "dying"!
				Log(gsGame.timestamp + " - " + this.name + " cannot change the state to '" + nameOfState + "' while currently '" + this.curState + "'!");
				return;
			}
		}

		// If you're currently "dying" or are already "dead"
		if (this.name != "player" && this.active && (this.curState.indexOf("dying") != -1 || this.curState.indexOf("dead") != -1)){
			// If you're one of the giant robot pieces . . .
			if (this.name.indexOf("enemyVehicle") != -1 || this.name.indexOf("Gorilla") != -1){
				// . . . the only state you can change to while "dying" or "dead" is "robot_leave"
				if (nameOfState != "robot_leave" && nameOfState != "robot_dead"){
					Log(gsGame.timestamp + " - " + this.name + " cannot change the state to '" + nameOfState + "' while currently '" + this.curState + "'!");
					return;
				}
			}
			else{
				// You're not allowed to change state while "dying" or are "dead"!
				Log(gsGame.timestamp + " - " + this.name + " cannot change the state to '" + nameOfState + "' while currently '" + this.curState + "'!");
				return;
			}
		}

		// Otherwise set the curState variable and reset both the frameTimer and curFrame to zero
		this.curState = nameOfState;
		this.curFrame = 0;
		this.frameTimer = gameEngine.soundArray["backgroundsong"].sound.currentTime;

		// Initialize the frame calculations here
		this.calculateFrameData();
	}
	this.calculateFrameData = function(){
		// This is the anchor point in this picture for this frame
		this.anchorpointX = this.states[this.curState].frames[this.curFrame].anchor.x;
		this.anchorpointY = this.states[this.curState].frames[this.curFrame].anchor.y;

		// Update the animation information - this will let us know that coordinates and dimensions of which to crop from our image
		this.animationX = this.states[this.curState].frames[this.curFrame].animation.x;
		this.animationY = this.states[this.curState].frames[this.curFrame].animation.y;
		this.animationWidth = this.states[this.curState].frames[this.curFrame].animation.width;
		this.animationHeight = this.states[this.curState].frames[this.curFrame].animation.height;

		// Update the hitbox information - it's the position of this worldItem offset by the x/y of the hitbox data plus the width and height
		this.hitboxX = this.x - (this.anchorpointX - this.states[this.curState].frames[this.curFrame].hitbox.x);
		this.hitboxY = this.y - (this.anchorpointY - this.states[this.curState].frames[this.curFrame].hitbox.y);
		this.hitboxWidth = this.states[this.curState].frames[this.curFrame].hitbox.width;
		this.hitboxHeight = this.states[this.curState].frames[this.curFrame].hitbox.height;

		// Get the bullet origin point - not EVERY worldItem will have this . . .
		this.bulletOriginX = this.x - (this.anchorpointX - this.states[this.curState].frames[this.curFrame].bulletOrigin.x);
		this.bulletOriginY = this.y - (this.anchorpointY - this.states[this.curState].frames[this.curFrame].bulletOrigin.y);
		
		// Giant Enemy Robot specific stuff
		if (this.name.indexOf("Yellow") != -1){
			// Head position
			if (typeof(this.states[this.curState].frames[this.curFrame].headpos) != "undefined"){
				this.headposX = this.x - (this.anchorpointX - this.states[this.curState].frames[this.curFrame].headpos.x)
				this.headposY = this.y - (this.anchorpointY - this.states[this.curState].frames[this.curFrame].headpos.y);
			}
			// Left Arm position
			if (typeof(this.states[this.curState].frames[this.curFrame].leftarmpos) != "undefined"){
				this.leftarmposX = this.x - (this.anchorpointX - this.states[this.curState].frames[this.curFrame].leftarmpos.x)
				this.leftarmposY = this.y - (this.anchorpointY - this.states[this.curState].frames[this.curFrame].leftarmpos.y);
			}
			// Right Arm position
			if (typeof(this.states[this.curState].frames[this.curFrame].rightarmpos) != "undefined"){
				this.rightarmposX = this.x - (this.anchorpointX - this.states[this.curState].frames[this.curFrame].rightarmpos.x)
				this.rightarmposY = this.y - (this.anchorpointY - this.states[this.curState].frames[this.curFrame].rightarmpos.y);
			}
			// Hip position
			if (typeof(this.states[this.curState].frames[this.curFrame].hippos) != "undefined"){
				this.hipposX = this.x - (this.anchorpointX - this.states[this.curState].frames[this.curFrame].hippos.x)
				this.hipposY = this.y - (this.anchorpointY - this.states[this.curState].frames[this.curFrame].hippos.y);
			}
		}
	}
	// What to do when you've collided with something
	this.collided = function(idOfItemCollidedWith){
		eval(this.CollisionLogic);

		// Did health change?
		if (this.health <= 0){

			this.health = 0;

			// enemyVehicle (and enemyGorilla) specific
			if (this.curState.indexOf("robot") != -1){
				this.changeState("robot_dying");
			}
			else{
				Log(this.name + " is dying!");
				this.changeState("dying");
			}
		}
	}
	// Moves this item to the provided coordinates and executes a callback function after reaching that destination
	this.moveToCoordinate = function(targetPosX, targetPosY, speed, proximityMargin, funcCallback){
		// Reset the speed
		this.speedX = 0;
		this.speedY = 0;

		// Local variables to determine whether or not we've hit our target
		xPosGood = false;
		yPosGood = false;

		// Are we to the LEFT of the target pos AND our distance from it is greater than the proximityMargin? Then let's try to move closer!
		if (this.x < targetPosX && (targetPosX - this.x > proximityMargin)){
			//this.speedX = (this.x + this.movementSpeed > targetPosX) ? 1 : this.movementSpeed;
			this.speedX = (this.x + speed > targetPosX) ? 1 : speed;
		}
		// Are we to the RIGHT of the target pos AND our distance from it is greater than the proximityMargin? Then let's try to move closer!
		else if (this.x > targetPosX && (this.x - targetPosX > proximityMargin)){
			//this.speedX = (this.x - this.movementSpeed < targetPosX) ? -1 : -this.movementSpeed;
			this.speedX = (this.x - speed < targetPosX) ? -1 : -speed;
		}
		else{
			xPosGood = true;
		}

		// Are we to the ABOVE the target pos AND our distance from it is greater than the proximityMargin? Then let's try to move closer!
		if (this.y < targetPosY && (targetPosY - this.y > proximityMargin)){
			//this.speedY = (this.y + this.movementSpeed > targetPosY) ? 1 : this.movementSpeed;
			this.speedY = (this.y + speed > targetPosY) ? 1 : speed;
		}
		// Are we to the BELOW the target pos AND our distance from it is greater than the proximityMargin? Then let's try to move closer!
		else if (this.y > targetPosY && (this.y - targetPosY > proximityMargin)){
			//this.speedY = (this.y - this.movementSpeed < targetPosX) ? -1 : -this.movementSpeed;
			this.speedY = (this.y - speed < targetPosY) ? -1 : -speed;
		}
		else{
			yPosGood = true;
		}
		
		// If we've hit our target coordinateAND we have a callback function defined then let's perform it!
		if (funcCallback != null && xPosGood && yPosGood){
			funcCallback();
		}
	}
	// A function that shoots for us?
	this.Shoot = function(direction, originX, originY, speedX, speedY){
		var nextAvailableFireTime = this.lastTimeBulletFired + (gsGame.speedfactor != 1 ? (this.rateOfFire * gsGame.speedfactor): this.rateOfFire);

		// If we've reached the time when we can fire another bullet . . . 
		if (gameEngine.soundArray["backgroundsong"].sound.currentTime >= nextAvailableFireTime){

			// Get the an unused bullet of this type (e.g., playerBullet, enemyBomberBullet, etc.)
			var ourBullet = gsGame.GetFirstInactiveWithName((this.name == "mouse" || this.name == "rabbit") ? "playerBullet" : this.name + "Bullet");

			if (typeof(ourBullet) != "undefined" && ourBullet != null){
				// Now that it's brought back from the dead we'll reset the speed properties
				ourBullet.speedX = 0;
				ourBullet.speedY = 0;

				// Re/set the state to "idle"
				ourBullet.changeState("idle");

				// Start it off at the bullet origin of the current frame
				ourBullet.x = originX;
				ourBullet.y = originY;

				// Mark down when this bullet was fired
				this.lastTimeBulletFired = gameEngine.soundArray["backgroundsong"].sound.currentTime;

				// Determine the direction of this bullet
				switch(direction){
					case "shoot_right":
						ourBullet.speedX = ourBullet.movementSpeed;
						break;
					case "shoot_upright":
						ourBullet.speedX = ourBullet.movementSpeed / 2;
						ourBullet.speedY = -ourBullet.movementSpeed / 2;
						break;
					case "shoot_up":
						ourBullet.speedY = -ourBullet.movementSpeed;
						break;
					case "shoot_upleft":
						ourBullet.speedX = -ourBullet.movementSpeed / 2;
						ourBullet.speedY = -ourBullet.movementSpeed / 2;
						break;
					case "shoot_left":
						ourBullet.speedX = -ourBullet.movementSpeed;
						break;
					case "shoot_downleft":
						ourBullet.speedX = -ourBullet.movementSpeed / 2;
						ourBullet.speedY = ourBullet.movementSpeed / 2;
						break;
					case "shoot_down":
						ourBullet.speedY = ourBullet.movementSpeed;
						break;
					case "shoot_downright":
						ourBullet.speedX = ourBullet.movementSpeed / 2;
						ourBullet.speedY = ourBullet.movementSpeed / 2;
						break;
					default:
						Log("Could not determine the direction of " + direction + " while attempting to Shoot() for " + this.name);
						break;
				}

				// Reset the health
				ourBullet.health = ourBullet.maxHealth;

				// Finally set this ONE worldObject to TRUE so it can be updated and rendered
				ourBullet.active = true;

				if (this.name == "player"){
					// Play the PlayerBulletFire.wav
					gameEngine.soundArray["PlayerBulletFire"].play();
				}
			}
			else{
				Log(gsGame.timestamp + " - Could not find an object with the name " + (	(this.name == "mouse" || this.name == "rabbit") ? "playerBullet" : this.name + "Bullet") + " to Shoot().");
			}
		}
	}
	this.LaunchMissiles = function(numToLaunch){
		for (var numMissiles = 0 ; numMissiles < numToLaunch ; numMissiles++){
			// Find available items
			var reticle = gsGame.GetFirstInactiveWithName("enemyReticle");
			var missile = gsGame.GetFirstInactiveWithName("enemyMissile");

			// Make sure we found some . . .
			if (missile == null || reticle == null){
				Log(this.timestamp + " - " + "On iteration " + numMissiles + " missile found was " + missile + " and reticle was " + reticle);
				continue;
			}

			// Reset the reticle lifespan
			reticle.lifespan = reticle.maxLifespan;

			// Reset their HEALTH!
			missile.health = missile.maxHealth;
			reticle.health = reticle.maxHealth;

			// Starting position for the missile
			var min = 20;
			var max = gameEngine.canvas.width - 20;
			missile.x = Math.floor(Math.random()*(max-min+1)+min);
			missile.y = -20;

			// Starting position for the reticle
			min = gsGame.minY;
			max = gsGame.maxY;
			reticle.x = missile.x;
			reticle.y = Math.floor(Math.random()*(max-min+1)+min);

			// Set their states
			missile.changeState("idle");
			reticle.changeState("idle");
			
			// Reset the speed
			missile.speedX = 0;
			missile.speedY = this.movementSpeed;

			// Set them to Active so they can be updated and rendered
			missile.active = true;
			reticle.active = true;
		}		
	}
	this.unload = function(){
		// Release references to the itemStates
		for (var s in this.states){
			// Do we HAVE any frames?
			if (this.states[s].frames != null){
				// Release references to the stateFrames
				Log("Releasing " + this.states[s].frames.length + " stateFrame references for '" + this.states[s].name + "' for " + this.name);
				for (var f = 0 ; f < this.states[s].frames.length ; f++){
					this.states[s].frames[f] = null;
				}
				// Kill the array one item at a time
				while(this.states[s].frames.length > 0){
					this.states[s].frames.pop();
				}
			}

			// Release the reference to the state itself
			if (this.states[s].name == ""){
				Log("THIS STATE NAME IS BLANK!\n" + s);
			}

			Log("Releasing '" + this.states[s].name + "' state reference for " + this.name);
			this.states[s] = null;
		}
	}
}

// Our constructor for objects that represent an individual frame in an itemState object's "frames" parameter
function stateFrame(){
	this.duration = 0;
	this.anchor = {x:0, y:0};
	this.animation = {x:0, y:0, height:0, width:0};
	this.hitbox = {x:0, y:0, height:0, width:0};
	this.bulletOrigin = {x:0, y:0};
	this.executeOnFinish = null;
}

// Our constructor for objects that represent the animation state of a worldItem
function itemState(){
	this.name = "newState";
	this.frames = null;		// An array of stateFrames
};

//////////////////
//	AUDIO		//
//////////////////

// Our constructor for our sounds
function sound(filename, type){
	var prevElement = document.getElementById("audio_" + filename);

	if (prevElement != null){
		// Get rid of it
		prevElement.remove();
	}

	// Set its properties
	this.type = type;	// "music" or "sfx"
	this.sound = document.createElement("audio");
	this.sound.src = filename;
	this.sound.setAttribute("id", "audio_" + filename);
	this.sound.setAttribute("preload", "auto");
	this.sound.setAttribute("controls", "none");
	this.sound.style.display = "none";
	this.sound.load();

	// Add it to the DOM
	document.body.appendChild(this.sound);

	this.play = function (resume) {
		// If we're NOT resuming it, we'll start over again
		if (!resume){
			this.sound.pause();
			this.sound.currentTime = 0;
		}

		// If we're starting a music sound over again let's reset everybody's frameTimer
		if (this.type == "music"){
			Log("RESTARTING MUSIC and resetting worldobjects!!");

			for(var wi = 0 ; wi < gameEngine.gameState.worldObjects.length ; wi++){
				if (gameEngine.gameState.worldObjects[wi].active){
					gameEngine.gameState.worldObjects[wi].frameTimer = 0;
				}
			}
		}

		// Play the sound!
		this.sound.play().catch(function(ex){
			Log(ex.message);
		});
	}
	this.pause = function () {
		this.sound.pause();
	}
	this.stop = function(){
		this.sound.pause();
		this.sound.currentTime = 0;
	}
	this.rewind = function(){
		this.sound.currentTime = 0;
	}
	this.setVolume = function(percentage){
		// 1.0 is 100% volume, 0.5 is 50% volume, 0.1 is 10% volume
		this.sound.volume = percentage;
	}
	this.unload = function(){
		Log("Deleting and removing reference for sound '" + this.sound.src + "'");
		var soundElem = document.getElementById(this.sound.id);

		if (soundElem != null)
			soundElem.remove();

		this.sound = null;
	}
}

//////////////////////
//	gsMenu STUFF	//
//////////////////////

// Our constructor for a menuScreen
function menuScreen(title, options){
	// Our title (e.g., "Main", "Options", etc.)
	this.title = title;

	// The array of options to pick from on this menuScreen (e.g., "Start", "Settings", "Quit")
	this.menuOptions = options;

	this.unload = function(){
		Log("Releasing menuOptions for menuScreen with title of '" + this.title + "'");
		for(var i = 0 ; i < this.menuOptions.length ; i ++){
			this.menuOptions[i] = null;
		}

		Log("Emptying out the menuOptions array for menuScreen with title of '" + this.title + "'");
		while (this.menuOptions.length > 0){
			this.menuOptions.pop();
		}

		// Null the variables
		this.title = null;
		this.menuOptions = null;
	}
}

// Our constructor for a menuOption
function menuOption(text, onselect, onleft, onright, font, fontsize, x, y){
	// The text
	this.text = text;

	// Events
	this.onselect = onselect;
	this.onleft = onleft;
	this.onright = onright;

	// Font settings
	this.font = font;
	this.fontsize = fontsize;

	// Positioning
	this.x = x;
	this.y = y;
}