class BaitBombGhost
{
  constructor()
  {
    cursors.placeBaitBomb.addEventListener('mousemove', this.onMouseMove.bind(this));
    cursors.placeBaitBomb.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.cursorCoords = {x: null, y: null};
    this.active = false;
  }

  draw(ctx, debug = false)
  {
    if (!this.active)
      return;

    var fill, stroke, radius;

    if (cursors.placeBaitBomb.mode == CursorPlaceBaitBomb.MODE_BAIT)
    {
      fill   = Attractor.FILL_STYLE;
      stroke = Attractor.STROKE_STYLE;
      radius = Attractor.RADIUS;
    }
    else
    {
      fill   = Repulsor.FILL_STYLE;
      stroke = Repulsor.STROKE_STYLE;
      radius = Repulsor.RADIUS;
    }

    ctx.save();

    ctx.globalAlpha = 0.2;
    ctx.translate(this.cursorCoords.x, -this.cursorCoords.y);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2, false);
    ctx.fill();

    ctx.stroke();

    ctx.restore();
  }

  onMouseMove(e)
  {
    if (!this.active)
      this.active = true;

    let worldRelative = world.canvasToWorldCoords(e.offsetX, e.offsetY);
    this.cursorCoords.x = worldRelative.x;
    this.cursorCoords.y = worldRelative.y;
  }

  onMouseDown(e)
  {
    let worldRelative = world.canvasToWorldCoords(e.offsetX, e.offsetY);
    var entityType = (cursors.placeBaitBomb.mode == CursorPlaceBaitBomb.MODE_BAIT) ? 'attractor' : 'repulsor';
    socket.emit('input', {type: entityType, x: worldRelative.x, y: worldRelative.y});
    this.active = false;
    ui.setActiveCursor(cursors.default);
  }
}

class RadialControl
{
   constructor()
   {
      this.directions = [];
      this.drag = {active: false, handle: null};

      for (let i = 0; i < (360 / 5); i++)
      {
         var rad = (Math.PI/180) * (i * 5);
         this.directions[i] =
         {
            val: 1,
            x: RadialControl.RADIUS_SCALE * Math.cos(rad),
            y: RadialControl.RADIUS_SCALE * Math.sin(rad), // drawing to world coords
            r: rad
         };
      }

      cursors.default.addEventListener('mousemove', this.startHandleHover.bind(this));
      cursors.radialDrag.addEventListener('mousemove', this.onMouseMove.bind(this));
      cursors.radialDrag.addEventListener('mousedown', this.onMouseDown.bind(this));
      cursors.radialDrag.addEventListener('mouseup', this.onMouseUp.bind(this));
   }

   draw(ctx, debug = false)
   {
      ctx.save();

      ctx.translate(0, 0);
      ctx.save();

      ctx.beginPath();

      for (let i of this.directions)
      {
         ctx.lineTo(i.x, -i.y);
         //ctx.rotate( (Math.PI / 180) * 5 );
      }

      ctx.strokeStyle = RadialControl.LINE_COLOUR;
      ctx.stroke();

      ctx.restore();
      ctx.fillStyle = RadialControl.HANDLE_COLOUR;

      for (let i of this.directions)
      {
         ctx.beginPath();
         ctx.arc(i.x, -i.y, 3, 0, 2 * Math.PI, false);
         ctx.fill();
         //ctx.rotate( (Math.PI / 180) * 5 );
      }

      ctx.restore();
   }

   reset()
   {
      for (let i = 0; i < (360 / 5); i++)
         this.directions[i] = 1;
   }

   startHandleHover(e)
   {
      if (this.checkHandleHover(e).isHovering)
         ui.requestActiveCursor(cursors.radialDrag);
   }

   onMouseDown(e)
   {
      var hoverInfo = this.checkHandleHover(e);

      if (hoverInfo.isHovering)
      {
         this.drag.active = true;
         this.drag.handle = hoverInfo.handle;
      }
   }

