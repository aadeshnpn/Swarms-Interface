class Fog
{
  constructor(x,y,fogBlockSize,hub)
  {
    this.fogBlockSize=fogBlockSize;
    // console.log(x);
    this.hub=hub
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
    this.agentsInHub=[]
    this.init=false
  }

  visited(agent){

  }

  checkAgent(agents,hub){
    if(!this.init){
      this.agentsInHub=new Array(agents.length)
      this.agentsInHub.fill(false,0,agents.length)
      this.init=true
    }
    for(var agent of agents)
    {
      //console.log(agent.x)
      if(agent.x > -world.x_limit+this.x - (this.fogBlockSize-1)*this.view &&
          agent.x < -world.x_limit+this.x+(this.fogBlockSize-1)*this.view &&
            agent.y > -world.y_limit+this.y - (this.fogBlockSize-1)*this.view &&
              agent.y < -world.y_limit+this.y+(this.fogBlockSize-1)*this.view)
      {
        if(!(Math.sqrt((hub.x - agent.x)*(hub.x - agent.x) +(hub.y - agent.y)*(hub.y - agent.y)) < hub.radius-5))
        {
          this.agentTime.set(agent.id.toString(),Date.now())
          agent.lastLocations.push(this)
          //console.log(this.agentsInHub);
        }

      }

    }
  }




  draw(ctx,id){
    // console.log(this.x_limit);
    // console.log(Math.sqrt((this.x - this.hub.x/2-world.x_limit)**2+(this.y - this.hub.y-world.y_limit)**2) );
    // if(Math.sqrt((this.x - this.hub.x/2-this.x_limit)**2+(this.y - this.hub.y-this.y_limit)**2) > this.hub.radius+20){
    //   console.log("HERE");
    //
    // }
    ctx.beginPath()
    ctx.fillStyle = this.color;

    ctx.globalAlpha=this.opacity
    // ctx.fillRect(-world.x_limit+this.x-1, -world.y_limit+this.y-1, this.fogBlockSize+1, this.fogBlockSize+1);
    ctx.arc(-world.x_limit+this.x,-world.y_limit+this.y,4.4,0,2*Math.PI)
    ctx.fill()
    ctx.closePath()
    ctx.globalAlpha=1;
    this.opacity+=.001
    if(this.opacity >.95){
      this.opacity = .95
    }
  }






}
