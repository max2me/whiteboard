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

	static controlPoints(p1: Point, p2: Point, p3: Point) : Point[]{
		var t = 0.5;
		var v = Utility.va(p1, p3);
		var d01 = Utility.distance(p1, p2);
		var d12 = Utility.distance(p2, p3);
		var d012 = d01 + d12;
		return [new Point(p2.x - v[0] * t * d01 / d012, p2.y - v[1] * t * d01 / d012),
				new Point(p2.x + v[0] * t * d12 / d012, p2.y + v[1] * t * d12 / d012) ];
	}

	static shiftPoints(points: Point[], shiftX: number, shiftY: number): Point[] {
		var result: Point[] = [];
		
		for(var i = 0; i < points.length; i++) {
			var p = points[i];
			result.push(new Point(p.x + shiftX, p.y + shiftY));
		}

		return result;
	}
}