   onMouseMove(e)
   {
      if (!this.drag.active)
      {
         if (!this.checkHandleHover(e).isHovering)
            ui.setActiveCursor(cursors.default);
      }
      else
      {
         var worldRelative = world.canvasToWorldCoords(e.offsetX, e.offsetY);
         var angle = Math.atan2(worldRelative.y, worldRelative.x);
         var magnitude = Math.sqrt(Math.pow(worldRelative.x, 2) + Math.pow(worldRelative.y, 2));

         if (angle < 0)
         {
            angle += Math.PI*2;
         }

         var component = this.computeMouseComponent(worldRelative, this.drag.handle);

         if (component < 0.1 * RadialControl.RADIUS_SCALE)
         {
            component = 0.1 * RadialControl.RADIUS_SCALE
         }
         else if (component > 3.0 * RadialControl.RADIUS_SCALE)
         {
            component = 3.0 * RadialControl.RADIUS_SCALE;
         }

         this.drag.handle.val = component / RadialControl.RADIUS_SCALE;
         this.drag.handle.x = component * Math.cos(this.drag.handle.r);
         this.drag.handle.y = component * Math.sin(this.drag.handle.r);

         socket.emit('input', {type:'radialControl', state: this.directions, id: clientId});
      }
   }

   onMouseUp(e)
   {
      if (this.drag.active)
      {
         this.drag.active = false;
         this.drag.point = null;
      }
   }

   checkHandleHover(e)
   {
      // e is the event object, offsetX and offsetY is the canvas-relative cursor coords
      // (0, 0) it top-left
      for (let i of this.directions)
      {
         var worldRelative = world.canvasToWorldCoords(e.offsetX, e.offsetY);
         var box = {left: i.x - 5, top: i.y - 5, right: i.x + 5, bottom: i.y + 5};

         if (worldRelative.x >= box.left && worldRelative.x <= box.right && worldRelative.y >= box.top && worldRelative.y <= box.bottom)
         {
            return {isHovering: true, handle: i};
         }
      }

      return {isHovering: false, handle: null};
   }

   computeMouseComponent(mouseCoords, handle)
   {
      var handleVector = {x: Math.cos(handle.r), y: -Math.sin(handle.r)};
      var mouseMagnitude = Math.sqrt(Math.pow(mouseCoords.x, 2) + Math.pow(mouseCoords.y, 2));
      var mouseAngle = Math.atan2(mouseCoords.y, mouseCoords.x);

      var component = mouseMagnitude * Math.cos(mouseAngle - handle.r);

      return component;
   }
}

RadialControl.RADIUS_SCALE = 100;
RadialControl.LINE_COLOUR = '#b53b3b';
RadialControl.HANDLE_COLOUR = '#d14545';

class SelectionBoxes
{
   constructor()
   {
      cursors.default.addEventListener('mousedown', function(e) { ui.clearSelectedAgents(); });
   }

   draw(ctx, debug = false)
   {
      if (ui.agentsSelected() == 0)
         return;

      ctx.save();

      for (let agent of world.agents)
      {
         if (ui.isAgentSelected(agent.id))
         {
            ctx.save();
            ctx.translate(agent.x, agent.y);

           // also draw a neat little selection box around the agent if it's selected

           var outlineXy = (bee.width > bee.height) ? bee.width : bee.height;
           // move 7px up and left from agent's centre
           ctx.translate(-outlineXy/2 - 3, -outlineXy/2 - 3);
           ctx.strokeStyle = "rgb(24, 215, 255)";

           // draw a rectangle from origin (agent centre - (7px, 7px), to agent
           // centre + (7px, 7px) )
           ctx.strokeRect(0, 0, outlineXy + 3, outlineXy + 3);
           ctx.restore();
         }
      }

      ctx.restore();
   }
}

class SelectionRect
{
   constructor()
   {
      this.active = false;
      this.x = 0;
      this.y = 0;
      this.width = 0;
      this.height = 0;

      cursors.default  .addEventListener('mousedown', this.onMouseDown.bind(this));
      cursors.selecting.addEventListener('mousemove', this.onMouseMove.bind(this));
      cursors.selecting.addEventListener('mouseup'  , this.onMouseUp  .bind(this));
   }

   draw(ctx, debug = false)
   {
      if (!this.active)
         return;

      ctx.save();

      ctx.fillStyle = "rgba(60, 181, 249, 0.2)";
      ctx.strokeStyle = "rgb(60, 181, 249)";
      ctx.lineWidth = 1;

      // Reset the context to canvas top-left because we have canvas-relative
      // coordinates already
      ctx.translate(-world.x_limit, -world.y_limit);
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.strokeRect(this.x, this.y, this.width, this.height);

      ctx.restore();
   }

