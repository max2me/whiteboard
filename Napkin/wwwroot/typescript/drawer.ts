class Drawer {
	ctx: CanvasRenderingContext2D;
	el: HTMLCanvasElement;
	source: Source;
	view: View;
	activeDrawing: boolean;

	original: Drawers.Original;
	shapes: Drawers.Shapes;
	lines: Drawers.Lines;
	text: Drawers.Text;

	constructor(el: any, source: Source, view: View) {
		this.el = el;
		this.source = source;
		this.view = view;

		this.ctx = el.getContext('2d');
		this.ctx.lineJoin = this.ctx.lineCap = 'round';

		this.setupCanvas(this.ctx);
		
		this.original = new Drawers.Original(this.ctx);
		this.shapes = new Drawers.Shapes(this.ctx);
		this.lines = new Drawers.Lines(this.ctx);
		this.text = new Drawers.Text(this.ctx);
	}

	setupCanvas(context: CanvasRenderingContext2D) {
		var visibleH = $('body').height();
		var visibleW = $('body').width() - $('.actions').width();
		var ratio = this.getRatio(context);

		this.el.width = visibleW * ratio;
        this.el.height = visibleH * ratio;

        this.el.style.width = visibleW + 'px';
        this.el.style.height = visibleH + 'px';

        // now scale the context to counter
        // the fact that we've manually scaled
        // our canvas element
        context.scale(ratio, ratio);
	}

	getRatio(context: any): number {
		var devicePixelRatio = window.devicePixelRatio || 1,
		backingStoreRatio = context.webkitBackingStorePixelRatio ||
		context.mozBackingStorePixelRatio ||
		context.msBackingStorePixelRatio ||
		context.oBackingStorePixelRatio ||
		context.backingStorePixelRatio || 1,

		ratio = devicePixelRatio / backingStoreRatio;

		return ratio;
	}

	redraw(activeDrawing: boolean) {
		this.clear();
		this.activeDrawing = activeDrawing;

		var list = this.consolidateSource(this.source.items);

		for(var i = 0; i < list.length; i++) {
			var item = list[i];
			var last = i == list.length - 1;

			var bounds = Utility.getBounds(item.raw);
			var itemCenter = new Point(bounds.centerX, bounds.centerY);
			var canvasCenter = new Point(0, 0);

			item.raw = Transform.scale(item.raw, canvasCenter, this.view.zoom, this.view.zoom);
			item.raw = Transform.move(item.raw, this.view.panX * this.view.zoom, this.view.panY * this.view.zoom);
			

			switch(item.shape) {
				case Shape.Original: 
					this.original.original(item, last);
					break;

				case Shape.Rectangle:
					this.shapes.rectangle(item, last);
					break;

				case Shape.Circle:
					this.shapes.circle(item, last);	
					break;

				case Shape.Ellipse:
					this.shapes.ellipse(item, last);
					break;

				case Shape.Human:
					this.shapes.human(item, last);
					break;

				case Shape.Line:
					this.lines.segment(item, last);
					break;

				case Shape.SmoothLine:
					this.lines.smooth(item, last);
					break;

				case Shape.StraightLine:
					this.lines.straight(item, last);
					break;

				case Shape.Text:
					this.text.text(item, last, this.view.zoom);
					break;

				case Shape.Eraser:
					this.drawEraser(item, last);
					break;				
			}


			this.lines.drawArrowsIfNeeded(item, last);
		}
	}

	drawEraser(item: Item, last: boolean) {
		this.ctx.lineWidth = 30;
		this.ctx.lineJoin = this.ctx.lineCap = 'round';
		this.ctx.strokeStyle = this.activeDrawing && last ? '#F9F9F9' : '#FFFFFF';
		this.ctx.shadowColor = 'transparent';

		this.ctx.beginPath();
		this.ctx.moveTo(item.raw[0].x, item.raw[0].y);

		for(var j = 1; j < item.raw.length; j++) {
			this.ctx.lineTo(item.raw[j].x, item.raw[j].y);
		}

		this.ctx.stroke();
	}


	clear() {
		this.ctx.clearRect(0, 0, this.el.width, this.el.height);
	}

	consolidateSource(originalItems: Item[]): Item[] {
		const unfilteredList = Utility.clone(originalItems);
		const result: Item[] = [];

		for (var i = 0; i < unfilteredList.length; i++) {
			var item = unfilteredList[i];
			if (item.shape == Shape.Delete) {
				result.pop();
			} else {
				result.push(item);
			}
		}

		return result;
	}
}

interface CanvasRenderingContext2D {
	ellipse(x: number, y: number, radiusx: number, radiusy: number, rotation: number, start: number, end: number, clockwise: boolean) : void;
}

interface Window {
	simplify(points: Point[], tolerance: number, highestQuality: boolean): Point[];
}