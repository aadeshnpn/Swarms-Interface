class Trap
{
  constructor(trapJson)
  {
    this.x      =  trapJson["x"];
    this.y      = -trapJson["y"];
    this.radius =  trapJson["radius"];
  }

  draw(ctx, debug = false)
  {
    ctx.save();

    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
    ctx.strokeStyle = "rgb(255, 0, 0)";
    ctx.translate(this.x, this.y);

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}
