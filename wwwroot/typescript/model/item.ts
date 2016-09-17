class Item {
	id: string;
	raw: Point[];
	shape: Shape;
	text: string;
	sizeK: number;
	fontSizeK: number;
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
		this.fontSizeK = 1;
		this.moveX = 0;
		this.moveY = 0;
		this.lineArrowEnd = false;
		this.lineArrowStart = false;
	}

	private generateNewId() : string {
		return 'id' + Math.round(Math.random() * 1000000);
	}

	record(point: Point) {
		this.raw.push(new Point(point.x, point.y)); // Kinda sketchy but need to make sure we dont retain old refs
	}

	clone() : Item {
		var result = new Item();
		result.shape = this.shape;
		result.text = this.text;
		result.sizeK = this.sizeK;
		result.fontSizeK = this.fontSizeK;
		result.moveX = this.moveX;
		result.moveY = this.moveY;
		result.lineArrowStart = this.lineArrowStart; 
		result.lineArrowEnd = this.lineArrowEnd;
		result.raw = Utility.clone(this.raw); 

		return result;
	}

	isLine(): boolean {
		return ;
	}
};