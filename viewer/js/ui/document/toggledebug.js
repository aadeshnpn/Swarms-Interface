const rebugCheckbox = document.getElementById('dontShowAgents');
const agentHide =document.getElementById('agentInfoIcon');
const showChat =document.getElementById('messengerIcon');
const debugButton =document.getElementById('debugIcon');
var showAgent = false;
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
