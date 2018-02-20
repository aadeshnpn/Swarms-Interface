class BeeCounter {
	constructor(ui) {
		ui.register('updateRadial', this.update.bind(this));
		this.dead = 0;

	}

	update(data) {
		// var deadBee = document.getElementById("deadBeeProgress");
		//deadBee.value=0;
		//console.log(data)
		if (data.controller['dead'] != this.dead) {
			var deadBeeStatus=$('#deadBeeProgress');

			this.dead = data.controller['dead'];

			document.getElementById("deadBees").innerHTML = "Estimated Dead: " + this.dead.toString() + '<br><progress value="'+this.dead.toString()+'" max="100" id="deadBeeProgress"></progress>';
		}

		// document.getElementById("turns").innerHTML = "total turns: " + data.controller['actions']["turns"].toString();
		//document.getElementById("stateChanges").innerHTML = "Total state changes: " + data.controller['actions']["stateChanges"].toString();

		//document.getElementById("influenceTurns").innerHTML = "Influenced turns: " + data.controller['influenceActions']["turns"].toString();
		//document.getElementById("influenceChanges").innerHTML = "Influenced changes: " + data.controller['influenceActions']["stateChanges"].toString();
		/*
		 self.actions = {"turns": 0, "stateChanges": 0, "parameterChange": 0}
		 self.influenceActions = {"turns": 0, "stateChanges": 0, "parameterChange": 0}
		 */
	}
}
