// Этот код не будет работать из-за устаревшего API,
// но эффект шума мы уже создали с помощью CSS (SVG).
// Оставим этот файл на случай, если вы захотите добавить другую JS-анимацию.
// Для текущего дизайна он не обязателен, но лучше его подключить,
// так как мы уже прописали его в HTML.

console.log("404 page script loaded.");

// Старый код с canvas не нужен, так как эффект уже достигнут через CSS.
// Если раскомментировать, он может вызвать ошибки в консоли.
/*
var canvas = document.getElementById('canvas'),
    context = canvas.getContext('d'),
    height = canvas.height = 256,
    width = canvas.width = height;

function noise() {
    requestAnimationFrame(noise);
    var idata = context.getImageData(0, 0, width, height);
    for (var i = 0; i < idata.data.length; i += 4) {
        idata.data[i] = idata.data[i + 1] = idata.data[i + 2] = Math.floor(Math.random() * 255);
        idata.data[i + 3] = 255;
    }
    context.putImageData(idata, 0, 0);
}

noise();
*/