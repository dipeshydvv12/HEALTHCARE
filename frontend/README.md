# EnsureCare Frontend • Clinical Care Orchestration Client

The web interface for the EnsureCare Centralized Healthcare Coordination Platform. Built with React 18, TypeScript, Tailwind CSS, and Vite.

## Architecture & Structure
```
frontend/
├── src/
│   ├── components/        # Reusable UI components (Navbar, Modals, Action Buttons)
│   ├── context/           # AppContext state orchestration & patient store
│   ├── data/              # Real Indian clinical facilities, doctors, pharmacies
│   ├── services/          # Client API services, Twilio call client, AI diagnostic client
│   ├── types/             # TypeScript interfaces for patients, visits, lab orders
│   ├── views/             # Core clinical workflow screens (Check-in, Doctor Desk, Lab, Pharmacy, etc.)
│   ├── App.tsx            # Root navigation and clinical workflow tabs
│   └── main.tsx           # React DOM entrypoint
├── index.html             # HTML5 template
├── tailwind.config.js     # Dark navy hospital theme styling (#070D18)
├── vite.config.ts         # Vite build and proxy configuration
└── package.json           # Frontend dependencies
```

## Features
- **7-Stage Clinical Follow-Up Workflow**: Patient Check-in, Doctor Desk, Laboratory Diagnostic Workup, Pharmacy Dispensation, Specialist Referral, Patient Timeline Tracker, and Clinical Medical Records.
- **AI Diagnostic Laboratory & Reports Studio**: Multi-modal scan analyzer (Chest X-Ray PA View with pulmonary consolidation detection, PDF clinical document viewer with BioBERT entity chips).
- **Twilio AI Voice Call Patient Reminder**: One-click voice call dispatching directly from the UI.
- **Permanent Consultation Visit Record Archival**: Real-time generation and export of structured Markdown (`.md`) and JSON records.

## Getting Started
```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```
