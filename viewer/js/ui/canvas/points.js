class Point{
  constructor(pos,id,images){
    if(images.length == 0){
        console.log('No images in point: ', id)
    }
    this.newLoc={x:null,y:null}
    // this.dir={}
    this.arrowHeight=9/24
    this.leftArrowWidth=.5
    this.rightArrowWidth=.5
    this.rightArrow=false;
    this.leftArrow=false;
    this.velX=0;
    this.velY=0;
    this.x=Math.round(pos.x)
    this.y=Math.round(pos.y);
    this.radius=5
    this.siteId=id
    this.hovered=false;
    this.images=images
    this.shuffle(this.images)
    this.hoverDistance=10
    this.currentImage=0
    this.imageMaxWidth = 200;
	  this.imageMaxHeight = 200;
    this.imageBorderWidth = 2;
    this.image=new Image()
    this.pin=new Image()
    this.pin.src="../img/pin.png"
    this.fontSize=20
    this.left=null;
    this.right=null;
    this.top=null;
    this.bottom=null;
    this.pictureHover=false
    this.width;
    this.height
    this.bottomHovered=false
    this.topHovered=false
    this.buttonShadow=1.5;
    this.range = null
    this.pct = .8
    this.flash={on:false,timer:20};

    // console.log(mouse);
//        console.log(this.images)


  }

  shuffle (array) {
    var i = 0
      , j = 0
      , temp = null
    let arrayLength=array.length - 1
    for (i = arrayLength; i > 0; i -= 1) {
      j = Math.floor(Math.random() * (i + 1))
      temp = array[i]
      array[i] = array[j]
      array[j] = temp
    }
  }

  flashOn(ctx){
    ctx.beginPath()
    ctx.fillStyle="blue"
    ctx.globalAlpha=.5
    ctx.arc(Math.round(this.x), Math.round(-this.y), this.radius+this.hoverDistance+20, 0, 2 * Math.PI);
    ctx.fill()
    ctx.stroke()
    ctx.closePath()
    ctx.globalAlpha=1
  }

  drawPoints(ctx){
    // ctx.fillStyle="blue"
    // ctx.strokeStyle="black"
    // ctx.beginPath()
    // ctx.arc(this.x, -this.y, this.radius, 0, 2 * Math.PI);
    // ctx.fill()
    // ctx.stroke()
    // ctx.closePath()
    if(this.hovered){
      ctx.beginPath()
      ctx.fillStyle="blue"
      ctx.globalAlpha=.5
      ctx.arc(Math.round(this.x), Math.round(-this.y), this.radius+this.hoverDistance, 0, 2 * Math.PI);
      ctx.fill()
      ctx.stroke()
      ctx.closePath()
      ctx.globalAlpha=1
    }
    ctx.drawImage(this.pin, this.x-10, -this.y-10,20,20);


  }

  drawButtons(ctx){
    ctx.fillStyle="rgb(150,0,0)"
    ctx.shadowBlur=0
    ctx.shadowOffsetY = -this.buttonShadow;
    ctx.shadowColor = 'black';
    ctx.globalAlpha=.3
    ctx.fillRect(this.left,-this.bottom,this.width,-this.height/4)

    ctx.beginPath();
    ctx.globalAlpha=.5
    // ctx.moveTo(this.left+this.width/2, -this.bottom);
    // ctx.lineTo(this.left+this.width/2, -this.bottom-this.height/4);
    // ctx.stroke();
    ctx.lineWidth=2;
    ctx.moveTo(this.left, -this.bottom-this.height/4);
    ctx.lineTo(this.left+this.width, -this.bottom-this.height/4);
    ctx.stroke();
    ctx.lineWidth=1
    // ctx.closePath();
    // ctx.fill()
    ctx.globalAlpha=1
    ctx.font = this.fontSize.toString()+"px Arial";
    ctx.fillStyle="white"
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur=2
    ctx.shadowColor = 'black';
    let imageNum=(this.currentImage+1).toString()
    ctx.fillText("Deny Site",this.left+this.width/4,-this.bottom-this.height/8+(this.fontSize/3));
    ctx.shawdowBlur=0
    ctx.shadowOffsetX =0
    ctx.shadowOffsetY = 0;

  }

  makeRangeControl(x,y,width,height){
    var range={x:x,y:y,width:width,height:height};
    range.x1=range.x+range.width;
    range.y1=range.y;
    //
    range.pct=this.pct;
    return(range);
    console.log('Making range Control')
  }

  drawRangeSlider(ctx){
    // bar
    //  ctx.lineWidth=6;
    //  ctx.lineCap='round';
    //  ctx.beginPath();
    //  ctx.moveTo(this.range.x,this.range.y);
    //  ctx.lineTo(this.range.x1,this.range.y);
    //  ctx.strokeStyle='black';
    //  ctx.stroke();
    //  // thumb
    //  ctx.beginPath();
    //  var thumbX=this.range.x+this.range.width*this.range.pct;
    //  ctx.moveTo(thumbX,this.range.y - this.range.height/4);
    //  ctx.lineTo(thumbX,this.range.y + this.range.height/4);
    //  ctx.strokeStyle='rgba(255,0,0,0.25)';
    //  ctx.stroke();
    //  ctx.lineWidth=1
     // legend
    //  ctx.fillStyle='blue';
    //  ctx.textAlign='center';
    //  ctx.textBaseline='top';
    //  ctx.font='10px arial';
    //  ctx.fillText(parseInt(range.pct*100)+'%',range.x+range.width/2,range.y-range.height/2-2);
  }

  calculateImageInfo(){
    this.image.src=this.images[this.currentImage]

    this.width = this.image.width;
    this.height = this.image.height;
    // console.log(width);
    // scale image size

    if (this.width > this.imageMaxWidth) {
      let scale = this.imageMaxWidth / this.width;
      this.width = this.imageMaxWidth;
      this.height = this.height * scale;
    }

    if (this.height > this.imageMaxHeight) {
      let scale = this.imageMaxHeight / this.height;
      this.height = this.imageMaxHeight;
      this.width = this.width * scale;
    }

    // add border this.width

    this.width += 2 * this.imageBorderWidth;
    this.height += 2 * this.imageBorderWidth;

    // determine bounds for image to stay in view

    let xLimit = ctx.canvas.clientWidth / 2;
    let yLimit = ctx.canvas.clientHeight / 2;

    this.left = this.x - this.width / 2;

    if (this.left < -xLimit) {
      this.left = -xLimit;
    }

    this.right = this.left + this.width;
    if (this.right > xLimit) {
      this.right = xLimit;
      this.left = this.right - this.width;
    }

    this.top = this.y + this.height;
    if (this.top > yLimit) {
      this.top = yLimit;
    }

    this.bottom = this.top - this.height;
    if (this.bottom < -yLimit) {
      this.bottom = -yLimit;
      this.top = this.bottom + this.height;
    }
  }

  drawImages(ctx){

    this.calculateImageInfo()

    this.drawImageBackground(ctx)



    ctx.drawImage(this.image, Math.round(this.left) + Math.round(this.imageBorderWidth), Math.round(-this.top) + Math.round(this.imageBorderWidth),
      Math.round(this.width) - 2 * Math.round(this.imageBorderWidth), Math.round(this.height) - 2 * Math.round(this.imageBorderWidth));

    this.drawImageNum(ctx)
    this.drawPointNum(ctx)
    // this.drawPointNum(ctx)

    this.imageChangers(ctx)

  }

  imageChangers(ctx){


    ctx.lineWidth=this.leftArrowWidth
    ctx.fillStyle="rgb(120, 143, 194)"
    ctx.beginPath();
    //check between this.left and this.left+15
    //check between -this.bottom-this.height*height and -this.top+this.height*height
    ctx.moveTo(Math.round(this.left),Math.round(-this.bottom-this.height/2))

    ctx.lineTo(Math.round(this.left+10),Math.round(-this.bottom-this.height*this.arrowHeight))
    ctx.lineTo(Math.round(this.left+15),Math.round(-this.bottom-this.height*this.arrowHeight))
    ctx.lineTo(Math.round(this.left+5),Math.round(-this.bottom-this.height/2))

    ctx.lineTo(Math.round(this.left+15),Math.round(-this.top+this.height*this.arrowHeight))
    ctx.lineTo(Math.round(this.left+10),Math.round(-this.top+this.height*this.arrowHeight))
    ctx.lineTo(Math.round(this.left),Math.round(-this.bottom-this.height/2))
    // ctx.moveTo(Math.round(this.left), Math.round(-this.bottom)-50);
    // ctx.lineTo(Math.round(this.left+30), Math.round(-this.bottom)-50);
    // ctx.lineTo(Math.round(this.left+30), Math.round(-this.top)+50);
    // ctx.lineTo(Math.round(this.left), Math.round(-this.top)+50);
    // ctx.lineTo(Math.round(this.left), Math.round(-this.bottom)-50);
    ctx.fill()
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.lineWidth=this.rightArrowWidth

    //check between this.right-15 and this.right
    //check between -this.bottom-this.height*height and -this.top+this.height*height
    ctx.moveTo(Math.round(this.right),Math.round(-this.bottom-this.height/2))

    ctx.lineTo(Math.round(this.right-10),Math.round(-this.bottom-this.height*this.arrowHeight))
    ctx.lineTo(Math.round(this.right-15),Math.round(-this.bottom-this.height*this.arrowHeight))
    ctx.lineTo(Math.round(this.right-5),Math.round(-this.bottom-this.height/2))

    ctx.lineTo(Math.round(this.right-15),Math.round(-this.top+this.height*this.arrowHeight))
    ctx.lineTo(Math.round(this.right-10),Math.round(-this.top+this.height*this.arrowHeight))
    ctx.lineTo(Math.round(this.right),Math.round(-this.bottom-this.height/2))
    ctx.fill()
    ctx.stroke();
    ctx.closePath();
    ctx.lineWidth=1
  }

  drawImageBackground(ctx){
    ctx.lineWidth=3
    ctx.fillStyle="black"
    ctx.beginPath();
    ctx.moveTo(Math.round(this.left), Math.round(-this.bottom));
    ctx.lineTo(Math.round(this.right), Math.round(-this.bottom));
    ctx.lineTo(Math.round(this.right), Math.round(-this.top));
    ctx.lineTo(Math.round(this.left), Math.round(-this.top));
    ctx.lineTo(Math.round(this.left), Math.round(-this.bottom));
    ctx.fill()
    ctx.stroke();
    ctx.closePath();
    ctx.lineWidth=1
  }

  drawImageNum(ctx){
    let currImString=(this.currentImage+1).toString()
    let totalImString=(this.images.length).toString()
    // console.log(currImString);
    ctx.fillStyle="rgba(0,0,0,.5)"
    ctx.beginPath();
    ctx.moveTo(this.left, -this.top);
    ctx.lineTo(this.left, -this.top+this.fontSize*1.4);
    ctx.lineTo(this.left+this.fontSize*(currImString.length*.8+totalImString.length*.9), -this.top+this.fontSize*1.4);
    ctx.lineTo(this.left+this.fontSize*(currImString.length*.8+totalImString.length*.9), -this.top);
    // ctx.lineTo(this.left, -bottom);
    ctx.fill()
    ctx.stroke();
    ctx.closePath();

    ctx.font = this.fontSize.toString()+"px Arial";
    ctx.fillStyle="white"
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur=2
    ctx.shadowColor = 'black';
    let imageNum=(this.currentImage+1).toString()
    ctx.fillText(imageNum+"/"+(this.images.length).toString(),this.left+3,-this.top+this.fontSize);
    ctx.shawdowBlur=0
    ctx.shadowOffsetX =0
    ctx.shadowOffsetY = 0;
  }

  drawPointNum(ctx){
    let currImString=(this.siteId).toString()
    // let totalImString=(this.images.length).toString()
    // console.log(currImString);
    ctx.fillStyle="rgba(0,0,0,.5)"
    ctx.beginPath();
    ctx.moveTo(this.right, -this.top);
    ctx.lineTo(this.right, -this.top+this.fontSize*1.4);
    ctx.lineTo(this.right-this.fontSize*(currImString.length*.8), -this.top+this.fontSize*1.4);
    ctx.lineTo(this.right-this.fontSize*(currImString.length*.8), -this.top);
    // ctx.lineTo(this.left, -bottom);
    ctx.fill()
    ctx.stroke();
    ctx.closePath();

    ctx.font = this.fontSize.toString()+"px Arial";
    ctx.fillStyle="white"
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur=2
    ctx.shadowColor = 'black';
    let imageNum=(this.siteId).toString()
    ctx.fillText(imageNum,this.right-this.fontSize-5,-this.top+this.fontSize);
    ctx.shawdowBlur=0
    ctx.shadowOffsetX =0
    ctx.shadowOffsetY = 0;
  }

  dist(point2) {
    // use distance formula sqrt(x^2+y^2)
    return Math.sqrt(Math.pow(this.x - (point2.x-(world.width/2)), 2) + Math.pow(this.y - -(point2.y-(world.height/2)), 2));
  }

  isHovered(mouse,world) {

		return this.dist( mouse) <= this.radius+this.hoverDistance;
  }

  rightArrowHovered(mouse,world){

  }
  leftArrowHovered(mouse,world){

  }

  pictureHovered(mouse,world){
    let xLim=mouse.x-(world.width/2)>this.left && mouse.x-(world.width/2)<this.left+this.width
    let yLim=-(mouse.y-(world.height/2))<this.top && -(mouse.y-(world.height/2)) > this.top-this.height
    // console.log(-(mouse.y-(world.height/2)));
    // console.log(this.top +" image Top");
    // console.log(yLim);
    return xLim &&yLim;
  }

  bottomOfImage(mouse,world){
    let xLim=mouse.x-(world.width/2)>this.left && mouse.x-(world.width/2)<this.left+this.width
    let yLim=-(mouse.y-(world.height/2))<this.bottom+(this.height/4) && -(mouse.y-(world.height/2)) > this.bottom

    return xLim &&yLim;
  }

  topOfImage(mouse,world){
    let xLim=mouse.x-(world.width/2)>this.left && mouse.x-(world.width/2)<this.left+this.width
    let yLim=-(mouse.y-(world.height/2))<this.bottom+this.height && -(mouse.y-(world.height/2)) > this.bottom

    return xLim &&yLim;
  }

  isDown(mouse,world){
    return mouse.x-(world.width/2)>this.range.x && mouse.x-(world.width/2) < this.range.x+this.range.width && mouse.y - (world.height/2)>this.range.y-this.range.height/2 && mouse.y-(world.height/2)<this.range.y+this.range.height/2;
  }

}
