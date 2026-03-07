const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
ctx.imageSmoothingEnabled = true;

const myMusic = new Audio('mmusic.mp3');
myMusic.preload = 'auto';
const START_TIME = 20;
const END_TIME = 145;

let particles = [];
const BASE_COUNT = isMobileDevice() ? 1500 : 2000;
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
    { text: "ANH LỠ YÊU EM MẤT RỒI", time: 5000 }, 
    { text: "THỰC SỰ YÊU EM RẤT NHIỀU", time: 3550 },
    { text: "DÙ CHO EM CÓ NÓI", time: 4000 },
    { text: "RẰNG TA SẼ KHÔNG THỂ BÊN NHAU", time: 4000 },
    { text: "THÌ", 
        time: 7000
    }, 
    { text: "ANH VẪN LUÔN YÊU EM", time: 4000 },
    { text: "SẼ LUÔN ", 
        time: 8000
    },
    { text: "GỬI CHO EM NHỮNG LỜI CHÚC TỐT ĐẸP NHẤT", time: 6500 },
    { text: "HÃY LUÔN MỈM CƯỜI VÀ HẠNH PHÚC NHÉ !!!", 
        time: 7000
    },
    { text: "CHÚC EM 8/3 VUI VẺ :)))))", 
        time: 15000, 
        onShow: () => {
        setTimeout(() => {
            showStars = true; // hiện background sao
            explodeHeart(0.5);   // gom thành trái tim
            setTimeout(() => {
                startHeartBeat(); // tim đập
            }, 3500); // bắt đầu tim đập
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
        this.ease = 0.2;
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

    const opacity = this.alpha * (this.isText ? 1.0 : 0.8);
    const lightness = this.isText ? (isMobileDevice() ? 30 : 40) : 25;

    ctx.fillStyle = `hsla(345, 99%, ${lightness}%, ${opacity})`;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2.0);
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

    const count = isMobileDevice() ? 1500 : 2000;

    for (let i = 0; i < count; i++) {

        particles.push(
            new Particle(
                Math.random() * canvas.width,
                Math.random() * canvas.height
            )
        );

    }
}

async function init(text) {

    const scale = window.devicePixelRatio || 1;
    const hiResScale = isMobileDevice() ? 1.5 : 2;

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

    let step = isMobileDevice() ? 1.2 : 1.2;

    for (let y = 0; y < offCanvas.height; y += step) {

        for (let x = 0; x < offCanvas.width; x += step) {

            const index = (Math.floor(y) * offCanvas.width + Math.floor(x)) * 4 + 3;

            if (data[index] > 128) {

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
            p.ease = isMobileDevice() ? 0.8 : 0.67; 

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
    // Tăng độ mờ hậu cảnh lên một chút (0.2 -> 0.25) để vệt hạt mượt hơn
    ctx.fillStyle = 'rgba(0, 0, 0, 1)'; 
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    if (showStars) {
        starOpacity += 0.02;
        if (starOpacity > 1) starOpacity = 1;
        stars.forEach(s => {
            ctx.fillStyle = `rgba(255,255,255,${s.alpha * starOpacity})`;
            ctx.fillRect(s.x, s.y, s.size, s.size);
        });
    }

    // Lượt 1: Vẽ hạt nền trước (Để nằm ở lớp dưới)
    for (let i = 0; i < particles.length; i++) {
        if (!particles[i].isText) {
            particles[i].update();
            particles[i].draw();
        }
    }

    // Lượt 2: Vẽ hạt chữ sau (Để nằm đè lên trên hạt nền)
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

    myMusic.currentTime = START_TIME;
    myMusic.volume = 0.7;
    myMusic.play().catch(e => console.log("Lỗi phát nhạc"));
    let isFading = false;
    
    myMusic.ontimeupdate = function() {
        // Khi còn 5 giây nữa là hết (tăng lên 5s cho dễ cảm nhận)
        if (myMusic.currentTime >= END_TIME - 5 && !isFading) {
            isFading = true; // Đánh dấu đang bắt đầu giảm âm lượng
            
            let fadeOutInterval = setInterval(() => {
                if (myMusic.volume > 0.05) {
                    myMusic.volume -= 0.05; // Giảm dần mỗi 200ms
                } else {
                    myMusic.volume = 0;
                    myMusic.pause();
                    clearInterval(fadeOutInterval);
                }
            }, 200); // 0.2 giây giảm 1 lần
        }

        // Chốt chặn cuối cùng nếu chẳng may vòng lặp trên chưa kịp chạy xong
        if (myMusic.currentTime >= END_TIME) {
            myMusic.pause();
            myMusic.ontimeupdate = null;
        }
    };

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
            x: Math.random()*canvas.width,
            y: Math.random()*canvas.height,
            size: Math.random()*2,
            alpha: Math.random()
        });

    }

}

let heartScale = 1;

function explodeHeart(customEase) { // Thêm tham số ở đây
    const centerX = canvas.width / (window.devicePixelRatio || 1) / 2;
    const centerY = canvas.height / (window.devicePixelRatio || 1) / 2;
    const heart = [];
    const base = Math.min(window.innerWidth, window.innerHeight);
    const scale = (base / 50) * heartScale;

    for (let t = 0; t < Math.PI * 2; t += 0.04) {
        const x = 16 * Math.pow(Math.sin(t),3);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
        heart.push({ x: centerX + x * scale, y: centerY - y * scale });
    }

    particles.forEach((p, i) => {
        const pos = heart[i % heart.length];
        p.targetX = pos.x;
        p.targetY = pos.y;
        p.size = 2;
        // Nếu có truyền customEase thì dùng, không thì dùng 0.08
        p.ease = customEase || 0.08; 
        p.isText = true;
    });
}

function startHeartBeat() {
    beatCount = 0;
    beatInterval = setInterval(() => {
        beatCount++;

        heartScale = 1.3;
        explodeHeart(0.25); // Đập ra cực nhanh (0.25) để hiện rõ hình to

        setTimeout(() => {
            heartScale = 1.0;
            explodeHeart(0.1); // Thu về chậm hơn một chút cho tự nhiên
        }, 200); // Tăng thời gian giãn ra một tí (150 -> 200)

        if (beatCount > 24) {
            clearInterval(beatInterval);
            heartScale = 1;
            explodeParticles();
        }
    }, 600); // Giãn khoảng cách giữa các nhịp đập một chút (500 -> 600)
}

function explodeParticles() {

    isExploded = true;

    particles.forEach(p => {

        const angle = Math.random() * Math.PI * 2;

        const speed = Math.random() * 10 + 10;

        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;

        p.alpha = 1;

        p.fade = 0.88 + Math.random() * 0.02;

        p.ease = 0.02;

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

