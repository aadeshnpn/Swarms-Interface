class Hub
{
  constructor(hubJson)
  {
    this.x      =  hubJson.hub["x"];
    this.y      = -hubJson.hub["y"];
    this.radius =  hubJson.hub["radius"];
    this.agentsIn = hubJson.hub["agentsIn"]
    // console.log(hubJson.hub);
    this.paths=[]
    for(var i=0;i <= hubJson.agents.length;i++){
      this.paths[i]=new Array()
    }
  }

  updateFog(agents){
    for(var agent of agents){
      if(Math.sqrt((this.x - agent.x)*(this.x - agent.x) +(this.y - agent.y)*(this.y - agent.y)) < this.radius-5){
        let time=new Date()

        for(let index in agent.path){
          let totalEllapsed=time.getMinutes()*60+time.getSeconds()-agent.time

          let fraction=(time.getMinutes()*60+time.getSeconds()-agent.path[index].time)/totalEllapsed

          agent.path[index].fog.opacity=fraction*.5

          delete agent.path[index]
        }
        agent.time=time.getMinutes()*60+time.getSeconds()
        // console.log("next");

      }

    }
  }

  draw(ctx, debug = false, agents)
  {
    ctx.save();



    ctx.fillStyle = "rgba(242, 179, 19, .5)";
    ctx.strokeStyle = "rgb(242, 179, 19)";
    ctx.lineWidth = 2;
    ctx.translate(this.x, this.y);

    // make sure the hub is visible
    // TODO: don't hack it like this? discuss whether it should just be set
    //       to a more reasonable value

    var radius = (this.radius < 20) ? 20 : this.radius;

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2, false);

    ctx.fill();
    ctx.stroke();



    ctx.restore();
  }
}
