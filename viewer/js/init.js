//*****************************************************************************
// Globals
//*****************************************************************************

// get a socket object from the socket.io script included above
var socket = io();
var world = null;
var clientId;
var localInfo = new Message()
var scenarios=0;
var scenarioType;

// var tasks = new Task()

//These are for the pre-planning and live-planning methods of selecting areas of the canvas
var currentSelectMode=0
var selectModes=["Patrol","Avoid"]
var selectedArea=[]

var selectedCoords= {}
// Gets the previous screens pre-planning
var patrolLocations;
var userStudy       = false;
var deleteAll       = false;
var deletingSelect  = false;
var debug           = false;
var showAgentStates = false;

// Background image
var background = document.getElementById('source');
var sliderVal =document.getElementById('myRange').value;
// var date=new Date()


document.addEventListener('contextmenu', event => event.preventDefault());
// get a reference to the canvas element
var canvas = document.getElementById("canvas");

const cursors ={
                 default: new CursorDefault(),
                 selecting: new CursorSelecting(),
                 radialDrag: new CursorRadialDrag(),
                 placeBaitBomb: new CursorPlaceBaitBomb()
               };

var stateInfoOn=new Map()
stateInfoOn.set("Exploring", false)
stateInfoOn.set("Observing", false)
stateInfoOn.set("Following Site", false)
var defaultStateDescript="<p id='defaultStateDescript'>Info on the different states of the Agents</p>"

$("#agentStateDescriptionDiv").append(`<table id="statesInfo"><caption id="stateTitle">States</caption>
                                        <tr>
                                        <th class="statesHeader">Exploring</th>
                                        <th class="statesHeader">Observing</th>
                                        <th class="statesHeader">Following Site</th>
                                        </tr>
                                        </table>
                                        <div id="statesInfoTextDiv">
                                        <p id="statesInfoText">`+defaultStateDescript+`</p>
                                        </div>`)

var connection;
var paused=true;

// Get Image references and other presets

var bee = document.getElementById("drone");
var beeDead;
var obstacle;
var simType;
socket.on('simType', function(type){
  simType=type;

  if(type=="Drone"){
    bee      = document.getElementById("drone"     );

    beeDead  = document.getElementById("drone-dead");
  }
  else if(type=="Bee"){
    bee      = document.getElementById("bee"     );
    beeDead  = document.getElementById("bee-dead");
  }
  else if(type=="Ant"){
    bee      = document.getElementById("ant"     );
    beeDead  = document.getElementById("ant-dead");
  }
  else if(type=="Uav"){
    bee      = document.getElementById("drone"     );
    beeDead  = document.getElementById("drone-dead");
  }
   obstacle = document.getElementById("obstacle");

});


var finishedDrawing = false;
var ui = new UI();
var mouse = new Mouse();

var ctx;
var simId;
// console.log(tasks.avoid);




// socket.on("connectionType",function(type){
//   console.log("HEFRERERARFD");
//   console.log(type);
// })


// This is where the magic happens. When we emit an "update" event from the
// server, it'll come through here.
socket.on('update', function(worldUpdate){
   // New World
  //  console.log("HERE");
   if (world === null){
      world = new World(worldUpdate.data);


      // console.table(world.agents)
      canvas.setAttribute("width", world.width);
      canvas.setAttribute("height", world.height);
      socket.emit("canvasSize",{width:world.width,height:world.height})
      // console.log("HERE");
      console.log(paused);
      if(simType ==="Drone" && paused){
        socket.emit('input', {type: 'pause'})
        isPaused=true;
        localInfo.draw({width:world.width,height:world.height})
      }

      // Resizes the canvas to the size determined in the Python code
      document.getElementById("canvasDiv").style.width = world.width + "px";

      ctx = canvas.getContext("2d");
      // Translate the origin from the top left corner to the center of the screen.
      // Keep in mind that the canvas's y increases going down, whereas, the world's y
      // increases going up. To overcome this, there is a function in World called canvasToWorldCoords
      // that will convert any x-y coridinate to the world's coridinates
      ctx.translate(world.x_limit, world.y_limit);

      //Start the drawing cycle

      draw()
   }
   else if (finishedDrawing){
      world.update(worldUpdate.data)

      ui.on(worldUpdate);
   }
});

function draw(environment){

  // console.log("HERE");
  //The updates will not be let through unless the the current iteration of drawing is finished
  finishedDrawing = false;
  // clear canvas
  ctx.clearRect(-world.x_limit, -world.y_limit, world.width, world.height);
  ctx.save();
  ctx.fillStyle = "rgb(160, 160, 160)";
  ctx.fillRect(-world.x_limit, -world.y_limit, world.width, world.height);


  if(simType == "Drone"){
    ctx.globalAlpha = sliderVal/100;
    ctx.drawImage(background, -world.x_limit, -world.y_limit,world.width, world.height);
    ctx.globalAlpha = 1;
  }

  world.draw(ctx, debug, showAgentStates, environment);

  ui.draw(ctx, debug);
  //Updates will not be allowed
  finishedDrawing = true;
  mouse.deltaY=0;
  mouse.deltaX=0;
  // console.log(mouse);


  // if(!isPaused){
    window.requestAnimationFrame(draw);

  // }

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
