class Agent
{
  constructor(agentJson)
  {
    this.id            =  agentJson.id;
    this.x             =  agentJson.x;
    this.y             = -agentJson.y;
    this.rotation      =  Math.PI/2 - agentJson.direction; // convert from the engine's coordinate system into what the drawing routine expects
    this.state         =  agentJson.state;
    this.potentialSite =  agentJson.potential_site;
    this.isAlive       =  agentJson.live;
  }

  draw(ctx, debug = false)
  {
    ctx.save();

    // move the drawing context to the agent's x and y coords
    ctx.translate(this.x, this.y);

    ctx.save();

    ctx.rotate(this.rotation);
    ctx.drawImage(bee, -bee.width/2, -bee.height/2);

    ctx.restore();
    ctx.beginPath();

    // TODO: move this into the UI drawing routings
      // also draw a neat little selection box around the agent if it's selected
      if (selectedAgents[this.id])
      {
         var outlineXy = (bee.width > bee.height) ? bee.width : bee.height;
         // move 7px up and left from agent's centre
         ctx.translate(-outlineXy/2 - 3, -outlineXy/2 - 3);
         ctx.strokeStyle = "rgb(24, 215, 255)";

         // draw a rectangle from origin (agent centre - (7px, 7px), to agent
         // centre + (7px, 7px) )
         ctx.strokeRect(0, 0, outlineXy + 3, outlineXy + 3);
      }

    ctx.restore();
  }
}

class Attractor
{
  constructor(attractorJson)
  {
    this.x     = attractorJson.x;
    this.y     = attractorJson.y;
    this.timer = attractorJson.timer;
  }

  draw(ctx, debug = false)
  {
    ctx.save()

    ctx.translate(this.x, this.y);
    ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
    ctx.strokeStyle = "rgb(0, 255, 0)";

    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2, false);
    ctx.fill();

    ctx.stroke();

    ctx.restore();
  }
}

class Hub
{
  constructor(hubJson)
  {
    this.x      =  hubJson[0];
    this.y      = -hubJson[1];
    this.radius =  hubJson[2];
  }

  draw(ctx, debug = false)
  {
    ctx.save();

    ctx.fillStyle = "rgba(242, 179, 19, 0.4)";
    ctx.strokeStyle = "rgb(242, 179, 19)";
    ctx.lineWidth = 2;
    ctx.translate(this.x, this.y);

    // make sure the hub is visible
    // TODO: don't hack it like this? discuss whether it should just be set
    //       to a more reasonable value

    var radius = (this.radius < 20) ? 20 : this.radius;

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

class Obstacle
{
  constructor(obstacleJson)
  {
    this.x      =  obstacleJson[0];
    this.y      = -obstacleJson[1];
    this.radius =  obstacleJson[2];
  }

  draw(ctx, debug = false)
  {
    ctx.save();

    // obstacle coordinates are for the centre, so we need to adjust
    // to a top-left position
    ctx.translate(this.x - (this.radius), this.y - (this.radius));

    // img, x, y, width, height
    ctx.drawImage(obstacle, 0, 0, this.radius * 2, this.radius * 2);

    ctx.restore();
  }
}

class Repulsor
{
  constructor(repulsorJson)
  {
    this.x     = repulsorJson.x;
    this.y     = repulsorJson.y;
    this.timer = repulsorJson.timer;
  }

  draw(ctx, debug = false)
  {
    ctx.save()

    ctx.translate(this.x, this.y);
    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
    ctx.strokeStyle = "rgb(255, 0, 0)";

    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

class Rough
{
  constructor(roughJson)
  {
    this.x      =  roughJson[0];
    this.y      = -roughJson[1];
    this.radius =  roughJson[2];
  }

  draw(ctx, debug = false)
  {
    // TBD
  }
}

class Site
{
  // site json format = [ x, y, radius, quality ]
  constructor(siteJson)
  {
    this.x      =  siteJson[0];
    this.y      = -siteJson[1]; // drawing coordinates have down as positive y
    this.radius =  siteJson[2];
    this.q      =  siteJson[3];
  }

  draw(ctx, debug = false)
  {
    var rVal = (this.q > 0.5) ? (1.0 - this.q) * 2 : 1.0;
    var gVal = (this.q > 0.5) ? 1.0 : this.q * 2;

    ctx.save();

    ctx.fillStyle   = `rgba(${Math.round(255 * rVal)}, ${Math.round(255 * gVal)}, 70, 0.8)`;
    ctx.strokeStyle = "rgb(20, 20, 20)";
    ctx.translate(this.x, this.y);

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();

    if (debug == true)
    {
      ctx.font = "10px sans-serif";
      ctx.fillStyle = "rgb(0, 0, 0)";
      ctx.fillText(`Q: ${this.q}`, -10, 20);
    }

    ctx.restore();
  }
}

class Trap
{
  constructor(trapJson)
  {
    this.x      =  trapJson[0];
    this.y      = -trapJson[1];
    this.radius =  trapJson[2];
  }

  draw(ctx, debug = false)
  {
    ctx.save();

    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
    ctx.strokeStyle = "rgb(255, 0, 0)";
    ctx.translate(this.x, this.y);

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

class World
{
  constructor(environmentJson)
  {
    this.x_limit = environmentJson.x_limit;
    this.y_limit = environmentJson.y_limit;
    this.width  = this.x_limit * 2;
    this.height = this.y_limit * 2;
    this.hub    = new Hub(environmentJson.hub);
    this.sites      = [];
    this.obstacles  = [];
    this.traps      = [];
    this.rough      = [];
    this.attractors = [];
    this.repulsors  = [];
    this.agents     = [];

    for (var site      of environmentJson.sites     ) { this.sites     .push( new Site     (site     ) ); }
    for (var obstacle  of environmentJson.obstacles ) { this.obstacles .push( new Obstacle (obstacle ) ); }
    for (var trap      of environmentJson.traps     ) { this.traps     .push( new Trap     (trap     ) ); }
    for (var rough     of environmentJson.rough     ) { this.rough     .push( new Rough    (rough    ) ); }
    for (var attractor of environmentJson.attractors) { this.attractors.push( new Attractor(attractor) ); }
    for (var repulsor  of environmentJson.repulsors ) { this.repulsors .push( new Repulsor (repulsor ) ); }
    for (var agent     of environmentJson.agents    ) { this.agents    .push( new Agent    (agent    ) ); }

  }

  canvasToWorldCoords(x, y)
  {
    return {x: (x - this.x_limit), y: (y - this.y_limit)};
  }

  // Draw the whole world recursively. Takes a 2dRenderingContext obj from
  // a canvas element
  draw(ctx, debug = false)
  {
    // Ok so this isn't really buying us all that much simplification at this level
    // right *now*, but the point is if in the future we ever need some sort of
    // this drawn singly at a world level, it could go right here very nicely.

    for (var site      of this.sites     ) { site     .draw(ctx, debug); }
    for (var obstacle  of this.obstacles ) { obstacle .draw(ctx, debug); }
    for (var trap      of this.traps     ) { trap     .draw(ctx, debug); }
    for (var rough     of this.rough     ) { rough    .draw(ctx, debug); }
    for (var attractor of this.attractors) { attractor.draw(ctx, debug); }
    for (var repulsor  of this.repulsors ) { repulsor .draw(ctx, debug); }

    this.hub.draw(ctx, debug)

    for (var agent     of this.agents    ) { agent    .draw(ctx, debug); }
  }
}

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
