var showMenus1 = false;
var showOptions1 = false;
var openSound = document.getElementById("audio0")
var showAgentStateDescription=false;
var closeSound = document.getElementById("audio1");
var menuArray=['messengerIcon','menu','agentInfoIcon']
var optionsArray=['options',"showPheromoneIcon","dontShowPheromoneIcon",'showAgentState','dontShowAgentState','backgroundTransparency','showFogIcon','dontShowFogIcon','showAgents','dontShowAgents','debugIcon']
//var optionsArray.push('')

$("#agentStateDescriptionButton").click(function(){
  if(!showAgentStateDescription){
    stateInfoOn.set("Exploring", false)
    stateInfoOn.set("Observing", false)
    stateInfoOn.set("Following Site", false)
    $("#statesInfoText").empty()
    $("#defaultStateDescript").html(defaultStateDescript)
  }
  $("#agentStateDescriptionDiv").fadeToggle();
  showAgentStateDescription=!showAgentStateDescription

})

$("#agentStateDescriptionDiv").on('click',function(e){
  name=e.target.innerHTML;
  if(name=="Exploring" ||name=="Observing" ||name=="Following Site" ){
    switch(name){
      case 'Exploring':
        stateInfoOn.set("Exploring", true)
        stateInfoOn.set("Observing", false)
        stateInfoOn.set("Following Site", false)
        $("#statesInfoText").empty()
        $("#defaultStateDescript").empty()
        $("#statesInfoText").html(`<h3>Exploring</h3>There are currently <span id='numberInState'></span> agent(s) Exploring
        <br>The Exploring state is when an agent moves in a random-walk around the map to attempt to locate sites. If they spot a site within their
        field of view, they will start following it`)
        break;
      case 'Observing':
        stateInfoOn.set("Exploring", false)
        stateInfoOn.set("Observing", true)
        stateInfoOn.set("Following Site", false)
        $("#statesInfoText").empty()
        $("#defaultStateDescript").empty()
        $("#statesInfoText").html(`<h3>Observing</h3>There are currently <span id='numberInState'></span> agent(s) Observing
        <br>The Observing state is when an agent is at the hub, observing agents that are returning from a site. They will then
        follow an agent back to a site. Only a small portion of the agents will be in this state at a time`)
        break;
      case 'Following Site':
        stateInfoOn.set("Exploring", false)
        stateInfoOn.set("Observing", false)
        stateInfoOn.set("Following Site", true)
        $("#statesInfoText").empty()
        $("#defaultStateDescript").empty()
        $("#statesInfoText").html(`<h3>Following Site</h3>There are currently <span id='numberInState'></span> agent(s) Following Site
        <br>The Following Site state is comprised of 3 sub-states. Follow Site, Report to Hub, and Return to Site.
        <br>These states allow the agent to follow a site (once it has found one), report the info about the site back to the hub,
         and then return to the site by following a trail of pheromones.
        `)
        break;
  }
  }
})

$("body").click(function(e){

  let inMenu =false;
  let inOptions=false;
  for(let menus of menuArray){
    if(menus == e.target.id || menus==$(e.target).attr('class')){
      inMenu=true;
    }
  }
  for(let options of optionsArray){
    if(options == e.target.id || options==$(e.target).attr('class')){
      inOptions=true;
    }
  }
  if(!inMenu){
    $(".menuContent").fadeOut();
    $("#chatArea").fadeOut();
    // $("#agentLoc").fadeOut();
  }
  if(!inOptions){
    $(".optionsContent").fadeOut();
    $('#myRange').fadeOut()
    $('#debugArea').fadeOut();
  }

  // console.log(e.target.id);
  // console.log($(e.target).attr('class'));
})

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
