class Agent
{
  constructor(agentJson)
  {
    this.id            =  agentJson.id;
    this.x             =  agentJson.x;
    this.y             = -agentJson.y;
    this.rotation      =  Math.PI/2 - agentJson.direction; // convert from the engine's coordinate system into what the drawing routine expects
    this.state         =  agentJson.state;
    //console.log(this.state);
    this.potentialSite =  agentJson.potential_site;
    this.isAlive       =  agentJson.live;
    this.qVal          =  agentJson.qVal;
    Agent.stateColors  = {};
    this.lastLocations = [];
  }

  draw(ctx, debug = false, showAgentStates = false,hub)
  {

    if (!debug)
      return;


    ctx.save();
    //console.log(this.x)
    // move the drawing context to the agent's x and y coords
    ctx.translate(this.x, this.y);

    ctx.save();

    ctx.rotate(this.rotation);

    ctx.drawImage(bee, -bee.width/2, -bee.height/2);


    if (showAgentStates && Agent.stateStyles[this.state] !== "" && Agent.stateStyles[this.state] !== undefined) {
       ctx.fillStyle = Agent.stateStyles[this.state];
       ctx.fillRect(-bee.width/2, -bee.height/2, bee.width, bee.height);
    }

    ctx.restore();

    ctx.restore();
  }
}

Agent.stateStyles = {
  'resting'    :'',                          // No coloring
  'exploring'  :'rgba(  0, 255,   0, 0.25)', // Green
  'observing'  :'rgba(  0,   0, 255, 0.25)', // Blue
  'assessing'  :'rgba(255, 255,   0, 0.25)', // Yellow
  'dancing'    :'rgba(  0, 255, 255, 0.25)', // Cyan
  'piping'     :'rgba(255,   0, 255, 0.25)', // Magenta
  'commit'     :'rgba(255,  96,   0, 0.25)',  // Orange
  'recruiting'  :'rgba(  0, 255,   0, 0.25)', // Green
  'waiting'  :'rgba(  0,   0, 255, 0.25)', // Blue
  'site assess':'rgba(255,   0,   0, 0.25)', // Red
  'searching'  :'rgba(255, 255,   0, 0.25)', // Yellow
  'following'    :'rgba(  0, 255, 255, 0.25)', // Cyan
  'exploiting'     :'rgba(255,   0, 255, 0.25)' // Magenta
}
