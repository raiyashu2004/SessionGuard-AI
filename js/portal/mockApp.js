/**
 * Protected High-Security Mock Portal Controller
 * 
 * Interacts with the SessionGuard Risk Engine to enforce continuous access policies
 * on banking wire transfers, API secrets, and DB administration.
 */

import { soundFX } from '../utils/audio.js';

export class MockPortalController {
  constructor(riskEngine, toastFn) {
    this.riskEngine = riskEngine;
    this.toast = toastFn;

    this.settlementCount = 2;
    this.secrets = {
      aws: 'MOCK_AWS_VAULT_KEY_DEMO_9104_XYZ88',
      stripe: 'MOCK_STRIPE_RESTRICTED_TOKEN_DEMO_4829',
      kube: 'MOCK_KUBE_ADMIN_SECRET_DEMO_8819'
    };

    this._bindPortalEvents();
  }

  _bindPortalEvents() {
    // 1. Navigation Tab Switching
    const tabBtns = document.querySelectorAll('.app-tabs .app-tab-btn, .portal-nav-tabs .tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.tab-pane, .tab-content').forEach(tc => {
          tc.classList.remove('active');
        });

        const activeContent = document.getElementById(`tab-${targetTab}`);
        if (activeContent) {
          activeContent.classList.add('active');
        }
      });
    });

    // 2. Wire Transfer Execution Button
    const btnExecuteWire = document.getElementById('btnExecuteWire');
    if (btnExecuteWire) {
      btnExecuteWire.addEventListener('click', () => this.handleWireTransfer());
    }

    // 3. Secret Key Reveal Buttons
    const revealBtns = document.querySelectorAll('.btn-reveal-secret');
    revealBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const secretKey = btn.getAttribute('data-secret');
        this.handleRevealSecret(secretKey, btn);
      });
    });

    // 4. Database Operations Buttons
    const btnDbExport = document.getElementById('btnDbExport');
    if (btnDbExport) {
      btnDbExport.addEventListener('click', () => this.handleDbExport());
    }

    const btnDbFlush = document.getElementById('btnDbFlush');
    if (btnDbFlush) {
      btnDbFlush.addEventListener('click', () => this.handleDbFlush());
    }
  }

  handleWireTransfer() {
    const currentScore = this.riskEngine.trustScore;
    const isLocked = this.riskEngine.isLocked;

    if (isLocked || currentScore < 75) {
      soundFX.playLockdownAlarm();
      this.toast('CRITICAL: Wire transfer blocked! Trust score insufficient for high-value asset dispatch.', 'crimson');
      return;
    }

    const recipient = document.getElementById('wireRecipient')?.value || 'Apex Global';
    const amount = document.getElementById('wireAmount')?.value || '75,000';
    const formattedAmt = Number(amount).toLocaleString();

    soundFX.playTrustChime();
    this.toast(`✓ Wire transfer of $${formattedAmt} to ${recipient} authorized & settled!`, 'emerald');

    // Add row to settlement table
    const tableBody = document.getElementById('settlementTableBody');
    if (tableBody) {
      const tr = document.createElement('tr');
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      tr.innerHTML = `
        <td>${now}</td>
        <td>${recipient}</td>
        <td class="mono font-bold">$${formattedAmt}</td>
        <td><span class="badge badge-success">Settled</span></td>
        <td><span class="mono text-emerald">${Math.round(currentScore)}% (Verified)</span></td>
      `;
      tableBody.prepend(tr);
    }
  }

  handleRevealSecret(secretKey, btnElement) {
    const currentScore = this.riskEngine.trustScore;
    const isLocked = this.riskEngine.isLocked;

    if (isLocked || currentScore < 80) {
      soundFX.playWarningBeep();
      this.toast('ACCESS DENIED: Production secrets reveal requires >= 80% behavioral trust.', 'amber');
      return;
    }

    const secretElem = document.getElementById(`secret${secretKey.charAt(0).toUpperCase() + secretKey.slice(1)}`);
    if (secretElem && this.secrets[secretKey]) {
      const originalText = secretElem.innerText;
      if (originalText.includes('••••')) {
        secretElem.innerText = this.secrets[secretKey];
        secretElem.style.color = '#38bdf8';
        btnElement.innerText = 'Hide Key';
        soundFX.playTrustChime();

        // Auto mask after 8 seconds
        setTimeout(() => {
          if (secretElem) {
            secretElem.innerText = '••••••••••••••••••••••••••••••••••••••••';
            secretElem.style.color = '';
            btnElement.innerText = 'Reveal Key';
          }
        }, 8000);
      } else {
        secretElem.innerText = '••••••••••••••••••••••••••••••••••••••••';
        secretElem.style.color = '';
        btnElement.innerText = 'Reveal Key';
      }
    }
  }

  handleDbExport() {
    const currentScore = this.riskEngine.trustScore;
    if (this.riskEngine.isLocked || currentScore < 70) {
      soundFX.playWarningBeep();
      this.toast('ACTION BLOCKED: Production DB snapshot requires verified identity.', 'amber');
      return;
    }
    soundFX.playTrustChime();
    this.toast('Snapshot created: db_cluster_prod_schema_enc.tar.gz (4.8 GB)', 'emerald');
  }

  handleDbFlush() {
    const currentScore = this.riskEngine.trustScore;
    if (this.riskEngine.isLocked || currentScore < 85) {
      soundFX.playLockdownAlarm();
      this.toast('CRITICAL REJECTION: Global session cache flush requires >= 85% continuous trust!', 'crimson');
      return;
    }
    soundFX.playTrustChime();
    this.toast('Redis Session Cache flushed successfully.', 'emerald');
  }

  updateLockdownState(isLocked, score, reasons = {}) {
    const overlay = document.getElementById('portalLockdownOverlay');
    const scoreDisplay = document.getElementById('lockdownScoreDisplay');
    const reasonsContainer = document.getElementById('lockdownAnomalyReasons');

    if (overlay) {
      if (isLocked) {
        overlay.classList.add('active');
        if (scoreDisplay) scoreDisplay.innerText = `${Math.round(score)}%`;
        
        if (reasonsContainer && reasons) {
          reasonsContainer.innerHTML = `
            <div class="reason-chip">⚠️ Mouse Curvature Divergence: <strong>+${reasons.curvature || 280}%</strong></div>
            <div class="reason-chip">⚠️ Keystroke Flight Time Drift: <strong>+${reasons.flight || 240}%</strong></div>
            <div class="reason-chip">⚠️ Micro-Jitter Inconsistency: <strong>High</strong></div>
          `;
        }
      } else {
        overlay.classList.remove('active');
      }
    }
  }
}
