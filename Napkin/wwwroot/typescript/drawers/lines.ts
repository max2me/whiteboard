namespace Drawers {
	export class Lines extends Base {
		segment(item: Item, last: boolean) {
			this.setupStroke(item, last);

			this.ctx.beginPath();
		
			var pts = window.simplify(item.raw, 20, true);

			this.ctx.moveTo(pts[0].x, pts[0].y);

			for(var j = 1; j < pts.length; j++) {
				this.ctx.lineTo(pts[j].x, pts[j].y);
			}

			this.ctx.stroke();
		}

		arrow(points: Point[], to: boolean, fromArrow: boolean, last: boolean) {
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

		smooth(item: Item, last: boolean) {
			this.setupStroke(item, last);

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

		straight(item: Item, last: boolean) {
			this.setupStroke(item, last);
			this.ctx.beginPath();

			this.ctx.moveTo(item.raw[0].x, item.raw[0].y);
			this.ctx.lineTo(item.raw[item.raw.length - 1].x, item.raw[item.raw.length - 1].y);

			this.ctx.stroke();
		}

		drawArrowsIfNeeded(item: Item, last: boolean) {
			if (item.shape == Shape.Original ||
				item.shape == Shape.Line ||
				item.shape == Shape.SmoothLine || 
				item.shape == Shape.StraightLine) {
				var points = item.raw;

				if (item.shape == Shape.StraightLine) 
					points = [points[0], points[points.length - 1]];

				this.arrow(points, item.lineArrowEnd, item.lineArrowStart, last);
			}
		}

		private drawArrowBetweenPoints(p1: Point, p2: Point, last: boolean) {
			var deltaX = p2.x - p1.x;
			var deltaY = p2.y - p1.y;
			var angleInDegreees = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
			var angleInRadians = angleInDegreees * Math.PI / 180;

			var sizeX = 15;
			var sizeY = 10;
			var newPoint1 = this.rotatePoint(new Point(p2.x - sizeX, p2.y - sizeY), p2, angleInRadians);
			var newPoint2 = this.rotatePoint(new Point(p2.x - sizeX, p2.y + sizeY), p2, angleInRadians);

			

			this.ctx.lineWidth = 6;
			this.ctx.strokeStyle = last? '#777' : '#000000';
			
			this.ctx.moveTo(p2.x, p2.y);
			this.ctx.lineTo(newPoint1.x, newPoint1.y);
			this.ctx.stroke();

			this.ctx.moveTo(p2.x, p2.y);
			this.ctx.lineTo(newPoint2.x, newPoint2.y);
			this.ctx.stroke();
		}

		private rotatePoint(point: Point, origin: Point, angleInRadians: number) : Point {
			var dx = point.x - origin.x;
			var dy = point.y - origin.y;

			var x = dx * Math.cos(angleInRadians) - dy * Math.sin(angleInRadians) + origin.x;
			var y = dy * Math.cos(angleInRadians) + dx * Math.sin(angleInRadians) + origin.y;

			return new Point(x, y);
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
	}
}