const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

let particles = [];
let currentMsgIndex = -1; 
let isRunning = false; 

const messages = [
    { text: "ANH LỠ YÊU EM MẤT RỒI", time: 10000 }, 
    { text: "YÊU RẤT NHIỀU", time: 10000 },
    { text: "DÙ CHO EM CÓ NÓI", time: 10000 },
    { text: "RẰNG TA SẼ KHÔNG THỂ BÊN NHAU", time: 10000 },
    { text: "THÌ", time: 10000 }, 
    { text: "ANH VẪN LUÔN YÊU EM", time: 10000 },
    { text: "SẼ LUÔN ", time: 10000 },
    { text: "GỬI CHO EM NHỮNG LỜI CHÚC TỐT ĐẸP NHẤT", time: 15000 },
    { text: "HÃY LUÔN MỈM CƯỜI VÀ HẠNH PHÚC NHÉ!", time: 15000 },
    { text: "CHÚC EM 8/3 VUI VẺ :)))))", time: 20000 } 
]; 

function setCanvasSize() {
    const scale = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;
    ctx.imageSmoothingEnabled = false;
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
        this.size = isText ? 1.1 : 0.8; 
        this.baseColor = { h: 345, s: 99 }; 
        this.ease = isText ? 0.07 : 0.03; 
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
 
    for (let i = 0; i < 8000; i++) {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
   
        particles.push(new Particle(x, y, x, y, false));
    }
}

async function init(text) {
    const isMobile = window.innerWidth < 600;
    const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    let fontSize = text.length > 20 ? (isMobile ? 26 : 55) : (isMobile ? 45 : 100);
    const fontStr = `900 ${fontSize}px "Montserrat", sans-serif`;
    await document.fonts.load(fontStr); 

    const oldParticles = [...particles];
    let textParticles = [];
    let extraParticles = [];

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = fontStr;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";

    if (isMobile && text.length > 15) {
        const words = text.split(' ');
        const mid = Math.ceil(words.length / 2);
        ctx.fillText(words.slice(0, mid).join(' '), window.innerWidth / 2, window.innerHeight / 2 - fontSize / 1.2);
        ctx.fillText(words.slice(mid).join(' '), window.innerWidth / 2, window.innerHeight / 2 + fontSize / 1.2);
    } else {
        ctx.fillText(text, window.innerWidth / 2, window.innerHeight / 2);
    }

    const scale = window.devicePixelRatio || 1;
    const imageData = ctx.getImageData(0, 0, canvas.width * scale, canvas.height * scale);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let step;
    if (wordCount <= 2) {
        step = (isMobile ? 5 : 4) * scale;
    } else {
        step = (isMobile ? 1.8 : 1.5) * scale; 
    }

    let count = 0;
    for (let y = 0; y < canvas.height * scale; y += step) {
        for (let x = 0; x < canvas.width * scale; x += step) {
            const posX = Math.floor(x);
            const posY = Math.floor(y);
            const index = (posY * Math.floor(canvas.width * scale) + posX) * 4 + 3;

            if (imageData.data[index] > 120) {
                if (oldParticles[count]) {
                    let p = oldParticles[count];
                    p.targetX = posX / scale;
                    p.targetY = posY / scale;
                    p.isText = true;
                    p.size = 2.2;
                    textParticles.push(p);
                } else {
                    const p = new Particle(posX / scale, posY / scale, posX / scale, posY / scale, true);
                    textParticles.push(p);
                }
                count++;
            }
        }
    }

    while (count < oldParticles.length) {
        let p = oldParticles[count];
        p.targetX = Math.random() * window.innerWidth;
        p.targetY = Math.random() * window.innerHeight;
        p.isText = false;
        p.size = 1.5;
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
                p.targetX += (Math.random() - 0.5) * 100;
                p.targetY += (Math.random() - 0.5) * 100;
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
    await document.fonts.ready; 
    await document.fonts.load('900 40px "Montserrat"');
    ctx.font = '900 40px "Montserrat"';
    ctx.fillText("loading", -1000, -1000);
    initChaos();
    animate();
    console.log("Font ready!");
}

prepareFont();
