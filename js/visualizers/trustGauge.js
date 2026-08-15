/**
 * High-Performance Animated Trust Score Gauge (Canvas 60fps)
 * 
 * Renders circular cybernetic luminescent arc with dynamic color gradients,
 * spark particle heads, smooth spring physics, and graduation ticks.
 */

export class TrustGaugeVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    
    this.currentScore = 96.8;
    this.targetScore = 96.8;
    this.animationId = null;
    this.sparkleAngle = 0;

    if (this.canvas) {
      this._initCanvasResolution();
      this.startLoop();
    }
  }

  _initCanvasResolution() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = (rect.width || 280) * dpr;
    this.canvas.height = (rect.height || 280) * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width || 280;
    this.height = rect.height || 280;
  }

  setScore(score) {
    this.targetScore = Math.max(0, Math.min(100, score));
  }

  startLoop() {
    const render = () => {
      // Smooth spring interpolation
      this.currentScore += (this.targetScore - this.currentScore) * 0.12;
      this.sparkleAngle += 0.04;
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
    const radius = w * 0.39;

    ctx.clearRect(0, 0, w, h);

    const startAngle = 0.75 * Math.PI; // 135 deg
    const endAngle = 2.25 * Math.PI;   // 405 deg (270 deg total sweep)
    const totalSweep = endAngle - startAngle;

    // 1. Background Arc Track
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.stroke();

    // 2. Active Score Progress Arc
    const scorePct = Math.max(0.01, Math.min(1.0, this.currentScore / 100));
    const scoreSweep = startAngle + (totalSweep * scorePct);

    // Pick dynamic colors
    let strokeColorStart = '#059669';
    let strokeColorEnd = '#10b981';
    let glowColor = 'rgba(16, 185, 129, 0.45)';

    if (this.currentScore < 50) {
      strokeColorStart = '#b91c1c';
      strokeColorEnd = '#ef4444';
      glowColor = 'rgba(239, 68, 68, 0.65)';
    } else if (this.currentScore < 90) {
      strokeColorStart = '#d97706';
      strokeColorEnd = '#f59e0b';
      glowColor = 'rgba(245, 158, 11, 0.5)';
    }

    // Create gradient
    const grad = ctx.createLinearGradient(0, h, w, 0);
    grad.addColorStop(0, strokeColorStart);
    grad.addColorStop(1, strokeColorEnd);

    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, scoreSweep);
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.strokeStyle = grad;
    ctx.stroke();
    ctx.restore();

    // 3. Glowing Head Sparkle Particle at the Arc Endpoint
    const headX = cx + Math.cos(scoreSweep) * radius;
    const headY = cy + Math.sin(scoreSweep) * radius;

    ctx.save();
    ctx.shadowColor = strokeColorEnd;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(headX, headY, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();

    // 4. Subtle Tick Markers at 50% (Warn) and 90% (Verified)
    const warnAngle = startAngle + (totalSweep * 0.50);
    const verifyAngle = startAngle + (totalSweep * 0.90);

    this._drawTick(ctx, cx, cy, radius, warnAngle, '#f59e0b', '50%');
    this._drawTick(ctx, cx, cy, radius, verifyAngle, '#10b981', '90%');

    // 5. Outer Cybernetic Reticle Ring
    const pulseOffset = Math.sin(Date.now() * 0.003) * 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 15 + pulseOffset, startAngle, endAngle);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = this.currentScore < 50 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(99, 102, 241, 0.18)';
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
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

    // Small label outside
    const lx = cx + Math.cos(angle) * (outerR + 10);
    const ly = cy + Math.sin(angle) * (outerR + 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
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
