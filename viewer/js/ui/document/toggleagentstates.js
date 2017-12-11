const statesCheckbox = document.getElementById('dontShowAgentState');
var showState=false;
statesCheckbox.addEventListener('click', function(e)
{
	if(!showState){
      showAgentStates = true;
      showState= true;
      //$('#showAgents').css('background-image', 'url("dontShowDrones.png")')
      $('#dontShowAgentState').attr('id',"showAgentState")
    }
    else{
      showAgentStates = false;
      showState=false;
      $('#showAgentState').attr('id',"dontShowAgentState")
    }

});
