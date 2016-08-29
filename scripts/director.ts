declare var $:any;

class Director {
	el: HTMLElement;
	source: Source;
	drawer: Drawer;
	isDrawing: boolean;

	init() {
		var self = this;

		$('html').keyup((e: KeyboardEvent) => {
			var c = String.fromCharCode(e.which).toLowerCase();

			if (e.which == 8 || e.which == 46) { // backspace or delete
				self.source.removeLast();
				self.drawer.redraw(self.source);
				return;
			}

			console.log(c);

			switch(c) {
				case 'r':
					self.switchToRect();
					break;

				case 'x':
					self.clearAll();
					break;

				case 'o':
					self.switchToOriginal();
					break;

				case 'c':
					self.switchToCircle();
					break;

				case 'e':
					self.switchToEllipse();
					break;

				case 'l':
					if (e.shiftKey)
						self.switchToStraightLine();
					else
						self.switchToLine();
					break;
			}
		})
		

		$('#clear').click(this.clearAll.bind(this));
		$('#rectangle').click(this.switchToRect.bind(this));
		$('#original').click(this.switchToOriginal.bind(this));
		$('#circle').click(this.switchToCircle.bind(this));
		$('#ellipse').click(this.switchToEllipse.bind(this));
		$('#line').click(this.switchToLine.bind(this));
		$('#line-straight').click(this.switchToStraightLine.bind(this));

		this.source = new Source();
		this.el = $('#c').get(0);
		this.drawer = new Drawer(this.el);

		this.el.onmousedown = (e: MouseEvent) => {
			self.source.start(e.clientX, e.clientY);
			self.isDrawing = true;
		};

		this.el.onmousemove = (e: MouseEvent) => {
			if (!self.isDrawing) return;

			self.source.last().record(e.clientX, e.clientY);
			self.drawer.redraw(self.source);
		};

		self.el.onmouseup = () => {
			self.isDrawing = false;
		};
	}

	switchToRect() {
		if (this.source.isEmpty())
			return;

		this.source.last().shape = Shape.Rectangle;
		this.drawer.redraw(this.source);
	}

	switchToLine() {
		if (this.source.isEmpty())
			return;

		this.source.last().shape = Shape.Line;
		this.drawer.redraw(this.source);
	}

	switchToStraightLine() {
		if (this.source.isEmpty())
			return;

		this.source.last().shape = Shape.StraightLine;
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