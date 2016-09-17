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
			var item = Utility.clone(this.source.items[i]);
			var last = i == this.source.items.length - 1;

			var b = Drawer.getBounds(item.raw);
			item.raw = Transform.scale(item.raw, new Point(b.centerX, b.centerY), item.sizeK, item.sizeK);
			item.raw = Transform.move(item.raw, item.moveX, item.moveY);
			
			this.setupStroke(item, last);

			switch(item.shape) {
				case Shape.Original: 
					this.drawOriginal(item);
					break;

				case Shape.Rectangle:
					this.drawRect(item);
					break;

				case Shape.Circle:
					this.drawCircle(item);	
					break;

				case Shape.Ellipse:
					this.drawEllipse(item);
					break;

				case Shape.Line:
					this.drawLine(item);
					break;

				case Shape.SmoothLine:
					this.drawSmoothLine(item);
					break;

				case Shape.StraightLine:
					this.drawStraightLine(item);
					break;

				case Shape.Text:
					this.drawText(item, last);
					break;

				case Shape.Eraser:
					this.drawEraser(item, last);
					break;

				case Shape.Human:
					this.drawHuman(item);
					break;
			}


			if (item.shape == Shape.Original ||
				item.shape == Shape.Line ||
				item.shape == Shape.SmoothLine || 
				item.shape == Shape.StraightLine) {

				var points = item.raw;

				if (item.shape == Shape.StraightLine) 
					points = [points[0], points[points.length - 1]];

				this.drawArrow(points, item.lineArrowEnd, item.lineArrowStart, last);
			}
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

	drawText(item: Item, last: boolean) {
		this.ctx.font = "30px 	'Permanent Marker'";
		this.ctx.fillStyle = 'black';
		this.ctx.fillText(item.text + (last ? '_' : ''), item.raw[0].x, item.raw[0].y);		
	}

	drawOriginal(item: Item) {
		this.ctx.beginPath();
		this.ctx.moveTo(item.raw[0].x, item.raw[0].y);

		for(var j = 1; j < item.raw.length; j++) {
			this.ctx.lineTo(item.raw[j].x, item.raw[j].y);
		}

		this.ctx.stroke();
	}

	drawLine(item: Item) {
		this.ctx.beginPath();

	
		var pts = window.simplify(item.raw, 20, true);

		this.ctx.moveTo(pts[0].x, pts[0].y);

		for(var j = 1; j < pts.length; j++) {
			this.ctx.lineTo(pts[j].x, pts[j].y);
		}

		this.ctx.stroke();
	}

	drawArrow(points: Point[], to: boolean, fromArrow: boolean, last: boolean) {
		var distance = 20;

		if (to) {
			var p2 = points[points.length - 1];
			var p1 = points[points.length - 2];

			for(var i = points.length - 3; i >= 0; i--) {
				var p = points[i];
				if (Utility.distance(p2, p) >= distance) {
					p1 = p;
					break;
				}
			}

			this.drawArrowBetweenPoints(p1, p2, last);
		}

		if (fromArrow) {
			var p2 = points[0];
			var p1 = points[1];

			for(var i = 2; i < points.length; i++) {
				var p = points[i];
				if (Utility.distance(p2, p) >= distance) {
					p1 = p;
					break;
				}
			}

			this.drawArrowBetweenPoints(p1, p2, last);
		}
	}

	drawArrowBetweenPoints(p1: Point, p2: Point, last: boolean) {
		var dist = Utility.distance(p1, p2);
		var angle = Math.acos((p2.y - p1.y) / dist);

		if (p2.x < p1.x) angle = 2 * Math.PI - angle;

		var size = 15;

		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.translate(p2.x, p2.y);
		this.ctx.rotate(-angle);

		this.ctx.lineWidth = 6;
		this.ctx.strokeStyle = last? '#777' : '#000000';
		
		this.ctx.moveTo(0, 0);
		this.ctx.lineTo(size/2, -size);
		this.ctx.stroke();
		
		this.ctx.moveTo(0, 0);
		this.ctx.lineTo(-size/2, -size);
		this.ctx.stroke();
		
		this.ctx.restore();
	}

	drawSmoothLine(item: Item) {
		this.ctx.beginPath();

		var pts = window.simplify(item.raw, 20, true);

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



	drawStraightLine(item: Item) {
		this.ctx.beginPath();

		this.ctx.moveTo(item.raw[0].x, item.raw[0].y);
		this.ctx.lineTo(item.raw[item.raw.length - 1].x, item.raw[item.raw.length - 1].y);

		this.ctx.stroke();
	}

	drawRect(item: Item) {
		var b = Drawer.getBounds(item.raw);
  
		this.ctx.beginPath();
		this.ctx.moveTo(b.xmin, b.ymin);
		this.ctx.lineTo(b.xmax, b.ymin);
		this.ctx.lineTo(b.xmax - 0, b.ymax); // Tilt it a little
		this.ctx.lineTo(b.xmin - 0, b.ymax); // Tilt it a little
		this.ctx.lineTo(b.xmin, b.ymin);
		this.ctx.stroke();
	}

	drawHuman(item: Item) {
		var b = Drawer.getBounds(item.raw);
  
		

		var height = b.ymax - b.ymin;
		var headSize = height / 3 / 2;
		var headCenterX = b.centerX;
		var headCenterY = b.ymin + headSize;

		var bodyHeight = height / 3;
		var legsHeight = height / 3;

		var bodyStartY = headCenterY + headSize;
		var bodyEndY = headCenterY + headSize + bodyHeight;
		
		this.ctx.beginPath();
		this.ctx.arc(headCenterX, headCenterY, headSize, 0, 2 * Math.PI, false);
		this.ctx.stroke();
		
		// Body
		this.ctx.beginPath();
		this.ctx.moveTo(headCenterX, bodyStartY);
		this.ctx.lineTo(headCenterX, bodyEndY);
		this.ctx.stroke();

		// Legs
		this.ctx.beginPath();
		this.ctx.moveTo(headCenterX - headSize * 0.8, bodyEndY + legsHeight);
		this.ctx.lineTo(headCenterX, bodyEndY);
		this.ctx.lineTo(headCenterX + headSize * 0.8, bodyEndY + legsHeight);
		this.ctx.stroke();

		// Arms
		var armsKX = 1.1;
		var armsKY = 0.5;
		this.ctx.beginPath();
		this.ctx.moveTo(headCenterX - headSize * armsKX, bodyStartY + bodyHeight * armsKY);
		this.ctx.lineTo(headCenterX, bodyStartY + bodyHeight * armsKY / 2);
		this.ctx.lineTo(headCenterX + headSize * armsKX, bodyStartY + bodyHeight * armsKY);
		this.ctx.stroke();
	}

	drawCircle(item: Item) {
		var b = Drawer.getBounds(item.raw);
  
		this.ctx.beginPath();
		
		var x = (b.xmax - b.xmin)/2 + b.xmin;
		var y = (b.ymax - b.ymin)/2 + b.ymin;
		
		var radiusX = (b.xmax-b.xmin)/2;
		var radiusY = (b.ymax-b.ymin)/2;
		var radius = Math.min(radiusX, radiusY);
		
		this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
		this.ctx.stroke();
	}

	drawEllipse(item: Item) {
		var b = Drawer.getBounds(item.raw);
		
		var x = (b.xmax - b.xmin)/2 + b.xmin;
		var y = (b.ymax - b.ymin)/2 + b.ymin;
		
		var radiusX = (b.xmax-b.xmin)/2;
		var radiusY = (b.ymax-b.ymin)/2;
		var radius = Math.min(radiusX, radiusY);
		 
		this.ctx.beginPath();
		this.ctx.ellipse(x, y, radiusX, radiusY, 0, 0, 2 * Math.PI, false);
		this.ctx.stroke();
	}

	setupStroke(item: Item, last: boolean) {
		this.ctx.globalAlpha = 1;
		this.ctx.lineWidth = item.shape == Shape.Original ? 4 : 6;
		this.ctx.lineJoin = this.ctx.lineCap = 'round';
		this.ctx.strokeStyle = '#000';

		if (last) {
			this.ctx.strokeStyle = '#555';
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