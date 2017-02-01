const checkbox = document.getElementById('checkboxDebug');

checkbox.addEventListener('change', function(e)
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
