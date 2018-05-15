/*
1. lookup event listener for scroll                                                             -done
2. make a new function on scroll line -- copy line 15 and replace the function type             -done
3. add new member to object called "radius" similar to line 17, initialize to 40                -done
4. in on-scroll function you made, loopup details of event --mozilla docu. for scroll events    -done
to find out if scrolling up is positive value or whatver                                        -done
5. in the draw routine, replace radius (currently line 59) with the new member                  -done
6. on onmousedowbn, replace hard coded radius with object member

*/



class BaitBombGhost
{
  constructor(ui)
  {
    cursors.placeBaitBomb.addEventListener('mousemove', this.onMouseMove.bind(this));
    cursors.placeBaitBomb.addEventListener('mousedown', this.onMouseDown.bind(this)); //the this-this syntax is to help js be oo
    // cursors.placeBaitBomb.addEventListener('wheel', this.onWheel.bind(this));
    this.cursorCoords = {x: null, y: null};
    this.radius = 40;
    this.active = false;
    this.baitBombs=[]

    ui.register('restart', this.reset.bind(this));
  }

  update()
  {
     // no-op
  }

  draw(ctx, debug = false)
  {
    if (!this.active)
      return;

    var fill, stroke;  //kill radius -- should I bnot replace it with this.radius?

    if (cursors.placeBaitBomb.mode == CursorPlaceBaitBomb.MODE_BAIT)
    {
      fill   = Attractor.FILL_STYLE;
      stroke = Attractor.STROKE_STYLE;
    }
    else
    {
      fill   = Repulsor.FILL_STYLE;
      stroke = Repulsor.STROKE_STYLE;
    }

    ctx.save();

    ctx.globalAlpha = 0.2;
    ctx.translate(this.cursorCoords.x, -this.cursorCoords.y);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);  //change to object memeber --is that correct?
    ctx.fill();

    ctx.stroke();

    ctx.restore();

  }

  onMouseMove(e)
  {
    if (!this.active)
      this.active = true;

    let worldRelative = world.canvasToWorldCoords(e.offsetX, e.offsetY);
    this.cursorCoords.x = worldRelative.x;
    this.cursorCoords.y = worldRelative.y;
  }

  onMouseDown(e) //I don't see radius here to change for #6
  {
    let worldRelative = world.canvasToWorldCoords(e.offsetX, e.offsetY);
    var entityType = (cursors.placeBaitBomb.mode == CursorPlaceBaitBomb.MODE_BAIT) ? 'attractor' : 'repulsor';
    var info={type: entityType, x: worldRelative.x, y: worldRelative.y, radius: this.radius}
    socket.emit('input', info);
    //this.baitBombs.push({type: entityType, x: worldRelative.x, y: worldRelative.y, radius: this.radius})
    this.active = false;
    ui.setActiveCursor(cursors.default);
  }

  onWheel(e)
  {
    this.radius = Math.max(1, this.radius + (e.deltaY / -10)); //not sure how to put the dynamic part.
    e.preventDefault();
  }

  reset()
  {
    this.cursorCoords = {x: null, y: null};
    this.active = false;
  }
}

class MissionLayer {


