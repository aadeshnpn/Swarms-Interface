var buttonSend = document.getElementById('buttonSend');
var chatmsg = document.getElementById('chatmsg');

buttonSend.addEventListener('click', function()
{
  console.log(chatmsg.value);
  socket.emit('input', {'type': 'message', message: chatmsg.value});
  chatmsg.value = '';
});
