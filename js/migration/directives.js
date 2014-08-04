'use strict';

/* Directives */


angular.module('myApp.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }])
  .directive('draggable', function($document) {
	return function(scope, element, attr) {
		//initial x and y values correspond to initial position of control-panel
      		var startX = 0, startY = 0, x = 230, y = 60;
		element.on('mousedown', function(event) {
        		// Prevent default dragging of selected content
        		event.preventDefault();
        		startX = event.screenX - x;
        		startY = event.screenY - y;
        		$document.on('mousemove', mousemove);
        		$document.on('mouseup', mouseup);
      		});

      		function mousemove(event) {
			console.log("MOUSEMOVE");
			console.log("screen Y, start Y, screenX, startX, x, y");
        		y = event.screenY - startY;
        		x = event.screenX - startX;
			
			element.css({
          			top: y + 'px',
          			left:  x + 'px'
        		});
      		}

      		function mouseup() {
        		$document.off('mousemove', mousemove);
        		$document.off('mouseup', mouseup);
      		}
    	};
  });
