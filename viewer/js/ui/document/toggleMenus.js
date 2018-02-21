var showMenus1 = false;
var showOptions1 = false;
var openSound = document.getElementById("audio0")

var closeSound = document.getElementById("audio1");
var menuArray=['messengerIcon','menu','agentInfoIcon']
var optionsArray=['options','showAgentState','dontShowAgentState','backgroundTransparency','showFogIcon','dontShowFogIcon','showAgents','dontShowAgents','debugIcon']
//var optionsArray.push('')
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