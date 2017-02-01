var button = document.getElementById('buttonPausePlay');
var isPaused = false;

button.addEventListener('click', function(e)
{
   if (isPaused)
   {
      socket.emit('input', {type: 'play'});
      button.innerHTML = "Pause";
      isPaused = false;
   }
   else
   {
      socket.emit('input', {type: 'pause'});
      button.innerHTML = "Play";
      isPaused = true;
   }
});
