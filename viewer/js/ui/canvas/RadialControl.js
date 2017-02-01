class RadialControl
{
   constructor()
   {
      this.directions = [];

      for (let i = 0; i < (360 / 5); i++)
         this.directions[i] = {val: 1, x: RadialControl.RADIUS_SCALE * Math.sin(5 * i), y: RadialControl.RADIUS_SCALE * Math.cos(5 * i)};

      cursors.default.addEventListener('mousemove', this.checkHandleHover.bind(this));
   }

   draw(ctx, debug = false)
   {
      ctx.save();

      ctx.translate(0, 0);
      ctx.save();

      ctx.beginPath();

      for (let i of this.directions)
      {
         ctx.lineTo(0, i.val * RadialControl.RADIUS_SCALE);
         ctx.rotate( (Math.PI / 180) * 5 );
      }

      ctx.strokeStyle = RadialControl.LINE_COLOUR;
      ctx.stroke();

      ctx.restore();
      ctx.fillStyle = RadialControl.HANDLE_COLOUR;

      for (let i of this.directions)
      {
         ctx.beginPath();
         ctx.arc(0, i.val * RadialControl.RADIUS_SCALE, 3, 0, 2 * Math.PI, false);
         ctx.rotate( (Math.PI / 180) * 5 );
         ctx.fill();
      }

      ctx.restore();
   }

   reset()
   {
      for (let i = 0; i < (360 / 5); i++)
         this.directions[i] = 1;
   }

   checkHandleHover(e)
   {
      for (let i of this.directions)
      {
         if (e.clientX == i.x && e.clientY == i.y)
         {
            ui.requestActiveCursor(cursors.radialDrag);
         }
      }
   }
}

RadialControl.RADIUS_SCALE = 100;
RadialControl.LINE_COLOUR = '#b53b3b';
RadialControl.HANDLE_COLOUR = '#d14545';
