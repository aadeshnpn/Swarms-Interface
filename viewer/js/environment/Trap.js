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
    if (!debug)
      return;

    ctx.save();

    ctx.fillStyle = "rgb(122, 18, 18)";
    ctx.strokeStyle = "rgb(122, 18, 18)";
    ctx.translate(this.x, this.y);

    ctx.beginPath();
    ctx.moveTo(this.radius, 0);

    //ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
    //ctx.fill();

    for (let i = 0; i <= 360; i += 5)
    {
      // check if i is even or odd
      let pointRadius = (i & 1 == 1) ? this.radius : this.radius - 5;

      ctx.lineTo(pointRadius * Math.cos(i * Math.PI/180), -(pointRadius * Math.sin(i * Math.PI/180)));
    }

    ctx.fill();
    ctx.stroke();

    /*ctx.font = "14pt sans-serif";
    ctx.fillStyle = "rgb(0, 0, 0)";
    let width = ctx.measureText("Trap").width;
    ctx.fillText("Trap", -width/2, 20 + this.radius);*/

    ctx.restore();
  }
}
