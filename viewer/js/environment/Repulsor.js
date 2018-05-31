class Repulsor
{
  constructor(repulsorJson)
  {
    this.x      = repulsorJson.x;
    this.y      = repulsorJson.y;
    this.radius = repulsorJson.radius;
    this.timer  = repulsorJson.timer;
  }

  draw(ctx, debug = false)
  {
    ctx.save()

    ctx.translate(this.x, -this.y);
    ctx.fillStyle = Repulsor.FILL_STYLE;
    ctx.strokeStyle = Repulsor.STROKE_STYLE;

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

Repulsor.FILL_STYLE = "rgba(255, 0, 0, 0.5)";
Repulsor.STROKE_STYLE = "rgb(255, 0, 0)";
