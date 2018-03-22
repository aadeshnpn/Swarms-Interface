class MissionLayer {
	constructor(ui) {

		this.points =[]
		this.hoveredPoint=false;
		// create list of images
		this.siteImages = [];
		this.loadSiteImages();

		ui.register('updateMission', this.update.bind(this));
		//console.log(this.update.bind(this));
		ui.register('restart', this.reset.bind(this));

		cursors.default.addEventListener('mousemove', this.onMouseMove.bind(this));
		cursors.default.addEventListener('wheel', this.onMouseWheel.bind(this));
	}


	update(data) {
		this.points.push(new Point({x:data.x,y:data.y},data.id,this.siteImages))
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
				if(point.bottomHovered){
					point.drawButtons(ctx);
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
		this.siteImages = [];
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

		}

	}

	loadSiteImages() {
		let numOfImages = 12;
		// load in names of image files
		for (let i = 1; i <= numOfImages; i++) {
			this.siteImages.push("../siteImages/" + (i < 10 ? "0" : "") + i + ".jpg");
		}

		// shuffle them
		for (let i = 0; i < numOfImages; i++) {
			// choose one at random
			let rand = Math.floor(Math.random() * numOfImages);
			// swap them
			let temp = this.siteImages[rand];
			this.siteImages[rand] = this.siteImages[i];
			this.siteImages[i] = temp;
		}
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
}
