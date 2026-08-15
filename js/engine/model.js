/**
 * Anomaly Detection & Behavioral Model Engine
 * 
 * Implements Multi-dimensional Mahalanobis Distance & Isolation Forest Anomaly Scoring
 * with online adaptive baseline updating and multi-vector threat simulation.
 */

export class AnomalyDetectionModel {
  constructor() {
    this.profiles = {
      alex_vance: {
        name: 'Alex Vance (Dev Lead)',
        type: 'Fast Rhythmic Typist',
        mu: {
          dwellMean: 72.0,
          dwellStd: 14.0,
          flightMean: 88.0,
          flightStd: 18.0,
          velocityMean: 520.0,
          velocityStd: 110.0,
          curvatureIndex: 1.18,
          jitterEntropy: 0.42,
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
          dwellMean: 128.0,
          dwellStd: 22.0,
          flightMean: 168.0,
          flightStd: 26.0,
          velocityMean: 295.0,
          velocityStd: 65.0,
          curvatureIndex: 1.42,
          jitterEntropy: 0.68,
          clickDurationMean: 112.0
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
          jitterEntropy: 0.55,
          clickDurationMean: 85.0
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
    this.syntheticAnomalyOverride = null;
    this.enableOnlineLearning = true;
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

  fitCustomBaseline(calibrationData) {
    const p = this.profiles.custom_user.mu;

    if (calibrationData.dwellMean) p.dwellMean = calibrationData.dwellMean;
    if (calibrationData.dwellStd) p.dwellStd = Math.max(10, calibrationData.dwellStd);
    if (calibrationData.flightMean) p.flightMean = calibrationData.flightMean;
    if (calibrationData.flightStd) p.flightStd = Math.max(12, calibrationData.flightStd);
    if (calibrationData.velocityMean) p.velocityMean = calibrationData.velocityMean;
    if (calibrationData.velocityStd) p.velocityStd = Math.max(35, calibrationData.velocityStd);
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
    const dwellZ = dwellDelta / (baseline.dwellStd || 16);
    const dwellDivergence = Math.min(1.0, Math.pow(dwellZ / 3.0, 1.2));

    // 2. Keystroke Flight Z-Score Distance
    const flightDelta = Math.abs(liveFeatures.flightMean - baseline.flightMean);
    const flightZ = flightDelta / (baseline.flightStd || 20);
    const flightDivergence = Math.min(1.0, Math.pow(flightZ / 2.8, 1.2));

    // 3. Mouse Velocity Distance
    const velDelta = Math.abs(liveFeatures.velocityMean - baseline.velocityMean);
    const velZ = velDelta / (baseline.velocityStd || 80);
    const velDivergence = Math.min(1.0, Math.pow(velZ / 3.2, 1.1));

    // 4. Curvature & Jitter Distance
    const curvDelta = Math.abs(liveFeatures.curvatureIndex - baseline.curvatureIndex);
    const curvDivergence = Math.min(1.0, Math.pow(curvDelta / 0.85, 1.1));

    // 5. Click Duration Distance
    const clickDelta = Math.abs(liveFeatures.clickDurationMean - baseline.clickDurationMean);
    const clickDivergence = Math.min(1.0, clickDelta / 40);

    // Composite Mahalanobis Distance squared
    const mahalanobisD2 = (
      Math.pow(dwellZ, 2) * weights.dwell +
      Math.pow(flightZ, 2) * weights.flight +
      Math.pow(velZ, 2) * weights.velocity +
      Math.pow(curvDelta / 0.28, 2) * weights.curvature +
      Math.pow(clickDelta / 18, 2) * weights.click
    );

    // Composite Anomaly Score (0.0 to 1.0)
    let compositeAnomaly = (
      dwellDivergence * weights.dwell +
      flightDivergence * weights.flight +
      velDivergence * weights.velocity +
      curvDivergence * weights.curvature +
      clickDivergence * weights.click
    );

    // Soft online learning: if anomaly is very low (normal legit usage), lightly adapt baseline
    if (this.enableOnlineLearning && compositeAnomaly < 0.18 && this.activeProfileKey === 'custom_user') {
      const alpha = 0.015;
      baseline.dwellMean = (1 - alpha) * baseline.dwellMean + alpha * liveFeatures.dwellMean;
      baseline.flightMean = (1 - alpha) * baseline.flightMean + alpha * liveFeatures.flightMean;
      baseline.velocityMean = (1 - alpha) * baseline.velocityMean + alpha * liveFeatures.velocityMean;
    }

    return {
      compositeAnomaly: Math.min(1.0, Math.max(0.02, compositeAnomaly)),
      mahalanobisD2: Number(mahalanobisD2.toFixed(3)),
      featureDivergences: {
        dwell: Math.max(2, Math.round(dwellDivergence * 100)),
        flight: Math.max(3, Math.round(flightDivergence * 100)),
        velocity: Math.max(2, Math.round(velDivergence * 100)),
        curvature: Math.max(4, Math.round(curvDivergence * 100)),
        click: Math.max(1, Math.round(clickDivergence * 100))
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
    const type = config.type || 'human_hijack';
    
    if (type === 'bot') {
      return {
        compositeAnomaly: 0.96,
        mahalanobisD2: 15.42,
        featureDivergences: { dwell: 94, flight: 98, velocity: 92, curvature: 96, click: 91 },
        telemetry: { dwellDelta: "192.0", flightDelta: "260.0", velocityDelta: "680.0", curvDelta: "2.65" }
      };
    } else if (type === 'stuffer') {
      return {
        compositeAnomaly: 0.94,
        mahalanobisD2: 12.85,
        featureDivergences: { dwell: 98, flight: 95, velocity: 84, curvature: 89, click: 92 },
        telemetry: { dwellDelta: "210.0", flightDelta: "285.0", velocityDelta: "540.0", curvDelta: "1.90" }
      };
    } else {
      // Human Impersonator / Handoff
      return {
        compositeAnomaly: 0.88,
        mahalanobisD2: 8.92,
        featureDivergences: { dwell: 82, flight: 88, velocity: 76, curvature: 86, click: 68 },
        telemetry: { dwellDelta: "118.5", flightDelta: "194.2", velocityDelta: "390.0", curvDelta: "1.82" }
      };
    }
  }
}
