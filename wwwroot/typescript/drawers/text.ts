namespace Drawers {
	export class Text extends Base {
		text(item: Item, last: boolean) {
			var size = 30 * item.sizeK;
			this.ctx.font = size + "px 	'Permanent Marker'";
			this.ctx.fillStyle = 'black';
			this.ctx.fillText(item.text + (last ? '_' : ''), item.raw[0].x, item.raw[0].y);		
		}
	}
}