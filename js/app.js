/**
 * SESSIONGUARD-AI — Master Application Controller
 * 
 * Orchestrates event capture, feature extraction, ML scoring, risk policy,
 * live visualizers, enrollment calibration, and forensic auditing.
 */

import { soundFX } from './utils/audio.js';
import { BehavioralCaptureLayer } from './engine/capture.js';
import { FeatureExtractor } from './engine/featureExtractor.js';
import { AnomalyDetectionModel } from './engine/model.js';
import { RiskEngine, RISK_STATES } from './engine/riskEngine.js';
import { TrustGaugeVisualizer } from './visualizers/trustGauge.js';
import { MouseTrajectoryVisualizer } from './visualizers/mouseHeatmap.js';
import { KeystrokeHistogramVisualizer } from './visualizers/keystrokeChart.js';
import { MockPortalController } from './portal/mockApp.js';
import { StepUpAuthController } from './portal/stepUpAuth.js';
import { AttackSimulator } from './simulation/attackSimulator.js';

class SessionGuardApp {
  constructor() {
    this.capture = new BehavioralCaptureLayer();
    this.featureExtractor = new FeatureExtractor();
    this.model = new AnomalyDetectionModel();
    this.riskEngine = new RiskEngine();

    this.toastContainer = document.getElementById('toastContainer');

    // Visualizers
    this.gaugeVis = new TrustGaugeVisualizer('trustGaugeCanvas');
    this.mouseVis = new MouseTrajectoryVisualizer('mouseTrajectoryCanvas');
    this.keyHistVis = new KeystrokeHistogramVisualizer('keystrokeHistCanvas');

    // Controllers
    this.portal = new MockPortalController(this.riskEngine, (msg, type) => this.showToast(msg, type));
    this.stepUp = new StepUpAuthController(
      this.riskEngine,
      (msg, type) => this.showToast(msg, type),
      () => this.onSessionUnlocked()
    );
    this.attackSim = new AttackSimulator(
      this.model,
      this.riskEngine,
      this.mouseVis,
      (msg, type) => this.showToast(msg, type)
    );

    this.scoringInterval = null;
    this.calibrationData = {
      dwellTimes: [],
      flightTimes: [],
      mouseSpeeds: [],
      curvatures: [],
      clickHolds: []
    };

    this.init();
  }

  init() {
    this._bindGlobalEvents();
    this._bindEnrollmentWizard();
    this._bindForensicModal();
    this._bindRiskEngineListeners();
    this._startContinuousScoringLoop();

    // Connect raw capture to live visualizers
    this.capture.onEvent((type, data) => {
      if (type === 'mousemove') {
        this.mouseVis.addPoint(data.x, data.y, data.speed);
      }
    });

    this.showToast('SessionGuard AI Zero-Trust Security Active. Continuous verification enabled.', 'emerald');
  }

