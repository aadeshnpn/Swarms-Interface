class DeadAgent
{
  constructor(agentJson)
  {
    this.id            =  agentJson.id;
    this.x             =  agentJson.x;
    this.y             = -agentJson.y;
    this.rotation      =  Math.PI/2 - agentJson.direction;
    this.state         =  agentJson.state;
    this.potentialSite =  agentJson.potential_site;
    this.isAlive       =  agentJson.live;
    this.qVal          =  agentJson.qVal;
  }

  draw(ctx, debug = false)
  {
    if (!debug)
      return;

    ctx.save();

    // Move the drawing context to the agent's x and y coords to rotate around center of image
    ctx.translate(this.x, this.y);

    ctx.rotate(this.rotation);
    ctx.drawImage(beeDead, -bee.width/2, -bee.height/2);

    ctx.restore();

    ctx.restore();
  }
}
