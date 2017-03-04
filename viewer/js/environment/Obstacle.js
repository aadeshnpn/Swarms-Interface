class Obstacle
{
  constructor(obstacleJson)
  {
    this.x      =  obstacleJson["x"];
    this.y      = -obstacleJson["y"];
    this.radius =  obstacleJson["radius"];
  }

  draw(ctx, debug = false)
  {
    if (!debug)
      return;

    ctx.save();

    // obstacle coordinates are for the centre, so we need to adjust
    // to a top-left position
    ctx.translate(this.x - (this.radius), this.y - (this.radius));

    // img, x, y, width, height
    ctx.drawImage(obstacle, 0, 0, this.radius * 2, this.radius * 2);

    ctx.font = "14pt sans-serif";
    ctx.fillStyle = "rgb(0, 0, 0)";
    let width = ctx.measureText("Obstacle").width;
    ctx.fillText("Obstacle", this.radius - width/2, this.radius + 20 + this.radius);

    ctx.restore();
  }
}
