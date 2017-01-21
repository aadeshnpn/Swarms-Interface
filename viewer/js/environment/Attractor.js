class Attractor
{
  constructor(attractorJson)
  {
    this.x     = attractorJson.x;
    this.y     = attractorJson.y;
    this.timer = attractorJson.timer;
  }

  draw(ctx, debug = false)
  {
    ctx.save()

    ctx.translate(this.x, this.y);
    ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
    ctx.strokeStyle = "rgb(0, 255, 0)";

    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2, false);
    ctx.fill();

    ctx.stroke();

    ctx.restore();
  }
}
