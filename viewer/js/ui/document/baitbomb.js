var baitButton = document.getElementById('buttonBugBait');
var bombButton = document.getElementById('buttonBugBomb');

baitButton.addEventListener('click', function()
{
  cursors.placeBaitBomb.setMode(CursorPlaceBaitBomb.MODE_BAIT);
  ui.setActiveCursor(cursors.placeBaitBomb);
});

bombButton.addEventListener('click', function()
{
  cursors.placeBaitBomb.setMode(CursorPlaceBaitBomb.MODE_BOMB);
  ui.setActiveCursor(cursors.placeBaitBomb);
});
