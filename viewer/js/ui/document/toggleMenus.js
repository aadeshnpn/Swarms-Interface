var showMenus1 = false;
var showOptions1 = false;
var openSound = document.getElementById("audio0")

var closeSound = document.getElementById("audio1");

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
