var priorityMetres = $('#sitePriorityControls input')

priorityMetres.on('change', function(e)
{
   var priorityObj = {};

   var prioritiesSerialised = priorityMetres.serializeArray();

   for (let entry of prioritiesSerialised)
   {
      priorityObj[entry.name] = entry.value;
   }

   socket.emit('input', {type: 'priorityUpdate', sitePriorities: priorityObj});
});

const sitePriorityMetres =
{
   update: function(data)
   {
      for (let [key, val] of Object.entries(data.controller.sitePriorities))
      {
         $(`#sitePriorityControls input[name=${key}]`).val(val);
      }
   }
}
