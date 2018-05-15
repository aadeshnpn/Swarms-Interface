var canvas;
var ctx;
var agents=[];
var background;
var width;
var height;
var simName="Sim Name";
var worldType="Static"
var scenType
var agentType="Drone Agent"
var toggleState=new Map()
var hub={x:null,y:null}
var clicked=false
var points=[]
var drawSize=40
var variance=Math.floor(Math.random()*10)
var baits=[]
var bombs=[]
var sites=[]
var coords=[]
var selectedCoords=new Map()
var offset;
var deleting=false
var id=0
var start=false;
var overCanvas=false
var currentSelectMode=0
var selectModes=["Patrol","Avoid"]
toggleState.set("debug", false)
toggleState.set("baitPanel", false)
toggleState.set("bombPanel", false)
toggleState.set("hubController", false)
toggleState.set("randomWorld",false)
var drawPoints;
var cursor={x:undefined,y:undefined}

$(document).ready(() =>{
  document.addEventListener('contextmenu', event => event.preventDefault());
  document.getElementById("canvasDiv").addEventListener("dblclick", function(e){
    for(let coord of coords){
      coord.selected=false
      coord.timer=coord.maxTimer
    }

  })

  begin()
  function begin(){
    canvas = document.getElementById("canvas");

    ctx = canvas.getContext("2d")
    resizeCanvas();
    for(let x=0;x<width+40;x+=50){
      for(let y=0;y<height+40;y+=30){
        coords.push(new Coord(x,y,id))
        id++
      }
    }

    for(let x=25;x<width+40;x+=50){
      for(let y=15;y<height+40;y+=30){
        coords.push(new Coord(x,y,id))
        id++
      }
    }
    background =document.getElementById("background");
    let num =$("#agentNumber").val()
    for(var i=0;i<num;i++){
      let spacer=20
      let maxWidth=width-20;
      let minWidth=20;
      let maxHeight=height-spacer;
      let minHeight=spacer;
      let x=Math.random()*(maxWidth-minWidth)+minWidth
      let y=Math.random()*(maxHeight-minHeight)+minHeight
      let r=Math.random()*(360)


      agents.push(new Agent(x,y,r))
    }

    variance=Math.floor(Math.random()*9)
    i =0;
    let siteNumbers=$("#siteNumber").val()
    for(let i=0;i<siteNumbers;i++){
      let x=Math.random()*((width/2+600))+(width/2-600)
      let y=Math.random()*((height/2+600))+(height/2-600)
      sites.push(new Site(x,y))

    }
    while(i<5){
      var color="rgb(217,"+Math.floor(Math.random()*(217)+(67)).toString()+",67)"

      baits.push({x:Math.random()*((width/2+600))+(width/2-600),y:Math.random()*((height/2+600))+(height/2-600),r:Math.random()*50+30})
      bombs.push({x:Math.random()*((width/2+600))+(width/2-600),y:Math.random()*((height/2+600))+(height/2-600),r:Math.random()*50+30})
      i++
    }
  }
  // console.log($( "#scenarioType" ));

  window.requestAnimationFrame(draw)
});


function draw(){

  resizeCanvas()
  ctx.fillStyle="rgb(160, 160, 160)"
  ctx.fillRect(0,0,width,height)
  ctx.globalAlpha=.5
  if(agentType=="Drone Agent"){
    ctx.fillStyle="white"
    ctx.fillRect(0,0,width,height)
    ctx.drawImage(background,0,0,width,height);
  }
  ctx.globalAlpha=1
  drawCursurCircle()
  drawHub()
  drawBaitBomb()
  drawSites()
  drawingPoints(ctx)
  drawCoords()

  $("#title").text(simName +" -- "+agentType)
  for(var agent of agents){

    agent.draw(ctx)
    // agent.rotation+=205
  }
  // drawingPoints(ctx)
  window.requestAnimationFrame(draw)
}

function drawCursurCircle(){
  // console.log(currentSelectMode);
  if(!clicked && start) return
  ctx.beginPath()
  ctx.lineWidth=3
  ctx.arc(cursor.x,cursor.y, drawSize, 0, 2 * Math.PI);
  // console.log(Coord.stateStyles);
  ctx.strokeStyle=Object.entries(Coord.stateStyles)[currentSelectMode][1];

  ctx.stroke();
  ctx.lineWidth=1
}

