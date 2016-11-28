class Keyboard {
	static backspace = 8;
	static delete = 46;
	static arrowRight = 39;
	static arrowLeft = 37;

	static isDelete(char: number) {
		return char == Keyboard.backspace || char == Keyboard.delete;
	}

	static isArrowRight(char: number) {
		return char == Keyboard.arrowRight;
	}

	static isArrowLeft(char: number) {
		return char == Keyboard.arrowLeft;
	}
}