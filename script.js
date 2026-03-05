const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

let particles = [];
let currentMsgIndex = -1; 
let isRunning = false; 
const isMobile = window.innerWidth < 600;

const messages = [
    { text: "ANH LỠ YÊU EM MẤT RỒI", time: 6000 }, 
    { text: "YÊU RẤT NHIỀU", time: 5500 },
    { text: "DÙ CHO EM CÓ NÓI", time: 5500 },
    { text: "RẰNG TA SẼ KHÔNG THỂ BÊN NHAU", time: 6000 },
    { text: "THÌ", time: 3500 }, 
    { text: "ANH VẪN LUÔN YÊU EM", time: 5500 },
    { text: "SẼ LUÔN ", time: 3500 },
    { text: "GỬI CHO EM NHỮNG LỜI CHÚC TỐT ĐẸP NHẤT", time: 8000 },
    { text: "HÃY LUÔN MỈM CƯỜI VÀ HẠNH PHÚC NHÉ!", time: 8000 },
    { text: "CHÚC EM 8/3 VUI VẺ :)))))", time: 10000 } 
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
    const count = isMobile ? 5500 : 10000;
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(Math.random()*window.innerWidth, Math.random()*window.innerHeight));
    }
}

async function init(text) {
    const scale = window.devicePixelRatio || 1;
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');
    
    // Tăng độ phân giải cho canvas phụ để quét dấu tiếng Việt chuẩn hơn
    offCanvas.width = canvas.width;
    offCanvas.height = canvas.height;

    // Cấu hình Font linh hoạt theo màn hình
    let fontSize = isMobile ? 28 : 85; 
    if (text.length > 20) fontSize = isMobile ? 18 : 60;

    offCtx.scale(scale, scale);
    offCtx.font = `900 ${fontSize}px "Montserrat", sans-serif`;
    offCtx.textAlign = "center";
    offCtx.textBaseline = "middle";
    
    // GIẢI PHÁP 1: Giãn cách chữ trên mobile rộng hơn để tránh dính nét
    const letterSpacing = isMobile ? "4px" : "2px";
    offCanvas.style.letterSpacing = letterSpacing;
    offCtx.canvas.style.letterSpacing = letterSpacing;
    
    offCtx.fillStyle = "white";

    const drawX = window.innerWidth / 2;
    const drawY = window.innerHeight / 2;
    const words = text.split(' ');

    if (words.length > 3 || text.length > 15) {
        const mid = Math.ceil(words.length / 2);
        // GIẢI PHÁP 2: Tăng khoảng cách dòng trên mobile (0.85) để dấu không chạm chữ
        const lineGap = isMobile ? 0.85 : 0.75;
        offCtx.fillText(words.slice(0, mid).join(' '), drawX, drawY - fontSize * lineGap);
        offCtx.fillText(words.slice(mid).join(' '), drawX, drawY + fontSize * lineGap);
    } else {
        offCtx.fillText(text, drawX, drawY);
    }

    const imageData = offCtx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let textNodes = [];

    // GIẢI PHÁP 3: Điều chỉnh bước quét (step) cực mịn cho điện thoại
    // Mobile cần bước quét nhỏ hơn (1.6) để nhận diện các dấu nhỏ (hỏi, ngã)
    let step = isMobile ? 1.6 : 2.5; 

    for (let y = 0; y < canvas.height; y += step * scale) {
        for (let x = 0; x < canvas.width; x += step * scale) {
            const index = (Math.floor(y) * canvas.width + Math.floor(x)) * 4 + 3;
            // Ngưỡng Alpha 150 để lấy nét chữ sắc sảo, không bị nhòe rìa
            if (data[index] > 150) { 
                textNodes.push({ x: x / scale, y: y / scale });
            }
        }
    }

    // Tự động bù hạt nếu số lượng điểm chữ lớn hơn số hạt hiện có
    while (particles.length < textNodes.length) {
        particles.push(new Particle(Math.random() * window.innerWidth, Math.random() * window.innerHeight));
    }

    textNodes.sort(() => Math.random() - 0.5);

    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        if (i < textNodes.length) {
            p.targetX = textNodes[i].x;
            p.targetY = textNodes[i].y;
            p.isText = true;
            // GIẢI PHÁP 4: Kích thước hạt nhỏ hơn trên Mobile (1.4) để tạo khe hở giữa các nét
            p.size = isMobile ? 1.4 : 2.2;
            p.ease = 0.12;
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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; 
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    
    // Vẽ 2 lượt: Nền trước, Chữ sau (Tránh lag mảng)
    for(let i=0; i<particles.length; i++) { if(!particles[i].isText) { particles[i].update(); particles[i].draw(); } }
    for(let i=0; i<particles.length; i++) { if(particles[i].isText) { particles[i].update(); particles[i].draw(); } }

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
            // --- ĐOẠN FIX KẾT THÚC Ở ĐÂY ---
            isRunning = false;
            particles.forEach(p => {
                p.isText = false; // Tắt trạng thái hạt chữ
                p.targetX = Math.random() * window.innerWidth; // Bay ngẫu nhiên
                p.targetY = Math.random() * window.innerHeight;
                p.size = 1.0; // Trả về kích thước hạt nhỏ như ban đầu
                p.ease = 0.03; // Giảm tốc độ để hạt bay trôi lờ đờ, tự nhiên hơn
            });
            // ------------------------------
        }
    };
    next();
}

window.addEventListener('mousedown', startSequence);
window.addEventListener('touchstart', (e) => { e.preventDefault(); startSequence(); }, { passive: false });

// Warm-up font
document.fonts.ready.then(async () => {
    await document.fonts.load(`900 20px "Montserrat"`);
    initChaos();
    animate();
});
