class Drawer {
	ctx: CanvasRenderingContext2D;
	el: HTMLCanvasElement;

	constructor(el: any) {
		this.el = el;
		this.ctx = el.getContext('2d');
		this.ctx.lineJoin = this.ctx.lineCap = 'round';

		this.el.width =$('body').width();
		this.el.height = $('body').height();
	}

	redraw(source: Source) {
		this.clear();

		for(var i = 0; i < source.items.length; i++) {
			var item = source.items[i];

			var thinStroke = item.shape != Shape.Line 
								&& item.shape != Shape.StraightLine 
								&& item.shape != Shape.Original;

			var last = i == source.items.length - 1;

			if (thinStroke)
				this.drawItem(item, -2, -2, last);

			this.drawItem(item, -1, -1, last);
			this.drawItem(item, 0, 0, last);
			this.drawItem(item, 1, 1, last);
			
			if (thinStroke)
				this.drawItem(item, 2, 2, last);
		}
	}

	drawItem(item: Item, shiftX: number, shiftY: number, last: boolean) {
		this.setupStroke(item, last);

		switch(item.shape) {
			case Shape.Original:
				this.drawOriginal(item, shiftX, shiftY);
				break;

			case Shape.Rectangle:
				this.drawRect(item, shiftX, shiftY);
				break;

			case Shape.Circle:
				this.drawCircle(item, shiftX, shiftY);	
				break;

			case Shape.Ellipse:
				this.drawEllipse(item, shiftX, shiftY);
				break;

			case Shape.Line:
				this.drawLine(item, shiftX, shiftY);
				break;

			case Shape.StraightLine:
				this.drawStraightLine(item, shiftX, shiftY);
				break;
		}
	}

	drawOriginal(item: Item, shiftX: number, shiftY: number) {
		this.ctx.beginPath();
		this.ctx.moveTo(item.raw[0].x + shiftX, item.raw[0].y + shiftY);

		for(var j = 1; j < item.raw.length; j++) {
			this.ctx.lineTo(item.raw[j].x + shiftX, item.raw[j].y + shiftY);
		}

		this.ctx.stroke();
	}

	drawLine(item: Item, shiftX: number, shiftY: number) {
		this.ctx.beginPath();

		var pts = window.simplify(item.raw, 20, true);

		this.ctx.moveTo(pts[0].x + shiftX, pts[0].y + shiftY);
		for(var j = 1; j < pts.length; j++) {
			this.ctx.lineTo(pts[j].x + shiftX, pts[j].y + shiftY);
		}

		this.ctx.stroke();
	}

	drawStraightLine(item: Item, shiftX: number, shiftY: number) {
		this.ctx.beginPath();

		this.ctx.moveTo(item.raw[0].x + shiftX, item.raw[0].y + shiftY);
		this.ctx.lineTo(item.raw[item.raw.length - 1].x + shiftX, item.raw[item.raw.length - 1].y + shiftY);

		this.ctx.stroke();
	}

	drawRect(item: Item, shiftX: number, shiftY: number) {
		var b = this.getBounds(item.raw);
  
		this.ctx.beginPath();
		this.ctx.moveTo(b.xmin + shiftX, b.ymin + shiftY);
		this.ctx.lineTo(b.xmax + shiftX, b.ymin + shiftY);
		this.ctx.lineTo(b.xmin + shiftX, b.ymin + shiftY);
		this.ctx.stroke();
	}

	drawCircle(item: Item, shiftX: number, shiftY: number) {
		var b = this.getBounds(item.raw);
  
		this.ctx.beginPath();
		
		var x = (b.xmax - b.xmin)/2 + b.xmin;
		var y = (b.ymax - b.ymin)/2 + b.ymin;
		
		var radiusX = (b.xmax-b.xmin)/2;
		var radiusY = (b.ymax-b.ymin)/2;
		var radius = Math.min(radiusX, radiusY);
		
		this.ctx.arc(x + shiftX, y + shiftY, radius, 0, 2 * Math.PI, false);
		this.ctx.stroke();
	}

	drawEllipse(item: Item, shiftX: number, shiftY: number) {
		var b = this.getBounds(item.raw);
		
		var x = (b.xmax - b.xmin)/2 + b.xmin;
		var y = (b.ymax - b.ymin)/2 + b.ymin;
		
		var radiusX = (b.xmax-b.xmin)/2;
		var radiusY = (b.ymax-b.ymin)/2;
		var radius = Math.min(radiusX, radiusY);
		 
		this.ctx.beginPath();
		this.ctx.ellipse(x + shiftX, y + shiftY, radiusX, radiusY, 0, 0, 2 * Math.PI, false);
		this.ctx.stroke();
	}

	setupStroke(item: Item, last: boolean) {
		this.ctx.globalAlpha = 1;
		this.ctx.lineWidth = 4;
		this.ctx.lineJoin = this.ctx.lineCap = 'round';
		this.ctx.strokeStyle = last ? 'purple' : '#000';
	}

	getBounds(coords: Point[]){
		var xmin = 1000, xmax = 0, ymin = 1000, ymax = 0;
		
		for(var i = 0; i < coords.length; i++) {
			var p = coords[i];
			if (p.x < xmin) xmin = p.x;
			if (p.x > xmax) xmax = p.x;
			if (p.y < ymin) ymin = p.y;
			if (p.y > ymax) ymax = p.y;
		}
		
		return {
			xmin: xmin,
			xmax: xmax,
			ymin: ymin,
			ymax: ymax
		}
	}


	clear() {
		this.ctx.clearRect(0, 0, this.el.width, this.el.height);
	}
}

interface CanvasRenderingContext2D {
	ellipse(x: number, y: number, radiusx: number, radiusy: number, rotation: number, start: number, end: number, clockwise: boolean) : void;
}

interface Window {
	simplify(points: Point[], tolerance: number, highestQuality: boolean): Point[];
}