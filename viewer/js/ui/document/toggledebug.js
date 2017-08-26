const debugCheckbox = document.getElementById('checkboxDebug');
const rebugCheckbox = document.getElementById('checkboxRebug');
debugCheckbox.addEventListener('change', function(e)
{
   if (e.target.checked)
   {
      $('.debug').show();
   }
   else
   {
      $('.debug').hide();
   }
});
rebugCheckbox.addEventListener('change', function(e)
{
   if (e.target.checked)
   {
      debug = true;
   }
   else
   {
      debug = false;
   }
});
