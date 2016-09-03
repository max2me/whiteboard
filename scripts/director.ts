declare var $:any;

enum Mode {
	Drawing,
	DrawingSteps,
	Scaling,
	Moving,
	None
}

class Keyboard {
	static backspace = 8;
	static delete = 46;
	static arrowRight = 39;
	static arrowLeft = 37;

	static isDelete(char: number) {
		return char == Keyboard.backspace || char == Keyboard.delete;
	}

	static isArrowRight(char: number) {
		return char == Keyboard.arrowRight;
	}

	static isArrowLeft(char: number) {
		return char == Keyboard.arrowLeft;
	}
}

class Director {
	el: HTMLElement;
	source: Source;
	drawer: Drawer;
	mode: Mode;

	initScaleDistance: number;
	initScale: number;

	initMovingPoint: Point;
	initMoveX: number;
	initMoveY: number;

	init() {
		var self = this;
		self.mode = Mode.None;

		$('html')
			.keydown(self.generalHotkeys.bind(this))
			.keydown(self.textTyping.bind(this))
			.keydown(self.modifierKeyDown.bind(this))
			.keyup(self.modifierKeyUp.bind(this));

		$('canvas').on('contextmenu', () => {
			return false;
		});

		this.source = new Source();
		this.el = document.getElementById('c');
		this.drawer = new Drawer(this.el, this.source);

		$(this.el)
			.mousedown((e: MouseEvent) => {
				
				if (e.ctrlKey && e.shiftKey) {
					if (self.mode == Mode.None) {
						self.mode = Mode.DrawingSteps;
						self.source.start(e.clientX, e.clientY);
						self.source.last().record(e.clientX, e.clientY);
					} else if (self.mode == Mode.DrawingSteps) {
						self.source.last().record(e.clientX, e.clientY);
					}

				} else if (e.ctrlKey && !self.source.isEmpty()) {
					self.mode = Mode.Scaling;

					var item = self.source.last();
					var bounds = Drawer.getBounds(item.raw);
					self.initScaleDistance = Utility.distance(new Point(bounds.centerX + item.moveX, bounds.centerY + item.moveY), new Point(e.clientX, e.clientY));
					self.initScale = self.source.last().sizeK;

				} else if (e.shiftKey && !self.source.isEmpty()) {
					self.mode = Mode.Moving;
					self.initMovingPoint = new Point(e.clientX, e.clientY);
					self.initMoveX = self.source.last().moveX;
					self.initMoveY = self.source.last().moveY;

				} else if (e.altKey && !self.source.isEmpty()) {
					self.mode = Mode.Moving;

					var newItem = Utility.clone(self.source.last())
					self.source.push(newItem);

					self.initMovingPoint = new Point(e.clientX, e.clientY);
					self.initMoveX = self.source.last().moveX;
					self.initMoveY = self.source.last().moveY;

				} else if (e.button == 2) {
					if (self.source.isEmpty())
						return;

					self.source.start(e.clientX, e.clientY);
					self.source.last().shape = Shape.Eraser;
					self.mode = Mode.Drawing;

				} else {
					self.source.start(e.clientX, e.clientY);
					self.mode = Mode.Drawing;
				}

				return false;
			})

			.mousemove((e: MouseEvent) => {
				if (self.mode == Mode.None) return;

				if (self.mode == Mode.DrawingSteps) {
					var item = self.source.last();
					item.raw.pop();
					item.record(e.clientX, e.clientY);
					self.drawer.redraw(true);

				} else if (self.mode == Mode.Scaling) {
					var item = self.source.last();
					var bounds = Drawer.getBounds(item.raw);
					var distance = Utility.distance(new Point(bounds.centerX + item.moveX, bounds.centerY + item.moveY), new Point(e.clientX, e.clientY));
					
					item.sizeK = self.initScale * distance / self.initScaleDistance;
				
				} else if (self.mode == Mode.Moving) {
					var current = new Point(e.clientX, e.clientY);
					self.source.last().moveX = self.initMoveX + current.x - self.initMovingPoint.x;
					self.source.last().moveY = self.initMoveY + current.y - self.initMovingPoint.y;

				} else {
					self.source.last().record(e.clientX, e.clientY);
				}

				self.drawer.redraw(true);
			})

			.mouseup(() => {
				if (self.mode == Mode.DrawingSteps) {
					//self.source.last().raw.pop();
					return;
				}

				if (self.mode == Mode.None) return;

				if (self.mode == Mode.Drawing) {
					if (self.source.last().raw.length == 1) {
						self.source.removeLast();
					}
				}

				self.drawer.redraw(false);
				self.mode = Mode.None;

				return false;
			})

			.dblclick((e: MouseEvent) => {
				self.source.start(e.clientX, e.clientY);
				self.source.last().shape = Shape.Text;
				self.drawer.redraw(true);				

				return false;
			});
	}

