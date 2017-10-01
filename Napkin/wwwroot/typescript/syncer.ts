declare var napkinId: String;
declare var signalR: any;

class Syncer {
	connection: any;
	source: Source;
	drawer: Drawer;
	director: Director;
	onInitialContent: () => void;

	constructor(source: Source, drawer: Drawer, director: Director, onInitialContent: () => void){
		this.source = source;
		this.drawer = drawer;
		this.director = director;
		this.onInitialContent = onInitialContent;

		this.connection = new signalR.HubConnection('/r');

		this.connection.on('broadcast', (item: Item) => {
				this.processItem(item);
				this.drawer.redraw(false);
		});

		this.connection.on('clearAll', () => {
			this.director.resetModeToNone();
			this.source.items = [];
			this.drawer.redraw(false);
		});


		this.connection
			.start()
			.then(() => {
				this.connection
					.invoke('joinNapkin', napkinId)
					.then((items: Item[]) => {
						this.onInitialContent();

						items.forEach((item: Item) => {
							this.processItem(item);
						});

						this.drawer.redraw(false);
					});
			});
	}

	processItem(item: Item) {
		if (item == null || this.source.myOwnItemIds.indexOf(item.id) !== -1) {
			return;
		}

		let replaced = false;
		for (let i = 0; i < this.source.items.length; i++) {
			const existingItem = this.source.items[i];
			if (existingItem.id === item.id) {
				this.source.items[i] = item;
				replaced = true;
				break;
			}
		}

		if (!replaced) {
			this.source.push(item);
		}
	}

	send(last: Item = null) {
		this.connection.invoke('broadcast', last || this.source.last());
	}

	sendClearAll(): any {
		this.connection.invoke('clearAll');
	}
}