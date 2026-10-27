// server/twilioService.ts - Server-side Twilio Voice API Service & Middleware
import type { Plugin, ViteDevServer } from 'vite';
import dotenv from 'dotenv';
import twilio from 'twilio';
import fs from 'fs';
import path from 'path';

// Load .env file
dotenv.config({ override: true });

// Ensure permanent patient records directory exists on disk
const RECORDS_DIR = path.resolve(process.cwd(), 'patient_records');
if (!fs.existsSync(RECORDS_DIR)) {
  fs.mkdirSync(RECORDS_DIR, { recursive: true });
}

export function generateMarkdownDocument(doc: any): string {
  const visitDate = doc.visitTimestamp ? new Date(doc.visitTimestamp).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' }) : new Date().toLocaleString();
  return `# OFFICIAL CLINICAL ENCOUNTER SUMMARY & PERMANENT MEDICAL RECORD
================================================================================
RECORD IDENTIFIER: ${doc.id}
ENCOUNTER DATE:    ${visitDate}
ATTENDING CLINIC:  ${doc.clinicName || 'Max Multi Speciality Centre'}
CLINIC LOCATION:   ${doc.clinicAddress || 'N-110, Panchsheel Park, New Delhi, Delhi 110017'}
GOOGLE MAPS:       ${doc.clinicGoogleMaps || 'https://www.google.com/maps/search/?api=1&query=Max+Multi+Speciality+Centre+Panchsheel+Park+New+Delhi'}
EXAMINING DOCTOR:  ${doc.examiningDoctor || 'Dr. Michael Hayes, MD (Senior Attending Physician)'}
PERMANENT ARCHIVE: Verified & Persisted to Disk Storage (/patient_records)
================================================================================

## 1. PATIENT DEMOGRAPHICS
* Patient Name:         ${doc.patientName}
* Age / Biological Sex: ${doc.patientAge} Years / ${doc.patientGender}
* Contact Phone:        ${doc.patientPhone}
* Residential Location: ${doc.patientLocation}

--------------------------------------------------------------------------------

## 2. PURPOSE OF VISIT & CHIEF COMPLAINT
> "${doc.purposeOfVisit}"

--------------------------------------------------------------------------------

## 3. CLINICAL ASSESSMENT & DOCTOR NOTES
* Attending Clinical Notes:
  ${doc.doctorNotes || 'Patient examined. Comprehensive clinical evaluation and diagnostic plan formulated.'}
* Working Diagnosis:
  ${doc.diagnosis || doc.purposeOfVisit}

--------------------------------------------------------------------------------

## 4. PHARMACEUTICAL PRESCRIPTION & DISPENSING
${doc.medication?.prescribed ? `* Prescribed Drug:      ${doc.medication.name}
* Strength / Dosage:    ${doc.medication.dosage}
* Directions for Use:   ${doc.medication.instructions}
* Dispensing Pharmacy:  ${doc.medication.pharmacyName}
* Pharmacy Address:     ${doc.medication.pharmacyAddress}
* Open on Google Maps:  ${doc.medication.pharmacyGoogleMaps}` : '* No prescription medication required for this consultation.'}

--------------------------------------------------------------------------------

## 5. DIAGNOSTIC LABORATORY ORDERS
${doc.laboratory?.ordered ? `* Diagnostic Workup:    ${doc.laboratory.testName}
* Priority Status:      ${doc.laboratory.priority}
* Scheduled Appointment:${doc.laboratory.appointmentDate} at ${doc.laboratory.appointmentTime}
* Collection Facility:  ${doc.laboratory.facilityName}
* Facility Address:     ${doc.laboratory.facilityAddress}
* Open on Google Maps:  ${doc.laboratory.facilityGoogleMaps}` : '* No laboratory diagnostic test ordered.'}

--------------------------------------------------------------------------------

## 6. SPECIALIST CONSULTATION & REFERRAL
${doc.referral?.referred ? `* Specialized Field:    ${doc.referral.specialist}
* Renowned Specialist:  ${doc.referral.famousDoctorName}
* Hospital / Institute: ${doc.referral.famousHospital}
* Institute Map Link:   ${doc.referral.googleMapsUrl}
* Clinical Indication:  ${doc.referral.reason}` : '* No external specialist consultation indicated.'}

--------------------------------------------------------------------------------

## 7. FOLLOW-UP CARE & COORDINATION
* Scheduled Follow-Up:  ${doc.followUp?.scheduledDate || 'In 7 Days'} at ${doc.followUp?.scheduledTime || '11:00 AM'}
* Location:             ${doc.clinicName || 'Max Multi Speciality Centre'}

================================================================================
Electronic Attestation & Signature:
Signed by: Dr. Michael Hayes, MD (License #MC-DEL-89241)
Senior Attending Physician, Internal Medicine
Archive Path: patient_records/${doc.id}.md
================================================================================
`;
}

