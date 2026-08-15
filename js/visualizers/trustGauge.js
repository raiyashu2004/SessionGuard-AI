/**
 * High-Performance Animated Trust Score Gauge (Canvas 60fps)
 * 
 * Renders circular glowing cybernetic arc with smooth interpolation,
 * multi-segment thresholds, and dynamic color shifts.
 */

export class TrustGaugeVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    
    this.currentScore = 96.0;
    this.targetScore = 96.0;
    this.animationId = null;

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
      // Smooth interpolation
      this.currentScore += (this.targetScore - this.currentScore) * 0.1;
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
    const radius = w * 0.40;

    ctx.clearRect(0, 0, w, h);

    const startAngle = 0.75 * Math.PI; // 135 deg
    const endAngle = 2.25 * Math.PI;   // 405 deg (270 deg sweep)
    const totalSweep = endAngle - startAngle;

    // 1. Background Arc Track
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    // 2. Active Score Progress Arc with Dynamic Color
    const scorePct = Math.max(0.01, this.currentScore / 100);
    const scoreSweep = startAngle + (totalSweep * scorePct);

    // Pick color based on score
    let strokeColor = '#10b981'; // Emerald
    let glowColor = 'rgba(16, 185, 129, 0.5)';
    if (this.currentScore < 50) {
      strokeColor = '#ef4444'; // Crimson
      glowColor = 'rgba(239, 68, 68, 0.6)';
    } else if (this.currentScore < 90) {
      strokeColor = '#f59e0b'; // Amber
      glowColor = 'rgba(245, 158, 11, 0.5)';
    }

    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 18;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, scoreSweep);
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
    ctx.restore();

    // 3. Subtle Tick Markers at 50% and 90%
    const warnAngle = startAngle + (totalSweep * 0.50);
    const verifyAngle = startAngle + (totalSweep * 0.90);

    this._drawTick(ctx, cx, cy, radius, warnAngle, '#f59e0b');
    this._drawTick(ctx, cx, cy, radius, verifyAngle, '#10b981');

    // 4. Subtle Outer Breathing Ring
    const pulseOffset = Math.sin(Date.now() * 0.003) * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 14 + pulseOffset, startAngle, endAngle);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = this.currentScore < 50 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(99, 102, 241, 0.15)';
    ctx.stroke();
  }

  _drawTick(ctx, cx, cy, r, angle, color) {
    const innerR = r - 12;
    const outerR = r + 12;
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
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
