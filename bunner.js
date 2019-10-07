
"use strict";

// Bunner, version 0.4

// Lots of refactoring to make everything a lot cleaner. Data (levels and
// sprites) now stored in json file and loaded via ajax.

const version = 0.4,
    tileSize = 32,
    canvas = document.getElementById("canvas"),
    ctx = canvas.getContext("2d");

const SCREEN_TITLE = 0,
    SCREEN_LEVEL = 1,
    SCREEN_WAITING = 2,
    SCREEN_FINISH = 3;

var w = 800,
    h = 600,
    levels = [],
    level = 0,
    terrain,
    objects,
// This replaces screenNum, which was confusing.
    screenType,
    height,
    width,
    turn,
    gutter = 1,
    flags = {
        drawGrid: 1
    },
// Object sprites are now stored in a json file
    objectSprites = {};

loadData();

/**
 * Had some 'blurry line' issues. Not convinced this was the actual solution,
 * but seems like good idea for now.
 *
 * @see https://stackoverflow.com/a/56997819/5058
 */
function getPixelRatio(context) {
    var dpr = window.devicePixelRatio || 1,
        bsr = context.webkitBackingStorePixelRatio ||
            context.mozBackingStorePixelRatio ||
            context.msBackingStorePixelRatio ||
            context.oBackingStorePixelRatio ||
            context.backingStorePixelRatio || 1;

  return dpr / bsr;
}

/**
 * Use ajax to load level and sprite data from json file.
 */
function loadData() {
    var request = new XMLHttpRequest();
    request.open("get", "data.json");

    request.addEventListener("load", function() {
        var data = JSON.parse(this.responseText);
        levels = data.levels;
        objectSprites = data.sprites;
        init();
    });

    request.send();
}

/**
 * Set everything up. Validate data for current level, add event listeners for
 * input, and show the title screen.
 */
function init() {
// Adjust canvas to try to cater for retina screens
    var ratio = getPixelRatio(ctx);
    canvas.width = w * ratio;
    canvas.height = h * ratio;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

// All events are now caught via the keyup listener ...
    window.addEventListener("keyup", function(ev) {
        if (screenType == SCREEN_TITLE) {
            showLevel();
        } else if (screenType == SCREEN_LEVEL) {
            var moved = false,
                skipped = false;

            if (ev.keyCode == 32) {
                skipped = true;
            } else if (ev.keyCode == 37 || ev.keyCode == 65) {
                moved = moveBunner(-1, 0);
            } else if (ev.keyCode == 38 || ev.keyCode == 87) {
                moved = moveBunner(0, -1);
            } else if (ev.keyCode == 39 || ev.keyCode == 68) {
                moved = moveBunner(1, 0);
            } else if (ev.keyCode == 40 || ev.keyCode == 83) {
                moved = moveBunner(0, 1);
// "g" to toggle gridlines
            } else if (ev.keyCode == 71) {
                flags.drawGrid = !flags.drawGrid;
                drawLevel();
// "m" to increase 'margin' — the space between tiles
            } else if (ev.keyCode == 77) {
                if (++gutter > 4) {
                    gutter = 0;
                }

                drawLevel();
            }

            if (moved || skipped) {
                turn++;

                if (moved) {
                    drawLevel();
                }

                endTurn();
            }
        } else if (screenType == SCREEN_WAITING) {
            if (++level > levels.length - 1) {
                win();
            } else {
                showLevel();
            }
        } else if (screenType == SCREEN_FINISH) {
            titleScreen();
        }
    });

    titleScreen();
}

/**
 * Process the game state at the end of a turn.
 */
function endTurn() {
    var cond = levels[level].win,
        win = false,
        obj,
        bunner = getBunner(),
        i;

// [...]
    if (cond.hasOwnProperty("turn") && cond.turn == turn) {
        win = true;
    } else if (cond.hasOwnProperty("standing") && bunner) {
        for (i = 0; i < levels[level].objects.length; i++) {
            obj = levels[level].objects[i];

            if (obj.type == cond.standing && objectsTogether(bunner, obj)) {
                win = true;
            }
        }
    }

    if (win) {
        dialog(winMessage());
        screenType = SCREEN_WAITING;
    }
}

/**
 * Determine if two objects share the same tile.
 */
