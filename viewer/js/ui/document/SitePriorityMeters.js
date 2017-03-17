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
      });

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
