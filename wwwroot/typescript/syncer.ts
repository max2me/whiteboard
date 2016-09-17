class Syncer {
	connection: any;
	source: Source;
	drawer: Drawer;

	constructor(source: Source, drawer: Drawer){
		this.source = source;
		this.drawer = drawer;

		var self = this;

		this.connection = $.connection('/r');
		this.connection.received(function(data: any) {
			var item = JSON.parse(data.Json);
			if (data.Type == 'Delete') {
				var indexToDelete = -1;
				for(var i = 0; i < self.source.items.length; i++) {
					if (self.source.items[i].id == item.id) {
						indexToDelete = i;
						break;
					}
				}

				if (indexToDelete != -1) {
					self.source.items.splice(indexToDelete, 1);
					self.drawer.redraw(false);
					return;
				}
			}
			
			if (item != null) {
				var replaced = false;
				for(var i = 0; i < self.source.items.length; i++) {
					var k = self.source.items[i];
					if (k.id == item.id) {
						self.source.items[i] = item;
						replaced = true;
						break;
					}
				}

				if (!replaced) {
					self.source.push(item);
				}

				self.drawer.redraw(false);
			}
		});

		this.connection.error(function(error: any) {
			console.warn(error);
		});

		this.connection.start(function() {
		});
	}

	send() {
		this.connection.send({
			Type: 'Broadcast',
			Json: JSON.stringify(this.source.last())
		});
	}

	deleteAndSend() {
		this.connection.send({
			Type: 'Delete',
			Json: JSON.stringify(this.source.last())
		});

		this.source.removeLast();
	}
}