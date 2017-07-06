class DebugParams
{
   constructor(ui)
   {
      this.buttonDebugParams = document.getElementById("buttonUpdateDebugParams");
      ui.register('updateDebugParams', this.update.bind(this));
      this.firstTime = true;

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

      //socket.emit('input', {'type': 'requestParams'});
   }

   setup(data)
   {
      for (let [param, val] of Object.entries(data.parameters))
      {
         var label = $("<label></label>").text(`${param}`);
         label.append($('<input>').val(val).attr('type','number').attr('name',`${param}`));
         label.append("<br>");
         $('#buttonUpdateDebugParams').before(label);
         //$(`#debugParams input[name=${param}]`).val(val);
      }
   }
   update(data){
      if(this.firstTime == true){
         this.setup(data);
         this.firstTime = false;
         return
      }
      for (let [param, val] of Object.entries(data.parameters))
      {
         $(`#debugParams input[name=${param}]`).val(val);
      }
   }
}
