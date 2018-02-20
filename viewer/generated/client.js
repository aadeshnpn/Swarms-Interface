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
    cursors.placeBaitBomb.addEventListener('wheel', this.onWheel.bind(this));
    this.cursorCoords = {x: null, y: null};
    this.radius = 40;
    this.active = false;

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
    socket.emit('input', {type: entityType, x: worldRelative.x, y: worldRelative.y, radius: this.radius});
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

class Handle
{
   constructor(angle, hub, {interactive = true, colour = RadialControl.LINE_COLOUR} = {})
   {
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
      //world.hub.x =hub.x;
      //world.hub.y=hub.y;
   }

   setPrev(handle)
   {
      this.prev = handle;
   }

   setNext(handle)
   {
      this.next = handle;
   }

   updateRequested(value)
   {
      this.isRequesting = true;
      this.requested = value;
      this.requestedX = Math.cos(this.r) * (RadialControl.RADIUS_SCALE * this.beeNumberToRadiusScale(value))+world.hub.x;
      this.requestedY = Math.sin(this.r) * (RadialControl.RADIUS_SCALE * this.beeNumberToRadiusScale(value))-world.hub.y;
   }

   updateActual(value = 0)
   {
      this.actual = value;

      this.actualX = (Math.cos(this.r) * (RadialControl.RADIUS_SCALE * this.beeNumberToRadiusScale(value)))+world.hub.x;
      this.actualY = (Math.sin(this.r) * (RadialControl.RADIUS_SCALE * this.beeNumberToRadiusScale(value)))-world.hub.y;

      if (this.isRequesting && value == this.requested)
      {
         this.isRequesting = false;
      }

      if (!this.isRequesting)
      {
         this.requested = this.actual;
         this.requestedX = this.actualX;
         this.requestedY = this.actualY;
      }
   }

