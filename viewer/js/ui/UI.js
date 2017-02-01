class UI
{
   constructor()
   {
      this.selectedAgents = {};
      this.selectedNumber = 0;

      this.selectionBoxes = new SelectionBoxes();
      this.selectionRect = new SelectionRect();
      this.radialControl = new RadialControl();

      this.activeCursor = cursors.default.activate();
   }

   draw(ctx, debug = false)
   {
      this.radialControl.draw(ctx, debug);
      this.selectionRect.draw(ctx, debug);
      this.selectionBoxes.draw(ctx, debug);
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
      if (this.activeCursor === this.CursorDefault)
         setActiveCursor(cursor);
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