	constructor(ui) {
		this.mouse={x:undefined,y:undefined}
		this.drawSize=40
    this.isDown = false
		this.points =[]
		this.hoveredPoint=false;
		this.canvasClicked=false;

		this.worldWidth=undefined
		this.worldHeight=undefined

		// create list of images
		// this.siteImages = [];
		this.enemyImages = [[],[]]
		this.neutralImages = [[],[]];
		this.loadSiteImages();

		this.rect=canvas.getBoundingClientRect()


		ui.register('updateMission', this.update.bind(this));
		//console.log(this.update.bind(this));
		ui.register('restart', this.reset.bind(this));

		cursors.default.addEventListener('mousemove', this.onMouseMove.bind(this));
		cursors.default.addEventListener('wheel', this.onMouseWheel.bind(this));
		cursors.default.addEventListener('mousedown', this.onMouseDown.bind(this));
		cursors.default.addEventListener('mouseup', this.onMouseUp.bind(this));



	}
	update(data) {
		// console.log("should be updating point "+data.id);
		if(!this.hoveredPoint){
			document.getElementById("canvas").style.cursor = "default";
		}
		let update=false;
		for(let point of this.points){
			if(point.siteId==data.id){

				update=true
				point.x=Math.round(data.x)
				point.y=Math.round(data.y)
				// point.flash.on=true;
				// point.images.push(this.enemyImages[Math.floor(Math.random() *this.enemyImages.length)])
        //        console.log( this.enemyImages[Math.floor(Math.random() *this.enemyImages.length)])
              //  point.images = this.enemyImages[Math.floor(Math.random() *this.enemyImages.length)]

			}
		}
		if(!update){
			 if(data.site_q == 0.1){
		        this.points.push(new Point({x:data.x,y:data.y},data.id,this.neutralImages[Math.floor(Math.random() *(this.neutralImages.length - 2))]))

		    }
		    else{
		        this.points.push(new Point({x:data.x,y:data.y},data.id,this.enemyImages[Math.floor(Math.random() *(this.enemyImages.length - 2))]))
		    }
		}
		// }
		// this can really slow down the ui if it gets out of hand
		if (this.points.length > 200) { // only keep the most recent 200 points
			// this.points.shift();
			this.points.shift()
		}

	}
	draw(ctx, debug = false) {

		ctx.save();
		let i=0


		for(let point of this.points){

			if(point.flash.on){
				point.flashOn(ctx);
				point.flash.timer--;
				// console.log(point.flash.timer);
			}
			point.drawPoints(ctx)
			// if(point.newLoc.x!=null){
			// 	point.moveToNewLoc();
			//
			// }
			if(point.flash.timer<=0){
				point.flash.timer=20;
				point.flash.on=false;
			}
		}
		if(this.worldWidth ==undefined){
				this.worldWidth=world.width
		}
		if(this.worldHeight==undefined){
			this.worldHeight=world.height
		}
		if(!this.hoveredPoint){
			ctx.beginPath()
			ctx.lineWidth=3
			// console.log(Fog.stateStyles);
			ctx.arc(this.mouse.x-(world.width/2),this.mouse.y-(world.height/2),this.drawSize,0,Math.PI*2)
			ctx.strokeStyle=Object.entries(Fog.stateStyles)[currentSelectMode][1];
			ctx.stroke();
		}



		for(let point of this.points){
			if(point.hovered){
				point.drawImages(ctx)
                point.range = point.makeRangeControl(point.left, -point.bottom -point.height, point.width, point.height)

				if(point.bottomHovered){
					point.drawButtons(ctx);
					//point.drawRangeSlider(ctx);
				}
				if(point.topHovered){
                    point.drawRangeSlider(ctx);
				}
			}else{
				point.currentImage=0
			}
		}
		ctx.restore();
	}
	reset() {
		this.points = [];
		this.clusters = [];
		//this.siteImages = [];
		this.enemyImages = [[],[]]
		this.hoveredPoint = null;
		this.loadSiteImages();
	}
	loadSiteImages() {
		//		let numOfImages = 12;
				// load in names of image files
		//		for (let i = 1; i <= numOfImages; i++) {
		//			this.siteImages.push("../siteImages/" + (i < 10 ? "0" : "") + i + ".jpg");
		//		}

        for( var i=0; i<5; i++){
            this.enemyImages.push([]);
        }

        this.enemyImages[0].push("../siteImages2/ArmyGuy1/IMG_1404.JPG")
        this.enemyImages[0].push("../siteImages2/ArmyGuy1/IMG_1405.JPG")
        this.enemyImages[0].push("../siteImages2/ArmyGuy1/IMG_1406.JPG")
        this.enemyImages[0].push("../siteImages2/ArmyGuy1/IMG_1407.JPG")
        this.enemyImages[0].push("../siteImages2/ArmyGuy1/IMG_1408.JPG")
        this.enemyImages[0].push("../siteImages2/ArmyGuy1/IMG_1409.JPG")
        this.enemyImages[0].push("../siteImages2/ArmyGuy1/IMG_1410.JPG")
        this.enemyImages[0].push("../siteImages2/ArmyGuy1/IMG_1411.JPG")
        this.enemyImages[0].push("../siteImages2/ArmyGuy1/IMG_1412.JPG")

        this.enemyImages[1].push("../siteImages2/ArmyGuy2/IMG_1395.JPG")
        this.enemyImages[1].push("../siteImages2/ArmyGuy2/IMG_1396.JPG")
        this.enemyImages[1].push("../siteImages2/ArmyGuy2/IMG_1397.JPG")
        this.enemyImages[1].push("../siteImages2/ArmyGuy2/IMG_1398.JPG")
        this.enemyImages[1].push("../siteImages2/ArmyGuy2/IMG_1399.JPG")
        this.enemyImages[1].push("../siteImages2/ArmyGuy2/IMG_1400.JPG")
        this.enemyImages[1].push("../siteImages2/ArmyGuy2/IMG_1401.JPG")
        this.enemyImages[1].push("../siteImages2/ArmyGuy2/IMG_1402.JPG")
        this.enemyImages[1].push("../siteImages2/ArmyGuy2/IMG_1403.JPG")

        this.enemyImages[2].push("../siteImages2/ArmyGuy3/IMG_1387.JPG")
        this.enemyImages[2].push("../siteImages2/ArmyGuy3/IMG_1388.JPG")
        this.enemyImages[2].push("../siteImages2/ArmyGuy3/IMG_1390.JPG")
        this.enemyImages[2].push("../siteImages2/ArmyGuy3/IMG_1391.JPG")
        this.enemyImages[2].push("../siteImages2/ArmyGuy3/IMG_1392.JPG")
        this.enemyImages[2].push("../siteImages2/ArmyGuy3/IMG_1393.JPG")
        this.enemyImages[2].push("../siteImages2/ArmyGuy3/IMG_1394.JPG")

        this.enemyImages[3].push("../siteImages2/ArmyGuy4/IMG_1373.JPG")
        this.enemyImages[3].push("../siteImages2/ArmyGuy4/IMG_1374.JPG")
        this.enemyImages[3].push("../siteImages2/ArmyGuy4/IMG_1375.JPG")
        this.enemyImages[3].push("../siteImages2/ArmyGuy4/IMG_1377.JPG")
        this.enemyImages[3].push("../siteImages2/ArmyGuy4/IMG_1378.JPG")
        this.enemyImages[3].push("../siteImages2/ArmyGuy4/IMG_1379.JPG")
        this.enemyImages[3].push("../siteImages2/ArmyGuy4/IMG_1382.JPG")
        this.enemyImages[3].push("../siteImages2/ArmyGuy4/IMG_1383.JPG")

        this.enemyImages[4].push("../siteImages2/ArmyTruck/IMG_1357.JPG")
        this.enemyImages[4].push("../siteImages2/ArmyTruck/IMG_1361.JPG")
        this.enemyImages[4].push("../siteImages2/ArmyTruck/IMG_1363.JPG")
        this.enemyImages[4].push("../siteImages2/ArmyTruck/IMG_1364.JPG")
        this.enemyImages[4].push("../siteImages2/ArmyTruck/IMG_1366.JPG")
        this.enemyImages[4].push("../siteImages2/ArmyTruck/IMG_1367.JPG")
        this.enemyImages[4].push("../siteImages2/ArmyTruck/IMG_1368.JPG")
        this.enemyImages[4].push("../siteImages2/ArmyTruck/IMG_1371.JPG")
        this.enemyImages[4].push("../siteImages2/ArmyTruck/IMG_1372.JPG")

        for( var i=0; i<7; i++){
            this.neutralImages.push([]);
        }

        this.neutralImages[0].push("../siteImages2/Cat/IMG_1431.JPG")
        this.neutralImages[0].push("../siteImages2/Cat/IMG_1432.JPG")
        this.neutralImages[0].push("../siteImages2/Cat/IMG_1433.JPG")
        this.neutralImages[0].push("../siteImages2/Cat/IMG_1434.JPG")
        this.neutralImages[0].push("../siteImages2/Cat/IMG_1435.JPG")
        this.neutralImages[0].push("../siteImages2/Cat/IMG_1436.JPG")
        this.neutralImages[0].push("../siteImages2/Cat/IMG_1437.JPG")
        this.neutralImages[0].push("../siteImages2/Cat/IMG_1438.JPG")
        this.neutralImages[0].push("../siteImages2/Cat/IMG_1439.JPG")
        this.neutralImages[0].push("../siteImages2/Cat/IMG_1440.JPG")

        this.neutralImages[1].push("../siteImages2/Cow/IMG_1422.JPG")
        this.neutralImages[1].push("../siteImages2/Cow/IMG_1423.JPG")
        this.neutralImages[1].push("../siteImages2/Cow/IMG_1424.JPG")
        this.neutralImages[1].push("../siteImages2/Cow/IMG_1425.JPG")
        this.neutralImages[1].push("../siteImages2/Cow/IMG_1426.JPG")
        this.neutralImages[1].push("../siteImages2/Cow/IMG_1427.JPG")
        this.neutralImages[1].push("../siteImages2/Cow/IMG_1428.JPG")
        this.neutralImages[1].push("../siteImages2/Cow/IMG_1429.JPG")
        this.neutralImages[1].push("../siteImages2/Cow/IMG_1430.JPG")

        this.neutralImages[2].push("../siteImages2/LegoGuy1/IMG_1458.jpeg")
        this.neutralImages[2].push("../siteImages2/LegoGuy1/IMG_1459.jpeg")
        this.neutralImages[2].push("../siteImages2/LegoGuy1/IMG_1460.JPG")
        this.neutralImages[2].push("../siteImages2/LegoGuy1/IMG_1461.JPG")
        this.neutralImages[2].push("../siteImages2/LegoGuy1/IMG_1462.JPG")
        this.neutralImages[2].push("../siteImages2/LegoGuy1/IMG_1463.JPG")
        this.neutralImages[2].push("../siteImages2/LegoGuy1/IMG_1464.JPG")
        this.neutralImages[2].push("../siteImages2/LegoGuy1/IMG_1465.JPG")
        this.neutralImages[2].push("../siteImages2/LegoGuy1/IMG_1466.JPG")

        this.neutralImages[3].push("../siteImages2/LegoGuy2/IMG_1450.JPG")
        this.neutralImages[3].push("../siteImages2/LegoGuy2/IMG_1451.JPG")
        this.neutralImages[3].push("../siteImages2/LegoGuy2/IMG_1452.JPG")
        this.neutralImages[3].push("../siteImages2/LegoGuy2/IMG_1454.JPG")
        this.neutralImages[3].push("../siteImages2/LegoGuy2/IMG_1455.JPG")
        this.neutralImages[3].push("../siteImages2/LegoGuy2/IMG_1456.JPG")
        this.neutralImages[3].push("../siteImages2/LegoGuy2/IMG_1457.JPG")
        this.neutralImages[3].push("../siteImages2/LegoGuy2/IMG_1458.JPG")

        this.neutralImages[4].push("../siteImages2/LegoGuys3/IMG_1441.JPG")
        this.neutralImages[4].push("../siteImages2/LegoGuys3/IMG_1442.JPG")
        this.neutralImages[4].push("../siteImages2/LegoGuys3/IMG_1443.JPG")
        this.neutralImages[4].push("../siteImages2/LegoGuys3/IMG_1445.JPG")
        this.neutralImages[4].push("../siteImages2/LegoGuys3/IMG_1446.JPG")
        this.neutralImages[4].push("../siteImages2/LegoGuys3/IMG_1447.JPG")
        this.neutralImages[4].push("../siteImages2/LegoGuys3/IMG_1448.JPG")
        this.neutralImages[4].push("../siteImages2/LegoGuys3/IMG_1449.JPG")

        this.neutralImages[5].push("../siteImages2/LegoTruck/IMG_1344.JPG")
        this.neutralImages[5].push("../siteImages2/LegoTruck/IMG_1345.JPG")
        this.neutralImages[5].push("../siteImages2/LegoTruck/IMG_1347.JPG")
        this.neutralImages[5].push("../siteImages2/LegoTruck/IMG_1348.JPG")
        this.neutralImages[5].push("../siteImages2/LegoTruck/IMG_1349.JPG")
        this.neutralImages[5].push("../siteImages2/LegoTruck/IMG_1350.JPG")
        this.neutralImages[5].push("../siteImages2/LegoTruck/IMG_1351.JPG")
        this.neutralImages[5].push("../siteImages2/LegoTruck/IMG_1352.JPG")
        this.neutralImages[5].push("../siteImages2/LegoTruck/IMG_1353.JPG")
        this.neutralImages[5].push("../siteImages2/LegoTruck/IMG_1356.JPG")

        this.neutralImages[6].push("../siteImages2/Sheep/IMG_1413.JPG")
        this.neutralImages[6].push("../siteImages2/Sheep/IMG_1414.JPG")
        this.neutralImages[6].push("../siteImages2/Sheep/IMG_1415.JPG")
        this.neutralImages[6].push("../siteImages2/Sheep/IMG_1416.JPG")
        this.neutralImages[6].push("../siteImages2/Sheep/IMG_1417.JPG")
        this.neutralImages[6].push("../siteImages2/Sheep/IMG_1418.JPG")
        this.neutralImages[6].push("../siteImages2/Sheep/IMG_1419.JPG")
        this.neutralImages[6].push("../siteImages2/Sheep/IMG_1420.JPG")
        this.neutralImages[6].push("../siteImages2/Sheep/IMG_1421.JPG")


		// shuffle them
		//		for (let i = 0; i < numOfImages; i++) {
		//			// choose one at random
		//			let rand = Math.floor(Math.random() * numOfImages);
		//			// swap them
		//			let temp = this.siteImages[rand];
		//			this.siteImages[rand] = this.siteImages[i];
		//			this.siteImages[i] = temp;
		//		}
	}
	onMouseWheel(e){
		if(!this.pointHovered){
			this.drawSize-=(e.deltaY/53)*4
			// }else{
			if(this.drawSize<5){
				this.drawSize=5
			}
		}


		for(let point of this.points){
			//Loops through all points and if they are hovered will change the image they are on
			if(point.hovered){
				if(e.deltaY>0){
					point.currentImage--
				}
				else{
					point.currentImage++
				}
				if(point.currentImage <0){
					point.currentImage=point.images.length-1
				}else if(point.currentImage >point.images.length-1){
					point.currentImage=0
				}
			}
		}
	}
	onMouseMove(e) {
		let worldRelative={x: e.offsetX, y:e.offsetY }


		this.mouse.x= worldRelative.x
		this.mouse.y= worldRelative.y
		if(this.canvasClicked && !this.hoveredPoint){
			let pX=this.mouse.x-this.worldWidth/2
			let pY=this.mouse.y-this.worldHeight/2
			// console.log(this.drawSize);
			selectedArea.push(new Select(pX,pY,this.drawSize))
		}

		if(world){
			let worldRelative = world.canvasToWorldCoords(e.offsetX, e.offsetY);
			//let worldRelative = {x:world.x,y:world.y};
		}
		// check every point to see if it is hovered
		for(let point of this.points){
			if(!this.hoveredPoint||point.hovered){
				if(point.isHovered(worldRelative,world) ){

					point.hovered=true;
					this.hoveredPoint=true
					if(point.pictureHovered(worldRelative,world)||point.pictureHover){
						// console.log("HERE"+ worldRelative.x);
						point.pictureHover=true
					}

					if(  worldRelative.x-(world.width/2)> point.left && worldRelative.x-(world.width/2)<point.left+15){
						// console.log("HERE");
						point.leftArrowWidth=2
					}else{
						point.leftArrowWidth=.5

					}
						 //check between point.left and point.left+15
							//check between -point.bottom-point.height*point.arrowHeight and -point.top+point.height*arrowHeight)

				}
				else if(!point.isHovered(worldRelative,world)&&!point.pictureHovered(worldRelative,world)){
					point.hovered=false;
					this.hoveredPoint=false;
					point.bottomHovered=false
					point.pictureHover=false
				}
			}
			if(point.hovered && point.bottom){
				if(point.bottomOfImage(worldRelative,world)){
					point.bottomHovered=true
					document.getElementById("canvas").style.cursor = "pointer";
				}else{
					point.bottomHovered=false
					document.getElementById("canvas").style.cursor = "default";
				}
			}

			if (this.isDown && point.topHovered){
					console.log('HOVERING and DOWN ' + parseInt(worldRelative.x))
					point.pct=Math.max(0,Math.min(1,(worldRelative.x - (world.width/2)-point.range.x)/point.range.width));
					point.range.pct = point.pct
					console.log(point.range.pct)
					//ctx.clearRect(point.range.x-12.5,point.range.y-point.range.height/2-15,point.range.width+25,point.range.height+20);
					point.drawRangeSlider(ctx);
			}
		}


	}
	onMouseDown(e){
		// console.log(e.);
		if(e.button==2 ){
			deletingSelect=true;
			this.canvasClicked=true;
			let pX=this.mouse.x-this.worldWidth/2
			let pY=this.mouse.y-this.worldHeight/2
			// console.log(this.drawSize);
			selectedArea.push(new Select(pX,pY,this.drawSize))
		}
		if(e.button==0 && !this.hoveredPoint){
			this.canvasClicked=true;
			let pX=this.mouse.x-this.worldWidth/2
			let pY=this.mouse.y-this.worldHeight/2
			// console.log(this.drawSize);
			selectedArea.push(new Select(pX,pY,this.drawSize))

		}
		let i=0
		for(let point of this.points){
			if(point.bottomHovered){
				point.buttonShadow=.5;
				socket.emit("input",{type:"denySite",id:point.siteId})
				this.points.splice(i,1)
				this.hoveredPoint=false
				document.getElementById("canvas").style.cursor = "default"
			}


			i+=1
		}

	}
	onMouseUp(e){
		this.canvasClicked=false;
		selectedArea=[]
		deletingSelect=false;
		for(let point of this.points){
			point.buttonShadow=1.5
		}

		this.isDown = false
		// console.log('IS_UP')
	}

}

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

class Handle{
   constructor(angle, hub, {interactive = true, colour = RadialControl.LINE_COLOUR} = {}){
      this.interactive = interactive;
      this.colour = colour;
      this.actual = null;
      this.requested = null;
      this.r = angle * Math.PI/180;
      this.deg = angle;
      this.actualX = null;
      this.actualY = null;
      this.requestedX = null;
      this.requestedY = null;
      this.prev = null;
      this.next = null;
      this.isRequesting = false;
   }

   setPrev(handle){
      this.prev = handle;
   }

   setNext(handle){
      this.next = handle;
   }

   updateRequested(value){
      this.isRequesting = true;
      this.requested = value;
      this.requestedX = Math.cos(this.r) * (RadialControl.RADIUS_SCALE * this.beeNumberToRadiusScale(value))+world.hub.x;
      this.requestedY = Math.sin(this.r) * (RadialControl.RADIUS_SCALE * this.beeNumberToRadiusScale(value))-world.hub.y;
   }

   updateActual(value = 0){
      this.actual = value;

      this.actualX = (Math.cos(this.r) * (RadialControl.RADIUS_SCALE * this.beeNumberToRadiusScale(value)))+world.hub.x;
      this.actualY = (Math.sin(this.r) * (RadialControl.RADIUS_SCALE * this.beeNumberToRadiusScale(value)))-world.hub.y;

      if (this.isRequesting && value == this.requested){
         this.isRequesting = false;
      }

      if (!this.isRequesting){
         this.requested = this.actual;
         this.requestedX = this.actualX;
         this.requestedY = this.actualY;
      }
   }

   draw(ctx, debug = false){
      ctx.save();

      ctx.strokeStyle = this.colour;

      ctx.beginPath();
      ctx.moveTo(this.prev.actualX, -this.prev.actualY);
      ctx.lineTo(this.actualX, -this.actualY);
      ctx.lineTo(this.next.actualX, -this.next.actualY);
      ctx.stroke();

      if (this.actual != this.requested){
         ctx.setLineDash([5, 5]);
         ctx.strokeStyle = "red";
         ctx.beginPath();
         ctx.moveTo(this.prev.requestedX, -this.prev.requestedY);
         ctx.lineTo(this.requestedX, -this.requestedY);
         ctx.lineTo(this.next.requestedX, -this.next.requestedY);
         ctx.stroke();

         ctx.fillStyle = "red";

         ctx.beginPath();
         ctx.arc(this.requestedX, -this.requestedY, 3, 0, 2 * Math.PI, false);
         ctx.fill();
      }
      else if (this.interactive){
         ctx.fillStyle = this.colour;

         ctx.beginPath();
         ctx.arc(this.requestedX, -this.requestedY, 2, 0, 2 * Math.PI, false);
         ctx.fill();
      }

      ctx.restore();
   }

