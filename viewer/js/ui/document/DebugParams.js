class DebugParams
{
   constructor(ui)
   {
      this.buttonDebugParams = document.getElementById("buttonUpdateDebugParams");
      ui.register('updateDebugParams', this.update.bind(this));

      this.buttonDebugParams.addEventListener("click", function(e)
      {
         var paramObj = {};

         var paramArray = $("#debugParams input").serializeArray();

         for (let param of paramArray)
         {
            paramObj[param.name] = param.value;
         }

         socket.emit('input', {'type': 'parameterUpdate', params: paramObj});
      });
   }

   update(data)
   {
      for (let [param, val] of Object.entries(data.parameters))
      {
         $(`#debugParams input[name=${param}]`).val(val);
      }
   }
}
