# 🛡️ SessionGuard-AI — 1-Page Executive Summary & Judge Pitch Sheet

> **The Pitch (One-Liner):**  
> *"Passwords prove you knew a secret once. We continuously prove you're still you — using how you type, move, click, and speak — catching session hijacking in real time, before the damage is done."*

---

## 🎯 1. The Core Problem: The Post-Login Security Blindspot
Traditional authentication (Passwords, SMS OTP, Authenticator 2FA, Hardware FIDO2 keys) validates identity **only once at login**. Once an active session token is minted:
- Infostealer malware steals browser session cookies.
- An unattended laptop is accessed in a coffee shop or office (laptop hand-off).
- Remote Access Trojans (RATs) execute unauthorized wire transfers or exfiltrate cloud keys.

**In all these scenarios, traditional auth systems assume the attacker is the legitimate user.** SessionGuard-AI closes this critical gap with **continuous, privacy-preserving post-login verification**.

```
[User Interactions] ──► [Privacy Capture Layer] ──► [Feature Extraction Engine]
                             (Zero Raw Keylogging)      (Dwell, Flight, Velocity, Curvature)
                                                                 │
[Step-Up Auth / Lockdown] ◄── [Continuous Risk Engine] ◄── [Multivariate Anomaly Model]
  (Touch ID / FIDO2 Passkey)     (Rolling EMA Filter)         (Mahalanobis D² + Online Learning)
```

---

## 🔬 2. Behavioral Biometric Attributes & Feature Extraction
SessionGuard-AI extracts a multi-dimensional physical interaction vector every $1.8\text{ seconds}$ **without logging raw keystrokes or recording audio**:

| Behavioral Dimension | Metric Extracted | Privacy & Mathematical Definition |
| :--- | :--- | :--- |
| **Keystroke Dwell Dynamics** | Key-Hold Duration ($\mu, \sigma$) | $\Delta t_{\text{dwell}} = t_{\text{keyup}} - t_{\text{keydown}}$ (Key characters never recorded) |
| **Flight Interval Cadence** | Key-to-Key Inter-arrival ($\mu, \sigma$) | $\Delta t_{\text{flight}} = t_{\text{keydown}_{i}} - t_{\text{keyup}_{i-1}}$ (Filtered for cognitive pauses $>1.2\text{s}$) |
| **Mouse Trajectory Curvature**| Kinematic Curvature Index ($\kappa$) | $\kappa = \frac{\sum \|\Delta \theta\|}{\text{Euclidean Distance}}$ (Distinguishes human arcs from robotic lines) |
| **Cursor Velocity & Accel** | Speed Profile ($v_x, v_y, a_{\text{max}}$) | $v = \frac{\Delta s}{\Delta t}$, instantaneous acceleration vectors |
| **Neuromuscular Micro-Jitter**| Angular Jitter Entropy ($H$) | $H = -\sum p_i \log_2(p_i)$ (Detects mechanical synthetic macros) |
| **Click Timing Dynamics** | Click Hold Duration | Duration of `mousedown` to `mouseup` across interactive elements |
| **Voice & Acoustic Cadence** | Voice Pitch ($F_0$) & Burst Rhythm | Real-time spectral energy distribution & speech burst cadence (Web Audio API) |

---

## ⚙️ 3. Mathematical Anomaly Detection & Risk Engine

1. **Multivariate Mahalanobis Distance ($D_M^2$)**:
   Computes statistical divergence accounting for feature correlation:
   $$D_M^2(x) = (x - \mu)^T \Sigma^{-1} (x - \mu)$$
2. **Adaptive Online Baseline Learning**:
   During verified usage ($A_t < 0.18$), baseline means softly adapt ($\mu \leftarrow 0.985\mu + 0.015 x_{\text{live}}$) to prevent false positives from posture shifts.
3. **Rolling Exponential Moving Average (EMA) Trust Filter**:
   $$T_t = (1 - \alpha) T_{t-1} + \alpha \cdot \left[ 100 \cdot (1 - A_t) \right] \quad (\alpha = 0.45)$$
4. **Three-Tier Policy State Machine**:
   - **`VERIFIED` (Trust $\ge 90\%$)**: Seamless frictionless execution of wire transfers ($50k+) and cloud API secrets.
   - **`WARNING` (Trust $50\% - 89\%$)**: Silent telemetry flags and SOC log stream warnings.
   - **`LOCKED` (Trust $< 50\%$)**: Instant session freeze, aborts in-flight transactions, triggers Touch ID / FIDO2 challenge.

---

## 🎬 4. The Live Hackathon Demo Strategy

| Demo Step | Action | Expected Output |
| :--- | :--- | :--- |
| **1. Legitimate Session** | Click `[Legit Mode]` or type naturally in sandbox | Trust Score remains **96%–98%** in the glowing emerald zone. Wire transfers disburse cleanly. |
| **2. Attacker Hand-off** | Click `[⚡ Attacker Takeover]` | Trust score drops to **18%** within 2.5s $\rightarrow$ **SESSION ACCESS SUSPENDED** lockdown overlay fires. |
| **3. RAT / Macro Attack** | Click `[🤖 RAT Bot]` or `[💥 Credential Macro]` | Anomaly bars flag robotic curvature ($1.000$) and abnormal flight times $\rightarrow$ Immediate lockdown. |
| **4. Step-Up 2FA Recovery** | Click `[Authenticate via Step-Up 2FA / Biometric]` | Biometric Touch ID passkey restores Trust Score to **96%** with zero page reload. |

---

## 💻 5. Repository & Architecture Deliverables

- **GitHub Repository**: [https://github.com/raiyashu2004/SessionGuard-AI](https://github.com/raiyashu2004/SessionGuard-AI)
- **Source Code Files**:
  - `js/engine/capture.js`: Privacy-preserving event capture layer (Zero raw keylogging).
  - `js/engine/featureExtractor.js`: Mathematical feature engineering (dwell, flight, curvature, jitter).
  - `js/engine/model.js`: Multivariate distance scoring and adaptive online learning.
  - `js/engine/riskEngine.js`: Rolling EMA trust scoring and policy decision state machine.
  - `js/visualizers/`: 60fps Canvas visualizers (Quantum Trust Gauge, Mouse Kinematics, Keystroke Histogram, Voice Spectrum).
  - `js/portal/`: Mock high-security enterprise banking vault & step-up authentication.
  - `js/simulation/`: Multi-vector threat simulation suite.
- **Run Locally in 10 Seconds**:
  ```bash
  git clone https://github.com/raiyashu2004/SessionGuard-AI.git
  cd SessionGuard-AI
  python3 -m http.server 8080
  # Open http://localhost:8080 in your browser
  ```