   beeNumberToRadiusScale(number){
      // KLUDGE FOR WHEN WORLD HASN'T BEE LOADED
      // TODO: handle this properly
      try
      {
         let ratio = Math.min(number / world.agents.length, 1);
         return (ratio * (RadialControl.MAX_AGENT_SCALE - 1)) + 1;
      }
      catch (e)
      {
         console.log(e.message);
      }
   }

   isHovered(x, y){
      // use distance formula sqrt(x^2+y^2) to hover within radius
      let dist = Math.sqrt(Math.pow(x - this.requestedX, 2) + Math.pow(y - this.requestedY, 2));
      return dist <= 8;

      // this uses a rectangle, so it's dumb
      // var box = {left: this.requestedX - 5, top: this.requestedY - 5, right: this.requestedX + 5, bottom: this.requestedY + 5};
      // return (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom);
   }
}

class RadialControl{
  constructor(ui, {interactive = true, colour = RadialControl.LINE_COLOUR, dataset = "agentDirections"} = {}){
    this.interactive  = interactive;
    this.colour       = colour;
    this.dataset      = dataset;

    this.handles = [];
    this.drag = {active: false, handle: null};
    this.hover = {active: true, handle: null};
    //this.hub = {x: world.hub.x, y: world.hub.y}

     // create a handle for every 5th degree
    for (let i = 0; i < (360 / 5); i++)
    {
       // we're doing it this way so eventually we can paramaterise the 5
       this.handles.push(new Handle(i * 5, this.hub, {interactive: this.interactive, colour: this.colour}) );
    }

    this.handles[0].setPrev(this.handles[this.handles.length - 1]);
    this.handles[0].setNext(this.handles[1]);
    let handlesLength=this.handles.length
    for (let i = 1; i < handlesLength; i++)
    {
       // this only works because js lets you do negative array indices
       this.handles[i].setPrev(this.handles[(i - 1) % handlesLength]);
       this.handles[i].setNext(this.handles[(i + 1) % handlesLength]);
    }

    /*if (this.interactive)
    {

    }*/

    ui.register("updateRadial", this.update.bind(this));
    ui.register("restart", this.reset.bind(this));
    ui.register("hubControllerToggle", this.toggle.bind(this));
  }
  toggle(data){
   if (data && this.interactive){
     cursors.default.addEventListener('mousemove', this.startHandleHover.bind(this));
     cursors.radialDrag.addEventListener('mousemove', this.onMouseMove.bind(this));
     cursors.radialDrag.addEventListener('mousedown', this.onMouseDown.bind(this));
     cursors.radialDrag.addEventListener('mouseup', this.onMouseUp.bind(this));
   }
  }
  update(data){
    // data is an array[72] of direction information for every five degrees

    for (let i = 0; i < (360 / 5); i++)
       this.handles[i].updateActual(data.controller[this.dataset][i]);
  }

  draw(ctx, debug = false){
    for (let h of this.handles){
       h.draw(ctx, debug);
    }
  }

	startHandleHover(e){
    let worldRelative={x: e.offsetX, y:e.offsetY }
    if(world){
      let worldRelative = world.canvasToWorldCoords(e.offsetX, e.offsetY);
    }


		/* TODO remove these two lines.
		 * I don't know why they are here. If they are uncommented, then the hover of
		 * the mouse is based on the center of the radial control, not the center of
		 * the canvas (the origin). So the hover doesn't actually work with these lines.
		 * I have left these here in case something else breaks. But as far as I can
		 * tell, we should just remove these all together.
		 */
		// worldRelative.x -= world.hub.x;
		// worldRelative.y += world.hub.y;

		// let worldRelative = world.canvasToWorldCoords(e.offsetX, e.offsetY);
		for (let h of this.handles)
			if (h.isHovered(worldRelative.x, worldRelative.y)) {
				this.hover = {active: true, handle: h};
				ui.requestActiveCursor(cursors.radialDrag);
				break;
			}
	}

  onMouseDown(e){
    this.drag.active = true;
    this.drag.handle = this.hover.handle;
    this.hover.active = false;
    this.hover.handle = null;
  }

  onMouseUp(e) {
    if (this.drag.active){
      this.drag.active = false;
      this.drag.handle = null;
      ui.setActiveCursor(cursors.default);
    }
  }

  onMouseMove(e){
    let worldRelative = world.canvasToWorldCoords(e.offsetX, e.offsetY);
    worldRelative.x -= world.hub.x;
    worldRelative.y += world.hub.y;

    if (!this.drag.active)
    {
       if (this.hover.active && !this.hover.handle.isHovered(worldRelative.x, worldRelative.y))
       {
          ui.setActiveCursor(cursors.default);
          this.hover.active = false;
          this.hover.handle = null;
       }
    }
    else
    {
       let angle = Math.atan2(worldRelative.y, worldRelative.x);
       let magnitude = Math.sqrt(Math.pow(worldRelative.x, 2) + Math.pow(worldRelative.y, 2));

       if (angle < 0)
       {
          angle += Math.PI*2;
       }

       let component = this.computeMouseComponent(worldRelative, this.drag.handle);

       if (component < 1 * RadialControl.RADIUS_SCALE)
       {
          component = 1 * RadialControl.RADIUS_SCALE
       } //else if(component <)
       else if (component > RadialControl.MAX_AGENT_SCALE * RadialControl.RADIUS_SCALE)
       {
          component = RadialControl.MAX_AGENT_SCALE * RadialControl.RADIUS_SCALE;
       }

       let adjustedComponent = (RadialControl.MAX_AGENT_SCALE / (RadialControl.MAX_AGENT_SCALE - 1)) * (component - 50);
       this.drag.handle.updateRequested( Math.round( adjustedComponent / (RadialControl.RADIUS_SCALE * RadialControl.MAX_AGENT_SCALE) * world.agents.length ))

       //this.drag.handle.val = (component / RadialControl.RADIUS_SCALE) * 10;
       //this.drag.handle.x = component * Math.cos(this.drag.handle.r);
       //this.drag.handle.y = component * Math.sin(this.drag.handle.r);

       socket.emit('input',
       {
          type: 'radialControl',
          state:
          {
             r: this.drag.handle.r,
             deg: this.drag.handle.deg,
             val: this.drag.handle.requested
          },
          id: clientId});
    }
  }

	computeMouseComponent(mouseCoords, handle){
		// let handleVector = {x: Math.cos(handle.r), y: -Math.sin(handle.r)};
		let mouseMagnitude = Math.sqrt(Math.pow(mouseCoords.x, 2) + Math.pow(mouseCoords.y, 2));
		let mouseAngle = Math.atan2(mouseCoords.y, mouseCoords.x);

		let component = mouseMagnitude * Math.cos(mouseAngle - handle.r);

		return component;
	}

	reset(){
		this.handles = [];
		this.drag = {active: false, handle: null};
		this.hover = {active: true, handle: null};

		for (let i = 0; i < (360 / 5); i++) {
			// we're doing it this way so eventually we can paramaterise the 5
			this.handles.push(new Handle(i * 5, {interactive: this.interactive, colour: this.colour}));
		}

		this.handles[0].setPrev(this.handles[this.handles.length - 1])
		this.handles[0].setNext(this.handles[1]);
    let handlesLength=this.handles.length
		for (let i = 1; i < handlesLength; i++) {
			// this only works because js lets you do negative array indices
			this.handles[i].setPrev(this.handles[(i - 1) % handlesLength]);
			this.handles[i].setNext(this.handles[(i + 1) % handlesLength]);
		}
	}
}

// If 100% of the agents are going in a direction, that point will have distance of MAX_AGENT_SCALE * RADIUS_SCALE
RadialControl.MAX_AGENT_SCALE = 10.0;
RadialControl.RADIUS_SCALE = 50;
RadialControl.LINE_COLOUR = 'blue';
RadialControl.HANDLE_COLOUR = 'blue';

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

class SelectionBoxes
{
   constructor(){
      cursors.default.addEventListener('mousedown', function(e) { ui.clearSelectedAgents(); });
   }

   update(){
      // no-op
   }

   draw(ctx, debug = false){
      if (ui.agentsSelected() == 0)
         return;

      ctx.save();

      for (let agent of world.agents)
      {
         if (ui.isAgentSelected(agent.id))
         {
            ctx.save();
            ctx.translate(agent.x, agent.y);

           // also draw a neat little selection box around the agent if it's selected

           var outlineXy = (bee.width > bee.height) ? bee.width : bee.height;
           // move 7px up and left from agent's centre
           ctx.translate(-outlineXy/2 - 3, -outlineXy/2 - 3);
           ctx.strokeStyle = "rgb(24, 215, 255)";

           // draw a rectangle from origin (agent centre - (7px, 7px), to agent
           // centre + (7px, 7px) )
           ctx.strokeRect(0, 0, outlineXy + 3, outlineXy + 3);
           ctx.restore();
         }
      }

      ctx.restore();
   }
}

class SelectionRect
{
   constructor(ui)
   {
      this.active = false;
      this.x = 0;
      this.y = 0;
      this.width = 0;
      this.height = 0;

      // cursors.default  .addEventListener('mousedown', this.onMouseDown.bind(this));
      cursors.selecting.addEventListener('mousemove', this.onMouseMove.bind(this));
      cursors.selecting.addEventListener('mouseup'  , this.onMouseUp  .bind(this));

      ui.register('restart', this.reset.bind(this));
   }

   update()
   {
      // no-op
   }

   draw(ctx, debug = false)
   {
      if (!this.active)
         return;

      ctx.save();

      ctx.fillStyle = "rgba(0,150,0,.3)";
      ctx.strokeStyle = "rgba(0, 0, 0,.5)";
      ctx.lineWidth = 1;

      // Reset the context to canvas top-left because we have canvas-relative
      // coordinates already
      ctx.translate(-world.x_limit, -world.y_limit);
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.strokeRect(this.x, this.y, this.width, this.height);

      ctx.restore();
   }

   onMouseDown(e)
   {
      // initialise the selection rectangle
      this.active = true;
      this.x = e.offsetX; // these coords are relative to the canvas
      this.y = e.offsetY;

      // default height and width
      this.width = 1;
      this.height = 1;

      ui.setActiveCursor(cursors.selecting);
   }

   onMouseMove(e)
   {
      this.width  = e.offsetX - this.x;
      this.height = e.offsetY - this.y;
   }

   onMouseUp(e)
   {
      ui.setActiveCursor(cursors.default);

      this.active = false
      this.computeSelectedAgents();

      this.x = this.y = this.width = this.height = 0;
   }

   computeSelectedAgents()
   {
      var selectBounds = {};
      var selectedAgentIDs = [];

      selectBounds.left   = (this.width  > 0) ? this.x               : this.x + this.width;
      selectBounds.right  = (this.width  > 0) ? this.x + this.width  : this.x;
      selectBounds.top    = (this.height > 0) ? this.y               : this.y + this.height;
      selectBounds.bottom = (this.height > 0) ? this.y + this.height : this.y;

      selectBounds.left   -= world.x_limit;
      selectBounds.right  -= world.x_limit;
      selectBounds.top    -= world.y_limit;
      selectBounds.bottom -= world.y_limit;

      for (var agent of world.agents)
      {
         var agentBounds =
         {
            left: agent.x - 5,
            right: agent.x + 5,
            top: agent.y - 5,
            bottom: agent.y + 5
         };

         if (this.rectIntersect(agentBounds, selectBounds))
         {
            selectedAgentIDs.push(agent.id);
         }
      }

      ui.addSelectedAgents(selectedAgentIDs);
   }

   rectIntersect(a, b)
   {
      return !(b.left > a.right || b.right < a.left || b.top > a.bottom || b.bottom < a.top);
   }

   reset()
   {
      this.active = false;
      this.x = 0;
      this.y = 0;
      this.width = 0;
      this.height = 0;
   }
}


class StateBubbles
{
  constructor(ui)
  {
    this.states = {};
    this.totalAgentsInStates = 0;
    this.initialised = false;

    ui.register("setStates", this.init.bind(this));
    ui.register("stateCounts", this.update.bind(this));
    ui.register("restart", this.restart.bind(this));

    socket.emit("input", {"type": "requestStates"});
  }

  init(json){
    for (let name of json.states){
      this.states[name] = {count: 0, radius: 0};
    }
    this.initialised = true;
  }

