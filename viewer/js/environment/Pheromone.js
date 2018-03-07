class Pheromone
{
  constructor(pheromonesJson)
  {
    this.pheromones = pheromonesJson;
    this.color=self.pickColor()
  }

  pickColor(){
    let x=255-(this.pheromone.site_id*8);
    if(x <=0){
      x=0;
    }
    return "rgb("+x.toString()+","+x.toString()+","+x.toString()+")"
  }

  draw(ctx, debug = false)
  {
    if (!debug || !this.pheromones || this.pheromones.length == 0)
        return;
    ctx.save();

    ctx.fillStyle = this.color;

    //for (let pheromone of this.pheromones)
    //{
    //console.log(this.pheromones);
    ctx.globalAlpha = this.pheromones.strength
    ctx.beginPath()
    ctx.arc(this.pheromones.x, -this.pheromones.y, this.pheromones.r,0,Math.PI*2);
    //}
    ctx.fill();
    ctx.globalAlpha = 1
    ctx.restore();
  }
}

Pheromone.FILL_STYLE = "rgb(255, 255, 0)";
