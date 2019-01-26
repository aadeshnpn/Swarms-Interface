/*
1. lookup event listener for scroll                                                             -done
2. make a new function on scroll line -- copy line 15 and replace the function type             -done
3. add new member to object called "radius" similar to line 17, initialize to 40                -done
4. in on-scroll function you made, loopup details of event --mozilla docu. for scroll events    -done
to find out if scrolling up is positive value or whatver                                        -done
5. in the draw routine, replace radius (currently line 59) with the new member                  -done
6. on onmousedowbn, replace hard coded radius with object member

*/



class BaitBombGhost
{
  constructor(ui)
  {
    cursors.placeBaitBomb.addEventListener('mousemove', this.onMouseMove.bind(this));
    cursors.placeBaitBomb.addEventListener('mousedown', this.onMouseDown.bind(this)); //the this-this syntax is to help js be oo
    cursors.placeBaitBomb.addEventListener('wheel', this.onWheel.bind(this));
    this.cursorCoords = {x: null, y: null};
    this.radius = 40;
    this.active = false;

    ui.register('restart', this.reset.bind(this));
  }

  update()
  {
     // no-op
  }

  draw(ctx, debug = false)
  {
    if (!this.active)
      return;

    var fill, stroke;  //kill radius -- should I bnot replace it with this.radius?

    if (cursors.placeBaitBomb.mode == CursorPlaceBaitBomb.MODE_BAIT)
    {
      fill   = Attractor.FILL_STYLE;
      stroke = Attractor.STROKE_STYLE;
    }
    else
    {
      fill   = Repulsor.FILL_STYLE;
      stroke = Repulsor.STROKE_STYLE;
    }

    ctx.save();

    ctx.globalAlpha = 0.2;
    ctx.translate(this.cursorCoords.x, -this.cursorCoords.y);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);  //change to object memeber --is that correct?
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

  onMouseDown(e) //I don't see radius here to change for #6
  {
    let worldRelative = world.canvasToWorldCoords(e.offsetX, e.offsetY);
    var entityType = (cursors.placeBaitBomb.mode == CursorPlaceBaitBomb.MODE_BAIT) ? 'attractor' : 'repulsor';
    socket.emit('input', {type: entityType, x: worldRelative.x, y: worldRelative.y, radius: this.radius});
    this.active = false;
    ui.setActiveCursor(cursors.default);
  }

  onWheel(e)
  {
    this.radius = Math.max(1, this.radius + (e.deltaY / -10)); //not sure how to put the dynamic part.
    e.preventDefault();
  }

  reset()
  {
    this.cursorCoords = {x: null, y: null};
    this.active = false;
  }
}

class MissionLayer
{
  constructor(ui)
  {
    this.points = [];

    ui.register('updateMission', this.update.bind(this));
    ui.register('restart',       this.reset.bind(this));
  }

  update(data)
  {
    this.points.push(data);

    // this can really slow down the ui if it gets out of hand
    if (this.points.length > 200)
      this.points.shift();
  }