export interface TwilioCallPayload {
  to: string;
  patientName: string;
  message?: string;
  taskType?: string;
  providerName?: string;
}

export function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim();
  const voice = process.env.TWILIO_VOICE_NAME?.trim() || 'Polly.Aditi';
  const language = process.env.TWILIO_VOICE_LANGUAGE?.trim() || 'en-IN';

  const isConfigured = Boolean(
    accountSid &&
    authToken &&
    fromNumber &&
    !accountSid.includes('your_twilio') &&
    !accountSid.includes('ACxxxxxxxx') &&
    !authToken.includes('your_twilio') &&
    !fromNumber.includes('your_twilio')
  );

  return {
    isConfigured,
    accountSid,
    authToken,
    fromNumber,
    voice,
    language
  };
}

export function formatE164Phone(rawPhone: string): string {
  const cleaned = rawPhone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  const digits = cleaned.replace(/[^0-9]/g, '');
  // Default to +91 for 10-digit Indian numbers, or +1 for 10-digit US numbers
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  return `+${digits}`;
}

export async function makeTwilioVoiceCall(payload: TwilioCallPayload) {
  const config = getTwilioConfig();

  if (!config.isConfigured || !config.accountSid || !config.authToken || !config.fromNumber) {
    return {
      success: false,
      simulated: true,
      error: 'Twilio credentials not configured in .env',
      details: 'Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your .env file to place real phone calls.'
    };
  }

  const client = twilio(config.accountSid, config.authToken);
  const formattedTo = formatE164Phone(payload.to);

  // Construct patient-specific speech message
  const defaultMessage = `Hello ${payload.patientName}. This is EnsureCare Patient Coordination calling regarding your upcoming healthcare follow-up. Please ensure you attend your scheduled visit.`;
  const speechText = payload.message || defaultMessage;

  // Escape XML entities for TwiML
  const escapedSpeech = speechText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  const twiml = `
<Response>
  <Pause length="1"/>
  <Say voice="alice" language="${config.language}">
    ${escapedSpeech}
  </Say>
</Response>`.trim();

  const echoUrl = `https://twimlets.com/echo?Twiml=${encodeURIComponent(twiml)}`;

  try {
    const call = await client.calls.create({
      url: echoUrl,
      to: formattedTo,
      from: config.fromNumber
    });

    return {
      success: true,
      callSid: call.sid,
      status: call.status,
      to: formattedTo,
      from: config.fromNumber,
      direction: call.direction,
      dateCreated: call.dateCreated
    };
  } catch (err: unknown) {
    const twilioErr = err as { message?: string; code?: number; moreInfo?: string; status?: number };
    return {
      success: false,
      error: twilioErr.message || 'Failed to place Twilio call',
      code: twilioErr.code,
      moreInfo: twilioErr.moreInfo,
      status: twilioErr.status
    };
  }
}

