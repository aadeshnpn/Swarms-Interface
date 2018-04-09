class MissionLayer {


	constructor(ui) {
        this.isDown = false
		this.points =[]
		this.hoveredPoint=false;
		// create list of images
//		this.siteImages = [];
		this.enemyImages = [[],[]]
		this.neutralImages = [[],[]];
		this.loadSiteImages();

		ui.register('updateMission', this.update.bind(this));
		//console.log(this.update.bind(this));
		ui.register('restart', this.reset.bind(this));

		cursors.default.addEventListener('mousemove', this.onMouseMove.bind(this));
		cursors.default.addEventListener('wheel', this.onMouseWheel.bind(this));
		cursors.default.addEventListener('mousedown', this.onMouseDown.bind(this));
		cursors.default.addEventListener('mouseup', this.onMouseUp.bind(this));
	}


	update(data) {
		// console.log(data.id);
		let update=false;
		for(let point of this.points){
			if(point.siteId==data.id){
				update=true
				point.x=data.x
				point.y=data.y
//				point.images.push(this.enemyImages[Math.floor(Math.random() *this.enemyImages.length)])
//                console.log( this.enemyImages[Math.floor(Math.random() *this.enemyImages.length)])
//                point.images = this.enemyImages[Math.floor(Math.random() *this.enemyImages.length)]

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
			point.drawPoints(ctx)

		}
		for(let point of this.points){
			if(point.hovered){
				point.drawImages(ctx)
                point.range = point.makeRangeControl(point.left, -point.bottom -point.height, point.width, point.height)

				if(point.bottomHovered){
					point.drawButtons(ctx);
//					point.drawRangeSlider(ctx);
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

	onMouseMove(e) {
		let worldRelative={x: e.offsetX, y:e.offsetY }
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

			if(point.hovered && point.top){

			    if(point.topOfImage(worldRelative,world)){
					point.topHovered=true
					document.getElementById("canvas").style.cursor = "pointer";
				}else{
					point.topHovered=false
					document.getElementById("canvas").style.cursor = "default";
				}
			}
			else{
                point.topHovered=false
                document.getElementById("canvas").style.cursor = "default";
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

	onMouseDown(e){
		let i=0
		for(let point of this.points){
			if(point.bottomHovered){
				point.buttonShadow=.5;
				socket.emit("input",{type:"denySite",id:point.siteId})
				this.points.splice(i,1)
				this.hoveredPoint=false
				document.getElementById("canvas").style.cursor = "default"
			}
			if(point.topHovered){
			    let worldRelative={x: e.offsetX, y:e.offsetY }
                if(world){
                    let worldRelative = world.canvasToWorldCoords(e.offsetX, e.offsetY);
                    //let worldRelative = {x:world.x,y:world.y};
                }
                if (!this.isDown){
                    this.isDown= point.isDown(worldRelative, world)
                    if(this.isDown){
                       // console.log("isDown!!!!")
                    }
                }
			}

			i+=1
		}
        if(this.isDown){
                console.log("IS_DOWN")
        }
	}
	onMouseUp(e){
		for(let point of this.points){
			point.buttonShadow=1.5
		}

		this.isDown = false
		console.log('IS_UP')
	}
}
