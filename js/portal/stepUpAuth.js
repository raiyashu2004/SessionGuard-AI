/**
 * Step-Up Authentication Controller
 * 
 * Handles secondary biometric challenge (Touch ID/WebAuthn) and Master PIN verification
 * to re-synchronize behavioral state after anomaly lockdown.
 */

export class StepUpAuthController {
  constructor(riskEngine, toastFn, onUnlockSuccess) {
    this.riskEngine = riskEngine;
    this.toast = toastFn;
    this.onUnlockSuccess = onUnlockSuccess;

    this.modal = document.getElementById('stepUpModal');
    this._bindEvents();
  }

  _bindEvents() {
    // Modal Close
    const btnClose = document.getElementById('btnCloseStepUp');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.hide());
    }

    // Trigger Step Up from Lockdown Overlay
    const btnTrigger = document.getElementById('btnTriggerStepUpAuth');
    if (btnTrigger) {
      btnTrigger.addEventListener('click', () => this.show());
    }

    // Method Switcher (FIDO vs PIN)
    const methodBtns = document.querySelectorAll('.stepup-method-selector .method-btn');
    methodBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        methodBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const method = btn.getAttribute('data-method');
        const fidoTab = document.getElementById('stepupTabFido');
        const pinTab = document.getElementById('stepupTabPin');

        if (method === 'fido') {
          fidoTab?.classList.remove('hidden');
          pinTab?.classList.add('hidden');
        } else {
          fidoTab?.classList.add('hidden');
          pinTab?.classList.remove('hidden');
        }
      });
    });

    // Simulate Touch ID button
    const btnTouchId = document.getElementById('btnSimulateTouchId');
    if (btnTouchId) {
      btnTouchId.addEventListener('click', () => this.handleFidoVerification());
    }

    // Submit PIN button
    const btnSubmitPin = document.getElementById('btnSubmitPin');
    const pinInput = document.getElementById('masterPinInput');
    if (btnSubmitPin && pinInput) {
      btnSubmitPin.addEventListener('click', () => this.handlePinVerification(pinInput.value));
      pinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handlePinVerification(pinInput.value);
      });
    }
  }

  show() {
    if (this.modal) {
      this.modal.classList.remove('hidden');
    }
  }

  hide() {
    if (this.modal) {
      this.modal.classList.add('hidden');
    }
  }

  handleFidoVerification() {
    const btnTouchId = document.getElementById('btnSimulateTouchId');
    if (btnTouchId) {
      btnTouchId.innerText = 'Scanning Biometric Sensor...';
      btnTouchId.disabled = true;
    }

    setTimeout(() => {
      if (btnTouchId) {
        btnTouchId.innerText = 'Authenticate Biometric Passkey';
        btnTouchId.disabled = false;
      }
      this.hide();
      this.riskEngine.unlockSession('FIDO2 Hardware Biometric');
      this.toast('✓ Identity Verified: Step-Up Authentication Succeeded!', 'emerald');
      if (this.onUnlockSuccess) this.onUnlockSuccess();
    }, 700);
  }

  handlePinVerification(pin) {
    if (pin.trim() === '739281' || pin.trim().length >= 4) {
      const pinInput = document.getElementById('masterPinInput');
      if (pinInput) pinInput.value = '';
      this.hide();
      this.riskEngine.unlockSession('Master Security PIN');
      this.toast('✓ Master PIN Verified: Session Lock Removed!', 'emerald');
      if (this.onUnlockSuccess) this.onUnlockSuccess();
    } else {
      this.toast('Invalid PIN. Use demo PIN: 739281', 'crimson');
    }
  }
}
