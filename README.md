# SessionGuard-AI — Real-Time Continuous Behavioral Zero-Trust Authentication Layer

[![Zero-Trust Continuous Auth](https://img.shields.io/badge/Security-Continuous%20Zero--Trust-10b981.svg)](https://github.com/raiyashu2004/SessionGuard-AI)
[![Privacy First](https://img.shields.io/badge/Privacy-Zero%20Raw%20Keystroke%20Logging-6366f1.svg)](https://github.com/raiyashu2004/SessionGuard-AI)
[![Browser AI](https://img.shields.io/badge/ML%20Engine-Multivariate%20Anomaly%20Detection-06b6d4.svg)](https://github.com/raiyashu2004/SessionGuard-AI)
[![License](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)

> **The Pitch**: *"Passwords prove you knew a secret once. SessionGuard-AI continuously proves you're still you — using how you type, move, click, and speak — and catches session hijacking in real time, not after the damage is done."*

---

## 📌 Problem & Hackathon Hook

Traditional authentication (passwords, SMS OTP, FIDO2/WebAuthn, biometric login) **only checks identity once at the login gate**. 

Once a session cookie or token is live:
- Stolen session cookies & tokens (via InfoStealers or XSS)
- Unlocked laptops in cafes or open offices
- Remote Access Trojans (RATs) and automated macro bots
- Unauthorized shoulder surfs and device hand-offs

...all operate completely undetected because traditional security assumes that whoever controls an active session is still the authorized user.

**SessionGuard-AI closes this critical gap** by continuously computing behavioral motor kinematics (keystroke flight/dwell intervals, mouse trajectory curvature, velocity vectors, and click hold dynamics) to score identity confidence in real time.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT CAPTURE LAYER                          │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌──────────────┐ │
│  │  Keystroke Dynamics   │  │   Mouse Trajectory   │  │ Click Timing │ │
│  │ (Dwell, Flight, Speed)│  │ (Velocity, Curvature)│  │  (Hold, Rate)│ │
│  └───────────┬───────────┘  └──────────┬───────────┘  └──────┬───────┘ │
└──────────────┼─────────────────────────┼─────────────────────┼─────────┘
               │                         │                     │
               ▼                         ▼                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│          FEATURE EXTRACTION PIPELINE (Zero-Raw-Data Privacy)           │
│  • Keystroke Dwell Mean & Std (Keydown -> Keyup duration in ms)       │
│  • Keystroke Digraph Flight Times (Keyup(N) -> Keydown(N+1) ms)       │
│  • Mouse Kinematics: Velocity (px/s), Acceleration, Neuromuscular Jerk │
│  • Trajectory Curvature: Path efficiency (Path Length / Euclidean dist)│
│  • Click Hold Timing: Press-release delta and double-click cadence    │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                ANOMALY DETECTION & RISK SCORING ENGINE                 │
│  • Baseline Profile (Mean vector μ, Covariance matrix Σ, Quantiles)    │
│  • Multi-variate Distance & Isolation Forest Anomaly Scoring           │
│  • Dynamic Exponential Moving Average (EMA) Trust Score Filter (0-100) │
│  • Contextual Risk Engine (Thresholds: >90 Safe, 50-89 Warn, <50 Lock) │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     HACKATHON-READY LIVE DASHBOARD                     │
│  • Real-time Animated Trust Score Gauge (0-100)                        │
│  • Live Mouse Kinematics & Keystroke Telemetry Visualizers             │
│  • Interactive High-Security Portal (Banking Wire Transfer & API Keys) │
│  • Live Attack Handoff Simulator ("Impersonator Takeover" / "Bot RAT") │
│  • Automated Threat Interceptor: Step-Up Auth & Session Lockdown       │
│  • Forensic Audit Timeline & Incident Export (.JSON / .CSV)            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Mathematical & ML Foundations

### 1. Privacy-First Feature Transformation
SessionGuard-AI **never stores or transmits raw keystrokes or text**. Only temporal and kinematic vectors are extracted:

- **Dwell Time ($T_{\text{dwell}}$)**: $t_{\text{keyup}} - t_{\text{keydown}}$
- **Flight Time ($T_{\text{flight}}$)**: $t_{\text{keydown}_{n+1}} - t_{\text{keyup}_n}$
- **Trajectory Curvature Index ($\kappa$)**:
  $$\kappa = \frac{\sum_{i=1}^{N} \sqrt{(x_i - x_{i-1})^2 + (y_i - y_{i-1})^2}}{\sqrt{(x_N - x_0)^2 + (y_N - y_0)^2}}$$
  *(1.0 = mechanical straight-line bot, 1.2–1.6 = natural human arc, >2.5 = erratic anomaly)*

### 2. Multivariate Distance & Risk Formulation
Incoming feature vectors $\vec{x}$ are scored against the user's enrolled baseline $(\vec{\mu}, \mathbf{\Sigma})$:

$$D_M^2(\vec{x}) = (\vec{x} - \vec{\mu})^T \mathbf{\Sigma}^{-1} (\vec{x} - \vec{\mu})$$

### 3. Continuous Trust Score EMA Filter
The real-time Trust Score $T_t \in [0, 100]$ is computed with Exponential Moving Average (EMA) smoothing:

$$T_t = \alpha \cdot T_{\text{raw}} + (1 - \alpha) \cdot T_{t-1}$$

- 🟢 **90 – 100% (Verified Identity)**: Zero-friction enterprise access.
- 🟡 **50 – 89% (Elevated Risk / Behavioral Drift)**: Warning logged; high-value operations require re-confirmation.
- 🔴 **0 – 49% (Session Hijack Detected)**: Automated critical lockdown; sensitive actions instantly aborted, triggering Step-Up 2FA challenge.

---

## 🎬 Live Hackathon Demo Walkthrough

### Step 1: Normal Legitimate Session (Trust ~96%)
- The authorized user navigates the high-security enterprise portal.
- Keystrokes and cursor movements match the enrolled baseline.
- High-value actions (e.g. `$75,000 Corporate Wire Transfer`) authorize smoothly.

### Step 2: The Attack Hand-off Simulation
- Click **"Simulate Attacker Takeover"** (or hand the keyboard to another person).
- In under **3 seconds**, the Trust Score drops precipitously (**96% ➔ 34% ➔ 18%**).
- The red **Critical Session Lockdown Overlay** engages, freezing the banking portal and sounding the alarm.

### Step 3: Step-Up 2FA & Passkey Recovery
- Click **"Authenticate via Step-Up 2FA / Biometric"**.
- Verify with simulated **Touch ID / Passkey** or Emergency Master PIN (`739281`).
- Trust score restores to **96%**, baseline re-synchronizes, and session access unfreezes.

---

## 📁 Repository Structure

```
SessionGuard-AI/
├── index.html                  # Cyberpunk dark dashboard with split-screen portal & command center
├── css/
│   ├── main.css                # Design system tokens, obsidian glassmorphism, typography
│   ├── dashboard.css           # 60fps trust score gauge, divergence progress bars, telemetry stream
│   └── portal.css              # Mock high-security enterprise portal & lockdown overlays
├── js/
│   ├── app.js                  # Master application orchestrator, enrollment wizard & exports
│   ├── engine/
│   │   ├── capture.js          # Privacy-preserving event capture (Zero raw key logging)
│   │   ├── featureExtractor.js # Mathematical feature engineering (dwell, flight, velocity, curvature)
│   │   ├── model.js            # Multivariate Mahalanobis Distance & anomaly baseline model
│   │   └── riskEngine.js       # Rolling EMA trust engine, state machine & policy triggers
│   ├── visualizers/
│   │   ├── trustGauge.js       # 60fps Canvas glowing circular trust gauge
│   │   ├── mouseHeatmap.js     # Live cursor trajectory physics & velocity particles
│   │   └── keystrokeChart.js   # Live histogram comparing baseline distribution vs live typing
│   ├── portal/
│   │   ├── mockApp.js          # Protected banking transfers, API keys, database admin
│   │   └── stepUpAuth.js       # Step-up 2FA (Touch ID / Passkey & Master PIN verification)
│   ├── simulation/
│   │   └── attackSimulator.js  # Live demo attacker hand-off & robotic RAT macro injector
│   └── utils/
│       └── audio.js            # Procedural Web Audio API sound generator (alarms, chimes, ticks)
├── README.md                   # Project documentation & pitch guide
└── .gitignore                  # Git ignore rules
```

---

## ⚡ Quick Start

No dependencies or build steps required. Run with any standard static HTTP server:

```bash
# Clone repository
git clone https://github.com/raiyashu2004/SessionGuard-AI.git
cd SessionGuard-AI

# Start local server (Python 3)
python3 -m http.server 8080

# Or with Node.js
npx serve .
```

Open **[http://localhost:8080](http://localhost:8080)** in Chrome, Firefox, Safari, or Edge.

---

## 🛡️ Privacy & Compliance

- **Zero Keylogging**: SessionGuard-AI never stores, inspects, or transmits textual inputs or characters.
- **Client-Side Edge Evaluation**: Feature extraction and distance calculations execute entirely in the browser sandbox.
- **GDPR & CCPA Compliant**: Only anonymous temporal duration deltas ($\Delta t$) and spatial velocity vectors are evaluated.

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.
