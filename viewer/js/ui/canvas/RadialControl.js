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
}

RadialControl.RADIUS_SCALE = 100;
RadialControl.LINE_COLOUR = '#b53b3b';
RadialControl.HANDLE_COLOUR = '#d14545';
