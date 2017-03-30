const debugCheckbox = document.getElementById('checkboxDebug');

debugCheckbox.addEventListener('change', function(e)
{
   if (e.target.checked)
   {
      $('.debug').show();
      debug = true;
   }
   else
   {
      $('.debug').hide();
      debug = false;
   }
});
