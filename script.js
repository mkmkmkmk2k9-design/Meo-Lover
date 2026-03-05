const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', {观察: true, willReadFrequently: true });

let particles = [];
let currentMsgIndex = -1; 
let isRunning = false; 

const isMobile = window.innerWidth < 600;
const messages = [
    { text: "ANH LỠ YÊU EM MẤT RỒI", time: 10000 }, 
    { text: "YÊU RẤT NHIỀU", time: 10000 },
    { text: "DÙ CHO EM CÓ NÓI", time: 10000 },
    { text: "RẰNG TA SẼ KHÔNG THỂ BÊN NHAU", time: 10000 },
    { text: "THÌ", time: 10000 }, 
    { text: "ANH VẪN LUÔN YÊU EM", time: 10000 },
    { text: "SẼ LUÔN ", time: 10000 },
    { text: "GỬI CHO EM NHỮNG LỜI CHÚC TỐT ĐẸP NHẤT", time: 12000 },
    { text: "HÃY LUÔN MỈM CƯỜI VÀ HẠNH PHÚC NHÉ!", time: 12000 },
    { text: "CHÚC EM 8/3 VUI VẺ :)))))", time: 15000 } 
]; 

function setCanvasSize() {
    const scale = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(scale, scale);
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
        // Hạt nền nhỏ hơn hạt chữ nhưng vẫn phải đủ để thấy
        this.size = isText ? (isMobile ? 1.5 : 2.5) : 1.0; 
        this.baseColor = { h: 345, s: 99 }; 
        this.ease = isText ? 0.15 : 0.05; 
    }
    
    draw() {
        // CHỈNH LẠI Ở ĐÂY:
        // Hạt chữ: Sáng (55%), Rõ (Opacity 1)
        // Hạt nền: Tối hơn (25%), Mờ nhẹ (Opacity 0.4) để vẫn nhìn thấy được
        const lightness = this.isText ? 55 : 25;
        const opacity = this.isText ? 1 : 0.4; 
        
        ctx.fillStyle = `hsla(${this.baseColor.h}, ${this.baseColor.s}%, ${lightness}%, ${opacity})`;
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
    const count = isMobile ? 6000 : 12000;
    for (let i = 0; i < count; i++) {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        particles.push(new Particle(x, y, x, y, false));
    }
}

async function init(text) {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    let fontSize = isMobile ? (text.length > 15 ? 26 : 38) : (text.length > 15 ? 70 : 100);
    ctx.font = `900 ${fontSize}px "Montserrat", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";

    const drawX = window.innerWidth / 2;
    const drawY = window.innerHeight / 2;

    if (isMobile && text.includes(" ") && text.length > 12) {
        const words = text.split(' ');
        const mid = Math.ceil(words.length / 2);
        ctx.fillText(words.slice(0, mid).join(' '), drawX, drawY - fontSize * 0.6);
        ctx.fillText(words.slice(mid).join(' '), drawX, drawY + fontSize * 0.6);
    } else {
        ctx.fillText(text, drawX, drawY);
    }

    const scale = window.devicePixelRatio || 1;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let textNodes = [];
    let step = isMobile ? 3 : 4; 

    for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
            const index = (y * canvas.width + x) * 4 + 3;
            if (data[index] > 120) { 
                textNodes.push({ x: x / scale, y: y / scale });
            }
        }
    }

    textNodes.sort(() => Math.random() - 0.5);

    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        if (i < textNodes.length) {
            p.targetX = textNodes[i].x;
            p.targetY = textNodes[i].y;
            p.isText = true;
            p.size = isMobile ? 1.6 : 2.6;
        } else {
            // CHỈNH LẠI Ở ĐÂY:
            // Cho hạt nền bay ngẫu nhiên nhưng không đứng yên một chỗ
            p.targetX = Math.random() * window.innerWidth;
            p.targetY = Math.random() * window.innerHeight;
            p.isText = false;
            p.size = 0.8; // Tăng size hạt nền lên một chút để dễ nhìn thấy hơn
        }
    }
}

function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)'; 
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    
    // Tách hạt làm 2 loại để vẽ theo thứ tự lớp (Layering)
    const backgroundParticles = [];
    const textParticles = [];
    
    for(let p of particles) {
        if(p.isText) textParticles.push(p);
        else backgroundParticles.push(p);
    }

    // 1. Vẽ hạt nền trước (nằm dưới)
    backgroundParticles.forEach(p => { p.update(); p.draw(); });

    // Vẽ hạt chữ (Lớp trên - đè lên hạt nền)
    textParticles.forEach(p => { p.update(); p.draw(); });

    requestAnimationFrame(animate);
}

function startSequence() {
    if (isRunning) return;
    isRunning = true;
    currentMsgIndex = -1; 

    const next = async () => {
        currentMsgIndex++;
        if (currentMsgIndex < messages.length) {
            particles.forEach(p => {
                p.targetX += (Math.random() - 0.5) * 100;
                p.targetY += (Math.random() - 0.5) * 100;
            });
            setTimeout(async () => {
                await init(messages[currentMsgIndex].text);
                setTimeout(next, messages[currentMsgIndex].time);
            }, 100);
        } else {
            isRunning = false;
            initChaos();
        }
    };
    next();
}

window.addEventListener('mousedown', startSequence);
window.addEventListener('touchstart', (e) => { e.preventDefault(); startSequence(); }, { passive: false });

document.fonts.ready.then(() => {
    initChaos();
    animate();
});
