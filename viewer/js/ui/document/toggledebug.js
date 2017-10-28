const rebugCheckbox = document.getElementById('checkboxRebug');
const agentHide =document.getElementById('showHide');
const showChat =document.getElementById('sideWaysTextChat');
const debugCheckbox =document.getElementById('sideWaysTextDebug');


var agentToggle=false;
agentHide.addEventListener('click', function(e){
     $('#agentLoc').toggle("slide");
});

showChat.addEventListener('click', function(e){
     $('#chatArea').toggle("slide");
});

debugCheckbox.addEventListener('click', function(e)
{
  console.log("Hey")
      $('#debugArea').toggle("slide");
});
rebugCheckbox.addEventListener('change', function(e)
{
   if (e.target.checked)
   {
      debug = true;
   }
   else
   {
      debug = false;
   }
});
