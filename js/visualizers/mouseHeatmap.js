/**
 * Live Cursor Trajectory & Kinematics Canvas Visualizer (Canvas 60fps)
 * 
 * Renders fluid motion ribbons, speed-responsive particle fireworks, and trajectory physics.
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
    
    // Normalize coordinates to canvas viewbox
    const normX = ((x % window.innerWidth) / window.innerWidth) * (this.width - 24) + 12;
    const normY = ((y % window.innerHeight) / window.innerHeight) * (this.height - 24) + 12;

    const point = {
      x: normX,
      y: normY,
      speed,
      time: Date.now()
    };

    this.points.push(point);
    if (this.points.length > 40) this.points.shift();

    // Spawn micro trailing particles
    const particleCount = speed > 600 ? 4 : 2;
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: normX + (Math.random() - 0.5) * 8,
        y: normY + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * (speed > 600 ? 2.5 : 1.2),
        vy: (Math.random() - 0.5) * (speed > 600 ? 2.5 : 1.2),
        life: 1.0,
        color: speed > 600 ? '#ef4444' : (speed > 350 ? '#06b6d4' : '#10b981')
      });
    }
    if (this.particles.length > 60) this.particles.shift();
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

    // Motion trail fade
    ctx.fillStyle = 'rgba(8, 12, 20, 0.22)';
    ctx.fillRect(0, 0, w, h);

    // Subtle Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw Smooth Ribbon Trajectory
    if (this.points.length > 2) {
      for (let i = 1; i < this.points.length; i++) {
        const p1 = this.points[i - 1];
        const p2 = this.points[i];
        const alpha = (i / this.points.length);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        
        ctx.lineWidth = Math.max(1, 3.2 * alpha);
        ctx.strokeStyle = p2.speed > 600 
          ? `rgba(239, 68, 68, ${alpha * 0.95})`
          : (p2.speed > 350 ? `rgba(6, 182, 212, ${alpha * 0.9})` : `rgba(16, 185, 129, ${alpha * 0.85})`);
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    }

    // Draw Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.035;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, 2.2 * p.life), 0, Math.PI * 2);
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
