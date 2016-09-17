namespace Drawers {
	export class Text extends Base {
		text(item: Item, last: boolean) {
			this.ctx.font = "30px 	'Permanent Marker'";
			this.ctx.fillStyle = 'black';
			this.ctx.fillText(item.text + (last ? '_' : ''), item.raw[0].x, item.raw[0].y);		
		}
	}
}