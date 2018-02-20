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

      ctx.fillStyle = "rgba(0,150,0,.3)";
      ctx.strokeStyle = "rgba(0, 0, 0,.5)";
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
