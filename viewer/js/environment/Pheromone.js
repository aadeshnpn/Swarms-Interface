class Pheromone
{
  constructor(pheromonesJson)
  {
    this.pheromones = [];
    if (pheromonesJson != ''){
        for (var pheromone of pheromonesJson)   { this.pheromones .push(pheromone); }
    }

  }

  draw(ctx, debug = false) //then swap out hard coded radius for the dynamic
  //property you added above. Then consider working on adding user input for radius #done?
  {
    if (!debug)
        return;
    ctx.save();
    //ctx.fillStyle = Pheromone.FILL_STYLE;
    //ctx.strokeStyle = Pheromone.STROKE_STYLE;
    ctx.fillStyle = "rgba(255, 255, 0, 0.75)";
    ctx.strokeStyle = "rgb(255, 255, 0)";
    var count = 0;
    for (var pheromone of this.pheromones){
        ctx.save();
        //console.log("x: " + pheromone.x.toString());
        //console.log("y: " + pheromone.y.toString());
        count += 1;
        ctx.translate(pheromone.x-3, -pheromone.y-3);
        ctx.rect(0,0, 9, 9);
        ctx.fill();
        //ctx.stroke();
        ctx.restore();
    }
    //console.log(count)
    ctx.restore();
  }
}

//Pheromone.FILL_STYLE = "rgba(255, 255, 0, 0.75)";
//Pheromone.STROKE_STYLE = "rgb(255, 255, 0)";