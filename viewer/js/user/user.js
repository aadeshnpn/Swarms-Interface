function setUserAbility(add,avoid){
  if(add && !avoid){

    selectModes.splice(1,1)
    $( "#selectType" ).html(selectModes[currentSelectMode])
    $( "#selectType" ).css("color",Object.entries(Fog.stateStyles)[currentSelectMode][1])
    // localInfo.create(tasks.patrol)
  }
  else if(!add && avoid){
    selectModes.splice(0,1)
    currentSelectMode=1;
    $( "#selectType" ).html(selectModes[0])
    $( "#selectType" ).css("color",Object.entries(Fog.stateStyles)[currentSelectMode][1])
    // localInfo.create(tasks.avoid)

  }else if(!add && !avoid){
    // selectMode
    $( "#selectMode" ).css("display","none")
    currentSelectMode=-1;
  }
}



socket.on("scenario",function(info){
  // console.log(info);
  scenarioType=info.type;
  scenarios+=1
  if(info != null && info != undefined && scenarios == 1){
    if(info.size != undefined){
      canvas.setAttribute("width", info.size.width);
      canvas.setAttribute("height", info.size.height);
      document.getElementById("canvasDiv").style.width = info.size.width + "px";

    }
    else{
      // console.error("The size was not recieved");
    }
    if(info.task != undefined && info.task != null && info.size != undefined){
      // console.log(info.task);
      localInfo.create(info.task)
      localInfo.draw(info.size)
    }else{

      localInfo.create("Master")
      // console.error("The task was not recieved")
    }


    if(scenarioType=="No Communication"){
      $("#messengerIcon").css("display","none")

    }
}
})

socket.on('patrolLocations',function(loc){
  patrolLocations=loc
})
$("#myRange").change(function(e){
  sliderVal =document.getElementById('myRange').value;
})


$(document).keydown(function(e){
  // console.log("here");
  if((e.which==65 ||e.which==37) &&(addPatrol && addAvoid)){
    currentSelectMode--;
    if(currentSelectMode<0){
      currentSelectMode=selectModes.length-1
    }
    $( "#selectType" ).html(selectModes[currentSelectMode])
    $( "#selectType" ).css("color",Object.entries(Fog.stateStyles)[currentSelectMode][1])

  }else if((e.which==68 ||e.which==39) &&(addPatrol && addAvoid)){
    currentSelectMode++;
    if(currentSelectMode>selectModes.length-1){
      currentSelectMode=0
    }
    $( "#selectType" ).html(selectModes[currentSelectMode])
    $( "#selectType" ).css("color",Object.entries(Fog.stateStyles)[currentSelectMode][1])
  }
})
document.getElementById("canvasDiv").addEventListener("dblclick", function(e){
  deleteAll=true
})

socket.on("userInc",function(inc){

  if(inc ==2){
    $("#userNumber").html("<h3 id='userNumber' style='font-size:70px'>Waiting for "+(2-inc+1)+" more person</h3>")

  }else if(2-inc+1 >0){
    $("#userNumber").html("<h3 id='userNumber' style='font-size:70px'>Waiting for "+(2-inc+1)+" more people</h3>")

  }else{
    $("#userNumber").html("Click anywhere to start")
    paused=false;
  }


})

$("#document").mouseup(function(){
  // console.log("HERE");
  if(!paused && localInfo.message == "Master"){
    socket.emit('input', {type: 'play'});
    buttonPausePlay.innerHTML = "Pause";
    isPaused = false;
    $("#messageBox").css("display", "none")

  }

})
socket.on("play",function(){
  // console.log("HERE");
  buttonPausePlay.innerHTML = "Pause";
  isPaused = false;
  $("#messageBox").css("display", "none")

})

// In order to associate a client with a specific engine process,
// the server sends us a unique id to send back once socket.io has
// established a connection
socket.on('connect', function(){

  var idx = document.cookie.indexOf("simId");
  var endIdx = document.cookie.indexOf(";", idx);

  if (endIdx == -1)
  {
    endIdx = undefined;
  }

  simId = document.cookie.slice(idx, endIdx).split("=").pop();
  socket.emit("newConnection",{id:simId,socket:socket.id});
  socket.emit('simId', simId);
});
socket.on("connectionType",setUserAbilities)
socket.on("otherPatrols",getOthersPatrols)
socket.on('userStudy',function(userstudy){

  // userStudy=userstudy
  paused=userStudy
  // console.log(userstudy);
})
function setUserAbilities(type){
  console.log(type);
  if(type == "add"){
    // console.log("Add Add");
    setUserAbility(true,false)
  }else if(type == "avoid"){
    // console.log("Add Avoid");
    setUserAbility(false,true)
  }else if(type =="observe"){
    setUserAbility(false,false)
  }

}

function getOthersPatrols(patrolMap){
  console.log(patrolMap);
}
