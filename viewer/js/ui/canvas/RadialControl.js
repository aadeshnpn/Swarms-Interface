class Handle
{
   constructor(angle)
   {
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

      ctx.strokeStyle = "blue";

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
      else
      {
         ctx.fillStyle = "blue";

         ctx.beginPath();
         ctx.arc(this.requestedX, -this.requestedY, 2, 0, 2 * Math.PI, false);
         ctx.fill();
      }

      ctx.restore();
   }

   beeNumberToRadiusScale(number)
   {
      return ((number - 1) / 19) + 1;
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
   constructor()
   {
      this.handles = [];
      this.drag = {active: false, handle: null};
      this.hover = {active: true, handle: null};

      for (let i = 0; i < (360 / 5); i++)
      {
         this.handles.push(new Handle(i * 5)); // we're doing it this way so eventually we can paramaterise the 5
      }

      this.handles[0].setPrev(this.handles[this.handles.length - 1])
      this.handles[0].setNext(this.handles[1]);

      for (let i = 1; i < this.handles.length; i++)
      {
         // this only works because js lets you do negative array indices
         this.handles[i].setPrev(this.handles[(i - 1) % this.handles.length]);
         this.handles[i].setNext(this.handles[(i + 1) % this.handles.length]);
      }

      cursors.default.addEventListener('mousemove', this.startHandleHover.bind(this));
      cursors.radialDrag.addEventListener('mousemove', this.onMouseMove.bind(this));
      cursors.radialDrag.addEventListener('mousedown', this.onMouseDown.bind(this));
      cursors.radialDrag.addEventListener('mouseup', this.onMouseUp.bind(this));
   }

   update(data)
   {
      // data is an array[72] of direction information for every five degrees

      for (let i = 0; i < (360 / 5); i++)
         this.handles[i].updateActual(data.controller.agentDirections[i]);
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
         }
         else if (component > 2.0 * RadialControl.RADIUS_SCALE)
         {
            component = 2.0 * RadialControl.RADIUS_SCALE;
         }

         this.drag.handle.updateRequested( Math.round( ((component / RadialControl.RADIUS_SCALE) - 1) * 20 ))

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

RadialControl.RADIUS_SCALE = 50;
RadialControl.LINE_COLOUR = '#b53b3b';
RadialControl.HANDLE_COLOUR = '#d14545';
