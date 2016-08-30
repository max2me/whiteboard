declare var $:any;

class Director {
	el: HTMLElement;
	source: Source;
	drawer: Drawer;
	isDrawing: boolean;

	init() {
		var self = this;

		$('html')
			.keydown(self.generalHotkeys.bind(this))
			.keyup(self.textTyping.bind(this));

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
				self.source.start(e.clientX, e.clientY);
				self.isDrawing = true;
				return false;
			})

			.mousemove((e: MouseEvent) => {
				if (!self.isDrawing) return;

				self.source.last().record(e.clientX, e.clientY);
				self.drawer.redraw();
			})

			.mouseup(() => {
				self.isDrawing = false;
				if (self.source.last().raw.length == 1) {
					self.source.removeLast();
				}

				return false;
			})

			.dblclick((e: MouseEvent) => {
				self.source.start(e.clientX, e.clientY);
				self.source.last().shape = Shape.Text;
				self.drawer.redraw();				

				return false;
			});
	}

	textTyping(e: KeyboardEvent) {
		var last = this.source.last();
		if (last.shape != Shape.Text) return;

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
		if (this.source.last().shape == Shape.Text) return;

		var c = String.fromCharCode(e.which).toLowerCase();

		if (e.which == 8 || e.which == 46) { // backspace or delete
			this.source.removeLast();
			this.drawer.redraw();
			return;
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