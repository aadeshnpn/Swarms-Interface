let currentSort = [[0, 0]]; // first column, descending
var attacks = {0:"Flank",1:"Delayed Flank",2:"Surround",3:"Split",4:"Penetration",5:"Penetration 2", 6:"Decoy"}



$(document).ready(() =>
{

  getSims();
  window.setInterval(getSims, 5000);
  let simListTable = $('#simList');
  let numHeaders = simListTable.children('th').length;
  simListTable.tablesorter();
  simListTable.bind("sortEnd", function(event) { currentSort = event.target.config.sortList; } );
  // The last column should always be the link to the sim, and it doesn't
  // make any sense to sort by that.
  $('#simList thead th:last-of-type').data('sorter', false);
  $('#createNewSim').on('click', function(event){
    event.preventDefault();
    var data = {};
    var form = $("form").serializeArray();

    for (var i = 0; i < form.length; i++){
      data[form[i].name] = form[i].value;
    }

    $.post("/sims/", data, res =>{
      getSims();
    });

  });

  $('#limitUsers').change((event) =>{
    $('#newSim input[name=maxUsers]').prop("disabled", !$(event.target).prop('checked'));
  });
});




$("#redirectToCreate").click(function(){
  window.location.replace("http://localhost:3000/createSim.html");
})

function getSims()
{
  $.get("/simlist", json =>
  {
    $('#simList').find("tr:gt(0)").remove();

    let keysSorted = Object.keys(json).sort();
    var i=1;
    $('#simList tbody').empty()
    for (let key of keysSorted)
    {
      let [sim, info] = [key, json[key]];
      if(info.connected <1 || info.connected == null ){
        var myobj= {simId:info.simId}
        jobj = JSON.stringify(myobj);
        $.ajax({
          url:'simDel',
          type: "POST",
          data:jobj,
          contentType: "application/json; charset=utf-8",
          success: function(data,textStatus){

          }
        })
        $(this).parents("tr").remove()
      }else{
        var image = new Image();
        if(info.options.model=="Drone"){

          image.src="./img/drone.png"
          image.width=35
          // image="showDrone"
        }else if(info.options.model == "Bee"){
          image.src="./img/bee-transparent-large.png"
          image.width=30
        }else if(info.options.model == "Ant"){
          image.src="./img/ant-small.png"
          image.width=30
        }else{
          image.src="./img/drone.png"
          image.width=35
          // image="showDrone"
        }



        $('#simList tbody').append(`
          <tr>
            <td>${i}</td>
            <td></td>
            <td>${info.options.scenarioType}</td>
            <td>${attacks[info.options.attackType]} </td>
            <td>${info.connected} / ${info.options.maxUsers}</td>
            <td>${info.options.agentNum}</td>
            <td><b><a href='/sims/${sim}'>Join</a></b></td>
            <td><button class="deleteSim" id="sim${i}">X</button></td>

          </tr>`);
          let curr=$('#simList tbody tr td')[(i-1)*8+1]
          // console.log(curr);
          // curr=curr.children()[1]
          // console.log(curr);
          curr.appendChild(image)

          // console.log()
          // $('#simList tbody').append(image);
          // $('#simList').append(`<img src="${info.options.image}" class="simImage" width="350px"/>
          //   `);
        $('#simList').trigger("update");
        i++;
      }
      //<img src="${info.options.image}" class="simImage" width="350px"/>

    }
    $('.deleteSim').click(function(e){
      var id=(e.target.id).split('sim')[1]
      var simId=$(this.parentNode.parentNode)[0].firstElementChild.innerHTML
      //simId=JSON.stringify(simId)

      var myobj= {simId:simId}
      jobj = JSON.stringify(myobj);
      $.ajax({
        url:'simDel',
        type: "POST",
        data:jobj,
        contentType: "application/json; charset=utf-8",
        success: function(data,textStatus){

        }
      })
      $(this).parents("tr").remove()
    })
  });
}
