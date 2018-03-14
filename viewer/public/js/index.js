let currentSort = [[0, 0]]; // first column, descending

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
    for (let key of keysSorted)
    {
      let [sim, info] = [key, json[key]];
      //<img src="${info.options.image}" class="simImage" width="350px"/>
      var image;
      if(info.options.model=="Drone"){
        image="showDrone"
      }
      // $('#activeSim').append(`
      //   <div class="${image}"></div>
      // `)
      $('#simList tbody').append(`
        <tr>
          <td>${i}</td>
          <td>${info.options.model}</td>
          <td>${info.options.worldType}</td>
          <td>${info.connected} / ${info.options.maxUsers}</td>
          <td>${info.options.agentNum}</td>
          <td><b><a href='/sims/${sim}'>Join</a></b></td>
          <td><button class="deleteSim" id="sim${i}">X</button></td>

        </tr>`);
        // $('#simList').append(`<img src="${info.options.image}" class="simImage" width="350px"/>
        //   `);
      $('#simList').trigger("update");
      i++;
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
