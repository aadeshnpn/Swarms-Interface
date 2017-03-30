//*****************************************************************************
// Globals
//*****************************************************************************

// get a socket object from the socket.io script included above
var socket = io();
var world = null;
var clientId;

var debug           = true;
var showAgentStates = false;

// get a reference to the canvas element
var canvas = document.getElementById("canvas");

const cursors =
{
   default: new CursorDefault(),
   selecting: new CursorSelecting(),
   radialDrag: new CursorRadialDrag(),
   placeBaitBomb: new CursorPlaceBaitBomb()
};

const ui = new UI();

// get image refs
var bee      = document.getElementById("bee"     );
var beeDead  = document.getElementById("bee-dead");
var obstacle = document.getElementById("obstacle");

var finishedDrawing = true;

// In order to associate a client with a specific engine process,
// the server sends us a unique id to send back once socket.io has
// established a connection
socket.on('connect', function()
{
   var idx = document.cookie.indexOf("clientId");
   var endIdx = document.cookie.indexOf(";", idx);

   if (endIdx == -1)
   {
      endIdx = undefined;
   }

   clientId = document.cookie.slice(idx, endIdx).split("=").pop();

   socket.emit('clientId', clientId);
});

// This is where the magic happens. When we emit an "update" event from the
// server, it'll come through here.
socket.on('update', function(worldUpdate)
{
   // First update
   if (world === null)
   {
      world = new World(worldUpdate.data);
      canvas.setAttribute("width", world.width);
      canvas.setAttribute("height", world.height);

      // make sure the canvas doesn't get cut off on the screen
      document.getElementById("canvasDiv").style.width = world.width + "px";

      // move the coordinate system origin from top-left to the centre of the world
      canvas.getContext("2d").translate(world.x_limit, world.y_limit);

      // request that the browser call the draw() function when its ready for
      // the next animation frame
      window.requestAnimationFrame(draw);
   }
   else if (finishedDrawing)
   {
      world = new World(worldUpdate.data);

      // TODO: split this out into a separate update? worldMeta?
      //ui.RadialControl.updateActual(world.hub.directions);
   }

   ui.on(worldUpdate);
});

function draw()
{
   finishedDrawing = false;
   // we draw to the 2d context, not the canvas directly
   var ctx = canvas.getContext("2d");

   // clear everything
   ctx.clearRect(-world.x_limit, -world.y_limit, world.width, world.height);
   ctx.save();
   ctx.fillStyle = "rgb(229, 229, 229)";
   ctx.fillRect(-world.x_limit, -world.y_limit, world.width, world.height);
   ctx.restore();

   world.draw(ctx, debug, showAgentStates);
   ui.draw(ctx, debug);

   finishedDrawing = true;

   // maintain a maximum rate of 60fps
   window.setTimeout(() => { window.requestAnimationFrame(draw)}, 1000 / 60);
}

// TODO: I don't like where this is going, I should be able to make one subscription
//       to the socket and let the UI class sort out all the details

socket.on('updateMission', function(data)
{
  ui.on(data);
});

socket.on('restart'             , function(data) { ui.on(data) });
socket.on('updateRadial'        , function(data) { ui.on(data) });
socket.on('updateDebugParams'   , function(data) { ui.on(data) });
socket.on('updateUIParams'      , function(data) { ui.on(data) });
socket.on('updateSitePriorities', function(data) { ui.on(data) });
socket.on('setStates'           , function(data) { ui.on(data) });
socket.on('stateCounts'         , function(data) { ui.on(data) });
