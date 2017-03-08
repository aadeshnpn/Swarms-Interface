class UIParams
{
   constructor(ui)
   {
		var paramArray = $("#UIParams input");
		ui.register('updateUIParams', this.update.bind(this));

		paramArray.on("input", function(e)
		{
			var paramObj = {};

			var updatedParam = e.target;

			paramObj[updatedParam.name] = updatedParam.value;

			socket.emit('input', {'type': 'UIParameterUpdate', params: paramObj});
		});

   }

   update(data)
   {
      for (let [param, val] of Object.entries(data.parameters))
      {
         $(`#UIParams input[name=${param}]`).val(val);
      }
   }
}