function objectsTogether(obj1, obj2) {
    return obj1.x == obj2.x && obj1.y == obj2.y;
}

/**
 * Find the bunner object.
 */
function getBunner() {
    var i;

    for (i = 0; i < levels[level].objects.length; i++) {
        if (levels[level].objects[i].type == "b") {
            return levels[level].objects[i];
        }
    }
}

/**
 * Try to move the bunner object x tiles horizontal and y tiles vertical.
 */
function moveBunner(x, y) {
    var bunner;

    if (bunner = getBunner()) {
        return moveObjectTo(bunner, bunner.x + x, bunner.y + y);
    }

    return false;
}

/**
 * Move an object to a given tile
 */
function moveObjectTo(obj, x, y) {
    var lev = levels[level];

    if (x >= 0 && x < lev.width && y >= 0 && y < lev.height) {
        obj.x = x;
        obj.y = y;
        return true;
    } else {
        return false;
    }
}

/**
 * Get the 'win' message, including a note about how many turns the player took.
 */
function winMessage() {
    return "Well done, you beat this level in " + turn + " turn"
        + (turn == 1 ? "" : "s") + ". Press any key to continue.";
}

/**
 * Get a message representing the current win condition
 */
function winConditionMessage() {
    var typeName = {
        "b": "bunner",
        "f": "flag"
    };

    if (levels[level].win.hasOwnProperty("turn")) {
        return "win: by completing " + levels[level].win.turn + " turn"
            + (levels[level].win.turn == 1 ? "" : "s");
    } else if (levels[level].win.hasOwnProperty("standing")) {
        return "win by stepping on a " + typeName[levels[level].win.standing];
    } else {
        return "win condition unknown!";
    }
}

/**
 * Populate the dialog area with a message 
 */
function dialog(msg) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillRect(10, 10, w - 20, 32);

    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    ctx.strokeRect(10.5, 10.5, w - 20, 32);

    ctx.font = "16px sans-serif";
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillText(msg, w / 2, 32);
}

/**
 * The title screen simply displays some text about the game. Ultimately, it
 * will act as a menu for settings, any different modes, etc.
 */
function titleScreen() {
    var x;
    screenType = SCREEN_TITLE;
    level = 0;
    infoScreen();
    x = w / 2;
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
    screenType = SCREEN_LEVEL;
    turn = 0;
    height = levels[level].height;
    width = levels[level].width;

    if (height < 1 || width < 1) {
// Should probably, one day, report this error via the canvas, although this
// shouldn't really happen in 'production'. Maybe it would be worth doing if
// levels can be edited by hand (which will probably be the case).
        console.error("invalid data");
        return;
    }

    drawLevel();
    dialog(winConditionMessage());
}

/**
 * Draw the current level by drawing, first, terrain, then objects on top.
 */
function drawLevel() {
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillRect(0, 0, w, h);

    if (flags.drawGrid) {
        drawGrid();
    }

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
            "g": [ 0, 200, 0 ],
            "r": [ 200, 0, 0 ]
        };

// Lots of calculation to work out our exact pixels to draw at. Takes into
// account: width & height of level playfield, width & height of canvas, tile
// size, and gutter.
    var width = levels[level].width,
        height = levels[level].height,
        tilesH = Math.floor((w - gutter) / (tileSize + gutter)),
        tilesV = Math.floor((h - gutter) / (tileSize + gutter)),
        tileX = Math.floor((tilesH / 2) - (width / 2)),
        tileY = Math.floor((tilesV / 2) - (height / 2)),
        baseX = Math.floor((w - (tilesH * (tileSize + gutter)) - gutter ) / 2),
        baseY = Math.floor((h - (tilesV * (tileSize + gutter)) - gutter ) / 2);

    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
            if (setColor(ctx, colors, levels[level].terrain)) {
                drawTerrainTile(
                    baseX + ((tileX + x) * (tileSize + gutter)) + gutter,
                    baseY + ((tileY + y) * (tileSize + gutter)) + gutter,
                    levels[level].terrain
                );
            }
        }
    }
}

/**
 * Draw a terrain tile. In due course, this will mirror what we do for objects —
 * i.e. we'll have actual terrain sprites, rather than just colored tiles. Can
 * also add complexity here to, for example, give several different 'grass'
 * tiles so they don't just appear uniform.
 */
