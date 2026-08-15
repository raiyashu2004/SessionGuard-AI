/**
 * Keystroke Dynamics Dwell & Flight Distribution Histogram (Canvas 60fps)
 * 
 * Compares the baseline Gaussian distribution against the live session histogram.
 */

export class KeystrokeHistogramVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.baselineMu = 95.0;
    this.baselineStd = 18.0;
    this.liveSamples = [];
    this.bins = new Array(18).fill(0);
    this.targetBins = new Array(18).fill(0);
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
    const w = rect.width || 320;
    const h = rect.height || 140;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.resetTransform?.() || this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.width = w;
    this.height = h;
  }

  updateData(baselineProfile, liveDwells = []) {
    if (baselineProfile && baselineProfile.mu) {
      this.baselineMu = baselineProfile.mu.dwellMean || 95.0;
      this.baselineStd = baselineProfile.mu.dwellStd || 18.0;
    }

    if (liveDwells && liveDwells.length > 0) {
      this.liveSamples = [...liveDwells];
      this.targetBins.fill(0);
      const minVal = 20;
      const maxVal = 240;
      const binWidth = (maxVal - minVal) / this.targetBins.length;

      this.liveSamples.forEach(val => {
        const binIdx = Math.min(this.targetBins.length - 1, Math.max(0, Math.floor((val - minVal) / binWidth)));
        this.targetBins[binIdx]++;
      });

      const sampleCountElem = document.getElementById('histSampleCount');
      if (sampleCountElem) sampleCountElem.innerText = this.liveSamples.length;
    }
  }

  startLoop() {
    const render = () => {
      // Smooth bar transitions
      for (let i = 0; i < this.bins.length; i++) {
        this.bins[i] += (this.targetBins[i] - this.bins[i]) * 0.15;
      }
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
    const pad = 24;

    ctx.clearRect(0, 0, w, h);

    const chartW = w - pad * 2;
    const chartH = h - pad * 1.5;

    // Draw baseline Gaussian Bell Curve
    ctx.beginPath();
    const minVal = 20;
    const maxVal = 240;
    
    for (let px = 0; px <= chartW; px += 3) {
      const xVal = minVal + (px / chartW) * (maxVal - minVal);
      const z = (xVal - this.baselineMu) / this.baselineStd;
      const pdf = Math.exp(-0.5 * z * z);
      const py = (h - pad) - (pdf * (chartH * 0.88));

      if (px === 0) ctx.moveTo(pad + px, py);
      else ctx.lineTo(pad + px, py);
    }

    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fill baseline area with smooth gradient
    ctx.lineTo(pad + chartW, h - pad);
    ctx.lineTo(pad, h - pad);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad, 0, h - pad);
    grad.addColorStop(0, 'rgba(99, 102, 241, 0.22)');
    grad.addColorStop(1, 'rgba(99, 102, 241, 0.02)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw Live Session Histogram Bins
    const numBins = this.bins.length;
    const barW = (chartW / numBins) - 2;
    const maxCount = Math.max(4, ...this.bins);

    for (let i = 0; i < numBins; i++) {
      const count = this.bins[i];
      if (count <= 0.05) continue;

      const barH = (count / maxCount) * (chartH * 0.75);
      const bx = pad + i * (barW + 2);
      const by = (h - pad) - barH;

      ctx.fillStyle = 'rgba(16, 185, 129, 0.65)';
      ctx.fillRect(bx, by, barW, barH);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, barW, barH);
    }

    // Baseline Mean Vertical Line
    const meanNormX = ((this.baselineMu - minVal) / (maxVal - minVal)) * chartW;
    ctx.beginPath();
    ctx.moveTo(pad + meanNormX, pad * 0.4);
    ctx.lineTo(pad + meanNormX, h - pad);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Axis Labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '8px JetBrains Mono';
    ctx.fillText('20ms', pad, h - 5);
    ctx.fillText(`μ=${Math.round(this.baselineMu)}ms`, pad + meanNormX - 16, pad * 0.6);
    ctx.fillText('240ms', pad + chartW - 22, h - 5);
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
