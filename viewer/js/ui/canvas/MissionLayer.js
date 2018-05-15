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
