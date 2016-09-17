class Transform {
	static move(points: Point[], shiftX: number, shiftY: number): Point[] {
		var result: Point[] = [];
		
		for(var i = 0; i < points.length; i++) {
			var p = points[i];
			result.push(new Point(p.x + shiftX, p.y + shiftY));
		}

		return result;
	}

	static scale(points: Point[], origin: Point, scaleX: number, scaleY: number): Point[] {
		var result: Point[] = [];
		
		for(var i = 0; i < points.length; i++) {
			var p = points[i];
			result.push(new Point(origin.x + (p.x - origin.x) * scaleX, origin.y + (p.y - origin.y) * scaleY));
		}

		return result;
	}
}