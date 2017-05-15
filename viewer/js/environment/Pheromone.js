class Pheromone
{
  constructor(pheromonesJson)
  {
    this.pheromones = [];
    for (var pheromone of pheromonesJson)   { this.pheromones .push(pheromone); }
  }

  draw(ctx, debug = false) //then swap out hard coded radius for the dynamic
  //property you added above. Then consider working on adding user input for radius #done?
  {
    if (!debug)
        return;
    //ctx.save();
    ctx.fillStyle = Pheromone.FILL_STYLE;
    ctx.strokeStyle = Pheromone.STROKE_STYLE;
    for (var pheromone of this.pheromones){
        ctx.save();
        console.log("x: " + pheromone.x.toString());
        console.log("y: " + pheromone.y.toString());

        ctx.translate(pheromone.x, -pheromone.y);
        ctx.rect(0, 0, 1, 1);
        //ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    //ctx.restore();
  }
}

Pheromone.FILL_STYLE = "rgba(255, 255, 0, 0.75)";
Pheromone.STROKE_STYLE = "rgb(255, 255, 0)";