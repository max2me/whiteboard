declare var napkinId: String;

class Syncer {
	connection: any;
	source: Source;
	drawer: Drawer;

	constructor(source: Source, drawer: Drawer){
		this.source = source;
		this.drawer = drawer;
		this.connection = $.connection('/r', { napkin: napkinId }, true);
		this.connection.received((data: any) => {
			var items = JSON.parse(data.Json);
			items.forEach((item: Item) => {
				this.processItem(item);
			});
			
			this.drawer.redraw(false);
		});

		this.connection.error((error: any) => {
			console.warn(error);
		});

		this.connection.start(() => {});
	}

	processItem(item: Item) {
		if (item != null) {
			var replaced = false;
			for (var i = 0; i < this.source.items.length; i++) {
				var k = this.source.items[i];
				if (k.id == item.id) {
					this.source.items[i] = item;
					replaced = true;
					break;
				}
			}

			if (!replaced) {
				this.source.push(item);
			}
		}
	}

	send() {
		this.connection.send({
			Type: 'Broadcast',
			Json: JSON.stringify(this.source.last())
		});
	}
}