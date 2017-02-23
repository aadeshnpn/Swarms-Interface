var buttonDebugParams = document.getElementById("buttonUpdateDebugParams");

buttonDebugParams.addEventListener("click", function(e)
{
   var paramObj = {};

   var paramArray = $("#debugParams input").serializeArray();

   for (let param of paramArray)
   {
      paramObj[param.name] = param.value;
   }

   socket.emit('input', {'type': 'parameterUpdate', params: paramObj});
})

// interface
const debugParams =
{
   update: function(data)
   {
      for (let [param, val] of Object.entries(data.parameters))
      {
         $(`#debugParams input[name=${param}]`).val(val);
      }
   }
}
