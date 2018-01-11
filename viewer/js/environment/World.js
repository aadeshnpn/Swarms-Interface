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
    this.pheromones;
    this.environment = environmentJson;
    this.test =true;
    this.time=1000


    for (var site       of environmentJson.sites      ) { this.sites      .push( new Site      (site      ) ); }
    for (var obstacle   of environmentJson.obstacles  ) { this.obstacles  .push( new Obstacle  (obstacle  ) ); }
    for (var trap       of environmentJson.traps      ) { this.traps      .push( new Trap      (trap      ) ); }
    for (var rough      of environmentJson.rough      ) { this.rough      .push( new Rough     (rough     ) ); }
    for (var attractor  of environmentJson.attractors ) { this.attractors .push( new Attractor (attractor ) ); }
    for (var repulsor   of environmentJson.repulsors  ) { this.repulsors  .push( new Repulsor  (repulsor  ) ); }
    for (var agent      of environmentJson.agents     ) { this.agents     .push( new Agent     (agent     ) ); }
    for (var dead_agent of environmentJson.dead_agents) { this.dead_agents.push( new DeadAgent (dead_agent) ); }
    //for (var pheromone of environmentJson.pheromones)   { this.pheromones .push( new Pheromone (pheromone)  ); }
    this.pheromones = new Pheromone(environmentJson.pheromones);
  }

  canvasToWorldCoords(x, y)
  {
     return {x: (x - this.x_limit), y: -(y - this.y_limit)};
  }

  update(environment){
    //Update Sites (will be implemented with moving sites)
    // for(var i =0; i < this.sites.length;i++){
    //   this.sites[i].x= environment.sites[i].x
    //   this.sites[i].y= -environment.sites[i].y
    // }

    //console.log(environment.agents.length)



    for(var i=0; i< this.sites.length;i++){
      this.sites[i].x=environment.sites[i].x
      this.sites[i].y=-environment.sites[i]["y"]
    }

    //Update Alive Agents
    for(var i =0; i < this.agents.length-this.dead_agents.length;i++){

      for(var dead of environment.dead_agents){

              if(this.agents[i].id == dead.id ){
                this.agents.splice(i,1)
                this.dead_agents.push(new DeadAgent(dead))
              }
      }

      this.agents[i].x= environment.agents[i].x
      this.agents[i].y= -environment.agents[i].y
      this.agents[i].rotation = Math.PI/2 -environment.agents[i].direction
    }

  }
  // Draw the whole world recursively. Takes a 2dRenderingContext obj from
  // a canvas element
  draw(ctx, debug = false, showAgentStates = false, environment)
  {
    var sliderVal=document.getElementById('myRange').value;

    // Ok so this isn't really buying us all that much simplification at this level
    // right *now*, but the point is if in the future we ever need some sort of
    // this drawn singly at a world level, it could go right here very nicely.
    // ctx.shadowColor = 'rgba(51,51,51,.6)';
    // ctx.shadowOffsetX = sliderVal/10;
    // ctx.shadowBlur = 10;
    //path.draw(ctx,this.environment);


    //TODO: Find the place where the info stations are drawn
    for (var site       of this.sites      ) { site      .draw(ctx, debug); }
    for (var obstacle   of this.obstacles  ) { obstacle  .draw(ctx, debug); }
    for (var trap       of this.traps      ) { trap      .draw(ctx, debug); }
    for (var rough      of this.rough      ) { rough     .draw(ctx, debug); }
    for (var attractor  of this.attractors ) { attractor .draw(ctx, debug); }
    for (var repulsor   of this.repulsors  ) { repulsor  .draw(ctx, debug); }
    this.pheromones.draw(ctx, debug);
    this.hub.draw(ctx, debug, this.agents);

    for (var agent      of this.agents     ) { agent     .draw(ctx, debug, showAgentStates,this.hub); }
    for (var dead_agent of this.dead_agents) { dead_agent.draw(ctx, debug); }
    for (var fog        of fogBlock        ) { fog       .checkAgent(this.agents,this.hub); }
    for (var fog        of fogBlock        ) { fog       .draw(ctx); }

  }
}
