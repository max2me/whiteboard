$(function () {
    var director = new Director();
    director.init();
});
var Mode;
(function (Mode) {
    Mode[Mode["Drawing"] = 0] = "Drawing";
    Mode[Mode["Scaling"] = 1] = "Scaling";
    Mode[Mode["None"] = 2] = "None";
})(Mode || (Mode = {}));
var Director = (function () {
    function Director() {
    }
    Director.prototype.init = function () {
        var self = this;
        self.mode = Mode.None;
        $('html')
            .keydown(self.generalHotkeys.bind(this))
            .keydown(self.textTyping.bind(this));
        $('#clear').click(this.clearAll.bind(this));
        $('#rectangle').click(this.switchToRect.bind(this));
        $('#original').click(this.switchToOriginal.bind(this));
        $('#circle').click(this.switchToCircle.bind(this));
        $('#ellipse').click(this.switchToEllipse.bind(this));
        $('#line').click(this.switchToLine.bind(this));
        $('#line-straight').click(this.switchToStraightLine.bind(this));
        this.source = new Source();
        this.el = document.getElementById('c');
        this.drawer = new Drawer(this.el, this.source);
        $(this.el)
            .mousedown(function (e) {
            if (e.shiftKey && !self.source.isEmpty) {
                self.mode = Mode.Scaling;
                var b = Drawer.getBounds(self.source.last().raw);
                self.initScaleDistance = self.distance(new Point(b.centerX, b.centerY), new Point(e.clientX, e.clientY));
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
            if (self.mode == Mode.Scaling) {
                var b = Drawer.getBounds(self.source.last().raw);
                var distance = self.distance(new Point(b.centerX, b.centerY), new Point(e.clientX, e.clientY));
                self.source.last().sizeK = distance / self.initScaleDistance;
            }
            else {
                self.source.last().record(e.clientX, e.clientY);
            }
            self.drawer.redraw();
        })
            .mouseup(function () {
            if (self.mode == Mode.None)
                return;
            if (self.mode == Mode.Drawing) {
                if (self.source.last().raw.length == 1) {
                    self.source.removeLast();
                }
            }
            self.mode = Mode.None;
            return false;
        })
            .dblclick(function (e) {
            self.source.start(e.clientX, e.clientY);
            self.source.last().shape = Shape.Text;
            self.drawer.redraw();
            return false;
        });
    };
    Director.prototype.distance = function (p1, p2) {
        return Math.abs(Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)));
    };
    Director.prototype.textTyping = function (e) {
        var last = this.source.last();
        if (last == null || last.shape != Shape.Text)
            return;
        if (e.which == 8 || e.which == 46) {
            if (last.text.length > 0) {
                last.text = last.text.substr(0, last.text.length - 1);
            }
            this.drawer.redraw();
            return;
        }
        var char = String.fromCharCode(e.which).toLowerCase();
        if (e.shiftKey)
            char = char.toUpperCase();
        last.text += char;
        this.drawer.redraw();
    };
    Director.prototype.generalHotkeys = function (e) {
        if (this.source.last() == null ||
            this.source.last().shape == Shape.Text)
            return;
        var c = String.fromCharCode(e.which).toLowerCase();
        if (e.which == 8 || e.which == 46) {
            this.source.removeLast();
            this.drawer.redraw();
            return;
        }
        if (e.which == 38) {
            this.source.last().sizeK *= 1.05;
            this.drawer.redraw();
        }
        if (e.which == 40) {
            this.source.last().sizeK *= 0.95;
            this.drawer.redraw();
        }
        console.log(c, e.which);
        switch (c) {
            case 'r':
                this.switchToRect();
                break;
            case 'x':
                this.clearAll();
                break;
            case 'o':
                this.switchToOriginal();
                break;
            case 'c':
                this.switchToCircle();
                break;
            case 'e':
                this.switchToEllipse();
                break;
            case 'l':
                if (e.shiftKey)
                    this.switchToStraightLine();
                else
                    this.switchToLine();
                break;
        }
    };
    Director.prototype.switchToRect = function () {
        if (this.source.isEmpty())
            return;
        this.source.last().shape = Shape.Rectangle;
        this.drawer.redraw();
    };
    Director.prototype.switchToLine = function () {
        if (this.source.isEmpty())
            return;
        this.source.last().shape = Shape.Line;
        this.drawer.redraw();
    };
    Director.prototype.switchToStraightLine = function () {
        if (this.source.isEmpty())
            return;
        this.source.last().shape = Shape.StraightLine;
        this.drawer.redraw();
    };
    Director.prototype.clearAll = function () {
        this.source.items = [];
        this.drawer.redraw();
    };
    Director.prototype.switchToOriginal = function () {
        if (this.source.isEmpty())
            return;
        this.source.last().shape = Shape.Original;
        this.drawer.redraw();
    };
    Director.prototype.switchToCircle = function () {
        if (this.source.isEmpty())
            return;
        this.source.last().shape = Shape.Circle;
        this.drawer.redraw();
    };
    Director.prototype.switchToEllipse = function () {
        if (this.source.isEmpty())
            return;
        this.source.last().shape = Shape.Ellipse;
        this.drawer.redraw();
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
    Drawer.prototype.redraw = function () {
        this.clear();
        for (var i = 0; i < this.source.items.length; i++) {
            var item = this.source.items[i];
            var last = i == this.source.items.length - 1;
            this.ctx.save();
            var b = Drawer.getBounds(item.raw);
            this.ctx.translate(b.centerX, b.centerY);
            this.ctx.scale(item.sizeK, item.sizeK);
            if (item.shape == Shape.Text) {
                this.drawItem(item, 0, 0, last);
            }
            else {
                this.drawItem(item, -b.centerX, -b.centerY, last);
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
            case Shape.StraightLine:
                this.drawStraightLine(item, shiftX, shiftY);
                break;
            case Shape.Text:
                this.drawText(item, last);
                break;
        }
    };
    Drawer.prototype.drawText = function (item, last) {
        this.ctx.font = "20px 	'Permanent Marker'";
        this.ctx.fillStyle = last ? 'purple' : 'black';
        this.ctx.fillText(item.text + (last ? '_' : ''), item.raw[0].x, item.raw[0].y);
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
        var pts = window.simplify(item.raw, 20, true);
        this.ctx.moveTo(pts[0].x + shiftX, pts[0].y + shiftY);
        for (var j = 1; j < pts.length; j++) {
            this.ctx.lineTo(pts[j].x + shiftX, pts[j].y + shiftY);
        }
        this.ctx.stroke();
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
        this.ctx.lineWidth = 4;
        this.ctx.lineJoin = this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = last ? 'purple' : '#000';
    };
    Drawer.getBounds = function (coords) {
        var xmin = 1000, xmax = 0, ymin = 1000, ymax = 0;
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
})(Shape || (Shape = {}));
//# sourceMappingURL=app.js.map