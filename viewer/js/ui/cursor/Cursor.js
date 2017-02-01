class Cursor
{
   constructor()
   {
      this.active = false;
      this.events = {};
      this.display = null;
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
