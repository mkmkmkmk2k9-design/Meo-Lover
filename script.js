const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

let particles = [];
let currentMsgIndex = -1; 
let isRunning = false; 

const isMobile = window.innerWidth < 600;

const messages = [
    { text: "ANH LỠ YÊU EM MẤT RỒI", time: 10000 }, 
    { text: "YÊU RẤT NHIỀU", time: 10000 },
    { text: "DÙ CHO EM CÓ NÓI", time: 10000 },
    { text: "RẰNG TA SẼ KHÔNG THỂ BÊN NHAU", time: 12000 },
    { text: "THÌ", time: 8000 }, 
    { text: "ANH VẪN LUÔN YÊU EM", time: 10000 },
    { text: "SẼ LUÔN ", time: 10000 },
    { text: "GỬI CHO EM NHỮNG LỜI CHÚC TỐT ĐẸP NHẤT", time: 12000 },
    { text: "HÃY LUÔN MỈM CƯỜI VÀ HẠNH PHÚC NHÉ!", time: 12000 },
    { text: "CHÚC EM 8/3 VUI VẺ :)))))", time: 20000 } 
]; 

function setCanvasSize() {
    const scale = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
}
window.addEventListener('resize', setCanvasSize);
setCanvasSize();

class Particle {
    constructor(startX, startY, targetX, targetY, isText = false) {
        this.x = startX;
        this.y = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.isText = isText;
        this.size = isText ? (isMobile ? 1.2 : 2.2) : 0.8; 
        this.baseColor = { h: 345, s: 99 }; 
        this.ease = isText ? (isMobile ? 0.12 : 0.07) : 0.03; 
    }
    draw() {
        const lightness = this.isText ? 45 : 15;
        ctx.fillStyle = `hsl(${this.baseColor.h}, ${this.baseColor.s}%, ${lightness}%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
    update() {
        this.x += (this.targetX - this.x) * this.ease;
        this.y += (this.targetY - this.y) * this.ease;
    }
}

function initChaos() {
    particles = [];
    const particleCount = isMobile ? 5000 : 10000;
    for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        particles.push(new Particle(x, y, x, y, false));
    }
}

async function init(text) {
    let fontSize = isMobile ? (text.length > 15 ? 22 : 30) : (text.length > 15 ? 60 : 100);
    const fontStr = `${isMobile ? 700 : 900} ${fontSize}px "Montserrat", sans-serif`;
    
    try {
        await document.fonts.load(fontStr);
    } catch (e) {}

    const oldParticles = [...particles];
    let textParticles = [];
    let extraParticles = [];

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = fontStr;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";

    if (isMobile && text.includes(" ") && text.length > 10) {
        const words = text.split(' ');
        const mid = Math.ceil(words.length / 2);
        const line1 = words.slice(0, mid).join(' ');
        const line2 = words.slice(mid).join(' ');
        ctx.fillText(line1, window.innerWidth / 2, window.innerHeight / 2 - fontSize * 0.8);
        ctx.fillText(line2, window.innerWidth / 2, window.innerHeight / 2 + fontSize * 0.8);
    } else {
        ctx.fillText(text, window.innerWidth / 2, window.innerHeight / 2);
    }

    const scale = window.devicePixelRatio || 1;
    const imageData = ctx.getImageData(0, 0, canvas.width * scale, canvas.height * scale);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let step = (isMobile ? 1.6 : 1.8) * scale; 
    let count = 0;
    const data = imageData.data;
    const cols = Math.floor(canvas.width * scale);

    for (let y = 0; y < canvas.height * scale; y += step) {
        const rowOffset = Math.floor(y) * cols;
        for (let x = 0; x < canvas.width * scale; x += step) {
            const index = (rowOffset + Math.floor(x)) * 4 + 3;
            if (data[index] > 120) {
                if (count < oldParticles.length) {
                    let p = oldParticles[count];
                    p.targetX = x / scale;
                    p.targetY = y / scale;
                    p.isText = true;
                    p.size = isMobile ? 1.2 : 2.5; 
                    textParticles.push(p);
                    count++;
                }
            }
        }
    }

    while (count < oldParticles.length) {
        let p = oldParticles[count];
        p.targetX = Math.random() * window.innerWidth;
        p.targetY = Math.random() * window.innerHeight;
        p.isText = false;
        p.size = isMobile ? 0.5 : 1.2; 
        extraParticles.push(p);
        count++;
    }
    particles = [...extraParticles, ...textParticles];
}

let timeoutId; 
function startSequence() {
    if (isRunning) return;
    isRunning = true;
    currentMsgIndex = -1; 

    async function next() {
        currentMsgIndex++;
        if (currentMsgIndex < messages.length) {
            const currentObj = messages[currentMsgIndex];
            particles.forEach(p => {
                p.targetX += (Math.random() - 0.5) * 150; 
                p.targetY += (Math.random() - 0.5) * 150;
            });

            clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
                await init(currentObj.text);
                timeoutId = setTimeout(next, currentObj.time);
            }, 100); 

        } else {
            particles.forEach(p => {
                p.targetX = Math.random() * window.innerWidth;
                p.targetY = Math.random() * window.innerHeight;
                p.isText = false;
            });
            currentMsgIndex = -1;
            isRunning = false;
        }
    }
    next();
}

function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; 
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
}

window.addEventListener('mousedown', startSequence);
window.addEventListener('touchstart', startSequence, { passive: true });

async function prepareFont() {
    initChaos();
    animate();
    try {
        await document.fonts.ready;
    } catch (e) {}
}

prepareFont();
