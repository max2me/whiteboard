class Drawer {
	ctx: CanvasRenderingContext2D;
	el: HTMLCanvasElement;

	constructor(el: any) {
		this.el = el;
		this.ctx = el.getContext('2d');
		this.ctx.lineWidth = 8;
		this.ctx.lineJoin = this.ctx.lineCap = 'round';

		this.el.width =$('body').width();
		this.el.height = $('body').height();
	}

	redraw(source: Source) {
		this.clear();

		for(var i = 0; i < source.items.length; i++) {
			var item = source.items[i];

			this.ctx.beginPath();  
			this.ctx.globalAlpha = 1;
			this.ctx.moveTo(item.raw[0].x, item.raw[0].y);

			for(var j = 1; j < item.raw.length; j++) {
				this.ctx.lineTo(item.raw[j].x, item.raw[j].y);
			}

			this.ctx.stroke();
		}
	}

	clear() {
		this.ctx.clearRect(0, 0, this.el.width, this.el.height);
	}
}