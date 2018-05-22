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

  draw(ctx, debug = false, agents)
  {
    ctx.save();
    var i=0;
    var k=0;

    //This allows the fog to dissapate where the agent has been
    // when an agent returns to the hub
    for(var agent of agents){
      if(Math.sqrt((this.x - agent.x)*(this.x - agent.x) +(this.y - agent.y)*(this.y - agent.y)) < this.radius-5){
        //i is the agent id
        //2nd parameter creates a new array for that agent
        //3rd line copies agents last locations over to that new array
        this.paths[i][this.paths[i].length]=new Array()
        this.paths[i][this.paths[i].length] = agent.lastLocations.slice()
        agent.lastLocations=[]
      }
      i++;
    }
    var t=0
    for(var agentPaths of this.paths){
      var i=0;

      for(var agentPath of agentPaths){
        var k=0;
        if(agentPath.length == 0){
          agentPaths.splice(i,1);
        }
        var j=0
        for(var path of agentPath){
          if(path.opacity<=0){
            agentPath.splice(k,1);
          }
          path.opacity=0
          //console.log(t);
          path.agentsInHub[t]=true
          j++
        }
        i++
      }
      t++
    }


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

    // ctx.globalAlpha=1
    // ctx.font = "20px Arial";
    // ctx.fillStyle="white"
    // ctx.shadowOffsetX = 2;
    // ctx.shadowOffsetY = 2;
    // ctx.shadowBlur=2
    // ctx.shadowColor = 'black';
    // // let imageNum=(this.currentImage+1).toString()
    // ctx.fillText(this.agentsIn,this.x-15,this.y+35);
    // ctx.shawdowBlur=0
    // ctx.shadowOffsetX =0
    // ctx.shadowOffsetY = 0;


    ctx.restore();
  }
}
