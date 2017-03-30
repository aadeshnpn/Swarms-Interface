const statesCheckbox = document.getElementById('checkboxStates');

statesCheckbox.addEventListener('change', function(e)
{
	showAgentStates = e.target.checked;
});
