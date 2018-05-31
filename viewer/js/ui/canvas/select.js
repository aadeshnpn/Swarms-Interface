class Select{
  constructor(x,y,r){
    this.x=x;
    this.y=y
    // console.log(r);
    // console.log(r);

    this.r=r||5
  }
  draw(ctx){
    // ctx.globalAlpha=.5
    ctx.beginPath()
    ctx.arc(this.x,this.y, this.r, 0, 2 * Math.PI);
    ctx.strokeStyle="rgba(0,0,0,0.5)";
    ctx.fillStyle="rgba(255, 255, 255, 1)";

    ctx.fill();
    ctx.globalAlpha=1
    // ctx.stroke();
  //

  }



}
