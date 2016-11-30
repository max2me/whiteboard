declare var $:any;
interface Window {
	keysight: any;
}

class Director {
	canvas: HTMLElement;
	source: Source;
	drawer: Drawer;
	syncer: Syncer;
	mode: Mode;
	view: View;

	initScalingPoint: Point;
	initMovingPoint: Point;
	initPanningPoint: Point;

	init() {
		var self = this;
		self.mode = Mode.None;

		$('html')
			.keydown(self.textTyping.bind(this))
			.keydown(self.generalHotkeys.bind(this))			
			.keydown(self.syncUpHtmlStateDown.bind(this))
			.keyup(self.syncUpHtmlStateUp.bind(this));

		$('canvas').on('contextmenu', () => {
			return false;
		});

		this.source = new Source();
		this.view = new View();
		this.canvas = document.getElementById('c');
		this.drawer = new Drawer(this.canvas, this.source, this.view);
		this.syncer = new Syncer(this.source, this.drawer, this);		

		this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
			e.preventDefault();
			self.interactionDown(e.clientX, e.clientY, e.ctrlKey, e.altKey, e.shiftKey, e.button);
		});

		this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
			self.interactionMove(e.clientX, e.clientY, e.ctrlKey, e.altKey, e.shiftKey, e.button);
		});

		this.canvas.addEventListener('mouseup', (e: MouseEvent) => {
			e.preventDefault();
			self.interactionUp();
		});

		this.canvas.addEventListener('dblclick', (e: MouseEvent) => {
			self.startTyping(e.clientX, e.clientY);
			return false;
		});

		this.canvas.addEventListener('wheel', (e: WheelEvent) => {
			console.log('Cursor', e.clientX, e.clientY);
			this.logView('Old Zoom');
			
			var oldZoom = self.view.zoom;

			var k = e.deltaY < 0 ? 0.2 : - 0.2;
			
			var oldZoom = self.view.zoom;
			var newZoom = oldZoom + k;

			self.view.panX = this.calculatePan(e.clientX, this.view.panX, oldZoom, newZoom); 
			self.view.panY = this.calculatePan(e.clientY, this.view.panY, oldZoom, newZoom); 
			self.view.zoom = newZoom;

			this.logView('New Zoom');
			console.log('-');
			
			self.drawer.redraw(false);
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

		$('#a-delete').click(() => {
			this.deleteAndSync();
			this.drawer.redraw(false);
		});

		$('#a-original').click(() => {
			this.switchShape(Shape.Original);
			this.drawer.redraw(false);
		});

		$('#a-circle').click(() => {
			this.switchShape(Shape.Circle);
			this.drawer.redraw(false);
		});

		$('#a-ellipse').click(() => {
			this.switchShape(Shape.Ellipse);
			this.drawer.redraw(false);
		});

		$('#a-rectangle').click(() => {
			this.switchShape(Shape.Rectangle);
			this.drawer.redraw(false);
		});

		$('#a-human').click(() => {
			this.switchShape(Shape.Human);
			this.drawer.redraw(false);
		});
	}

	logView(description: string) {
		console.log(description, Math.round(this.view.panX * 100) / 100, Math.round(this.view.panY * 100) / 100, this.view.zoom);
	}

	calculatePan(point: number, oldPan: number, oldZoom: number, newZoom: number): number {
		return (oldPan * oldZoom + point * oldZoom - point * newZoom) / newZoom;
		// return (point * newZoom - point * oldZoom + oldPan * oldZoom) / newZoom;
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
			item.record(this.normalize(clientX, clientY));
			this.drawer.redraw(true);

		} else if (this.mode == Mode.Scaling) {
			this.scale(clientX, clientY);
		
		} else if (this.mode == Mode.Moving) {
			this.move(clientX, clientY);

		} else if (this.mode == Mode.Panning) {
			this.pan(clientX, clientY);

		} else {
			this.source.last().record(this.normalize(clientX, clientY));
		}

		this.syncer.send();
		this.drawer.redraw(true);
	}

	startTyping(clientX: number, clientY: number) {
		this.source.start(this.normalize(clientX, clientY));
		this.source.last().shape = Shape.Text;
		this.source.last().fontSizeK = 1 / this.view.zoom;
		this.drawer.redraw(true);
	}
	
	startDrawing(clientX: number, clientY: number) {
		this.source.start(this.normalize(clientX, clientY));
		this.mode = Mode.Drawing;
	}

	startErasing(clientX: number, clientY: number) {
		if (this.source.isEmpty())
			return;

		this.source.start(this.normalize(clientX, clientY));
		this.source.last().shape = Shape.Eraser;
		this.mode = Mode.Drawing;
	}

	startCloning(clientX: number, clientY: number) {
		var newItem = Utility.cloneItem(this.source.last());
		this.source.push(newItem);

		this.startMoving(clientX, clientY);
	}

	startDrawingSteps(clientX: number, clientY: number) {
		if (this.mode == Mode.None) {
			this.mode = Mode.DrawingSteps;
			this.source.start(this.normalize(clientX, clientY));
			this.source.last().record(this.normalize(clientX, clientY));

		} else if (this.mode == Mode.DrawingSteps) {
			this.source.last().record(this.normalize(clientX, clientY));
		}
	}

	// Moving
	startMoving(clientX: number, clientY: number) {
		this.mode = Mode.Moving;
		this.initMovingPoint = new Point(clientX, clientY);
	}

	move(clientX: number, clientY: number) {
		var current = new Point(clientX, clientY);

		var shiftX = clientX - this.initMovingPoint.x;
		var shiftY = clientY - this.initMovingPoint.y;

		this.source.last().raw = Transform.move(this.source.last().raw, shiftX / this.view.zoom, shiftY / this.view.zoom);
		
		this.initMovingPoint = current;
	}

	// Panning
	startPanning(clientX: number, clientY: number) {
		this.mode = Mode.Panning;
		this.initPanningPoint = new Point(clientX, clientY);
	}

	pan(clientX: number, clientY: number) {
		var current = new Point(clientX, clientY);

		var deltaX = (current.x - this.initPanningPoint.x) / this.view.zoom;
		var deltaY = (current.y - this.initPanningPoint.y) / this.view.zoom;
		this.initPanningPoint = current;

		this.logView('Old pan ' + deltaX);
		this.view.panX += deltaX; 
		this.view.panY += deltaY ;
		this.logView('New pan');
		console.log('-');
	}


	// Scaling
	startScaling(clientX: number, clientY: number) {
		this.mode = Mode.Scaling;
		this.initScalingPoint = this.normalize(clientX, clientY);
	}

	scale(clientX: number, clientY: number) {
		var current = this.normalize(clientX, clientY);
		var item = this.source.last();
		
		var bounds = Utility.getBounds(item.raw);
		var center = new Point(bounds.centerX, bounds.centerY);

		var oldDistance = Utility.distance(center, this.initScalingPoint);
		var newDistance = Utility.distance(center, current);
		
		var k = newDistance / oldDistance;

		item.raw = Transform.scale(item.raw, center, k, k);
		item.fontSizeK = item.fontSizeK * k;

		this.initScalingPoint = current;
	}

	// Keyboard-related
	textTyping(e: KeyboardEvent) {
		var last = this.source.last();
		if (last == null || last.shape != Shape.Text) return;

		var char: string = window.keysight(e).char;
		if (char == '\b' || char == 'delete') {
			if (last.text == '') {
				this.deleteAndSync();
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

	deleteAndSync() {
		var d = new DeleteItem();
		this.source.push(d);
		this.syncer.send(d);
	}

	generalHotkeys(e: KeyboardEvent) {
		if (this.source.last() == null ||
			this.source.last().shape == Shape.Text) return;

		var c = String.fromCharCode(e.which).toLowerCase();

		if (e.which == 8 || e.which == 46) { // backspace or delete
			this.deleteAndSync();
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

	// Helpers
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

	resetModeToNone() {
		this.mode = Mode.None;
		$('html').attr('class', '');
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

	normalize(x: number, y: number): Point {
		var newX = x / this.view.zoom - this.view.panX;
		var newY = y / this.view.zoom - this.view.panY;

		return new Point(newX, newY);
	}

	switchShape(shape: Shape) {
		if (this.source.isEmpty())
			return;

		this.source.last().shape = shape;
		this.drawer.redraw(false);
	}

	clearAll() {
		this.source.items = [];
		this.syncer.sendClearAll();
		this.drawer.redraw(false);
	}
}