  update(json){
    this.totalAgentsInStates = 0;
    //console.log(json);

    for (let [state, count] of Object.entries(json))
    {
      //console.log(json.states);
      console.log(count);
      if (this.states[state])
      {
        this.states[state].count = count;
        this.totalAgentsInStates += count;

      }
    }

    for (let [name, state] of Object.entries(this.states))
    {
      //console.log(count);
      state.radius = state.count / this.totalAgentsInStates * StateBubbles.MAX_RADIUS;
      //console.log(state.radius);
      if (state.radius < StateBubbles.MIN_RADIUS)
        state.radius = StateBubbles.MIN_RADIUS;
    }
  }

  restart(){
    this.states = {};
    this.totalAgentsInStates = 0;
    this.initialised = false;

    socket.emit("input", {"type": "requestStates"});
  }

  draw(ctx, debug = false){
    return
    if (!this.initialised)
      return;

    //let bubblesWidth = Object.values(this.states).reduce((sum, state) => {return sum + state.radius + StateBubbles.BUBBLE_SPACING}, 0);
    //console.log(bubblesWidth);
    let x = -world.x_limit + StateBubbles.BUBBLE_SPACING;
    let y = world.y_limit - StateBubbles.MAX_RADIUS - StateBubbles.LABEL_SPACING;

    //let x, y = [0, 0];
    //let x = 0;

    ctx.save();
    ctx.translate(x, y);

    x = 0;

    for (let [name, state] of Object.entries(this.states))
    {
      //console.log(state.radius);
      x += state.radius;

      ctx.fillStyle = "rgb(108, 163, 252)";
      ctx.beginPath();
      ctx.arc(x, 0, state.radius, 0, Math.PI * 2, false);
      //ctx.arc(100, 0, 50, 0, 2 * Math.PI);
      ctx.fill();

      ctx.font = "8pt sans-serif";
      ctx.fillStyle = "rgb(0, 0, 0)";
      let width = ctx.measureText(`${name}/${state.count}`).width;
      //let name1 = name[0].toUpperCase();
      ctx.fillText(`${name}/${state.count}`, x-width/2, StateBubbles.LABEL_SPACING);

      x += state.radius + StateBubbles.BUBBLE_SPACING;
    }

    ctx.restore();
  }
}

StateBubbles.MAX_RADIUS = 20;
StateBubbles.MIN_RADIUS = 2;
StateBubbles.BUBBLE_SPACING = 60; // in px
StateBubbles.LABEL_SPACING = 30;

class Cursor
{
   constructor()
   {
      this.active = false;
      this.events = {};
      this.display = null;
      this.type = null;
   }

   addEventListener(event, listener)
   {
      if (this.events[event] == undefined)
         this.events[event] = [];
      // console.log(event);
      this.events[event].push(listener);

      if (this.active)
         canvas.addEventListener(event, listener);

      return this;
   }

   // TODO: need a nice, fast way to remove a specific listener
   /*removeEventListener(event, listener)
   {
      listenerArray = this.events[event];

      if (listenerArray !== undefined)
      {
         var index = listenerArray.indexOf(listener);

      }
   }*/

   activate()
   {
      this.active = true;

      for (let [event, listeners] of Object.entries(this.events))
         for (let listener of listeners)
            canvas.addEventListener(event, listener);

      canvas.style.cursor = this.display;

      return this;
   }

   deactivate()
   {
      this.active = false;

      for (let [event, listeners] of Object.entries(this.events))
         for (var listener of listeners)
            canvas.removeEventListener(event, listener);

      canvas.style.cursor = "auto";

      return this;
   }
}

class CursorDefault extends Cursor
{
   constructor()
   {
      super();
      this.type = "default";
      this.display = 'default';
   }
}

class CursorPlaceBaitBomb extends Cursor
{
  constructor()
  {
    super();
    this.type = "placeBaitBomb";
    this.display = "crosshair";
    this.mode = null;
  }

  // takes one of the MODE constants below, don't break please!
  // weakly typed languages smh
  setMode(mode)
  {
    this.mode = mode;
  }
}

CursorPlaceBaitBomb.MODE_BAIT = 0
CursorPlaceBaitBomb.MODE_BOMB = 1

class CursorRadialDrag extends Cursor
{
   constructor()
   {
      super();
      this.type = "radialDrag";
      this.display = 'move';
   }
}

class CursorSelecting extends Cursor
{
   constructor()
   {
      super();
      this.type = "selecting";
      this.display = "default";
   }
}

class Mouse{
  constructor(x,y){
    this.x=x;
    this.y=y;
    this.clicked=false;
    this.deltaX=null;
    this.deltaY=null;
    // cursors.default.addEventListener('mousemove', this.onMouseMove.bind(this));
		// cursors.default.addEventListener('wheel', this.onMouseWheel.bind(this));
		// cursors.default.addEventListener('mousedown', this.onMouseDown.bind(this));
		// cursors.default.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  onMouseMove(e){
    this.x=world.canvasToWorldCoords(e.offsetX,e.offsetY).x;
    this.y=world.canvasToWorldCoords(e.offsetX,e.offsetY).y;
  }
  onMouseWheel(e){
    this.deltaX=e.deltaX;
    this.deltaY=e.deltaY;
    console.log(this);

  }
  onMouseDown(e){
    this.clicked=true;
  }
  onMouseUp(e){
    this.clicked=false;

  }
}

var baitButton = document.getElementById('buttonBugBait');
var bombButton = document.getElementById('buttonBugBomb');

baitButton.addEventListener('click', function()
{

  cursors.placeBaitBomb.setMode(CursorPlaceBaitBomb.MODE_BAIT);
  ui.setActiveCursor(cursors.placeBaitBomb);
});

bombButton.addEventListener('click', function()
{
  cursors.placeBaitBomb.setMode(CursorPlaceBaitBomb.MODE_BOMB);
  ui.setActiveCursor(cursors.placeBaitBomb);
});

class BeeCounter {
	constructor(ui) {
		ui.register('updateRadial', this.update.bind(this));
		this.dead = 0;
		//this.deadBee = document.getElementById("deadBeeProgress");
		//this.deadBee.value = 0;
	}

	update(data) {
		// var deadBee = document.getElementById("deadBeeProgress");
		//deadBee.value=0;
		//console.log(data)
		if (data.controller['dead'] != this.dead) {
			//let deadBee = document.getElementById("deadBeeProgress");
			this.dead = data.controller['dead'];
			//console.log(this.deadBee)
			//this.deadBee.value = this.dead
			//console.log(this.dead)
			//deadBee.value=this.dead;
			//document.getElementById("deadBees").innerHTML = "Estimated Dead: " + this.dead.toString();
		}

		// document.getElementById("turns").innerHTML = "total turns: " + data.controller['actions']["turns"].toString();
		//document.getElementById("stateChanges").innerHTML = "Total state changes: " + data.controller['actions']["stateChanges"].toString();

		//document.getElementById("influenceTurns").innerHTML = "Influenced turns: " + data.controller['influenceActions']["turns"].toString();
		//document.getElementById("influenceChanges").innerHTML = "Influenced changes: " + data.controller['influenceActions']["stateChanges"].toString();
		/*
		 self.actions = {"turns": 0, "stateChanges": 0, "parameterChange": 0}
		 self.influenceActions = {"turns": 0, "stateChanges": 0, "parameterChange": 0}
		 */
	}
}

let buttonSend = document.getElementById('buttonSend');
let chatmsg = document.getElementById('chatmsg');
let userName = document.getElementById('userName');
//var chat = "<strong>" + userName.value + ": </strong>" + chatmsg.value;
$("#buttonSend").click(function (e) {
	let chat = "<strong>" + userName.value + ": </strong>" + chatmsg.value + "<br>";
	e.preventDefault();
	console.log(chatmsg.value);
	socket.emit('input', {'type': 'message', message: chat});
	chatmsg.value = '';
	userName.readOnly = true;
});

/*buttonSend.addEventListener('click', function()
{
  console.log(chatmsg.value);
  socket.emit('input', {'type': 'message', message: chatmsg.value});
  chatmsg.value = '';
});

function pressEnter()
{
  console.log(chatmsg.value);
  socket.emit('input', {'type': 'message', message: chatmsg.value});
  chatmsg.value = '';

});
*/

class ChatRoom {
	constructor(ui) {
		ui.register('updateChat', this.update.bind(this));
		this.chatHistory = '';
	}

	update(data) {
		if (data !== this.chatHistory) {
			this.chatHistory = data;
			document.getElementById("chatwindow").innerHTML = this.chatHistory;
		}
	}
}

class DebugParams
{
   constructor(ui)
   {
      this.buttonDebugParams = document.getElementById("buttonUpdateDebugParams");
      ui.register('updateDebugParams', this.update.bind(this));
      this.firstTime = true;

      this.buttonDebugParams.addEventListener("click", function(e)
      {
         var paramObj = {};

         var paramArray = $("#debugParams input").serializeArray();

         for (let param of paramArray)
         {
            paramObj[param.name] = param.value;
         }

         socket.emit('input', {'type': 'parameterUpdate', params: paramObj});
      });

      //socket.emit('input', {'type': 'requestParams'});
   }

   setup(data)
   {
      //$('#buttonUpdateDebugParams').after("<br>");
      for (let [param, val] of Object.entries(data.parameters))
      {
         param = param.split(/(?=[A-Z])/).join(' ')
         var label = $("<label></label>").text(`${param}`);
         label.append($('<input style="width:40%;">').val(val).attr('type','number').attr('name',`${param}`));
         label.append("<br>");
        //  console.log(label);
         $('#parameters').after(label);
         //$(`#debugParams input[name=${param}]`).val(val);
      }
   }
   update(data){
      if(this.firstTime == true){
         this.setup(data);
         this.firstTime = false;
         return
      }
      for (let [param, val] of Object.entries(data.parameters))
      {
         $(`#debugParams input[name=${param}]`).val(val);
      }
   }
}

class DebugTable
{
   constructor(ui)
   {
      ui.register('update', this.update.bind(this));

      // Hard code to make sure id, x, and y always appear first in the headers
      var infoTableHeaders = $('#infoTableHeaders')
      infoTableHeaders.append(`<th id='id'>ID</th>`);
      infoTableHeaders.append(`<th id='x'>X</th>`);
      infoTableHeaders.append(`<th id='y'>Y</th>`);
   }

   update(data)
   {
      if (ui.agentsSelected() === 0)
      {
         $('#infoTable').hide();
      }
      else {
         $('#infoTable').show();

         // If there are more rows than selected agents, an agent must have died
         // It won't appear in the data, so we have to clean up manually
         if ($('#infoTable .agentInfo').length > ui.agentsSelected())
         {
            // Throw out the whole thing--probably cheaper than checking each row against each agent
            $('#infoTable .agentInfo').remove();
         }

         for (var agent of data.agents)
         {
            if (ui.isAgentSelected(agent.id))
            {
               for (var [prop, val] of Object.entries(agent))
               {
                  // We don't have a header for this property, so create it
                  if (!$(`#infoTableHeaders #${prop}`).length)
                  {
                     let prettyProp = this.beautifyProp(prop);
                     $(`#infoTableHeaders`).append(`<th id='${prop}'>${prettyProp}</th>`);
                  }

                  // This agent doesn't have a row in our debug table, so create one
                  if (!$(`#agentInfo${agent.id}`).length)
                  {

                     let row = $(document.createElement('tr'));
                     row.attr('id', `agentInfo${agent.id}`);
                     row.attr('class', 'agentInfo');

                     // Again, hardcode id, x, and y props--ugly, but since the data
                     // is just an unorganized blob of JSON, there is no other way
                     // to guarantee a particular order
                     row.append(`<td id='id${agent.id}'></td>`);
                     row.append(`<td id='x${agent.id}' class='agentCoord'></td>`);
                     row.append(`<td id='y${agent.id}' class='agentCoord'></td>`);
                     $('#infoTable').append(row);
                  }

                  // A place for this specific property for this specific agent doesn't exist, create one
                  if (!$(`#${prop}${agent.id}`).length)
                  {
                     $(`#agentInfo${agent.id}`).append(`<td id='${prop}${agent.id}'></td>`);
                  }

                  // Potential site is treated specially, since it's an array
                  if (prop === 'potential_site' && val != null)
                  {
                     val = val[0].toFixed(2) + ", " + val[1].toFixed(2);
                  }
                  if (typeof val === 'number')
                  {
                     val = val.toFixed(2);
                  }

                 $(`#${prop}${agent.id}`).html(val);
               }

            }
            else
            {
               // Agent isn't selected, remove its entry
               if ($(`#agentInfo${agent.id}`))
               {
                  $(`#agentInfo${agent.id}`).remove()
               }
            }
         }
      }
   }

