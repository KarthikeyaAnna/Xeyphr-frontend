// frontend/js/hero-particles.js
const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d');

let width, height, centerX, centerY;
let particles = [];

function resize() {
    width = canvas.width = window.innerWidth;
    const heroSection = document.querySelector('.hero');
    height = canvas.height = heroSection ? heroSection.offsetHeight : 600;
    centerX = width / 2;
    centerY = height / 2;
}

window.addEventListener('resize', resize);

class Particle {
    constructor() {
        this.reset();
        this.dist = Math.random() * Math.max(width, height);
    }

    reset() {
        const arm = Math.floor(Math.random() * 4);
        if (arm === 0) this.angle = Math.PI / 4;       
        else if (arm === 1) this.angle = -Math.PI / 4; 
        else if (arm === 2) this.angle = 3 * Math.PI / 4; 
        else this.angle = -3 * Math.PI / 4;            
        
        this.dist = Math.random() * 10; 
        
        // Clean, elegant band thickness
        const thickness = 60; 
        this.scatter = (Math.random() + Math.random() + Math.random() - 1.5) * thickness;

        // Elegant tiny dots
        this.size = Math.random() * 1.5 + 0.5;
        
        // Extremely slow, cinematic drift speed (removed acceleration)
        this.speed = Math.random() * 0.4 + 0.1; 
        
        // 10% ambient stars for depth
        this.isAmbient = Math.random() > 0.90;
        if (this.isAmbient) {
            this.ambientX = (Math.random() - 0.5) * width * 1.5;
            this.ambientY = (Math.random() - 0.5) * height * 1.5;
        }
    }

    update() {
        if (!this.isAmbient) {
            this.dist += this.speed;
            
            // Linear, slow movement (no hyper-drive acceleration)
            if (this.dist > Math.max(width, height) * 1.2) {
                this.reset();
                this.dist = 0; 
            }
        } else {
            // Ambient stars drift very slowly downwards
            this.ambientY += 0.1;
            if (this.ambientY > height * 1.5) {
                this.ambientY = -height / 2;
            }
        }
    }

    draw() {
        let screenX, screenY;
        let opacity = 1;

        if (this.isAmbient) {
            screenX = centerX + this.ambientX;
            screenY = centerY + this.ambientY;
            opacity = 0.15; // Very dim
        } else {
            let baseX = Math.cos(this.angle) * this.dist;
            let baseY = Math.sin(this.angle) * this.dist;

            let normalAngle = this.angle + Math.PI / 2;
            let scatterX = Math.cos(normalAngle) * this.scatter;
            let scatterY = Math.sin(normalAngle) * this.scatter;

            screenX = centerX + baseX + scatterX;
            screenY = centerY + baseY + scatterY;
            
            // Slow elegant fade in
            opacity = Math.min(1, this.dist / 150);
        }

        if (screenX > -100 && screenX < width + 100 && screenY > -100 && screenY < height + 100) {
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`; // Pure white dots
            ctx.fill();
        }
    }
}

function init() {
    resize();
    particles = [];
    // 2000 particles for a refined look
    for (let i = 0; i < 2000; i++) {
        particles.push(new Particle());
    }
    animate();
}

function animate() {
    // Pure black void
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; 
    ctx.fillRect(0, 0, width, height);

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(animate);
}

document.addEventListener('DOMContentLoaded', init);
