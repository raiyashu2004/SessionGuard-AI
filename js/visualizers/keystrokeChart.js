/**
 * Keystroke Dynamics Dwell & Flight Distribution Histogram (Canvas 60fps)
 * 
 * Compares the baseline statistical distribution against the live session histogram.
 */

export class KeystrokeHistogramVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.baselineMu = 95;
    this.baselineStd = 18;
    this.liveSamples = [];
    this.bins = new Array(16).fill(0);
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

  updateData(baselineProfile, liveDwells = []) {
    if (baselineProfile && baselineProfile.mu) {
      this.baselineMu = baselineProfile.mu.dwellMean || 95;
      this.baselineStd = baselineProfile.mu.dwellStd || 18;
    }

    if (liveDwells && liveDwells.length > 0) {
      this.liveSamples = [...liveDwells];
      // Bin samples across range 20ms to 220ms
      this.bins.fill(0);
      const minVal = 20;
      const maxVal = 220;
      const binWidth = (maxVal - minVal) / this.bins.length;

      this.liveSamples.forEach(val => {
        const binIdx = Math.min(this.bins.length - 1, Math.max(0, Math.floor((val - minVal) / binWidth)));
        this.bins[binIdx]++;
      });
    }
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
    const pad = 24;

    ctx.clearRect(0, 0, w, h);

    const chartW = w - pad * 2;
    const chartH = h - pad * 1.5;

    // Draw baseline Gaussian Bell Curve
    ctx.beginPath();
    const minVal = 20;
    const maxVal = 220;
    
    for (let px = 0; px <= chartW; px += 4) {
      const xVal = minVal + (px / chartW) * (maxVal - minVal);
      // Gaussian PDF
      const z = (xVal - this.baselineMu) / this.baselineStd;
      const pdf = Math.exp(-0.5 * z * z);
      const py = (h - pad) - (pdf * (chartH * 0.85));

      if (px === 0) ctx.moveTo(pad + px, py);
      else ctx.lineTo(pad + px, py);
    }

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fill baseline area
    ctx.lineTo(pad + chartW, h - pad);
    ctx.lineTo(pad, h - pad);
    ctx.closePath();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
    ctx.fill();

    // Draw Live Session Histogram Bins
    const numBins = this.bins.length;
    const barW = (chartW / numBins) - 2;
    const maxCount = Math.max(5, ...this.bins);

    for (let i = 0; i < numBins; i++) {
      const count = this.bins[i];
      if (count === 0) continue;

      const barH = (count / maxCount) * (chartH * 0.75);
      const bx = pad + i * (barW + 2);
      const by = (h - pad) - barH;

      ctx.fillStyle = 'rgba(16, 185, 129, 0.65)';
      ctx.fillRect(bx, by, barW, barH);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, barW, barH);
    }

    // Baseline Mean Line
    const meanNormX = ((this.baselineMu - minVal) / (maxVal - minVal)) * chartW;
    ctx.beginPath();
    ctx.moveTo(pad + meanNormX, pad * 0.5);
    ctx.lineTo(pad + meanNormX, h - pad);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Axis Labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '9px JetBrains Mono';
    ctx.fillText('20ms', pad, h - 6);
    ctx.fillText(`μ=${Math.round(this.baselineMu)}ms`, pad + meanNormX - 18, pad * 0.7);
    ctx.fillText('220ms', pad + chartW - 24, h - 6);
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
