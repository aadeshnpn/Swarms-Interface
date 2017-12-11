class Site
{
  // site json format = [ x, y, radius, quality ]
  constructor(siteJson)
  {
    this.x      =  siteJson["x"];
    this.y      = -siteJson["y"]; // drawing coordinates have down as positive y
    this.radius =  siteJson["radius"];
    this.q      =  siteJson["q_value"];
  }

  draw(ctx, debug = false)
  {
    if (!debug)
      return;

    var rVal = (this.q > 0.5) ? (1.0 - this.q) * 2 : 1.0;
    var gVal = (this.q > 0.5) ? 1.0 : this.q * 2;

    ctx.save();

    ctx.fillStyle   = `rgba(${Math.round(255 * rVal)}, ${Math.round(255 * gVal)}, 70, 0.8)`;
    ctx.strokeStyle = "rgb(20, 20, 20)";
    ctx.translate(this.x, this.y);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();

    if (debug == true)
    {
      /*ctx.font = "14pt sans-serif";
      ctx.fillStyle = "rgb(0, 0, 0)";
      let width = ctx.measureText(`Site: ${this.q}`).width;
      ctx.fillText(`Site: ${this.q}`, -width/2, 20 + this.radius);*/
    }

    ctx.restore();
  }
}
