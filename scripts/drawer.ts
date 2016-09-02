class Drawer {
	ctx: CanvasRenderingContext2D;
	el: HTMLCanvasElement;
	source: Source;
	activeDrawing: boolean;

	constructor(el: any, source: Source) {
		this.el = el;
		this.source = source;

		this.ctx = el.getContext('2d');
		this.ctx.lineJoin = this.ctx.lineCap = 'round';

		this.el.width =$('body').width();
		this.el.height = $('body').height();
	}

	redraw(activeDrawing: boolean) {
		this.clear();
		this.activeDrawing = activeDrawing;

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

			if (item.lineArrowEnd &&
				(item.shape == Shape.Original ||
				item.shape == Shape.Line ||
				item.shape == Shape.SmoothLine || 
				item.shape == Shape.StraightLine)) {
				this.drawArrow(item, shiftX, shiftY);
			}

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

			case Shape.SmoothLine:
				this.drawSmoothLine(item, shiftX, shiftY);
				break;

			case Shape.StraightLine:
				this.drawStraightLine(item, shiftX, shiftY);
				break;

			case Shape.Text:
				this.drawText(item, shiftX, shiftY, last);
				break;

			case Shape.Eraser:
				this.drawEraser(item, shiftX, shiftY, last);
				break;
		}
	}

	drawEraser(item: Item, shiftX: number, shiftY: number, last: boolean) {
		this.ctx.lineWidth = 30;
		this.ctx.lineJoin = this.ctx.lineCap = 'round';
		this.ctx.strokeStyle = this.activeDrawing ? '#F9F9F9' : '#FFFFFF';
		this.ctx.shadowColor = 'transparent';

		this.ctx.beginPath();
		this.ctx.moveTo(item.raw[0].x + shiftX, item.raw[0].y + shiftY);

		for(var j = 1; j < item.raw.length; j++) {
			this.ctx.lineTo(item.raw[j].x + shiftX, item.raw[j].y + shiftY);
		}

		this.ctx.stroke();
	}

	drawText(item: Item, shiftX: number, shiftY: number, last: boolean) {
		this.ctx.font = "30px 	'Permanent Marker'";
		this.ctx.fillStyle = 'black';
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

		var temp: Point[] = Utility.shiftPoints(item.raw, shiftX, shiftY);		
		var pts = window.simplify(temp, 20, true);

		this.ctx.moveTo(pts[0].x, pts[0].y);

		for(var j = 1; j < pts.length; j++) {
			this.ctx.lineTo(pts[j].x, pts[j].y);
		}

		this.ctx.stroke();
	}

	drawArrow(item: Item, shiftX: number, shiftY: number) {
		var p2 = item.raw[item.raw.length - 1];
		var p1 = item.raw[item.raw.length - 2];

		var dist = Utility.distance(p1, p2);

		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = '#0000ff';

		var angle = Math.acos((p2.y - p1.y) / dist);

		if (p2.x < p1.x) angle = 2 * Math.PI - angle;

		var size = 15;

		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.translate(p2.x - shiftX, p2.y - shiftY);
		this.ctx.rotate(-angle);

		this.ctx.lineWidth = 4;
		this.ctx.strokeStyle = '#000000';
		
		this.ctx.moveTo(0, 0);
		this.ctx.lineTo(size/2, -size);
		this.ctx.stroke();
		
		this.ctx.moveTo(0, 0);
		this.ctx.lineTo(-size/2, -size);
		this.ctx.stroke();
		
		this.ctx.restore();
	}

	drawSmoothLine(item: Item, shiftX: number, shiftY: number) {
		this.ctx.beginPath();

		var temp: Point[] = Utility.shiftPoints(item.raw, shiftX, shiftY);
		var pts = window.simplify(temp, 20, true);

		var cps:Point[] = []; // There will be two control points for each "middle" point, 1 ... len-2e

		for (var i = 0; i < pts.length - 2; i += 1) {
			cps = cps.concat(
				Utility.controlPoints(
						pts[i], 
						pts[i+1], 
						pts[i+2]
					)
				);
		}
		
		this.drawCurvedPath(cps, pts);
	}	

	private drawCurvedPath(cps: Point[], pts: Point[]){
		var len = pts.length;
		if (len < 2) return;

		if (len == 2) {
			this.ctx.beginPath();
			this.ctx.moveTo(pts[0].x, pts[0].y);
			this.ctx.lineTo(pts[1].x, pts[1].y);
			this.ctx.stroke();
		
		} else {
			this.ctx.beginPath();
			this.ctx.moveTo(pts[0].x, pts[0].y);
			
			// from point 0 to point 1 is a quadratic
			this.ctx.quadraticCurveTo(cps[0].x, cps[0].y, pts[1].x, pts[1].y);
			
			// for all middle points, connect with bezier
			for (var i = 2; i < len-1; i += 1) {
				this.ctx.bezierCurveTo(
						cps[2*(i-1)-1].x, cps[2*(i-1)-1].y,
						cps[2*(i-1)].x, cps[2*(i-1)].y,
						pts[i].x, pts[i].y);
			}

			this.ctx.quadraticCurveTo(cps[(2*(i-1)-1)].x, cps[(2*(i-1)-1)].y, pts[i].x, pts[i].y);
			this.ctx.stroke();			
		}
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