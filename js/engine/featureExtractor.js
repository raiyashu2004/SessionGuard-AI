/**
 * Behavioral Feature Extractor & Mathematical Transformation Engine
 * 
 * Transforms raw temporal events into normalized behavioral vector representations.
 * Handles cognitive idle pauses, trackpad bezier smoothing, and jitter entropy.
 */

export class FeatureExtractor {
  constructor() {
    this.keyHistory = [];
    this.mouseHistory = [];
    this.clickHistory = [];
    this.maxHistorySize = 300;
  }

  /**
   * Extract comprehensive feature vector from an event window
   */
  extractFeatures(eventWindow) {
    // Append to rolling history
    if (eventWindow.keys && eventWindow.keys.length > 0) {
      this.keyHistory.push(...eventWindow.keys);
      if (this.keyHistory.length > this.maxHistorySize) {
        this.keyHistory = this.keyHistory.slice(-this.maxHistorySize);
      }
    }

    if (eventWindow.mouse && eventWindow.mouse.length > 0) {
      this.mouseHistory.push(...eventWindow.mouse);
      if (this.mouseHistory.length > this.maxHistorySize) {
        this.mouseHistory = this.mouseHistory.slice(-this.maxHistorySize);
      }
    }

    if (eventWindow.clicks && eventWindow.clicks.length > 0) {
      this.clickHistory.push(...eventWindow.clicks);
      if (this.clickHistory.length > this.maxHistorySize) {
        this.clickHistory = this.clickHistory.slice(-this.maxHistorySize);
      }
    }

    // Extract Keystroke Features
    const keyFeatures = this._extractKeyFeatures(eventWindow.keys, this.keyHistory);

    // Extract Mouse Kinematics Features
    const mouseFeatures = this._extractMouseFeatures(eventWindow.mouse, this.mouseHistory);

    // Extract Click Features
    const clickFeatures = this._extractClickFeatures(eventWindow.clicks, this.clickHistory);

    const totalSamples = (eventWindow.keys?.length || 0) + (eventWindow.mouse?.length || 0) + (eventWindow.clicks?.length || 0);

    return {
      timestamp: eventWindow.timestamp || Date.now(),
      sampleCount: totalSamples,
      cumulativeHistoryCount: this.keyHistory.length + this.mouseHistory.length + this.clickHistory.length,
      features: {
        ...keyFeatures,
        ...mouseFeatures,
        ...clickFeatures
      }
    };
  }

  _extractKeyFeatures(windowKeys = [], historyKeys = []) {
    const activeKeys = windowKeys.length >= 3 ? windowKeys : historyKeys;
    const dwellTimes = [];
    const flightTimes = [];

    activeKeys.forEach(k => {
      if (k.dwellTime !== undefined && k.dwellTime >= 15 && k.dwellTime <= 600) {
        dwellTimes.push(k.dwellTime);
      }
      // Only consider true intra-word & inter-word flights; ignore idle cognitive pauses (>1200ms)
      if (k.flightTime !== undefined && k.flightTime >= 5 && k.flightTime <= 1200) {
        flightTimes.push(k.flightTime);
      }
    });

    const dwellMean = dwellTimes.length > 0 ? this._mean(dwellTimes) : 95.0;
    const dwellStd = dwellTimes.length > 1 ? this._std(dwellTimes, dwellMean) : 18.0;
    
    const flightMean = flightTimes.length > 0 ? this._mean(flightTimes) : 110.0;
    const flightStd = flightTimes.length > 1 ? this._std(flightTimes, flightMean) : 24.0;

    // Approximate WPM based on average flight + dwell interval (5 chars / word)
    const avgCharTime = (dwellMean + flightMean);
    const wpm = avgCharTime > 0 ? Math.min(160, Math.max(10, Math.round(60000 / (avgCharTime * 5)))) : 45;

    return {
      dwellMean: Number(dwellMean.toFixed(1)),
      dwellStd: Number(dwellStd.toFixed(1)),
      flightMean: Number(flightMean.toFixed(1)),
      flightStd: Number(flightStd.toFixed(1)),
      wpm,
      keyDwellSamples: dwellTimes.slice(-25),
      keyFlightSamples: flightTimes.slice(-25)
    };
  }

