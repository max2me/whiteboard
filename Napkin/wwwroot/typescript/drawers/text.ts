namespace Drawers {
	export class Text extends Base {
		text(item: Item, last: boolean, zoom: number) {
			var size = 30 * item.fontSizeK * zoom;
			this.ctx.font = size + "px 	'Permanent Marker'";
			this.ctx.fillStyle = 'black';
			this.ctx.fillText(item.text + (last ? '_' : ''), item.raw[0].x, item.raw[0].y);		
		}
	}
}