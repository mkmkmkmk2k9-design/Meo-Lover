const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

let particles = [];
let currentMsgIndex = -1; 
let isRunning = false; 

// 1. KIỂM TRA THIẾT BỊ NGAY TỪ ĐẦU
const isMobile = window.innerWidth < 600;

const messages = [
    { text: "ANH LỠ YÊU EM MẤT RỒI", time: 4500 }, 
    { text: "YÊU RẤT NHIỀU", time: 5000 },
    { text: "DÙ CHO EM CÓ NÓI", time: 5500 },
    { text: "RẰNG TA SẼ KHÔNG THỂ BÊN NHAU", time: 6500 },
    { text: "THÌ", time: 6000 }, 
    { text: "ANH VẪN LUÔN YÊU EM", time: 7500 },
    { text: "SẼ LUÔN ", time: 7000 },
    { text: "GỬI CHO EM NHỮNG LỜI CHÚC TỐT ĐẸP NHẤT", time: 9000 },
    { text: "HÃY LUÔN MỈM CƯỜI VÀ HẠNH PHÚC NHÉ!", time: 10000 },
    { text: "CHÚC EM 8/3 VUI VẺ :)))))", time: 15000 } 
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
        // Tối ưu kích thước hạt cho Mobile để chữ nét hơn (giảm từ 1.6 xuống 1.4)
        this.size = isText ? (isMobile ? 1.4 : 2.2) : 0.8; 
        this.baseColor = { h: 345, s: 99 }; 
        // 2. TĂNG Ease TRÊN MOBILE ĐỂ HẠN BAY NHANH HƠN (0.12)
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
    // 3. CHIA SỐ HẠT: Máy tính 10k, Điện thoại 6k hạt
    const particleCount = isMobile ? 6000 : 10000;
 
    for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        particles.push(new Particle(x, y, x, y, false));
    }
}

async function init(text) {
    let fontSize;
    // 4. SỬA LỖI MẤT CHỮ: Giảm cỡ chữ tối đa trên Mobile xuống 30px (thay vì 38px)
    if (isMobile) {
        fontSize = text.length > 15 ? 22 : 30; // Giảm 30px để "YÊU RẤT NHIỀU" không bị tràn
    } else {
        fontSize = text.length > 15 ? 60 : 100;
    }

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

    // 5. GIẢM STEP ĐỂ CHỮ NÉT HƠN TRÊN MOBILE: 1.1 (thay vì 1.3)
    let step = (isMobile ? 1.1 : 1.8) * scale; 

    let count = 0;
    const data = imageData.data;
    const cols = Math.floor(canvas.width * scale);

    for (let y = 0; y < canvas.height * scale; y += step) {
        const rowOffset = Math.floor(y) * cols;
        for (let x = 0; x < canvas.width * scale; x += step) {
            const index = (rowOffset + Math.floor(x)) * 4 + 3;

            if (data[index] > 120) {
                // Kiểm tra và sử dụng hạt cũ, hoặc tạo mới nếu thiếu
                if (count < oldParticles.length) {
                    let p = oldParticles[count];
                    p.targetX = x / scale;
                    p.targetY = y / scale;
                    p.isText = true;
                    // Kích thước hạt chữ trên Mobile nhỏ hơn để nét chữ mảnh và sắc
                    p.size = isMobile ? 1.4 : 2.5; 
                    textParticles.push(p);
                    count++;
                } else {
                    // Nếu thiếu hạt, tạo hạt mới để chữ không bị thưa
                    const p = new Particle(x / scale, y / scale, x / scale, y / scale, true);
                    p.size = isMobile ? 1.4 : 2.5;
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
        p.size = isMobile ? 0.6 : 1.2; // Hạt nền li ti cho Mobile
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
            
            // Hiệu ứng hạt bung ra trước khi tụ lại thành chữ mới
            particles.forEach(p => {
                p.targetX += (Math.random() - 0.5) * 150; // Tăng độ bung cho Mobile
                p.targetY += (Math.random() - 0.5) * 150;
            });

            clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
                await init(currentObj.text);
                timeoutId = setTimeout(next, currentObj.time);
            }, 100); // Chờ 100ms cho hiệu ứng bung

        } else {
            // Kết thúc: Các hạt bay hỗn loạn
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
    // Tạo hiệu ứng đuôi mờ cho hạt
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; 
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
}

// Hỗ trợ cả chuột và chạm tay
window.addEventListener('mousedown', startSequence);
window.addEventListener('touchstart', startSequence, { passive: true });

// Khởi tạo
async function prepareFont() {
    // Đảm bảo font được tải xong trước khi vẽ
    await document.fonts.ready; 
    await document.fonts.load('900 40px "Montserrat"');
    ctx.font = '900 40px "Montserrat"';
    // Vẽ nháp để buộc trình duyệt tải font
    ctx.fillText("loading", -1000, -1000);
    initChaos();
    animate();
}

prepareFont();
