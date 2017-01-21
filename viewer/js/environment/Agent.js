class Agent
{
  constructor(agentJson)
  {
    this.id            =  agentJson.id;
    this.x             =  agentJson.x;
    this.y             = -agentJson.y;
    this.rotation      =  Math.PI/2 - agentJson.direction; // convert from the engine's coordinate system into what the drawing routine expects
    this.state         =  agentJson.state;
    this.potentialSite =  agentJson.potential_site;
    this.isAlive       =  agentJson.live;
  }

  draw(ctx, debug = false)
  {
    ctx.save();

    // move the drawing context to the agent's x and y coords
    ctx.translate(this.x, this.y);

    ctx.save();

    ctx.rotate(this.rotation);
    ctx.drawImage(bee, -bee.width/2, -bee.height/2);

    ctx.restore();
    ctx.beginPath();

    // TODO: move this into the UI drawing routings
      // also draw a neat little selection box around the agent if it's selected
      if (selectedAgents[this.id])
      {
         var outlineXy = (bee.width > bee.height) ? bee.width : bee.height;
         // move 7px up and left from agent's centre
         ctx.translate(-outlineXy/2 - 3, -outlineXy/2 - 3);
         ctx.strokeStyle = "rgb(24, 215, 255)";

         // draw a rectangle from origin (agent centre - (7px, 7px), to agent
         // centre + (7px, 7px) )
         ctx.strokeRect(0, 0, outlineXy + 3, outlineXy + 3);
      }

    ctx.restore();
  }
}
