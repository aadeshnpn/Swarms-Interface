var buttonRestart = document.getElementById('buttonRestart');

buttonRestart.addEventListener('click', function()
{
  socket.emit('input', {type: 'restart'});
});
