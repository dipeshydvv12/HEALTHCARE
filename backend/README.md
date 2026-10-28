# EnsureCare Backend • Healthcare Coordination & Telephony API

The Node.js & Express backend for EnsureCare, providing telephony integrations via Twilio, permanent consultation visit records archival, and laboratory order state management.

## API Endpoints

### 1. System Health
- `GET /api/health` - Check backend service uptime and Twilio configuration status.

### 2. Twilio Telephony Services
- `POST /api/twilio/call` - Initiate an outbound reminder call to a patient with custom speech synthesis.
  - Body: `{ to: "+919528871260", patientName: "Dipesh Yadav", message: "Reminder message" }`
- `ALL /api/twilio/twiml` - Serves standard TwiML voice response markup.
- `POST /api/twilio/test-call` - Quick verification test call to verify line connectivity.

### 3. Patient Consultation Encounter Records
- `POST /api/records` - Persist structured doctor visit summary to permanent disk storage (`patient_records/*.json` and `*.md`).
- `GET /api/records` - Retrieve listing of all saved clinical encounter summaries.
- `GET /api/records/:id` - Fetch full clinical encounter documentation for a record ID.

### 4. Laboratory Tracking
- `GET /api/lab/orders` - View active laboratory diagnostic orders.
- `PATCH /api/lab/orders/:patientId` - Update test status (e.g. `specimen_collected`, `analyzing`, `completed`) with AI findings summary.

## Running Locally
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start development server
npm run dev
```
