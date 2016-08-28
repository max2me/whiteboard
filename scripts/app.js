var el, ctx;
$(function () {
    $('#clear').click(canvasClear);
    $('#rectangle').click(canvasRect);
    $('#original').click(canvasOriginal);
    $('#circle').click(canvasCircle);
    el = $('#c').get(0);
    el.width = $('body').width();
    el.height = $('body').height();
    ctx = el.getContext('2d');
    ctx.lineWidth = 8;
    ctx.lineJoin = ctx.lineCap = 'round';
    el.onmousedown = function (e) {
        isDrawing = true;
        lastPoint = { x: e.clientX, y: e.clientY };
        coords = [lastPoint];
    };
    el.onmousemove = function (e) {
        if (!isDrawing)
            return;
        ctx.beginPath();
        ctx.globalAlpha = 1;
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(e.clientX, e.clientY);
        ctx.stroke();
        coords.push({ x: e.clientX, y: e.clientY });
        lastPoint = { x: e.clientX, y: e.clientY };
    };
    el.onmouseup = function () {
        isDrawing = false;
    };
});
function canvasClear() {
    ctx.clearRect(0, 0, el.width, el.height);
}
function canvasCircle() {
    canvasClear();
    var b = getBounds();
    ctx.beginPath();
    ctx.arc((b.xmax - b.xmin) / 2 + b.xmin, (b.ymax - b.ymin) / 2 + b.ymin, Math.min((b.xmax - b.xmin) / 2, (b.ymax - b.ymin) / 2), 0, 2 * Math.PI, false);
    ctx.stroke();
}
function canvasOriginal() {
    canvasClear();
    ctx.beginPath();
    ctx.globalAlpha = 1;
    ctx.moveTo(coords[0].x, coords[0].y);
    for (var i = 1; i < coords.length; i++) {
        ctx.lineTo(coords[i].x, coords[i].y);
        ctx.stroke();
    }
}
function getBounds() {
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
}
function canvasRect() {
    canvasClear();
    var b = getBounds();
    ctx.beginPath();
    ctx.globalAlpha = 1;
    ctx.moveTo(b.xmin, b.ymin);
    ctx.lineTo(b.xmax, b.ymin);
    ctx.lineTo(b.xmax, b.ymax);
    ctx.lineTo(b.xmin, b.ymax);
    ctx.lineTo(b.xmin, b.ymin);
    ctx.stroke();
}
var isDrawing, lastPoint, coords;
//# sourceMappingURL=app.js.map