class Fog
{
  constructor(x,y,fogBlockSize,hub,world,id)
  {
    this.id=id
    this.fogBlockSize=fogBlockSize;
    // console.log(x);
    this.hub=hub
    this.visitObj;
    this.maxOpacity=.7

    this.opacity=this.maxOpacity;

    this.color='rgb(255, 255, 255)';
    this.x =-world.x_limit+x;
    this.y=-world.y_limit+y;
    this.timeMax=100;
    this.time=0;
    this.view=2;
    this.inside=false;
    this.numberVisited=0;
    this.agentTime=new Map()
    this.agentsInHub=[]
    this.init=false
    this.selectMode=-1
    if(patrolLocations.loc != undefined){
      for(let patrol of patrolLocations.loc){
        if(patrol.x+this.fogBlockSize > this.x - (this.fogBlockSize)*1.7&&
            patrol.x-this.fogBlockSize < this.x+(this.fogBlockSize)*1.7 &&
              patrol.y+this.fogBlockSize > this.y - (this.fogBlockSize)*1.7 &&
                patrol.y-this.fogBlockSize <this.y+(this.fogBlockSize)*1.7){
                  this.selectMode=parseInt(patrol.mode)
                  this.maxOpacity=.4
                  this.opacity=this.maxOpacity;
                  this.selected=true
                  // console.log("SELECTED");
                }
      }
    }

    this.left=this.x-fogBlockSize-(1/8)
    this.right=this.x+fogBlockSize+(1/8)
    this.leftX=this.x-(fogBlockSize*(2/3))-(1/8)
    this.rightX=this.x+(fogBlockSize*(2/3))+(1/8)
    this.bottom=this.y+fogBlockSize
    this.top=this.y-fogBlockSize
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
      if(agent.x > this.x - (this.fogBlockSize-1)*this.view &&
          agent.x < this.x+(this.fogBlockSize-1)*this.view &&
            agent.y > this.y - (this.fogBlockSize-1)*this.view &&
              agent.y <this.y+(this.fogBlockSize-1)*this.view)
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

  selecting(points,selectMode){
    // Will select points that are being selected by the mouse and highlight those selected
    for(let point of points){
      var dx = this.x - point.x ;
      var dy = this.y - point.y ;
      var distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < point.r+5) {
        if(deletingSelect){
          if(this.id in selectedCoords){
            // console.log(selectedCoords);
            let infoToSend={fullPatrol:selectedCoords,deleted:selectedCoords[this.id]}
            // console.log(infoToSend);
            // console.log(JSON.stringify(selectedCoords));
            socket.emit("input",{type:"patrolLocationsCheck",info:infoToSend})
            // console.log(selectedCoords);
            delete selectedCoords[this.id]
          }
          this.selectMode=-1
          this.selected=false;
          this.maxOpacity=.7
        }else{
          selectedCoords[this.id]={x:this.x,y:this.y,mode:this.selectMode}
          // console.log(selectedCoords[this.id]);
          socket.emit("input",{type:"patrolLocations",info:{x:this.x,y:this.y,mode:this.selectMode}})
          this.selected=true;
          this.selectMode=selectMode
          this.flash=true
          this.maxOpacity=.4
        }
      }
    }

  }

  draw(ctx,id){

    ctx.beginPath()
    ctx.fillStyle = this.color;
    if(this.selectMode!=-1){
      // console.log(this.selectMode);
      ctx.fillStyle = Object.entries(Fog.stateStyles)[this.selectMode][1];
    }
    ctx.globalAlpha=this.opacity


    ctx.beginPath()
    ctx.moveTo(this.left,this.y)
    ctx.lineTo(this.leftX,this.top)
    ctx.lineTo(this.rightX,this.top)
    ctx.lineTo(this.right,this.y)
    ctx.lineTo(this.rightX,this.bottom)
    ctx.lineTo(this.leftX,this.bottom)
    ctx.lineTo(this.left,this.y)
    ctx.fill()

    ctx.globalAlpha=1;
    this.opacity+=.001
    if(this.opacity >this.maxOpacity){
      this.opacity = this.maxOpacity
    }
  }

}
Fog.stateStyles = {
  'Patrol'    :'rgb(  0, 0, 255)',                         // No coloring
  'Avoid'  :'rgb(  255, 0, 0)', // Green
  'PatrolVisit'  :'rgb(140, 140, 255)', // Green
  'AvoidAdded'  :'rgb(255, 140, 140)' // Greenrgb(150, 0, 255)

}
