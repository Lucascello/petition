// console.log("Testing");
(function () {
    const can = document.getElementById("can");

    const ctx = can.getContext("2d");

    let isDrawing = false;

    let width = 0;

    let height = 0;

    function drawLine(ctx, w1, h1, w2, h2) {
        ctx.beginPath();
        ctx.moveTo(w1, h1);
        ctx.lineTo(w2, h2);
        ctx.stroke();
    }

    can.addEventListener("mousedown", (e) => {
        width = e.offsetX;

        height = e.offsetY;

        isDrawing = true;
    });

    can.addEventListener("mousemove", (e) => {
        if (isDrawing === true)
            drawLine(ctx, width, height, e.offsetX, e.offsetY);
        width = e.offsetX;
        height = e.offsetY;
    });

    document.addEventListener("mouseup", (e) => {
        isDrawing = false;
    });
})();