function drawCoords(){
  for(let coord of coords){
    coord.selecting(points,currentSelectMode)
    if(coord.selected){
      selectedCoords.set(coord.id,{x:coord.x,y:coord.y,mode:coord.selectMode})
      coord.draw(ctx)

    }
    else if(selectedCoords.has(coord.id)){
      selectedCoords.delete(coord.id)
    }
  }
}

function drawingPoints(ctx){

  for(let point of points){
      // point.draw(ctx)
  }

}
function drawHub(){

  //Outer Rim
  ctx.beginPath()
  ctx.arc(hub.x,hub.y,60,0,2*Math.PI)
  ctx.strokeStyle="green"
  ctx.lineWidth=2
  ctx.stroke()
  //Inner Circle
  ctx.beginPath()
  ctx.strokeStyle="rgb(214, 170, 14)"
  ctx.fillStyle="rgb(214, 170, 14)"
  ctx.arc(hub.x,hub.y,20,0,2*Math.PI)
  ctx.globalAlpha=.5
  ctx.fill()
  ctx.globalAlpha=1
  ctx.stroke()
  drawHubController()
}
function drawHubController(){
  for(var i=1;i<=44;i++){
    let prevR=19
    let futureR=25
    let r=360-i
    let radius=.5

    //Outer Point position
    var pos={x:Math.cos(r)*60+hub.x,y:Math.sin(r)*60+hub.y}
    //Previous points location
    let pPos={x:Math.cos(r-prevR)*40+hub.x,y:Math.sin(r-prevR)*40+hub.y}
    let fPos={x:Math.cos(r-prevR)*40+hub.x,y:Math.sin(r-prevR)*40+hub.y}

    let futureX=Math.cos(r-futureR)*40+hub.x
    let futureY=Math.sin(r-futureR)*40+hub.y
    ctx.fillStyle="blue"
    ctx.strokeStyle="blue"

    if(r%10==variance &&toggleState.get("hubController")){
      ctx.beginPath()
      Math.random()*170+110
      pos.x=Math.cos(r)*110+hub.x
      pos.y=Math.sin(r)*110+hub.y

      radius=1
      pPos.x=Math.cos(r-prevR)*60+hub.x
      pPos.y=Math.sin(r-prevR)*60+hub.y

      fPos.x=Math.cos(r-futureR)*60+hub.x
      fPos.y=Math.sin(r-futureR)*60+hub.y

      ctx.lineWidth=2
      ctx.setLineDash([3,3])
      ctx.moveTo(pPos.x,pPos.y)
      ctx.lineTo(pos.x,pos.y);
      ctx.moveTo(pos.x,pos.y)
      ctx.lineTo(fPos.x,fPos.y);
      ctx.moveTo(fPos.x,fPos.y)
      ctx.strokeStyle="rgb(255, 0, 0)"
      ctx.stroke()
      ctx.fillStyle="red"
      ctx.strokeStyle="red"
    }
    ctx.beginPath()
    ctx.arc(pos.x,pos.y,radius,0,2*Math.PI)

    ctx.lineWidth=3
    ctx.fill()
    ctx.stroke()
    ctx.setLineDash([0,0])
  }

}
function drawBaitBomb(){

  if(toggleState.get("baitPanel")){
    for(bait of baits){
      ctx.beginPath()
      ctx.arc(bait.x,bait.y,bait.r,0,2*Math.PI)
      ctx.globalAlpha=.5

      ctx.fillStyle="rgb(0, 255, 18)"
      ctx.strokeStyle="rgb(0, 255, 18)"
      ctx.fill()
      ctx.globalAlpha=1
      ctx.lineWidth=1
      ctx.stroke()
    }

  }
  if(toggleState.get("bombPanel")){
    for(bomb of bombs){
      ctx.beginPath()
      ctx.arc(bomb.x,bomb.y,bomb.r,0,2*Math.PI)
      ctx.globalAlpha=.5
      ctx.fillStyle="rgb(255,0 , 18)"
      ctx.strokeStyle="rgb(255,0 , 18)"
      ctx.fill()
      ctx.globalAlpha=1
      ctx.lineWidth=1
      ctx.stroke()
    }
  }
}
function drawSites(){
  for(site of sites){
    site.draw(ctx);
  }
}
function resizeCanvas(){
  var sideWidth=$("#sidePanels").css("width").split("px")[0];
  var topHeight=$("#header").css("height").split("px")[0]
  var windowWidth=$(window).width()
  var windowHeight=$(window).height()
  var newWidth=windowWidth-sideWidth
  var newHeight=windowHeight-topHeight

  canvas.width=newWidth
  canvas.height=newHeight
  width=canvas.width
  height=canvas.height
  hub.x=width/2
  hub.y=height/2;
  for(let agent of agents){
    let agentX =agent.percentageX *width
    let agentY = agent.percentageY *height
    let agentR=width/50
    // console.log(agentR + " calculated r")
    agent.x=agentX
    agent.y=agentY
    agent.r=agentR

  }
  for(let site of sites){
    let siteX =site.percentageX *width
    let siteY = site.percentageY *height

    // console.log(agentR + " calculated r")
    site.x=siteX
    site.y=siteY


  }

}

