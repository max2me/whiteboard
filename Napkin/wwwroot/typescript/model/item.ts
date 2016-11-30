class Item {
	id: string;
	raw: Point[];
	shape: Shape;
	text: string;
	fontSizeK: number;
	lineArrowEnd: boolean;
	lineArrowStart: boolean;

	constructor(){
		this.id = this.generateNewId();
		this.raw = [];
		this.shape = Shape.Original;
		this.text = '';
		this.fontSizeK = 1;
		this.lineArrowEnd = false;
		this.lineArrowStart = false;
	}

	private generateNewId() : string {
		return 'id' + Math.round(Math.random() * 1000000);
	}

	record(point: Point) {
		this.raw.push(new Point(point.x, point.y)); // Kinda sketchy but need to make sure we dont retain old refs
	}
	
	isLine(): boolean {
		return ;
	}
};