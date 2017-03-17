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

			paramObj[updatedParam.name] = updatedParam.value || UIParams.defaults[updatedParam.name];

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

// have sane behaviour if the user clears the fps box
UIParams.defaults =
{
  "uiFps" : 1
}