function drawTerrainTile(x, y, type) {
    ctx.fillRect(x, y, tileSize, tileSize);
}

/**
 * Draw gridlines. This is just really for development / testing, unless I
 * decide I actually *like* tha aesthetic of a grid.
 */
function drawGrid() {
    ctx.fillStyle = "rgb(100, 100, 100)";

    var tilesH = Math.floor((w - gutter) / (tileSize + gutter)),
        tilesV = Math.floor((h - gutter) / (tileSize + gutter)),
        baseX = Math.floor((w - (tilesH * (tileSize + gutter)) - gutter ) / 2),
        baseY = Math.floor((h - (tilesV * (tileSize + gutter)) - gutter ) / 2),
        i;

    ctx.fillRect(baseX, 0, gutter, h);

    for (i = 0; i < tilesH; i++) {
        ctx.fillRect(baseX + (i + 1) * (tileSize + gutter), 0, gutter, h);
    }

    ctx.fillRect(0, baseY, w, gutter);

    for (i = 0; i < tilesV; i++) {
        ctx.fillRect(0, baseY + (i + 1) * (tileSize + gutter), w, gutter);
    }
}

/**
 * Draw all the objects onto the canvas
 */
function drawObjects() {
// Note that all this is repeated from drawTerrain; would be nice to factor out
    var width = levels[level].width,
        height = levels[level].height,
        tilesH = Math.floor((w - gutter) / (tileSize + gutter)),
        tilesV = Math.floor((h - gutter) / (tileSize + gutter)),
        tileX = Math.floor((tilesH / 2) - (width / 2)),
        tileY = Math.floor((tilesV / 2) - (height / 2)),
        baseX = Math.floor((w - (tilesH * (tileSize + gutter)) - gutter ) / 2),
        baseY = Math.floor((h - (tilesV * (tileSize + gutter)) - gutter ) / 2),
        x,
        y,
        i,
        obj,
        seen = [];

    for (i = 0; i < levels[level].objects.length; i++) {
        obj = levels[level].objects[i];

// Now that multiple objects can exist within the same tile, there's an issue
// of how to draw them. For now, just draw *the first* object, as defined in the
// level data.
        if (seen.indexOf(obj.x + "," + obj.y) !== -1) {
            continue;
        }

        seen.push(obj.x + "," + obj.y);
        x = baseX + ((tileX + obj.x) * (tileSize + gutter)) + gutter;
        y = baseY + ((tileY + obj.y) * (tileSize + gutter)) + gutter;
        drawObject(x, y, obj.type);
    }
}

/**
 * Draw an individual object
 */
function drawObject(x, y, id) {
    var x2,
        y2,
        sprite = objectSprites[id];

    for (y2 = 0; y2 < sprite.tiles.length; y2++) {
        for (x2 = 0; x2 < sprite.tiles[y2].length; x2++) {
            if (setColor(ctx, sprite.palette, sprite.tiles[y2][x2], 0.9)) {
                ctx.fillRect(x + (x2 * 4), y + (y2 * 4), 4, 4);
            }
        }
    }
}

/**
 * Set the fill style on the given context, according to the value in the colors
 * map, indexed by the key
 */
function setColor(ctx, colors, key, opacity) {
    var color;
    opacity = opacity || 1;

    if (colors.hasOwnProperty(key)) {
        color = colors[key];
        ctx.fillStyle = rgba(color[0], color[1], color[2], opacity);
        return true;
    }

    return false;
}

/**
 * Helper function for building rgba() strings
 */
function rgba(r, g, b, a) {
    return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
}

/**
 * The win screen just shows a 'congratulations' message for now. Ultimately,
 * it should probably be a nice animation describing the end of the story.
 */
function win() {
    var x;
    screenType = SCREEN_FINISH;
    infoScreen();
    x = w / 2;
    ctx.fillText("CONGRATULATIONS!", x, 40);
    ctx.fillText("You won by beating all " + levels.length + " levels.", x, 80);
    ctx.fillText("Press any key to return to title screen", x, 160);
}

/**
 * Helper function setting up various canvas properties to display title/win
 * screens.
 */
function infoScreen() {
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillRect(0, 0, w, h);
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgb(0, 0, 0)";
}