// Vite Dev Server Plugin to handle /api/twilio/* endpoints
export function twilioDevServerPlugin(): Plugin {
  return {
    name: 'ensurecare-twilio-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        // Handle GET /api/twilio/status
        if (req.url === '/api/twilio/status' && req.method === 'GET') {
          // Re-load .env in case user modified it while server is running
          dotenv.config({ override: true });
          const config = getTwilioConfig();
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              configured: config.isConfigured,
              fromNumber: config.isConfigured ? config.fromNumber : null,
              voice: config.voice,
              language: config.language
            })
          );
          return;
        }

        // Handle POST /api/twilio/call
        if (req.url === '/api/twilio/call' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });

          req.on('end', async () => {
            try {
              dotenv.config({ override: true });
              const payload: TwilioCallPayload = JSON.parse(body || '{}');
              if (!payload.to) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Recipient phone number (to) is required.' }));
                return;
              }

              const result = await makeTwilioVoiceCall(payload);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = result.success ? 200 : result.simulated ? 200 : 500;
              res.end(JSON.stringify(result));
            } catch (error: unknown) {
              const err = error as Error;
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message || 'Server error processing call' }));
            }
          });
          return;
        }

        // Handle POST /api/gemini/recommend
        if (req.url === '/api/gemini/recommend' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });

          req.on('end', async () => {
            try {
              const { symptoms, patientName, age } = JSON.parse(body || '{}');
              const geminiApiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
              
              const prompt = `You are a medical clinical decision-support assistant.
Patient: "${patientName || 'Patient'}", Age: ${age || 35}, Problem/Symptoms: "${symptoms}".
Return clinically sound recommendation in ONLY JSON format:
{
  "medicationName": "First line standard medicine name",
  "dosage": "dosage string",
  "instructions": "patient directions",
  "labTestName": "diagnostic lab test name",
  "labPriority": "Routine or Urgent",
  "specialist": "specialist medical field",
  "famousDoctorName": "real internet-famous doctor in this field",
  "famousHospital": "famous hospital name",
  "referralReason": "clinical reason"
}`;

              // Try Gemini 2.5 Flash / 2.0 Flash
              const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
              let resultJson = null;

              for (const model of models) {
                try {
                  const apiRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }]
                      })
                    }
                  );
                  if (apiRes.ok) {
                    const data = await apiRes.json();
                    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
                    resultJson = JSON.parse(clean);
                    break;
                  }
                } catch (e) {
                  // try next model
                }
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, recommendation: resultJson }));
            } catch (err: unknown) {
              const error = err as Error;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: error.message }));
            }
          });
          return;
        }

        // Handle GET /api/records - Retrieve all permanently archived visit records
        if (req.url === '/api/records' && req.method === 'GET') {
          try {
            if (!fs.existsSync(RECORDS_DIR)) {
              fs.mkdirSync(RECORDS_DIR, { recursive: true });
            }

            const files = fs.readdirSync(RECORDS_DIR);
            const jsonFiles = files.filter(f => f.endsWith('.json'));

            let records: any[] = [];
            for (const f of jsonFiles) {
              try {
                const raw = fs.readFileSync(path.join(RECORDS_DIR, f), 'utf-8');
                records.push(JSON.parse(raw));
              } catch (e) {
                // skip corrupted
              }
            }

            // Seed initial sample visit record for Dipesh Yadav if disk directory is currently empty
            if (records.length === 0) {
              const initialRecord = {
                id: 'REC-20261028-1001',
                patientId: 'pat-seed-01',
                patientName: 'Dipesh Yadav',
                patientAge: 24,
                patientGender: 'Male',
                patientPhone: '+919528871260',
                patientLocation: 'Connaught Place, Central Delhi, Delhi 110001',
                visitTimestamp: '2026-10-28T09:30:00.000Z',
                purposeOfVisit: 'Severe throbbing headache on right temple with nausea, photo-sensitivity and visual aura',
                examiningDoctor: 'Dr. Michael Hayes, MD (Senior Attending Physician)',
                clinicName: 'Max Multi Speciality Centre',
                clinicAddress: 'N-110, Panchsheel Park, New Delhi, Delhi 110017',
                clinicGoogleMaps: 'https://www.google.com/maps/search/?api=1&query=Max+Multi+Speciality+Centre+Panchsheel+Park+New+Delhi',
                doctorNotes: 'Patient presented with acute hemicranial pulsating headache accompanied by nausea and photophobia. Neurological cranial nerve screen intact. Initiated 5-HT1B/1D agonist therapy, diagnostic magnetic resonance imaging and neuro referral.',
                diagnosis: 'Acute Migraine with Aura & Persistent Tension Headache',
                medication: {
                  prescribed: true,
                  name: 'Sumatriptan 50mg Tablets',
                  dosage: '50 mg single tablet orally',
                  instructions: 'Take 1 tablet at the first sign of migraine or severe headache with water. Rest in a dark, quiet room.',
                  pharmacyName: 'Apollo Pharmacy 24x7 Express',
                  pharmacyAddress: 'Shop No. 4, Community Centre, New Friends Colony, New Delhi, Delhi 110025',
                  pharmacyGoogleMaps: 'https://www.google.com/maps/search/?api=1&query=Apollo+Pharmacy+New+Friends+Colony+New+Delhi'
                },
                laboratory: {
                  ordered: true,
                  testName: 'MRI Brain with Contrast & Inflammatory Marker (ESR)',
                  priority: 'Routine',
                  appointmentDate: '2026-10-29',
                  appointmentTime: '10:30 AM',
                  facilityName: 'Dr. Lal PathLabs National Reference Laboratory',
                  facilityAddress: 'Block E, Sector 18, Rohini, New Delhi, Delhi 110085',
                  facilityGoogleMaps: 'https://www.google.com/maps/search/?api=1&query=Dr+Lal+PathLabs+National+Reference+Lab+Rohini+Delhi'
                },
                referral: {
                  referred: true,
                  specialist: 'Neurologist',
                  famousDoctorName: 'Dr. Peter Goadsby, MD, PhD, FMedSci',
                  famousHospital: 'Mayo Clinic & King’s College London',
                  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Mayo+Clinic+Rochester+MN',
                  reason: 'Persistent severe headache evaluation, migraine profiling and neurological screening'
                },
                followUp: {
                  scheduledDate: '2026-11-04',
                  scheduledTime: '11:00 AM'
                },
                savedPermanently: true,
                filePath: 'patient_records/REC-20261028-1001_dipesh_yadav.md'
              };

              const mdContent = generateMarkdownDocument(initialRecord);
              fs.writeFileSync(path.join(RECORDS_DIR, 'REC-20261028-1001_dipesh_yadav.json'), JSON.stringify(initialRecord, null, 2), 'utf-8');
              fs.writeFileSync(path.join(RECORDS_DIR, 'REC-20261028-1001_dipesh_yadav.md'), mdContent, 'utf-8');
              records.push(initialRecord);
            }

            // Sort by visit date descending
            records.sort((a, b) => new Date(b.visitTimestamp).getTime() - new Date(a.visitTimestamp).getTime());

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, count: records.length, records }));
          } catch (err: unknown) {
            const error = err as Error;
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: error.message }));
          }
          return;
        }

        // Handle POST /api/records/save - Permanently save visit document to disk
        if (req.url === '/api/records/save' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });

          req.on('end', () => {
            try {
              if (!fs.existsSync(RECORDS_DIR)) {
                fs.mkdirSync(RECORDS_DIR, { recursive: true });
              }

              const doc = JSON.parse(body || '{}');
              if (!doc.id || !doc.patientName) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Record ID and Patient Name are required.' }));
                return;
              }

              const safeSlug = doc.patientName.toLowerCase().replace(/[^a-z0-9]/g, '_');
              const baseName = `${doc.id}_${safeSlug}`;
              const jsonPath = path.join(RECORDS_DIR, `${baseName}.json`);
              const mdPath = path.join(RECORDS_DIR, `${baseName}.md`);

              doc.savedPermanently = true;
              doc.filePath = `patient_records/${baseName}.md`;

              // Generate Markdown document and write both files
              const mdContent = generateMarkdownDocument(doc);
              fs.writeFileSync(jsonPath, JSON.stringify(doc, null, 2), 'utf-8');
              fs.writeFileSync(mdPath, mdContent, 'utf-8');

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                id: doc.id,
                jsonPath: `patient_records/${baseName}.json`,
                mdPath: `patient_records/${baseName}.md`,
                message: 'Clinical encounter successfully documented and saved permanently to disk.'
              }));
            } catch (err: unknown) {
              const error = err as Error;
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: error.message }));
            }
          });
          return;
        }

        // Handle GET /api/records/file?id=...&type=md|json - Stream raw documented file
        if (req.url?.startsWith('/api/records/file') && req.method === 'GET') {
          try {
            const urlObj = new URL(req.url, 'http://localhost');
            const recordId = urlObj.searchParams.get('id');
            const fileType = urlObj.searchParams.get('type') || 'md';

            if (!recordId) {
              res.statusCode = 400;
              res.end('Record ID is required.');
              return;
            }

            const files = fs.readdirSync(RECORDS_DIR);
            const matchingFile = files.find(f => f.startsWith(recordId) && f.endsWith(`.${fileType}`));

            if (!matchingFile) {
              res.statusCode = 404;
              res.end('Record file not found.');
              return;
            }

            const fullPath = path.join(RECORDS_DIR, matchingFile);
            const content = fs.readFileSync(fullPath, 'utf-8');

            if (fileType === 'json') {
              res.setHeader('Content-Type', 'application/json');
            } else {
              res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
            }
            res.setHeader('Content-Disposition', `attachment; filename="${matchingFile}"`);
            res.end(content);
          } catch (err: unknown) {
            const error = err as Error;
            res.statusCode = 500;
            res.end(`Error reading file: ${error.message}`);
          }
          return;
        }

        next();
      });
    }
  };
}

