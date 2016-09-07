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

	start(x: number, y: number) {
		var item = new Item();
		item.record(x, y);

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

class Item {
	id: string;
	raw: Point[];
	shape: Shape;
	text: string;
	sizeK: number;
	moveX: number;
	moveY: number;
	lineArrowEnd: boolean;
	lineArrowStart: boolean;

	constructor(){
		this.id = this.generateNewId();
		this.raw = [];
		this.shape = Shape.Original;
		this.text = '';
		this.sizeK = 1;
		this.moveX = 0;
		this.moveY = 0;
		this.lineArrowEnd = false;
		this.lineArrowStart = false;
	}

	private generateNewId() : string {
		return 'id' + Math.round(Math.random() * 1000000);
	}

	record(x: number, y: number) {
		this.raw.push(new Point(x, y));
	}

	clone() : Item {
		var result = JSON.parse(JSON.stringify(this));
		result.id = this.generateNewId(); 

		return result;
	}
}

class Point {
	x: number;
	y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}
}

enum Shape {
	Original,
	Rectangle,
	Circle,
	Ellipse,
	Line,
	StraightLine,
	Text,
	SmoothLine,
	Eraser
}