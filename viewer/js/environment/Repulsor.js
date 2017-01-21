class Repulsor
{
  constructor(repulsorJson)
  {
    this.x     = repulsorJson.x;
    this.y     = repulsorJson.y;
    this.timer = repulsorJson.timer;
  }

  draw(ctx, debug = false)
  {
    ctx.save()

    ctx.translate(this.x, this.y);
    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
    ctx.strokeStyle = "rgb(255, 0, 0)";

    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}
