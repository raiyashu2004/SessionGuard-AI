/**
 * Privacy-Preserving Behavioral Event Capture Layer
 * 
 * Captures temporal and physical interaction metrics:
 * - Keystroke dwell & flight timestamps (NO raw key values or characters logged)
 * - Mouse trajectory coordinates, timestamps, and kinematics
 * - Click down/up duration and hold times
 */

export class BehavioralCaptureLayer {
  constructor() {
    this.keyPressMap = new Map(); // Tracks active keydown timestamps
    this.lastKeyReleaseTime = null;
    
    this.rawKeyEvents = [];
    this.rawMouseEvents = [];
    this.rawClickEvents = [];

    this.lastMousePoint = null;
    this.isCapturing = true;
    this.listeners = [];

    this._bindEvents();
  }

  _bindEvents() {
    // Privacy-preserving key listener: We do NOT store event.key or sensitive content
    window.addEventListener('keydown', (e) => {
      if (!this.isCapturing) return;
      const now = performance.now();
      const code = e.code || 'Key';

      if (!this.keyPressMap.has(code)) {
        this.keyPressMap.set(code, now);
        
        // Calculate flight time from previous keyup to this keydown
        let flightTime = null;
        if (this.lastKeyReleaseTime !== null) {
          flightTime = Math.max(0, now - this.lastKeyReleaseTime);
        }

        const keyRecord = {
          type: 'keydown',
          codeHash: this._hashKey(code), // Privacy hash of key category only
          time: now,
          flightTime: flightTime
        };

        this.rawKeyEvents.push(keyRecord);
        this._notifyListeners('keydown', keyRecord);
      }
    }, { passive: true });

    window.addEventListener('keyup', (e) => {
      if (!this.isCapturing) return;
      const now = performance.now();
      const code = e.code || 'Key';

      if (this.keyPressMap.has(code)) {
        const pressTime = this.keyPressMap.get(code);
        this.keyPressMap.delete(code);
        const dwellTime = Math.max(10, now - pressTime);

        const keyRecord = {
          type: 'keyup',
          codeHash: this._hashKey(code),
          time: now,
          dwellTime: dwellTime
        };

        this.lastKeyReleaseTime = now;
        this.rawKeyEvents.push(keyRecord);
        this._notifyListeners('keyup', keyRecord);
      }
    }, { passive: true });

    // Mouse trajectory & kinematic listener
    window.addEventListener('mousemove', (e) => {
      if (!this.isCapturing) return;
      const now = performance.now();
      const x = e.clientX;
      const y = e.clientY;

      let vx = 0;
      let vy = 0;
      let speed = 0;
      let dt = 0;

      if (this.lastMousePoint) {
        dt = Math.max(1, now - this.lastMousePoint.time);
        const dx = x - this.lastMousePoint.x;
        const dy = y - this.lastMousePoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        vx = (dx / dt) * 1000; // px/sec
        vy = (dy / dt) * 1000;
        speed = (dist / dt) * 1000;
      }

      const mouseRecord = {
        x,
        y,
        time: now,
        speed,
        vx,
        vy,
        dt
      };

      this.lastMousePoint = { x, y, time: now, vx, vy };
      this.rawMouseEvents.push(mouseRecord);
      this._notifyListeners('mousemove', mouseRecord);
    }, { passive: true });

    // Mouse click timing listener
    let mouseDownTime = null;
    window.addEventListener('mousedown', (e) => {
      if (!this.isCapturing) return;
      mouseDownTime = performance.now();
    }, { passive: true });

    window.addEventListener('mouseup', (e) => {
      if (!this.isCapturing || !mouseDownTime) return;
      const now = performance.now();
      const clickDuration = Math.max(10, now - mouseDownTime);
      
      const clickRecord = {
        time: now,
        duration: clickDuration,
        button: e.button
      };

      this.rawClickEvents.push(clickRecord);
      this._notifyListeners('click', clickRecord);
      mouseDownTime = null;
    }, { passive: true });
  }

  /**
   * Anonymous key category hash for privacy compliance
   */
  _hashKey(code) {
    if (code.startsWith('Key')) return 'alpha';
    if (code.startsWith('Digit')) return 'digit';
    if (code === 'Space') return 'space';
    if (code === 'Backspace' || code === 'Delete') return 'edit';
    if (code === 'Enter') return 'submit';
    return 'modifier';
  }

  onEvent(callback) {
    this.listeners.push(callback);
  }

  _notifyListeners(type, data) {
    for (let i = 0; i < this.listeners.length; i++) {
      this.listeners[i](type, data);
    }
  }

  /**
   * Flush and retrieve buffered events for a sliding analysis window
   */
  flushWindow() {
    const keys = [...this.rawKeyEvents];
    const mouse = [...this.rawMouseEvents];
    const clicks = [...this.rawClickEvents];

    // Clear buffer
    this.rawKeyEvents = [];
    this.rawMouseEvents = [];
    this.rawClickEvents = [];

    return { keys, mouse, clicks, timestamp: Date.now() };
  }

  pause() {
    this.isCapturing = false;
  }

  resume() {
    this.isCapturing = true;
  }
}
