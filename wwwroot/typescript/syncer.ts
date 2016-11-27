class Syncer {
	connection: any;
	source: Source;
	drawer: Drawer;

	constructor(source: Source, drawer: Drawer){
		this.source = source;
		this.drawer = drawer;
		this.connection = $.connection('/r');
		this.connection.received((data: any) => {
			var item = JSON.parse(data.Json);
			if (data.Type == 'Delete') {
				var indexToDelete = -1;
				for(var i = 0; i < this.source.items.length; i++) {
					if (this.source.items[i].id == item.id) {
						indexToDelete = i;
						break;
					}
				}

				if (indexToDelete != -1) {
					this.source.items.splice(indexToDelete, 1);
					this.drawer.redraw(false);
					return;
				}
			}
			
			if (item != null) {
				var replaced = false;
				for(var i = 0; i < this.source.items.length; i++) {
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

				this.drawer.redraw(false);
			}
		});

		this.connection.error((error: any) => {
			console.warn(error);
		});

		this.connection.start(() => {
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