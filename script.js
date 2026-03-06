const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
ctx.imageSmoothingEnabled = true;

let particles = [];
let stars = [];
let currentMsgIndex = -1; 
let isRunning = false; 
let beatCount = 0;
let beatInterval;
let isExploded = false;
let showStars = false;
let starOpacity = 0;

function isMobileDevice() {
    return Math.min(window.innerWidth, window.innerHeight) < 700;
}

const messages = [
    { text: "ANH LỠ YÊU EM MẤT RỒI", time: 3500 }, 
    { text: "THỰC SỰ YÊU EM RẤT NHIỀU", time: 3500 },
    { text: "DÙ CHO EM CÓ NÓI", time: 3500 },
    { text: "RẰNG TA SẼ KHÔNG THỂ BÊN NHAU", time: 4500 },
    { text: "THÌ", time: 3000 }, 
    { text: "ANH VẪN LUÔN YÊU EM", time: 3500 },
    { text: "SẼ LUÔN ", time: 3500 },
    { text: "GỬI CHO EM NHỮNG LỜI CHÚC TỐT ĐẸP NHẤT", time: 6000 },
    { text: "HÃY LUÔN MỈM CƯỜI VÀ HẠNH PHÚC NHÉ !!!", time: 6000 },
    { text: "CHÚC EM 8/3 VUI VẺ :)))))", 
        time: 15000, 
        onShow: () => {
        setTimeout(() => {
            showStars = true; // hiện background sao
            explodeHeart();   // gom thành trái tim
            setTimeout(() => {
                startHeartBeat(); // tim đập
            }, 1000); // bắt đầu tim đập
        }, 10000);}
    }
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
        this.spin = 0;
        this.opacity = 1;
        this.alpha = 1;
        this.star = Math.random() < 0.05;
    }

    update() {

        if (isExploded) {

        this.x += this.vx;
        this.y += this.vy;

        this.vx *= 0.97;
        this.vy *= 0.97;

        if (this.fade) this.alpha *= this.fade;

        return;
        }

        this.x += (this.targetX - this.x) * this.ease;
        this.y += (this.targetY - this.y) * this.ease;

    }

    draw() {

    if (this.alpha <= 0) return;

    const opacity = this.alpha * (this.isText ? 1 : 0.5);
    const lightness = this.isText ? (isMobileDevice() ? 45 : 55) : 35;

    ctx.fillStyle = `hsla(345, 99%, ${lightness}%, ${opacity})`;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 1.5);
    ctx.fill();

    // ⭐ sao lấp lánh
    if (this.star && showStars) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random()})`;
        ctx.fillRect(this.x, this.y, 1, 1);
    }
    }
}

function initChaos() {

    particles = [];

    const count = isMobileDevice() ? 1000 : 3000;

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
    const hiResScale = isMobileDevice() ? 1.25 : 2;

    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');
    offCtx.imageSmoothingEnabled = true;

    offCanvas.width = canvas.width * hiResScale;
    offCanvas.height = canvas.height * hiResScale;
    offCtx.scale(hiResScale, hiResScale);

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

    const imageData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
    const data = imageData.data;

    let textNodes = [];

    let step = isMobileDevice() ? 0.95 : 1.8;

    for (let y = 0; y < offCanvas.height; y += step * scale) {

        for (let x = 0; x < offCanvas.width; x += step * scale) {

            const index = (Math.floor(y) * offCanvas.width + Math.floor(x)) * 4 + 3;

            if (data[index] > 250) {

                textNodes.push({
                    x: x /hiResScale,
                    y: y /hiResScale
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

            p.size = isMobileDevice() ? 1.1 : 1.7;
            p.ease = isMobileDevice() ? 0.4 : 0.2; 

        } else {

            p.targetX = Math.random() * window.innerWidth;
            p.targetY = Math.random() * window.innerHeight;

            p.isText = false;
            p.size = 1.0;
            p.ease = 0.05;

        }

    }

}

function animate() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ⭐ background sao chỉ khi trái tim xuất hiện
    if (showStars) {

    starOpacity += 0.02;
    if (starOpacity > 1) starOpacity = 1;

    stars.forEach(s => {

        ctx.fillStyle = `rgba(255,255,255,${s.alpha * starOpacity})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);

    });

   }

    for (let i = 0; i < particles.length; i++) {

        particles[i].update();
        particles[i].draw();

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

            const msg = messages[currentMsgIndex];

            await init(msg.text);

            if (msg.onShow) {
                msg.onShow();
            }

            setTimeout(() => { if (!isExploded) next(); }, msg.time);

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

function initStars(){

    stars = [];

    for(let i=0;i<120;i++){

        stars.push({
            x: Math.random()*window.innerWidth,
            y: Math.random()*window.innerHeight,
            size: Math.random()*2,
            alpha: Math.random()
        });

    }

}

let heartScale = 1;

function explodeHeart() {

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const heart = [];

    const scale = 12 * heartScale;

    for (let t = 0; t < Math.PI * 2; t += 0.04) {

        const x = 16 * Math.pow(Math.sin(t),3);
        const y = 13 * Math.cos(t)
                - 5 * Math.cos(2*t)
                - 2 * Math.cos(3*t)
                - Math.cos(4*t);

        heart.push({
            x: centerX + x * scale,
            y: centerY - y * scale
        });

    }

    particles.forEach((p,i)=>{

        const pos = heart[i % heart.length];

        p.targetX = pos.x;
        p.targetY = pos.y;

        p.size = 2;
        p.ease = 0.08;
        p.isText = true;

    });

}

function startHeartBeat() {

    beatCount = 0;

    beatInterval = setInterval(() => {

        beatCount++;

        heartScale = 1.3;
        explodeHeart();   // cập nhật tim phồng

        setTimeout(() => {

            heartScale = 1;
            explodeHeart(); // tim co lại

        }, 150);

        if (beatCount > 24) {

            clearInterval(beatInterval);
            heartScale = 1;
            explodeParticles();

        }

    }, 500);

}

function explodeParticles() {

    isExploded = true;

    particles.forEach(p => {

        const angle = Math.random() * Math.PI * 2;

        const speed = Math.random() * 6 + 3;

        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;

        p.alpha = 1;

        p.fade = 0.96 + Math.random() * 0.02;

        p.ease = 0;

        p.isText = true;

    });

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
    initStars();
    animate();

});
