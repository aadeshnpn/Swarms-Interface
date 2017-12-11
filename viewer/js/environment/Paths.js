class Path{
  constructor(prevLocInfo,time){



    //console.log(prevLocInfo)
    // this.thickness = 1;
    // this.opacity=1;
    // this.hub=null
    this.key = null;
    this.x = this.getPos(prevLocInfo,"x");
    this.y = this.getPos(prevLocInfo,"y");
    this.enterTime = time || Math.floor(Date.now())
    this.opacity= (1/(this.enterTime-(this.getPos(prevLocInfo,"time"))))*10 +.5;
    prevLocInfo.delete(this.key)
    //console.log(this.opacity)
    this.color = "red"
    //'rgb(' + Math.floor(Math.random() * 256).toString() + ',' + Math.floor(Math.random() * 256).toString() + ',' + Math.floor(Math.random() * 256).toString() +')'
    //this.p = new Path(prevLocInfo,this.enterTime)


  }
  getPos(locInfo,val){
    for(var loc of locInfo){
      this.key=loc[0]

      var locArray=this.key.split(",")
      if(val =="x"){
        return parseInt(locArray[0])
      }
      else if(val =="y"){
        return parseInt(locArray[1])
      }
      else if(val =="time"){
        return loc[1]
      }
    }

  }


  draw(ctx, environment){
    //console.log(this.opacity)
    ctx.beginPath();
    ctx.arc(this.x, this.y, 20, 0, 2 * Math.PI);
    ctx.fillStyle = this.color;
    ctx.globalAlpha =this.opacity;
    ctx.fill()
    //this.opacity-=.1
    ctx.globalAlpha =1;
    this.opacity-=.001
    //console.log(this.opacity)
    //ctx.stroke();
  }
}
