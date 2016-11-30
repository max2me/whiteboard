class Utility {
	static distance(p1: Point, p2: Point) {
		return Math.abs(Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)));
	}

	static va(p1: Point, p2: Point){
		return [p2.x-p1.x, p2.y-p1.y];
	}

	static clone(object: any): any {
		return JSON.parse(JSON.stringify(object));
	}

	static cloneItem(item: Item): Item {
		var result = new Item();
		result.shape = item.shape;
		result.text = item.text;
		result.fontSizeK = item.fontSizeK;
		result.lineArrowStart = item.lineArrowStart;
		result.lineArrowEnd = item.lineArrowEnd;
		result.raw = Utility.clone(item.raw);

		return result;
	}

	static controlPoints(p1: Point, p2: Point, p3: Point) : Point[]{
		var t = 0.5;
		var v = Utility.va(p1, p3);
		var d01 = Utility.distance(p1, p2);
		var d12 = Utility.distance(p2, p3);
		var d012 = d01 + d12;
		return [new Point(p2.x - v[0] * t * d01 / d012, p2.y - v[1] * t * d01 / d012),
				new Point(p2.x + v[0] * t * d12 / d012, p2.y + v[1] * t * d12 / d012) ];
	}

	static getBounds(coords: Point[]){
		if (coords.length == 1) {
			return {
				xmin: coords[0].x,
				xmax: coords[0].x,
				ymin: coords[0].y,
				ymax: coords[0].y,
				centerX: coords[0].x,
				centerY: coords[0].y
			}
		}

		var xmin = 1000000, xmax = 0, ymin = 1000000, ymax = 0;
		
		for(var i = 0; i < coords.length; i++) {
			var p = coords[i];
			if (p.x < xmin) xmin = p.x;
			if (p.x > xmax) xmax = p.x;
			if (p.y < ymin) ymin = p.y;
			if (p.y > ymax) ymax = p.y;
		}
		
		return {
			xmin: xmin,
			xmax: xmax,
			ymin: ymin,
			ymax: ymax,
			centerX: xmin + (xmax - xmin) / 2,
			centerY: ymin + (ymax - ymin) / 2
		}
	}
}