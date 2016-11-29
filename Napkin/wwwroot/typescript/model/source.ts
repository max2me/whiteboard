class Source {
	items: Item[];

	constructor() {
		this.items = [];
	}

	last(): Item {
		// Have to account for `deleted` items in the source
		var deleted = 0;
		for (var i = this.items.length - 1; i >= 0; i--) {
			var item = this.items[i];
			if (item.shape == Shape.Delete) {
				deleted++;
			} else {
				if (deleted == 0) {
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
