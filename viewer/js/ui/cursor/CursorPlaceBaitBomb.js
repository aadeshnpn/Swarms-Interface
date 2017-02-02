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
