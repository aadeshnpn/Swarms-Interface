class UI {
	constructor() {
		this.selectedAgents = {};
		this.selectedNumber = 0;
		this.canvasElems = [];
		this.documentElems = [];
		this.eventCallbacks = {};

		this.canvasElems.push(new SelectionBoxes(this));
		this.canvasElems.push(new SelectionRect(this));
		this.canvasElems.push(new RadialControl(this));
		//this.canvasElems.push(new RadialControl(this, {interactive: false, colour: "green", dataset: "agentsIn"}));
		this.canvasElems.push(new BaitBombGhost(this));
		this.canvasElems.push(new MissionLayer(this));
		this.canvasElems.push(new StateBubbles(this));

		this.documentElems.push(new DebugParams(this));
		this.documentElems.push(new UIParams(this));
		this.documentElems.push(new SitePriorityMeters(this));
		this.documentElems.push(new DebugTable(this));
		this.documentElems.push(new BeeCounter(this));
		this.documentElems.push(new ChatRoom(this));

		this.activeCursor = cursors.default.activate();

		this.register('restart', this.reset.bind(this));
	}

	register(event, callback) {
		//console.log(event)
		if (!this.eventCallbacks[event]) {
			this.eventCallbacks[event] = [];
		}
		this.eventCallbacks[event].push(callback);
	}

	on(msg) {

		for (let cb of this.eventCallbacks[msg.type]) {
			// console.log(cb);
				cb(msg.data);

		}
	}

	// indiviual components now must register for any updates they want
	/*update(data)
	{
	   for (let element of this.canvasElems)
		  element.update(data);

	   for (let element of this.documentElems)
		  element.update(data);
	}*/

	draw(ctx, debug = false) {
		for (let element of this.canvasElems)

			element.draw(ctx, debug);
	}

	setActiveCursor(cursor) {
		if (!(cursor instanceof Cursor))
			throw new Error('Active cursor can only be set to a Cursor object');

		this.activeCursor.deactivate();
		this.activeCursor = cursor;
		this.activeCursor.activate();
	}

	requestActiveCursor(cursor) {
		if (this.activeCursor.type == "default") {
			this.setActiveCursor(cursor);
		}
	}

	agentsSelected() {
		return this.selectedNumber;
	}

	addSelectedAgents(ids) {
		this.selectedNumber += ids.length;

		for (let id of ids) {
			this.selectedAgents[id] = true;
		}

	}

	clearSelectedAgents() {
		this.selectedAgents = {};
		this.selectedNumber = 0;
	}

	isAgentSelected(id) {
		if (this.selectedAgents[id])
			return true;
	}

	reset() {
		this.clearSelectedAgents();
	}

}
