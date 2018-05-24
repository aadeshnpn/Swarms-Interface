class Task{
  constructor(){
    this.patrol = "Use the patrol-planning tool (the blue circle) to draw areas on the map for the agents to patrol."
    this.patrol +=" The other person will be using a similar tool to tell agents to avoid areas of the map"

    this.avoid = "Use the avoid tool (the red circle) to draw areas on the map for the agents to avoid."
    this.avoid +=" The other person will be using a similar tool to tell agents to patrol areas of the map"

    this.noCom = "Use all the tools at your disposal (planning tools, site images) to determine where the enemy combatants are."
    this.noCom += " You will not be able to communicate with the other person."

    this.com = "Use all the tools at your disposal (planning tools, site images) to determine where the enemy combatants are."
    this.com += " You are allowed to communicate with the other person."

    this.group = "You have been given charge of a set of drones. You will be able to give these drones commands to patrol certain areas"
    this. group += " but you do not have outright control over their behaviour."
  }
}
