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

    ctx.translate(this.x, -this.y);
    ctx.fillStyle = Attractor.FILL_STYLE;
    ctx.strokeStyle = Attractor.STROKE_STYLE;

    ctx.beginPath();
    ctx.arc(0, 0, Attractor.RADIUS, 0, Math.PI * 2, false);
    ctx.fill();

    ctx.stroke();

    ctx.restore();
  }
}

Attractor.FILL_STYLE = "rgba(0, 255, 0, 0.5)";
Attractor.STROKE_STYLE = "rgb(0, 255, 0)";
Attractor.RADIUS = 40; // really ought to get this passed to us from the engine
