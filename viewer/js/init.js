//*****************************************************************************
// Globals
//*****************************************************************************

// get a socket object from the socket.io script included above
var socket = io();
var world = null;
var clientId;

var debug           = true;
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
      world = new World(worldUpdate.data); //try implementing an array and stack
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


function draw()
{
   //console.log(window.screen.width)
   //console.log(window.screen.height)

   var sliderVal=document.getElementById('myRange').value;
   //console.log(sliderVal)
   //console.log(sliderVal)
   finishedDrawing = false;
   // we draw to the 2d context, not the canvas directly
   var ctx = canvas.getContext("2d");
   var image = document.getElementById('source');
   //console.log(image)
   // clear everything
   ctx.clearRect(-world.x_limit, -world.y_limit, world.width, world.height);
   ctx.save();


    ctx.fillStyle = "rgb(100, 100, 100)";
    ctx.fillRect(-world.x_limit, -world.y_limit, world.width, world.height);
   //Draw the background image
   ctx.globalAlpha = sliderVal/100;
   ctx.drawImage(image, -world.x_limit, -world.y_limit,world.width, world.height)
   ctx.globalAlpha = 1;



   ctx.restore();

   world.draw(ctx, debug, showAgentStates); // move to update path rather than 1/60
   ui.draw(ctx, debug);

   finishedDrawing = true;

   // maintain a maximum rate of 60fps
   window.setTimeout(() => { window.requestAnimationFrame(draw)}, 1000 / 60);
   //window.requestAnimationFrame(draw);
}

// TODO: I don't like where this is going, I should be able to make one subscription
//       to the socket and let the UI class sort out all the details

socket.on('updateMission', function(data)
{
  ui.on(data);
});
socket.on('baitToggle', function(data){
  document.getElementById('buttonBugBait').style.display = 'block';
});
socket.on('bombToggle', function(data){
  document.getElementById('buttonBugBomb').style.display = 'block';
});
socket.on('hubControllerToggle' , function(data) { ui.on(data) });

socket.on('restart'             , function(data) { ui.on(data) });
socket.on('updateRadial'        , function(data) { ui.on(data) });
socket.on('updateDebugParams'   , function(data) { ui.on(data) });
socket.on('updateUIParams'      , function(data) { ui.on(data) });
socket.on('updateSitePriorities', function(data) { ui.on(data) });
socket.on('setStates'           , function(data) { ui.on(data) });
socket.on('stateCounts'         , function(data) { ui.on(data) });

socket.on('updateChat'          , function(data) { ui.on(data) });
