$(function () {
    var director = new Director();
    director.init();
});
var Director = (function () {
    function Director() {
    }
    Director.prototype.init = function () {
        var self = this;
        $('html').keyup(function (e) {
            var c = String.fromCharCode(e.which).toLowerCase();
            if (e.which == 8 || e.which == 46) {
                self.source.removeLast();
                self.drawer.redraw(self.source);
                return;
            }
            console.log(c);
            switch (c) {
                case 'r':
                    self.switchToRect();
                    break;
                case 'x':
                    self.clearAll();
                    break;
                case 'o':
                    self.switchToOriginal();
                    break;
                case 'c':
                    self.switchToCircle();
                    break;
                case 'e':
                    self.switchToEllipse();
                    break;
                case 'l':
                    if (e.shiftKey)
                        self.switchToStraightLine();
                    else
                        self.switchToLine();
                    break;
            }
        });
        $('#clear').click(this.clearAll.bind(this));
        $('#rectangle').click(this.switchToRect.bind(this));
        $('#original').click(this.switchToOriginal.bind(this));
        $('#circle').click(this.switchToCircle.bind(this));
        $('#ellipse').click(this.switchToEllipse.bind(this));
        $('#line').click(this.switchToLine.bind(this));
        $('#line-straight').click(this.switchToStraightLine.bind(this));
        this.source = new Source();
        this.el = $('#c').get(0);
        this.drawer = new Drawer(this.el);
        this.el.onmousedown = function (e) {
            self.source.start(e.clientX, e.clientY);
            self.isDrawing = true;
        };
        this.el.onmousemove = function (e) {
            if (!self.isDrawing)
                return;
            self.source.last().record(e.clientX, e.clientY);
            self.drawer.redraw(self.source);
        };
        self.el.onmouseup = function () {
            self.isDrawing = false;
        };
    };
    Director.prototype.switchToRect = function () {
        if (this.source.isEmpty())
            return;
        this.source.last().shape = Shape.Rectangle;
        this.drawer.redraw(this.source);
    };
    Director.prototype.switchToLine = function () {
        if (this.source.isEmpty())
            return;
        this.source.last().shape = Shape.Line;
        this.drawer.redraw(this.source);
    };
    Director.prototype.switchToStraightLine = function () {
        if (this.source.isEmpty())
            return;
        this.source.last().shape = Shape.StraightLine;
        this.drawer.redraw(this.source);
    };
    Director.prototype.clearAll = function () {
        this.source.items = [];
        this.drawer.redraw(this.source);
    };
    Director.prototype.switchToOriginal = function () {
        if (this.source.isEmpty())
            return;
        this.source.last().shape = Shape.Original;
        this.drawer.redraw(this.source);
    };
    Director.prototype.switchToCircle = function () {
        if (this.source.isEmpty())
            return;
        this.source.last().shape = Shape.Circle;
        this.drawer.redraw(this.source);
    };
    Director.prototype.switchToEllipse = function () {
        if (this.source.isEmpty())
            return;
        this.source.last().shape = Shape.Ellipse;
        this.drawer.redraw(this.source);
    };
    return Director;
}());
var Drawer = (function () {
    function Drawer(el) {
        this.el = el;
        this.ctx = el.getContext('2d');
        this.ctx.lineJoin = this.ctx.lineCap = 'round';
        this.el.width = $('body').width();
        this.el.height = $('body').height();
    }
    Drawer.prototype.redraw = function (source) {
        this.clear();
        for (var i = 0; i < source.items.length; i++) {
            var item = source.items[i];
            var thinStroke = item.shape != Shape.Line
                && item.shape != Shape.StraightLine
                && item.shape != Shape.Original;
            if (thinStroke)
                this.drawItem(item, -2, -2);
            this.drawItem(item, -1, -1);
            this.drawItem(item, 0, 0);
            this.drawItem(item, 1, 1);
            if (thinStroke)
                this.drawItem(item, 2, 2);
        }
    };
    Drawer.prototype.drawItem = function (item, shiftX, shiftY) {
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
        }
    };
    Drawer.prototype.drawOriginal = function (item, shiftX, shiftY) {
        this.ctx.beginPath();
        this.setupStroke(item);
        this.ctx.moveTo(item.raw[0].x + shiftX, item.raw[0].y + shiftY);
        for (var j = 1; j < item.raw.length; j++) {
            this.ctx.lineTo(item.raw[j].x + shiftX, item.raw[j].y + shiftY);
        }
        this.ctx.stroke();
    };
    Drawer.prototype.drawLine = function (item, shiftX, shiftY) {
        this.ctx.beginPath();
        this.setupStroke(item);
        var pts = window.simplify(item.raw, 20, true);
        this.ctx.moveTo(pts[0].x + shiftX, pts[0].y + shiftY);
        for (var j = 1; j < pts.length; j++) {
            this.ctx.lineTo(pts[j].x + shiftX, pts[j].y + shiftY);
        }
        this.ctx.stroke();
    };
    Drawer.prototype.drawStraightLine = function (item, shiftX, shiftY) {
        this.ctx.beginPath();
        this.setupStroke(item);
        this.ctx.moveTo(item.raw[0].x + shiftX, item.raw[0].y + shiftY);
        this.ctx.lineTo(item.raw[item.raw.length - 1].x + shiftX, item.raw[item.raw.length - 1].y + shiftY);
        this.ctx.stroke();
    };
    Drawer.prototype.drawRect = function (item, shiftX, shiftY) {
        var b = this.getBounds(item.raw);
        this.ctx.beginPath();
        this.setupStroke(item);
        this.ctx.moveTo(b.xmin + shiftX, b.ymin + shiftY);
        this.ctx.lineTo(b.xmax + shiftX, b.ymin + shiftY);
        this.ctx.lineTo(b.xmax + shiftX, b.ymax + shiftY);
        this.ctx.lineTo(b.xmin + shiftX, b.ymax + shiftY);
        this.ctx.lineTo(b.xmin + shiftX, b.ymin + shiftY);
        this.ctx.stroke();
    };
    Drawer.prototype.drawCircle = function (item, shiftX, shiftY) {
        var b = this.getBounds(item.raw);
        this.ctx.beginPath();
        this.setupStroke(item);
        var x = (b.xmax - b.xmin) / 2 + b.xmin;
        var y = (b.ymax - b.ymin) / 2 + b.ymin;
        var radiusX = (b.xmax - b.xmin) / 2;
        var radiusY = (b.ymax - b.ymin) / 2;
        var radius = Math.min(radiusX, radiusY);
        this.ctx.arc(x + shiftX, y + shiftY, radius, 0, 2 * Math.PI, false);
        this.ctx.stroke();
    };
    Drawer.prototype.drawEllipse = function (item, shiftX, shiftY) {
        var b = this.getBounds(item.raw);
        var x = (b.xmax - b.xmin) / 2 + b.xmin;
        var y = (b.ymax - b.ymin) / 2 + b.ymin;
        var radiusX = (b.xmax - b.xmin) / 2;
        var radiusY = (b.ymax - b.ymin) / 2;
        var radius = Math.min(radiusX, radiusY);
        this.ctx.beginPath();
        this.setupStroke(item);
        this.ctx.ellipse(x + shiftX, y + shiftY, radiusX, radiusY, 0, 0, 2 * Math.PI, false);
        this.ctx.stroke();
    };
    Drawer.prototype.setupStroke = function (item) {
        this.ctx.globalAlpha = 1;
        this.ctx.lineWidth = 2;
        this.ctx.lineJoin = this.ctx.lineCap = 'round';
    };
    Drawer.prototype.getBounds = function (coords) {
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
            ymax: ymax
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
        return this.items[this.items.length - 1];
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
})(Shape || (Shape = {}));
//# sourceMappingURL=app.js.map