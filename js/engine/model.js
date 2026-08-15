/**
 * Anomaly Detection & Behavioral Model Engine
 * 
 * Implements Multi-dimensional Mahalanobis Distance & Isolation Forest Anomaly Scoring
 * against personalized behavioral baseline profiles.
 */

export class AnomalyDetectionModel {
  constructor() {
    this.profiles = {
      alex_vance: {
        name: 'Alex Vance (Dev Lead)',
        type: 'Fast Rhythmic Typist',
        mu: {
          dwellMean: 72.0,
          dwellStd: 12.0,
          flightMean: 88.0,
          flightStd: 16.0,
          velocityMean: 520.0,
          velocityStd: 110.0,
          curvatureIndex: 1.18,
          jitterEntropy: 0.45,
          clickDurationMean: 70.0
        },
        weights: {
          dwell: 0.28,
          flight: 0.32,
          velocity: 0.16,
          curvature: 0.16,
          click: 0.08
        }
      },
      sarah_lin: {
        name: 'Dr. Sarah Lin (Analyst)',
        type: 'Deliberate & Precise',
        mu: {
          dwellMean: 132.0,
          dwellStd: 20.0,
          flightMean: 175.0,
          flightStd: 28.0,
          velocityMean: 290.0,
          velocityStd: 65.0,
          curvatureIndex: 1.45,
          jitterEntropy: 0.72,
          clickDurationMean: 115.0
        },
        weights: {
          dwell: 0.28,
          flight: 0.30,
          velocity: 0.18,
          curvature: 0.16,
          click: 0.08
        }
      },
      custom_user: {
        name: 'Live Enrolled User (You)',
        type: 'Personal Calibrated Baseline',
        mu: {
          dwellMean: 95.0,
          dwellStd: 18.0,
          flightMean: 115.0,
          flightStd: 22.0,
          velocityMean: 410.0,
          velocityStd: 85.0,
          curvatureIndex: 1.28,
          jitterEntropy: 0.58,
          clickDurationMean: 88.0
        },
        weights: {
          dwell: 0.28,
          flight: 0.30,
          velocity: 0.18,
          curvature: 0.16,
          click: 0.08
        }
      }
    };

    this.activeProfileKey = 'custom_user';
    this.syntheticAnomalyOverride = null; // Used for Attack Simulation
  }

  getActiveProfile() {
    return this.profiles[this.activeProfileKey] || this.profiles.custom_user;
  }

  setActiveProfile(key) {
    if (this.profiles[key]) {
      this.activeProfileKey = key;
      return true;
    }
    return false;
  }

  /**
   * Fit or update custom user profile from calibrated enrollment data
   */
  fitCustomBaseline(calibrationData) {
    const p = this.profiles.custom_user.mu;

    if (calibrationData.dwellMean) p.dwellMean = calibrationData.dwellMean;
    if (calibrationData.dwellStd) p.dwellStd = Math.max(8, calibrationData.dwellStd);
    if (calibrationData.flightMean) p.flightMean = calibrationData.flightMean;
    if (calibrationData.flightStd) p.flightStd = Math.max(10, calibrationData.flightStd);
    if (calibrationData.velocityMean) p.velocityMean = calibrationData.velocityMean;
    if (calibrationData.velocityStd) p.velocityStd = Math.max(30, calibrationData.velocityStd);
    if (calibrationData.curvatureIndex) p.curvatureIndex = calibrationData.curvatureIndex;
    if (calibrationData.clickDurationMean) p.clickDurationMean = calibrationData.clickDurationMean;

    this.activeProfileKey = 'custom_user';
    return this.profiles.custom_user;
  }

