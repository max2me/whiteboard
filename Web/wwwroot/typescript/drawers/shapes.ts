namespace Drawers {
	export class Shapes extends Base {
		rectangle(item: Item, last: boolean) {
			this.setupStroke(item, last);
			
			var b = Utility.getBounds(item.raw);
	
			this.ctx.beginPath();
			this.ctx.moveTo(b.xmin, b.ymin);
			this.ctx.lineTo(b.xmax, b.ymin);
			this.ctx.lineTo(b.xmax - 0, b.ymax); // Tilt it a little
			this.ctx.lineTo(b.xmin - 0, b.ymax); // Tilt it a little
			this.ctx.lineTo(b.xmin, b.ymin);
			this.ctx.stroke();
		}

		human(item: Item, last: boolean) {
			this.setupStroke(item, last);

			var b = Utility.getBounds(item.raw);

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

		circle(item: Item, last: boolean) {
			this.setupStroke(item, last);

			var b = Utility.getBounds(item.raw);
	
			this.ctx.beginPath();
			
			var x = (b.xmax - b.xmin)/2 + b.xmin;
			var y = (b.ymax - b.ymin)/2 + b.ymin;
			
			var radiusX = (b.xmax-b.xmin)/2;
			var radiusY = (b.ymax-b.ymin)/2;
			var radius = Math.min(radiusX, radiusY);
			
			this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
			this.ctx.stroke();
		}

		ellipse(item: Item, last: boolean) {
			this.setupStroke(item, last);
			
			var b = Utility.getBounds(item.raw);
			
			var x = (b.xmax - b.xmin)/2 + b.xmin;
			var y = (b.ymax - b.ymin)/2 + b.ymin;
			
			var radiusX = (b.xmax-b.xmin)/2;
			var radiusY = (b.ymax-b.ymin)/2;
			var radius = Math.min(radiusX, radiusY);
			
			this.ctx.beginPath();
			this.ctx.ellipse(x, y, radiusX, radiusY, 0, 0, 2 * Math.PI, false);
			this.ctx.stroke();
		}

	}
}