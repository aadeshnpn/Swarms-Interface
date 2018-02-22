
class StateBubbles
{
  constructor(ui)
  {
    this.states = {};
    this.totalAgentsInStates = 0;
    this.initialised = false;

    ui.register("setStates", this.init.bind(this));
    ui.register("stateCounts", this.update.bind(this));
    ui.register("restart", this.restart.bind(this));

    socket.emit("input", {"type": "requestStates"});
  }

  init(json)
  {
    //console.log(json);
    for (let name of json.states)
    {
      //console.log(name);
      this.states[name] = {count: 0, radius: 0};
      //console.log(this.states);

    }

    this.initialised = true;
  }

  update(json)
  {
    this.totalAgentsInStates = 100;
    //console.log(json);

    for (let [state, count] of Object.entries(json))
    {
      //console.log(json.states);
      console.log(count);
      if (this.states[state])
      {
        this.states[state].count = count;
        this.totalAgentsInStates += count;

      }
    }

    for (let [name, state] of Object.entries(this.states))
    {
      //console.log(count);
      state.radius = state.count / this.totalAgentsInStates * StateBubbles.MAX_RADIUS;
      //console.log(state.radius);
      if (state.radius < StateBubbles.MIN_RADIUS)
        state.radius = StateBubbles.MIN_RADIUS;
    }
  }

  restart()
  {
    this.states = {};
    this.totalAgentsInStates = 0;
    this.initialised = false;

    socket.emit("input", {"type": "requestStates"});
  }

  draw(ctx, debug = false)
  {
    return
    if (!this.initialised)
      return;

    //let bubblesWidth = Object.values(this.states).reduce((sum, state) => {return sum + state.radius + StateBubbles.BUBBLE_SPACING}, 0);
    //console.log(bubblesWidth);
    let x = -world.x_limit + StateBubbles.BUBBLE_SPACING;
    let y = world.y_limit - StateBubbles.MAX_RADIUS - StateBubbles.LABEL_SPACING;

    //let x, y = [0, 0];
    //let x = 0;

    ctx.save();
    ctx.translate(x, y);

    x = 0;

    for (let [name, state] of Object.entries(this.states))
    {
      //console.log(state.radius);
      x += state.radius;

      ctx.fillStyle = "rgb(108, 163, 252)";
      ctx.beginPath();
      ctx.arc(x, 0, state.radius, 0, Math.PI * 2, false);
      //ctx.arc(100, 0, 50, 0, 2 * Math.PI);
      ctx.fill();

      ctx.font = "8pt sans-serif";
      ctx.fillStyle = "rgb(0, 0, 0)";
      let width = ctx.measureText(`${name}/${state.count}`).width;
      //let name1 = name[0].toUpperCase();
      ctx.fillText(`${name}/${state.count}`, x-width/2, StateBubbles.LABEL_SPACING);

      x += state.radius + StateBubbles.BUBBLE_SPACING;
    }

    ctx.restore();
  }
}

StateBubbles.MAX_RADIUS = 20;
StateBubbles.MIN_RADIUS = 2;
StateBubbles.BUBBLE_SPACING = 60; // in px
StateBubbles.LABEL_SPACING = 30;
