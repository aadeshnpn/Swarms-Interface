class Agent{
  constructor(x,y,rot){
    this.x=x;
    this.y=y;
    this.rotation=rot
    // console.log(this.rotation);
    this.percentageX=this.x/width
    this.percentageY=this.y/height
    this.percentageR=this.r/width
    this.toRadians=Math.PI/180
    this.image=document.getElementById("Drone");
  }
  draw(ctx){
    ctx.save();
    ctx.translate(this.x, this.y)

    ctx.rotate(this.rotation*this.toRadians);
    ctx.drawImage(this.image, -this.image.width/2, -this.image.height/2);
    ctx.restore();
    ctx.restore()
    // ctx.restore()
    // ctx.restore()
  }
}
