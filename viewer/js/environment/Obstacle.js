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
    ctx.save();

    // obstacle coordinates are for the centre, so we need to adjust
    // to a top-left position
    ctx.translate(this.x - (this.radius), this.y - (this.radius));

    // img, x, y, width, height
    ctx.drawImage(obstacle, 0, 0, this.radius * 2, this.radius * 2);

    ctx.restore();
  }
}
