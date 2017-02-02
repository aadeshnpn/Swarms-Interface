const checkbox = document.getElementById('checkboxDebug');

checkbox.addEventListener('change', function(e)
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
