var buttonSend = document.getElementById('buttonSend');
var chatmsg = document.getElementById('chatmsg');
var userName = document.getElementById('userName');
//var chat = "<strong>" + userName.value + ": </strong>" + chatmsg.value;
$("#buttonSend").click(function(e)
{
  var chat = "<strong>" + userName.value + ": </strong>" + chatmsg.value +"<br>";
  e.preventDefault();
  console.log(chatmsg.value);
  socket.emit('input', {'type': 'message', message: chat});
  chatmsg.value = '';
  userName.readOnly=true;
});

/*buttonSend.addEventListener('click', function()
{
  console.log(chatmsg.value);
  socket.emit('input', {'type': 'message', message: chatmsg.value});
  chatmsg.value = '';
});

function pressEnter()
{
  console.log(chatmsg.value);
  socket.emit('input', {'type': 'message', message: chatmsg.value});
  chatmsg.value = '';

});
*/