   onMouseDown(e)
   {
      // initialise the selection rectangle
      this.active = true;
      this.x = e.offsetX; // these coords are relative to the canvas
      this.y = e.offsetY;

      // default height and width
      this.width = 1;
      this.height = 1;

      ui.setActiveCursor(cursors.selecting);
   }

   onMouseMove(e)
   {
      this.width  = e.offsetX - this.x;
      this.height = e.offsetY - this.y;
   }

   onMouseUp(e)
   {
      ui.setActiveCursor(cursors.default);

      this.active = false
      this.computeSelectedAgents();

      this.x = this.y = this.width = this.height = 0;
   }

   computeSelectedAgents()
   {
      var selectBounds = {};
      var selectedAgentIDs = [];

      selectBounds.left   = (this.width  > 0) ? this.x               : this.x + this.width;
      selectBounds.right  = (this.width  > 0) ? this.x + this.width  : this.x;
      selectBounds.top    = (this.height > 0) ? this.y               : this.y + this.height;
      selectBounds.bottom = (this.height > 0) ? this.y + this.height : this.y;

      selectBounds.left   -= world.x_limit;
      selectBounds.right  -= world.x_limit;
      selectBounds.top    -= world.y_limit;
      selectBounds.bottom -= world.y_limit;

      for (var agent of world.agents)
      {
         var agentBounds =
         {
            left: agent.x - 5,
            right: agent.x + 5,
            top: agent.y - 5,
            bottom: agent.y + 5
         };

         if (this.rectIntersect(agentBounds, selectBounds))
         {
            selectedAgentIDs.push(agent.id);
         }
      }

      ui.addSelectedAgents(selectedAgentIDs);
   }

   rectIntersect(a, b)
   {
      return !(b.left > a.right || b.right < a.left || b.top > a.bottom || b.bottom < a.top);
   }
}

class Cursor
{
   constructor()
   {
      this.active = false;
      this.events = {};
      this.display = null;
      this.type = null;
   }

   addEventListener(event, listener)
   {
      if (this.events[event] == undefined)
         this.events[event] = [];

      this.events[event].push(listener);

      if (this.active)
         canvas.addEventListener(event, listener);

      return this;
   }

   // TODO: need a nice, fast way to remove a specific listener
   /*removeEventListener(event, listener)
   {
      listenerArray = this.events[event];

      if (listenerArray !== undefined)
      {
         var index = listenerArray.indexOf(listener);

      }
   }*/

   activate()
   {
      this.active = true;

      for (let [event, listeners] of Object.entries(this.events))
         for (let listener of listeners)
            canvas.addEventListener(event, listener);

      canvas.style.cursor = this.display;

      return this;
   }

   deactivate()
   {
      this.active = false;

      for (let [event, listeners] of Object.entries(this.events))
         for (var listener of listeners)
            canvas.removeEventListener(event, listener);

      canvas.style.cursor = "auto";

      return this;
   }
}

class CursorDefault extends Cursor
{
   constructor()
   {
      super();
      this.type = "default";
      this.display = 'default';
   }
}

class CursorPlaceBaitBomb extends Cursor
{
  constructor()
  {
    super();
    this.type = "placeBaitBomb";
    this.display = "crosshair";
    this.mode = null;
  }

  // takes one of the MODE constants below, don't break please!
  // weakly typed languages smh
  setMode(mode)
  {
    this.mode = mode;
  }
}

CursorPlaceBaitBomb.MODE_BAIT = 0
CursorPlaceBaitBomb.MODE_BOMB = 1

class CursorRadialDrag extends Cursor
{
   constructor()
   {
      super();
      this.type = "radialDrag";
      this.display = 'move';
   }
}

class CursorSelecting extends Cursor
{
   constructor()
   {
      super();
      this.type = "selecting";
      this.display = "default";
   }
}

var baitButton = document.getElementById('buttonBugBait');
var bombButton = document.getElementById('buttonBugBomb');

baitButton.addEventListener('click', function()
{
  cursors.placeBaitBomb.setMode(CursorPlaceBaitBomb.MODE_BAIT);
  ui.setActiveCursor(cursors.placeBaitBomb);
});

bombButton.addEventListener('click', function()
{
  cursors.placeBaitBomb.setMode(CursorPlaceBaitBomb.MODE_BOMB);
  ui.setActiveCursor(cursors.placeBaitBomb);
});