	modifierKeyDown(e:KeyboardEvent) {
		this.syncUpHtmlState(e);
	}

	modifierKeyUp(e:KeyboardEvent) {
		this.syncUpHtmlState(e);
	}

	syncUpHtmlState(e: KeyboardEvent) {
		var html = '';

		if (this.mode == Mode.DrawingSteps && !e.ctrlKey && !e.shiftKey) {
			this.source.last().raw.pop(); // Clean up after moving
			this.mode = Mode.None;
		}

		if (e.ctrlKey && e.shiftKey)
			html = 'mode-steps';
		else if (e.ctrlKey)
			html = 'mode-scaling';
		else if (e.shiftKey)
			html = 'mode-moving';
		else if (e.altKey)
			html = 'mode-cloning';
		
		$('html').attr('class', html);
	}

	textTyping(e: KeyboardEvent) {
		var last = this.source.last();
		if (last == null || last.shape != Shape.Text) return;

		if (Keyboard.isDelete(e.which)) {
			if (last.text == '') {
				this.source.removeLast();
				this.drawer.redraw(false);
				return;
			}

			if (last.text.length > 0) {
				last.text = last.text.substr(0, last.text.length - 1);
			}
			this.drawer.redraw(false);
			return;
		}
		
		var char = String.fromCharCode(e.which).toLowerCase();
		if (e.shiftKey)
			char = char.toUpperCase();

		last.text += char;

		this.drawer.redraw(false);
	}

	generalHotkeys(e: KeyboardEvent) {
		if (this.source.last() == null ||
			this.source.last().shape == Shape.Text) return;

		var c = String.fromCharCode(e.which).toLowerCase();

		if (Keyboard.isDelete(e.which)) { // backspace or delete
			this.source.removeLast();
			this.drawer.redraw(false);
			return;
		}

		console.log(c, e.which);

		if (Keyboard.isArrowLeft(e.which) || Keyboard.isArrowRight(e.which)) { // ARROW RIGHT
			var item = this.source.last();

			if (Keyboard.isArrowRight(e.which)) {
				item.lineArrowEnd = !item.lineArrowEnd;
			}

			if (Keyboard.isArrowLeft(e.which)) {
				item.lineArrowStart = !item.lineArrowStart;
			}

			if (item.shape != Shape.Line && item.shape != Shape.SmoothLine && item.shape != Shape.StraightLine) {
				this.switchShape(Shape.SmoothLine);
			}
			
			this.drawer.redraw(false);
			return;
		}

		switch(c) {
			case 'x': this.clearAll(); break;
			case 'r': this.switchShape(Shape.Rectangle); break;
			case 'o': this.switchShape(Shape.Original); break;
			case 'c': this.switchShape(Shape.Circle); break;
			case 'e': this.switchShape(Shape.Ellipse); break;
			case 'k': this.switchShape(Shape.StraightLine); break; 
			case 'l':
				var item = this.source.last();
				if (item.shape == Shape.SmoothLine || e.shiftKey)
					this.switchShape(Shape.Line);
				else
					this.switchShape(Shape.SmoothLine);
				break;
		}
	}

	switchShape(shape: Shape) {
		if (this.source.isEmpty())
			return;

		this.source.last().shape = shape;
		this.drawer.redraw(false);
	}

	clearAll() {
		this.source.items = [];
		this.drawer.redraw(false);
	}
}