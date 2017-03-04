//*****************************************************************************
// Globals
//*****************************************************************************

// get a socket object from the socket.io script included above
var socket = io();
var debug = true;
var world = null;
var clientId;

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

   // TODO: work this in to the rest of the UI refactor
   for (var agent of world.agents)
   {
      if (ui.isAgentSelected(agent.id))
      {
         // Find an update all the information elements we created in the
         // selection process
         for (var [prop, val] of Object.entries(agent))
         {
            if (typeof val === 'number')
               val = val.toFixed(2);
           $(`#${prop}${agent.id}`).html(val);
         }
         //document.getElementById(`x${agent.id}`).innerHTML = Math.round(agent.x);
         //document.getElementById(`y${agent.id}`).innerHTML = Math.round(agent.y);
         //document.getElementById(`state${agent.id}`).innerHTML = agent.state;
      }
   }
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

   world.draw(ctx, debug);
   ui.draw(ctx, debug);

   finishedDrawing = true;

   // maintain a maximum rate of 60fps
   window.setTimeout(() => { window.requestAnimationFrame(draw)}, 1000 / 60);
}

socket.on('updateMission', function(data)
{
  ui.on(data);
});

socket.on('updateMeta', function(data)
{
   ui.on(data);
});
