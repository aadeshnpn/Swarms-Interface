class beeCounter
{
   constructor(ui)
   {
      ui.register('updateRadial', this.update.bind(this));
   }
   update(data)
   {
       document.getElementById("deadBees").innerHTML = "Estimated Dead: " + data.controller['dead'].toString();
   }
}



