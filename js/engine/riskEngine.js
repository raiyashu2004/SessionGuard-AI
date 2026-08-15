/**
 * Continuous Zero-Trust Risk & Policy Decision Engine
 * 
 * Manages rolling Exponential Moving Average (EMA) trust scores, risk states,
 * and security policy actions (Allow -> Step-Up -> Lockdown).
 */

import { soundFX } from '../utils/audio.js';

export const RISK_STATES = {
  VERIFIED: 'VERIFIED',
  WARNING: 'WARNING',
  LOCKED: 'LOCKED'
};

export class RiskEngine {
  constructor() {
    this.trustScore = 96.5; // Starts in high-trust state
    this.targetTrustScore = 96.5;
    this.emaAlpha = 0.45; // Smoothing factor
    this.riskState = RISK_STATES.VERIFIED;
    
    // Thresholds
    this.thresholds = {
      verifiedMin: 90,
      warningMin: 50,
      lockdownMax: 49.9
    };

    this.consecutiveAnomalies = 0;
    this.isLocked = false;
    this.forensicLog = [];
    this.listeners = [];

    // Initialize forensic session record
    this._logForensicEntry({
      type: 'SESSION_INITIALIZED',
      score: 96.5,
      state: RISK_STATES.VERIFIED,
      message: 'Primary login verified via Password + FIDO2 passkey.'
    });
  }

  onRiskUpdate(callback) {
    this.listeners.push(callback);
  }

  _notify(event, payload) {
    for (let i = 0; i < this.listeners.length; i++) {
      this.listeners[i](event, payload);
    }
  }

  /**
   * Process incoming anomaly score from ML model
   */
  processAnomalyScore(scoreResult, liveFeatures) {
    if (this.isLocked) {
      // Session is already locked until Step-Up authentication succeeds
      return {
        trustScore: Math.round(this.trustScore),
        state: RISK_STATES.LOCKED,
        isLocked: true,
        scoreResult
      };
    }

    const anomaly = scoreResult.compositeAnomaly;
    
    // Map Anomaly (0.0 - 1.0) to Raw Target Trust Score (100 - 0)
    let rawScore = Math.max(5, Math.min(100, (1 - anomaly) * 100));

    // If severe anomaly is present, drop faster to catch hijacking in seconds
    if (anomaly > 0.6) {
      this.consecutiveAnomalies++;
      const penalty = Math.min(30, this.consecutiveAnomalies * 8);
      rawScore = Math.max(5, rawScore - penalty);
    } else {
      this.consecutiveAnomalies = Math.max(0, this.consecutiveAnomalies - 1);
    }

    // Apply EMA smoothing
    this.targetTrustScore = rawScore;
    this.trustScore = (this.emaAlpha * this.targetTrustScore) + ((1 - this.emaAlpha) * this.trustScore);
    const displayScore = Math.round(this.trustScore * 10) / 10;

    // Evaluate Risk State
    const previousState = this.riskState;
    let newState = RISK_STATES.VERIFIED;

    if (displayScore >= this.thresholds.verifiedMin) {
      newState = RISK_STATES.VERIFIED;
    } else if (displayScore >= this.thresholds.warningMin) {
      newState = RISK_STATES.WARNING;
    } else {
      newState = RISK_STATES.LOCKED;
    }

    this.riskState = newState;

    // State transition handling
    if (newState !== previousState) {
      this._handleStateTransition(previousState, newState, scoreResult);
    }

    const updatePayload = {
      trustScore: displayScore,
      state: newState,
      isLocked: this.isLocked,
      scoreResult,
      liveFeatures
    };

    this._notify('trust_update', updatePayload);
    return updatePayload;
  }

  _handleStateTransition(oldState, newState, scoreResult) {
    if (newState === RISK_STATES.LOCKED) {
      this.isLocked = true;
      soundFX.playLockdownAlarm();
      
      this._logForensicEntry({
        type: 'HIJACK_LOCKDOWN_TRIGGERED',
        score: Math.round(this.trustScore),
        state: RISK_STATES.LOCKED,
        divergences: scoreResult.featureDivergences,
        message: 'Continuous behavioral divergence breached critical threshold. Session access suspended!'
      });

      this._notify('lockdown_triggered', {
        score: Math.round(this.trustScore),
        reasons: scoreResult.featureDivergences
      });
    } else if (newState === RISK_STATES.WARNING) {
      soundFX.playWarningBeep();
      
      this._logForensicEntry({
        type: 'BEHAVIORAL_DRIFT_WARNING',
        score: Math.round(this.trustScore),
        state: RISK_STATES.WARNING,
        divergences: scoreResult.featureDivergences,
        message: 'Elevated anomaly detected in flight/curvature patterns. Sensitive actions gated.'
      });
    } else if (newState === RISK_STATES.VERIFIED && oldState !== RISK_STATES.VERIFIED) {
      soundFX.playTrustChime();
      
      this._logForensicEntry({
        type: 'IDENTITY_RE_VERIFIED',
        score: Math.round(this.trustScore),
        state: RISK_STATES.VERIFIED,
        message: 'Behavioral signature normalized. Full high-security privileges active.'
      });
    }
  }

  /**
   * Unlock session following successful Step-Up 2FA / Biometric verification
   */
  unlockSession(methodName = 'FIDO2 Passkey') {
    this.isLocked = false;
    this.trustScore = 96.0;
    this.targetTrustScore = 96.0;
    this.consecutiveAnomalies = 0;
    this.riskState = RISK_STATES.VERIFIED;

    soundFX.playSuccessFanfare();

    this._logForensicEntry({
      type: 'STEP_UP_AUTHENTICATION_SUCCESS',
      score: 96.0,
      state: RISK_STATES.VERIFIED,
      message: `Identity re-verified via ${methodName}. Continuous behavioral baseline re-synchronized.`
    });

    this._notify('session_recovered', { method: methodName, score: 96.0 });
  }

  _logForensicEntry(entry) {
    const record = {
      id: 'SEC-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toLocaleTimeString(),
      ...entry
    };
    this.forensicLog.unshift(record);
    if (this.forensicLog.length > 80) this.forensicLog.pop();
    this._notify('forensic_log', record);
  }

  getForensicReport() {
    return {
      reportId: 'SOC-AUDIT-' + Date.now(),
      generatedAt: new Date().toISOString(),
      currentTrustScore: this.trustScore,
      currentRiskState: this.riskState,
      isSessionLocked: this.isLocked,
      eventCount: this.forensicLog.length,
      auditTimeline: this.forensicLog
    };
  }

  resetDemoState() {
    this.isLocked = false;
    this.trustScore = 96.0;
    this.targetTrustScore = 96.0;
    this.consecutiveAnomalies = 0;
    this.riskState = RISK_STATES.VERIFIED;
    this._notify('trust_update', {
      trustScore: 96.0,
      state: RISK_STATES.VERIFIED,
      isLocked: false
    });
  }
}
