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
      this.canvasElems.push( new BaitBombGhost (this) );
      this.canvasElems.push( new MissionLayer  (this) );

      this.documentElems.push( new DebugParams       (this) );
      this.documentElems.push( new UIParams			  (this) );
      this.documentElems.push( new SitePriorityMeters(this) );

      this.activeCursor = cursors.default.activate();
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
