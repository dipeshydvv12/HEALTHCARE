# CareSync 360 | Centralized Healthcare Follow-Up & Coordination Platform

> **SAFETY NOTICE & SYNTHETIC DATA DISCLOSURE:**
> CareSync 360 operates **exclusively with synthetic patient profiles**. It does **NOT** connect to real Electronic Health Records (EHR) and does **NOT** make autonomous clinical decisions. It is designed to demonstrate care coordination, missed-step SLA detection, multi-provider tracking, and patient consent enforcement.

---

## 📁 Monorepo Project Structure

The platform is structured into three dedicated modular tiers:

```
├── frontend/             # 🖥️ Client UI (React 18, Vite, TypeScript, Tailwind CSS)
│   ├── src/              # Views (Doctor Desk, Lab, Pharmacy, Tracker, Medical Records)
│   ├── index.html        # Single-page application template
│   └── package.json      # Frontend client dependencies
│
├── backend/              # ⚙️ Telephony & Records API (Node.js, Express, Twilio)
│   ├── src/routes/       # Twilio voice calling, patient encounter persistence, lab tracking
│   ├── src/services/     # Twilio Voice API, Markdown/JSON archival to disk
│   └── package.json      # Backend server dependencies
│
├── agentic_ai/           # 🧠 Autonomous Multi-Agent Clinical Decision Engine
│   ├── src/agents/       # DiagnosticAgent, ReportAnalysisAgent, WatchdogAgent, VoiceAgent
│   ├── src/models/       # 9 clinical modalities, 18 neural architectures (BiomedCLIP, Swin UNETR)
│   ├── src/pipelines/    # Automated cross-modal inference & Grad-CAM heatmap mapping
│   ├── python/           # Python native agentic AI implementation
│   └── package.json      # Agentic AI dependencies & test runners
│
└── patient_records/      # 📄 Permanent disk storage of clinical encounter documents (.md & .json)
```

---

## 🌟 Executive Summary

Healthcare follow-ups frequently fail because clinics, laboratories, pharmacies, referral specialists, and patients operate in silos. In standard outpatient care:
- **Diagnostic lab test results** are delayed or lost in transmission without alert.
- **E-Prescriptions** remain uncollected at community pharmacies, causing therapy discontinuation.
- **Specialist referrals** sit unconfirmed in queues for weeks with no follow-up booking.
- **Follow-up clinic appointments** are missed with no safety outreach.
- **Patient data sharing consent** is often either completely ignored or rigidly blocked with no clinical escalation pathway.

**CareSync 360** bridges these disconnected entities through a **centralized orchestration engine** featuring:
1. **End-to-End Patient Journey Tracking (360° Roadmap)** across 5 distinct provider domains.
2. **Automated Missed-Step & SLA Watchdog Engine** that monitors deadlines in real-time.
3. **Multi-Tier Escalation Matrix** (Level 1: Coordinator, Level 2: Supervisor, Level 3: Medical Director).
4. **Granular Patient Consent Management & Break-Glass Emergency Override**.
5. **Role-Based Access Control (RBAC)** simulating Clinic Doctors, Lab Technologists, Pharmacists, Specialists, Care Coordinators, Patients, and Compliance Auditors.
6. **Time Simulator & Fast-Forward Engine** (`+12h`, `+24h`, `+3d`) to test SLA breaches live.

---

## 🏗️ Architecture & Ecosystem Entities

```mermaid
flowchart TD
    Patient([👤 Synthetic Patient\nConsent Preferences]) -->|1. Visits Clinic| Clinic[🩺 Primary Care Clinic\nDr. Michael Hayes, MD]
    
    Clinic -->|2. Diagnostic Order| Lab[🧪 Laboratory\nBioQuest Diagnostics\n24h-48h SLA]
    Clinic -->|3. E-Prescription| Pharm[💊 Community Pharmacy\nOak Street Pharmacy\n24h SLA]
    Clinic -->|4. Specialist Referral| Spec[🩺 Specialist Network\nCardiology / Endocrine\n48h-72h SLA]
    Clinic -->|5. Schedules Review| ReviewApt[📅 Follow-Up Visit\n7-14 Day Safety Window]
    
    Lab -.->|Result or Delay| Watchdog{🛡️ CareSync 360\nSLA Watchdog Engine}
    Pharm -.->|Dispensed or Unclaimed| Watchdog
    Spec -.->|Booked or Stalled| Watchdog
    ReviewApt -.->|Attended or No-Show| Watchdog
    
    Watchdog -->|SLA Breach Detected| Escalations[🚨 Multi-Tier Escalations\nL1: Coordinator | L2: Supervisor | L3: Medical Director]
    Escalations --> Coordinator[🛡️ Care Coordinator Control Tower\nDirect Patient Outreach & Resolution]
```

