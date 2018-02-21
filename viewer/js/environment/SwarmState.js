class SwarmState {
  constructor(stateJson){
    this.state = stateJson.state;
    this.size = 0;
    this.total = 0;
    this.radius = 0;
  }

  draw(ctx, agents){
    //console.log(Object.entries(this.state));
    //console.log(this.state);this.total++
    this.size = 0;
    this.total = 0;//agents.length;
    //console.log(agents.length);
    for (let agent of agents){
      //console.log(this.state);
      //console.log(agent);
      if (agent.state == "exploring" || agent.state == "assessing" || agent.state == "site assess" || agent.state == "piping" || agent.state == "commit"){
        this.total++;
      }
      if (this.state == "exploring" && agent.state == "exploring"){
        this.size++;
        //this.total++;
      }
      if (this.state == "assessing" && (agent.state == "assessing" || agent.state == "site assess")){
        this.size++;
        //this.total++;
      }
      if (this.state == "commit" && (agent.state == "piping" || agent.state == "commit")){
        this.size++;
        //this.total++;
      }
    }
    //console.log(this.total);
    let x = -world.x_limit + StateBubbles.BUBBLE_SPACING;
    let y = world.y_limit - StateBubbles.MAX_RADIUS - StateBubbles.LABEL_SPACING;

    //let x, y = [0, 0];
    //let x = 0;

    ctx.save();
    ctx.translate(x, y);
    x = 0;
    this.radius = this.size/this.total*SwarmState.MAX_RADIUS;
    if (this.radius < SwarmState.MIN_RADIUS){
      this.radius = SwarmState.MIN_RADIUS;
    }
    /*if (this.state == "exploring"){
      x += SwarmState.MAX_RADIUS;
    }*/
    if (this.state == "assessing"){
      x += /*2 * SwarmState.MAX_RADIUS +*/ SwarmState.BUBBLE_SPACING;
    }
    if (this.state == "commit"){
      x += /*3 * SwarmState.MAX_RADIUS + */ 2 * SwarmState.BUBBLE_SPACING;
    }

    ctx.fillStyle = "rgb(108, 163, 252)";
    ctx.beginPath();
    ctx.arc(x, 0, this.radius, 0, Math.PI * 2, false);
    //ctx.arc(100, 0, 50, 0, 2 * Math.PI);
    ctx.fill();

    ctx.font = "8pt sans-serif";
    ctx.fillStyle = "rgb(0, 0, 0)";
    let width = ctx.measureText(`${this.state}/${this.size}`).width;
    //let name1 = name[0].toUpperCase();
    ctx.fillText(`${this.state}/${this.size}`, x-width/2, SwarmState.LABEL_SPACING);

    x += this.radius + SwarmState.BUBBLE_SPACING;
    ctx.restore();
  }


}

SwarmState.MAX_RADIUS = 20;
SwarmState.MIN_RADIUS = 2;
SwarmState.BUBBLE_SPACING = 100; // in px
SwarmState.LABEL_SPACING = 30;
