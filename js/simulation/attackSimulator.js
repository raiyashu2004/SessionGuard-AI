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

    this.activeMode = 'legit'; // 'legit' | 'hijack' | 'bot' | 'stuffer'
    this.simInterval = null;

    this._bindControls();
  }

  _bindControls() {
    const btnLegit = document.getElementById('btnSimulateLegit');
    const btnHijack = document.getElementById('btnSimulateHijack');
    const btnBot = document.getElementById('btnSimulateBot');
    const btnStuffer = document.getElementById('btnSimulateStuffer');

    if (btnLegit) {
      btnLegit.addEventListener('click', () => this.setMode('legit'));
    }
    if (btnHijack) {
      btnHijack.addEventListener('click', () => this.setMode('hijack'));
    }
    if (btnBot) {
      btnBot.addEventListener('click', () => this.setMode('bot'));
    }
    if (btnStuffer) {
      btnStuffer.addEventListener('click', () => this.setMode('stuffer'));
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
    } else if (mode === 'stuffer') {
      this.model.setSyntheticAnomalyOverride({
        type: 'stuffer',
        severity: 0.94
      });
      this.toast('💥 ATTACK SIMULATION: Automated Credential Stuffer active!', 'crimson');
      this._startSimulatedMovementStream('stuffer');
    }
  }

  _updateButtonsUI() {
    const btnLegit = document.getElementById('btnSimulateLegit');
    const btnHijack = document.getElementById('btnSimulateHijack');
    const btnBot = document.getElementById('btnSimulateBot');
    const btnStuffer = document.getElementById('btnSimulateStuffer');

    btnLegit?.classList.remove('active');
    btnHijack?.classList.remove('active');
    btnBot?.classList.remove('active');
    btnStuffer?.classList.remove('active');

    if (this.activeMode === 'legit') btnLegit?.classList.add('active');
    if (this.activeMode === 'hijack') btnHijack?.classList.add('active');
    if (this.activeMode === 'bot') btnBot?.classList.add('active');
    if (this.activeMode === 'stuffer') btnStuffer?.classList.add('active');
  }

  _startSimulatedMovementStream(type) {
    let step = 0;
    this.simInterval = setInterval(() => {
      step++;
      if (type === 'hijack') {
        // Erratic jagged human movements
        const x = (Math.sin(step * 0.45) * 0.4 + 0.5) * window.innerWidth + (Math.random() - 0.5) * 140;
        const y = (Math.cos(step * 0.35) * 0.3 + 0.5) * window.innerHeight + (Math.random() - 0.5) * 140;
        this.visualizerMouse.addPoint(x, y, 780);
      } else if (type === 'bot') {
        // Linear robotic jumps
        const x = (step % 12) * (window.innerWidth / 12);
        const y = 280;
        this.visualizerMouse.addPoint(x, y, 1200);
      } else if (type === 'stuffer') {
        // Rapid staccato oscillations
        const x = window.innerWidth * 0.5 + (step % 2 === 0 ? 80 : -80);
        const y = window.innerHeight * 0.5 + (step % 3 === 0 ? 50 : -50);
        this.visualizerMouse.addPoint(x, y, 950);
      }
    }, 110);
  }

  destroy() {
    if (this.simInterval) {
      clearInterval(this.simInterval);
    }
  }
}
