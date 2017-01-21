class Hub
{
  constructor(hubJson)
  {
    this.x      =  hubJson[0];
    this.y      = -hubJson[1];
    this.radius =  hubJson[2];
  }

  draw(ctx, debug = false)
  {
    ctx.save();

    ctx.fillStyle = "rgba(242, 179, 19, 0.4)";
    ctx.strokeStyle = "rgb(242, 179, 19)";
    ctx.lineWidth = 2;
    ctx.translate(this.x, this.y);

    // make sure the hub is visible
    // TODO: don't hack it like this? discuss whether it should just be set
    //       to a more reasonable value

    var radius = (this.radius < 20) ? 20 : this.radius;

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}
