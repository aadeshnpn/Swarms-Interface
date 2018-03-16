class Point{
  constructor(pos,id,images){
    this.x=pos.x
    this.y=pos.y;
    this.radius=5
    this.siteId=id
    this.hovered=false;
    this.images=images.slice()
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
    // console.log(mouse);

  }

  shuffle (array) {
    var i = 0
      , j = 0
      , temp = null

    for (i = array.length - 1; i > 0; i -= 1) {
      j = Math.floor(Math.random() * (i + 1))
      temp = array[i]
      array[i] = array[j]
      array[j] = temp
    }
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
      ctx.arc(this.x, -this.y, this.radius+this.hoverDistance, 0, 2 * Math.PI);
      ctx.fill()
      ctx.stroke()
      ctx.closePath()
      ctx.globalAlpha=1
    }
    ctx.drawImage(this.pin, this.x-10, -this.y-10,20,20);


  }
  drawImages(ctx){
    // console.log(this.images.length);
    this.image.src=this.images[this.currentImage]
    let width = this.image.width;
    let height = this.image.height;
    // console.log(width);
    // scale image size

    if (width > this.imageMaxWidth) {
      let scale = this.imageMaxWidth / width;
      width = this.imageMaxWidth;
      height = height * scale;
    }

    if (height > this.imageMaxHeight) {
      let scale = this.imageMaxHeight / height;
      height = this.imageMaxHeight;
      width = width * scale;
    }

    // add border width

    width += 2 * this.imageBorderWidth;
    height += 2 * this.imageBorderWidth;

    // determine bounds for image to stay in view

    let xLimit = ctx.canvas.clientWidth / 2;
    let yLimit = ctx.canvas.clientHeight / 2;

    let left = this.x - width / 2;

    if (left < -xLimit) {
      left = -xLimit;
    }

    let right = left + width;
    if (right > xLimit) {
      right = xLimit;
      left = right - width;
    }

    let top = this.y + height;
    if (top > yLimit) {
      top = yLimit;
    }

    let bottom = top - height;
    if (bottom < -yLimit) {
      bottom = -yLimit;
      top = bottom + height;
    }
    // console.log(this.image);
    // ctx.drawImage(this.image,0,0,20,20)
    // console.log(left);
    // log
    ctx.lineWidth=3
    ctx.fillStyle="black"
    ctx.beginPath();
    ctx.moveTo(left, -bottom);
    ctx.lineTo(right, -bottom);
    ctx.lineTo(right, -top);
    ctx.lineTo(left, -top);
    ctx.lineTo(left, -bottom);
    ctx.fill()
    ctx.stroke();
    ctx.closePath();
    ctx.lineWidth=1


    ctx.drawImage(this.image, left + this.imageBorderWidth, -top + this.imageBorderWidth,
      width - 2 * this.imageBorderWidth, height - 2 * this.imageBorderWidth);
    let currImString=(this.currentImage+1).toString()
    // console.log(currImString);
    ctx.fillStyle="rgba(0,0,0,.5)"
    ctx.beginPath();
    ctx.moveTo(left, -top);
    ctx.lineTo(left, -top+this.fontSize*1.4);
    ctx.lineTo(left+this.fontSize*(currImString.length)*.8, -top+this.fontSize*1.4);
    ctx.lineTo(left+this.fontSize*(currImString.length)*.8, -top);
    // ctx.lineTo(left, -bottom);
    ctx.fill()
    ctx.stroke();
    ctx.closePath();

    ctx.font = this.fontSize.toString()+"px Arial";
    ctx.fillStyle="white"
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur=2
    ctx.shadowColor = 'black';
    ctx.fillText(this.currentImage+1,left+3,-top+this.fontSize);
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


}
