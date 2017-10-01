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
		this.connection.on('send', (data:any) => {
			console.log(data);
		});

		this.connection.on('broadcast', (item: Item) => {
				console.log('broadcast', item);

				this.processItem(item);
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

		

		/*
		this.connection.received((message: any) => {
		
				case 'ClearAll':
					this.director.resetModeToNone();
					this.source.items = [];
					break;
			}
			
			
			this.drawer.redraw(false);
		});
		*/
	}

	processItem(item: Item) {
		if (item == null) {
			return;
		}

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

	send(last: Item = null) {
		this.connection.invoke('broadcast', last || this.source.last());
	}

	sendClearAll(): any {
		/*
		this.connection.send({
			Type: 'ClearAll'
		});
		*/
	}
}