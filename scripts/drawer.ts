class Drawer {
	ctx: CanvasRenderingContext2D;
	el: HTMLCanvasElement;
	source: Source;

	constructor(el: any, source: Source) {
		this.el = el;
		this.source = source;

		this.ctx = el.getContext('2d');
		this.ctx.lineJoin = this.ctx.lineCap = 'round';

		this.el.width =$('body').width();
		this.el.height = $('body').height();
	}

	redraw() {
		this.clear();

		for(var i = 0; i < this.source.items.length; i++) {
			var item = this.source.items[i];
			var last = i == this.source.items.length - 1;

			this.ctx.save();
			var b = Drawer.getBounds(item.raw);
			var shiftX = b.centerX;
			var shiftY = b.centerY;
			
			this.ctx.translate(shiftX + item.moveX, shiftY + item.moveY);
			this.ctx.scale(item.sizeK, item.sizeK);
			
			this.drawItem(item, -shiftX, -shiftY, last);

			this.ctx.restore();
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

			case Shape.Text:
				this.drawText(item, shiftX, shiftY, last);
				break;
		}
	}

	drawText(item: Item, shiftX: number, shiftY: number, last: boolean) {
		this.ctx.font = "20px 	'Permanent Marker'";
		this.ctx.fillStyle = last ? 'purple' : 'black';
		this.ctx.fillText(item.text + (last ? '_' : ''), item.raw[0].x + shiftX, item.raw[0].y + shiftY);		
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
		var b = Drawer.getBounds(item.raw);
  
		this.ctx.beginPath();
		this.ctx.moveTo(b.xmin + shiftX, b.ymin + shiftY);
		this.ctx.lineTo(b.xmax + shiftX, b.ymin + shiftY);
		this.ctx.lineTo(b.xmax + shiftX - 0, b.ymax + shiftY); // Tilt it a little
		this.ctx.lineTo(b.xmin + shiftX - 0, b.ymax + shiftY); // Tilt it a little
		this.ctx.lineTo(b.xmin + shiftX, b.ymin + shiftY);
		this.ctx.stroke();
	}

	drawCircle(item: Item, shiftX: number, shiftY: number) {
		var b = Drawer.getBounds(item.raw);
  
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
		var b = Drawer.getBounds(item.raw);
		
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
		this.ctx.lineWidth = item.shape == Shape.Original ? 4 : 6;
		this.ctx.lineJoin = this.ctx.lineCap = 'round';
		this.ctx.strokeStyle = '#000';

		if (last) {
			this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
			this.ctx.shadowOffsetX = 0; 
			this.ctx.shadowOffsetY = 0;
			this.ctx.shadowBlur = 10;
		} else {
			this.ctx.shadowColor = 'transparent';
		}
	}

	static getBounds(coords: Point[]){
		if (coords.length == 1) {
			return {
				xmin: coords[0].x,
				xmax: coords[0].x,
				ymin: coords[0].y,
				ymax: coords[0].y,
				centerX: coords[0].x,
				centerY: coords[0].y
			}
		}

		var xmin = 1000000, xmax = 0, ymin = 1000000, ymax = 0;
		
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
			ymax: ymax,
			centerX: xmin + (xmax - xmin) / 2,
			centerY: ymin + (ymax - ymin) / 2
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