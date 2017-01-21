class Rough
{
  constructor(roughJson)
  {
    this.x      =  roughJson[0];
    this.y      = -roughJson[1];
    this.radius =  roughJson[2];
  }

  draw(ctx, debug = false)
  {
    // TBD
  }
}
