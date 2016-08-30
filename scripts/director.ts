declare var $:any;

enum Mode {
	Drawing,
	Scaling,
	None
}

class Director {
	el: HTMLElement;
	source: Source;
	drawer: Drawer;
	mode: Mode;

	initScaleDistance: number;

	init() {
		var self = this;
		self.mode = Mode.None;

		$('html')
			.keydown(self.generalHotkeys.bind(this))
			.keydown(self.textTyping.bind(this));

		$('#clear').click(this.clearAll.bind(this));
		$('#rectangle').click(this.switchToRect.bind(this));
		$('#original').click(this.switchToOriginal.bind(this));
		$('#circle').click(this.switchToCircle.bind(this));
		$('#ellipse').click(this.switchToEllipse.bind(this));
		$('#line').click(this.switchToLine.bind(this));
		$('#line-straight').click(this.switchToStraightLine.bind(this));

		this.source = new Source();
		this.el = document.getElementById('c');
		this.drawer = new Drawer(this.el, this.source);

		$(this.el)
			.mousedown((e: MouseEvent) => {
				
				if (e.shiftKey && !self.source.isEmpty) {
					self.mode = Mode.Scaling;

					var b = Drawer.getBounds(self.source.last().raw);
					self.initScaleDistance = self.distance(new Point(b.centerX, b.centerY), new Point(e.clientX, e.clientY));
				} else {
					self.source.start(e.clientX, e.clientY);
					self.mode = Mode.Drawing;
				}

				return false;
			})

			.mousemove((e: MouseEvent) => {
				if (self.mode == Mode.None) return;

				if (self.mode == Mode.Scaling) {
					var b = Drawer.getBounds(self.source.last().raw);
					var distance = self.distance(new Point(b.centerX, b.centerY), new Point(e.clientX, e.clientY));
					self.source.last().sizeK = distance / self.initScaleDistance;
				} else {
					self.source.last().record(e.clientX, e.clientY);
				}
				self.drawer.redraw();
			})

			.mouseup(() => {
				if (self.mode == Mode.None) return;

				if (self.mode == Mode.Drawing) {
					if (self.source.last().raw.length == 1) {
						self.source.removeLast();
					}
				}

				self.mode = Mode.None;

				return false;
			})

			.dblclick((e: MouseEvent) => {
				self.source.start(e.clientX, e.clientY);
				self.source.last().shape = Shape.Text;
				self.drawer.redraw();				

				return false;
			});
	}

	distance(p1: Point, p2: Point) {
		return Math.abs(Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)));
	}

	textTyping(e: KeyboardEvent) {
		var last = this.source.last();
		if (last == null || last.shape != Shape.Text) return;

		if (e.which == 8 || e.which == 46) {
			if (last.text.length > 0) {
				last.text = last.text.substr(0, last.text.length - 1);
			}
			this.drawer.redraw();
			return;
		}
		
		var char = String.fromCharCode(e.which).toLowerCase();
		if (e.shiftKey)
			char = char.toUpperCase();

		last.text += char;

		this.drawer.redraw();
	}

	generalHotkeys(e: KeyboardEvent) {
		if (this.source.last() == null ||
			this.source.last().shape == Shape.Text) return;

		var c = String.fromCharCode(e.which).toLowerCase();

		if (e.which == 8 || e.which == 46) { // backspace or delete
			this.source.removeLast();
			this.drawer.redraw();
			return;
		}

		if (e.which == 38) {
			this.source.last().sizeK *= 1.05;
			this.drawer.redraw();
		}

		if (e.which == 40) {
			this.source.last().sizeK *= 0.95;
			this.drawer.redraw();
		}

		console.log(c, e.which);

		switch(c) {
			case 'r': this.switchToRect(); break;
			case 'x': this.clearAll(); break;
			case 'o': this.switchToOriginal(); break;
			case 'c': this.switchToCircle(); break;
			case 'e': this.switchToEllipse(); break;
			case 'l':
				if (e.shiftKey)
					this.switchToStraightLine();
				else
					this.switchToLine();
				break;
		}
	}

	switchToRect() {
		if (this.source.isEmpty())
			return;

		this.source.last().shape = Shape.Rectangle;
		this.drawer.redraw();
	}

	switchToLine() {
		if (this.source.isEmpty())
			return;

		this.source.last().shape = Shape.Line;
		this.drawer.redraw();
	}

	switchToStraightLine() {
		if (this.source.isEmpty())
			return;

		this.source.last().shape = Shape.StraightLine;
		this.drawer.redraw();
	}

	clearAll() {
		this.source.items = [];
		this.drawer.redraw();
	}

	switchToOriginal(){
		if (this.source.isEmpty())
			return;

		this.source.last().shape = Shape.Original;
		this.drawer.redraw();
	}

	switchToCircle() {
		if (this.source.isEmpty())
			return;

		this.source.last().shape = Shape.Circle;
		this.drawer.redraw();
	}

	switchToEllipse() {
		if (this.source.isEmpty())
			return;

		this.source.last().shape = Shape.Ellipse;
		this.drawer.redraw();
	}
}