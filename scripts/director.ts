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
			
			.keydown(self.syncUpHtmlState.bind(this))
			.keyup(self.syncUpHtmlState.bind(this));

		$('canvas').on('contextmenu', () => {
			return false;
		});

		this.source = new Source();
		this.el = document.getElementById('c');
		this.drawer = new Drawer(this.el, this.source);

		$(this.el)
			.mousedown((e: MouseEvent) => {
				
				if (e.ctrlKey && e.shiftKey) {
					self.startDrawingSteps(e.clientX, e.clientY);

				} else if (e.ctrlKey && !self.source.isEmpty()) {
					self.startScaling(e.clientX, e.clientY);

				} else if (e.shiftKey && !self.source.isEmpty()) {
					self.startMoving(e.clientX, e.clientY);

				} else if (e.altKey && !self.source.isEmpty()) {
					self.startCloning(e.clientX, e.clientY);

				} else if (e.button == 2) {
					self.startErasing(e.clientX, e.clientY);

				} else {
					self.startDrawing(e.clientX, e.clientY);
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
				if (self.mode == Mode.DrawingSteps || self.mode == Mode.None) {
					return;
				}

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
				self.startTyping(e.clientX, e.clientY);
				return false;
			});
	}

	

	startTyping(clientX: number, clientY: number) {
		this.source.start(clientX, clientY);
		this.source.last().shape = Shape.Text;
		this.drawer.redraw(true);
	}
	
	startDrawing(clientX: number, clientY: number) {
		this.source.start(clientX, clientY);
		this.mode = Mode.Drawing;
	}

	startErasing(clientX: number, clientY: number) {
		if (this.source.isEmpty())
			return;

		this.source.start(clientX, clientY);
		this.source.last().shape = Shape.Eraser;
		this.mode = Mode.Drawing;
	}

	startCloning(clientX: number, clientY: number) {
		var newItem = Utility.clone(this.source.last())
		this.source.push(newItem);
		
		this.startMoving(clientX, clientY);
	}

	startDrawingSteps(clientX: number, clientY: number) {
		if (this.mode == Mode.None) {
			this.mode = Mode.DrawingSteps;
			this.source.start(clientX, clientY);
			this.source.last().record(clientX, clientY);

		} else if (this.mode == Mode.DrawingSteps) {
			this.source.last().record(clientX, clientY);
		}
	}

	startMoving(clientX: number, clientY: number) {
		this.mode = Mode.Moving;
		this.initMovingPoint = new Point(clientX, clientY);
		this.initMoveX = this.source.last().moveX;
		this.initMoveY = this.source.last().moveY;
	}

	startScaling(clientX: number, clientY: number) {
		this.mode = Mode.Scaling;

		var item = this.source.last();
		var bounds = Drawer.getBounds(item.raw);
		this.initScaleDistance = Utility.distance(new Point(bounds.centerX + item.moveX, bounds.centerY + item.moveY), new Point(clientX, clientY));
		this.initScale = this.source.last().sizeK;
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