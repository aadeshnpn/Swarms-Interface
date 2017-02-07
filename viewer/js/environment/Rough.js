class Rough
{
  constructor(roughJson)
  {
    this.x      =  roughJson["x"];
    this.y      = -roughJson["y"];
    this.radius =  roughJson["radius"];
  }

  draw(ctx, debug = false)
  {
    ctx.save();

    ctx.fillStyle = "rgba(244, 164, 96, 0.5)";
    ctx.strokeStyle = "rgb(244, 164, 96)";
    ctx.translate(this.x, this.y);

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}