$(document).keydown(function(e){
  // console.log(e.which);
  if(overCanvas){
    if(e.which==65 ||e.which==37 ){
      currentSelectMode--;
      if(currentSelectMode<0){
        currentSelectMode=selectModes.length-1
      }
      $( "#selectType" ).html(selectModes[currentSelectMode])
      $( "#selectType" ).css("color",Object.entries(Coord.stateStyles)[currentSelectMode][1])
    }else if(e.which==68 ||e.which==39 ){
      currentSelectMode++;
      if(currentSelectMode>selectModes.length-1){
        currentSelectMode=0
      }
      $( "#selectType" ).html(selectModes[currentSelectMode])
      $( "#selectType" ).css("color",Object.entries(Coord.stateStyles)[currentSelectMode][1])


    }
  }


})

$( "#scenarioType" ).change(function(){
    scenType = $("#scenarioType").val()

});

$( ".panel" ).mouseover(function(e){
    //console.log(e.target.id)
    loc=e.target.id
    panel = loc.substr(loc.length-5)
    if(panel =="Panel" ||panel =="panel" ){
      name=loc.substr(0,loc.length-5)
      // console.log(name);
      tooltip=name+"ToolTip"
      //$("#"+tooltip).toggle("slide")
    }


});

$("#canvasDiv").mousedown(function(e){
  if(e.button==0 && !start){
      clicked=true
      if(canvas!=undefined){
         rect=canvas.getBoundingClientRect()

      }

      let x= e.clientX - rect.left
      let y= e.clientY - rect.top
      cursor.x=x;
      cursor.y=y
      points.push(new Point(x,y,null,drawSize))

    }
  if(e.button==2){
    deleting=true;
    for(let coord of coords){

        var dx = cursor.x - coord.x ;
        var dy = cursor.y - coord.y ;
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < drawSize+5) {
          coord.selected=false;


        }

    }
  }

})
$("#canvasDiv").on("mousewheel",function(e){
  // console.log(e.originalEvent);
  // console.log();
  // console.log((e.originalEvent.deltaY/53)*2);
  // if(e.originaslEvent.deltaY>0){
    // drawSize+=(e.originalEvent.deltaY/53)*2;
  // }
  // if(drawSize >=10){
    drawSize-=(e.originalEvent.deltaY/53)*4
  // }else{
  if(drawSize<10){
    drawSize=10
  }
  // }

})

$("#canvasDiv").mouseover(function(e){
  overCanvas=true
})
$("#canvasDiv").mouseout(function(e){
  overCanvas=false
})
$("#canvasDiv").mouseup(function(e){
  deleting=false
  clicked=false
  points=[]
})

$( "#startSim" ).on( "mouseover", function( e ) {
  // console.log("OVER START");
  start=true;
})
$( "#startSim" ).on( "mouseout", function( e ) {
  // console.log("NOT OVER START");
  start=false;
})

