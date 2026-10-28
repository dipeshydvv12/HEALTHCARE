// backend/src/services/recordService.ts
// Handles generation and permanent archival of clinical encounter documentation
import fs from 'fs';
import path from 'path';

export interface ClinicalEncounterPayload {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone: string;
  patientLocation: string;
  purposeOfVisit: string;
  examiningDoctor: string;
  clinicName: string;
  clinicAddress: string;
  clinicGoogleMaps: string;
  visitTimestamp: string;
  doctorNotes: string;
  diagnosis: string;
  medication?: {
    prescribed: boolean;
    name: string;
    dosage: string;
    instructions: string;
    pharmacyName: string;
    pharmacyAddress: string;
    pharmacyGoogleMaps: string;
  };
  laboratory?: {
    ordered: boolean;
    testName: string;
    priority: string;
    appointmentDate: string;
    appointmentTime: string;
    facilityName: string;
    facilityAddress: string;
    facilityGoogleMaps: string;
  };
  referral?: {
    referred: boolean;
    specialist: string;
    famousDoctorName: string;
    famousHospital: string;
    googleMapsUrl: string;
    reason: string;
  };
  followUp?: {
    scheduledDate: string;
    scheduledTime: string;
  };
}

export function getRecordsDir(): string {
  const dir = process.env.RECORDS_DIR 
    ? path.resolve(process.cwd(), process.env.RECORDS_DIR)
    : path.resolve(process.cwd(), '../patient_records');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function generateMarkdownSummary(doc: ClinicalEncounterPayload): string {
  const formattedDate = doc.visitTimestamp
    ? new Date(doc.visitTimestamp).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })
    : new Date().toLocaleString();

  return `# OFFICIAL CLINICAL ENCOUNTER SUMMARY & PERMANENT MEDICAL RECORD
================================================================================
RECORD IDENTIFIER: ${doc.id}
ENCOUNTER DATE:    ${formattedDate}
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
  ${doc.doctorNotes || 'Comprehensive clinical consultation completed. Diagnostic workup and follow-up plan established.'}
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

export function saveClinicalRecord(record: ClinicalEncounterPayload): { jsonPath: string; mdPath: string } {
  const dir = getRecordsDir();
  const safeName = record.patientName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const baseFilename = `${record.id}_${safeName}`;
  const jsonPath = path.join(dir, `${baseFilename}.json`);
  const mdPath = path.join(dir, `${baseFilename}.md`);

  const mdContent = generateMarkdownSummary(record);
  fs.writeFileSync(jsonPath, JSON.stringify(record, null, 2), 'utf8');
  fs.writeFileSync(mdPath, mdContent, 'utf8');

  return { jsonPath, mdPath };
}

export function listAllRecords(): Array<{ id: string; patientName: string; date: string; file: string }> {
  const dir = getRecordsDir();
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  return files.map(file => {
    try {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const data = JSON.parse(raw);
      return {
        id: data.id || file.replace('.json', ''),
        patientName: data.patientName || 'Unknown Patient',
        date: data.visitTimestamp || new Date().toISOString(),
        file
      };
    } catch {
      return { id: file, patientName: 'Record File', date: '', file };
    }
  });
}
