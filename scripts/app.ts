declare var $:any;

var el;
var source: Source;
var drawer: Drawer;
var isDrawing;

$(() => {
	$('#clear').click(() => {
		source.items = [];
		drawer.redraw(source);
	});
	
	// $('#rectangle').click(canvasRect);
	// $('#original').click(canvasOriginal);
	// $('#circle').click(canvasCircle);

	source = new Source();
	
	el = $('#c').get(0);
	drawer = new Drawer(el);

	el.onmousedown = function(e: MouseEvent) {
		source.start(e.clientX, e.clientY);
		isDrawing = true;
	};

	el.onmousemove = function(e: MouseEvent) {
		if (!isDrawing) return;

		source.last().record(e.clientX, e.clientY);
		drawer.redraw(source);
	};

	el.onmouseup = function() {
		isDrawing = false;
	};
});