   // This function takes in the ugly property name (which comes from python)
   // and turns it into something resembling words
   beautifyProp(prop)
   {
      // Split into words based on underscores and capitalize each word
      var tokens = prop.split("_");
      tokens.forEach(function(element, index, array)
      {
         array[index] = element.charAt(0).toUpperCase() + element.slice(1);
      });

      return tokens.join(" ");
   }

}

var buttonPausePlay = document.getElementById('buttonPausePlay');
var isPaused = false;

buttonPausePlay.addEventListener('click', function(e)
{
   if (isPaused)
   {
      socket.emit('input', {type: 'play'});
      buttonPausePlay.innerHTML = "Pause";
      isPaused = false;
   }
   else
   {
      socket.emit('input', {type: 'pause'});
      buttonPausePlay.innerHTML = "Play";
      isPaused = true;
   }
});

var buttonRestart = document.getElementById('buttonRestart');

buttonRestart.addEventListener('click', function()
{
  socket.emit('input', {type: 'restart'});
});

class SitePriorityMeters
{
   constructor(ui)
   {
      this.priorityMeters = $('#sitePriorityControls input');

      this.priorityMeters.on('change', function(e)
      {
         var priorityObj = {};

         var prioritiesSerialised = this.priorityMeters.serializeArray();

         for (let entry of prioritiesSerialised)
         {
            priorityObj[entry.name] = entry.value;
         }

         socket.emit('input', {type: 'priorityUpdate', sitePriorities: priorityObj});
      }.bind(this));

      ui.register('updateSitePriorities', this.update.bind(this));
   }

   update(data)
   {
      for (let [key, val] of Object.entries(data.controller.sitePriorities))
      {
         $(`#sitePriorityControls input[name=${key}]`).val(val);
      }
   }
}

const statesCheckbox = document.getElementById('dontShowAgentState');
var showState=false;
statesCheckbox.addEventListener('click', function(e)
{
	if(!showState){
      showAgentStates = true;
      showState= true;
      //$('#showAgents').css('background-image', 'url("dontShowDrones.png")')
      $('#dontShowAgentState').attr('id',"showAgentState")
    }
    else{
      showAgentStates = false;
      showState=false;
      $('#showAgentState').attr('id',"dontShowAgentState")
    }

});

const rebugCheckbox = document.getElementById('dontShowAgents');
const agentHide =document.getElementById('agentInfoIcon');
const showChat =document.getElementById('messengerIcon');
const debugButton =document.getElementById('debugIcon');
const fogButton =document.getElementById('showFogIcon');
var showAgent = false;
var showPheromone = true;
var showFog=true;
var showDebug = false;
var showSlider = false;
var showAgentInfo = false;
var showChatWindow = false;


$("#showPheromoneIcon").click(function(){
  if(showPheromone){
      //console.log($('#showFogIcon').attr('id'));
    $('#showPheromoneIcon').attr('id',"dontShowPheromoneIcon")
    showPheromone = false;
  }
  else{
    //console.log($('#dontShowFogIcon').attr('id'));
    $('#dontShowPheromoneIcon').attr('id',"showPheromoneIcon")
    showPheromone=true;
  }
})

$("#debugIcon").click(function(){
  $('#debugArea').fadeToggle();
  if(showDebug){
    showDebug = false;
  }
  else{
    showDebug=true;
  }
})
$("#showFogIcon").click(function(){
  //console.log(showFog);
  if(showFog){
      //console.log($('#showFogIcon').attr('id'));
    $('#showFogIcon').attr('id',"dontShowFogIcon")
    showFog = false;
  }
  else{
    //console.log($('#dontShowFogIcon').attr('id'));
    $('#dontShowFogIcon').attr('id',"showFogIcon")
    showFog=true;
  }
})

$("#backgroundTransparency").click(function(){
  $('#myRange').fadeToggle();
  if(showSlider){
    showSlider=false;
  }
  else{
    showSlider=true;
  }
})

agentHide.addEventListener('click', function(e){
     $('#agentLoc').fadeToggle();
     if(showAgentInfo){
       showAgentInfo=false;
     }
     else{
       showAgentInfo=true;
     }

});

showChat.addEventListener('click', function(e){
     $('#chatArea').fadeToggle();
     if(showChatWindow){
       showChatWindow=false;
     }
     else{
       showChatWindow=true;
     }
});


rebugCheckbox.addEventListener('click', function(e)
{
  if(!showAgent){

      debug = true;
      showAgent= true;
      //$('#showAgents').css('background-image', 'url("dontShowDrones.png")')
      $('#dontShowAgents').attr('id',"showAgents")
    }
    else{
      // console.log("Agent Off")
      debug = false;
      showAgent=false;
      $('#showAgents').attr('id',"dontShowAgents")
    }

});

var showMenus1 = false;
var showOptions1 = false;
var openSound = document.getElementById("audio0")
var showAgentStateDescription=false;
var closeSound = document.getElementById("audio1");
var menuArray=['messengerIcon','menu','agentInfoIcon']
var optionsArray=['options',"showPheromoneIcon","dontShowPheromoneIcon",'showAgentState','dontShowAgentState','backgroundTransparency','showFogIcon','dontShowFogIcon','showAgents','dontShowAgents','debugIcon']
//var optionsArray.push('')

$("#agentStateDescriptionButton").click(function(){
  if(!showAgentStateDescription){
    stateInfoOn.set("Exploring", false)
    stateInfoOn.set("Observing", false)
    stateInfoOn.set("Following Site", false)
    $("#statesInfoText").empty()
    $("#defaultStateDescript").html(defaultStateDescript)
  }
  $("#agentStateDescriptionDiv").fadeToggle();
  showAgentStateDescription=!showAgentStateDescription

})

$("#agentStateDescriptionDiv").on('click',function(e){
  name=e.target.innerHTML;
  if(name=="Exploring" ||name=="Observing" ||name=="Following Site" ){
    switch(name){
      case 'Exploring':
        stateInfoOn.set("Exploring", true)
        stateInfoOn.set("Observing", false)
        stateInfoOn.set("Following Site", false)
        $("#statesInfoText").empty()
        $("#defaultStateDescript").empty()
        $("#statesInfoText").html(`<h3>Exploring</h3>There are currently <span id='numberInState'></span> agent(s) Exploring
        <br>The Exploring state is when an agent moves in a random-walk around the map to attempt to locate sites. If they spot a site within their
        field of view, they will start following it`)
        break;
      case 'Observing':
        stateInfoOn.set("Exploring", false)
        stateInfoOn.set("Observing", true)
        stateInfoOn.set("Following Site", false)
        $("#statesInfoText").empty()
        $("#defaultStateDescript").empty()
        $("#statesInfoText").html(`<h3>Observing</h3>There are currently <span id='numberInState'></span> agent(s) Observing
        <br>The Observing state is when an agent is at the hub, observing agents that are returning from a site. They will then
        follow an agent back to a site. Only a small portion of the agents will be in this state at a time`)
        break;
      case 'Following Site':
        stateInfoOn.set("Exploring", false)
        stateInfoOn.set("Observing", false)
        stateInfoOn.set("Following Site", true)
        $("#statesInfoText").empty()
        $("#defaultStateDescript").empty()
        $("#statesInfoText").html(`<h3>Following Site</h3>There are currently <span id='numberInState'></span> agent(s) Following Site
        <br>The Following Site state is comprised of 3 sub-states. Follow Site, Report to Hub, and Return to Site.
        <br>These states allow the agent to follow a site (once it has found one), report the info about the site back to the hub,
         and then return to the site by following a trail of pheromones.
        `)
        break;
  }
  }
})

$("body").click(function(e){

  let inMenu =false;
  let inOptions=false;
  for(let menus of menuArray){
    if(menus == e.target.id || menus==$(e.target).attr('class')){
      inMenu=true;
    }
  }
  for(let options of optionsArray){
    if(options == e.target.id || options==$(e.target).attr('class')){
      inOptions=true;
    }
  }
  if(!inMenu){
    $(".menuContent").fadeOut();
    $("#chatArea").fadeOut();
    // $("#agentLoc").fadeOut();
  }
  if(!inOptions){
    $(".optionsContent").fadeOut();
    $('#myRange').fadeOut()
    $('#debugArea').fadeOut();
  }

  // console.log(e.target.id);
  // console.log($(e.target).attr('class'));
})

$(".menu").click(function(){
$(".menuContent").fadeToggle();
  if(showMenus1){
    showMenus1 =false;

  }
  else{
    openSound.cloneNode(true).play()
    showMenus1=true;
  }
  if(!showMenus1){
         $('#chatArea').fadeOut();
         $('#agentLoc').fadeOut();
         closeSound.cloneNode(true).play()


  }

})
$("#options").click(function(){
  $(".optionsContent").fadeToggle();
  if(showOptions1){
    showOptions1 =false;
  }
  else{
    showOptions1=true;
    openSound.cloneNode(true).play()
  }
  if(!showOptions1){
     $('#myRange').fadeOut()
     $('#debugArea').fadeOut();
     closeSound.cloneNode(true).play()
  }
})

class UIParams
{
   constructor(ui)
   {
		var paramArray = $("#UIParams input");
		ui.register('updateUIParams', this.update.bind(this));

		paramArray.on("input", function(e)
		{
			var paramObj = {};

			var updatedParam = e.target;

			paramObj[updatedParam.name] = updatedParam.value || UIParams.defaults[updatedParam.name];

			socket.emit('input', {'type': 'UIParameterUpdate', params: paramObj});
		});

   }

   update(data)
   {
      for (let [param, val] of Object.entries(data.parameters))
      {
         $(`#UIParams input[name=${param}]`).val(val);
      }
   }
}

// have sane behaviour if the user clears the fps box
UIParams.defaults =
{
  "uiFps" : 1
}

class UI {
	constructor() {
		this.selectedAgents = {};
		this.selectedNumber = 0;
		this.canvasElems = [];
		this.documentElems = [];
		this.eventCallbacks = {};

		this.canvasElems.push(new SelectionBoxes(this));
		this.canvasElems.push(new SelectionRect(this));
		this.canvasElems.push(new RadialControl(this));
		//this.canvasElems.push(new RadialControl(this, {interactive: false, colour: "green", dataset: "agentsIn"}));
		this.canvasElems.push(new BaitBombGhost(this));
		this.canvasElems.push(new MissionLayer(this));
		this.canvasElems.push(new StateBubbles(this));

		this.documentElems.push(new DebugParams(this));
		this.documentElems.push(new UIParams(this));
		this.documentElems.push(new SitePriorityMeters(this));
		this.documentElems.push(new DebugTable(this));
		this.documentElems.push(new BeeCounter(this));
		this.documentElems.push(new ChatRoom(this));

		this.activeCursor = cursors.default.activate();

		this.register('restart', this.reset.bind(this));
	}

	register(event, callback) {

		if (!this.eventCallbacks[event]) {
			this.eventCallbacks[event] = [];
		}
		this.eventCallbacks[event].push(callback);
		//console.log(this.eventCallbacks.length);
	}


	//The msg variable contains a callback name, and the data to be passed into the callback
	//The update data is passed through here
	on(msg) {
		for (let cb of this.eventCallbacks[msg.type]) {
				cb(msg.data);
		}
	}

	// indiviual components now must register for any updates they want
	/*update(data)
	{
	   for (let element of this.canvasElems)
		  element.update(data);

	   for (let element of this.documentElems)
		  element.update(data);
	}*/

	draw(ctx, debug = false) {
		for (let element of this.canvasElems){
			element.draw(ctx, debug);
		}
	}

	setActiveCursor(cursor) {
		if (!(cursor instanceof Cursor))
			throw new Error('Active cursor can only be set to a Cursor object');

		this.activeCursor.deactivate();
		this.activeCursor = cursor;
		this.activeCursor.activate();
	}

	requestActiveCursor(cursor) {
		if (this.activeCursor.type == "default") {
			this.setActiveCursor(cursor);
		}
	}

	agentsSelected() {
		return this.selectedNumber;
	}

	addSelectedAgents(ids) {
		this.selectedNumber += ids.length;

		for (let id of ids) {
			this.selectedAgents[id] = true;
		}

	}