var buttonDebugParams = document.getElementById("buttonUpdateDebugParams");

buttonDebugParams.addEventListener("click", function(e)
{
   var paramObj = {};

   var paramArray = $("#debugParams input").serializeArray();

   for (let param of paramArray)
   {
      paramObj[param.name] = param.value;
   }

   socket.emit('input', {'type': 'parameterUpdate', params: paramObj});
})

var buttonPausePlay = document.getElementById('buttonPausePlay');
var isPaused = false;

buttonPausePlay.addEventListener('click', function(e)
{
   if (isPaused)
   {
      socket.emit('input', {type: 'play'});
      buttonPausePlay.innerHTML = "Pause";
      isPaused = false;
   }
   else
   {
      socket.emit('input', {type: 'pause'});
      buttonPausePlay.innerHTML = "Play";
      isPaused = true;
   }
});

var buttonRestart = document.getElementById('buttonRestart');

buttonRestart.addEventListener('click', function()
{
  socket.emit('input', {type: 'restart'});
});

const checkbox = document.getElementById('checkboxDebug');

checkbox.addEventListener('change', function(e)
{
   if (e.target.checked)
   {
      $('.debug').show();
      debug = true;
   }
   else
   {
      $('.debug').hide();
      debug = false;
   }
});

class UI
{
   constructor()
   {
      this.selectedAgents = {};
      this.selectedNumber = 0;
      this.guiElems = [];

      this.guiElems.push( new SelectionBoxes() );
      this.guiElems.push( new SelectionRect()  );
      this.guiElems.push( new RadialControl()  );
      this.guiElems.push( new BaitBombGhost()  );

      this.activeCursor = cursors.default.activate();
   }

   draw(ctx, debug = false)
   {
     for (let element of this.guiElems)
      element.draw(ctx, debug);
   }

   setActiveCursor(cursor)
   {
      if (!(cursor instanceof Cursor))
         throw new Error('Active cursor can only be set to a Cursor object');

      this.activeCursor.deactivate();
      this.activeCursor = cursor;
      this.activeCursor.activate();
   }

   requestActiveCursor(cursor)
   {
      if (this.activeCursor.type == "default")
      {
         this.setActiveCursor(cursor);
      }
   }

   agentsSelected()
   {
      return this.selectedNumber;
   }

   addSelectedAgents(ids)
   {
      this.selectedNumber += ids.length;

      for (var id of ids)
         this.selectedAgents[id] = true;
   }

   clearSelectedAgents()
   {
      this.selectedAgents = {};
      this.selectedNumber = 0;
   }

   isAgentSelected(id)
   {
      if (this.selectedAgents[id])
         return true;
   }


}

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

    ctx.translate(this.x, -this.y);
    ctx.fillStyle = Attractor.FILL_STYLE;
    ctx.strokeStyle = Attractor.STROKE_STYLE;

    ctx.beginPath();
    ctx.arc(0, 0, Attractor.RADIUS, 0, Math.PI * 2, false);
    ctx.fill();

    ctx.stroke();

    ctx.restore();
  }
}

Attractor.FILL_STYLE = "rgba(0, 255, 0, 0.5)";
Attractor.STROKE_STYLE = "rgb(0, 255, 0)";
Attractor.RADIUS = 40; // really ought to get this passed to us from the engine

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

    ctx.translate(this.x, -this.y);
    ctx.fillStyle = Repulsor.FILL_STYLE;
    ctx.strokeStyle = Repulsor.STROKE_STYLE;

    ctx.beginPath();
    ctx.arc(0, 0, Repulsor.RADIUS, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

Repulsor.FILL_STYLE = "rgba(255, 0, 0, 0.5)";
Repulsor.STROKE_STYLE = "rgb(255, 0, 0)";
Repulsor.RADIUS = 40;

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
     return {x: (x - this.x_limit), y: -(y - this.y_limit)};
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

   // TODO: work this in to the rest of the UI refactor
   /*for (var agent of world.agents)
   {
      if (selectedAgents[agent.id])
      {
         // Find an update all the information elements we created in the
         // selection process
         document.getElementById(`x${agent.id}`).innerHTML = Math.round(agent.x);
         document.getElementById(`y${agent.id}`).innerHTML = Math.round(agent.y);
         document.getElementById(`state${agent.id}`).innerHTML = agent.state;
      }
   }*/
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
