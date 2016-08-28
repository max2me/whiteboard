var el;
var source;
var drawer;
var isDrawing;
$(function () {
    $('#clear').click(function () {
        source.items = [];
        drawer.redraw(source);
    });
    $('#rectangle').click(function () {
        if (source.isEmpty())
            return;
        source.last().shape = Shape.Rectangle;
        drawer.redraw(source);
    });
    source = new Source();
    el = $('#c').get(0);
    drawer = new Drawer(el);
    el.onmousedown = function (e) {
        source.start(e.clientX, e.clientY);
        isDrawing = true;
    };
    el.onmousemove = function (e) {
        if (!isDrawing)
            return;
        source.last().record(e.clientX, e.clientY);
        drawer.redraw(source);
    };
    el.onmouseup = function () {
        isDrawing = false;
    };
});
var Drawer = (function () {
    function Drawer(el) {
        this.el = el;
        this.ctx = el.getContext('2d');
        this.ctx.lineWidth = 8;
        this.ctx.lineJoin = this.ctx.lineCap = 'round';
        this.el.width = $('body').width();
        this.el.height = $('body').height();
    }
    Drawer.prototype.redraw = function (source) {
        this.clear();
        for (var i = 0; i < source.items.length; i++) {
            var item = source.items[i];
            if (item.shape == Shape.Original)
                this.drawOriginal(item);
            else if (item.shape == Shape.Rectangle)
                this.drawRect(item);
        }
    };
    Drawer.prototype.drawOriginal = function (item) {
        this.ctx.beginPath();
        this.ctx.globalAlpha = 1;
        this.ctx.moveTo(item.raw[0].x, item.raw[0].y);
        for (var j = 1; j < item.raw.length; j++) {
            this.ctx.lineTo(item.raw[j].x, item.raw[j].y);
        }
        this.ctx.stroke();
    };
    Drawer.prototype.drawRect = function (item) {
        var b = this.getBounds(item.raw);
        this.ctx.beginPath();
        this.ctx.globalAlpha = 1;
        this.ctx.moveTo(b.xmin, b.ymin);
        this.ctx.lineTo(b.xmax, b.ymin);
        this.ctx.lineTo(b.xmax, b.ymax);
        this.ctx.lineTo(b.xmin, b.ymax);
        this.ctx.lineTo(b.xmin, b.ymin);
        this.ctx.stroke();
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
})(Shape || (Shape = {}));
//# sourceMappingURL=app.js.map