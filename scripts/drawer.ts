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

			if (item.shape == Shape.Original)
				this.drawOriginal(item);

			else if (item.shape == Shape.Rectangle) 
				this.drawRect(item);

			else if (item.shape == Shape.Circle) 
				this.drawCircle(item);
		}
	}

	drawOriginal(item: Item) {
		this.ctx.beginPath();  
		this.setupStroke();
		this.ctx.moveTo(item.raw[0].x, item.raw[0].y);

		for(var j = 1; j < item.raw.length; j++) {
			this.ctx.lineTo(item.raw[j].x, item.raw[j].y);
		}

		this.ctx.stroke();
	}

	drawRect(item: Item) {
		var b = this.getBounds(item.raw);
  
		this.ctx.beginPath();  
		this.setupStroke();
		this.ctx.moveTo(b.xmin, b.ymin);
		this.ctx.lineTo(b.xmax, b.ymin);
		this.ctx.lineTo(b.xmax, b.ymax);
		this.ctx.lineTo(b.xmin, b.ymax);
		this.ctx.lineTo(b.xmin, b.ymin);
		this.ctx.stroke();
	}

	drawCircle(item: Item) {
		var b = this.getBounds(item.raw);
  
		this.ctx.beginPath();
		this.setupStroke();
		this.ctx.arc((b.xmax - b.xmin)/2 + b.xmin, 
				(b.ymax - b.ymin)/2 + b.ymin, 
				Math.min((b.xmax-b.xmin)/2, (b.ymax-b.ymin)/2), 0, 2 * Math.PI, false);
		this.ctx.stroke();
	}

	setupStroke() {
		this.ctx.globalAlpha = 1;
		this.ctx.lineWidth = 8;
		this.ctx.lineJoin = this.ctx.lineCap = 'round';
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