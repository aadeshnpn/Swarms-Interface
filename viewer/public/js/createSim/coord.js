class Coord{
  constructor(x,y,id){
    this.id=id
    this.x=x;
    this.y=y
    this.maxTimer=20
    this.left=this.x-15
    this.right=this.x+15
    this.leftX=this.x-10
    this.rightX=this.x+10
    this.bottom=this.y+14.75
    this.top=this.y-14.75
    this.selected=false
    this.flash=false
    this.flashTimer=this.maxTimer
    this.selectMode=0
  }

  selecting(points,selectMode){
    for(let point of points){
      var dx = this.x - point.x ;
      var dy = this.y - point.y ;
      var distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < point.r+5) {
        this.selected=true;
        this.selectMode=selectMode
        this.flash=true

      }else{
        // this.selected=false
      }
    }
  }

  draw(ctx){

    // ctx.stroke();
    // ctx.fillStyle="rgba(200, 0, 0, 1)";

    if(this.selected){
      ctx.fillStyle=Object.entries(Coord.stateStyles)[this.selectMode][1];
      // ctx.strokeStyle="rgba(0,0,0,0.5)";
    }
    ctx.globalAlpha=.3
    ctx.beginPath()
    ctx.moveTo(this.left,this.y)
    ctx.lineTo(this.leftX,this.top)
    ctx.lineTo(this.rightX,this.top)
    ctx.lineTo(this.right,this.y)
    ctx.lineTo(this.rightX,this.bottom)
    ctx.lineTo(this.leftX,this.bottom)
    ctx.lineTo(this.left,this.y)
    ctx.fill()
    ctx.stroke()
    ctx.globalAlpha=1

  }
}
Coord.stateStyles = {
  'Patrol'    :'rgb(  0, 0, 255)',                         // No coloring
  'Avoid'  :'rgb(  255, 0, 0)', // Green
  'Empty1'  :'rgb(  0, 255, 0)', // Green
  'Empty2'  :'rgb(  150, 0, 255)' // Greenrgb(150, 0, 255)

}
