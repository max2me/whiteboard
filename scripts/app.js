var el;
var source;
var drawer;
var isDrawing;
$(function () {
    $('#clear').click(function () {
        source.items = [];
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
            this.ctx.beginPath();
            this.ctx.globalAlpha = 1;
            this.ctx.moveTo(item.raw[0].x, item.raw[0].y);
            for (var j = 1; j < item.raw.length; j++) {
                this.ctx.lineTo(item.raw[j].x, item.raw[j].y);
            }
            this.ctx.stroke();
        }
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
    return Source;
}());
var Item = (function () {
    function Item() {
        this.raw = [];
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
//# sourceMappingURL=app.js.map