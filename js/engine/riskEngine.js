/**
 * Continuous Zero-Trust Risk & Policy Decision Engine
 * 
 * Manages rolling Exponential Moving Average (EMA) trust scores, risk states,
 * dynamic model confidence, and policy sensitivity presets (Strict, Balanced, Permissive).
 */

import { soundFX } from '../utils/audio.js';

export const RISK_STATES = {
  VERIFIED: 'VERIFIED',
  WARNING: 'WARNING',
  LOCKED: 'LOCKED'
};

export const POLICY_PRESETS = {
  strict: {
    name: 'Strict (High-Compliance)',
    verifiedMin: 92,
    warningMin: 65,
    emaAlpha: 0.55
  },
  balanced: {
    name: 'Balanced (Standard Zero-Trust)',
    verifiedMin: 90,
    warningMin: 50,
    emaAlpha: 0.45
  },
  permissive: {
    name: 'Permissive (Low-Friction)',
    verifiedMin: 85,
    warningMin: 40,
    emaAlpha: 0.35
  }
};

export class RiskEngine {
  constructor() {
    this.trustScore = 96.8;
    this.targetTrustScore = 96.8;
    this.currentPolicy = 'balanced';
    this.thresholds = { ...POLICY_PRESETS.balanced };
    this.riskState = RISK_STATES.VERIFIED;

    this.consecutiveAnomalies = 0;
    this.totalSamplesProcessed = 0;
    this.modelConfidence = 99.4;
    this.isLocked = false;
    this.forensicLog = [];
    this.listeners = [];

    this._logForensicEntry({
      type: 'SESSION_INITIALIZED',
      score: 96.8,
      state: RISK_STATES.VERIFIED,
      message: 'Primary login verified via Password + FIDO2 passkey (Zero-Trust Active).'
    });
  }

  setPolicy(policyKey) {
    if (POLICY_PRESETS[policyKey]) {
      this.currentPolicy = policyKey;
      this.thresholds = { ...POLICY_PRESETS[policyKey] };
      return true;
    }
    return false;
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
    this.totalSamplesProcessed += (liveFeatures?.sampleCount || 10);
    
    // Dynamic Model Confidence: starts ~92%, reaches 99.8% with interaction volume
    this.modelConfidence = Math.min(99.8, 92.0 + Math.min(7.8, this.totalSamplesProcessed * 0.05));

    if (this.isLocked) {
      return {
        trustScore: Math.round(this.trustScore),
        modelConfidence: this.modelConfidence.toFixed(1),
        state: RISK_STATES.LOCKED,
        isLocked: true,
        scoreResult
      };
    }

    const anomaly = scoreResult.compositeAnomaly;
    
    // Map Anomaly to Raw Target Trust Score
    let rawScore = Math.max(5, Math.min(99.5, (1 - anomaly) * 100));

    // If severe anomaly is sustained, accelerate decay
    if (anomaly > 0.55) {
      this.consecutiveAnomalies++;
      const penalty = Math.min(35, this.consecutiveAnomalies * 10);
      rawScore = Math.max(5, rawScore - penalty);
    } else {
      this.consecutiveAnomalies = Math.max(0, this.consecutiveAnomalies - 1);
      // Give natural legitimate users a slight baseline boost up to 98%
      rawScore = Math.min(99.0, rawScore + 3.0);
    }

    // Apply EMA smoothing
    const alpha = this.thresholds.emaAlpha || 0.45;
    this.targetTrustScore = rawScore;
    this.trustScore = (alpha * this.targetTrustScore) + ((1 - alpha) * this.trustScore);
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

    if (newState !== previousState) {
      this._handleStateTransition(previousState, newState, scoreResult);
    }

    const updatePayload = {
      trustScore: displayScore,
      modelConfidence: this.modelConfidence.toFixed(1),
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

  unlockSession(methodName = 'FIDO2 Passkey') {
    this.isLocked = false;
    this.trustScore = 96.5;
    this.targetTrustScore = 96.5;
    this.consecutiveAnomalies = 0;
    this.riskState = RISK_STATES.VERIFIED;

    soundFX.playSuccessFanfare();

    this._logForensicEntry({
      type: 'STEP_UP_AUTHENTICATION_SUCCESS',
      score: 96.5,
      state: RISK_STATES.VERIFIED,
      message: `Identity re-verified via ${methodName}. Continuous behavioral baseline re-synchronized.`
    });

    this._notify('session_recovered', { method: methodName, score: 96.5 });
  }

  _logForensicEntry(entry) {
    const record = {
      id: 'SEC-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toLocaleTimeString(),
      ...entry
    };
    this.forensicLog.unshift(record);
    if (this.forensicLog.length > 100) this.forensicLog.pop();
    this._notify('forensic_log', record);
  }

  getForensicReport() {
    return {
      reportId: 'SG-AUDIT-' + Date.now(),
      generatedAt: new Date().toISOString(),
      currentTrustScore: this.trustScore,
      currentRiskState: this.riskState,
      modelConfidence: `${this.modelConfidence.toFixed(1)}%`,
      activePolicy: this.currentPolicy,
      isSessionLocked: this.isLocked,
      eventCount: this.forensicLog.length,
      auditTimeline: this.forensicLog
    };
  }

  resetDemoState() {
    this.isLocked = false;
    this.trustScore = 96.8;
    this.targetTrustScore = 96.8;
    this.consecutiveAnomalies = 0;
    this.riskState = RISK_STATES.VERIFIED;
    this._notify('trust_update', {
      trustScore: 96.8,
      modelConfidence: this.modelConfidence.toFixed(1),
      state: RISK_STATES.VERIFIED,
      isLocked: false
    });
  }
}