---

## 🚀 Key Feature Workflows

### 1. Unified Clinic Encounter & Follow-Up Wizard
Clinicians can click **"New Clinic Visit"** to:
- Select a synthetic patient (or switch between predefined clinical scenarios).
- Verify active patient consent in real time.
- Enter vital signs (BP, HR, RR, Temp, SpO2, Weight) and primary diagnosis.
- Simultaneously order **Diagnostic Labs**, prescribe **Medications**, dispatch a **Specialist Referral**, and book a **Follow-Up Appointment**.
- Submitting automatically generates the unified follow-up journey and initializes all SLA timers.

### 2. Automated Missed-Step & SLA Watchdog Engine
Configurable thresholds monitor active workflows:
- **Lab Turnaround:** Stat: 6h | Urgent: 24h | Routine: 48h.
- **Pharmacy Pickup:** Flags medications uncollected after 24-48h.
- **Referral Triage:** Urgent: 48h | Routine: 72h before escalating unconfirmed referrals.
- **Follow-up Appointments:** Detects patient no-shows and triggers safety outreach.

### 3. Pre-Loaded Realistic Scenarios
- **Scenario 1: Mrs. Eleanor Vance (71 yo)** — Heart failure exacerbation. Lab order delayed past 24h SLA (`NT-proBNP 1,420 pg/mL` critical value) and Cardiology referral unconfirmed past 48h SLA. Demonstrates active Level 2 and Level 3 escalations!
- **Scenario 2: Marcus Chen (48 yo)** — Type 2 Diabetes. Metformin ER sitting uncollected at Oak Street Pharmacy for >72h. Demonstrates automated pharmacy non-fulfillment detection.
- **Scenario 3: Sarah Jenkins (34 yo)** — Asthma step-up therapy. Advair Diskus picked up smoothly, lab specimen in analysis, pulmonology consult confirmed. Demonstrates ideal on-track pathway.
- **Scenario 4: David Rodriguez (56 yo)** — Restricted data-sharing consent. Demonstrates consent blocking and the **Emergency Break-Glass** workflow.

### 4. Interactive Simulation & Time Travel Controls
- Click **`+12h`**, **`+24h`**, or **`+3d`** in the top navigation to fast-forward simulated system time.
- The watchdog scans all pending steps against the new simulated clock and triggers real-time alerts.

### 5. Granular Consent & Emergency Break-Glass Override
- **Granular Toggles:** Patient can independently permit or restrict data sharing with labs, pharmacies, and specialists.
- **Consent Enforcer:** Halts order dispatch if consent is revoked and notifies coordinators.
- **Break-Glass:** In acute medical emergencies, authorized clinicians can execute a 24-hour temporary consent bypass with mandatory clinical justification and permanent immutable audit logging.

### 6. Tamper-Evident Audit Trail
- Every access, state change, escalation resolution, and consent toggle records:
  - Timestamp, Actor Role, Actor Name, Action Code, Resource ID, Severity.
  - Cryptographic verification hash (SHA-style).
  - Exportable to **CSV** and **JSON**.

---

## 💻 Tech Stack

- **Framework:** React 18 with TypeScript
- **Styling:** Tailwind CSS with custom medical theme tokens
- **Icons:** Lucide React
- **Bundler / Server:** Vite 6
- **Architecture:** Zero-external database required (Reactive state engine with LocalStorage persistence)

---

## 🏃‍♂️ Getting Started

### Development Mode
```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Visit **`http://localhost:3000`** (or `http://localhost:3001` if port 3000 is occupied).

### Production Build
```bash
npm run build
npm run preview
```

