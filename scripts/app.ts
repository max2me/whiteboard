declare var $:any;

var el: HTMLElement;
var source: Source;
var drawer: Drawer;
var isDrawing: boolean;

$(() => {
	$('#clear').click(() => {
		source.items = [];
		drawer.redraw(source);
	});
	
	$('#rectangle').click(switchToRect);
	$('html').keypress((e: KeyboardEvent) => {
		var c = String.fromCharCode(e.which).toLowerCase();

		if (c == 'r')
			switchToRect();
	})
	
	
	$('#original').click(() => {
		if (source.isEmpty())
			return;

		source.last().shape = Shape.Original;
		drawer.redraw(source);
	});


	$('#circle').click(() => {
		if (source.isEmpty())
			return;

		source.last().shape = Shape.Circle;
		drawer.redraw(source);
	});

	$('#ellipse').click(() => {
		if (source.isEmpty())
			return;

		source.last().shape = Shape.Ellipse;
		drawer.redraw(source);
	});

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

function switchToRect() {
	if (source.isEmpty())
		return;

	source.last().shape = Shape.Rectangle;
	drawer.redraw(source);
}