$( "#canvasDiv" ).on( "mousemove", function( e ) {
  // console.log("Over Canvas");
  // console.log(e.target.style)
  let rect={x:null,y:null}
  if(canvas!=undefined){
     rect=canvas.getBoundingClientRect()

  }

  let x= e.clientX - rect.left
  let y= e.clientY - rect.top
  cursor.x=x;
  cursor.y=y
  if(clicked){
      points.push(new Point(x,y,null,drawSize))
  }
  if(deleting){
    for(let coord of coords){

        var dx = cursor.x - coord.x ;
        var dy = cursor.y - coord.y ;
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < drawSize+5) {
          coord.selected=false;


        }

    }
  }
});

$( "#agentNumber" ).change(function() {
  let num =$("#agentNumber").val()


  if(num > agents.length){
    for(var i=0;i<=num-agents.length;i++){
      let x=Math.random()*width
      let y=Math.random()*height
      let r=Math.random()*(2*Math.PI)
      agents.push(new Agent(x,y,r))
    }
  }else if(num < agents.length){
    agents.splice(0,agents.length-num)
  }
});

$( "#siteNumber" ).change(function() {
  let siteNumbers =$("#siteNumber").val()


  if(siteNumbers > sites.length){
    for(var i=0;i<=siteNumbers-sites.length;i++){
      let x=Math.random()*width
      let y=Math.random()*height
      sites.push(new Site(x,y))
    }
  }else if(siteNumbers < sites.length){
    sites.splice(0,agents.length-siteNumbers)
  }
});

$(".worldTypes").click(function(e){
   worldType=$(event.target).attr('name')
   if(worldType=="Static"){
     toggleState.set("randomWorld", false)
     hub.x=width/2
     hub.y=height/2

   }else{
     toggleState.set("randomWorld", true)
       hub.x=Math.random()*((width/2+400))+(width/2-400)
       hub.y=Math.random()*((height/2+200))+(height/2-200)
   }
 });
$("#simNamePanel").change(function(e){
  simName=e.target.value;
  // console.log(simName);
})
$(".agentTypes").click(function(e){
  agentType=$(event.target).attr('name') +" Agent"
  var agentPic;
  if($(event.target).attr('name') =="Uav"){
    agentPic=document.getElementById("Drone")
  }
  else{
    agentPic=document.getElementById($(event.target).attr('name'))
  }
  for(agent of agents){
    agent.image=agentPic;
  }
})
$(".switch").click(function(e){

  if(e.target.type == "checkbox"){

    if ($('#'+e.target.id).is(':checked')) {
      toggleState.set(e.target.id, true)
    }else{
      toggleState.set(e.target.id, false)
    }

  }

})

$("#logo").click(function(){
    window.location.replace("http://localhost:3000");

})
function selectedCoordsToJson(){
  var selected={windowSize:{w:width,h:height},loc:[]}
  for(let [id,loc] of selectedCoords){
    selected.loc.push({x:loc.x,y:loc.y,mode:loc.mode})
  }
  // console.log(selected);
  return   (selected);

}

function toJson(){
  var selected=[]
  for(let [id,loc] of selectedCoords){
    selected.push(loc.x)
    selected.push(loc.y)
    selected.push(loc.mode)
  }
  console.log(selected);
  // console.log(selected);
  return   (selected);


}

$("#startSim").click(function(){
  var siteNumber=$("#siteNumber").val()

  //  var e = document.getElementById("#scenarioType")
  //  scenType = e.options[e.selectedIndex].value
  scenType = $("#scenarioType").val()
  var name = simName
  if(name= "Sim Name"){
    name=""
  }
  // selectedCoordsToJson()
  // selectedCoordsToJson()
  // console.log(selectedCoordsToJson().length);
  var simInfo={
                name:name,
                agentNum:agentNumber.value,
                siteNum:siteNumber,
                scenarioType:scenType,
                model:agentType.split(" ")[0],
                worldType:worldType,
                patrolLocations:selectedCoordsToJson(),
                createWorldSize:[width,height],
                patrolLocations1:toJson(),
                hubController:toggleState.get("hubController"),
                bait:toggleState.get("baitPanel"),
                bomb:toggleState.get("bombPanel"),
              }

    $.post("/sims/", simInfo, function(res) {
      // console.log(res);

      window.location.replace("http://localhost:3000"+res);
    });

})
