/**
 * Hackathon & Live Pitch Attack Simulation Engine
 * 
 * Simulates attacker hand-offs, session hijacking, and automated RAT bots
 * to prove continuous behavioral authentication live on stage.
 */

export class AttackSimulator {
  constructor(model, riskEngine, visualizerMouse, toastFn) {
    this.model = model;
    this.riskEngine = riskEngine;
    this.visualizerMouse = visualizerMouse;
    this.toast = toastFn;

    this.activeMode = 'legit'; // 'legit' | 'hijack' | 'bot'
    this.simInterval = null;

    this._bindControls();
  }

  _bindControls() {
    const btnLegit = document.getElementById('btnSimulateLegit');
    const btnHijack = document.getElementById('btnSimulateHijack');
    const btnBot = document.getElementById('btnSimulateBot');

    if (btnLegit) {
      btnLegit.addEventListener('click', () => this.setMode('legit'));
    }
    if (btnHijack) {
      btnHijack.addEventListener('click', () => this.setMode('hijack'));
    }
    if (btnBot) {
      btnBot.addEventListener('click', () => this.setMode('bot'));
    }
  }

  setMode(mode) {
    this.activeMode = mode;
    this._updateButtonsUI();

    if (this.simInterval) {
      clearInterval(this.simInterval);
      this.simInterval = null;
    }

    if (mode === 'legit') {
      this.model.clearSyntheticAnomalyOverride();
      this.riskEngine.resetDemoState();
      this.toast('✓ Mode: Legitimate User (Natural typing & mouse active)', 'emerald');
    } else if (mode === 'hijack') {
      this.model.setSyntheticAnomalyOverride({
        type: 'human_hijack',
        severity: 0.88
      });
      this.toast('⚡ ATTACK SIMULATION: Impersonator takeover in progress!', 'crimson');
      this._startSimulatedMovementStream('hijack');
    } else if (mode === 'bot') {
      this.model.setSyntheticAnomalyOverride({
        type: 'bot',
        severity: 0.96
      });
      this.toast('🤖 ATTACK SIMULATION: Robotic RAT macro injected!', 'amber');
      this._startSimulatedMovementStream('bot');
    }
  }

  _updateButtonsUI() {
    const btnLegit = document.getElementById('btnSimulateLegit');
    const btnHijack = document.getElementById('btnSimulateHijack');
    const btnBot = document.getElementById('btnSimulateBot');

    btnLegit?.classList.remove('active');
    btnHijack?.classList.remove('active');
    btnBot?.classList.remove('active');

    if (this.activeMode === 'legit') btnLegit?.classList.add('active');
    if (this.activeMode === 'hijack') btnHijack?.classList.add('active');
    if (this.activeMode === 'bot') btnBot?.classList.add('active');
  }

  _startSimulatedMovementStream(type) {
    let step = 0;
    this.simInterval = setInterval(() => {
      step++;
      if (type === 'hijack') {
        // Erratic jagged human movements
        const x = (Math.sin(step * 0.4) * 0.4 + 0.5) * window.innerWidth + (Math.random() - 0.5) * 120;
        const y = (Math.cos(step * 0.3) * 0.3 + 0.5) * window.innerHeight + (Math.random() - 0.5) * 120;
        this.visualizerMouse.addPoint(x, y, 780);
      } else {
        // Linear robotic jumps
        const x = (step % 10) * (window.innerWidth / 10);
        const y = 300;
        this.visualizerMouse.addPoint(x, y, 1200);
      }
    }, 120);
  }

  destroy() {
    if (this.simInterval) {
      clearInterval(this.simInterval);
    }
  }
}
