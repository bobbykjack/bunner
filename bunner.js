
'use strict';

// Bunner, version 0.3

// This version will include both the first two levels, plus a new one. It will
// be the first time we've had multiple levels, so it's a good opportunity to
// stop hardcoding things like win conditions.

// Also proper movement

const version = 0.3,
    levels = [
        [ "g", "b" ],
        [ "gg", "bf" ],
// The level now consists of 2 tiles
        [ "gg\ngg", "b \n f" ]
    ],
    tileSize = 32,
    canvas = document.getElementById("canvas"),
    ctx = canvas.getContext("2d"),

// A new canvas to show messages to the user
    dialogCanvas = document.getElementById("dialog"),
    dialogCtx = dialogCanvas.getContext("2d");

var level = 0,
    terrain,
    objects,
    screenNum,
    height,
    width,

    movedOnto,

// This was a major omission from version 0.1! Keep track of how many turns
// we've taken.
    turn,

// The bunner sprite. It's chunky, but it'll do for a first go.
    bunner = `
   bb
  bdbb
 bdlbe
 bdlbb
bbdlbbb
bbbdbb
 bbbbb
b bbbbb`,

// A sprite for the 'flag' which will represent our winning tile in this level
    flag = `
  xxgxx
  xgggx
  xxgxx
  xxxxx
     xd
     xd
     xd
     xd`,
  objectSprites = {};

init();


/**
 * Split up a string into a two-dimensional array representing values in the
 * grid
 */
function processDataString(str, trim) {
    if (trim) {
        str = str.trim();
    }

    str = str.split("\n"),
    str.forEach(function(v, i, a) { a[i] = a[i].split(""); });
    return str;
}

/**
 * Set everything up. Validate data for current level, add event listeners for
 * input, and show the title screen.
 */
function init() {
    processObjectSprites();

// All events are now caught via the keyup listener ...
    window.addEventListener('keyup', function(ev) {
        if (screenNum == 0) {
            showLevel();
        } else if (screenNum == 1) {
            var moved = false,
                redraw = false;

            if (ev.keyCode == 32) {
                moved = true;
            } else if (ev.keyCode == 37 || ev.keyCode == 65) {
                moved = moveBunner(-1, 0);
                redraw = true;
            } else if (ev.keyCode == 38 || ev.keyCode == 87) {
                moved = moveBunner(0, -1);
                redraw = true;
            } else if (ev.keyCode == 39 || ev.keyCode == 68) {
                moved = moveBunner(1, 0);
                redraw = true;
            } else if (ev.keyCode == 40 || ev.keyCode == 83) {
                moved = moveBunner(0, 1);
                redraw = true;
            }

            if (moved) {
                turn++;

                if (redraw) {
                    drawLevel();
                }

                endTurn();
            }


        } else if (screenNum == 2) {
            clearDialog();

            if (++level > levels.length - 1) {
                win();
            } else {
                showLevel();
            }
        } else if (screenNum == 3) {
            titleScreen();
        }
    });

    titleScreen();
}

/**
 * Process the game state at the end of a turn. Currently, win conditions for
 * each level are hard-coded here.
 */
function endTurn() {
// We win the first level just by having made a move, and we win the other two
// levels if we just moved onto the flag.
    if ((level == 0) || ((level == 1 || level == 2) && movedOnto == "f")) {
        dialog(winMessage());
        screenNum = 2;
    }
}

/**
 * Move Bunner x tiles horizontally and y tiles vertically
 */
function moveBunner(x, y) {
    var tx, ty, newx, newy, inbounds

    for (ty = 0; ty < objects.length; ty++) {
        for (tx = 0; tx < objects[ty].length; tx++) {
            if (objects[ty][tx] == "b") {
                newx = tx + x;
                newy = ty + y;

                inbounds = newx >= 0 && newx < objects[ty].length && newy >= 0
                    && newy < objects.length;

                if (inbounds) {
                    movedOnto = objects[newy][newx];
                    objects[ty][tx] = 0;
                    objects[newy][newx] = "b";
                    return true;
                }
            }
        }
    }

    return false;
}

/**
 * Convert sprite data into a slightly more-easy-to-work-with format
 */
function processObjectSprites() {
// This is a bit messy; we're just hard-coding a couple of sprites right now
    objectSprites["b"] = processDataString(bunner);
    objectSprites["b"].shift();

    objectSprites["f"] = processDataString(flag);
    objectSprites["f"].shift();
}

/**
 * Get the 'win' message, including a not about how many turns the player took
 */
