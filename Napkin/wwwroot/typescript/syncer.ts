declare var napkinId: String;
declare var signalR: any;

class Syncer {
	connection: any;
	source: Source;
	drawer: Drawer;
	director: Director;
	onInitialContent: () => void;
	broadcastsReceived: number;

	constructor(source: Source, drawer: Drawer, director: Director, onInitialContent: () => void){
		this.source = source;
		this.drawer = drawer;
		this.director = director;
		this.broadcastsReceived = 0;
		this.onInitialContent = onInitialContent;

		this.connection = new signalR.HubConnection('/r');
		this.connection.on('send', (data:any) => {
			console.log(data);
		});

		this.connection
			.start()
			.then(() => this.connection.invoke('joinNapkin', napkinId));

		/*
		this.connection.received((message: any) => {

			switch(message.Type) {
				case 'Broadcast':
					if (this.broadcastsReceived === 0) {
						this.onInitialContent();
					} 

					this.broadcastsReceived++;

					var items = JSON.parse(message.Json);
					items.forEach((item: Item) => {
						this.processItem(item);
					});
					break;

				case 'ClearAll':
					this.director.resetModeToNone();
					this.source.items = [];
					break;
			}
			
			
			this.drawer.redraw(false);
		});

		this.connection.error((error: any) => {
			console.warn(error);
		});

		this.connection.start().done(() => {
			this.connection.send({
				Type: 'RequestContent'
			});
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
		/*
		this.connection.send({
			Type: 'Broadcast',
			Json: JSON.stringify(last || this.source.last())
		});
		*/
	}

	sendClearAll(): any {
		/*
		this.connection.send({
			Type: 'ClearAll'
		});
		*/
	}
}