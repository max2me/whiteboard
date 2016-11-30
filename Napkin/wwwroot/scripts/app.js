var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var director = null;
$(function () {
    director = new Director();
    director.init();
    $('.instructions .toggle').click(function () {
        $('body').toggleClass('show-instructions');
    });
});
var Director = (function () {
    function Director() {
    }
    Director.prototype.init = function () {
        var _this = this;
        var self = this;
        self.mode = Mode.None;
        $('html')
            .keydown(self.textTyping.bind(this))
            .keydown(self.generalHotkeys.bind(this))
            .keydown(self.syncUpHtmlStateDown.bind(this))
            .keyup(self.syncUpHtmlStateUp.bind(this));
        $('canvas').on('contextmenu', function () {
            return false;
        });
        this.source = new Source();
        this.view = new View();
        this.canvas = document.getElementById('c');
        this.drawer = new Drawer(this.canvas, this.source, this.view);
        this.syncer = new Syncer(this.source, this.drawer, this);
        this.canvas.addEventListener('mousedown', function (e) {
            e.preventDefault();
            self.interactionDown(e.clientX, e.clientY, e.ctrlKey, e.altKey, e.shiftKey, e.button);
        });
        this.canvas.addEventListener('mousemove', function (e) {
            self.interactionMove(e.clientX, e.clientY, e.ctrlKey, e.altKey, e.shiftKey, e.button);
        });
        this.canvas.addEventListener('mouseup', function (e) {
            e.preventDefault();
            self.interactionUp();
        });
        this.canvas.addEventListener('dblclick', function (e) {
            self.startTyping(e.clientX, e.clientY);
            return false;
        });
        this.canvas.addEventListener('touchstart', function (e) {
            e.preventDefault();
            if (e.changedTouches.length > 1)
                return;
            self.interactionDown(e.changedTouches[0].clientX, e.changedTouches[0].clientY, e.ctrlKey, e.altKey, e.shiftKey, 1);
        });
        this.canvas.addEventListener('touchmove', function (e) {
            e.preventDefault();
            if (e.changedTouches.length > 1)
                return;
            self.interactionMove(e.changedTouches[0].clientX, e.changedTouches[0].clientY, e.ctrlKey, e.altKey, e.shiftKey, 1);
        });
        this.canvas.addEventListener('touchup', function (e) {
            e.preventDefault();
            if (e.changedTouches.length > 1)
                return;
            self.interactionUp();
        });
        $('#a-delete').click(function () {
            _this.deleteAndSync();
            _this.drawer.redraw(false);
        });
        $('#a-original').click(function () {
            _this.switchShape(Shape.Original);
            _this.drawer.redraw(false);
        });
        $('#a-circle').click(function () {
            _this.switchShape(Shape.Circle);
            _this.drawer.redraw(false);
        });
        $('#a-ellipse').click(function () {
            _this.switchShape(Shape.Ellipse);
            _this.drawer.redraw(false);
        });
        $('#a-rectangle').click(function () {
            _this.switchShape(Shape.Rectangle);
            _this.drawer.redraw(false);
        });
        $('#a-human').click(function () {
            _this.switchShape(Shape.Human);
            _this.drawer.redraw(false);
        });
        $('#a-line-straight').click(function () {
            _this.switchShape(Shape.StraightLine);
            _this.drawer.redraw(false);
        });
        $('#a-line').click(function () {
            _this.switchShape(Shape.Line);
            _this.drawer.redraw(false);
        });
        $('#a-line-smooth').click(function () {
            _this.switchShape(Shape.SmoothLine);
            _this.drawer.redraw(false);
        });
        $('#a-arrow-to').click(function () {
            var item = _this.source.last();
            item.lineArrowEnd = !item.lineArrowEnd;
            if (item.shape != Shape.Line && item.shape != Shape.SmoothLine && item.shape != Shape.StraightLine) {
                _this.switchShape(Shape.SmoothLine);
            }
            _this.drawer.redraw(false);
        });
        $('#a-arrow-from').click(function () {
            var item = _this.source.last();
            item.lineArrowStart = !item.lineArrowStart;
            if (item.shape != Shape.Line && item.shape != Shape.SmoothLine && item.shape != Shape.StraightLine) {
                _this.switchShape(Shape.SmoothLine);
            }
            _this.drawer.redraw(false);
        });
        $('#a-clear').click(function () {
            if (confirm('Clear all?')) {
                _this.clearAll();
            }
        });
    };
    Director.prototype.logView = function (description) {
        console.log(description, Math.round(this.view.panX * 100) / 100, Math.round(this.view.panY * 100) / 100, this.view.zoom);
    };
    Director.prototype.calculatePan = function (point, oldPan, oldZoom, newZoom) {
        return (oldPan * oldZoom + point * oldZoom - point * newZoom) / newZoom;
    };
    Director.prototype.interactionDown = function (clientX, clientY, ctrlKey, altKey, shiftKey, button) {
        if (button === void 0) { button = 1; }
        if (ctrlKey && shiftKey) {
            this.startDrawingSteps(clientX, clientY);
        }
        else if (ctrlKey && !this.source.isEmpty()) {
            this.startScaling(clientX, clientY);
        }
        else if (shiftKey && !this.source.isEmpty()) {
            this.startMoving(clientX, clientY);
        }
        else if (altKey && !this.source.isEmpty()) {
            this.startCloning(clientX, clientY);
        }
        else if (button == 2) {
            this.startErasing(clientX, clientY);
        }
        else if (this.mode == Mode.PreparingToPan) {
            this.startPanning(clientX, clientY);
        }
        else {
            this.startDrawing(clientX, clientY);
        }
        this.syncer.send();
    };
    Director.prototype.interactionUp = function () {
        if (this.mode == Mode.DrawingSteps || this.mode == Mode.None) {
            return;
        }
        if (this.mode == Mode.Panning) {
            this.mode = Mode.None;
            return;
        }
        if (this.mode == Mode.Drawing) {
            if (this.source.last().raw.length == 1) {
                this.source.removeLast();
            }
        }
        this.drawer.redraw(false);
        this.mode = Mode.None;
        this.syncer.send();
    };
    Director.prototype.interactionMove = function (clientX, clientY, ctrlKey, altKey, shiftKey, button) {
        if (button === void 0) { button = 1; }
        if (this.mode == Mode.None || this.mode == Mode.PreparingToPan)
            return;
        if (this.mode == Mode.DrawingSteps) {
            var item = this.source.last();
            item.raw.pop();
            item.record(this.normalize(clientX, clientY));
            this.drawer.redraw(true);
        }
        else if (this.mode == Mode.Scaling) {
            this.scale(clientX, clientY);
        }
        else if (this.mode == Mode.Moving) {
            this.move(clientX, clientY);
        }
        else if (this.mode == Mode.Panning) {
            this.pan(clientX, clientY);
        }
        else {
            this.source.last().record(this.normalize(clientX, clientY));
        }
        this.syncer.send();
        this.drawer.redraw(true);
    };
    Director.prototype.startTyping = function (clientX, clientY) {
        this.source.start(this.normalize(clientX, clientY));
        this.source.last().shape = Shape.Text;
        this.source.last().fontSizeK = 1 / this.view.zoom;
        this.drawer.redraw(true);
    };
    Director.prototype.startDrawing = function (clientX, clientY) {
        this.source.start(this.normalize(clientX, clientY));
        this.mode = Mode.Drawing;
    };
    Director.prototype.startErasing = function (clientX, clientY) {
        if (this.source.isEmpty())
            return;
        this.source.start(this.normalize(clientX, clientY));
        this.source.last().shape = Shape.Eraser;
        this.mode = Mode.Drawing;
    };
    Director.prototype.startCloning = function (clientX, clientY) {
        var newItem = Utility.cloneItem(this.source.last());
        this.source.push(newItem);
        this.startMoving(clientX, clientY);
    };
    Director.prototype.startDrawingSteps = function (clientX, clientY) {
        if (this.mode == Mode.None) {
            this.mode = Mode.DrawingSteps;
            this.source.start(this.normalize(clientX, clientY));
            this.source.last().record(this.normalize(clientX, clientY));
        }
        else if (this.mode == Mode.DrawingSteps) {
            this.source.last().record(this.normalize(clientX, clientY));
        }
    };
    Director.prototype.startMoving = function (clientX, clientY) {
        this.mode = Mode.Moving;
        this.initMovingPoint = new Point(clientX, clientY);
    };
    Director.prototype.move = function (clientX, clientY) {
        var current = new Point(clientX, clientY);
        var shiftX = clientX - this.initMovingPoint.x;
        var shiftY = clientY - this.initMovingPoint.y;
        this.source.last().raw = Transform.move(this.source.last().raw, shiftX / this.view.zoom, shiftY / this.view.zoom);
        this.initMovingPoint = current;
    };
    Director.prototype.startPanning = function (clientX, clientY) {
        this.mode = Mode.Panning;
        this.initPanningPoint = new Point(clientX, clientY);
    };
    Director.prototype.pan = function (clientX, clientY) {
        var current = new Point(clientX, clientY);
        var deltaX = (current.x - this.initPanningPoint.x) / this.view.zoom;
        var deltaY = (current.y - this.initPanningPoint.y) / this.view.zoom;
        this.initPanningPoint = current;
        this.logView('Old pan ' + deltaX);
        this.view.panX += deltaX;
        this.view.panY += deltaY;
        this.logView('New pan');
        console.log('-');
    };
    Director.prototype.startScaling = function (clientX, clientY) {
        this.mode = Mode.Scaling;
        this.initScalingPoint = this.normalize(clientX, clientY);
    };
    Director.prototype.scale = function (clientX, clientY) {
        var current = this.normalize(clientX, clientY);
        var item = this.source.last();
        var bounds = Utility.getBounds(item.raw);
        var center = new Point(bounds.centerX, bounds.centerY);
        var oldDistance = Utility.distance(center, this.initScalingPoint);
        var newDistance = Utility.distance(center, current);
        var k = newDistance / oldDistance;
        item.raw = Transform.scale(item.raw, center, k, k);
        item.fontSizeK = item.fontSizeK * k;
        this.initScalingPoint = current;
    };
    Director.prototype.textTyping = function (e) {
        var last = this.source.last();
        if (last == null || last.shape != Shape.Text)
            return;
        var char = window.keysight(e).char;
        if (char == '\b' || char == 'delete') {
            if (last.text == '') {
                this.deleteAndSync();
                this.drawer.redraw(false);
                return;
            }
            if (last.text.length > 0) {
                last.text = last.text.substr(0, last.text.length - 1);
            }
            this.syncer.send();
            this.drawer.redraw(false);
            return;
        }
        else if (window.keysight.unprintableKeys.indexOf(char) != -1) {
            return;
        }
        if (e.shiftKey) {
            char = char.toUpperCase();
        }
        last.text += char;
        this.syncer.send();
        this.drawer.redraw(false);
    };
    Director.prototype.deleteAndSync = function () {
        var d = new DeleteItem();
        this.source.push(d);
        this.syncer.send(d);
    };
    Director.prototype.generalHotkeys = function (e) {
        if (this.source.last() == null ||
            this.source.last().shape == Shape.Text)
            return;
        var c = String.fromCharCode(e.which).toLowerCase();
        if (e.which == 8 || e.which == 46) {
            this.deleteAndSync();
            this.drawer.redraw(false);
            return;
        }
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
            this.syncer.send();
            this.drawer.redraw(false);
            return;
        }
        if (c == 'r' && e.ctrlKey) {
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
            case 'h':
                this.switchShape(Shape.Human);
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
        this.syncer.send();
    };
    Director.prototype.syncUpHtmlStateDown = function (e) {
        var char = String.fromCharCode(e.which).toLowerCase();
        if (char == ' ' && this.mode == Mode.None) {
            this.mode = Mode.PreparingToPan;
        }
        else if (this.mode == Mode.DrawingSteps && !e.ctrlKey && !e.shiftKey) {
            this.source.last().raw.pop();
            this.mode = Mode.None;
        }
        $('html').attr('class', this.getHtmlClass(e));
    };
    Director.prototype.resetModeToNone = function () {
        this.mode = Mode.None;
        $('html').attr('class', '');
    };
    Director.prototype.syncUpHtmlStateUp = function (e) {
        var char = String.fromCharCode(e.which).toLowerCase();
        if (char == ' ' && this.mode == Mode.PreparingToPan) {
            this.mode = Mode.None;
        }
        else if (this.mode == Mode.DrawingSteps && !e.ctrlKey && !e.shiftKey) {
            this.source.last().raw.pop();
            this.mode = Mode.None;
        }
        $('html').attr('class', this.getHtmlClass(e));
    };
    Director.prototype.getHtmlClass = function (e) {
        var html = '';
        if (this.mode == Mode.PreparingToPan)
            html = 'mode-preparing2pan';
        if (this.mode == Mode.Panning)
            html = 'mode-panning';
        if (e.ctrlKey && e.shiftKey)
            html = 'mode-steps';
        else if (e.ctrlKey)
            html = 'mode-scaling';
        else if (e.shiftKey)
            html = 'mode-moving';
        else if (e.altKey)
            html = 'mode-cloning';
        return html;
    };
    Director.prototype.normalize = function (x, y) {
        var newX = x / this.view.zoom - this.view.panX;
        var newY = y / this.view.zoom - this.view.panY;
        return new Point(newX, newY);
    };
    Director.prototype.switchShape = function (shape) {
        if (this.source.isEmpty())
            return;
        this.source.last().shape = shape;
        this.drawer.redraw(false);
    };
    Director.prototype.clearAll = function () {
        this.source.items = [];
        this.syncer.sendClearAll();
        this.drawer.redraw(false);
    };
    return Director;
}());
var Drawer = (function () {
    function Drawer(el, source, view) {
        this.el = el;
        this.source = source;
        this.view = view;
        this.ctx = el.getContext('2d');
        this.ctx.lineJoin = this.ctx.lineCap = 'round';
        this.setupCanvas(this.ctx);
        this.original = new Drawers.Original(this.ctx);
        this.shapes = new Drawers.Shapes(this.ctx);
        this.lines = new Drawers.Lines(this.ctx);
        this.text = new Drawers.Text(this.ctx);
    }
    Drawer.prototype.setupCanvas = function (context) {
        var visibleH = $('body').height();
        var visibleW = $('body').width() - $('.actions').width();
        var ratio = this.getRatio(context);
        this.el.width = visibleW * ratio;
        this.el.height = visibleH * ratio;
        this.el.style.width = visibleW + 'px';
        this.el.style.height = visibleH + 'px';
        context.scale(ratio, ratio);
    };
    Drawer.prototype.getRatio = function (context) {
        var devicePixelRatio = window.devicePixelRatio || 1, backingStoreRatio = context.webkitBackingStorePixelRatio ||
            context.mozBackingStorePixelRatio ||
            context.msBackingStorePixelRatio ||
            context.oBackingStorePixelRatio ||
            context.backingStorePixelRatio || 1, ratio = devicePixelRatio / backingStoreRatio;
        return ratio;
    };
    Drawer.prototype.redraw = function (activeDrawing) {
        this.clear();
        this.activeDrawing = activeDrawing;
        var list = this.consolidateSource(this.source.items);
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            var last = i == list.length - 1;
            var bounds = Utility.getBounds(item.raw);
            var itemCenter = new Point(bounds.centerX, bounds.centerY);
            var canvasCenter = new Point(0, 0);
            item.raw = Transform.scale(item.raw, canvasCenter, this.view.zoom, this.view.zoom);
            item.raw = Transform.move(item.raw, this.view.panX * this.view.zoom, this.view.panY * this.view.zoom);
            switch (item.shape) {
                case Shape.Original:
                    this.original.original(item, last);
                    break;
                case Shape.Rectangle:
                    this.shapes.rectangle(item, last);
                    break;
                case Shape.Circle:
                    this.shapes.circle(item, last);
                    break;
                case Shape.Ellipse:
                    this.shapes.ellipse(item, last);
                    break;
                case Shape.Human:
                    this.shapes.human(item, last);
                    break;
                case Shape.Line:
                    this.lines.segment(item, last);
                    break;
                case Shape.SmoothLine:
                    this.lines.smooth(item, last);
                    break;
                case Shape.StraightLine:
                    this.lines.straight(item, last);
                    break;
                case Shape.Text:
                    this.text.text(item, last, this.view.zoom);
                    break;
                case Shape.Eraser:
                    this.drawEraser(item, last);
                    break;
            }
            this.lines.drawArrowsIfNeeded(item, last);
        }
    };
    Drawer.prototype.drawEraser = function (item, last) {
        this.ctx.lineWidth = 30;
        this.ctx.lineJoin = this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = this.activeDrawing && last ? '#F9F9F9' : '#FFFFFF';
        this.ctx.shadowColor = 'transparent';
        this.ctx.beginPath();
        this.ctx.moveTo(item.raw[0].x, item.raw[0].y);
        for (var j = 1; j < item.raw.length; j++) {
            this.ctx.lineTo(item.raw[j].x, item.raw[j].y);
        }
        this.ctx.stroke();
    };
    Drawer.prototype.clear = function () {
        this.ctx.clearRect(0, 0, this.el.width, this.el.height);
    };
    Drawer.prototype.consolidateSource = function (originalItems) {
        var unfilteredList = Utility.clone(originalItems);
        var result = [];
        for (var i = 0; i < unfilteredList.length; i++) {
            var item = unfilteredList[i];
            if (item.shape == Shape.Delete) {
                result.pop();
            }
            else {
                result.push(item);
            }
        }
        return result;
    };
    return Drawer;
}());
var Mode;
(function (Mode) {
    Mode[Mode["Drawing"] = 0] = "Drawing";
    Mode[Mode["DrawingSteps"] = 1] = "DrawingSteps";
    Mode[Mode["Scaling"] = 2] = "Scaling";
    Mode[Mode["Moving"] = 3] = "Moving";
    Mode[Mode["PreparingToPan"] = 4] = "PreparingToPan";
    Mode[Mode["Panning"] = 5] = "Panning";
    Mode[Mode["None"] = 6] = "None";
})(Mode || (Mode = {}));
var Syncer = (function () {
    function Syncer(source, drawer, director) {
        var _this = this;
        this.source = source;
        this.drawer = drawer;
        this.director = director;
        this.connection = $.connection('/r', { napkin: napkinId }, false);
        this.connection.received(function (message) {
            switch (message.Type) {
                case 'Broadcast':
                    var items = JSON.parse(message.Json);
                    items.forEach(function (item) {
                        _this.processItem(item);
                    });
                    break;
                case 'ClearAll':
                    _this.director.resetModeToNone();
                    _this.source.items = [];
                    break;
            }
            _this.drawer.redraw(false);
        });
        this.connection.error(function (error) {
            console.warn(error);
        });
        this.connection.start().done(function () {
            _this.connection.send({
                Type: 'RequestContent'
            });
        });
    }
    Syncer.prototype.processItem = function (item) {
        if (item == null) {
            return;
        }
        var replaced = false;
        for (var i = 0; i < this.source.items.length; i++) {
            var k = this.source.items[i];
            if (k.id == item.id) {
                this.source.items[i] = item;
                replaced = true;
                break;
            }
        }
        if (!replaced) {
            this.source.push(item);
        }
    };
    Syncer.prototype.send = function (last) {
        if (last === void 0) { last = null; }
        this.connection.send({
            Type: 'Broadcast',
            Json: JSON.stringify(last || this.source.last())
        });
    };
    Syncer.prototype.sendClearAll = function () {
        this.connection.send({
            Type: 'ClearAll'
        });
    };
    return Syncer;
}());
var View = (function () {
    function View() {
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1;
    }
    return View;
}());
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
var Transform = (function () {
    function Transform() {
    }
    Transform.move = function (points, shiftX, shiftY) {
        var result = [];
        for (var i = 0; i < points.length; i++) {
            var p = points[i];
            result.push(new Point(p.x + shiftX, p.y + shiftY));
        }
        return result;
    };
    Transform.scale = function (points, origin, scaleX, scaleY) {
        var result = [];
        for (var i = 0; i < points.length; i++) {
            var p = points[i];
            result.push(new Point(origin.x + (p.x - origin.x) * scaleX, origin.y + (p.y - origin.y) * scaleY));
        }
        return result;
    };
    return Transform;
}());
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
    Utility.cloneItem = function (item) {
        var result = new Item();
        result.shape = item.shape;
        result.text = item.text;
        result.fontSizeK = item.fontSizeK;
        result.lineArrowStart = item.lineArrowStart;
        result.lineArrowEnd = item.lineArrowEnd;
        result.raw = Utility.clone(item.raw);
        return result;
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
    Utility.getBounds = function (coords) {
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
    return Utility;
}());
var Item = (function () {
    function Item() {
        this.id = this.generateNewId();
        this.raw = [];
        this.shape = Shape.Original;
        this.text = '';
        this.fontSizeK = 1;
        this.lineArrowEnd = false;
        this.lineArrowStart = false;
    }
    Item.prototype.generateNewId = function () {
        return 'id' + Math.round(Math.random() * 1000000);
    };
    Item.prototype.record = function (point) {
        this.raw.push(new Point(point.x, point.y));
    };
    Item.prototype.isLine = function () {
        return;
    };
    return Item;
}());
;
var DeleteItem = (function (_super) {
    __extends(DeleteItem, _super);
    function DeleteItem() {
        _super.call(this);
        this.shape = Shape.Delete;
    }
    return DeleteItem;
}(Item));
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
    Shape[Shape["Rectangle"] = 10] = "Rectangle";
    Shape[Shape["Circle"] = 20] = "Circle";
    Shape[Shape["Ellipse"] = 30] = "Ellipse";
    Shape[Shape["Line"] = 40] = "Line";
    Shape[Shape["StraightLine"] = 50] = "StraightLine";
    Shape[Shape["Text"] = 60] = "Text";
    Shape[Shape["SmoothLine"] = 70] = "SmoothLine";
    Shape[Shape["Eraser"] = 80] = "Eraser";
    Shape[Shape["Human"] = 90] = "Human";
    Shape[Shape["Delete"] = 100] = "Delete";
})(Shape || (Shape = {}));
var Source = (function () {
    function Source() {
        this.items = [];
    }
    Source.prototype.last = function () {
        var deleted = 0;
        for (var i = this.items.length - 1; i >= 0; i--) {
            var item = this.items[i];
            if (item.shape == Shape.Delete) {
                deleted++;
            }
            else {
                if (deleted == 0) {
                    return item;
                }
                else {
                    deleted--;
                }
            }
        }
        return null;
    };
    Source.prototype.push = function (item) {
        this.items.push(item);
    };
    Source.prototype.start = function (point) {
        var item = new Item();
        item.record(point);
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
var Drawers;
(function (Drawers) {
    var Base = (function () {
        function Base(ctx) {
            this.ctx = ctx;
        }
        Base.prototype.setupStroke = function (item, last) {
            this.ctx.globalAlpha = 1;
            this.ctx.lineWidth = item.shape == Shape.Original ? 4 : 6;
            this.ctx.lineJoin = this.ctx.lineCap = 'round';
            this.ctx.strokeStyle = '#000';
            if (last) {
                this.ctx.strokeStyle = '#555';
            }
        };
        return Base;
    }());
    Drawers.Base = Base;
})(Drawers || (Drawers = {}));
var Drawers;
(function (Drawers) {
    var Lines = (function (_super) {
        __extends(Lines, _super);
        function Lines() {
            _super.apply(this, arguments);
        }
        Lines.prototype.segment = function (item, last) {
            this.setupStroke(item, last);
            this.ctx.beginPath();
            var pts = window.simplify(item.raw, 20, true);
            this.ctx.moveTo(pts[0].x, pts[0].y);
            for (var j = 1; j < pts.length; j++) {
                this.ctx.lineTo(pts[j].x, pts[j].y);
            }
            this.ctx.stroke();
        };
        Lines.prototype.arrow = function (points, to, fromArrow, last) {
            var distance = 20;
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
                this.drawArrowBetweenPoints(p1, p2, last);
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
                this.drawArrowBetweenPoints(p1, p2, last);
            }
        };
        Lines.prototype.smooth = function (item, last) {
            this.setupStroke(item, last);
            this.ctx.beginPath();
            var pts = window.simplify(item.raw, 20, true);
            var cps = [];
            for (var i = 0; i < pts.length - 2; i += 1) {
                cps = cps.concat(Utility.controlPoints(pts[i], pts[i + 1], pts[i + 2]));
            }
            this.drawCurvedPath(cps, pts);
        };
        Lines.prototype.straight = function (item, last) {
            this.setupStroke(item, last);
            this.ctx.beginPath();
            this.ctx.moveTo(item.raw[0].x, item.raw[0].y);
            this.ctx.lineTo(item.raw[item.raw.length - 1].x, item.raw[item.raw.length - 1].y);
            this.ctx.stroke();
        };
        Lines.prototype.drawArrowsIfNeeded = function (item, last) {
            if (item.shape == Shape.Original ||
                item.shape == Shape.Line ||
                item.shape == Shape.SmoothLine ||
                item.shape == Shape.StraightLine) {
                var points = item.raw;
                if (item.shape == Shape.StraightLine)
                    points = [points[0], points[points.length - 1]];
                this.arrow(points, item.lineArrowEnd, item.lineArrowStart, last);
            }
        };
        Lines.prototype.drawArrowBetweenPoints = function (p1, p2, last) {
            var deltaX = p2.x - p1.x;
            var deltaY = p2.y - p1.y;
            var angleInDegreees = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
            var angleInRadians = angleInDegreees * Math.PI / 180;
            var sizeX = 15;
            var sizeY = 10;
            var newPoint1 = this.rotatePoint(new Point(p2.x - sizeX, p2.y - sizeY), p2, angleInRadians);
            var newPoint2 = this.rotatePoint(new Point(p2.x - sizeX, p2.y + sizeY), p2, angleInRadians);
            this.ctx.lineWidth = 6;
            this.ctx.strokeStyle = last ? '#777' : '#000000';
            this.ctx.moveTo(p2.x, p2.y);
            this.ctx.lineTo(newPoint1.x, newPoint1.y);
            this.ctx.stroke();
            this.ctx.moveTo(p2.x, p2.y);
            this.ctx.lineTo(newPoint2.x, newPoint2.y);
            this.ctx.stroke();
        };
        Lines.prototype.rotatePoint = function (point, origin, angleInRadians) {
            var dx = point.x - origin.x;
            var dy = point.y - origin.y;
            var x = dx * Math.cos(angleInRadians) - dy * Math.sin(angleInRadians) + origin.x;
            var y = dy * Math.cos(angleInRadians) + dx * Math.sin(angleInRadians) + origin.y;
            return new Point(x, y);
        };
        Lines.prototype.drawCurvedPath = function (cps, pts) {
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
        return Lines;
    }(Drawers.Base));
    Drawers.Lines = Lines;
})(Drawers || (Drawers = {}));
var Drawers;
(function (Drawers) {
    var Original = (function (_super) {
        __extends(Original, _super);
        function Original() {
            _super.apply(this, arguments);
        }
        Original.prototype.original = function (item, last) {
            this.setupStroke(item, last);
            this.ctx.beginPath();
            this.ctx.moveTo(item.raw[0].x, item.raw[0].y);
            for (var j = 1; j < item.raw.length; j++) {
                this.ctx.lineTo(item.raw[j].x, item.raw[j].y);
            }
            this.ctx.stroke();
        };
        return Original;
    }(Drawers.Base));
    Drawers.Original = Original;
})(Drawers || (Drawers = {}));
var Drawers;
(function (Drawers) {
    var Shapes = (function (_super) {
        __extends(Shapes, _super);
        function Shapes() {
            _super.apply(this, arguments);
        }
        Shapes.prototype.rectangle = function (item, last) {
            this.setupStroke(item, last);
            var b = Utility.getBounds(item.raw);
            this.ctx.beginPath();
            this.ctx.moveTo(b.xmin, b.ymin);
            this.ctx.lineTo(b.xmax, b.ymin);
            this.ctx.lineTo(b.xmax - 0, b.ymax);
            this.ctx.lineTo(b.xmin - 0, b.ymax);
            this.ctx.lineTo(b.xmin, b.ymin);
            this.ctx.stroke();
        };
        Shapes.prototype.human = function (item, last) {
            this.setupStroke(item, last);
            var b = Utility.getBounds(item.raw);
            var height = b.ymax - b.ymin;
            var headSize = height / 3 / 2;
            var headCenterX = b.centerX;
            var headCenterY = b.ymin + headSize;
            var bodyHeight = height / 3;
            var legsHeight = height / 3;
            var bodyStartY = headCenterY + headSize;
            var bodyEndY = headCenterY + headSize + bodyHeight;
            this.ctx.beginPath();
            this.ctx.arc(headCenterX, headCenterY, headSize, 0, 2 * Math.PI, false);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(headCenterX, bodyStartY);
            this.ctx.lineTo(headCenterX, bodyEndY);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(headCenterX - headSize * 0.8, bodyEndY + legsHeight);
            this.ctx.lineTo(headCenterX, bodyEndY);
            this.ctx.lineTo(headCenterX + headSize * 0.8, bodyEndY + legsHeight);
            this.ctx.stroke();
            var armsKX = 1.1;
            var armsKY = 0.5;
            this.ctx.beginPath();
            this.ctx.moveTo(headCenterX - headSize * armsKX, bodyStartY + bodyHeight * armsKY);
            this.ctx.lineTo(headCenterX, bodyStartY + bodyHeight * armsKY / 2);
            this.ctx.lineTo(headCenterX + headSize * armsKX, bodyStartY + bodyHeight * armsKY);
            this.ctx.stroke();
        };
        Shapes.prototype.circle = function (item, last) {
            this.setupStroke(item, last);
            var b = Utility.getBounds(item.raw);
            this.ctx.beginPath();
            var x = (b.xmax - b.xmin) / 2 + b.xmin;
            var y = (b.ymax - b.ymin) / 2 + b.ymin;
            var radiusX = (b.xmax - b.xmin) / 2;
            var radiusY = (b.ymax - b.ymin) / 2;
            var radius = Math.min(radiusX, radiusY);
            this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
            this.ctx.stroke();
        };
        Shapes.prototype.ellipse = function (item, last) {
            this.setupStroke(item, last);
            var b = Utility.getBounds(item.raw);
            var x = (b.xmax - b.xmin) / 2 + b.xmin;
            var y = (b.ymax - b.ymin) / 2 + b.ymin;
            var radiusX = (b.xmax - b.xmin) / 2;
            var radiusY = (b.ymax - b.ymin) / 2;
            var radius = Math.min(radiusX, radiusY);
            this.ctx.beginPath();
            this.ctx.ellipse(x, y, radiusX, radiusY, 0, 0, 2 * Math.PI, false);
            this.ctx.stroke();
        };
        return Shapes;
    }(Drawers.Base));
    Drawers.Shapes = Shapes;
})(Drawers || (Drawers = {}));
var Drawers;
(function (Drawers) {
    var Text = (function (_super) {
        __extends(Text, _super);
        function Text() {
            _super.apply(this, arguments);
        }
        Text.prototype.text = function (item, last, zoom) {
            var lines = (item.text + (last ? '_' : '')).split('\n');
            var size = 30 * item.fontSizeK * zoom;
            this.ctx.font = size + "px 	'Permanent Marker'";
            this.ctx.fillStyle = 'black';
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                this.ctx.fillText(line, item.raw[0].x, item.raw[0].y + (size + 3) * i);
            }
        };
        return Text;
    }(Drawers.Base));
    Drawers.Text = Text;
})(Drawers || (Drawers = {}));
//# sourceMappingURL=app.js.map