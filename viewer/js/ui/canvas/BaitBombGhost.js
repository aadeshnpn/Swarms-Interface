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
