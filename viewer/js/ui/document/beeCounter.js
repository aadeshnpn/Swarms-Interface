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

       document.getElementById("turns").innerHTML = "total turns: " + data.controller['actions']["turns"].toString();
       document.getElementById("stateChanges").innerHTML = "total state changes: " + data.controller['actions']["stateChanges"].toString();

       document.getElementById("influenceTurns").innerHTML = "influenced turns: " + data.controller['influenceActions']["turns"].toString();
       document.getElementById("influenceChanges").innerHTML = "influenced changes: " + data.controller['influenceActions']["stateChanges"].toString();
       /*
        self.actions = {"turns": 0, "stateChanges": 0, "parameterChange": 0}
        self.influenceActions = {"turns": 0, "stateChanges": 0, "parameterChange": 0}
        */
   }
}



