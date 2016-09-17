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