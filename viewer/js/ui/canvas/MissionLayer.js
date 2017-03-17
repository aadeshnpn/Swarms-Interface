class MissionLayer
{
  constructor(ui)
  {
    this.points = [];

    ui.register('updateMission', this.update.bind(this));
    ui.register('restart',       this.reset.bind(this));
  }

  update(data)
  {
    this.points.push(data);
  }

  draw(ctx, debug = false)
  {
    ctx.save();

    for (let point of this.points)
    {
      var rVal = (point.q > 0.5) ? (1.0 - point.q) * 2 : 1.0;
      var gVal = (point.q > 0.5) ? 1.0 : point.q * 2;

      ctx.fillStyle   = `rgba(${Math.round(255 * rVal)}, ${Math.round(255 * gVal)}, 70, 0.8)`;
      ctx.strokeStyle = "rgb(20, 20, 20)";

      ctx.beginPath();
      ctx.arc(point.x, -point.y, 5, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  reset()
  {
     this.points = [];
  }
}
