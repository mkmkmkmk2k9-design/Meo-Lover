const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
ctx.imageSmoothingEnabled = true;

let particles = [];
let currentMsgIndex = -1; 
let isRunning = false; 

function isMobileDevice() {
    return Math.min(window.innerWidth, window.innerHeight) < 700;
}

const messages = [
    { text: "ANH LỠ YÊU EM MẤT RỒI", time: 4000 }, 
    { text: "YÊU RẤT NHIỀU", time: 3500 },
    { text: "DÙ CHO EM CÓ NÓI", time: 3500 },
    { text: "RẰNG TA SẼ KHÔNG THỂ BÊN NHAU", time: 4500 },
    { text: "THÌ", time: 2500 }, 
    { text: "ANH VẪN LUÔN YÊU EM", time: 3500 },
    { text: "SẼ LUÔN ", time: 2500 },
    { text: "GỬI CHO EM NHỮNG LỜI CHÚC TỐT ĐẸP NHẤT", time: 5000 },
    { text: "HÃY LUÔN MỈM CƯỜI VÀ HẠNH PHÚC NHÉ !!!", time: 5000 },
    { text: "CHÚC EM 8/3 VUI VẺ :)))))", time: 6000 } 
]; 

function setCanvasSize() {
    const scale = window.devicePixelRatio || 1;

    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;

    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

window.addEventListener('resize', setCanvasSize);

window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        setCanvasSize();
        if (currentMsgIndex >= 0 && currentMsgIndex < messages.length) {
            init(messages[currentMsgIndex].text);
        }
    }, 200);
});

setCanvasSize();

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.size = 1;
        this.isText = false;
        this.ease = 0.1;
    }

    update() {
        this.x += (this.targetX - this.x) * this.ease;
        this.y += (this.targetY - this.y) * this.ease;
    }

    draw() {
        const opacity = this.isText ? 1 : 0.25;
        const lightness = this.isText ? 55 : 20;

        ctx.fillStyle = `hsla(345, 99%, ${lightness}%, ${opacity})`;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initChaos() {

    particles = [];

    const count = isMobileDevice() ? 5500 : 10000;

    for (let i = 0; i < count; i++) {

        particles.push(
            new Particle(
                Math.random() * window.innerWidth,
                Math.random() * window.innerHeight
            )
        );

    }
}

async function init(text) {

    const scale = window.devicePixelRatio || 1;

    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');
    offCtx.imageSmoothingEnabled = true;

    offCanvas.width = canvas.width;
    offCanvas.height = canvas.height;

    offCtx.scale(scale, scale);

    let fontSize;

    if (isMobileDevice()) {
        fontSize = Math.min(window.innerWidth / 9, 42);
        if (text.length > 20) fontSize = Math.min(window.innerWidth / 12, 30);
    } else {
        fontSize = 85;
        if (text.length > 20) fontSize = 60;
    }

    offCtx.font = `900 ${fontSize}px "Montserrat", sans-serif`;
    offCtx.textAlign = "center";
    offCtx.textBaseline = "middle";
    offCtx.fillStyle = "white";

    const drawX = window.innerWidth / 2;
    const drawY = window.innerHeight / 2;

    // ===== AUTO LINE WRAP =====
    const maxWidth = window.innerWidth * 0.85;
    const words = text.split(" ");

    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {

        const testLine = currentLine + " " + words[i];
        const metrics = offCtx.measureText(testLine);

        if (metrics.width > maxWidth) {

            lines.push(currentLine);
            currentLine = words[i];

        } else {

            currentLine = testLine;

        }

    }

    lines.push(currentLine);

    const lineHeight = fontSize * (isMobileDevice() ? 1.15 : 1.05);
    const startY = drawY - (lines.length - 1) * lineHeight / 2;

    for (let i = 0; i < lines.length; i++) {

        offCtx.fillText(
            lines[i],
            drawX,
            startY + i * lineHeight
        );

    }

    // ===== PARTICLE SCAN =====

    const imageData = offCtx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let textNodes = [];

    let step = isMobileDevice() ? 1.85 : 1.555555555;

    for (let y = 0; y < canvas.height; y += step * scale) {

        for (let x = 0; x < canvas.width; x += step * scale) {

            const index = (Math.floor(y) * canvas.width + Math.floor(x)) * 4 + 3;

            if (data[index] > 200) {

                textNodes.push({
                    x: x / scale,
                    y: y / scale
                });

            }

        }

    }

    while (particles.length < textNodes.length) {

        particles.push(
            new Particle(
                Math.random() * window.innerWidth,
                Math.random() * window.innerHeight
            )
        );

    }

    textNodes.sort(() => Math.random() - 0.5);

    for (let i = 0; i < particles.length; i++) {

        let p = particles[i];

        if (i < textNodes.length) {

            p.targetX = textNodes[i].x;
            p.targetY = textNodes[i].y;
            p.isText = true;

            p.size = isMobileDevice() ? 1.2 : 1.7;
            p.ease = 0.14;

        } else {

            p.targetX = Math.random() * window.innerWidth;
            p.targetY = Math.random() * window.innerHeight;

            p.isText = false;
            p.size = 0.8;
            p.ease = 0.05;

        }

    }

}

function animate() {

    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = 0; i < particles.length; i++) {

        if (!particles[i].isText) {

            particles[i].update();
            particles[i].draw();

        }

    }

    for (let i = 0; i < particles.length; i++) {

        if (particles[i].isText) {

            particles[i].update();
            particles[i].draw();

        }

    }

    requestAnimationFrame(animate);
}

async function startSequence() {

    if (isRunning) return;

    await document.fonts.load(`900 20px "Montserrat"`);

    isRunning = true;

    currentMsgIndex = -1;

    const next = async () => {

        currentMsgIndex++;

        if (currentMsgIndex < messages.length) {

            await init(messages[currentMsgIndex].text);

            setTimeout(next, messages[currentMsgIndex].time);

        } else {

            isRunning = false;

            particles.forEach(p => {

                p.isText = false;

                p.targetX = Math.random() * window.innerWidth;
                p.targetY = Math.random() * window.innerHeight;

                p.size = 1.0;
                p.ease = 0.03;

            });

        }

    };

    next();
}

window.addEventListener('mousedown', startSequence);

window.addEventListener(
    'touchstart',
    (e) => {
        e.preventDefault();
        startSequence();
    },
    { passive: false }
);

document.fonts.ready.then(async () => {

    await document.fonts.load(`900 20px "Montserrat"`);

    initChaos();

    animate();

});
