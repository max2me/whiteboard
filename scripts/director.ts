declare var $:any;

class Director {
	el: HTMLElement;
	source: Source;
	drawer: Drawer;
	isDrawing: boolean;

	init() {
		$('html').keypress((e: KeyboardEvent) => {
			var c = String.fromCharCode(e.which).toLowerCase();

			switch(c) {
				case 'r':
					this.switchToRect();
					break;

				case 'x':
					this.clearAll();
					break;

				case 'o':
					this.switchToOriginal();
					break;

				case 'c':
					this.switchToCircle();
					break;

				case 'e':
					this.switchToEllipse();
					break;
			}
		})
		
		$('#clear').click(this.clearAll);
		$('#rectangle').click(this.switchToRect);
		$('#original').click(this.switchToOriginal);
		$('#circle').click(this.switchToCircle);
		$('#ellipse').click(this.switchToEllipse);

		this.source = new Source();
		this.el = $('#c').get(0);
		this.drawer = new Drawer(this.el);

		this.el.onmousedown = (e: MouseEvent) => {
			this.source.start(e.clientX, e.clientY);
			this.isDrawing = true;
			console.log(1);
		};

		this.el.onmousemove = (e: MouseEvent) => {
			if (!this.isDrawing) return;

			this.source.last().record(e.clientX, e.clientY);
			this.drawer.redraw(this.source);
		};

		this.el.onmouseup = () => {
			this.isDrawing = false;
		};
	}

	switchToRect() {
		if (this.source.isEmpty())
			return;

		this.source.last().shape = Shape.Rectangle;
		this.drawer.redraw(this.source);
	}

	clearAll() {
		this.source.items = [];
		this.drawer.redraw(this.source);
	}

	switchToOriginal(){
		if (this.source.isEmpty())
			return;

		this.source.last().shape = Shape.Original;
		this.drawer.redraw(this.source);
	}

	switchToCircle() {
		if (this.source.isEmpty())
			return;

		this.source.last().shape = Shape.Circle;
		this.drawer.redraw(this.source);
	}

	switchToEllipse() {
		if (this.source.isEmpty())
			return;

		this.source.last().shape = Shape.Ellipse;
		this.drawer.redraw(this.source);
	}
}