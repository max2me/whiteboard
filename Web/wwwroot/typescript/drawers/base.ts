namespace Drawers {
	export class Base {
		ctx: CanvasRenderingContext2D;

		constructor(ctx: CanvasRenderingContext2D) {
			this.ctx = ctx;
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
	}
}