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
