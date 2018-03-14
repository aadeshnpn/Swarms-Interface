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
var hubX
var hubY
var variance=Math.floor(Math.random()*10)
var baits=[]
var bombs=[]
var sites=[]
toggleState.set("debug", false)
toggleState.set("baitPanel", false)
toggleState.set("bombPanel", false)
toggleState.set("hubController", false)
toggleState.set("randomWorld",false)

$(document).ready(() =>{
  begin()
  function begin(){
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d")
    resizeCanvas();

    background =document.getElementById("background");
    let num =$("#agentNumber").val()
    for(var i=0;i<num;i++){
      let x=Math.random()*width
      let y=Math.random()*height
      let r=Math.random()*(2*Math.PI)
      let rad=35/width

      agents.push(new Agent(x,y,r,rad))
    }

    variance=Math.floor(Math.random()*9)
    i =0;
    while(i<5){
      var color="rgb(217,"+Math.floor(Math.random()*(217)+(67)).toString()+",67)"

      baits.push({x:Math.random()*((width/2+600))+(width/2-600),y:Math.random()*((height/2+600))+(height/2-600),r:Math.random()*50+30})
      bombs.push({x:Math.random()*((width/2+600))+(width/2-600),y:Math.random()*((height/2+600))+(height/2-600),r:Math.random()*50+30})
      sites.push({x:Math.random()*((width/2+600))+(width/2-600),y:Math.random()*((height/2+600))+(height/2-600),r:5,color:color})
      i++
    }
  }


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
    drawHub()
    drawBaitBomb()
    drawSites()


    $("#title").text(simName +" -- "+agentType)
    for(var agent of agents){

      agent.draw(ctx)
    }
    window.requestAnimationFrame(draw)
  }
  function drawHub(){

    //Outer Rim
    ctx.beginPath()
    ctx.arc(hubX,hubY,60,0,2*Math.PI)
    ctx.strokeStyle="green"
    ctx.lineWidth=2
    ctx.stroke()
    //Inner Circle
    ctx.beginPath()
    ctx.strokeStyle="rgb(214, 170, 14)"
    ctx.fillStyle="rgb(214, 170, 14)"
    ctx.arc(hubX,hubY,20,0,2*Math.PI)
    ctx.globalAlpha=.5
    ctx.fill()
    ctx.globalAlpha=1
    ctx.stroke()

    for(var i=1;i<=44;i++){
      let prevR=19
      let futureR=25
      let r=360-i
      let radius=.5
      var x=Math.cos(r)*60+hubX
      var y=Math.sin(r)*60+hubY
      let prevX=Math.cos(r-prevR)*40+hubX
      let prevY=Math.sin(r-prevR)*40+hubY
      let futureX=Math.cos(r-futureR)*40+hubX
      let futureY=Math.sin(r-futureR)*40+hubY
      ctx.fillStyle="blue"
      ctx.strokeStyle="blue"

      if(r%10==variance &&toggleState.get("hubController")){
        ctx.beginPath()
        Math.random()*170+110
        x=Math.cos(r)*110+hubX
        y=Math.sin(r)*110+hubY
        radius=1
        prevX=Math.cos(r-prevR)*60+hubX
        prevY=Math.sin(r-prevR)*60+hubY
        futureX=Math.cos(r-futureR)*60+hubX
        futureY=Math.sin(r-futureR)*60+hubY
        ctx.lineWidth=2
        ctx.setLineDash([3,3])
        ctx.moveTo(prevX,prevY)
        ctx.lineTo(x,y);
        ctx.moveTo(x,y)
        ctx.lineTo(futureX,futureY);
        ctx.moveTo(futureX,futureY)
        ctx.strokeStyle="rgb(255, 0, 0)"
        ctx.stroke()
        ctx.fillStyle="red"
        ctx.strokeStyle="red"
      }
      ctx.beginPath()
      ctx.arc(x,y,radius,0,2*Math.PI)

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
      ctx.beginPath()
      ctx.fillStyle=site.color
      ctx.strokeStyle="black"
      ctx.arc(site.x,site.y,site.r,0,2*Math.PI)
      ctx.fill()
      ctx.lineWidth=1
      ctx.stroke()
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
    hubX=width/2
    hubY=height/2;
    for(var agent of agents){
      let agentX =agent.percentageX *width
      let agentY = agent.percentageY *height
      let agentR=width/50
      // console.log(agentR + " calculated r")
      agent.x=agentX
      agent.y=agentY
      agent.r=agentR

    }

  }
  window.requestAnimationFrame(draw)
});

$( "#scenarioType" ).change(function(){
    scenType = $("#scenarioType").val()

});

$( ".panel" ).mouseover(function(e){
    //console.log(e.target.id)
    loc=e.target.id
    panel = loc.substr(loc.length-5)
    if(panel =="Panel" ||panel =="panel" ){
      name=loc.substr(0,loc.length-5)
      console.log(name);
      tooltip=name+"ToolTip"
      //$("#"+tooltip).toggle("slide")
    }


});

$( "#agentNumber" ).change(function() {
  let num =$("#agentNumber").val()


  if(num > agents.length){
    for(var i=0;i<num-agents.length;i++){
      let x=Math.random()*width
      let y=Math.random()*height
      let r=Math.random()*(2*Math.PI)
      agents.push(new Agent(x,y,r))
    }
  }else if(num < agents.length){
    agents.splice(0,agents.length-num)
  }
});
$(".worldTypes").click(function(e){
   worldType=$(event.target).attr('name')
   if(worldType=="Static"){
     toggleState.set("randomWorld", false)
     hubX=width/2
     hubY=height/2

   }else{
     toggleState.set("randomWorld", true)
       hubX=Math.random()*((width/2+400))+(width/2-400)
       hubY=Math.random()*((height/2+200))+(height/2-200)
   }
 });
$("#simName").change(function(e){
  simName=e.target.value;
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
$("#startSim").click(function(){
  var siteNumber=$("#siteNumber").val()

//  var e = document.getElementById("#scenarioType")
//  scenType = e.options[e.selectedIndex].value
scenType = $("#scenarioType").val()
  var name = simName
  if(name= "Sim Name"){
    name=""
  }
  var simInfo={
                name:name,
                agentNum:agentNumber.value,
                siteNum:siteNumber,
                scenarioType:scenType,
                model:agentType.split(" ")[0],
                worldType:worldType,
                hubController:toggleState.get("hubController"),
                bait:toggleState.get("baitPanel"),
                bomb:toggleState.get("bombPanel"),
              }


    $.post("/sims/", simInfo, function(res) {
      console.log(res);
      window.location.replace("http://localhost:3000"+res);
    });

})

class Agent{
  constructor(x,y,rot,rad){
    this.x=x;
    this.y=y;
    this.r=rad;
    this.rotation=rot
    this.percentageX=this.x/width
    this.percentageY=this.y/height
    this.percentageR=this.r/width

    this.image=document.getElementById("Drone");
  }
  draw(ctx)
  {

    ctx.save();
    // //console.log(this.x)
    // // move the drawing context to the agent's x and y coords
    //
    ctx.translate(this.x, this.y)
    ctx.save();


    ctx.rotate(this.rotation);
    ctx.drawImage(this.image, this.r, this.r);


    ctx.restore();
    ctx.restore()

    ctx.restore()
  }
}