	clearSelectedAgents() {
		this.selectedAgents = {};
		this.selectedNumber = 0;
	}

	isAgentSelected(id) {
		if (this.selectedAgents[id])
			return true;
	}

	reset() {
		this.clearSelectedAgents();
	}

}

class Agent
{
  constructor(agentJson)
  {
    this.id            =  agentJson.id;
    this.x             =  Math.round(agentJson.x);
    this.y             = Math.round(-agentJson.y);
    this.rotation      =  Math.PI/2 - agentJson.direction;
    this.state         =  agentJson.state;
    this.isAlive       =  agentJson.live;
    this.qVal          =  agentJson.qVal;
    Agent.stateColors  = {};
    this.lastLocations = [];
  }

  draw(ctx, debug = false,hub)
  {
    if (!debug) return;

    ctx.save();
    // move the drawing context to the agent's x and y coords to rotate around center of image
    ctx.translate(this.x, this.y);

    ctx.rotate(this.rotation);

    ctx.drawImage(bee, -bee.width/2, -bee.height/2);;
    // will display a colored square around the agent representing the state it is in
    if (showAgentStates && Agent.stateStyles[this.state] !== "" && Agent.stateStyles[this.state] !== undefined) {
       ctx.fillStyle = Agent.stateStyles[this.state];
       ctx.fillRect(-bee.width/2, -bee.height/2, bee.width, bee.height);
    }

    ctx.restore();

    ctx.restore();
  }
}

Agent.stateStyles = {
  'resting'    :'',                          // No coloring
  'exploring'  :'rgba(  0, 255,   0, 0.25)', // Green
  'follow_site':'rgba(255, 255, 255, 0.25)', // White
  'observing'  :'rgba(  0,   0, 255, 0.25)', // Blue
  'assessing'  :'rgba(255, 255,   0, 0.25)', // Yellow
  'dancing'    :'rgba(  0, 255, 255, 0.25)', // Cyan
  'piping'     :'rgba(255,   0, 255, 0.25)', // Magenta
  'commit'     :'rgba(255,  96,   0, 0.25)',  // Orange
  'recruiting' :'rgba(  0, 255,   0, 0.25)', // Green
  'waiting'    :'rgba(  0,   0, 255, 0.25)', // Blue
  'site assess':'rgba(255,   0,   0, 0.25)', // Red
  'searching'  :'rgba(255, 255,   0, 0.25)', // Yellow
  'following'  :'rgba(  0, 255, 255, 0.25)', // Cyan
  'exploiting' :'rgba(255,   0, 255, 0.25)' // Magenta
}

class Attractor
{
  constructor(attractorJson)
  {
    this.x     = attractorJson.x;
    this.y     = attractorJson.y;
    this.timer = attractorJson.timer;
    this.radius= attractorJson.radius;
  }

  draw(ctx, debug = false){
    ctx.save();

    ctx.translate(this.x, -this.y);
    ctx.fillStyle = Attractor.FILL_STYLE;
    ctx.strokeStyle = Attractor.STROKE_STYLE;

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
    ctx.fill();

    ctx.stroke();

    ctx.restore();
  }
}

Attractor.FILL_STYLE = "rgba(0, 255, 0, 0.5)";
Attractor.STROKE_STYLE = "rgb(0, 255, 0)";

//attractor nerf
//1. add a new property to the python that will enable us to un-hard code the RADIUS
//2. we're going to add it to json so we can receive the dynamic RADIUS
//3. update the draw routine in js with the json data

class DeadAgent
{
  constructor(agentJson)
  {
    this.id            =  agentJson.id;
    this.x             =  agentJson.x;
    this.y             = -agentJson.y;
    this.rotation      =  Math.PI/2 - agentJson.direction;
    this.state         =  agentJson.state;
    this.potentialSite =  agentJson.potential_site;
    this.isAlive       =  agentJson.live;
    this.qVal          =  agentJson.qVal;
  }

  draw(ctx, debug = false)
  {
    if (!debug)
      return;

    ctx.save();

    // Move the drawing context to the agent's x and y coords to rotate around center of image
    ctx.translate(this.x, this.y);

    ctx.rotate(this.rotation);
    ctx.drawImage(beeDead, -bee.width/2, -bee.height/2);

    ctx.restore();

    ctx.restore();
  }
}

class Fog
{
  constructor(x,y,fogBlockSize,hub,world,id)
  {
    this.id=id
    this.fogBlockSize=fogBlockSize;
    // console.log(x);
    this.hub=hub
    this.visitObj;
    this.maxOpacity=.7

    this.opacity=this.maxOpacity;

    this.color='rgb(255, 255, 255)';
    this.x =-world.x_limit+x;
    this.y=-world.y_limit+y;
    this.timeMax=100;
    this.time=0;
    this.view=2;
    this.inside=false;
    this.numberVisited=0;
    this.agentTime=new Map()
    this.agentsInHub=[]
    this.init=false
    this.selectMode=-1
    if(patrolLocations.loc != undefined){
      for(let patrol of patrolLocations.loc){
        if(patrol.x+this.fogBlockSize > this.x - (this.fogBlockSize)*1.7&&
            patrol.x-this.fogBlockSize < this.x+(this.fogBlockSize)*1.7 &&
              patrol.y+this.fogBlockSize > this.y - (this.fogBlockSize)*1.7 &&
                patrol.y-this.fogBlockSize <this.y+(this.fogBlockSize)*1.7){
                  this.selectMode=parseInt(patrol.mode)
                  this.maxOpacity=.4
                  this.opacity=this.maxOpacity;
                  this.selected=true
                  // console.log("SELECTED");
                }
      }
    }

    this.left=this.x-fogBlockSize-(1/8)
    this.right=this.x+fogBlockSize+(1/8)
    this.leftX=this.x-(fogBlockSize*(2/3))-(1/8)
    this.rightX=this.x+(fogBlockSize*(2/3))+(1/8)
    this.bottom=this.y+fogBlockSize
    this.top=this.y-fogBlockSize
  }

  checkAgent(agents,hub){
    if(!this.init){
      this.agentsInHub=new Array(agents.length)
      this.agentsInHub.fill(false,0,agents.length)
      this.init=true
    }
    for(var agent of agents)
    {
      //console.log(agent.x)
      if(agent.x > this.x - (this.fogBlockSize-1)*this.view &&
          agent.x < this.x+(this.fogBlockSize-1)*this.view &&
            agent.y > this.y - (this.fogBlockSize-1)*this.view &&
              agent.y <this.y+(this.fogBlockSize-1)*this.view)
      {
        if(!(Math.sqrt((hub.x - agent.x)*(hub.x - agent.x) +(hub.y - agent.y)*(hub.y - agent.y)) < hub.radius-5))
        {
          this.agentTime.set(agent.id.toString(),Date.now())
          agent.lastLocations.push(this)
          //console.log(this.agentsInHub);
        }

      }

    }
  }

  selecting(points,selectMode){
    // Will select points that are being selected by the mouse and highlight those selected
    for(let point of points){
      var dx = this.x - point.x ;
      var dy = this.y - point.y ;
      var distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < point.r+5) {
        if(deletingSelect){
          if(this.id in selectedCoords){
            // console.log(selectedCoords);
            let infoToSend={fullPatrol:selectedCoords,deleted:selectedCoords[this.id]}
            // console.log(infoToSend);
            // console.log(JSON.stringify(selectedCoords));
            socket.emit("input",{type:"patrolLocationsCheck",info:infoToSend})
            // console.log(selectedCoords);
            delete selectedCoords[this.id]
          }
          this.selectMode=-1
          this.selected=false;
          this.maxOpacity=.7
        }else{
          selectedCoords[this.id]={x:this.x,y:this.y,mode:this.selectMode}
          // console.log(selectedCoords[this.id]);
          socket.emit("input",{type:"patrolLocations",info:{x:this.x,y:this.y,mode:this.selectMode}})
          this.selected=true;
          this.selectMode=selectMode
          this.flash=true
          this.maxOpacity=.4
        }
      }
    }

  }

  draw(ctx,id){

    ctx.beginPath()
    ctx.fillStyle = this.color;
    if(this.selectMode!=-1){
      // console.log(this.selectMode);
      ctx.fillStyle = Object.entries(Fog.stateStyles)[this.selectMode][1];
    }
    ctx.globalAlpha=this.opacity


    ctx.beginPath()
    ctx.moveTo(this.left,this.y)
    ctx.lineTo(this.leftX,this.top)
    ctx.lineTo(this.rightX,this.top)
    ctx.lineTo(this.right,this.y)
    ctx.lineTo(this.rightX,this.bottom)
    ctx.lineTo(this.leftX,this.bottom)
    ctx.lineTo(this.left,this.y)
    ctx.fill()

    ctx.globalAlpha=1;
    this.opacity+=.001
    if(this.opacity >this.maxOpacity){
      this.opacity = this.maxOpacity
    }
  }

}
Fog.stateStyles = {
  'Patrol'    :'rgb(  0, 0, 255)',                         // No coloring
  'Avoid'  :'rgb(  255, 0, 0)', // Green
  'PatrolVisit'  :'rgb(140, 140, 255)', // Green
  'AvoidAdded'  :'rgb(255, 140, 140)' // Greenrgb(150, 0, 255)

}

class Hub
{
  constructor(hubJson)
  {
    this.x      =  hubJson.hub["x"];
    this.y      = -hubJson.hub["y"];
    this.radius =  hubJson.hub["radius"];
    this.agentsIn = hubJson.hub["agentsIn"]
    // console.log(hubJson.hub);
    this.paths=[]
    for(var i=0;i <= hubJson.agents.length;i++){
      this.paths[i]=new Array()
    }
  }

  draw(ctx, debug = false, agents)
  {
    ctx.save();
    var i=0;
    var k=0;

    //This allows the fog to dissapate where the agent has been
    // when an agent returns to the hub
    for(var agent of agents){
      if(Math.sqrt((this.x - agent.x)*(this.x - agent.x) +(this.y - agent.y)*(this.y - agent.y)) < this.radius-5){
        //i is the agent id
        //2nd parameter creates a new array for that agent
        //3rd line copies agents last locations over to that new array
        this.paths[i][this.paths[i].length]=new Array()
        this.paths[i][this.paths[i].length] = agent.lastLocations.slice()
        agent.lastLocations.splice(0,agent.lastLocations.length)
      }
      i++;
    }
    var t=0
    for(var agentPaths of this.paths){
      var i=0;

      for(var agentPath of agentPaths){
        var k=0;
        if(agentPath.length == 0){
          agentPaths.splice(i,1);
        }
        var j=0
        for(var path of agentPath){
          if(path.opacity<=0){
            agentPath.splice(k,1);
          }
          path.opacity=0
          //console.log(t);
          path.agentsInHub[t]=true
          j++
        }
        i++
      }
      t++
    }


    ctx.fillStyle = "rgba(242, 179, 19, .5)";
    ctx.strokeStyle = "rgb(242, 179, 19)";
    ctx.lineWidth = 2;
    ctx.translate(this.x, this.y);

    // make sure the hub is visible
    // TODO: don't hack it like this? discuss whether it should just be set
    //       to a more reasonable value

    var radius = (this.radius < 20) ? 20 : this.radius;

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2, false);

    ctx.fill();
    ctx.stroke();

    // ctx.globalAlpha=1
    // ctx.font = "20px Arial";
    // ctx.fillStyle="white"
    // ctx.shadowOffsetX = 2;
    // ctx.shadowOffsetY = 2;
    // ctx.shadowBlur=2
    // ctx.shadowColor = 'black';
    // // let imageNum=(this.currentImage+1).toString()
    // ctx.fillText(this.agentsIn,this.x-15,this.y+35);
    // ctx.shawdowBlur=0
    // ctx.shadowOffsetX =0
    // ctx.shadowOffsetY = 0;


    ctx.restore();
  }
}

class Obstacle
{
  constructor(obstacleJson)
  {
    this.x      =  obstacleJson["x"];
    this.y      = -obstacleJson["y"];
    this.radius =  obstacleJson["radius"];
  }

  draw(ctx, debug = false)
  {
    if (!debug)
      return;

    ctx.save();

    // obstacle coordinates are for the centre, so we need to adjust
    // to a top-left position
    ctx.translate(this.x - (this.radius), this.y - (this.radius));

    // img, x, y, width, height
    ctx.drawImage(obstacle, 0, 0, this.radius * 2, this.radius * 2);

    /*ctx.font = "14pt sans-serif";
    ctx.fillStyle = "rgb(0, 0, 0)";
    let width = ctx.measureText("Obstacle").width;
    ctx.fillText("Obstacle", this.radius - width/2, this.radius + 20 + this.radius);*/

    ctx.restore();
  }
}

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

