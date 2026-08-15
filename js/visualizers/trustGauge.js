/**
 * Maximalist Quantum Trust Core Gauge (Canvas 60fps)
 * 
 * Renders multi-layered cybernetic reticle rings, glowing plasma arc,
 * spark particle heads, smooth spring physics, and graduation ticks.
 */

export class TrustGaugeVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    
    this.currentScore = 96.8;
    this.targetScore = 96.8;
    this.rotationAngle = 0;
    this.animationId = null;

    if (this.canvas) {
      this._initCanvasResolution();
      this.startLoop();

      window.addEventListener('resize', () => {
        this._initCanvasResolution();
      }, { passive: true });
    }
  }

  _initCanvasResolution() {
    if (!this.canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height, 280);
    
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.ctx.resetTransform?.() || this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.width = size;
    this.height = size;
  }

  setScore(score) {
    this.targetScore = Math.max(0, Math.min(100, score));
  }

  startLoop() {
    const render = () => {
      // Smooth spring interpolation
      this.currentScore += (this.targetScore - this.currentScore) * 0.12;
      this.rotationAngle += 0.008;
      this.draw();
      this.animationId = requestAnimationFrame(render);
    };
    render();
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = w * 0.38;

    ctx.clearRect(0, 0, w, h);

    const startAngle = 0.75 * Math.PI; // 135 deg
    const endAngle = 2.25 * Math.PI;   // 405 deg (270 deg total sweep)
    const totalSweep = endAngle - startAngle;

    // 1. Concentric Cyber Background Rings
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotationAngle);

    // Outer slow-spinning segmented ring
    ctx.beginPath();
    ctx.arc(0, 0, radius + 18, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.setLineDash([8, 12]);
    ctx.stroke();

    // Inner reverse-spinning segmented ring
    ctx.beginPath();
    ctx.arc(0, 0, radius - 18, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.12)';
    ctx.setLineDash([4, 8]);
    ctx.stroke();
    ctx.restore();

    // 2. Base Arc Track
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.stroke();

    // 3. Dynamic Color State
    const scorePct = Math.max(0.01, Math.min(1.0, this.currentScore / 100));
    const scoreSweep = startAngle + (totalSweep * scorePct);

    let strokeColorStart = '#059669';
    let strokeColorEnd = '#10b981';
    let glowColor = 'rgba(16, 185, 129, 0.5)';

    if (this.currentScore < 50) {
      strokeColorStart = '#b91c1c';
      strokeColorEnd = '#ef4444';
      glowColor = 'rgba(239, 68, 68, 0.75)';
    } else if (this.currentScore < 90) {
      strokeColorStart = '#d97706';
      strokeColorEnd = '#f59e0b';
      glowColor = 'rgba(245, 158, 11, 0.6)';
    }

    // Draw Glowing Plasma Progress Arc
    const grad = ctx.createLinearGradient(0, h, w, 0);
    grad.addColorStop(0, strokeColorStart);
    grad.addColorStop(1, strokeColorEnd);

    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 22;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, scoreSweep);
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.strokeStyle = grad;
    ctx.stroke();
    ctx.restore();

    // 4. Glowing Head Sparkle Particle
    const headX = cx + Math.cos(scoreSweep) * radius;
    const headY = cy + Math.sin(scoreSweep) * radius;

    ctx.save();
    ctx.shadowColor = strokeColorEnd;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(headX, headY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();

    // 5. Tactical Graduation Ticks
    const warnAngle = startAngle + (totalSweep * 0.50);
    const verifyAngle = startAngle + (totalSweep * 0.90);

    this._drawTick(ctx, cx, cy, radius, warnAngle, '#f59e0b', '50%');
    this._drawTick(ctx, cx, cy, radius, verifyAngle, '#10b981', '90%');
  }

  _drawTick(ctx, cx, cy, r, angle, color, label) {
    const innerR = r - 10;
    const outerR = r + 10;
    const x1 = cx + Math.cos(angle) * innerR;
    const y1 = cy + Math.sin(angle) * innerR;
    const x2 = cx + Math.cos(angle) * outerR;
    const y2 = cy + Math.sin(angle) * outerR;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.stroke();

    const lx = cx + Math.cos(angle) * (outerR + 10);
    const ly = cy + Math.sin(angle) * (outerR + 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '8px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, lx, ly);
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
