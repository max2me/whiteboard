var director = null;
$(function () {
    director = new Director();
    director.init();
    $('.instructions .toggle').click(function () {
        $('body').toggleClass('show-instructions');
    });
});
var Mode;
(function (Mode) {
    Mode[Mode["Drawing"] = 0] = "Drawing";
    Mode[Mode["DrawingSteps"] = 1] = "DrawingSteps";
    Mode[Mode["Scaling"] = 2] = "Scaling";
    Mode[Mode["Moving"] = 3] = "Moving";
    Mode[Mode["None"] = 4] = "None";
})(Mode || (Mode = {}));
var Keyboard = (function () {
    function Keyboard() {
    }
    Keyboard.isDelete = function (char) {
        return char == Keyboard.backspace || char == Keyboard.delete;
    };
    Keyboard.isArrowRight = function (char) {
        return char == Keyboard.arrowRight;
    };
    Keyboard.isArrowLeft = function (char) {
        return char == Keyboard.arrowLeft;
    };
    Keyboard.backspace = 8;
    Keyboard.delete = 46;
    Keyboard.arrowRight = 39;
    Keyboard.arrowLeft = 37;
    return Keyboard;
}());
var Director = (function () {
    function Director() {
    }
    Director.prototype.init = function () {
        var self = this;
        self.mode = Mode.None;
        $('html')
            .keydown(self.generalHotkeys.bind(this))
            .keydown(self.textTyping.bind(this))
            .keydown(self.modifierKeyDown.bind(this))
            .keyup(self.modifierKeyUp.bind(this));
        $('canvas').on('contextmenu', function () {
            return false;
        });
        this.source = new Source();
        this.el = document.getElementById('c');
        this.drawer = new Drawer(this.el, this.source);
        $(this.el)
            .mousedown(function (e) {
            if (e.ctrlKey && e.shiftKey) {
                if (self.mode == Mode.None) {
                    self.mode = Mode.DrawingSteps;
                    self.source.start(e.clientX, e.clientY);
                    self.source.last().record(e.clientX, e.clientY);
                }
                else if (self.mode == Mode.DrawingSteps) {
                    self.source.last().record(e.clientX, e.clientY);
                }
            }
            else if (e.ctrlKey && !self.source.isEmpty()) {
                self.mode = Mode.Scaling;
                var item = self.source.last();
                var bounds = Drawer.getBounds(item.raw);
                self.initScaleDistance = Utility.distance(new Point(bounds.centerX + item.moveX, bounds.centerY + item.moveY), new Point(e.clientX, e.clientY));
                self.initScale = self.source.last().sizeK;
            }
            else if (e.shiftKey && !self.source.isEmpty()) {
                self.mode = Mode.Moving;
                self.initMovingPoint = new Point(e.clientX, e.clientY);
                self.initMoveX = self.source.last().moveX;
                self.initMoveY = self.source.last().moveY;
            }
            else if (e.altKey && !self.source.isEmpty()) {
                self.mode = Mode.Moving;
                var newItem = Utility.clone(self.source.last());
                self.source.push(newItem);
                self.initMovingPoint = new Point(e.clientX, e.clientY);
                self.initMoveX = self.source.last().moveX;
                self.initMoveY = self.source.last().moveY;
            }
            else if (e.button == 2) {
                if (self.source.isEmpty())
                    return;
                self.source.start(e.clientX, e.clientY);
                self.source.last().shape = Shape.Eraser;
                self.mode = Mode.Drawing;
            }
            else {
                self.source.start(e.clientX, e.clientY);
                self.mode = Mode.Drawing;
            }
            return false;
        })
            .mousemove(function (e) {
            if (self.mode == Mode.None)
                return;
            if (self.mode == Mode.DrawingSteps) {
                var item = self.source.last();
                item.raw.pop();
                item.record(e.clientX, e.clientY);
                self.drawer.redraw(true);
            }
            else if (self.mode == Mode.Scaling) {
                var item = self.source.last();
                var bounds = Drawer.getBounds(item.raw);
                var distance = Utility.distance(new Point(bounds.centerX + item.moveX, bounds.centerY + item.moveY), new Point(e.clientX, e.clientY));
                item.sizeK = self.initScale * distance / self.initScaleDistance;
            }
            else if (self.mode == Mode.Moving) {
                var current = new Point(e.clientX, e.clientY);
                self.source.last().moveX = self.initMoveX + current.x - self.initMovingPoint.x;
                self.source.last().moveY = self.initMoveY + current.y - self.initMovingPoint.y;
            }
            else {
                self.source.last().record(e.clientX, e.clientY);
            }
            self.drawer.redraw(true);
        })
            .mouseup(function () {
            if (self.mode == Mode.DrawingSteps) {
                return;
            }
            if (self.mode == Mode.None)
                return;
            if (self.mode == Mode.Drawing) {
                if (self.source.last().raw.length == 1) {
                    self.source.removeLast();
                }
            }
            self.drawer.redraw(false);
            self.mode = Mode.None;
            return false;
        })
            .dblclick(function (e) {
            self.source.start(e.clientX, e.clientY);
            self.source.last().shape = Shape.Text;
            self.drawer.redraw(true);
            return false;
        });
    };
    Director.prototype.modifierKeyDown = function (e) {
        this.syncUpHtmlState(e);
    };
    Director.prototype.modifierKeyUp = function (e) {
        this.syncUpHtmlState(e);
    };
    Director.prototype.syncUpHtmlState = function (e) {
        var html = '';
        if (this.mode == Mode.DrawingSteps && !e.ctrlKey && !e.shiftKey) {
            this.source.last().raw.pop();
            this.mode = Mode.None;
        }
        if (e.ctrlKey && e.shiftKey)
            html = 'mode-steps';
        else if (e.ctrlKey)
            html = 'mode-scaling';
        else if (e.shiftKey)
            html = 'mode-moving';
        else if (e.altKey)
            html = 'mode-cloning';
        $('html').attr('class', html);
    };
    Director.prototype.textTyping = function (e) {
        var last = this.source.last();
        if (last == null || last.shape != Shape.Text)
            return;
        if (Keyboard.isDelete(e.which)) {
            if (last.text == '') {
                this.source.removeLast();
                this.drawer.redraw(false);
                return;
            }
            if (last.text.length > 0) {
                last.text = last.text.substr(0, last.text.length - 1);
            }
            this.drawer.redraw(false);
            return;
        }
        var char = String.fromCharCode(e.which).toLowerCase();
        if (e.shiftKey)
            char = char.toUpperCase();
        last.text += char;
        this.drawer.redraw(false);
    };
    Director.prototype.generalHotkeys = function (e) {
        if (this.source.last() == null ||
            this.source.last().shape == Shape.Text)
            return;
        var c = String.fromCharCode(e.which).toLowerCase();
        if (Keyboard.isDelete(e.which)) {
            this.source.removeLast();
            this.drawer.redraw(false);
            return;
        }
        console.log(c, e.which);
        if (Keyboard.isArrowLeft(e.which) || Keyboard.isArrowRight(e.which)) {
            var item = this.source.last();
            if (Keyboard.isArrowRight(e.which)) {
                item.lineArrowEnd = !item.lineArrowEnd;
            }
            if (Keyboard.isArrowLeft(e.which)) {
                item.lineArrowStart = !item.lineArrowStart;
            }
            if (item.shape != Shape.Line && item.shape != Shape.SmoothLine && item.shape != Shape.StraightLine) {
                this.switchShape(Shape.SmoothLine);
            }
            this.drawer.redraw(false);
            return;
        }
        switch (c) {
            case 'x':
                this.clearAll();
                break;
            case 'r':
                this.switchShape(Shape.Rectangle);
                break;
            case 'o':
                this.switchShape(Shape.Original);
                break;
            case 'c':
                this.switchShape(Shape.Circle);
                break;
            case 'e':
                this.switchShape(Shape.Ellipse);
                break;
            case 'k':
                this.switchShape(Shape.StraightLine);
                break;
            case 'l':
                var item = this.source.last();
                if (item.shape == Shape.SmoothLine || e.shiftKey)
                    this.switchShape(Shape.Line);
                else
                    this.switchShape(Shape.SmoothLine);
                break;
        }
    };
    Director.prototype.switchShape = function (shape) {
        if (this.source.isEmpty())
            return;
        this.source.last().shape = shape;
        this.drawer.redraw(false);
    };
    Director.prototype.clearAll = function () {
        this.source.items = [];
        this.drawer.redraw(false);
    };
    return Director;
}());
var Drawer = (function () {
    function Drawer(el, source) {
        this.el = el;
        this.source = source;
        this.ctx = el.getContext('2d');
        this.ctx.lineJoin = this.ctx.lineCap = 'round';
        this.el.width = $('body').width();
        this.el.height = $('body').height();
    }
    Drawer.prototype.redraw = function (activeDrawing) {
        this.clear();
        this.activeDrawing = activeDrawing;
        for (var i = 0; i < this.source.items.length; i++) {
            var item = this.source.items[i];
            var last = i == this.source.items.length - 1;
            this.ctx.save();
            var b = Drawer.getBounds(item.raw);
            var shiftX = b.centerX;
            var shiftY = b.centerY;
            this.ctx.translate(shiftX + item.moveX, shiftY + item.moveY);
            this.ctx.scale(item.sizeK, item.sizeK);
            this.drawItem(item, -shiftX, -shiftY, last);
            if (item.shape == Shape.Original ||
                item.shape == Shape.Line ||
                item.shape == Shape.SmoothLine ||
                item.shape == Shape.StraightLine) {
                var points = item.raw;
                if (item.shape == Shape.StraightLine)
                    points = [points[0], points[points.length - 1]];
                this.drawArrow(points, item.lineArrowEnd, item.lineArrowStart, shiftX, shiftY, last);
            }
            this.ctx.restore();
        }
    };
    Drawer.prototype.drawItem = function (item, shiftX, shiftY, last) {
        this.setupStroke(item, last);
        switch (item.shape) {
            case Shape.Original:
                this.drawOriginal(item, shiftX, shiftY);
                break;
            case Shape.Rectangle:
                this.drawRect(item, shiftX, shiftY);
                break;
            case Shape.Circle:
                this.drawCircle(item, shiftX, shiftY);
                break;
            case Shape.Ellipse:
                this.drawEllipse(item, shiftX, shiftY);
                break;
            case Shape.Line:
                this.drawLine(item, shiftX, shiftY);
                break;
            case Shape.SmoothLine:
                this.drawSmoothLine(item, shiftX, shiftY);
                break;
            case Shape.StraightLine:
                this.drawStraightLine(item, shiftX, shiftY);
                break;
            case Shape.Text:
                this.drawText(item, shiftX, shiftY, last);
                break;
            case Shape.Eraser:
                this.drawEraser(item, shiftX, shiftY, last);
                break;
        }
    };
    Drawer.prototype.drawEraser = function (item, shiftX, shiftY, last) {
        this.ctx.lineWidth = 30;
        this.ctx.lineJoin = this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = this.activeDrawing && last ? '#F9F9F9' : '#FFFFFF';
        this.ctx.shadowColor = 'transparent';
        this.ctx.beginPath();
        this.ctx.moveTo(item.raw[0].x + shiftX, item.raw[0].y + shiftY);
        for (var j = 1; j < item.raw.length; j++) {
            this.ctx.lineTo(item.raw[j].x + shiftX, item.raw[j].y + shiftY);
        }
        this.ctx.stroke();
    };
    Drawer.prototype.drawText = function (item, shiftX, shiftY, last) {
        this.ctx.font = "30px 	'Permanent Marker'";
        this.ctx.fillStyle = 'black';
        this.ctx.fillText(item.text + (last ? '_' : ''), item.raw[0].x + shiftX, item.raw[0].y + shiftY);
    };
    Drawer.prototype.drawOriginal = function (item, shiftX, shiftY) {
        this.ctx.beginPath();
        this.ctx.moveTo(item.raw[0].x + shiftX, item.raw[0].y + shiftY);
        for (var j = 1; j < item.raw.length; j++) {
            this.ctx.lineTo(item.raw[j].x + shiftX, item.raw[j].y + shiftY);
        }
        this.ctx.stroke();
    };
    Drawer.prototype.drawLine = function (item, shiftX, shiftY) {
        this.ctx.beginPath();
        var temp = Utility.shiftPoints(item.raw, shiftX, shiftY);
        var pts = window.simplify(temp, 20, true);
        this.ctx.moveTo(pts[0].x, pts[0].y);
        for (var j = 1; j < pts.length; j++) {
            this.ctx.lineTo(pts[j].x, pts[j].y);
        }
        this.ctx.stroke();
    };
    Drawer.prototype.drawArrow = function (points, to, fromArrow, shiftX, shiftY, last) {
        var distance = 10;
        if (to) {
            var p2 = points[points.length - 1];
            var p1 = points[points.length - 2];
            for (var i = points.length - 3; i >= 0; i--) {
                var p = points[i];
                if (Utility.distance(p2, p) >= distance) {
                    p1 = p;
                    break;
                }
            }
            this.drawArrowBetweenPoints(p1, p2, shiftX, shiftY, last);
        }
        if (fromArrow) {
            var p2 = points[0];
            var p1 = points[1];
            for (var i = 2; i < points.length; i++) {
                var p = points[i];
                if (Utility.distance(p2, p) >= distance) {
                    p1 = p;
                    break;
                }
            }
            this.drawArrowBetweenPoints(p1, p2, shiftX, shiftY, last);
        }
    };
    Drawer.prototype.drawArrowBetweenPoints = function (p1, p2, shiftX, shiftY, last) {
        var dist = Utility.distance(p1, p2);
        var angle = Math.acos((p2.y - p1.y) / dist);
        if (p2.x < p1.x)
            angle = 2 * Math.PI - angle;
        var size = 15;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.translate(p2.x - shiftX, p2.y - shiftY);
        this.ctx.rotate(-angle);
        this.ctx.lineWidth = 6;
        this.ctx.strokeStyle = last ? '#777' : '#000000';
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(size / 2, -size);
        this.ctx.stroke();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(-size / 2, -size);
        this.ctx.stroke();
        this.ctx.restore();
    };
    Drawer.prototype.drawSmoothLine = function (item, shiftX, shiftY) {
        this.ctx.beginPath();
        var temp = Utility.shiftPoints(item.raw, shiftX, shiftY);
        var pts = window.simplify(temp, 20, true);
        var cps = [];
        for (var i = 0; i < pts.length - 2; i += 1) {
            cps = cps.concat(Utility.controlPoints(pts[i], pts[i + 1], pts[i + 2]));
        }
        this.drawCurvedPath(cps, pts);
    };
    Drawer.prototype.drawCurvedPath = function (cps, pts) {
        var len = pts.length;
        if (len < 2)
            return;
        if (len == 2) {
            this.ctx.beginPath();
            this.ctx.moveTo(pts[0].x, pts[0].y);
            this.ctx.lineTo(pts[1].x, pts[1].y);
            this.ctx.stroke();
        }
        else {
            this.ctx.beginPath();
            this.ctx.moveTo(pts[0].x, pts[0].y);
            this.ctx.quadraticCurveTo(cps[0].x, cps[0].y, pts[1].x, pts[1].y);
            for (var i = 2; i < len - 1; i += 1) {
                this.ctx.bezierCurveTo(cps[2 * (i - 1) - 1].x, cps[2 * (i - 1) - 1].y, cps[2 * (i - 1)].x, cps[2 * (i - 1)].y, pts[i].x, pts[i].y);
            }
            this.ctx.quadraticCurveTo(cps[(2 * (i - 1) - 1)].x, cps[(2 * (i - 1) - 1)].y, pts[i].x, pts[i].y);
            this.ctx.stroke();
        }
    };
    Drawer.prototype.drawStraightLine = function (item, shiftX, shiftY) {
        this.ctx.beginPath();
        this.ctx.moveTo(item.raw[0].x + shiftX, item.raw[0].y + shiftY);
        this.ctx.lineTo(item.raw[item.raw.length - 1].x + shiftX, item.raw[item.raw.length - 1].y + shiftY);
        this.ctx.stroke();
    };
    Drawer.prototype.drawRect = function (item, shiftX, shiftY) {
        var b = Drawer.getBounds(item.raw);
        this.ctx.beginPath();
        this.ctx.moveTo(b.xmin + shiftX, b.ymin + shiftY);
        this.ctx.lineTo(b.xmax + shiftX, b.ymin + shiftY);
        this.ctx.lineTo(b.xmax + shiftX - 0, b.ymax + shiftY);
        this.ctx.lineTo(b.xmin + shiftX - 0, b.ymax + shiftY);
        this.ctx.lineTo(b.xmin + shiftX, b.ymin + shiftY);
        this.ctx.stroke();
    };
    Drawer.prototype.drawCircle = function (item, shiftX, shiftY) {
        var b = Drawer.getBounds(item.raw);
        this.ctx.beginPath();
        var x = (b.xmax - b.xmin) / 2 + b.xmin;
        var y = (b.ymax - b.ymin) / 2 + b.ymin;
        var radiusX = (b.xmax - b.xmin) / 2;
        var radiusY = (b.ymax - b.ymin) / 2;
        var radius = Math.min(radiusX, radiusY);
        this.ctx.arc(x + shiftX, y + shiftY, radius, 0, 2 * Math.PI, false);
        this.ctx.stroke();
    };
    Drawer.prototype.drawEllipse = function (item, shiftX, shiftY) {
        var b = Drawer.getBounds(item.raw);
        var x = (b.xmax - b.xmin) / 2 + b.xmin;
        var y = (b.ymax - b.ymin) / 2 + b.ymin;
        var radiusX = (b.xmax - b.xmin) / 2;
        var radiusY = (b.ymax - b.ymin) / 2;
        var radius = Math.min(radiusX, radiusY);
        this.ctx.beginPath();
        this.ctx.ellipse(x + shiftX, y + shiftY, radiusX, radiusY, 0, 0, 2 * Math.PI, false);
        this.ctx.stroke();
    };
    Drawer.prototype.setupStroke = function (item, last) {
        this.ctx.globalAlpha = 1;
        this.ctx.lineWidth = item.shape == Shape.Original ? 4 : 6;
        this.ctx.lineJoin = this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = '#000';
        if (last) {
            this.ctx.strokeStyle = '#777';
        }
    };
    Drawer.getBounds = function (coords) {
        if (coords.length == 1) {
            return {
                xmin: coords[0].x,
                xmax: coords[0].x,
                ymin: coords[0].y,
                ymax: coords[0].y,
                centerX: coords[0].x,
                centerY: coords[0].y
            };
        }
        var xmin = 1000000, xmax = 0, ymin = 1000000, ymax = 0;
        for (var i = 0; i < coords.length; i++) {
            var p = coords[i];
            if (p.x < xmin)
                xmin = p.x;
            if (p.x > xmax)
                xmax = p.x;
            if (p.y < ymin)
                ymin = p.y;
            if (p.y > ymax)
                ymax = p.y;
        }
        return {
            xmin: xmin,
            xmax: xmax,
            ymin: ymin,
            ymax: ymax,
            centerX: xmin + (xmax - xmin) / 2,
            centerY: ymin + (ymax - ymin) / 2
        };
    };
    Drawer.prototype.clear = function () {
        this.ctx.clearRect(0, 0, this.el.width, this.el.height);
    };
    return Drawer;
}());
var Source = (function () {
    function Source() {
        this.items = [];
    }
    Source.prototype.last = function () {
        return this.items.length ? this.items[this.items.length - 1] : null;
    };
    Source.prototype.push = function (item) {
        this.items.push(item);
    };
    Source.prototype.start = function (x, y) {
        var item = new Item();
        item.record(x, y);
        this.items.push(item);
    };
    Source.prototype.isEmpty = function () {
        return this.items.length == 0;
    };
    Source.prototype.removeLast = function () {
        if (this.isEmpty())
            return;
        this.items.pop();
    };
    return Source;
}());
var Item = (function () {
    function Item() {
        this.raw = [];
        this.shape = Shape.Original;
        this.text = '';
        this.sizeK = 1;
        this.moveX = 0;
        this.moveY = 0;
        this.lineArrowEnd = false;
        this.lineArrowStart = false;
    }
    Item.prototype.record = function (x, y) {
        this.raw.push(new Point(x, y));
    };
    return Item;
}());
var Point = (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    return Point;
}());
var Shape;
(function (Shape) {
    Shape[Shape["Original"] = 0] = "Original";
    Shape[Shape["Rectangle"] = 1] = "Rectangle";
    Shape[Shape["Circle"] = 2] = "Circle";
    Shape[Shape["Ellipse"] = 3] = "Ellipse";
    Shape[Shape["Line"] = 4] = "Line";
    Shape[Shape["StraightLine"] = 5] = "StraightLine";
    Shape[Shape["Text"] = 6] = "Text";
    Shape[Shape["SmoothLine"] = 7] = "SmoothLine";
    Shape[Shape["Eraser"] = 8] = "Eraser";
})(Shape || (Shape = {}));
var Utility = (function () {
    function Utility() {
    }
    Utility.distance = function (p1, p2) {
        return Math.abs(Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)));
    };
    Utility.va = function (p1, p2) {
        return [p2.x - p1.x, p2.y - p1.y];
    };
    Utility.clone = function (object) {
        return JSON.parse(JSON.stringify(object));
    };
    Utility.controlPoints = function (p1, p2, p3) {
        var t = 0.5;
        var v = Utility.va(p1, p3);
        var d01 = Utility.distance(p1, p2);
        var d12 = Utility.distance(p2, p3);
        var d012 = d01 + d12;
        return [new Point(p2.x - v[0] * t * d01 / d012, p2.y - v[1] * t * d01 / d012),
            new Point(p2.x + v[0] * t * d12 / d012, p2.y + v[1] * t * d12 / d012)];
    };
    Utility.shiftPoints = function (points, shiftX, shiftY) {
        var result = [];
        for (var i = 0; i < points.length; i++) {
            var p = points[i];
            result.push(new Point(p.x + shiftX, p.y + shiftY));
        }
        return result;
    };
    return Utility;
}());
//# sourceMappingURL=app.js.map