  _bindGlobalEvents() {
    // Sound Toggle
    const btnToggleSound = document.getElementById('btnToggleSound');
    const soundOn = document.getElementById('soundIconOn');
    const soundOff = document.getElementById('soundIconOff');
    if (btnToggleSound) {
      btnToggleSound.addEventListener('click', () => {
        const isEnabled = soundFX.toggleSound();
        if (isEnabled) {
          soundOn?.classList.remove('hidden');
          soundOff?.classList.add('hidden');
          this.showToast('Audio feedback enabled', 'emerald');
        } else {
          soundOn?.classList.add('hidden');
          soundOff?.classList.remove('hidden');
          this.showToast('Audio feedback muted', 'amber');
        }
      });
    }

    // Policy Sensitivity Switcher
    const policySelect = document.getElementById('policySelect');
    if (policySelect) {
      policySelect.addEventListener('change', (e) => {
        const pKey = e.target.value;
        this.riskEngine.setPolicy(pKey);
        this.showToast(`Zero-Trust Risk Policy updated to: ${pKey.toUpperCase()}`, 'cyan');
      });
    }

    // Interactive Prompt Chips in Sandbox
    const promptChips = document.querySelectorAll('.prompt-chip');
    const sandboxInput = document.getElementById('telemetryPlaygroundInput');
    promptChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.getAttribute('data-text');
        if (sandboxInput && text) {
          sandboxInput.value = text;
          sandboxInput.focus();
          soundFX.playSubtleTick();
          this.showToast('Injected behavioral simulation prompt!', 'emerald');
        }
      });
    });

    // Profile Switcher
    const profileSelect = document.getElementById('userProfileSelect');
    if (profileSelect) {
      profileSelect.addEventListener('change', (e) => {
        const key = e.target.value;
        this.model.setActiveProfile(key);
        const profile = this.model.getActiveProfile();
        this.keyHistVis.updateData(profile);
        this.showToast(`Switched active baseline profile to: ${profile.name}`, 'emerald');
      });
    }

    // Dismiss lockdown demo button
    const btnDismissLock = document.getElementById('btnDismissLockDemo');
    if (btnDismissLock) {
      btnDismissLock.addEventListener('click', () => {
        this.attackSim.setMode('legit');
      });
    }

    // Clear telemetry log stream button
    const btnClearStream = document.getElementById('btnClearTelemetryLog');
    if (btnClearStream) {
      btnClearStream.addEventListener('click', () => {
        const streamContainer = document.getElementById('telemetryLogStream');
        if (streamContainer) streamContainer.innerHTML = '';
      });
    }
  }

  _bindRiskEngineListeners() {
    this.riskEngine.onRiskUpdate((event, payload) => {
      if (event === 'trust_update') {
        this._updateDashboardUI(payload);
      } else if (event === 'lockdown_triggered') {
        this.portal.updateLockdownState(true, payload.score, payload.reasons);
        this._updateGlobalBadge('CRITICAL: HIJACK LOCKED', 'danger');
      } else if (event === 'session_recovered') {
        this.portal.updateLockdownState(false, payload.score);
        this._updateGlobalBadge('CONTINUOUS AUTH ACTIVE', 'emerald');
      } else if (event === 'forensic_log') {
        this._appendTelemetryStreamEntry(payload);
      }
    });
  }

  _updateDashboardUI(payload) {
    const score = payload.trustScore;
    const confidence = payload.modelConfidence;
    const state = payload.state;
    const scoreResult = payload.scoreResult;
    const features = payload.liveFeatures;

    // 1. Update Canvas Gauge
    this.gaugeVis.setScore(score);

    // 2. Update Model Confidence
    const confElem = document.getElementById('modelConfidenceVal');
    if (confElem && confidence) {
      confElem.innerText = `${confidence}%`;
    }

    // 2. Update Gauge Center Typography
    const scoreValElem = document.getElementById('trustScoreVal');
    const statusLabel = document.getElementById('trustStatusLabel');
    if (scoreValElem) scoreValElem.innerText = Math.round(score);

    if (statusLabel) {
      if (state === RISK_STATES.VERIFIED) {
        statusLabel.innerText = 'IDENTITY VERIFIED';
        statusLabel.style.color = '#10b981';
        statusLabel.style.background = 'rgba(16, 185, 129, 0.12)';
        statusLabel.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        scoreValElem.style.color = '#10b981';
      } else if (state === RISK_STATES.WARNING) {
        statusLabel.innerText = 'BEHAVIORAL DRIFT';
        statusLabel.style.color = '#f59e0b';
        statusLabel.style.background = 'rgba(245, 158, 11, 0.12)';
        statusLabel.style.borderColor = 'rgba(245, 158, 11, 0.3)';
        scoreValElem.style.color = '#f59e0b';
      } else {
        statusLabel.innerText = 'SESSION HIJACK DETECTED';
        statusLabel.style.color = '#ef4444';
        statusLabel.style.background = 'rgba(239, 68, 68, 0.15)';
        statusLabel.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        scoreValElem.style.color = '#ef4444';
      }
    }

    // 3. Update Anomaly Feature Progress Bars
    if (scoreResult && scoreResult.featureDivergences) {
      const divs = scoreResult.featureDivergences;
      this._updateBar('Dwell', divs.dwell);
      this._updateBar('Flight', divs.flight);
      this._updateBar('Velocity', divs.velocity);
      this._updateBar('Curvature', divs.curvature);
      this._updateBar('Click', divs.click);
    }

    // 4. Update Telemetry Tickers
    if (features) {
      const tDwell = document.getElementById('tickerDwell');
      const tFlight = document.getElementById('tickerFlight');
      const tVel = document.getElementById('tickerVelocity');
      const tCurv = document.getElementById('tickerCurvature');

      if (tDwell) tDwell.innerText = `${Math.round(features.dwellMean || 95)} ms`;
      if (tFlight) tFlight.innerText = `${Math.round(features.flightMean || 110)} ms`;
      if (tVel) tVel.innerText = `${Math.round(features.velocityMean || 380)} px/s`;
      if (tCurv) tCurv.innerText = `${(features.curvatureIndex || 1.25).toFixed(2)}`;

      // Update Keystroke Chart
      if (features.keyDwellSamples) {
        this.keyHistVis.updateData(this.model.getActiveProfile(), features.keyDwellSamples);
      }
    }

    // 5. Update Mahalanobis Distance and Samples
    if (scoreResult) {
      const histDist = document.getElementById('histDistanceVal');
      if (histDist) histDist.innerText = scoreResult.mahalanobisD2;
    }
  }

  _updateBar(key, percentage) {
    const fillElem = document.getElementById(`barFill${key}`);
    const valElem = document.getElementById(`barVal${key}`);

    if (fillElem && valElem) {
      fillElem.style.width = `${Math.min(100, percentage)}%`;
      valElem.innerText = `${percentage}% Divergence`;

      fillElem.className = 'progress-fill';
      if (percentage < 30) {
        fillElem.classList.add('progress-emerald');
        valElem.className = 'mono feature-val-tag text-emerald';
      } else if (percentage < 65) {
        fillElem.classList.add('progress-amber');
        valElem.className = 'mono feature-val-tag text-warning';
      } else {
        fillElem.classList.add('progress-crimson');
        valElem.className = 'mono feature-val-tag text-danger';
      }
    }
  }

  _updateGlobalBadge(text, level) {
    const badge = document.getElementById('globalStatusBadge');
    const label = document.getElementById('globalStatusText');
    if (badge && label) {
      label.innerText = text;
      badge.className = 'system-status-badge';
      if (level === 'danger') badge.classList.add('status-danger');
      else if (level === 'warning') badge.classList.add('status-warning');
    }
  }

  _appendTelemetryStreamEntry(entry) {
    const streamContainer = document.getElementById('telemetryLogStream');
    if (!streamContainer) return;

    const div = document.createElement('div');
    let entryClass = 'entry-pass';
    let badgeClass = 'badge-pass';
    let badgeText = 'PASS';

    if (entry.state === RISK_STATES.WARNING) {
      entryClass = 'entry-warn';
      badgeClass = 'badge-warn';
      badgeText = 'WARN';
    } else if (entry.state === RISK_STATES.LOCKED) {
      entryClass = 'entry-alert';
      badgeClass = 'badge-alert';
      badgeText = 'ALERT';
    }

    div.className = `stream-entry ${entryClass}`;
    div.innerHTML = `
      <span class="stream-time">${entry.timeFormatted}</span>
      <span class="stream-badge ${badgeClass}">${badgeText}</span>
      <span class="stream-msg">${entry.message} (Score: ${entry.score}%)</span>
    `;

    streamContainer.prepend(div);
    while (streamContainer.children.length > 25) {
      streamContainer.removeChild(streamContainer.lastChild);
    }
  }

  _startContinuousScoringLoop() {
    this.scoringInterval = setInterval(() => {
      // 1. Flush sliding window from capture layer
      const eventWindow = this.capture.flushWindow();

      // 2. Extract normalized feature vector
      const featureResult = this.featureExtractor.extractFeatures(eventWindow);

      // 3. Score against active baseline model
      const scoreResult = this.model.score(featureResult.features);

      // 4. Process through continuous risk engine
      this.riskEngine.processAnomalyScore(scoreResult, featureResult.features);

    }, 1800); // 1.8s sliding window
  }

  onSessionUnlocked() {
    this.attackSim.setMode('legit');
    this.portal.updateLockdownState(false, 96.0);
  }

  // =========================================================================
  // ENROLLMENT WIZARD & CALIBRATION
  // =========================================================================
  _bindEnrollmentWizard() {
    const modal = document.getElementById('enrollmentModal');
    const btnOpen = document.getElementById('btnOpenEnrollment');
    const btnClose = document.getElementById('btnCloseEnrollment');

    if (btnOpen && modal) {
      btnOpen.addEventListener('click', () => {
        modal.classList.remove('hidden');
        this._resetEnrollmentWizard();
      });
    }

    if (btnClose && modal) {
      btnClose.addEventListener('click', () => modal.classList.add('hidden'));
    }

    // Stage 1 Typing Input
    const typingInput = document.getElementById('enrollTypingInput');
    const keysCapturedDisplay = document.getElementById('enrollKeysCaptured');
    const wpmDisplay = document.getElementById('enrollWpm');
    const btnNextMouse = document.getElementById('btnNextToMouseEnroll');
    const btnSkipPreset = document.getElementById('btnSkipToPreset');

    let enrollStartTime = null;
    let enrollKeysCount = 0;

    if (typingInput) {
      typingInput.addEventListener('keydown', () => {
        if (!enrollStartTime) enrollStartTime = performance.now();
        enrollKeysCount++;
        if (keysCapturedDisplay) keysCapturedDisplay.innerText = `${Math.min(80, enrollKeysCount)} / 80`;

        const elapsedMin = (performance.now() - enrollStartTime) / 60000;
        const wpm = elapsedMin > 0 ? Math.round((enrollKeysCount / 5) / elapsedMin) : 40;
        if (wpmDisplay) wpmDisplay.innerText = `${wpm} WPM`;

        if (enrollKeysCount >= 40 && btnNextMouse) {
          btnNextMouse.disabled = false;
        }
      });
    }

    if (btnNextMouse) {
      btnNextMouse.addEventListener('click', () => {
        document.getElementById('enrollStage1')?.classList.add('hidden');
        document.getElementById('enrollStage2')?.classList.remove('hidden');
        document.getElementById('stepIndicator1')?.classList.remove('active');
        document.getElementById('stepIndicator2')?.classList.add('active');
        this._setupMouseArena();
      });
    }

    if (btnSkipPreset) {
      btnSkipPreset.addEventListener('click', () => {
        modal.classList.add('hidden');
        const profileSelect = document.getElementById('userProfileSelect');
        if (profileSelect) profileSelect.value = 'alex_vance';
        this.model.setActiveProfile('alex_vance');
        this.showToast('Applied Pre-Trained Alex Vance profile baseline!', 'emerald');
      });
    }

    // Stage 2 Mouse Arena Finished
    const btnFinish = document.getElementById('btnFinishEnrollment');
    if (btnFinish) {
      btnFinish.addEventListener('click', () => {
        document.getElementById('enrollStage2')?.classList.add('hidden');
        document.getElementById('enrollStage3')?.classList.remove('hidden');
        document.getElementById('stepIndicator2')?.classList.remove('active');
        document.getElementById('stepIndicator3')?.classList.add('active');

        setTimeout(() => {
          this._finalizeEnrollment();
          modal.classList.add('hidden');
        }, 1200);
      });
    }
  }

  _resetEnrollmentWizard() {
    document.getElementById('enrollStage1')?.classList.remove('hidden');
    document.getElementById('enrollStage2')?.classList.add('hidden');
    document.getElementById('enrollStage3')?.classList.add('hidden');
    document.getElementById('stepIndicator1')?.classList.add('active');
    document.getElementById('stepIndicator2')?.classList.remove('active');
    document.getElementById('stepIndicator3')?.classList.remove('active');

    const typingInput = document.getElementById('enrollTypingInput');
    if (typingInput) typingInput.value = '';
    const keysCapturedDisplay = document.getElementById('enrollKeysCaptured');
    if (keysCapturedDisplay) keysCapturedDisplay.innerText = '0 / 80';
    const btnNextMouse = document.getElementById('btnNextToMouseEnroll');
    if (btnNextMouse) btnNextMouse.disabled = true;
  }

  _setupMouseArena() {
    const arena = document.getElementById('mouseArena');
    const target = document.getElementById('arenaTarget');
    const targetsClearedDisplay = document.getElementById('arenaTargetsCleared');
    const vectorsCountDisplay = document.getElementById('arenaVectorsCount');
    const btnFinish = document.getElementById('btnFinishEnrollment');

    let cleared = 0;
    let vectorSamples = 0;

    if (arena && target) {
      target.onclick = (e) => {
        e.stopPropagation();
        cleared++;
        soundFX.playSubtleTick();
        if (targetsClearedDisplay) targetsClearedDisplay.innerText = `${cleared} / 6`;

        // Move target randomly
        const nextX = Math.floor(Math.random() * 70) + 15;
        const nextY = Math.floor(Math.random() * 60) + 20;
        target.style.left = `${nextX}%`;
        target.style.top = `${nextY}%`;

        if (cleared >= 5 && btnFinish) {
          btnFinish.disabled = false;
        }
      };

      arena.onmousemove = () => {
        vectorSamples++;
        if (vectorsCountDisplay) vectorsCountDisplay.innerText = `${vectorSamples}`;
      };
    }
  }

  _finalizeEnrollment() {
    // Collect active window features to calibrate custom profile
    const windowData = this.capture.flushWindow();
    const extracted = this.featureExtractor.extractFeatures(windowData);

    const customProfile = this.model.fitCustomBaseline({
      dwellMean: extracted.features.dwellMean || 92,
      dwellStd: extracted.features.dwellStd || 16,
      flightMean: extracted.features.flightMean || 112,
      flightStd: extracted.features.flightStd || 20,
      velocityMean: extracted.features.velocityMean || 410,
      velocityStd: extracted.features.velocityStd || 80,
      curvatureIndex: extracted.features.curvatureIndex || 1.28,
      clickDurationMean: extracted.features.clickDurationMean || 82
    });

    const profileSelect = document.getElementById('userProfileSelect');
    if (profileSelect) profileSelect.value = 'custom_user';

    this.keyHistVis.updateData(customProfile);
    soundFX.playTrustChime();
    this.showToast('✓ Calibration Complete: Personal Behavioral Baseline Enrolled & Active!', 'emerald');
  }

  // =========================================================================
  // FORENSIC AUDIT REPORT MODAL & EXPORT
  // =========================================================================
  _bindForensicModal() {
    const modal = document.getElementById('forensicModal');
    const btnOpen = document.getElementById('btnExportForensics');
    const btnClose = document.getElementById('btnCloseForensic');
    const btnDownloadJson = document.getElementById('btnDownloadJson');
    const btnDownloadCsv = document.getElementById('btnDownloadCsv');

    if (btnOpen && modal) {
      btnOpen.addEventListener('click', () => {
        modal.classList.remove('hidden');
        const report = this.riskEngine.getForensicReport();
        const jsonPreview = document.getElementById('forensicJsonContent');
        if (jsonPreview) {
          jsonPreview.innerText = JSON.stringify(report, null, 2);
        }
      });
    }

    if (btnClose && modal) {
      btnClose.addEventListener('click', () => modal.classList.add('hidden'));
    }

    if (btnDownloadJson) {
      btnDownloadJson.addEventListener('click', () => {
        const report = this.riskEngine.getForensicReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        this._triggerDownload(blob, `sessionguard_forensic_audit_${Date.now()}.json`);
        this.showToast('Downloaded Forensic Audit Report (.json)', 'emerald');
      });
    }

    if (btnDownloadCsv) {
      btnDownloadCsv.addEventListener('click', () => {
        const report = this.riskEngine.getForensicReport();
        let csv = 'Timestamp,EventID,Type,TrustScore,RiskState,Message\n';
        report.auditTimeline.forEach(entry => {
          csv += `"${entry.timestamp}","${entry.id}","${entry.type}",${entry.score},"${entry.state}","${entry.message}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        this._triggerDownload(blob, `sessionguard_telemetry_vectors_${Date.now()}.csv`);
        this.showToast('Downloaded Telemetry Vectors (.csv)', 'emerald');
      });
    }
  }

  _triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  showToast(message, type = 'emerald') {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '✓';
    if (type === 'amber') icon = '⚠️';
    if (type === 'crimson') icon = '⚡';

    toast.innerHTML = `
      <span style="font-size:1.1rem; line-height:1;">${icon}</span>
      <span>${message}</span>
    `;

    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => toast.remove(), 250);
    }, 4200);
  }
}

// Initialize Application on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  window.sessionGuardApp = new SessionGuardApp();
});