  _extractMouseFeatures(windowMouse = [], historyMouse = []) {
    const activeMouse = windowMouse.length >= 5 ? windowMouse : historyMouse;

    if (activeMouse.length < 3) {
      return {
        velocityMean: 380.0,
        velocityStd: 85.0,
        accelerationMean: 420.0,
        curvatureIndex: 1.28,
        jitterEntropy: 0.55,
        trajectoryLength: 0
      };
    }

    const speeds = [];
    const accelerations = [];
    let pathLength = 0;

    for (let i = 1; i < activeMouse.length; i++) {
      const p1 = activeMouse[i - 1];
      const p2 = activeMouse[i];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      pathLength += dist;

      if (p2.speed !== undefined && p2.speed > 5) {
        speeds.push(p2.speed);
      }

      if (p1.speed !== undefined && p2.speed !== undefined && p2.dt > 0) {
        const dv = Math.abs(p2.speed - p1.speed);
        const acc = (dv / p2.dt) * 1000;
        if (acc < 5000) accelerations.push(acc);
      }
    }

    const velocityMean = speeds.length > 0 ? this._mean(speeds) : 380.0;
    const velocityStd = speeds.length > 1 ? this._std(speeds, velocityMean) : 85.0;
    const accelerationMean = accelerations.length > 0 ? this._mean(accelerations) : 420.0;

    // Curvature Index: Path Length / Euclidean Straight-line distance
    const startPoint = activeMouse[0];
    const endPoint = activeMouse[activeMouse.length - 1];
    const straightDist = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
    );

    let curvatureIndex = 1.28;
    if (straightDist > 20 && pathLength >= straightDist) {
      curvatureIndex = Math.min(4.5, pathLength / straightDist);
    }

    // Neuromuscular Jitter / Angular Directional Entropy
    let angleChanges = 0;
    for (let i = 2; i < activeMouse.length; i++) {
      const a = activeMouse[i - 2];
      const b = activeMouse[i - 1];
      const c = activeMouse[i];
      
      const angle1 = Math.atan2(b.y - a.y, b.x - a.x);
      const angle2 = Math.atan2(c.y - b.y, c.x - b.x);
      let diff = Math.abs(angle2 - angle1);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      if (diff > 0.45) angleChanges++;
    }
    const jitterEntropy = Math.min(1.0, angleChanges / Math.max(1, activeMouse.length - 2));

    return {
      velocityMean: Number(velocityMean.toFixed(1)),
      velocityStd: Number(velocityStd.toFixed(1)),
      accelerationMean: Number(accelerationMean.toFixed(1)),
      curvatureIndex: Number(curvatureIndex.toFixed(2)),
      jitterEntropy: Number(jitterEntropy.toFixed(2)),
      trajectoryLength: Math.round(pathLength)
    };
  }

  _extractClickFeatures(windowClicks = [], historyClicks = []) {
    const activeClicks = windowClicks.length > 0 ? windowClicks : historyClicks;
    const durations = activeClicks.map(c => c.duration || 85).filter(d => d >= 10 && d <= 600);

    const clickDurationMean = durations.length > 0 ? this._mean(durations) : 85.0;
    const clickDurationStd = durations.length > 1 ? this._std(durations, clickDurationMean) : 15.0;

    return {
      clickDurationMean: Number(clickDurationMean.toFixed(1)),
      clickDurationStd: Number(clickDurationStd.toFixed(1))
    };
  }

  _mean(arr) {
    if (!arr || arr.length === 0) return 0;
    const sum = arr.reduce((acc, val) => acc + val, 0);
    return sum / arr.length;
  }

  _std(arr, mean) {
    if (!arr || arr.length <= 1) return 0;
    const m = mean !== undefined ? mean : this._mean(arr);
    const variance = arr.reduce((acc, val) => acc + Math.pow(val - m, 2), 0) / (arr.length - 1);
    return Math.sqrt(variance);
  }

  reset() {
    this.keyHistory = [];
    this.mouseHistory = [];
    this.clickHistory = [];
  }
}
