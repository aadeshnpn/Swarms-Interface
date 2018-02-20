const rebugCheckbox = document.getElementById('dontShowAgents');
const agentHide =document.getElementById('agentInfoIcon');
const showChat =document.getElementById('messengerIcon');
const debugButton =document.getElementById('debugIcon');
const fogButton =document.getElementById('showFogIcon');
var showAgent = false;
var showFog=true;
var showDebug = false;
var showSlider = false;
var showAgentInfo = false;
var showChatWindow = false;



$("#debugIcon").click(function(){
  $('#debugArea').fadeToggle();
  if(showDebug){
    showDebug = false;
  }
  else{
    showDebug=true;
  }
})
$("#showFogIcon").click(function(){
  //console.log(showFog);
  if(showFog){
      //console.log($('#showFogIcon').attr('id'));
    $('#showFogIcon').attr('id',"dontShowFogIcon")
    showFog = false;
  }
  else{
    //console.log($('#dontShowFogIcon').attr('id'));
    $('#dontShowFogIcon').attr('id',"showFogIcon")
    showFog=true;
  }
})

$("#backgroundTransparency").click(function(){
  $('#myRange').fadeToggle();
  if(showSlider){
    showSlider=false;
  }
  else{
    showSlider=true;
  }
})

agentHide.addEventListener('click', function(e){
     $('#agentLoc').fadeToggle();
     if(showAgentInfo){
       showAgentInfo=false;
     }
     else{
       showAgentInfo=true;
     }

});

showChat.addEventListener('click', function(e){
     $('#chatArea').fadeToggle();
     if(showChatWindow){
       showChatWindow=false;
     }
     else{
       showChatWindow=true;
     }
});


rebugCheckbox.addEventListener('click', function(e)
{
  if(!showAgent){

      debug = true;
      showAgent= true;
      //$('#showAgents').css('background-image', 'url("dontShowDrones.png")')
      $('#dontShowAgents').attr('id',"showAgents")
    }
    else{
      console.log("Agent Off")
      debug = false;
      showAgent=false;
      $('#showAgents').attr('id',"dontShowAgents")
    }

});
