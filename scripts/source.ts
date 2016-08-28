class Source {
	items: Item[];

	constructor() {
		this.items = [];
	}

	last(): Item {
		return this.items[this.items.length - 1];
	}

	start(x: Number, y:Number) {
		var item = new Item();
		item.record(x, y);

		this.items.push(item);
	}

	isEmpty() {
		return this.items.length == 0;
	}
}

class Item {
	raw: Point[];
	shape: Shape;

	constructor(){
		this.raw = [];
		this.shape = Shape.Original;
	}

	record(x: number, y:number) {
		this.raw.push(new Point(x, y));
	}
}

class Point {
	x: Number;
	y: Number;

	constructor(x: Number, y:Number) {
		this.x = x;
		this.y = y;
	}
}

enum Shape {
	Original,
	Rectangle,
	Circle,
	Ellipse
}