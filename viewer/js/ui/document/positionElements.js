var canvas = document.getElementById('canvas');
style=window.getComputedStyle(canvas);
windowWidth=jQuery(window).width();
windowHeight=jQuery(window).height();
canvasHeight=style.getPropertyValue('height');
canvasWidth=style.getPropertyValue('width');
var menuBar = document.getElementById('menuBar');

//menuBar.style.top=toString(windowHeight-canvasHeight+100)
