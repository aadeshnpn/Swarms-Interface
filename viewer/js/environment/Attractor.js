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
    ctx.arc(0, 0, Attractor.RADIUS, 0, Math.PI * 2, false);
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