   draw(ctx, debug = false)
   {
      ctx.save();

      ctx.strokeStyle = this.colour;

      ctx.beginPath();
      ctx.moveTo(this.prev.actualX, -this.prev.actualY);
      ctx.lineTo(this.actualX, -this.actualY);
      ctx.lineTo(this.next.actualX, -this.next.actualY);
      ctx.stroke();

      if (this.actual != this.requested)
      {
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
      else if (this.interactive)
      {
         ctx.fillStyle = this.colour;

         ctx.beginPath();
         ctx.arc(this.requestedX, -this.requestedY, 2, 0, 2 * Math.PI, false);
         ctx.fill();
      }

      ctx.restore();
   }

   beeNumberToRadiusScale(number)
   {
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

   isHovered(x, y)
   {
      // use distance formula sqrt(x^2+y^2) to hover within radius
      let dist = Math.sqrt(Math.pow(x - this.requestedX, 2) + Math.pow(y - this.requestedY, 2));
      return dist <= 8;

      // this uses a rectangle, so it's dumb
      // var box = {left: this.requestedX - 5, top: this.requestedY - 5, right: this.requestedX + 5, bottom: this.requestedY + 5};
      // return (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom);
   }
}

class RadialControl
{
   constructor(ui, {interactive = true, colour = RadialControl.LINE_COLOUR, dataset = "agentDirections"} = {})
   {
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

      for (let i = 1; i < this.handles.length; i++)
      {
         // this only works because js lets you do negative array indices
         this.handles[i].setPrev(this.handles[(i - 1) % this.handles.length]);
         this.handles[i].setNext(this.handles[(i + 1) % this.handles.length]);
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
   update(data)
   {
      // data is an array[72] of direction information for every five degrees

      for (let i = 0; i < (360 / 5); i++)
         this.handles[i].updateActual(data.controller[this.dataset][i]);
   }

   draw(ctx, debug = false)
   {
      for (let h of this.handles)
      {
         h.draw(ctx, debug);
      }
   }

	startHandleHover(e) {
		let worldRelative = world.canvasToWorldCoords(e.offsetX, e.offsetY);
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

   onMouseDown(e)
   {
      this.drag.active = true;
      this.drag.handle = this.hover.handle;
      this.hover.active = false;
      this.hover.handle = null;
   }

   onMouseUp(e) {
      if (this.drag.active) {
		  this.drag.active = false;
		  this.drag.handle = null;
		  ui.setActiveCursor(cursors.default);
	  }
   }

   onMouseMove(e)
   {
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

	computeMouseComponent(mouseCoords, handle) {
		// let handleVector = {x: Math.cos(handle.r), y: -Math.sin(handle.r)};
		let mouseMagnitude = Math.sqrt(Math.pow(mouseCoords.x, 2) + Math.pow(mouseCoords.y, 2));
		let mouseAngle = Math.atan2(mouseCoords.y, mouseCoords.x);

		let component = mouseMagnitude * Math.cos(mouseAngle - handle.r);

		return component;
	}

	reset() {
		this.handles = [];
		this.drag = {active: false, handle: null};
		this.hover = {active: true, handle: null};

		for (let i = 0; i < (360 / 5); i++) {
			// we're doing it this way so eventually we can paramaterise the 5
			this.handles.push(new Handle(i * 5, {interactive: this.interactive, colour: this.colour}));
		}

		this.handles[0].setPrev(this.handles[this.handles.length - 1])
		this.handles[0].setNext(this.handles[1]);

		for (let i = 1; i < this.handles.length; i++) {
			// this only works because js lets you do negative array indices
			this.handles[i].setPrev(this.handles[(i - 1) % this.handles.length]);
			this.handles[i].setNext(this.handles[(i + 1) % this.handles.length]);
		}
	}
}

// If 100% of the agents are going in a direction, that point will have distance of MAX_AGENT_SCALE * RADIUS_SCALE
RadialControl.MAX_AGENT_SCALE = 10.0;
RadialControl.RADIUS_SCALE = 50;
RadialControl.LINE_COLOUR = 'blue';
RadialControl.HANDLE_COLOUR = 'blue';

/*class RadialControl
{
   constructor()
   {
      this.directions = [];
      this.drag = {active: false, handle: null};

      for (let i = 0; i < (360 / 5); i++)
      {
         var rad = (Math.PI/180) * (i * 5);
         this.directions[i] =
         {
            val: 1,
            x: RadialControl.RADIUS_SCALE * Math.cos(rad),
            y: RadialControl.RADIUS_SCALE * Math.sin(rad), // drawing to world coords
            r: rad,
            deg: (i * 5)
         };
      }

      cursors.default.addEventListener('mousemove', this.startHandleHover.bind(this));
      cursors.radialDrag.addEventListener('mousemove', this.onMouseMove.bind(this));
      cursors.radialDrag.addEventListener('mousedown', this.onMouseDown.bind(this));
      cursors.radialDrag.addEventListener('mouseup', this.onMouseUp.bind(this));
   }

   draw(ctx, debug = false)
   {
      ctx.save();

      ctx.translate(0, 0);
      ctx.save();

      ctx.beginPath();

      for (let i of this.directions)
      {
         ctx.lineTo(i.x, -i.y);
         //ctx.rotate( (Math.PI / 180) * 5 );
      }

      ctx.strokeStyle = RadialControl.LINE_COLOUR;
      ctx.stroke();

      ctx.restore();
      ctx.fillStyle = RadialControl.HANDLE_COLOUR;

      for (let i of this.directions)
      {
         ctx.beginPath();
         ctx.arc(i.x, -i.y, 3, 0, 2 * Math.PI, false);
         ctx.fill();
         //ctx.rotate( (Math.PI / 180) * 5 );
      }

      ctx.restore();
   }

   reset()
   {
      for (let i = 0; i < (360 / 5); i++)
         this.directions[i] = 1;
   }

   startHandleHover(e)
   {
      if (this.checkHandleHover(e).isHovering)
         ui.requestActiveCursor(cursors.radialDrag);
   }

   onMouseDown(e)
   {
      var hoverInfo = this.checkHandleHover(e);

      if (hoverInfo.isHovering)
      {
         this.drag.active = true;
         this.drag.handle = hoverInfo.handle;
      }
   }

   onMouseMove(e)
   {
      if (!this.drag.active)
      {
         if (!this.checkHandleHover(e).isHovering)
            ui.setActiveCursor(cursors.default);
      }
      else
      {
         var worldRelative = world.canvasToWorldCoords(e.offsetX, e.offsetY);
         var angle = Math.atan2(worldRelative.y, worldRelative.x);
         var magnitude = Math.sqrt(Math.pow(worldRelative.x, 2) + Math.pow(worldRelative.y, 2));

         if (angle < 0)
         {
            angle += Math.PI*2;
         }

         var component = this.computeMouseComponent(worldRelative, this.drag.handle);

         if (component < 0.1 * RadialControl.RADIUS_SCALE)
         {
            component = 0.1 * RadialControl.RADIUS_SCALE
         }
         else if (component > 3.0 * RadialControl.RADIUS_SCALE)
         {
            component = 3.0 * RadialControl.RADIUS_SCALE;
         }

         this.drag.handle.val = (component / RadialControl.RADIUS_SCALE) * 10;
         this.drag.handle.x = component * Math.cos(this.drag.handle.r);
         this.drag.handle.y = component * Math.sin(this.drag.handle.r);

         socket.emit('input', {type:'radialControl', state: this.drag.handle, id: clientId});
      }
   }

   onMouseUp(e)
   {
      if (this.drag.active)
      {
         this.drag.active = false;
         this.drag.handle = null;
      }
   }

   checkHandleHover(e)
   {
      // e is the event object, offsetX and offsetY is the canvas-relative cursor coords
      // (0, 0) it top-left
      for (let i of this.directions)
      {
         var worldRelative = world.canvasToWorldCoords(e.offsetX, e.offsetY);
         var box = {left: i.x - 5, top: i.y - 5, right: i.x + 5, bottom: i.y + 5};

         if (worldRelative.x >= box.left && worldRelative.x <= box.right && worldRelative.y >= box.top && worldRelative.y <= box.bottom)
         {
            return {isHovering: true, handle: i};
         }
      }

      return {isHovering: false, handle: null};
   }

   computeMouseComponent(mouseCoords, handle)
   {
      var handleVector = {x: Math.cos(handle.r), y: -Math.sin(handle.r)};
      var mouseMagnitude = Math.sqrt(Math.pow(mouseCoords.x, 2) + Math.pow(mouseCoords.y, 2));
      var mouseAngle = Math.atan2(mouseCoords.y, mouseCoords.x);

      var component = mouseMagnitude * Math.cos(mouseAngle - handle.r);

      return component;
   }
}*/


class SelectionBoxes
{
   constructor()
   {
      cursors.default.addEventListener('mousedown', function(e) { ui.clearSelectedAgents(); });
   }

   update()
   {
      // no-op
   }

   draw(ctx, debug = false)
   {
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

      cursors.default  .addEventListener('mousedown', this.onMouseDown.bind(this));
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

      ctx.fillStyle = "rgba(0,202,0,.5)";
      ctx.strokeStyle = "rgba(0, 0, 0,.7)";
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

  init(json)
  {
    //console.log(json);
    for (let name of json.states)
    {
      //console.log(name);
      this.states[name] = {count: 0, radius: 0};
      //console.log(this.states);

    }

    this.initialised = true;
  }

  update(json)
  {
    this.totalAgentsInStates = 100;
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

  restart()
  {
    this.states = {};
    this.totalAgentsInStates = 0;
    this.initialised = false;

    socket.emit("input", {"type": "requestStates"});
  }

  draw(ctx, debug = false)
  {
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
		this.deadBee = document.getElementById("deadBeeProgress");
		this.deadBee.value = 0;
	}

	update(data) {
		// var deadBee = document.getElementById("deadBeeProgress");
		//deadBee.value=0;
		//console.log(data)
		if (data.controller['dead'] != this.dead) {
			let deadBee = document.getElementById("deadBeeProgress");
			this.dead = data.controller['dead'];
			//console.log(this.deadBee)
			this.deadBee.value = this.dead
			//console.log(this.dead)
			//deadBee.value=this.dead;
			document.getElementById("deadBees").innerHTML = "Estimated Dead: " + this.dead.toString();
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
		console.log('ChatRoom initialized.');
	}

	update(data) {
		console.log('ChatRoom update called.');
		if (data !== this.chatHistory) {
			this.chatHistory = data;
			console.log(this.chatHistory);
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
         var label = $("<label></label>").text(`${param}`);
         label.append($('<input style="width:40%;">').val(val).attr('type','number').attr('name',`${param}`));
         label.append("<br>");
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

var canvas = document.getElementById('canvas');
style=window.getComputedStyle(canvas);
windowWidth=jQuery(window).width();
windowHeight=jQuery(window).height();
canvasHeight=style.getPropertyValue('height');
canvasWidth=style.getPropertyValue('width');
var menuBar = document.getElementById('menuBar');

//menuBar.style.top=toString(windowHeight-canvasHeight+100)

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
var showAgent = false;
var showDebug = false;
var showSlider = false;
var showAgentInfo = false;
var showChatWindow = false;

$("#debugIcon").click(function(){
  $('#debugArea').fadeToggle();
  if(showDebug){
    showDebug = false;
  }
  else{
    showDebug=true;
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
      console.log("Agent Off")
      debug = false;
      showAgent=false;
      $('#showAgents').attr('id',"dontShowAgents")
    }

});

var showMenus1 = false;
var showOptions1 = false;
var openSound = document.getElementById("audio0")

var closeSound = document.getElementById("audio1");

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
		//this.canvasElems.push(new StateBubbles(this));

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
		//console.log(event)
		if (!this.eventCallbacks[event]) {
			this.eventCallbacks[event] = [];
		}
		this.eventCallbacks[event].push(callback);
	}

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
		for (let element of this.canvasElems)
			element.draw(ctx, debug);
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
    this.x             =  agentJson.x;
    this.y             = -agentJson.y;
    this.rotation      =  Math.PI/2 - agentJson.direction; // convert from the engine's coordinate system into what the drawing routine expects
    this.state         =  agentJson.state;
    //console.log(this.state);
    this.potentialSite =  agentJson.potential_site;
    this.isAlive       =  agentJson.live;
    this.qVal          =  agentJson.qVal;
    Agent.stateColors  = {};
    this.lastLocations = [];
  }

  draw(ctx, debug = false, showAgentStates = false,hub)
  {

    if (!debug)
      return;


    ctx.save();
    //console.log(this.x)
    // move the drawing context to the agent's x and y coords
    ctx.translate(this.x, this.y);

    ctx.save();

    ctx.rotate(this.rotation);

    ctx.drawImage(bee, -bee.width/2, -bee.height/2);


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
  'observing'  :'rgba(  0,   0, 255, 0.25)', // Blue
  'assessing'  :'rgba(255, 255,   0, 0.25)', // Yellow
  'dancing'    :'rgba(  0, 255, 255, 0.25)', // Cyan
  'piping'     :'rgba(255,   0, 255, 0.25)', // Magenta
  'commit'     :'rgba(255,  96,   0, 0.25)',  // Orange
  'recruiting'  :'rgba(  0, 255,   0, 0.25)', // Green
  'waiting'  :'rgba(  0,   0, 255, 0.25)', // Blue
  'site assess':'rgba(255,   0,   0, 0.25)', // Red
  'searching'  :'rgba(255, 255,   0, 0.25)', // Yellow
  'following'    :'rgba(  0, 255, 255, 0.25)', // Cyan
  'exploiting'     :'rgba(255,   0, 255, 0.25)' // Magenta
}

class Attractor
{
  constructor(attractorJson)
  {
    this.x     = attractorJson.x;
    this.y     = attractorJson.y;
    this.timer = attractorJson.timer;
    this.radius= attractorJson.radius; //add a new property here -done
  }

  draw(ctx, debug = false) //then swap out hard coded radius for the dynamic
  //property you added above. Then consider working on adding user input for radius #done?
  {
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
    this.rotation      =  Math.PI/2 - agentJson.direction; // convert from the engine's coordinate system into what the drawing routine expects
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

    // move the drawing context to the agent's x and y coords
    ctx.translate(this.x, this.y);

    ctx.save();

    ctx.rotate(this.rotation);
    ctx.drawImage(beeDead, -bee.width/2, -bee.height/2);

    ctx.restore();

    ctx.restore();
  }
}

class Fog
{
  constructor(x,y,fogBlockSize)
  {
    this.fogBlockSize=fogBlockSize;

    this.visitObj;
    this.opacity=.95;
    this.color='rgb(255, 255, 255)';
    this.x =x;
    this.y=y;
    this.timeMax=100;
    this.time=0;
    this.view=2;
    this.inside=false;
    this.numberVisited=0;
    this.agentTime=new Map()
  }

  visited(agent){

  }

  checkAgent(agents,hub){
    for(var agent of agents)
    {
      //console.log(agent.x)
      if(agent.x > -world.x_limit+this.x - (fogBlockSize-1)*this.view &&
          agent.x < -world.x_limit+this.x+(fogBlockSize-1)*this.view &&
            agent.y > -world.y_limit+this.y - (fogBlockSize-1)*this.view &&
              agent.y < -world.y_limit+this.y+(fogBlockSize-1)*this.view)
      {
        if(!(Math.sqrt((hub.x - agent.x)*(hub.x - agent.x) +(hub.y - agent.y)*(hub.y - agent.y)) < hub.radius-5))
        {
          this.agentTime.set(agent.id.toString(),Date.now())
          agent.lastLocations.push(this)
        }

      }

    }
  }




  draw(ctx,id){
    ctx.fillStyle = this.color;
    // if(this.agentTime.get(id.toString()) != undefined){
    //   this.time = this.agentTime.get(id.toString());
    // }
    // //console.log(this.inside)
    // var start=this.time;
    // var end= Date.now()
    // this.opacity=(end-start)/10000

    ctx.globalAlpha=this.opacity
    ctx.fillRect(-world.x_limit+this.x, -world.y_limit+this.y, this.fogBlockSize, this.fogBlockSize);
    ctx.globalAlpha=1;
    this.opacity+=.001
    if(this.opacity >.95){
      this.opacity = .95
    }
  }
  // draw(agents)
  // {
  //   for(var agent of agents)
  //   {
  //     //console.log(agent.x)
  //     if(agent.x > -world.x_limit+this.x - (fogBlockSize-1)*this.view &&
  //         agent.x < -world.x_limit+this.x+(fogBlockSize-1)*this.view &&
  //           agent.y > -world.y_limit+this.y - (fogBlockSize-1)*this.view &&
  //             agent.y < -world.y_limit+this.y+(fogBlockSize-1)*this.view)
  //     {
  //       this.numberVisited+=.5;
  //       //console.log(this.numberVisited)
  //       this.time=0;
  //     }
  //   }
  //
  //   if(this.time<this.timeMax)
  //   {
  //     this.time++;
  //   }
  //
  //   var ctx = canvas.getContext("2d");
  //   ctx.fillStyle = this.color;
  //   if(this.numberVisited> 1){
  //     ctx.fillStyle = 'rgb(106, 99, 102)';
  //   }
  //
  //   ctx.globalAlpha=this.opacity*(this.time/this.timeMax);
  //   ctx.fillRect(-world.x_limit+this.x, -world.y_limit+this.y, this.fogBlockSize, this.fogBlockSize);
  //   //Resets the global Alpha for the rest of the draw
  //   ctx.globalAlpha=1;
  //   this.numberVisited+=-.1
  //
  // }





}

class Hub
{
  constructor(hubJson)
  {
    this.x      =  hubJson.hub["x"];
    this.y      = -hubJson.hub["y"];
    this.radius =  hubJson.hub["radius"];
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

    for(var agent of agents){
      if(Math.sqrt((this.x - agent.x)*(this.x - agent.x) +(this.y - agent.y)*(this.y - agent.y)) < this.radius-5){
        //console.log("here")
        //i is the agent id
        //2nd parameter creates a new array for that agent
        //3rd line copies agents last locations over to that new array
        this.paths[i][this.paths[i].length]=new Array()
        this.paths[i][this.paths[i].length] = agent.lastLocations.slice()
        agent.lastLocations.splice(0,agent.lastLocations.length)
      }
      i++;
    }

    // console.log("Paths Length: " + this.paths.length)
    // console.log("Paths at Index 0: " + this.paths[0].length)

    for(var agentPaths of this.paths){
      var i=0;
      for(var agentPath of agentPaths){
        var k=0;
        if(agentPath.length == 0){
          agentPaths.splice(i,1);
        }
        for(var path of agentPath){
          if(path.opacity<=0){
            agentPath.splice(k,1);
          }
          path.opacity=0
        }
        i++
      }
    }


    ctx.fillStyle = "rgba(242, 179, 19, 0.4)";
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

class Pheromone
{
  constructor(pheromonesJson)
  {
    this.pheromones = pheromonesJson;
  }

  draw(ctx, debug = false)
  {
    if (!debug || !this.pheromones || this.pheromones.length == 0)
        return;

    ctx.save();

    ctx.fillStyle = Pheromone.FILL_STYLE;

    for (let pheromone of this.pheromones)
    {
        ctx.fillRect(pheromone.x - 3, -pheromone.y - 3, 9, 9);
    }

    ctx.restore();
  }
}

Pheromone.FILL_STYLE = "rgba(255, 255, 0, 0.75)";

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
    this.y      = -siteJson["y"]; // drawing coordinates have down as positive y
    this.radius =  siteJson["radius"];
    this.q      =  siteJson["q_value"];
  }

  draw(ctx, debug = false)
  {
    if (!debug)
      return;

    var rVal = (this.q > 0.5) ? (1.0 - this.q) * 2 : 1.0;
    var gVal = (this.q > 0.5) ? 1.0 : this.q * 2;

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
      /*ctx.font = "14pt sans-serif";
      ctx.fillStyle = "rgb(0, 0, 0)";
      let width = ctx.measureText(`Site: ${this.q}`).width;
      ctx.fillText(`Site: ${this.q}`, -width/2, 20 + this.radius);*/
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
    if (this.state == "assessing"){
      x += /*2 * SwarmState.MAX_RADIUS +*/ SwarmState.BUBBLE_SPACING;
    }
    if (this.state == "commit"){
      x += /*3 * SwarmState.MAX_RADIUS + */ 2 * SwarmState.BUBBLE_SPACING;
    }

    ctx.fillStyle = "rgb(108, 163, 252)";
    ctx.beginPath();
    ctx.arc(x, 0, this.radius, 0, Math.PI * 2, false);
    //ctx.arc(100, 0, 50, 0, 2 * Math.PI);
    ctx.fill();

    ctx.font = "8pt sans-serif";
    ctx.fillStyle = "rgb(0, 0, 0)";
    let width = ctx.measureText(`${this.state}/${this.size}`).width;
    //let name1 = name[0].toUpperCase();
    ctx.fillText(`${this.state}/${this.size}`, x-width/2, SwarmState.LABEL_SPACING);

    x += this.radius + SwarmState.BUBBLE_SPACING;
    ctx.restore();
  }


}

SwarmState.MAX_RADIUS = 20;
SwarmState.MIN_RADIUS = 2;
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
    this.environment = environmentJson;
    this.test =true;
    this.time=1000;
    this.swarmState = [];
    //this.stateBubbles = new StateBubbles(this);
    //console.log(environmentJson);

    for (let site       of environmentJson.sites      ) { this.sites      .push( new Site      (site      ) ); }
    for (let obstacle   of environmentJson.obstacles  ) { this.obstacles  .push( new Obstacle  (obstacle  ) ); }
    for (let trap       of environmentJson.traps      ) { this.traps      .push( new Trap      (trap      ) ); }
    for (let rough      of environmentJson.rough      ) { this.rough      .push( new Rough     (rough     ) ); }
    for (let attractor  of environmentJson.attractors ) { this.attractors .push( new Attractor (attractor ) ); }
    for (let repulsor   of environmentJson.repulsors  ) { this.repulsors  .push( new Repulsor  (repulsor  ) ); }
    for (let agent      of environmentJson.agents     ) { this.agents     .push( new Agent     (agent     ) ); }
    for (let dead_agent of environmentJson.dead_agents) { this.dead_agents.push( new DeadAgent (dead_agent) ); }
    //for (var pheromone of environmentJson.pheromones)   { this.pheromones .push( new Pheromone (pheromone)  ); }
    this.swarmState.push(new SwarmState(JSON.parse('{"state": "exploring"}')));
    this.swarmState.push(new SwarmState(JSON.parse('{"state": "assessing"}')));
    this.swarmState.push(new SwarmState(JSON.parse('{"state": "commit"}')));
    this.pheromones = new Pheromone(environmentJson.pheromones);
  }

  canvasToWorldCoords(x, y)
  {
     return {x: (x - this.x_limit), y: -(y - this.y_limit)};
  }

  update(environment){
    //Update Sites (will be implemented with moving sites)
    // for(var i =0; i < this.sites.length;i++){
    //   this.sites[i].x= environment.sites[i].x
    //   this.sites[i].y= -environment.sites[i].y
    // }

    //console.log(environment.agents.length)


	  //Update Dead Agents
	  for (let i = 0; i < this.sites.length; i++) {
		  this.sites[i].x = environment.sites[i].x;
		  this.sites[i].y = -environment.sites[i]["y"];
	  }
	  for (let i = 0; i < this.dead_agents.length; i++) {

		  this.dead_agents[i].x = environment.dead_agents[i].x;
		  this.dead_agents[i].y = -environment.dead_agents[i].y;
	  }
	  //Update Alive Agents
	  for (let i = 0; i < this.agents.length - this.dead_agents.length; i++) {

		  this.agents[i].x = environment.agents[i].x;
		  this.agents[i].y = -environment.agents[i].y;
		  this.agents[i].rotation = Math.PI/2 - environment.agents[i].direction;
      this.agents[i].state = environment.agents[i].state;
	  }

  }
  // Draw the whole world recursively. Takes a 2dRenderingContext obj from
  // a canvas element
  draw(ctx, debug = false, showAgentStates = false, environment)
  {
    let sliderVal = document.getElementById('myRange').value;

    // Ok so this isn't really buying us all that much simplification at this level
    // right *now*, but the point is if in the future we ever need some sort of
    // this drawn singly at a world level, it could go right here very nicely.
    // ctx.shadowColor = 'rgba(51,51,51,.6)';
    // ctx.shadowOffsetX = sliderVal/10;
    // ctx.shadowBlur = 10;
    //path.draw(ctx,this.environment);

    for (let site       of this.sites      ) { site      .draw(ctx, debug); }
    for (let obstacle   of this.obstacles  ) { obstacle  .draw(ctx, debug); }
    for (let trap       of this.traps      ) { trap      .draw(ctx, debug); }
    for (let rough      of this.rough      ) { rough     .draw(ctx, debug); }
    for (let attractor  of this.attractors ) { attractor .draw(ctx, debug); }
    for (let repulsor   of this.repulsors  ) { repulsor  .draw(ctx, debug); }
    this.pheromones.draw(ctx, debug);
    this.hub.draw(ctx, debug, this.agents);

    for (let agent      of this.agents     ) { agent     .draw(ctx, debug, showAgentStates,this.hub); }
    for (let dead_agent of this.dead_agents) { dead_agent.draw(ctx, debug); }
    for (let fog        of fogBlock        ) { fog       .checkAgent(this.agents,this.hub); }
    //for (let fog        of fogBlock        ) { fog       .draw(ctx); }
    for (let state      of this.swarmState ) { state.draw(ctx, this.agents); }
  }
}

//*****************************************************************************
// Globals
//*****************************************************************************

// get a socket object from the socket.io script included above
var socket = io();
var world = null;
var clientId;

var debug           = false;
var showAgentStates = false;

// get a reference to the canvas element
var canvas = document.getElementById("canvas");

const cursors =
{
   default: new CursorDefault(),
   selecting: new CursorSelecting(),
   radialDrag: new CursorRadialDrag(),
   placeBaitBomb: new CursorPlaceBaitBomb()
};

const ui = new UI();

// get image refs
var bee      = document.getElementById("bee"     );
var beeDead  = document.getElementById("bee-dead");
var obstacle = document.getElementById("obstacle");

var finishedDrawing = true;


// In order to associate a client with a specific engine process,
// the server sends us a unique id to send back once socket.io has
// established a connection
socket.on('connect', function()
{
   var idx = document.cookie.indexOf("simId");
   var endIdx = document.cookie.indexOf(";", idx);

   if (endIdx == -1)
   {
      endIdx = undefined;
   }

   simId = document.cookie.slice(idx, endIdx).split("=").pop();

   socket.emit('simId', simId);
});

// This is where the magic happens. When we emit an "update" event from the
// server, it'll come through here.
socket.on('update', function(worldUpdate)
{
   // First update
   if (world === null)
   {
     //console.log("HERE!")
      world = new World(worldUpdate.data);
      canvas.setAttribute("width", world.width);
      canvas.setAttribute("height", world.height);



      // make sure the canvas doesn't get cut off on the screen
      document.getElementById("canvasDiv").style.width = world.width + "px";

      // move the coordinate system origin from top-left to the centre of the world
      canvas.getContext("2d").translate(world.x_limit, world.y_limit);

      // request that the browser call the draw() function when its ready for
      // the next animation frame
      window.requestAnimationFrame(draw);
      fogBlockSize= 10;
      fogBlock    = [];
      var fogX=0;
      var fogY=0;
      //console.log(((this.width/this.fogBlockSize)*(this.height/this.fogBlockSize)))
      for (var i=0; i<(world.height/fogBlockSize);i++)
      {
        for(var j=0;j<(world.width/fogBlockSize);j++)
        {

            fogBlock.push(new Fog(fogX,fogY,fogBlockSize));

          fogX+=fogBlockSize;
        }
        fogX=0;
        fogY+=fogBlockSize;
      }
      //console.log(fogBlock)
   }
   else if (finishedDrawing)
   {
      world.update(worldUpdate.data) //= new World(worldUpdate.data); //try implementing an array and stack
      //you'd push worldupdate.data into array, and then pop it off the stack when you need it
      // "need it" means you've finished a draw cycle, which is happening in browser
      // if you want to keep everything in draw function like it is, make the array and stack
      // if you want to split it up you need to move the world.draw function into this function
      //the idea is to draw the world only when we're ready for it
      //read through socket documentation, maybe there are options that say
      //"don't register every single callback" or something


      // TODO: split this out into a separate update? worldMeta?
      //ui.RadialControl.updateActual(world.hub.directions);
   }

   ui.on(worldUpdate);
});
var ctx;

function draw(environment)
{
   var sliderVal=document.getElementById('myRange').value;
   finishedDrawing = false;
   // we draw to the 2d context, not the canvas directly
   ctx = canvas.getContext("2d");
   var image = document.getElementById('source');
   //console.log(image)
   // clear everything
   ctx.clearRect(-world.x_limit, -world.y_limit, world.width, world.height);
   ctx.save();
   ctx.fillStyle = "rgb(100, 100, 100)";
   ctx.fillRect(-world.x_limit, -world.y_limit, world.width, world.height);

   ctx.globalAlpha = sliderVal/100;
   //ctx.drawImage(image, -world.x_limit, -world.y_limit,world.width, world.height);
   ctx.globalAlpha = 1;

   ctx.restore();

   world.draw(ctx, debug, showAgentStates, environment); // move to update path rather than 1/60
   ui.draw(ctx, debug);

   finishedDrawing = true;

   // maintain a maximum rate of 60fps

   window.setTimeout(() => { window.requestAnimationFrame(draw)}, 1000 / 100);
   //window.requestAnimationFrame(draw);
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
