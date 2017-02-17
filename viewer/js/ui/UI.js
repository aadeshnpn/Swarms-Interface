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

   update(data)
   {
      for (let element of this.guiElems)
         element.update(data);
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
      {
         this.selectedAgents[id] = true;
         var row = $(document.createElement('tr'));
         for (let [prop, val] of Object.entries(world.agents[0]))
         {
           // KLUDGE CODE TEMPORARY PUT IN A PROPER SPOT SOMETIME
           if (!$(`#infoTableHeaders #${prop}`).length)
           {
             $(`#infoTableHeaders`).append(`<th id='${prop}'>${prop}</th>`);
           }
           row.append(`<td id='${prop}${id}'></td>`);
         }
         //console.log(row);
         $('#infoTable').append(row);
      }

   }

   clearSelectedAgents()
   {
      this.selectedAgents = {};
      this.selectedNumber = 0;
      $('#infoTable').html("");
      $('#infoTable').append('<tr id="infoTableHeaders"></tr>');
   }

   isAgentSelected(id)
   {
      if (this.selectedAgents[id])
         return true;
   }


}
