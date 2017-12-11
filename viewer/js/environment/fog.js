class Fog
{
  constructor(x,y,fogBlockSize)
  {
    this.fogBlockSize=fogBlockSize;

    this.visitObj;
    this.opacity=.95;
    this.color='rgb(255, 255, 255)';
    this.x =x;
    this.y=y;
    this.timeMax=100;
    this.time=0;
    this.view=2;
    this.inside=false;
    this.numberVisited=0;
    this.agentTime=new Map()
  }

  visited(agent){

  }

  checkAgent(agents,hub){
    for(var agent of agents)
    {
      //console.log(agent.x)
      if(agent.x > -world.x_limit+this.x - (fogBlockSize-1)*this.view &&
          agent.x < -world.x_limit+this.x+(fogBlockSize-1)*this.view &&
            agent.y > -world.y_limit+this.y - (fogBlockSize-1)*this.view &&
              agent.y < -world.y_limit+this.y+(fogBlockSize-1)*this.view)
      {
        if(!(Math.sqrt((hub.x - agent.x)*(hub.x - agent.x) +(hub.y - agent.y)*(hub.y - agent.y)) < hub.radius-5))
        {
          this.agentTime.set(agent.id.toString(),Date.now())
          agent.lastLocations.push(this)
        }

      }

    }
  }




  draw(ctx,id){
    ctx.fillStyle = this.color;
    // if(this.agentTime.get(id.toString()) != undefined){
    //   this.time = this.agentTime.get(id.toString());
    // }
    // //console.log(this.inside)
    // var start=this.time;
    // var end= Date.now()
    // this.opacity=(end-start)/10000

    ctx.globalAlpha=this.opacity
    ctx.fillRect(-world.x_limit+this.x, -world.y_limit+this.y, this.fogBlockSize, this.fogBlockSize);
    ctx.globalAlpha=1;
    this.opacity+=.001
    if(this.opacity >.95){
      this.opacity = .95
    }
  }
  // draw(agents)
  // {
  //   for(var agent of agents)
  //   {
  //     //console.log(agent.x)
  //     if(agent.x > -world.x_limit+this.x - (fogBlockSize-1)*this.view &&
  //         agent.x < -world.x_limit+this.x+(fogBlockSize-1)*this.view &&
  //           agent.y > -world.y_limit+this.y - (fogBlockSize-1)*this.view &&
  //             agent.y < -world.y_limit+this.y+(fogBlockSize-1)*this.view)
  //     {
  //       this.numberVisited+=.5;
  //       //console.log(this.numberVisited)
  //       this.time=0;
  //     }
  //   }
  //
  //   if(this.time<this.timeMax)
  //   {
  //     this.time++;
  //   }
  //
  //   var ctx = canvas.getContext("2d");
  //   ctx.fillStyle = this.color;
  //   if(this.numberVisited> 1){
  //     ctx.fillStyle = 'rgb(106, 99, 102)';
  //   }
  //
  //   ctx.globalAlpha=this.opacity*(this.time/this.timeMax);
  //   ctx.fillRect(-world.x_limit+this.x, -world.y_limit+this.y, this.fogBlockSize, this.fogBlockSize);
  //   //Resets the global Alpha for the rest of the draw
  //   ctx.globalAlpha=1;
  //   this.numberVisited+=-.1
  //
  // }





}
