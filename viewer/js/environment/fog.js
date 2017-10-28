class Fog
{
  constructor(x,y,fogBlockSize)
  {
    this.fogBlockSize=fogBlockSize;
    this.opacity=.95;
    this.color='white';
    this.x =x;
    this.y=y;
    this.timeMax=100;
    this.time=this.timeMax;
    this.view=5;
    this.numberVisited=0;

  }

  draw(agents)
  {
    for(var agent of agents)
    {
      //console.log(agent.x)
      if(agent.x > -world.x_limit+this.x - (fogBlockSize-1)*this.view &&
          agent.x < -world.x_limit+this.x+(fogBlockSize-1)*this.view &&
            agent.y > -world.y_limit+this.y - (fogBlockSize-1)*this.view &&
              agent.y < -world.y_limit+this.y+(fogBlockSize-1)*this.view)
      {
        this.numberVisited+=.5;
        //console.log(this.numberVisited)
        this.time=0;
      }
    }

    if(this.time<this.timeMax)
    {
      this.time++;
    }

    var ctx = canvas.getContext("2d");
    ctx.fillStyle = this.color;
    if(this.numberVisited> 1){
      ctx.fillStyle = 'rgb(106, 99, 102)';
    }

    ctx.globalAlpha=this.opacity*(this.time/this.timeMax);
    ctx.fillRect(-world.x_limit+this.x, -world.y_limit+this.y, this.fogBlockSize, this.fogBlockSize);
    //Resets the global Alpha for the rest of the draw
    ctx.globalAlpha=1;
    this.numberVisited+=-.1

  }





}
