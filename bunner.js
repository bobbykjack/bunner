
'use strict';

// Bunner, version 0.1

// Absolute minimal 'gameplay': present simple title screen, level, and win
// screen. Level just has a single win condition — complete one move — although
// that won't even be properly implemented yet. Instead, just hit space to skip
// a turn and win (i.e. the same effect, just hard-coded).

// Since there is, currently, no animation planned, we'll start by simply
// repainting on demand, rather than tens of times per second.
const version = 0.1,

// For now, we're just limiting ourselves to the first level
    level = 0,

// We'll just store levels in one big array until we need to support many
    levels = [

// Each level in the array consists of two strings representing terrain and
// objects respectively. In this mockup, 'g' might represent grass and 'b', the
// bunner.
        [ "g", "b" ]
    ],

// Each tile is a square; this value defines its height and width in pixels
    tileSize = 32,

// Terrain won't actively be used yet, but this is how we'll set it up ...
    terrain = processDataString(levels[level][0]),

// ... along with objects. We store both initially as strings so that levels can
// easily be edited by hand, although a level editor will be created eventually.
    objects = processDataString(levels[level][1]),

// Height and width of the grid are determined from level data - this allows
// them to vary from one level to another.
    height = terrain.length,
    width = terrain[0].length,

// Just one canvas for everything, for now.
    canvas = document.getElementById("canvas"),
    ctx = canvas.getContext("2d");

// We'll use an integer to keep track of which screen we're showing: title,
// level, or 'congratulations'
var screenNum;

init();


/**
 * Split up a string into a two-dimensional array representing values in the
 * grid
 */
function processDataString(str) {
    str = str.trim().split("\n"),
    str.forEach(function(v, i, a) { a[i] = a[i].split(""); });
    return str;
}

/**
 * Set everything up. Validate data for current level, add event listeners for
 * input, and show the title screen.
 */
function init() {
    if (height < 1 || width < 1) {
// Should probably, one day, report this error via the canvas, although this
// shouldn't really happen in 'production'. Maybe it would be worth doing if
// levels can be edited by hand (which will probably be the case).
        console.error("invalid data");
        return;
    }

    window.addEventListener('keypress', function(ev) {
        if (screenNum == 0) {
            showLevel();
        } else if (screenNum == 1) {
// 32 (space) means 'skip turn'
            if (ev.keyCode == 32) {
                win();
            }
        } else if (screenNum == 2) {
            titleScreen();
        }
    });

    titleScreen();
}

/**
 * The title screen simply displays some text about the game. Ultimately, it
 * will act as a menu for settings, any different modes, etc.
 */
function titleScreen() {
    var x;
    screenNum = 0;
    infoScreen();
    x = canvas.width / 2;
    ctx.fillText("Bunner — a game by bobbyjack", x, 40);
    ctx.fillText("Version " + version, x, 80);
    ctx.fillText("Cursor keys to move, Space to skip turn", x, 120);
    ctx.fillText("Press any key to begin", x, 160);
}

/**
 * Display the current level - for now, this is just totally hard-coded. In
 * time, it will display the terrain and objects in their current state.
 */
function showLevel() {
    screenNum = 1;
    canvas.width = tileSize * width;
    canvas.height = tileSize * height;
    ctx.fillStyle = "rgb(255, 0, 0)";
    ctx.fillRect(1, 1, 30, 30);
}

/**
 * The win screen just shows a 'congratulations' message for now. Ultimately,
 * it should probably be a nice animation describing the end of the story.
 */
function win() {
    var x;
    screenNum = 2;
    infoScreen();
    x = canvas.width / 2;
    ctx.fillText("CONGRATULATIONS!", x, 40);
    ctx.fillText("You won.", x, 80);
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
