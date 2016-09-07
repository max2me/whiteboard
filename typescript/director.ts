declare var $:any;

enum Mode {
	Drawing,
	DrawingSteps,
	Scaling,
	Moving,
	None
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

	connection: any;

	init() {
		var self = this;
		self.mode = Mode.None;

		$('html')
			.keydown(self.generalHotkeys.bind(this))
			.keydown(self.textTyping.bind(this))
			.keydown(self.modifierKeyDown.bind(this))
			.keyup(self.modifierKeyUp.bind(this));

		$('#clear').click(this.clearAll.bind(this));
		$('#rectangle').click(this.switchToRect.bind(this));
		$('#original').click(this.switchToOriginal.bind(this));
		$('#circle').click(this.switchToCircle.bind(this));
		$('#ellipse').click(this.switchToEllipse.bind(this));
		$('#line').click(this.switchToLine.bind(this));
		$('#line-straight').click(this.switchToStraightLine.bind(this));

		$('canvas').on('contextmenu', () => {
			return false;
		});

		this.source = new Source();
		this.el = document.getElementById('c');
		this.drawer = new Drawer(this.el, this.source);

		this.connection = $.connection('/r');
		this.connection.received(function(data: any) {
			var item = JSON.parse(data.Json);
			if (data.Type == 'Delete') {
				var indexToDelete = -1;
				for(var i = 0; i < self.source.items.length; i++) {
					if (self.source.items[i].id == item.id) {
						indexToDelete = i;
						break;
					}
				}

				if (indexToDelete != -1) {
					self.source.items.splice(indexToDelete, 1);
					self.drawer.redraw(false);
					return;
				}
			}
			
			var replaced = false;
			for(var i = 0; i < self.source.items.length; i++) {
				var k = self.source.items[i];
				if (k.id == item.id) {
					self.source.items[i] = item;
					replaced = true;
					break;
				}
			}

			if (!replaced) {
				self.source.push(item);
			}

			self.drawer.redraw(false);
		});

		this.connection.error(function(error: any) {
			console.warn(error);
		});

		this.connection.start(function() {
		});

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
					self.initScaleDistance = self.distance(new Point(bounds.centerX + item.moveX, bounds.centerY + item.moveY), new Point(e.clientX, e.clientY));
					self.initScale = self.source.last().sizeK;

				} else if (e.shiftKey && !self.source.isEmpty()) {
					self.mode = Mode.Moving;
					self.initMovingPoint = new Point(e.clientX, e.clientY);
					self.initMoveX = self.source.last().moveX;
					self.initMoveY = self.source.last().moveY;

				} else if (e.altKey && !self.source.isEmpty()) {
					self.mode = Mode.Moving;

					var newItem = self.source.last().clone();
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

				self.send();

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
					var distance = self.distance(new Point(bounds.centerX + item.moveX, bounds.centerY + item.moveY), new Point(e.clientX, e.clientY));
					
					item.sizeK = self.initScale * distance / self.initScaleDistance;
				
				} else if (self.mode == Mode.Moving) {
					var current = new Point(e.clientX, e.clientY);
					self.source.last().moveX = self.initMoveX + current.x - self.initMovingPoint.x;
					self.source.last().moveY = self.initMoveY + current.y - self.initMovingPoint.y;

				} else {
					self.source.last().record(e.clientX, e.clientY);
				}