function winMessage() {
    return "Well done, you beat this level in " + turn + " turn"
        + (turn == 1 ? "" : "s") + ". Press any key to continue.";
}

/**
 * Populate the dialog canvas with a message 
 */
function dialog(msg) {
    dialogCtx.font = "16px sans-serif";
    dialogCtx.fillStyle = "rgb(0, 0, 0)";
    dialogCtx.fillText(msg, 0, 20);
}

/**
 * Remove all text from the dialog by painting over the whole thing
 */
function clearDialog() {
    dialogCtx.fillStyle = "rgb(255, 255, 255)";
    dialogCtx.fillRect(0, 0, dialogCanvas.width, dialogCanvas.height);
}

/**
 * The title screen simply displays some text about the game. Ultimately, it
 * will act as a menu for settings, any different modes, etc.
 */
function titleScreen() {
    var x;
    screenNum = 0;
    level = 0;
    infoScreen();
    x = canvas.width / 2;
    ctx.fillText("Bunner — a game by bobbyjack", x, 40);
    ctx.fillText("Version " + version, x, 80);
    ctx.fillText("Cursor keys to move, Space to skip turn", x, 120);
    ctx.fillText("Press any key to begin", x, 160);
}

/**
 * Show the level by setting it up first, then drawing it. This should happen
 * whenever we start the level - maybe needs a better name!
 */
function showLevel() {
    screenNum = 1;
    turn = 0;

    terrain = processDataString(levels[level][0], true);
    objects = processDataString(levels[level][1], true);

    height = terrain.length;
    width = terrain[0].length;

    if (height < 1 || width < 1) {
// Should probably, one day, report this error via the canvas, although this
// shouldn't really happen in 'production'. Maybe it would be worth doing if
// levels can be edited by hand (which will probably be the case).
        console.error("invalid data");
        return;
    }

    canvas.width = tileSize * width;
    canvas.height = tileSize * height;

    drawLevel();
}

/**
 * Draw the current level by drawing, first, terrain, then objects on top.
 */
function drawLevel() {
    drawTerrain();
    drawObjects();
}

/**
 * Draw all the terrain tiles
 */
function drawTerrain() {
    var y = 0,
        x,
        colors = {
            "g": [ 0, 200, 0 ]
        };

    for (y = 0; y < terrain.length; y++) {
        for (x = 0; x < terrain[y].length; x++) {
            if (setColor(ctx, colors, terrain[y][x])) {
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
        }
    }
}

/**
 * Draw all the objects onto the canvas
 */
function drawObjects() {
    var y = 0,
        x;

    for (y = 0; y < objects.length; y++) {
        for (x = 0; x < objects[y].length; x++) {
            if (objectSprites.hasOwnProperty(objects[y][x])) {
                drawObject(x * tileSize, y * tileSize, objects[y][x]);
            }
        }
    }
}

/**
 * Draw an individual object
 */
function drawObject(x, y, id) {
    var x2,
        y2,
        objectColors = {
            "b": {
                "b": [ 57, 36, 36 ],
                "d": [ 23, 0, 0 ],
                "l": [ 220, 207, 174 ],
                "e": [ 226, 180, 40 ]
            },
            "f": {
                "x": [ 70, 70, 70 ],
                "g": [ 255, 0, 0 ],
                "d": [ 0, 0, 0 ]
            }
        };

    for (y2 = 0; y2 < objectSprites[id].length; y2++) {
        for (x2 = 0; x2 < objectSprites[id][y2].length; x2++) {
            if (setColor(ctx, objectColors[id], objectSprites[id][y2][x2])) {
                ctx.fillRect(x + (x2 * 4), y + (y2 * 4), 4, 4);
            }
        }
    }
}

/**
 * Set the fill style on the given context, according to the value in the colors
 * map, indexed by the key
 */
function setColor(ctx, colors, key) {
    var color;

    if (colors.hasOwnProperty(key)) {
        color = colors[key];

        ctx.fillStyle =
            "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";

        return true;
    }

    return false;
}

/**
 * The win screen just shows a 'congratulations' message for now. Ultimately,
 * it should probably be a nice animation describing the end of the story.
 */
function win() {
    var x;
    screenNum = 3;
    infoScreen();
    x = canvas.width / 2;
    ctx.fillText("CONGRATULATIONS!", x, 40);
    ctx.fillText("You won by beating all " + levels.length + " levels.", x, 80);
    ctx.fillText("Press any key to return to title screen", x, 160);
}

/**
 * Helper function setting up various canvas properties to display title/win
 * screens.
 */
function infoScreen() {
    canvas.width = 500
    canvas.height = 200;
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgb(0, 0, 0)";
}
