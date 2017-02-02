var buttonPausePlay = document.getElementById('buttonPausePlay');
var isPaused = false;

buttonPausePlay.addEventListener('click', function(e)
{
   if (isPaused)
   {
      socket.emit('input', {type: 'play'});
      buttonPausePlay.innerHTML = "Pause";
      isPaused = false;
   }
   else
   {
      socket.emit('input', {type: 'pause'});
      buttonPausePlay.innerHTML = "Play";
      isPaused = true;
   }
});
