let buttonSend = document.getElementById('buttonSend');
let chatmsg = document.getElementById('chatmsg');
let userName = document.getElementById('userName');
//var chat = "<strong>" + userName.value + ": </strong>" + chatmsg.value;
$("#buttonSend").click(function (e) {
	let chat = "<strong>" + userName.value + ": </strong>" + chatmsg.value + "<br>";
	e.preventDefault();
	console.log(chatmsg.value);
	socket.emit('input', {'type': 'message', message: chat});
	chatmsg.value = '';
	userName.readOnly = true;
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
