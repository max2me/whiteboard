class Source {
	items: Item[];
	myOwnItemIds: string[];

	constructor() {
		this.items = [];
		this.myOwnItemIds = [];
	}

	last(): Item {
		// Have to account for `deleted` items in the source
		let deleted = 0;

		for (var i = this.items.length - 1; i >= 0; i--) {
			const item = this.items[i];

			if (this.myOwnItemIds.indexOf(item.id) === -1) {
				continue;
			}

			if (item.shape === Shape.Delete) {
				deleted++;
			} else {
				if (deleted === 0) {
					return item;
				} else {
					deleted--;
				}
			}
		}

		return null;
	}

	push(item: Item) {
		this.items.push(item);
	}

	start(point: Point) {
		var item = new Item();
		item.record(point);

		this.items.push(item);
		this.myOwnItemIds.push(item.id);
	}

	isEmpty() {
		return this.items.length == 0;
	}

	removeLast() {
		if (this.isEmpty())
			return;
 
		this.items.pop();
	}
}