class Repulsor
{
  constructor(repulsorJson)
  {
    this.x      = repulsorJson.x;
    this.y      = repulsorJson.y;
    this.radius = repulsorJson.radius;
    this.timer  = repulsorJson.timer;
  }

  draw(ctx, debug = false)
  {
    ctx.save()

    ctx.translate(this.x, -this.y);
    ctx.fillStyle = Repulsor.FILL_STYLE;
    ctx.strokeStyle = Repulsor.STROKE_STYLE;

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

Repulsor.FILL_STYLE = "rgba(255, 0, 0, 0.5)";
Repulsor.STROKE_STYLE = "rgb(255, 0, 0)";

class Rough
{
  constructor(roughJson)
  {
    this.x      =  roughJson["x"];
    this.y      = -roughJson["y"];
    this.radius =  roughJson["radius"];
  }

  draw(ctx, debug = false)
  {
    if (!debug)
      return;
      
    ctx.save();

    ctx.fillStyle = "rgba(244, 164, 96, 0.5)";
    ctx.strokeStyle = "rgb(244, 164, 96)";
    ctx.translate(this.x, this.y);

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

class Site
{
  // site json format = [ x, y, radius, quality ]
  constructor(siteJson)
  {
    this.x      =  siteJson["x"];
    this.id     =  siteJson["id"];
    this.y      = -siteJson["y"]; // drawing coordinates have down as positive y
    this.radius =  siteJson["radius"];
    this.q      =  siteJson["q_value"];
  }

  draw(ctx, debug = false)
  {
    if (!debug)
      return;

    var rVal = (this.q < 0.5) ? (1.0 - this.q) * 2 : 1.0;
    var gVal = (this.q < 0.5) ? 1.0 : this.q * 2;

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
      ctx.font = "14pt sans-serif";
      ctx.fillStyle = "rgb(0, 0, 0)";
      let width = ctx.measureText(`Site: ${this.id}`).width;
      ctx.fillText(`Site: ${this.id}`, -width/2, 20 + this.radius);
    }

    ctx.restore();
  }
}

class SwarmState {
  constructor(stateJson){
    this.state = stateJson.state;

    this.size = 0;
    this.total = 0;
    this.radius = 0;
    //ui.register("stateCounts", this.update.bind(this));
  }


  draw(ctx, agents){

    //console.log(Object.entries(this.state));
    //console.log(this.state);this.total++
    this.size = 0;
    this.total = 0;//agents.length;
    //console.log(agents.length);
    for (let agent of agents){
      //console.log(this.state);
      //console.log(agent);
      /*
      if (agent.state == "exploring" || agent.state == "assessing" || agent.state == "site assess" || agent.state == "piping" || agent.state == "commit"){
        this.total++;
      }
      if (this.state == "exploring" && agent.state == "exploring"){
        this.size++;
        //this.total++;
      }
      if (this.state == "assessing" && (agent.state == "assessing" || agent.state == "site assess")){
        this.size++;
        //this.total++;
      }
      if (this.state == "commit" && (agent.state == "piping" || agent.state == "commit")){
        this.size++;
        //this.total++;
      }*/
      if (agent.state == "exploring" || agent.state == "observing" || agent.state == "follow_site" || agent.state == "reportToHub" || agent.state == "returnToSite"){
        this.total++;
      }
      if (this.state == "Exploring" && agent.state == "exploring"){


        this.size++;
      }
      if (this.state == "Observing" && agent.state == "observing"){
        this.size++;
      }
      if (this.state == "Following site" && (agent.state == "follow_site" || agent.state == "reportToHub" || agent.state == "returnToSite")){
        this.size++;
      }

    }

    if($("#numberInState").html() !=undefined){
      if(this.state=="Exploring" &&stateInfoOn.get("Exploring")){
        $("#numberInState").html(this.size)
      }
      if(this.state=="Observing" &&stateInfoOn.get("Observing")){
        $("#numberInState").html(this.size)
      }
      if(this.state=="Following site" &&stateInfoOn.get("Following Site")){
        $("#numberInState").html(this.size)
      }

    }

    //console.log(this.total);
    let x = -world.x_limit + StateBubbles.BUBBLE_SPACING;
    let y = world.y_limit - StateBubbles.MAX_RADIUS - StateBubbles.LABEL_SPACING;

    //let x, y = [0, 0];
    //let x = 0;

    ctx.save();
    ctx.translate(x, y);
    x = 0;
    this.radius = this.size/this.total*SwarmState.MAX_RADIUS;
    if (this.radius < SwarmState.MIN_RADIUS){
      this.radius = SwarmState.MIN_RADIUS;
    }
    /*if (this.state == "exploring"){
      x += SwarmState.MAX_RADIUS;
    }*/
    /*
    if (this.state == "assessing"){
      x += SwarmState.BUBBLE_SPACING;
    }
    if (this.state == "commit"){
      x += 2 * SwarmState.BUBBLE_SPACING;
    }*/
    if (this.state == "Observing"){
      x += SwarmState.BUBBLE_SPACING;
    }
    if (this.state == "Following site"){
      x += 2 * SwarmState.BUBBLE_SPACING;
    }

    if (this.state == "Exploring"){
      ctx.globalAlpha = .7;
      ctx.fillStyle = "black";
      ctx.fillRect(-40,-30,295,70);
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = "rgb(108, 163, 252)";
    ctx.beginPath();
    ctx.arc(x, 0, this.radius, 0, Math.PI * 2, false);
    //ctx.arc(100, 0, 50, 0, 2 * Math.PI);
    ctx.fill();



    ctx.font = "8pt sans-serif";
    ctx.fillStyle = "rgb(255, 255, 255)";
    let width = ctx.measureText(`${this.state}/${this.size}`).width;
    //let name1 = name[0].toUpperCase();
    ctx.fillText(`${this.state}/${this.size}`, x-width/2, SwarmState.LABEL_SPACING);

    x += this.radius + SwarmState.BUBBLE_SPACING;
    ctx.restore();
  }


}

SwarmState.MAX_RADIUS = 20;
SwarmState.MIN_RADIUS = 1;
SwarmState.BUBBLE_SPACING = 100; // in px
SwarmState.LABEL_SPACING = 30;

class Trap
{
  constructor(trapJson)
  {
    this.x      =  trapJson["x"];
    this.y      = -trapJson["y"];
    this.radius =  trapJson["radius"];
  }

  draw(ctx, debug = false)
  {
    if (!debug)
      return;

    ctx.save();

    ctx.fillStyle = "rgb(122, 18, 18)";
    ctx.strokeStyle = "rgb(122, 18, 18)";
    ctx.translate(this.x, this.y);

    ctx.beginPath();
    ctx.moveTo(this.radius, 0);

    //ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
    //ctx.fill();

    for (let i = 0; i <= 360; i += 5)
    {
      // check if i is even or odd
      let pointRadius = (i & 1 == 1) ? this.radius : this.radius - 5;

      ctx.lineTo(pointRadius * Math.cos(i * Math.PI/180), -(pointRadius * Math.sin(i * Math.PI/180)));
    }
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();

    /*ctx.font = "14pt sans-serif";
    ctx.fillStyle = "rgb(0, 0, 0)";
    let width = ctx.measureText("Trap").width;
    ctx.fillText("Trap", -width/2, 20 + this.radius);*/

    ctx.restore();
  }
}

class World
{
  constructor(environmentJson)
  {
    this.x_limit = environmentJson.x_limit;
    this.y_limit = environmentJson.y_limit;
    this.width  = this.x_limit * 2;
    this.height = this.y_limit * 2;
    this.hub    = new Hub(environmentJson);
    this.sites       = [];
    this.obstacles   = [];
    this.traps       = [];
    this.rough       = [];
    this.attractors  = [];
    this.repulsors   = [];
    this.agents      = [];
    this.dead_agents = [];
    this.pheromones  = [];
    this.environment = environmentJson;
    this.swarmState = [];
    let fogBlockSize= 10;
    this.fogBlock    = [];
    var ratioX=patrolLocations.windowSize.w/(this.width)
    var ratioY=patrolLocations.windowSize.h/this.height
    // console.log(ratioY);
    // console.log(ratioX);
    if(patrolLocations.loc != undefined){
      for(let loc of patrolLocations.loc){
        loc.x=(loc.x/ratioX)-(this.width/2)
        loc.y=(loc.y/ratioY)-(this.height/2)
      }
    }
    //console.log(((this.width/this.fogBlockSize)*(this.height/this.fogBlockSize)))
    // console.log(this.height);
    let id=0
    for (let y=0; y<(this.height+fogBlockSize);y+=2*fogBlockSize){
      for(let x=0;x<(this.width+fogBlockSize);x+=(10/3)*fogBlockSize){
        if(Math.sqrt((x - this.hub.x/2-this.x_limit)**2+(y - this.hub.y-this.y_limit)**2) > this.hub.radius+30){
          this.fogBlock.push(new Fog(x,y,fogBlockSize,this.hub,this,id));
          id++
        }
      }
    }

    for (let y=fogBlockSize; y<(this.height+fogBlockSize);y+=2*fogBlockSize){
      for(let x=(5/3)*fogBlockSize;x<(this.width+fogBlockSize);x+=(10/3)*fogBlockSize){
        if(Math.sqrt((x - this.hub.x/2-this.x_limit)**2+(y - this.hub.y-this.y_limit)**2) > this.hub.radius+30){
          this.fogBlock.push(new Fog(x,y,fogBlockSize,this.hub,this,id));
          id++
        }
      }
    }

    // for (let y=0; y<(this.height+fogBlockSize);y+=fogBlockSize){
    //   for(let x=0;x<(this.width+fogBlockSize);x+=fogBlockSize){
    //     if(Math.sqrt((x - this.hub.x/2-this.x_limit)**2+(y - this.hub.y-this.y_limit)**2) > this.hub.radius+30){
    //       this.fogBlock.push(new Fog(x,y,fogBlockSize,this.hub,this));
    //     }
    //   }
    // }
    // console.log(this.fogBlock);
    for (let site       of environmentJson.sites      ) { this.sites      .push( new Site      (site      ) ); }

    for (let obstacle   of environmentJson.obstacles  ) { this.obstacles  .push( new Obstacle  (obstacle  ) ); }
    for (let trap       of environmentJson.traps      ) { this.traps      .push( new Trap      (trap      ) ); }
    for (let rough      of environmentJson.rough      ) { this.rough      .push( new Rough     (rough     ) ); }
    for (let attractor  of environmentJson.attractors ) { this.attractors .push( new Attractor (attractor ) ); }
    for (let repulsor   of environmentJson.repulsors  ) { this.repulsors  .push( new Repulsor  (repulsor  ) ); }
    for (let agent      of environmentJson.agents     ) { this.agents     .push( new Agent     (agent     ) ); }
    for (let dead_agent of environmentJson.dead_agents) { this.dead_agents.push( new DeadAgent (dead_agent) ); }
    // this.canvasObjects.sites=this.sites

    //for (var pheromone of environmentJson.pheromones)   { this.pheromones .push( new Pheromone (pheromone)  ); }
    this.swarmState.push(new SwarmState(JSON.parse('{"state": "Exploring"}')));
    this.swarmState.push(new SwarmState(JSON.parse('{"state": "Observing"}')));
    this.swarmState.push(new SwarmState(JSON.parse('{"state": "Following site"}')));

  }

  canvasToWorldCoords(x, y)
  {

    return {x: (x - this.x_limit), y: -(y - this.y_limit)};
  }

  update(environment){
    //This will erase the current array of pheromones and replace it with the current ones (even if the previous ones arent finished)
    //This could possibly be replaced with an algorithm that wont delete ones that havent dissapated yet.
    this.pheromones.splice(0,this.pheromones.length)
    this.pheromones=environment.pheromones

    //This was part of an attempt to not draw agents that are inside the hub
    // this.hub.agentsIn=environment.hub["agentsIn"]

    //This updates the sites. It is only needed if you have moving sites.
    let siteLength=this.sites.length
	  for (let i = 0; i < siteLength; i++) {
		  this.sites[i].x = Math.round(environment.sites[i].x);
		  this.sites[i].y = Math.round(-environment.sites[i]["y"]);
	  }

    //In this current Iteration there is no way for an agent to die. When dead agents were implemented,
    //this update function didnt exist, but a new world was created every update instead.
    //When agents do die, this algorithm doesnt work well because It doesnt keep track of which agent needs to be
    //removed from the alive agents.
    let deadAgentLength=this.dead_agents.length
	  for (let i = 0; i < deadAgentLength; i++) {

		  this.dead_agents[i].x = environment.dead_agents[i].x;
		  this.dead_agents[i].y = -environment.dead_agents[i].y;
	  }

	  //Update Alive Agents
    let agentLength= this.agents.length - this.dead_agents.length;
	  for (let i = 0; i <agentLength; i++) {

		  this.agents[i].x = Math.round(environment.agents[i].x);
		  this.agents[i].y = Math.round(-environment.agents[i].y);
		  this.agents[i].rotation = Math.PI/2 - environment.agents[i].direction;
      this.agents[i].state = environment.agents[i].state;
	  }

    //This is an attempt to allow the front end to know that the patrol has been completed
    if(environment.patrolUpdate<=0){
      for(let fog of this.fogBlock){
        if(fog.selected){
          if(fog.selectMode != 2 || fog.selectMode !=3 ){
            fog.selectMode+=2

          }
          fog.selected=false;
          fog.maxOpacity=.5
        }
      }
    }


  }
  // Draw the whole world recursively. Takes a 2dRenderingContext obj from
  // a canvas element
  draw(ctx, debug = false, showAgentStates = false)
  {
    for (var site       of this.sites      ) { site      .draw(ctx, debug); }
    //These aren't being used currently
    // for (var obstacle   of this.obstacles  ) { obstacle  .draw(ctx, debug); }
    // for (var trap       of this.traps      ) { trap      .draw(ctx, debug); }
    // for (var rough      of this.rough      ) { rough     .draw(ctx, debug); }
    // for (var attractor  of this.attractors ) { attractor .draw(ctx, debug); }
    // for (var repulsor   of this.repulsors  ) { repulsor  .draw(ctx, debug); }

    this.hub.draw(ctx, debug, this.agents);

    for (var agent      of this.agents     ) { agent     .draw(ctx, debug,this.hub); }
    for (var dead_agent of this.dead_agents) { dead_agent.draw(ctx, debug); }



    for (var fog        of this.fogBlock ) {  if(deleteAll){
                                                            selectedCoords={}
                                                            fog.selectMode=-1
                                                            fog.selected=false;
                                                            fog.maxOpacity=.7
                                                                  }
                                              fog       .selecting(selectedArea,currentSelectMode);
                                              fog       .checkAgent(this.agents,this.hub);
                                              if(showFog || fog.selected){
                                                fog       .draw(ctx);
                                              }
                                             }
    deleteAll=false


    if(debug && showPheromone){
      this.drawPheromones()

    }
    for (let state      of this.swarmState ) { state.draw(ctx, this.agents); }



  }

  drawPheromones(){
    for(let pheromone of this.pheromones){
      // console.log(i);

      // console.log(i%2);
      // if(i%2==0 && this.pheromones.length >10){
        // break;
      // }
      // i+=1
      ctx.beginPath()

      let x=255//(255-(pheromone.site*(255/this.sites.length))).toString();
      if(x <=0){
        x=0;
      }
      ctx.fillStyle = "white";
      if(pheromone.strength <=0){
        ctx.globalAlpha = .00001

      }else{
        ctx.globalAlpha = (pheromone.strength)*.8

      }
      ctx.beginPath()
      ctx.arc(Math.round(pheromone.x), Math.round(-pheromone.y), pheromone.r,0,Math.PI*2);
      //}
      ctx.fill();
      ctx.globalAlpha = 1

    }
  }

}

//*****************************************************************************
// Globals
//*****************************************************************************

console.log('%c To Do List: ', 'font-size:15px;font-weight:900;color: rgb(0, 0, 0)');

console.log("%c 1."+'%c Repulsors need to delete on backend when deleted on front end \n'+
             ' %c    Add ids to the coords\n'+
             '     You may also have to do a search for points in an area since the size of the worlds are different\n'+
             '     Actually, you can just send the list back with things deleted. If it cant find a repulsor hexagon in the area of a current repulsor, it is deleted',
             'font-size:12px;color: rgb(0, 0, 0);',
             'font-size:12px;font-weight:700;color: rgb(116, 24, 0); ',
             'font-size:10px; font-weight:700;color: rgb(0, 26, 116);');
console.log("%c 2."+`%c Interface the selection on the live simulation\n`+
                              ` %c    Use the "selectedCoords" map`,
                              'font-size:12px;color: rgb(0, 0, 0);',
                              'font-size:12px; font-weight:700;color: rgb(116, 24, 0); ',
                              'font-size:10px; font-weight:700;color: rgb(0, 26, 116);');
console.log("%c 3."+`%c Get rid of scrolling through images\n`+
                          ` %c    Partially Implemented. Arrows appear, but are not clickable`,
                          'font-size:12px;color: rgb(0, 0, 0);',
                          'font-size:12px; font-weight:700;color: rgb(116, 24, 0); ',
                          'font-size:10px; font-weight:700;color: rgb(0, 26, 116);');
console.log("%c 4."+`%c Visuals for Q-Value\n`+
                          ` %c    Think of a recycle symbol\n     Add more arrows around as the q Value goes up\n     In our case, put the arrows on the bottom of the image`,
                          'font-size:12px;color: rgb(0, 0, 0);',
                          'font-size:12px; font-weight:700;color: rgb(116, 24, 0); ',
                          'font-size:10px; font-weight:700;color: rgb(0, 26, 116);');


// get a socket object from the socket.io script included above
var socket = io();
var world = null;
var clientId;

//These are for the pre-planning and live-planning methods of selecting areas of the canvas
var currentSelectMode=0
var selectModes=["Patrol","Avoid"]
var selectedArea=[]
var deleteAll=false;
var deletingSelect=false;
var selectedCoords= {}
// Gets the previous screens pre-planning
var patrolLocations;
socket.on('patrolLocations',function(loc){
  patrolLocations=loc
})


var debug           = false;
var showAgentStates = false;

// Background image
var background = document.getElementById('source');
var sliderVal =document.getElementById('myRange').value;
// var date=new Date()
$("#myRange").change(function(e){
  sliderVal =document.getElementById('myRange').value;
})
$(document).keydown(function(e){
  // console.log("here");
  if(e.which==65 ||e.which==37 ){
    currentSelectMode--;
    if(currentSelectMode<0){
      currentSelectMode=selectModes.length-1
    }
    $( "#selectType" ).html(selectModes[currentSelectMode])
    $( "#selectType" ).css("color",Object.entries(Fog.stateStyles)[currentSelectMode][1])

  }else if(e.which==68 ||e.which==39 ){
    currentSelectMode++;
    if(currentSelectMode>selectModes.length-1){
      currentSelectMode=0
    }
    $( "#selectType" ).html(selectModes[currentSelectMode])
    $( "#selectType" ).css("color",Object.entries(Fog.stateStyles)[currentSelectMode][1])
  }
})
document.getElementById("canvasDiv").addEventListener("dblclick", function(e){
  deleteAll=true
})
document.addEventListener('contextmenu', event => event.preventDefault());
// get a reference to the canvas element
var canvas = document.getElementById("canvas");

const cursors ={
                 default: new CursorDefault(),
                 selecting: new CursorSelecting(),
                 radialDrag: new CursorRadialDrag(),
                 placeBaitBomb: new CursorPlaceBaitBomb()
               };

var stateInfoOn=new Map()
stateInfoOn.set("Exploring", false)
stateInfoOn.set("Observing", false)
stateInfoOn.set("Following Site", false)
var defaultStateDescript="<p id='defaultStateDescript'>Info on the different states of the Agents</p>"

$("#agentStateDescriptionDiv").append(`<table id="statesInfo"><caption id="stateTitle">States</caption>
                                        <tr>
                                        <th class="statesHeader">Exploring</th>
                                        <th class="statesHeader">Observing</th>
                                        <th class="statesHeader">Following Site</th>
                                        </tr>
                                        </table>
                                        <div id="statesInfoTextDiv">
                                        <p id="statesInfoText">`+defaultStateDescript+`</p>
                                        </div>`)





// Get Image references and other presets
var bee = document.getElementById("drone");
var beeDead;
var obstacle;
var simType;
socket.on('simType', function(type){
  simType=type;

  if(type=="Drone"){
    bee      = document.getElementById("drone"     );

    beeDead  = document.getElementById("drone-dead");
  }
  else if(type=="Bee"){
    bee      = document.getElementById("bee"     );
    beeDead  = document.getElementById("bee-dead");
  }
  else if(type=="Ant"){
    bee      = document.getElementById("ant"     );
    beeDead  = document.getElementById("ant-dead");
  }
  else if(type=="Uav"){
    bee      = document.getElementById("drone"     );
    beeDead  = document.getElementById("drone-dead");
  }
   obstacle = document.getElementById("obstacle");

});

var finishedDrawing = false;
var ui = new UI();
var mouse = new Mouse();

var ctx;
// In order to associate a client with a specific engine process,
// the server sends us a unique id to send back once socket.io has
// established a connection
socket.on('connect', function(){
   var idx = document.cookie.indexOf("simId");
   var endIdx = document.cookie.indexOf(";", idx);

   if (endIdx == -1)
   {
      endIdx = undefined;
   }

   simId = document.cookie.slice(idx, endIdx).split("=").pop();

   socket.emit('simId', simId);
});

socket.on("connectionType",function(type){
  console.log(type);
})

// This is where the magic happens. When we emit an "update" event from the
// server, it'll come through here.
socket.on('update', function(worldUpdate){
   // New World
   if (world === null){
      world = new World(worldUpdate.data);
      canvas.setAttribute("width", world.width);
      canvas.setAttribute("height", world.height);

      // Resizes the canvas to the size determined in the Python code
      document.getElementById("canvasDiv").style.width = world.width + "px";

      ctx = canvas.getContext("2d");
      // Translate the origin from the top left corner to the center of the screen.
      // Keep in mind that the canvas's y increases going down, whereas, the world's y
      // increases going up. To overcome this, there is a function in World called canvasToWorldCoords
      // that will convert any x-y coridinate to the world's coridinates
      ctx.translate(world.x_limit, world.y_limit);

      //Start the drawing cycle
      draw()
   }
   else if (finishedDrawing){
      world.update(worldUpdate.data)

      ui.on(worldUpdate);
   }
});

function draw(environment){
  //The updates will not be let through unless the the current iteration of drawing is finished
  finishedDrawing = false;
  // clear canvas
  ctx.clearRect(-world.x_limit, -world.y_limit, world.width, world.height);
  ctx.save();
  ctx.fillStyle = "rgb(160, 160, 160)";
  ctx.fillRect(-world.x_limit, -world.y_limit, world.width, world.height);


  if(simType=="Drone"){
    ctx.globalAlpha = sliderVal/100;
    ctx.drawImage(background, -world.x_limit, -world.y_limit,world.width, world.height);
    ctx.globalAlpha = 1;
  }

  world.draw(ctx, debug, showAgentStates, environment);

  ui.draw(ctx, debug);
  //Updates will not be allowed
  finishedDrawing = true;
  mouse.deltaY=0;
  mouse.deltaX=0;
  // console.log(mouse);
  window.requestAnimationFrame(draw);

}

// TODO: I don't like where this is going, I should be able to make one subscription
//       to the socket and let the UI class sort out all the details
socket.on('baitToggle'          , function(data) { document.getElementById('buttonBugBait').style.display = 'block';});
socket.on('bombToggle'          , function(data) { document.getElementById('buttonBugBomb').style.display = 'block';});
socket.on('updateMission'       , function(data) { ui.on(data) });
socket.on('hubControllerToggle' , function(data) { ui.on(data) });
socket.on('restart'             , function(data) { ui.on(data) });
socket.on('updateRadial'        , function(data) { ui.on(data) });
socket.on('updateDebugParams'   , function(data) { ui.on(data) });
socket.on('updateUIParams'      , function(data) { ui.on(data) });
socket.on('updateSitePriorities', function(data) { ui.on(data) });
socket.on('setStates'           , function(data) { ui.on(data) });
socket.on('stateCounts'         , function(data) { ui.on(data) });
socket.on('updateChat'          , function(data) { ui.on(data) });