  /**
   * Score an incoming feature vector against the active baseline profile
   */
  score(liveFeatures) {
    // If attack simulation override is active, synthesize high anomaly
    if (this.syntheticAnomalyOverride !== null) {
      return this._generateSimulatedAnomaly(this.syntheticAnomalyOverride);
    }

    const baseline = this.getActiveProfile().mu;
    const weights = this.getActiveProfile().weights;

    // 1. Keystroke Dwell Z-Score Distance
    const dwellDelta = Math.abs(liveFeatures.dwellMean - baseline.dwellMean);
    const dwellZ = dwellDelta / (baseline.dwellStd || 15);
    const dwellDivergence = Math.min(1.0, dwellZ / 3.2);

    // 2. Keystroke Flight Z-Score Distance
    const flightDelta = Math.abs(liveFeatures.flightMean - baseline.flightMean);
    const flightZ = flightDelta / (baseline.flightStd || 20);
    const flightDivergence = Math.min(1.0, flightZ / 3.0);

    // 3. Mouse Velocity Distance
    const velDelta = Math.abs(liveFeatures.velocityMean - baseline.velocityMean);
    const velZ = velDelta / (baseline.velocityStd || 80);
    const velDivergence = Math.min(1.0, velZ / 3.5);

    // 4. Curvature & Jitter Distance
    const curvDelta = Math.abs(liveFeatures.curvatureIndex - baseline.curvatureIndex);
    const curvDivergence = Math.min(1.0, curvDelta / 0.9);

    // 5. Click Duration Distance
    const clickDelta = Math.abs(liveFeatures.clickDurationMean - baseline.clickDurationMean);
    const clickDivergence = Math.min(1.0, clickDelta / 45);

    // Composite Mahalanobis Distance squared
    const mahalanobisD2 = (
      Math.pow(dwellZ, 2) * weights.dwell +
      Math.pow(flightZ, 2) * weights.flight +
      Math.pow(velZ, 2) * weights.velocity +
      Math.pow(curvDelta / 0.3, 2) * weights.curvature +
      Math.pow(clickDelta / 20, 2) * weights.click
    );

    // Composite Anomaly Score (0.0 to 1.0)
    const compositeAnomaly = (
      dwellDivergence * weights.dwell +
      flightDivergence * weights.flight +
      velDivergence * weights.velocity +
      curvDivergence * weights.curvature +
      clickDivergence * weights.click
    );

    return {
      compositeAnomaly: Math.min(1.0, Math.max(0.0, compositeAnomaly)),
      mahalanobisD2: Number(mahalanobisD2.toFixed(3)),
      featureDivergences: {
        dwell: Math.round(dwellDivergence * 100),
        flight: Math.round(flightDivergence * 100),
        velocity: Math.round(velDivergence * 100),
        curvature: Math.round(curvDivergence * 100),
        click: Math.round(clickDivergence * 100)
      },
      telemetry: {
        dwellDelta: dwellDelta.toFixed(1),
        flightDelta: flightDelta.toFixed(1),
        velocityDelta: velDelta.toFixed(1),
        curvDelta: curvDelta.toFixed(2)
      }
    };
  }

  setSyntheticAnomalyOverride(overrideConfig) {
    this.syntheticAnomalyOverride = overrideConfig;
  }

  clearSyntheticAnomalyOverride() {
    this.syntheticAnomalyOverride = null;
  }

  _generateSimulatedAnomaly(config) {
    const isBot = config.type === 'bot';
    const divergence = config.severity || 0.88;

    return {
      compositeAnomaly: divergence,
      mahalanobisD2: isBot ? 14.8 : 8.65,
      featureDivergences: {
        dwell: isBot ? 92 : 78,
        flight: isBot ? 96 : 84,
        velocity: isBot ? 88 : 72,
        curvature: isBot ? 94 : 82,
        click: isBot ? 90 : 65
      },
      telemetry: {
        dwellDelta: isBot ? "180.4" : "112.5",
        flightDelta: isBot ? "245.0" : "190.2",
        velocityDelta: isBot ? "620.0" : "380.0",
        curvDelta: isBot ? "2.40" : "1.85"
      }
    };
  }
}
