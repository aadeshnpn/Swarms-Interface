class beeCounter
{
   constructor(ui)
   {
      ui.register('updateRadial', this.update.bind(this));
      this.dead = 0
   }
   update(data)
   {
       if(data.controller['dead']!=this.dead){
            this.dead = data.controller['dead'];
            document.getElementById("deadBees").innerHTML = "Estimated Dead: " + this.dead.toString();
       }
   }
}



