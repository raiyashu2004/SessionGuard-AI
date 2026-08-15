/**
 * Behavioral Feature Extractor & Mathematical Transformation Engine
 * 
 * Transforms raw temporal events into normalized behavioral vector representations.
 */

export class FeatureExtractor {
  constructor() {
    // Rolling cache of historical events for smooth windowing
    this.keyHistory = [];
    this.mouseHistory = [];
    this.clickHistory = [];
    this.maxHistorySize = 250;
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

    return {
      timestamp: eventWindow.timestamp || Date.now(),
      sampleCount: (eventWindow.keys?.length || 0) + (eventWindow.mouse?.length || 0) + (eventWindow.clicks?.length || 0),
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
      if (k.dwellTime !== undefined && k.dwellTime > 0) {
        dwellTimes.push(k.dwellTime);
      }
      if (k.flightTime !== undefined && k.flightTime > 0 && k.flightTime < 1500) {
        flightTimes.push(k.flightTime);
      }
    });

    const dwellMean = dwellTimes.length > 0 ? this._mean(dwellTimes) : 95.0;
    const dwellStd = dwellTimes.length > 1 ? this._std(dwellTimes, dwellMean) : 18.0;
    
    const flightMean = flightTimes.length > 0 ? this._mean(flightTimes) : 110.0;
    const flightStd = flightTimes.length > 1 ? this._std(flightTimes, flightMean) : 25.0;

    // Approximate WPM based on average flight + dwell interval (5 chars / word)
    const avgCharTime = (dwellMean + flightMean);
    const wpm = avgCharTime > 0 ? Math.min(160, Math.max(10, Math.round(60000 / (avgCharTime * 5)))) : 45;

    return {
      dwellMean,
      dwellStd,
      flightMean,
      flightStd,
      wpm,
      keyDwellSamples: dwellTimes.slice(-20),
      keyFlightSamples: flightTimes.slice(-20)
    };
  }

  _extractMouseFeatures(windowMouse = [], historyMouse = []) {
    const activeMouse = windowMouse.length >= 5 ? windowMouse : historyMouse;

    if (activeMouse.length < 3) {
      return {
        velocityMean: 380,
        velocityStd: 90,
        accelerationMean: 450,
        curvatureIndex: 1.25,
        jitterEntropy: 0.65,
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

      if (p2.speed !== undefined) {
        speeds.push(p2.speed);
      }

      if (p1.speed !== undefined && p2.speed !== undefined && p2.dt > 0) {
        const dv = Math.abs(p2.speed - p1.speed);
        const acc = (dv / p2.dt) * 1000;
        accelerations.push(acc);
      }
    }

    const velocityMean = speeds.length > 0 ? this._mean(speeds) : 380;
    const velocityStd = speeds.length > 1 ? this._std(speeds, velocityMean) : 90;
    const accelerationMean = accelerations.length > 0 ? this._mean(accelerations) : 450;

    // Curvature Index: Total Path Length / Straight Line Euclidean Distance
    const startPoint = activeMouse[0];
    const endPoint = activeMouse[activeMouse.length - 1];
    const straightDist = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
    );

    let curvatureIndex = 1.25;
    if (straightDist > 15 && pathLength >= straightDist) {
      curvatureIndex = Math.min(5.0, pathLength / straightDist);
    }

    // Neuromuscular Jitter / Angular Entropy
    let angleChanges = 0;
    for (let i = 2; i < activeMouse.length; i++) {
      const a = activeMouse[i - 2];
      const b = activeMouse[i - 1];
      const c = activeMouse[i];
      
      const angle1 = Math.atan2(b.y - a.y, b.x - a.x);
      const angle2 = Math.atan2(c.y - b.y, c.x - b.x);
      const diff = Math.abs(angle2 - angle1);
      if (diff > 0.3) angleChanges++;
    }
    const jitterEntropy = Math.min(1.0, angleChanges / Math.max(1, activeMouse.length - 2));

    return {
      velocityMean,
      velocityStd,
      accelerationMean,
      curvatureIndex,
      jitterEntropy,
      trajectoryLength: Math.round(pathLength)
    };
  }

  _extractClickFeatures(windowClicks = [], historyClicks = []) {
    const activeClicks = windowClicks.length > 0 ? windowClicks : historyClicks;
    const durations = activeClicks.map(c => c.duration || 85);

    const clickDurationMean = durations.length > 0 ? this._mean(durations) : 85;
    const clickDurationStd = durations.length > 1 ? this._std(durations, clickDurationMean) : 15;

    return {
      clickDurationMean,
      clickDurationStd
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
