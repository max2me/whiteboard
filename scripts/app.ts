declare var $:any;

var el: HTMLElement;
var source: Source;
var drawer: Drawer;
var isDrawing: boolean;

$(() => {
	$('html').keypress((e: KeyboardEvent) => {
		var c = String.fromCharCode(e.which).toLowerCase();

		switch(c) {
			case 'r':
				switchToRect();
				break;

			case 'x':
				clearAll();
				break;

			case 'o':
				switchToOriginal();
				break;

			case 'c':
				switchToCircle();
				break;

			case 'e':
				switchToEllipse();
				break;
		}
	})
	
	$('#clear').click(clearAll);
	$('#rectangle').click(switchToRect);
	$('#original').click(switchToOriginal);
	$('#circle').click(switchToCircle);
	$('#ellipse').click(switchToEllipse);

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

function clearAll() {
	source.items = [];
	drawer.redraw(source);
}

function switchToOriginal(){
	if (source.isEmpty())
		return;

	source.last().shape = Shape.Original;
	drawer.redraw(source);
}

function switchToCircle() {
	if (source.isEmpty())
		return;

	source.last().shape = Shape.Circle;
	drawer.redraw(source);
}

function switchToEllipse() {
	if (source.isEmpty())
		return;

	source.last().shape = Shape.Ellipse;
	drawer.redraw(source);
}