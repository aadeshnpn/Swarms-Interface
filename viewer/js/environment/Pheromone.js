class Pheromone
{
  constructor(pheromonesJson)
  {
    this.pheromones = pheromonesJson;
  }

  draw(ctx, debug = false)
  {
    if (!debug || !this.pheromones || this.pheromones.length == 0)
        return;

    ctx.save();

    ctx.fillStyle = Pheromone.FILL_STYLE;

    for (let pheromone of this.pheromones)
    {
        ctx.fillRect(pheromone.x - 3, -pheromone.y - 3, 9, 9);
    }

    ctx.restore();
  }
}

Pheromone.FILL_STYLE = "rgba(255, 255, 0, 0.75)";