  draw(ctx, debug = false)
  {
    ctx.save();

    for (let point of this.points)
    {
      var rVal = (point.q > 0.5) ? (1.0 - point.q) * 2 : 1.0;
      var gVal = (point.q > 0.5) ? 1.0 : point.q * 2;

      ctx.fillStyle   = `rgba(${Math.round(255 * rVal)}, ${Math.round(255 * gVal)}, 70, 0.8)`;
      ctx.strokeStyle = "rgb(20, 20, 20)";

      ctx.beginPath();
      ctx.arc(point.x, -point.y, 5, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  reset()
  {
     this.points = [];
  }
}

class Handle
{
   constructor(angle, {interactive = true, colour = RadialControl.LINE_COLOUR} = {})
   {
      this.interactive = interactive;
      this.colour = colour;
      this.actual = null;
      this.requested = null;
      this.r = angle * Math.PI/180;
      this.deg = angle;
      this.actualX = null;
      this.actualY = null;
      this.requestedX = null;
      this.requestedY = null;
      this.prev = null;
      this.next = null;
      this.isRequesting = false;
   }

   setPrev(handle)
   {
      this.prev = handle;
   }

   setNext(handle)
   {
      this.next = handle;
   }

   updateRequested(value)
   {
      this.isRequesting = true;
      this.requested = value;
      this.requestedX = Math.cos(this.r) * (RadialControl.RADIUS_SCALE * this.beeNumberToRadiusScale(value));
      this.requestedY = Math.sin(this.r) * (RadialControl.RADIUS_SCALE * this.beeNumberToRadiusScale(value));
   }

   updateActual(value = 0)
   {
      this.actual = value;

      this.actualX = Math.cos(this.r) * (RadialControl.RADIUS_SCALE * this.beeNumberToRadiusScale(value));
      this.actualY = Math.sin(this.r) * (RadialControl.RADIUS_SCALE * this.beeNumberToRadiusScale(value));

      if (this.isRequesting && value == this.requested)
      {
         this.isRequesting = false;
      }

      if (!this.isRequesting)
      {
         this.requested = this.actual;
         this.requestedX = this.actualX;
         this.requestedY = this.actualY;
      }
   }

   draw(ctx, debug = false)
   {
      ctx.save()

      ctx.strokeStyle = this.colour;

      ctx.beginPath();
      ctx.moveTo(this.prev.actualX, -this.prev.actualY);
      ctx.lineTo(this.actualX, -this.actualY);
      ctx.lineTo(this.next.actualX, -this.next.actualY);
      ctx.stroke();

      if (this.actual != this.requested)
      {
         ctx.setLineDash([5, 5]);
         ctx.strokeStyle = "red";
         ctx.beginPath();
         ctx.moveTo(this.prev.requestedX, -this.prev.requestedY);
         ctx.lineTo(this.requestedX, -this.requestedY);
         ctx.lineTo(this.next.requestedX, -this.next.requestedY);
         ctx.stroke();

         ctx.fillStyle = "red";

         ctx.beginPath();
         ctx.arc(this.requestedX, -this.requestedY, 3, 0, 2 * Math.PI, false);
         ctx.fill();
      }
      else if (this.interactive)
      {
         ctx.fillStyle = this.colour;

         ctx.beginPath();
         ctx.arc(this.requestedX, -this.requestedY, 2, 0, 2 * Math.PI, false);
         ctx.fill();
      }

      ctx.restore();
   }

   beeNumberToRadiusScale(number)
   {
      // KLUDGE FOR WHEN WORLD HASN'T BEE LOADED
      // TODO: handle this properly
      try
      {
         let ratio = Math.min(number / world.agents.length, 1);
         return (ratio * (RadialControl.MAX_AGENT_SCALE - 1)) + 1;
      }
      catch (e)
      {
         console.log(e.message);
      }
   }

   isHovered(x, y)
   {
      var box = {left: this.requestedX - 5, top: this.requestedY - 5, right: this.requestedX + 5, bottom: this.requestedY + 5};

      if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom)
         return true;
      else
         return false;
   }
}

class RadialControl
{
   constructor(ui, {interactive = true, colour = RadialControl.LINE_COLOUR, dataset = "agentDirections"} = {})
   {
      this.interactive  = interactive;
      this.colour       = colour;
      this.dataset      = dataset;

      this.handles = [];
      this.drag = {active: false, handle: null};
      this.hover = {active: true, handle: null};

      for (let i = 0; i < (360 / 5); i++)
      {
         this.handles.push( new Handle(i * 5, {interactive: this.interactive, colour: this.colour}) ); // we're doing it this way so eventually we can paramaterise the 5
      }

      this.handles[0].setPrev(this.handles[this.handles.length - 1])
      this.handles[0].setNext(this.handles[1]);

      for (let i = 1; i < this.handles.length; i++)
      {
         // this only works because js lets you do negative array indices
         this.handles[i].setPrev(this.handles[(i - 1) % this.handles.length]);
         this.handles[i].setNext(this.handles[(i + 1) % this.handles.length]);
      }

      if (this.interactive)
      {
        cursors.default.addEventListener('mousemove', this.startHandleHover.bind(this));
        cursors.radialDrag.addEventListener('mousemove', this.onMouseMove.bind(this));
        cursors.radialDrag.addEventListener('mousedown', this.onMouseDown.bind(this));
        cursors.radialDrag.addEventListener('mouseup', this.onMouseUp.bind(this));
      }

      ui.register("updateRadial", this.update.bind(this));
      ui.register("restart", this.reset.bind(this));
   }

   update(data)
   {
      // data is an array[72] of direction information for every five degrees

      for (let i = 0; i < (360 / 5); i++)
         this.handles[i].updateActual(data.controller[this.dataset][i]);
   }

   draw(ctx, debug = false)
   {
      for (let h of this.handles)
      {
         h.draw(ctx, debug);
      }
   }

   startHandleHover(e)
   {
      let worldRelative = world.canvasToWorldCoords(e.offsetX, e.offsetY);

      for (let h of this.handles)
         if (h.isHovered(worldRelative.x, worldRelative.y))
         {
            this.hover = {active: true, handle: h};
            ui.requestActiveCursor(cursors.radialDrag);
            break;
         }
   }

   onMouseDown(e)
   {
      this.drag.active = true;
      this.drag.handle = this.hover.handle;
      this.hover.active = false;
      this.hover.handle = null;
   }

   onMouseUp(e)
   {
      if (this.drag.active)
      {
         this.drag.active = false;
         this.drag.handle = null;
      }
   }

   onMouseMove(e)
   {
      let worldRelative = world.canvasToWorldCoords(e.offsetX, e.offsetY);

      if (!this.drag.active)
      {
         if (this.hover.active && !this.hover.handle.isHovered(worldRelative.x, worldRelative.y))
         {
            ui.setActiveCursor(cursors.default);
            this.hover.active = false;
            this.hover.handle = null;
         }
      }
      else
      {
         var angle = Math.atan2(worldRelative.y, worldRelative.x);
         var magnitude = Math.sqrt(Math.pow(worldRelative.x, 2) + Math.pow(worldRelative.y, 2));

         if (angle < 0)
         {
            angle += Math.PI*2;
         }

         var component = this.computeMouseComponent(worldRelative, this.drag.handle);

         if (component < 1 * RadialControl.RADIUS_SCALE)
         {
            component = 1 * RadialControl.RADIUS_SCALE
         } //else if(component <)
         else if (component > RadialControl.MAX_AGENT_SCALE * RadialControl.RADIUS_SCALE)
         {
            component = RadialControl.MAX_AGENT_SCALE * RadialControl.RADIUS_SCALE;
         }

         let adjustedComponent = (RadialControl.MAX_AGENT_SCALE / (RadialControl.MAX_AGENT_SCALE - 1)) * (component - 50);
         this.drag.handle.updateRequested( Math.round( adjustedComponent / (RadialControl.RADIUS_SCALE * RadialControl.MAX_AGENT_SCALE) * world.agents.length ))

         //this.drag.handle.val = (component / RadialControl.RADIUS_SCALE) * 10;
         //this.drag.handle.x = component * Math.cos(this.drag.handle.r);
         //this.drag.handle.y = component * Math.sin(this.drag.handle.r);

         socket.emit('input',
         {
            type: 'radialControl',
            state:
            {
               r: this.drag.handle.r,
               deg: this.drag.handle.deg,
               val: this.drag.handle.requested
            },
            id: clientId});
      }
   }

   onMouseUp(e)
   {
      this.drag.active = false;
      this.drag.handle = null;
      ui.setActiveCursor(cursors.default);
   }

   computeMouseComponent(mouseCoords, handle)
   {
      var handleVector = {x: Math.cos(handle.r), y: -Math.sin(handle.r)};
      var mouseMagnitude = Math.sqrt(Math.pow(mouseCoords.x, 2) + Math.pow(mouseCoords.y, 2));
      var mouseAngle = Math.atan2(mouseCoords.y, mouseCoords.x);

      var component = mouseMagnitude * Math.cos(mouseAngle - handle.r);

      return component;
   }

   reset()
   {
      this.handles = [];
      this.drag = {active: false, handle: null};
      this.hover = {active: true, handle: null};

      for (let i = 0; i < (360 / 5); i++)
      {
         this.handles.push( new Handle(i * 5, {interactive: this.interactive, colour: this.colour}) ); // we're doing it this way so eventually we can paramaterise the 5
      }

      this.handles[0].setPrev(this.handles[this.handles.length - 1])
      this.handles[0].setNext(this.handles[1]);

      for (let i = 1; i < this.handles.length; i++)
      {
         // this only works because js lets you do negative array indices
         this.handles[i].setPrev(this.handles[(i - 1) % this.handles.length]);
         this.handles[i].setNext(this.handles[(i + 1) % this.handles.length]);
      }
   }
}

/*class RadialControl
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
            r: rad,
            deg: (i * 5)
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

         this.drag.handle.val = (component / RadialControl.RADIUS_SCALE) * 10;
         this.drag.handle.x = component * Math.cos(this.drag.handle.r);
         this.drag.handle.y = component * Math.sin(this.drag.handle.r);

         socket.emit('input', {type:'radialControl', state: this.drag.handle, id: clientId});
      }
   }

   onMouseUp(e)
   {
      if (this.drag.active)
      {
         this.drag.active = false;
         this.drag.handle = null;
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
}*/

// If 100% of the agents are going in a direction, that point will have distance of MAX_AGENT_SCALE * RADIUS_SCALE
RadialControl.MAX_AGENT_SCALE = 10.0;
RadialControl.RADIUS_SCALE = 50;
RadialControl.LINE_COLOUR = 'blue';
RadialControl.HANDLE_COLOUR = 'blue';

class SelectionBoxes
{
   constructor()
   {
      cursors.default.addEventListener('mousedown', function(e) { ui.clearSelectedAgents(); });
   }

   update()
   {
      // no-op
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
   constructor(ui)
   {
      this.active = false;
      this.x = 0;
      this.y = 0;
      this.width = 0;
      this.height = 0;

      cursors.default  .addEventListener('mousedown', this.onMouseDown.bind(this));
      cursors.selecting.addEventListener('mousemove', this.onMouseMove.bind(this));
      cursors.selecting.addEventListener('mouseup'  , this.onMouseUp  .bind(this));

      ui.register('restart', this.reset.bind(this));
   }

   update()
   {
      // no-op
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

   reset()
   {
      this.active = false;
      this.x = 0;
      this.y = 0;
      this.width = 0;
      this.height = 0;
   }
}

class StateBubbles
{
  constructor(ui)
  {
    this.states = {};
    this.totalAgentsInStates = 0;
    this.initialised = false

    ui.register("setStates", this.init.bind(this));
    ui.register("stateCounts", this.update.bind(this));
    ui.register("restart", this.restart.bind(this));

    socket.emit("input", {"type": "requestStates"});
  }

  init(json)
  {
    for (let name of json.states)
    {
      this.states[name] = {count: 0, radius: 0};
    }

    this.initialised = true;
  }

  update(json)
  {
    this.totalAgentsInStates = 0

    for (let [state, count] of Object.entries(json))
    {
      if (this.states[state])
      {
        this.states[state].count = count;
        this.totalAgentsInStates += count;
      }
    }

    for (let [name, state] of Object.entries(this.states))
    {
      state.radius = state.count / this.totalAgentsInStates * StateBubbles.MAX_RADIUS;

      if (state.radius < StateBubbles.MIN_RADIUS)
        state.radius = StateBubbles.MIN_RADIUS;
    }
  }

  restart()
  {
    this.states = {};
    this.totalAgentsInStates = 0;
    this.initialised = false;

    socket.emit("input", {"type": "requestStates"});
  }

  draw(ctx, debug = false)
  {
    if (!this.initialised)
      return;

    //let bubblesWidth = Object.values(this.states).reduce((sum, state) => {return sum + state.radius + StateBubbles.BUBBLE_SPACING}, 0);
    //console.log(bubblesWidth);
    let x = -world.x_limit + StateBubbles.BUBBLE_SPACING;
    let y = world.y_limit - StateBubbles.MAX_RADIUS - StateBubbles.LABEL_SPACING;

    //let x, y = [0, 0];
    //let x = 0;

    ctx.save();
    ctx.translate(x, y);

    x = 0;

    for (let [name, state] of Object.entries(this.states))
    {
      x += state.radius;

      ctx.fillStyle = "rgb(108, 163, 252)";
      ctx.beginPath();
      ctx.arc(x, 0, state.radius, 0, Math.PI * 2, false);
      ctx.fill();

      ctx.font = "8pt sans-serif";
      ctx.fillStyle = "rgb(0, 0, 0)";
      let width = ctx.measureText(`${name}/${state.count}`).width;
      //let name1 = name[0].toUpperCase();
      ctx.fillText(`${name}/${state.count}`, x-width/2, StateBubbles.LABEL_SPACING);

      x += state.radius + StateBubbles.BUBBLE_SPACING;
    }

    ctx.restore();
  }
}

StateBubbles.MAX_RADIUS = 20;
StateBubbles.MIN_RADIUS = 2;
StateBubbles.BUBBLE_SPACING = 40; // in px
StateBubbles.LABEL_SPACING = 30;

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

class beeCounter
{
   constructor(ui)
   {
      ui.register('updateRadial', this.update.bind(this));
      this.dead = 0
   }
   update(data)
   {
       if(data.controller['dead']!=this.dead){
            this.dead = data.controller['dead'];
            document.getElementById("deadBees").innerHTML = "Estimated Dead: " + this.dead.toString();
       }
   }
}




class DebugParams
{
   constructor(ui)
   {
      this.buttonDebugParams = document.getElementById("buttonUpdateDebugParams");
      ui.register('updateDebugParams', this.update.bind(this));

      this.buttonDebugParams.addEventListener("click", function(e)
      {
         var paramObj = {};

         var paramArray = $("#debugParams input").serializeArray();

         for (let param of paramArray)
         {
            paramObj[param.name] = param.value;
         }

         socket.emit('input', {'type': 'parameterUpdate', params: paramObj});
      });

      socket.emit('input', {'type': 'requestParams'});
   }

   update(data)
   {
      for (let [param, val] of Object.entries(data.parameters))
      {
         $(`#debugParams input[name=${param}]`).val(val);
      }
   }
}

class DebugTable
{
   constructor(ui)
   {
      ui.register('update', this.update.bind(this));

      // Hard code to make sure id, x, and y always appear first in the headers
      var infoTableHeaders = $('#infoTableHeaders')
      infoTableHeaders.append(`<th id='id'>ID</th>`);
      infoTableHeaders.append(`<th id='x'>X</th>`);
      infoTableHeaders.append(`<th id='y'>Y</th>`);
   }

   update(data)
   {
      if (ui.agentsSelected() === 0)
      {
         $('#infoTable').hide();
      }
      else {
         $('#infoTable').show();

         // If there are more rows than selected agents, an agent must have died
         // It won't appear in the data, so we have to clean up manually
         if ($('#infoTable .agentInfo').length > ui.agentsSelected())
         {
            // Throw out the whole thing--probably cheaper than checking each row against each agent
            $('#infoTable .agentInfo').remove();
         }

         for (var agent of data.agents)
         {
            if (ui.isAgentSelected(agent.id))
            {
               for (var [prop, val] of Object.entries(agent))
               {
                  // We don't have a header for this property, so create it
                  if (!$(`#infoTableHeaders #${prop}`).length)
                  {
                     let prettyProp = this.beautifyProp(prop);
                     $(`#infoTableHeaders`).append(`<th id='${prop}'>${prettyProp}</th>`);
                  }

                  // This agent doesn't have a row in our debug table, so create one
                  if (!$(`#agentInfo${agent.id}`).length)
                  {
                     let row = $(document.createElement('tr'));
                     row.attr('id', `agentInfo${agent.id}`);
                     row.attr('class', 'agentInfo');

                     // Again, hardcode id, x, and y props--ugly, but since the data
                     // is just an unorganized blob of JSON, there is no other way
                     // to guarantee a particular order
                     row.append(`<td id='id${agent.id}'></td>`);
                     row.append(`<td id='x${agent.id}' class='agentCoord'></td>`);
                     row.append(`<td id='y${agent.id}' class='agentCoord'></td>`);
                     $('#infoTable').append(row);
                  }

                  // A place for this specific property for this specific agent doesn't exist, create one
                  if (!$(`#${prop}${agent.id}`).length)
                  {
                     $(`#agentInfo${agent.id}`).append(`<td id='${prop}${agent.id}'></td>`);
                  }

                  // Potential site is treated specially, since it's an array
                  if (prop === 'potential_site' && val != null)
                  {
                     val = val[0].toFixed(2) + ", " + val[1].toFixed(2);
                  }
                  if (typeof val === 'number')
                  {
                     val = val.toFixed(2);
                  }

                 $(`#${prop}${agent.id}`).html(val);
               }

            }
            else
            {
               // Agent isn't selected, remove its entry
               if ($(`#agentInfo${agent.id}`))
               {
                  $(`#agentInfo${agent.id}`).remove()
               }
            }
         }
      }
   }

   // This function takes in the ugly property name (which comes from python)
   // and turns it into something resembling words
   beautifyProp(prop)
   {
      // Split into words based on underscores and capitalize each word
      var tokens = prop.split("_");
      tokens.forEach(function(element, index, array)
      {
         array[index] = element.charAt(0).toUpperCase() + element.slice(1);
      });

      return tokens.join(" ");
   }

}

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

class SitePriorityMeters
{
   constructor(ui)
   {
      this.priorityMeters = $('#sitePriorityControls input');

      this.priorityMeters.on('change', function(e)
      {
         var priorityObj = {};

         var prioritiesSerialised = this.priorityMeters.serializeArray();

         for (let entry of prioritiesSerialised)
         {
            priorityObj[entry.name] = entry.value;
         }

         socket.emit('input', {type: 'priorityUpdate', sitePriorities: priorityObj});
      }.bind(this));

      ui.register('updateSitePriorities', this.update.bind(this));
   }

   update(data)
   {
      for (let [key, val] of Object.entries(data.controller.sitePriorities))
      {
         $(`#sitePriorityControls input[name=${key}]`).val(val);
      }
   }
}

const statesCheckbox = document.getElementById('checkboxStates');

statesCheckbox.addEventListener('change', function(e)
{
	showAgentStates = e.target.checked;
});

const debugCheckbox = document.getElementById('checkboxDebug');

debugCheckbox.addEventListener('change', function(e)
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

class UIParams
{
   constructor(ui)
   {
		var paramArray = $("#UIParams input");
		ui.register('updateUIParams', this.update.bind(this));

		paramArray.on("input", function(e)
		{
			var paramObj = {};

			var updatedParam = e.target;

			paramObj[updatedParam.name] = updatedParam.value || UIParams.defaults[updatedParam.name];

			socket.emit('input', {'type': 'UIParameterUpdate', params: paramObj});
		});

   }

   update(data)
   {
      for (let [param, val] of Object.entries(data.parameters))
      {
         $(`#UIParams input[name=${param}]`).val(val);
      }
   }
}

// have sane behaviour if the user clears the fps box
UIParams.defaults =
{
  "uiFps" : 1
}

class UI
{
   constructor()
   {
      this.selectedAgents = {};
      this.selectedNumber = 0;
      this.canvasElems = [];
      this.documentElems = [];
      this.eventCallbacks = {};

      this.canvasElems.push( new SelectionBoxes(this) );
      this.canvasElems.push( new SelectionRect (this) );
      this.canvasElems.push( new RadialControl (this) );
      this.canvasElems.push( new RadialControl (this, {interactive: false, colour: "green", dataset: "agentsIn"}) );
      this.canvasElems.push( new BaitBombGhost (this) );
      this.canvasElems.push( new MissionLayer  (this) );
      this.canvasElems.push( new StateBubbles  (this) );

      this.documentElems.push( new DebugParams       (this) );
      this.documentElems.push( new UIParams			  (this) );
      this.documentElems.push( new SitePriorityMeters(this) );
      this.documentElems.push( new DebugTable        (this) );
      this.documentElems.push(new beeCounter        (this))
      this.activeCursor = cursors.default.activate();

      this.register('restart', this.reset.bind(this));
   }

   register(event, callback)
   {
     if (!this.eventCallbacks[event])
        this.eventCallbacks[event] = [];

      this.eventCallbacks[event].push(callback);
   }

   on(msg)
   {
     for (let cb of this.eventCallbacks[msg.type])
        cb(msg.data);
   }

   // indiviual components now must register for any updates they want
   /*update(data)
   {
      for (let element of this.canvasElems)
         element.update(data);

      for (let element of this.documentElems)
         element.update(data);
   }*/

   draw(ctx, debug = false)
   {
     for (let element of this.canvasElems)
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
      {
         this.selectedAgents[id] = true;
      }

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

   reset()
   {
      this.clearSelectedAgents();
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
    this.qVal          =  agentJson.qVal;
    //this.signal        =  agentJson.signal;
    //this.signal_radius =  agentJson.signal_radius;
    Agent.stateColors  = {}
  }

  draw(ctx, debug = false, showAgentStates = false)
  {
    if (!debug)
      return;

    ctx.save();

    // move the drawing context to the agent's x and y coords
    ctx.translate(this.x, this.y);

    ctx.save();

    ctx.rotate(this.rotation);
    ctx.drawImage(bee, -bee.width/2, -bee.height/2);
    //ctx.save();
    //Need to draw signal around bee

    ctx.fillStyle   = `rgba(${Math.round(255 * 0.89)}, ${Math.round(255 * 0.1)}, 70, 0.8)`;
    ctx.strokeStyle = "rgb(30, 30, 30)";
    //ctx.translate(this.x, this.y);
    //ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, this.signal_radius/2, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();

    //ctx.

    if (showAgentStates && Agent.stateStyles[this.state] !== "" && Agent.stateStyles[this.state] !== undefined) {
       ctx.fillStyle = Agent.stateStyles[this.state];
       ctx.fillRect(-bee.width/2, -bee.height/2, bee.width, bee.height);
    }

    ctx.restore();

    ctx.restore();
  }
}

Agent.stateStyles = {
  'resting'    :'',                          // No coloring
  'exploring'  :'rgba(  0, 255,   0, 0.25)', // Green
  'observing'  :'rgba(  0,   0, 255, 0.25)', // Blue
  'site assess':'rgba(255,   0,   0, 0.25)', // Red
  'assessing'  :'rgba(255, 255,   0, 0.25)', // Yellow
  'dancing'    :'rgba(  0, 255, 255, 0.25)', // Cyan
  'piping'     :'rgba(255,   0, 255, 0.25)', // Magenta
  'commit'     :'rgba(255,  96,   0, 0.25)'  // Orange
}

class Attractor
{
  constructor(attractorJson)
  {
    this.x     = attractorJson.x;
    this.y     = attractorJson.y;
    this.timer = attractorJson.timer;
    this.radius= attractorJson.radius; //add a new property here -done
  }

  draw(ctx, debug = false) //then swap out hard coded radius for the dynamic
  //property you added above. Then consider working on adding user input for radius #done?
  {
    ctx.save();

    ctx.translate(this.x, -this.y);
    ctx.fillStyle = Attractor.FILL_STYLE;
    ctx.strokeStyle = Attractor.STROKE_STYLE;

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
    ctx.fill();

    ctx.stroke();

    ctx.restore();
  }
}

Attractor.FILL_STYLE = "rgba(0, 255, 0, 0.5)";
Attractor.STROKE_STYLE = "rgb(0, 255, 0)";

//attractor nerf
//1. add a new property to the python that will enable us to un-hard code the RADIUS
//2. we're going to add it to json so we can receive the dynamic RADIUS
//3. update the draw routine in js with the json data

class Cue
{
  // cue json format = [ x, y, radius]
  constructor(cueJson)
  {
    this.x      =  cueJson["x"];
    this.y      = -cueJson["y"]; // drawing coordinates have down as positive y
    this.radius =  cueJson["radius"];
    //this.q      =  siteJson["q_value"];
  }

  draw(ctx, debug = false)
  {
    if (!debug)
      return;

    //var rVal = (this.q > 0.5) ? (1.0 - this.q) * 2 : 1.0;
    //var gVal = (this.q > 0.5) ? 1.0 : this.q * 2;

    ctx.save();

    ctx.fillStyle   = `rgba(${Math.round(255 * 0.1)}, ${Math.round(255 * 0.9)}, 70, 0.8)`;
    ctx.strokeStyle = "rgb(20, 20, 20)";
    ctx.translate(this.x, this.y);

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();

    if (debug == true)
    {
      /*ctx.font = "14pt sans-serif";
      ctx.fillStyle = "rgb(0, 0, 0)";
      let width = ctx.measureText(`Site: ${this.q}`).width;
      ctx.fillText(`Site: ${this.q}`, -width/2, 20 + this.radius);*/
    }

    ctx.restore();
  }
}

class DeadAgent
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
    this.qVal          =  agentJson.qVal;
  }

  draw(ctx, debug = false)
  {
    if (!debug)
      return;

    ctx.save();

    // move the drawing context to the agent's x and y coords
    ctx.translate(this.x, this.y);

    ctx.save();

    ctx.rotate(this.rotation);
    ctx.drawImage(beeDead, -bee.width/2, -bee.height/2);

    ctx.restore();

    ctx.restore();
  }
}

class Debri
{
  constructor(debriJson)
  {
    this.x      =  debriJson["x"];
    this.y      = -debriJson["y"];
    this.radius =  debriJson["radius"];
  }

  draw(ctx, debug = false)
  {
    if (!debug)
      return;

    ctx.save();

    ctx.fillStyle = "rgb(122, 18, 18)";
    ctx.strokeStyle = "rgb(122, 18, 18)";
    ctx.translate(this.x, this.y);

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

class Food
{
  // cue json format = [ x, y, radius]
  constructor(foodJson)
  {
    this.x      =  foodJson["x"];
    this.y      = -foodJson["y"]; // drawing coordinates have down as positive y
    this.radius =  foodJson["radius"];
    //this.q      =  siteJson["q_value"];
  }

  draw(ctx, debug = false)
  {
    if (!debug)
      return;

    //var rVal = (this.q > 0.5) ? (1.0 - this.q) * 2 : 1.0;
    //var gVal = (this.q > 0.5) ? 1.0 : this.q * 2;

    ctx.save();

    ctx.fillStyle   = `rgba(${Math.round(255 * 0.89)}, ${Math.round(255 * 0.1)}, 70, 0.8)`;
    ctx.strokeStyle = "rgb(20, 20, 20)";
    ctx.translate(this.x, this.y);

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

class Hub
{
  constructor(hubJson)
  {
    this.x      =  hubJson["x"];
    this.y      = -hubJson["y"];
    this.radius =  hubJson["radius"];
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
    this.x      =  obstacleJson["x"];
    this.y      = -obstacleJson["y"];
    this.radius =  obstacleJson["radius"];
  }

  draw(ctx, debug = false)
  {
    if (!debug)
      return;

    ctx.save();

    // obstacle coordinates are for the centre, so we need to adjust
    // to a top-left position
    ctx.translate(this.x - (this.radius), this.y - (this.radius));

    // img, x, y, width, height
    ctx.drawImage(obstacle, 0, 0, this.radius * 2, this.radius * 2);

    /*ctx.font = "14pt sans-serif";
    ctx.fillStyle = "rgb(0, 0, 0)";
    let width = ctx.measureText("Obstacle").width;
    ctx.fillText("Obstacle", this.radius - width/2, this.radius + 20 + this.radius);*/

    ctx.restore();
  }
}

class Pheromone
{
  constructor(pheromonesJson)
  {
    this.pheromones = [];
    if (pheromonesJson != ''){
        for (var pheromone of pheromonesJson)   { this.pheromones .push(pheromone); }
    }

  }

  draw(ctx, debug = false) //then swap out hard coded radius for the dynamic
  //property you added above. Then consider working on adding user input for radius #done?
  {
    if (!debug)
        return;
    ctx.save();
    //ctx.fillStyle = Pheromone.FILL_STYLE;
    //ctx.strokeStyle = Pheromone.STROKE_STYLE;
    ctx.fillStyle = "rgba(255, 255, 0, 0.75)";
    ctx.strokeStyle = "rgb(255, 255, 0)";
    var count = 0;
    for (var pheromone of this.pheromones){
        ctx.save();
        //console.log("x: " + pheromone.x.toString());
        //console.log("y: " + pheromone.y.toString());
        count += 1;
        ctx.translate(pheromone.x-2, -pheromone.y-2);
        ctx.rect(0,0, 9, 9);
        ctx.fill();
        //ctx.stroke();
        ctx.restore();
    }
    //console.log(count)
    ctx.restore();
  }
}

//Pheromone.FILL_STYLE = "rgba(255, 255, 0, 0.75)";
//Pheromone.STROKE_STYLE = "rgb(255, 255, 0)";
class Repulsor
{
  constructor(repulsorJson)
  {
    this.x      = repulsorJson.x;
    this.y      = repulsorJson.y;
    this.radius = repulsorJson.radius;
    this.timer  = repulsorJson.timer;
  }

  draw(ctx, debug = false)
  {
    ctx.save()

    ctx.translate(this.x, -this.y);
    ctx.fillStyle = Repulsor.FILL_STYLE;
    ctx.strokeStyle = Repulsor.STROKE_STYLE;

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

Repulsor.FILL_STYLE = "rgba(255, 0, 0, 0.5)";
Repulsor.STROKE_STYLE = "rgb(255, 0, 0)";

class Rough
{
  constructor(roughJson)
  {
    this.x      =  roughJson["x"];
    this.y      = -roughJson["y"];
    this.radius =  roughJson["radius"];
  }

  draw(ctx, debug = false)
  {
    if (!debug)
      return;
      
    ctx.save();

    ctx.fillStyle = "rgba(244, 164, 96, 0.5)";
    ctx.strokeStyle = "rgb(244, 164, 96)";
    ctx.translate(this.x, this.y);

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

class Site
{
  // site json format = [ x, y, radius, quality ]
  constructor(siteJson)
  {
    this.x      =  siteJson["x"];
    this.y      = -siteJson["y"]; // drawing coordinates have down as positive y
    this.radius =  siteJson["radius"];
    this.q      =  siteJson["q_value"];
  }

  draw(ctx, debug = false)
  {
    if (!debug)
      return;

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
      /*ctx.font = "14pt sans-serif";
      ctx.fillStyle = "rgb(0, 0, 0)";
      let width = ctx.measureText(`Site: ${this.q}`).width;
      ctx.fillText(`Site: ${this.q}`, -width/2, 20 + this.radius);*/
    }

    ctx.restore();
  }
}

class Trap
{
  constructor(trapJson)
  {
    this.x      =  trapJson["x"];
    this.y      = -trapJson["y"];
    this.radius =  trapJson["radius"];
  }

  draw(ctx, debug = false)
  {
    if (!debug)
      return;

    ctx.save();

    ctx.fillStyle = "rgb(122, 18, 18)";
    ctx.strokeStyle = "rgb(122, 18, 18)";
    ctx.translate(this.x, this.y);

    ctx.beginPath();
    ctx.moveTo(this.radius, 0);

    //ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
    //ctx.fill();

    for (let i = 0; i <= 360; i += 5)
    {
      // check if i is even or odd
      let pointRadius = (i & 1 == 1) ? this.radius : this.radius - 5;

      ctx.lineTo(pointRadius * Math.cos(i * Math.PI/180), -(pointRadius * Math.sin(i * Math.PI/180)));
    }

    ctx.fill();
    ctx.stroke();

    /*ctx.font = "14pt sans-serif";
    ctx.fillStyle = "rgb(0, 0, 0)";
    let width = ctx.measureText("Trap").width;
    ctx.fillText("Trap", -width/2, 20 + this.radius);*/

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
    //this.hub    = new Hub(environmentJson.hub);
    this.hub    = []; //new Hub(environmentJson.hub);
    this.sites       = [];
    this.obstacles   = [];
    this.traps       = [];
    this.rough       = [];
    this.attractors  = [];
    this.repulsors   = [];
    this.agents      = [];
    this.dead_agents = [];
    this.cues        = [];
    this.food        = [];
    this.debris      = [];
    this.pheromones;

    for (var hub       of environmentJson.hub      ) { this.hub      .push( new Hub      (hub      ) ); }
    for (var site       of environmentJson.sites      ) { this.sites      .push( new Site      (site      ) ); }
    // for (var obstacle   of environmentJson.obstacles  ) { this.obstacles  .push( new Obstacle  (obstacle  ) ); }
    for (var trap       of environmentJson.traps      ) { this.traps      .push( new Trap      (trap      ) ); }
    for (var debri       of environmentJson.debris      ) { this.debris      .push( new Debri      (debri      ) ); }
    //for (var rough      of environmentJson.rough      ) { this.rough      .push( new Rough     (rough     ) ); }
    //for (var attractor  of environmentJson.attractors ) { this.attractors .push( new Attractor (attractor ) ); }
    //for (var repulsor   of environmentJson.repulsors  ) { this.repulsors  .push( new Repulsor  (repulsor  ) ); }
    for (var agent      of environmentJson.agents     ) { this.agents     .push( new Agent     (agent     ) ); }
    //for (var cue      of environmentJson.cues     ) { this.cues     .push( new Cue     (cue     ) ); }
    for (var food      of environmentJson.food     ) { this.food     .push( new Food     (food     ) ); }
    //for (var dead_agent of environmentJson.dead_agents) { this.dead_agents.push( new DeadAgent (dead_agent) ); }
    //for (var pheromone of environmentJson.pheromones)   { this.pheromones .push( new Pheromone (pheromone)  ); }
    //this.pheromones = new Pheromone(environmentJson.pheromones);
  }

  canvasToWorldCoords(x, y)
  {
     return {x: (x - this.x_limit), y: -(y - this.y_limit)};
  }

  // Draw the whole world recursively. Takes a 2dRenderingContext obj from
  // a canvas element
  draw(ctx, debug = false, showAgentStates = false)
  {
    // Ok so this isn't really buying us all that much simplification at this level
    // right *now*, but the point is if in the future we ever need some sort of
    // this drawn singly at a world level, it could go right here very nicely.
    for (var hub       of this.hub      ) { hub      .draw(ctx, debug); }
    for (var site       of this.sites      ) { site      .draw(ctx, debug); }
    // for (var obstacle   of this.obstacles  ) { obstacle  .draw(ctx, debug); }
    for (var trap       of this.traps      ) { trap      .draw(ctx, debug); }
    for (var debri       of this.debris      ) { debri      .draw(ctx, debug); }
    //for (var rough      of this.rough      ) { rough     .draw(ctx, debug); }
    //for (var attractor  of this.attractors ) { attractor .draw(ctx, debug); }
    //for (var repulsor   of this.repulsors  ) { repulsor  .draw(ctx, debug); }
    //if(Math.random()<.5){
    //this.pheromones.draw(ctx, debug);
    //}

    //this.hub.draw(ctx, debug);

    for (var agent      of this.agents     ) { agent     .draw(ctx, debug, showAgentStates); }
    //for (var cue      of this.cues    ) { cue    .draw(ctx, debug); }
    for (var food      of this.food    ) { food    .draw(ctx, debug); }

    //for (var dead_agent of this.dead_agents) { dead_agent.draw(ctx, debug); }

  }
}

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
      world = new World(worldUpdate.data); //try implementing an array and stack
      //you'd push worldupdate.data into array, and then pop it off the stack when you need it
      // "need it" means you've finished a draw cycle, which is happening in browser
      // if you want to keep everything in draw function like it is, make the array and stack
      // if you want to split it up you need to move the world.draw function into this function
      //the idea is to draw the world only when we're ready for it
      //read through socket documentation, maybe there are options that say
      //"don't register every single callback" or something


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

   world.draw(ctx, debug, showAgentStates); // move to update path rather than 1/60
   ui.draw(ctx, debug);

   finishedDrawing = true;

   // maintain a maximum rate of 60fps
   window.setTimeout(() => { window.requestAnimationFrame(draw)}, 1000 / 60);
   //window.requestAnimationFrame(draw);
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