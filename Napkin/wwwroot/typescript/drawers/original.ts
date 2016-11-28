namespace Drawers {
	export class Original extends Base {
		original(item: Item, last: boolean) {
			this.setupStroke(item, last);

			this.ctx.beginPath();
			this.ctx.moveTo(item.raw[0].x, item.raw[0].y);

			for(var j = 1; j < item.raw.length; j++) {
				this.ctx.lineTo(item.raw[j].x, item.raw[j].y);
			}

			this.ctx.stroke();
		}

	}
}