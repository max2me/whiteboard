declare var $:any;
interface Window {
	keysight: any;
}

enum Mode {
	Drawing,
	DrawingSteps,
	Scaling,
	Moving,
	PreparingToPan,
	Panning,
	None
}

class View {
	panX: number;
	panY: number;

	constructor() {
		this.panX = 0;
		this.panY = 0;
	}
}

class Director {
	canvas: HTMLElement;
	source: Source;
	drawer: Drawer;
	syncer: Syncer;
	mode: Mode;
	view: View;

	initScaleDistance: number;
	initScale: number;

	initMovingPoint: Point;
	initMoveX: number;
	initMoveY: number;

	initPanningPoint: Point;
	initPanningX: number;
	initPanningY: number;

	init() {
		var self = this;
		self.mode = Mode.None;

		$('html')
			.keydown(self.generalHotkeys.bind(this))
			.keydown(self.textTyping.bind(this))
			.keydown(self.syncUpHtmlStateDown.bind(this))
			.keyup(self.syncUpHtmlStateUp.bind(this));

		$('canvas').on('contextmenu', () => {
			return false;
		});

		this.source = new Source();
		this.view = new View();
		this.canvas = document.getElementById('c');
		this.drawer = new Drawer(this.canvas, this.source, this.view);
		this.syncer = new Syncer(this.source, this.drawer);		

		$(this.canvas)
			.mousedown((e: MouseEvent) => {
				e.preventDefault();
				self.interactionDown(e.clientX, e.clientY, e.ctrlKey, e.altKey, e.shiftKey, e.button);
			})

			.mousemove((e: MouseEvent) => {
				self.interactionMove(e.clientX, e.clientY, e.ctrlKey, e.altKey, e.shiftKey, e.button);
			})

			.mouseup((e: MouseEvent) => {
				e.preventDefault();
				self.interactionUp();
			})

			.dblclick((e: MouseEvent) => {
				self.startTyping(e.clientX, e.clientY);
				return false;
			});

		this.canvas.addEventListener('touchstart', (e: TouchEvent) => {
			e.preventDefault();

			if (e.changedTouches.length > 1)
				return;

			self.interactionDown(e.changedTouches[0].clientX, e.changedTouches[0].clientY, e.ctrlKey, e.altKey, e.shiftKey, 1);
		});

		this.canvas.addEventListener('touchmove', (e: TouchEvent) => {
			e.preventDefault();

			if (e.changedTouches.length > 1)
				return;

			self.interactionMove(e.changedTouches[0].clientX, e.changedTouches[0].clientY, e.ctrlKey, e.altKey, e.shiftKey, 1);
		});

		this.canvas.addEventListener('touchup', (e: TouchEvent) => {
			e.preventDefault();

			if (e.changedTouches.length > 1)
				return;

			self.interactionUp();
		});

			
	}

	interactionDown(clientX: number, clientY: number, ctrlKey: boolean, altKey: boolean, shiftKey: boolean, button: number = 1) {
		if (ctrlKey && shiftKey) {
			this.startDrawingSteps(clientX, clientY);

		} else if (ctrlKey && !this.source.isEmpty()) {
			this.startScaling(clientX, clientY);

		} else if (shiftKey && !this.source.isEmpty()) {
			this.startMoving(clientX, clientY);

		} else if (altKey && !this.source.isEmpty()) {
			this.startCloning(clientX, clientY);

		} else if (button == 2) {
			this.startErasing(clientX, clientY);

		} else if (this.mode == Mode.PreparingToPan) {
			this.startPanning(clientX, clientY);

		} else {
			this.startDrawing(clientX, clientY);
		}

		this.syncer.send();
	}

	interactionUp() {
		if (this.mode == Mode.DrawingSteps || this.mode == Mode.None) {
			return;
		}

		if (this.mode == Mode.Panning) {
			this.mode = Mode.None;
			return;
		}

		if (this.mode == Mode.Drawing) {
			if (this.source.last().raw.length == 1) {
				this.source.removeLast();
			}
		}
	
		this.drawer.redraw(false);
		this.mode = Mode.None;
		this.syncer.send();
	}

	interactionMove(clientX: number, clientY: number, ctrlKey: boolean, altKey: boolean, shiftKey: boolean, button: number = 1) {
		if (this.mode == Mode.None || this.mode == Mode.PreparingToPan) return;

		if (this.mode == Mode.DrawingSteps) {
			var item = this.source.last();
			item.raw.pop();
			item.record(clientX - this.view.panX, clientY - this.view.panY);
			this.drawer.redraw(true);

		} else if (this.mode == Mode.Scaling) {
			var item = this.source.last();
			var bounds = Utility.getBounds(item.raw);
			var distance = Utility.distance(new Point(bounds.centerX + item.moveX, bounds.centerY + item.moveY), new Point(clientX, clientY));
			
			item.sizeK = this.initScale * distance / this.initScaleDistance;
		
		} else if (this.mode == Mode.Moving) {
			var current = new Point(clientX, clientY);
			this.source.last().moveX = this.initMoveX + current.x - this.initMovingPoint.x;
			this.source.last().moveY = this.initMoveY + current.y - this.initMovingPoint.y;

		} else if (this.mode == Mode.Panning) {
			this.view.panX = this.initPanningX + (clientX - this.initPanningPoint.x); 
			this.view.panY = this.initPanningY + (clientY - this.initPanningPoint.y); 

		} else {
			this.source.last().record(clientX - this.view.panX, clientY - this.view.panY);
		}

		this.syncer.send();
		this.drawer.redraw(true);
	}

