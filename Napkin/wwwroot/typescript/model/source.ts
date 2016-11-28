class Source {
	items: Item[];

	constructor() {
		this.items = [];
	}

	last(): Item {
		return this.items.length ? this.items[this.items.length - 1] : null;
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