				self.send();
				self.drawer.redraw(true);
			})

			.mouseup(() => {
				if (self.mode == Mode.DrawingSteps) {
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
				self.send();
				return false;
			})

			.dblclick((e: MouseEvent) => {
				self.source.start(e.clientX, e.clientY);
				self.source.last().shape = Shape.Text;
				self.send();
				self.drawer.redraw(true);				

				return false;
			});
	}

	send() {
		this.connection.send({
			Type: 'Broadcast',
			Json: JSON.stringify(this.source.last())
		});
	}

	deleteAndSend() {
		this.connection.send({
			Type: 'Delete',
			Json: JSON.stringify(this.source.last())
		});

		this.source.removeLast();
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

	distance(p1: Point, p2: Point) {
		return Math.abs(Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)));
	}

	textTyping(e: KeyboardEvent) {
		var last = this.source.last();
		if (last == null || last.shape != Shape.Text) return;

		if (e.which == 8 || e.which == 46) {
			if (last.text == '') {
				this.source.removeLast();
				this.send();
				this.drawer.redraw(false);
				return;
			}

			if (last.text.length > 0) {
				last.text = last.text.substr(0, last.text.length - 1);
			}

			this.send();
			this.drawer.redraw(false);
			return;
		}
		
		var char = String.fromCharCode(e.which).toLowerCase();
		if (e.shiftKey)
			char = char.toUpperCase();

		last.text += char;

		this.send();
		this.drawer.redraw(false);
	}

	generalHotkeys(e: KeyboardEvent) {
		if (this.source.last() == null ||
			this.source.last().shape == Shape.Text) return;

		var c = String.fromCharCode(e.which).toLowerCase();

		if (e.which == 8 || e.which == 46) { // backspace or delete
			this.deleteAndSend();
			this.drawer.redraw(false);
			return;
		}

		if (e.which == 38) {
			this.source.last().sizeK *= 1.05;
			this.send();
			this.drawer.redraw(false);
		}

		if (e.which == 40) {
			this.source.last().sizeK *= 0.95;
			this.send();
			this.drawer.redraw(false);
		}

		//console.log(c, e.which);

		if (e.which == 39) { // ARROW RIGHT
			var item = this.source.last();
			item.lineArrowEnd = !item.lineArrowEnd;

			if (item.shape != Shape.Line && item.shape != Shape.SmoothLine && item.shape != Shape.StraightLine) {
				item.shape = Shape.SmoothLine;
			}
			
			this.send();
			this.drawer.redraw(false);
			return;
		}

		if (e.which == 37) { // ARROW LEFT
			var item = this.source.last();
			item.lineArrowStart = !item.lineArrowStart;

			if (item.shape != Shape.Line && item.shape != Shape.SmoothLine && item.shape != Shape.StraightLine) {
				item.shape = Shape.SmoothLine;
			}
			
			this.send();
			this.drawer.redraw(false);
			return;
		}

		if (c == 'r' && e.ctrlKey) {
			return;
		}

		switch(c) {
			case 'r': this.switchToRect(); break;
			case 'x': this.clearAll(); break;
			case 'o': this.switchToOriginal(); break;
			case 'c': this.switchToCircle(); break;
			case 'e': this.switchToEllipse(); break;
			case 'k': this.switchToStraightLine(); break; 
			case 'l':
				var item = this.source.last();
				if (item.shape == Shape.SmoothLine || e.shiftKey)
					this.switchToLine();
				else
					this.switchToSmoothLine();
				break;
		}

		this.send();
	}

	switchToRect() {
		if (this.source.isEmpty())
			return;

		this.source.last().shape = Shape.Rectangle;
		this.drawer.redraw(false);
	}

	switchToLine() {
		if (this.source.isEmpty()) 
			return;

		this.source.last().shape = Shape.Line;
		this.drawer.redraw(false);
	}

	switchToSmoothLine() {
		if (this.source.isEmpty())
			return;

		this.source.last().shape = Shape.SmoothLine;
		this.drawer.redraw(false);
	}

	switchToStraightLine() {
		if (this.source.isEmpty())
			return;

		this.source.last().shape = Shape.StraightLine;
		this.drawer.redraw(false);
	}

	clearAll() {
		this.source.items = [];
		this.drawer.redraw(false);
	}

	switchToOriginal(){
		if (this.source.isEmpty())
			return;

		this.source.last().shape = Shape.Original;
		this.drawer.redraw(false);
	}

	switchToCircle() {
		if (this.source.isEmpty())
			return;

		this.source.last().shape = Shape.Circle;
		this.drawer.redraw(false);
	}

	switchToEllipse() {
		if (this.source.isEmpty())
			return;

		this.source.last().shape = Shape.Ellipse;
		this.drawer.redraw(false);
	}
}