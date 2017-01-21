// get a socket object from the socket.io script included above
var socket = io();

var debug = true;

var world = null;

// get a reference to the canvas element
var canvas = document.getElementById("canvas");

// get image refs
var bee      = document.getElementById("bee"     );
var obstacle = document.getElementById("obstacle");

// initalise selectionRectangle as an object
var selectionRectangle =
{
   active: false
};

// use this as a hash of ids -> booleans telling us which agents are selected
var selectedAgents = {};

// agent direction lookup table
var agentRotations = {};

// ui stuff. TODO: move to a UI class
const cursorModes = {SELECT: 0, BAIT: 1, BOMB: 2};
var cursorMode = cursorModes.SELECT;

var finishedDrawing = true;

function pause()
{
  socket.emit('input', {type: 'pause'});
}

function play()
{
  socket.emit('input', {type: 'play'});
}

function bait()
{
   cursorMode = cursorModes.BAIT;
}

function bomb()
{
  cursorMode = cursorModes.BOMB;
}

// In order to associate a client with a specific engine process,
// the server sends us a unique id to send back once socket.io has
// established a connection
socket.on('connect', function()
{
   var clientId;
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
      world = new World(worldUpdate);
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
         world = new World(worldUpdate);
   }

   for (var agent of world.agents)
   {
      if (selectedAgents[agent.id])
      {
         // Find an update all the information elements we created in the
         // selection process
         document.getElementById(`x${agent.id}`).innerHTML = Math.round(agent.x);
         document.getElementById(`y${agent.id}`).innerHTML = Math.round(agent.y);
         document.getElementById(`state${agent.id}`).innerHTML = agent.state;
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

   if (document.getElementById("directionOverlay").checked)
   {
      ctx.save();
      renderAgentDirectionOverview(world.agents, ctx);
      ctx.restore();
   }

   if (selectionRectangle.active)
   {
      ctx.save();
      renderSelectionRectangle(ctx);
      ctx.restore();
   }

   finishedDrawing = true;

   // maintain a maximum rate of 60fps
   window.setTimeout(() => { window.requestAnimationFrame(draw)}, 1000 / 60);
}

/*******************************************************************************
 * TODO: move these pieces to appropriate UI classes
 ******************************************************************************/

function renderSelectionRectangle(ctx)
{
   ctx.fillStyle = "rgba(60, 181, 249, 0.2)";
   ctx.strokeStyle = "rgb(60, 181, 249)";
   ctx.lineWidth = 1;
   ctx.translate(-world.x_limit, -world.y_limit);

   // Don't translate the context like we did for agents because we have
   // canvas-relative coordinates already
   ctx.fillRect(selectionRectangle.x, selectionRectangle.y, selectionRectangle.width, selectionRectangle.height);
   ctx.strokeRect(selectionRectangle.x, selectionRectangle.y, selectionRectangle.width, selectionRectangle.height);
}

function renderAgentDirectionOverview(agents, ctx)
{
   var directions = {};

   for (var i = -180; i <= 180; i += 10)
   {
      directions[i] = 0;
      //console.log(i);
   }

   for (var agent of agents)
   {
      if (Math.sqrt(Math.pow(agent.x, 2) + Math.pow(agent.y, 2)) > (world.hub[2] < 20) ? 20 : world.hub[2])
      {
         // our view coords are a little different than the world coords
         var dir = Math.atan2(agent.y, agent.x);
         //dir = Math.round(dir * 180/Math.PI);
         dir = Math.round(dir / 10) * 10;

         directions[dir]++;
      }
   }

   ctx.beginPath();

   for (var i = -180; i <= 180; i += 10)
   {
      ctx.save();
      ctx.rotate(-(i * Math.PI/180) - Math.PI/2); // rotate works with a clockwise angle, atan2 is counterclockwise and i have no idea why it's pi/2 off
      ctx.lineTo(0, (directions[i] + 50) + (5 * directions[i]) );
      ctx.restore();
   }

   ctx.stroke();
}

// when the canvas is clicked
canvas.addEventListener("mousedown", function(e)
{
    switch (cursorMode)
    {
      case cursorModes.SELECT:
       // unselect everything
       clearSelectedAgents();

       // initialise the selection rectangle
       selectionRectangle.active = true;
       selectionRectangle.x = e.clientX + window.pageXOffset; // these coords are relative to the canvas
       selectionRectangle.y = e.clientY + window.pageYOffset; // pageOffset in case the page has been scrolled

       // default height and width
       selectionRectangle.width = 1;
       selectionRectangle.height = 1;
       break;

     case cursorModes.BAIT:
       var coords = world.canvasToWorldCoords(e.clientX, e.clientY)
       socket.emit('input', {type: 'attractor', x: coords.x, y: coords.y});
       break;

     case cursorModes.BOMB:
       var coords = world.canvasToWorldCoords(e.clientX, e.clientY)
       socket.emit('input', {type: 'repulsor', x: coords.x, y: coords.y});
       break;
   }
});

// when the mouse is moved over the canvas
canvas.addEventListener("mousemove", function(e)
{
   if (selectionRectangle.active)
   {
      selectionRectangle.width = (e.clientX + window.pageXOffset) - selectionRectangle.x;
      selectionRectangle.height = (e.clientY + window.pageYOffset) - selectionRectangle.y;
   }
});

// when the mouse click is released over the canvas
// TODO: change this to the whole document? would avoid funny behaviour
// when mouse is released off of the canvas
canvas.addEventListener("mouseup", function(e)
{
  if (cursorMode != cursorModes.SELECT)
  {
    cursorMode = cursorModes.SELECT;
    return;
  }

   computeSelectedAgents();
   selectionRectangle.active = false;

   // Create the information table elements for selected agents
   // This is all a bit hacky, probably ought to pull in JQuery for a nicer
   // interface for all this
   var infoTableInnerHtml = "";

   var tableHeader = "<tr><th>ID</th><th>X</th><th>Y</th><th>State</th>\n";

   infoTableInnerHtml += tableHeader;

   for (var i = 0; i < world.agents.length; i++)
   {
      var agent = world.agents[i];

      if (selectedAgents[agent.id])
      {
         var agentInfo = `<tr>
            <td id='id${agent.id}'   >${agent.id}</td>
            <td id='x${agent.id}'    >${agent.x}</td>
            <td id='y${agent.id}'    >${agent.y}</td>
            <td id='state${agent.id}'   >${agent.state}</td>
            </tr>`;

         infoTableInnerHtml += agentInfo;
      }
   }

   // replace the infoTable element's innerHTML with what we constructed above
   document.getElementById("infoTable").innerHTML = infoTableInnerHtml;
});

function clearSelectedAgents()
{
   selectedAgents = {};
}

function computeSelectedAgents()
{
   var selectBounds = {};

   selectBounds.left   = (selectionRectangle.width  > 0) ? selectionRectangle.x                             : selectionRectangle.x + selectionRectangle.width;
   selectBounds.right  = (selectionRectangle.width  > 0) ? selectionRectangle.x + selectionRectangle.width  : selectionRectangle.x;
   selectBounds.top    = (selectionRectangle.height > 0) ? selectionRectangle.y                             : selectionRectangle.y + selectionRectangle.height;
   selectBounds.bottom = (selectionRectangle.height > 0) ? selectionRectangle.y + selectionRectangle.height : selectionRectangle.y;

   selectBounds.left   -= world.x_limit;
   selectBounds.right  -= world.x_limit;
   selectBounds.top    -= world.y_limit;
   selectBounds.bottom -= world.y_limit;

   for (var i = 0; i < world.agents.length; i++)
   {
      var agent = world.agents[i];

      var agentBounds =
      {
         left: agent.x - 5,
         right: agent.x + 5,
         top: agent.y - 5,
         bottom: agent.y + 5
      };

      if (rectIntersect(agentBounds, selectBounds))
      {
         selectedAgents[agent.id] = true;
      }
   }
}

function rectIntersect(a, b)
{
   return !(b.left > a.right || b.right < a.left || b.top > a.bottom || b.bottom < a.top);
}
