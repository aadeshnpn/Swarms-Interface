class MissionLayer {
	constructor(ui) {
		this.points = [];
		this.hoveredPoint = null;

		// the radius of the circle to draw for each point
		// and to detect the hover
		this.radius = 5;

		// a cluster has an image and an array of points
		// this is used to assign a single image to a group
		// of points that likely belong to the same site
		this.clusters = [];

		// the cluster distance is the minimum distance
		// a point must be from every point in a cluster
		// be be placed in a different cluster
		this.clusterDist = 8;

		// this is a placeholder for the image to show
		// when hovered over a point
		this.image = new Image();

		// the max size can be any positive number, and
		// the image will be draw with the correct ratio
		// bounded inside the max size
		this.imageMaxWidth = 200;
		this.imageMaxHeight = 200;

		// this is the width of the colored border and
		// stroke around the image
		this.imageBorderWidth = 2;

		// create list of images
		this.siteImages = [];
		this.loadSiteImages();

		ui.register('updateMission', this.update.bind(this));
		ui.register('restart', this.reset.bind(this));

		cursors.default.addEventListener('mousemove', this.onMouseMove.bind(this));
	}

	update(data) {
		this.points.push(data);
		// this can really slow down the ui if it gets out of hand
		if (this.points.length > 200) { // only keep the most recent 200 points
			this.points.shift();
		}

		// add to clusters
		let added = false;
		// check if the data point is close enough to an existing cluster
		clusterLoop:
		for (let cluster of this.clusters) {
			for (let point of cluster.points) {
				// compare distance to every point in cluster
				if (this.dist(point, data) <= this.clusterDist) {
					// match, store in cluster
					cluster.points.push(data);
					added = true;
					break clusterLoop;
				}
			}
		}

		if (!added) {
			// if all of the images have been used, reuse them
			if (this.siteImages.size === 0) {
				this.loadSiteImages();
			}

			// this point wasn't added to an existing cluster, start a new cluster
			this.clusters.push({image:this.siteImages.pop(), points:[data]});
		}
	}

	draw(ctx, debug = false) {

		ctx.save();

		for (let point of this.points) {
			// red value multiplier
			let rVal = (point.q > 0.5) ? (1.0 - point.q) * 2 : 1.0;
			// green value multiplier
			let gVal = (point.q > 0.5) ? 1.0 : point.q * 2;
			// set the fill and stroke colors
			ctx.fillStyle = `rgba(${Math.round(255 * rVal)}, ${Math.round(255 * gVal)}, 70, 0.8)`;
			ctx.strokeStyle = "rgb(20, 20, 20)";

			// draw the circle
			ctx.beginPath();
			ctx.arc(point.x, -point.y, this.radius, 0, 2 * Math.PI, false);
			ctx.fill();
			ctx.stroke();
			ctx.closePath();

			// if hovered, draw image
			if (point === this.hoveredPoint) {

				// get natural size of image

				let width = this.image.width;
				let height = this.image.height;

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

				let left = point.x - width / 2;
				if (left < -xLimit) {
					left = -xLimit;
				}

				let right = left + width;
				if (right > xLimit) {
					right = xLimit;
					left = right - width;
				}

				let top = point.y + height;
				if (top > yLimit) {
					top = yLimit;
				}

				let bottom = top - height;
				if (bottom < -yLimit) {
					bottom = -yLimit;
					top = bottom + height;
				}

				// draw border and background

				ctx.beginPath();
				ctx.moveTo(left, -bottom);
				ctx.lineTo(right, -bottom);
				ctx.lineTo(right, -top);
				ctx.lineTo(left, -top);
				ctx.lineTo(left, -bottom);
				ctx.fill();
				ctx.stroke();
				ctx.closePath();

				// redraw the center of the circle

				ctx.beginPath();
				ctx.arc(point.x, -point.y, this.radius, 0, 2 * Math.PI, false);
				ctx.fill();
				ctx.closePath();

				// draw image

				ctx.drawImage(this.image, left + this.imageBorderWidth, -top + this.imageBorderWidth,
					width - 2 * this.imageBorderWidth, height - 2 * this.imageBorderWidth);
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
		let worldRelative = world.canvasToWorldCoords(e.offsetX, e.offsetY);

		this.hoveredPoint = null;
		// check every point to see if it is hovered
		for (let point of this.points) {
			if (this.isHovered(point, worldRelative)) {
				// if hovered point changed, check cluster for new image
				if (this.hoveredPoint !== point) {
					this.hoveredPoint = point;
					// find the cluster this point belongs to
					for (let cluster of this.clusters) {
						if (cluster.points.includes(point)) {
							this.image.src = cluster.image;
							break;
						}
					}
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

	dist(point1, point2) {
		// use distance formula sqrt(x^2+y^2)
		return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
	}

	isHovered(point, mouse) {
		return this.dist(point, mouse) <= this.radius;
	}
}
