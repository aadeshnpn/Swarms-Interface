class World
{
  constructor(environmentJson)
  {
    this.x_limit = environmentJson.x_limit;
    this.y_limit = environmentJson.y_limit;
    this.width  = this.x_limit * 2;
    this.height = this.y_limit * 2;
    this.hub    = new Hub(environmentJson);
    this.sites       = [];
    this.obstacles   = [];
    this.traps       = [];
    this.rough       = [];
    this.attractors  = [];
    this.repulsors   = [];
    this.agents      = [];
    this.dead_agents = [];
    this.pheromones  = [];
    this.environment = environmentJson;
    this.swarmState = [];
    let fogBlockSize= 10;
    this.fogBlock    = [];
    var ratioX=patrolLocations.windowSize.w/(this.width)
    var ratioY=patrolLocations.windowSize.h/this.height
    // console.log(ratioY);
    // console.log(ratioX);
    if(patrolLocations.loc != undefined){
      for(let loc of patrolLocations.loc){
        loc.x=(loc.x/ratioX)-(this.width/2)
        loc.y=(loc.y/ratioY)-(this.height/2)
      }
    }
    //console.log(((this.width/this.fogBlockSize)*(this.height/this.fogBlockSize)))
    // console.log(this.height);
    let id=0
    for (let y=0; y<(this.height+fogBlockSize);y+=2*fogBlockSize){
      for(let x=0;x<(this.width+fogBlockSize);x+=(10/3)*fogBlockSize){
        if(Math.sqrt((x - this.hub.x/2-this.x_limit)**2+(y - this.hub.y-this.y_limit)**2) > this.hub.radius+30){
          this.fogBlock.push(new Fog(x,y,fogBlockSize,this.hub,this,id));
          id++
        }
      }
    }

    for (let y=fogBlockSize; y<(this.height+fogBlockSize);y+=2*fogBlockSize){
      for(let x=(5/3)*fogBlockSize;x<(this.width+fogBlockSize);x+=(10/3)*fogBlockSize){
        if(Math.sqrt((x - this.hub.x/2-this.x_limit)**2+(y - this.hub.y-this.y_limit)**2) > this.hub.radius+30){
          this.fogBlock.push(new Fog(x,y,fogBlockSize,this.hub,this,id));
          id++
        }
      }
    }

    // for (let y=0; y<(this.height+fogBlockSize);y+=fogBlockSize){
    //   for(let x=0;x<(this.width+fogBlockSize);x+=fogBlockSize){
    //     if(Math.sqrt((x - this.hub.x/2-this.x_limit)**2+(y - this.hub.y-this.y_limit)**2) > this.hub.radius+30){
    //       this.fogBlock.push(new Fog(x,y,fogBlockSize,this.hub,this));
    //     }
    //   }
    // }
    // console.log(this.fogBlock);
    for (let site       of environmentJson.sites      ) { this.sites      .push( new Site      (site      ) ); }

    for (let obstacle   of environmentJson.obstacles  ) { this.obstacles  .push( new Obstacle  (obstacle  ) ); }
    for (let trap       of environmentJson.traps      ) { this.traps      .push( new Trap      (trap      ) ); }
    for (let rough      of environmentJson.rough      ) { this.rough      .push( new Rough     (rough     ) ); }
    for (let attractor  of environmentJson.attractors ) { this.attractors .push( new Attractor (attractor ) ); }
    for (let repulsor   of environmentJson.repulsors  ) { this.repulsors  .push( new Repulsor  (repulsor  ) ); }
    for (let agent      of environmentJson.agents     ) { this.agents     .push( new Agent     (agent     ) ); }
    for (let dead_agent of environmentJson.dead_agents) { this.dead_agents.push( new DeadAgent (dead_agent) ); }
    // this.canvasObjects.sites=this.sites

    //for (var pheromone of environmentJson.pheromones)   { this.pheromones .push( new Pheromone (pheromone)  ); }
    this.swarmState.push(new SwarmState(JSON.parse('{"state": "Exploring"}')));
    this.swarmState.push(new SwarmState(JSON.parse('{"state": "Observing"}')));
    this.swarmState.push(new SwarmState(JSON.parse('{"state": "Following site"}')));

  }

  canvasToWorldCoords(x, y)
  {

    return {x: (x - this.x_limit), y: -(y - this.y_limit)};
  }

  update(environment){
    //This will erase the current array of pheromones and replace it with the current ones (even if the previous ones arent finished)
    //This could possibly be replaced with an algorithm that wont delete ones that havent dissapated yet.
    // console.table(environment.pheromones);
    this.pheromones=[]
    if(environment.pheromones[0] !=undefined){
      if(environment.pheromones[0].r == undefined){
        this.pheromones=new Pheromone(environment.pheromones)
      }else{
        this.pheromones=environment.pheromones

      }
    }

    //This was part of an attempt to not draw agents that are inside the hub
    // this.hub.agentsIn=environment.hub["agentsIn"]

    //This updates the sites. It is only needed if you have moving sites.
    let siteLength=this.sites.length
	  for (let i = 0; i < siteLength; i++) {
		  this.sites[i].x = Math.round(environment.sites[i].x);
		  this.sites[i].y = Math.round(-environment.sites[i]["y"]);
      this.sites[i].radius = Math.round(environment.sites[i]["radius"]);
	  }

    //In this current Iteration there is no way for an agent to die. When dead agents were implemented,
    //this update function didnt exist, but a new world was created every update instead.
    //When agents do die, this algorithm doesnt work well because It doesnt keep track of which agent needs to be
    //removed from the alive agents.
    let deadAgentLength=this.dead_agents.length
	  for (let i = 0; i < deadAgentLength; i++) {

		  this.dead_agents[i].x = environment.dead_agents[i].x;
		  this.dead_agents[i].y = -environment.dead_agents[i].y;
	  }

	  //Update Alive Agents
    let agentLength= this.agents.length - this.dead_agents.length;
	  for (let i = 0; i <agentLength; i++) {

		  this.agents[i].x = Math.round(environment.agents[i].x);
		  this.agents[i].y = Math.round(-environment.agents[i].y);
		  this.agents[i].rotation = Math.PI/2 - environment.agents[i].direction;
      this.agents[i].state = environment.agents[i].state;
	  }

    //This is an attempt to allow the front end to know that the patrol has been completed
    if(environment.patrolUpdate<=0){
      for(let fog of this.fogBlock){
        if(fog.selected){
          if(fog.selectMode != 2 || fog.selectMode !=3 ){
            fog.selectMode+=2

          }
          fog.selected=false;
          fog.maxOpacity=.5
        }
      }
    }


  }
  // Draw the whole world recursively. Takes a 2dRenderingContext obj from
  // a canvas element
  draw(ctx, debug = false, showAgentStates = false)
  {
    for (var site       of this.sites      ) { site      .draw(ctx, debug); }
    //These aren't being used currently
    for (var obstacle   of this.obstacles  ) { obstacle  .draw(ctx, debug); }
    for (var trap       of this.traps      ) { trap      .draw(ctx, debug); }
    for (var rough      of this.rough      ) { rough     .draw(ctx, debug); }
    for (var attractor  of this.attractors ) { attractor .draw(ctx, debug); }
    for (var repulsor   of this.repulsors  ) { repulsor  .draw(ctx, debug); }
    this.hub.updateFog(this.agents)
    this.hub.draw(ctx, debug, this.agents);

    for (var agent      of this.agents     ) { agent     .draw(ctx, debug,this.hub); agent.checkFog(this.fogBlock) }
    for (var dead_agent of this.dead_agents) { dead_agent.draw(ctx, debug); }



    for (var fog of this.fogBlock){
      if(deleteAll){
        selectedCoords={}
        fog.selectMode=-1
        fog.selected=false;
        fog.maxOpacity=.7
      }
      fog.selecting(selectedArea,currentSelectMode);
      if(showFog || fog.selected){
        fog       .draw(ctx);
      }
    }

    deleteAll=false
    if(debug && showPheromone){
      this.drawPheromones()
    }
  }

  drawPheromones(){
    if(this.pheromones.length == undefined && this.pheromones.pheromones != undefined){
      this.pheromones.draw(ctx,debug)
      return
    }
    else{
      ctx.globalAlpha = .5
      for(let pheromone of this.pheromones){
        ctx.beginPath()
        ctx.fillStyle = "white";
        ctx.beginPath()
        ctx.arc(Math.round(pheromone.x), Math.round(-pheromone.y), pheromone.r,0,Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha = 1
    }
  }
}
