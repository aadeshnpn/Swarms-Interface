class BaitBombGhost
{
  constructor()
  {
    cursors.placeBaitBomb.addEventListener('mousemove', this.onMouseMove.bind(this));
    cursors.placeBaitBomb.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.cursorCoords = {x: null, y: null};
    this.active = false;
  }

  update()
  {
     // no-op
  }

  draw(ctx, debug = false)
  {
    if (!this.active)
      return;

    var fill, stroke, radius;

    if (cursors.placeBaitBomb.mode == CursorPlaceBaitBomb.MODE_BAIT)
    {
      fill   = Attractor.FILL_STYLE;
      stroke = Attractor.STROKE_STYLE;
      radius = Attractor.RADIUS;
    }
    else
    {
      fill   = Repulsor.FILL_STYLE;
      stroke = Repulsor.STROKE_STYLE;
      radius = Repulsor.RADIUS;
    }

    ctx.save();

    ctx.globalAlpha = 0.2;
    ctx.translate(this.cursorCoords.x, -this.cursorCoords.y);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2, false);
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

  onMouseDown(e)
  {
    let worldRelative = world.canvasToWorldCoords(e.offsetX, e.offsetY);
    var entityType = (cursors.placeBaitBomb.mode == CursorPlaceBaitBomb.MODE_BAIT) ? 'attractor' : 'repulsor';
    socket.emit('input', {type: entityType, x: worldRelative.x, y: worldRelative.y});
    this.active = false;
    ui.setActiveCursor(cursors.default);
  }
}
