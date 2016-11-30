namespace Drawers {
	export class Text extends Base {
		text(item: Item, last: boolean, zoom: number) {
			var lines = (item.text + (last ? '_' : '')).split('\n');
			var size = 30 * item.fontSizeK * zoom;
			this.ctx.font = size + "px 	'Permanent Marker'";
			this.ctx.fillStyle = 'black';

			for (var i = 0; i < lines.length; i++) {
				var line = lines[i];
				this.ctx.fillText(line, item.raw[0].x, item.raw[0].y + (size+3) * i);
			}
		}
	}
}