	startTyping(clientX: number, clientY: number) {
		this.source.start(clientX - this.view.panX, clientY - this.view.panY);
		this.source.last().shape = Shape.Text;
		this.drawer.redraw(true);
	}
	
	startDrawing(clientX: number, clientY: number) {
		this.source.start(clientX - this.view.panX, clientY - this.view.panY);
		this.mode = Mode.Drawing;
	}

	startErasing(clientX: number, clientY: number) {
		if (this.source.isEmpty())
			return;

		this.source.start(clientX - this.view.panX, clientY - this.view.panY);
		this.source.last().shape = Shape.Eraser;
		this.mode = Mode.Drawing;
	}

	startCloning(clientX: number, clientY: number) {
		var newItem = this.source.last().clone();
		this.source.push(newItem);

		this.startMoving(clientX, clientY);
	}

	startDrawingSteps(clientX: number, clientY: number) {
		if (this.mode == Mode.None) {
			this.mode = Mode.DrawingSteps;
			this.source.start(clientX - this.view.panX, clientY - this.view.panY);
			this.source.last().record(clientX - this.view.panX, clientY - this.view.panY);

		} else if (this.mode == Mode.DrawingSteps) {
			this.source.last().record(clientX - this.view.panX, clientY - this.view.panY);
		}
	}

	startMoving(clientX: number, clientY: number) {
		this.mode = Mode.Moving;
		this.initMovingPoint = new Point(clientX, clientY);
		this.initMoveX = this.source.last().moveX;
		this.initMoveY = this.source.last().moveY;
	}

	startPanning(clientX: number, clientY: number) {
		this.mode = Mode.Panning;
		this.initPanningPoint = new Point(clientX, clientY);
		this.initPanningX = this.view.panX;
		this.initPanningY = this.view.panY;
	}

	startScaling(clientX: number, clientY: number) {
		this.mode = Mode.Scaling;

		var item = this.source.last();
		var bounds = Utility.getBounds(item.raw);
		this.initScaleDistance = Utility.distance(new Point(bounds.centerX + item.moveX, bounds.centerY + item.moveY), new Point(clientX, clientY));
		this.initScale = this.source.last().sizeK;
	}

	syncUpHtmlStateDown(e: KeyboardEvent) {
		var char = String.fromCharCode(e.which).toLowerCase();

		if (char == ' ' && this.mode == Mode.None) {
			this.mode = Mode.PreparingToPan;
		}

		else if (this.mode == Mode.DrawingSteps && !e.ctrlKey && !e.shiftKey) {
			this.source.last().raw.pop(); // Clean up after moving
			this.mode = Mode.None;
		}		

		$('html').attr('class', this.getHtmlClass(e));
	}

	syncUpHtmlStateUp(e: KeyboardEvent) {
		var char = String.fromCharCode(e.which).toLowerCase();

		if (char == ' ' && this.mode == Mode.PreparingToPan) {
			this.mode = Mode.None;
		}
		else if (this.mode == Mode.DrawingSteps && !e.ctrlKey && !e.shiftKey) {
			this.source.last().raw.pop(); // Clean up after moving
			this.mode = Mode.None;
		}		

		$('html').attr('class', this.getHtmlClass(e));
	}

	getHtmlClass(e: KeyboardEvent): string {
		var html = '';

		if (this.mode == Mode.PreparingToPan) 
			html = 'mode-preparing2pan';

		if (this.mode == Mode.Panning) 
			html = 'mode-panning';

		if (e.ctrlKey && e.shiftKey)
			html = 'mode-steps';
		else if (e.ctrlKey)
			html = 'mode-scaling';
		else if (e.shiftKey)
			html = 'mode-moving';
		else if (e.altKey)
			html = 'mode-cloning';

		return html;
	}

	textTyping(e: KeyboardEvent) {
		var last = this.source.last();
		if (last == null || last.shape != Shape.Text) return;

		var char: string = window.keysight(e).char;
		if (char == '\b' || char == 'delete') {
			if (last.text == '') {
				this.source.removeLast();
				this.syncer.send();
				this.drawer.redraw(false);
				return;
			}

			if (last.text.length > 0) {
				last.text = last.text.substr(0, last.text.length - 1);
			}

			this.syncer.send();
			this.drawer.redraw(false);
			return;
		} else if (window.keysight.unprintableKeys.indexOf(char) != -1) {
			return;
		}

		if (e.shiftKey) {
			char = char.toUpperCase();
		}

		last.text += char;

		this.syncer.send();
		this.drawer.redraw(false);
	}

	generalHotkeys(e: KeyboardEvent) {
		if (this.source.last() == null ||
			this.source.last().shape == Shape.Text) return;

		var c = String.fromCharCode(e.which).toLowerCase();

		if (e.which == 8 || e.which == 46) { // backspace or delete
			this.syncer.deleteAndSend();
			this.drawer.redraw(false);
			return;
		}

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
			
			this.syncer.send();
			this.drawer.redraw(false);
			return;
		}

		if (c == 'r' && e.ctrlKey) {
			return;
		}

		switch(c) {
			case 'x': this.clearAll(); break;
			case 'r': this.switchShape(Shape.Rectangle); break;
			case 'o': this.switchShape(Shape.Original); break;
			case 'c': this.switchShape(Shape.Circle); break;
			case 'e': this.switchShape(Shape.Ellipse); break;
			case 'h': this.switchShape(Shape.Human); break;
			case 'k': this.switchShape(Shape.StraightLine); break; 
			case 'l':
				var item = this.source.last();
				if (item.shape == Shape.SmoothLine || e.shiftKey)
					this.switchShape(Shape.Line);
				else
					this.switchShape(Shape.SmoothLine);
				break;
		}

		this.syncer.send();
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