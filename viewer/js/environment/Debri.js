class Debri
{
  constructor(debriJson)
  {
    this.x      =  debriJson["x"];
    this.y      = -debriJson["y"];
    this.radius =  debriJson["radius"];
  }

  draw(ctx, debug = false)
  {
    if (!debug)
      return;

    ctx.save();

    ctx.fillStyle = "rgb(122, 18, 18)";
    ctx.strokeStyle = "rgb(122, 18, 18)";
    ctx.translate(this.x, this.y);

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
