/**
 * Live Cursor Trajectory & Kinematics Canvas Visualizer
 * 
 * Renders 60fps real-time particle trails, velocity vectors, and path curvature.
 */

export class MouseTrajectoryVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    
    this.points = [];
    this.particles = [];
    this.animationId = null;

    if (this.canvas) {
      this._initCanvasResolution();
      this.startLoop();
    }
  }

  _initCanvasResolution() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = (rect.width || 320) * dpr;
    this.canvas.height = (rect.height || 180) * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width || 320;
    this.height = rect.height || 180;
  }

  addPoint(x, y, speed = 300) {
    if (!this.canvas) return;
    
    // Normalize coordinates from window screen space to mini visualizer box
    const normX = ((x % window.innerWidth) / window.innerWidth) * (this.width - 20) + 10;
    const normY = ((y % window.innerHeight) / window.innerHeight) * (this.height - 20) + 10;

    const point = {
      x: normX,
      y: normY,
      speed,
      life: 1.0
    };

    this.points.push(point);
    if (this.points.length > 35) this.points.shift();

    // Spawn micro particles
    for (let i = 0; i < 2; i++) {
      this.particles.push({
        x: normX + (Math.random() - 0.5) * 6,
        y: normY + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        life: 1.0,
        color: speed > 600 ? '#ef4444' : (speed > 350 ? '#06b6d4' : '#10b981')
      });
    }
    if (this.particles.length > 50) this.particles.shift();
  }

  startLoop() {
    const render = () => {
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

    // Semi-transparent clear for motion trail
    ctx.fillStyle = 'rgba(6, 10, 18, 0.25)';
    ctx.fillRect(0, 0, w, h);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw Trajectory Ribbon
    if (this.points.length > 1) {
      for (let i = 1; i < this.points.length; i++) {
        const p1 = this.points[i - 1];
        const p2 = this.points[i];
        const alpha = (i / this.points.length);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        
        ctx.lineWidth = 2.5 * alpha;
        ctx.strokeStyle = p2.speed > 600 
          ? `rgba(239, 68, 68, ${alpha})`
          : (p2.speed > 350 ? `rgba(6, 182, 212, ${alpha})` : `rgba(16, 185, 129, ${alpha})`);
        
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }

    // Draw Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, 2 * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
