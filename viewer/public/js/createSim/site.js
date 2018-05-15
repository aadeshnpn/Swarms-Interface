class Site{
  constructor(x,y){
    this.x=x;
    this.y=y;
    this.r=5
    let r=(194).toString();
    let g=(194).toString();
    let b=(0).toString();
    this.color="rgb("+r+","+g+","+b+")"

    this.percentageX=this.x/width
    this.percentageY=this.y/height
  }
  draw(ctx){
    ctx.beginPath()
    ctx.fillStyle=this.color
    ctx.strokeStyle="black"
    ctx.globalAlpha=.5
    ctx.arc(this.x,this.y,this.r,0,2*Math.PI)
    ctx.fill()
    ctx.lineWidth=1
    ctx.stroke()
    ctx.globalAlpha=1
  }
}
