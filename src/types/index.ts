// EnsureCare Simple & Fast Patient Journey Types

export type PageTab = 'checkin' | 'doctor' | 'lab' | 'pharmacy' | 'referrals' | 'tracker' | 'tasks' | 'records';

export type TaskType = 'lab_test' | 'pharmacy_pickup' | 'specialist_referral' | 'doctor_followup';
export type EscalationLevel = 'none' | 'Level 1: Care Coordinator' | 'Level 2: Clinic Supervisor' | 'Level 3: Medical Director';

export interface OutstandingTask {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientLocation: string;
  taskType: TaskType;
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  hoursRemaining: number; // Negative if overdue!
  isMissedStep: boolean;
  missedReason?: string;
  escalationLevel: EscalationLevel;
  status: 'pending' | 'escalated' | 'resolved';
  providerName: string;
  googleMapsUrl?: string;
}

export interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  location: string; // Patient physical location / address
  symptoms: string;
  consentGranted: boolean;
  
  // Status of the patient visit
  status: 'waiting_for_doctor' | 'in_consultation' | 'sent_to_providers' | 'completed';
  
  // Routing decisions made by the doctor
  routing: {
    // 1. Laboratory
    sendToLab: boolean;
    labTestName?: string;
    labPriority?: 'Routine' | 'Urgent';
    labStatus?: 'pending' | 'in_progress' | 'completed';
    labResult?: string;
    labAppointmentDate?: string; // e.g. 2026-10-28
    labAppointmentTime?: string; // e.g. 10:30 AM
    labFacilityName?: string;
    labFacilityAddress?: string;
    labFacilityGoogleMaps?: string;
    labReminderSentWhatsApp?: boolean;
    labReminderCallStatus?: 'not_called' | 'calling' | 'completed';
    
    // 2. Pharmacy
    sendToPharmacy: boolean;
    medicationName?: string;
    dosage?: string;
    instructions?: string;
    pharmacyStatus?: 'pending' | 'dispensed';
    pharmacyFacilityName?: string;
    pharmacyFacilityAddress?: string;
    pharmacyFacilityGoogleMaps?: string;
    
    // 3. Specialist Referral
    sendToReferral: boolean;
    specialist?: string;
    famousDoctorName?: string;
    famousHospital?: string;
    famousHospitalGoogleMaps?: string;
    referralReason?: string;
    referralStatus?: 'pending' | 'scheduled';
    referralDate?: string;
    
    // 4. Clinic & Follow-up
    clinicName?: string;
    clinicAddress?: string;
    clinicGoogleMaps?: string;
    followUpDays?: number;
    doctorFollowUpDate?: string; // e.g. 2026-11-04
    doctorFollowUpTime?: string; // e.g. 11:00 AM
    doctorNotes?: string;

    // 5. Watchdog Status
    missedStepsCount?: number;
    hasOverdueTask?: boolean;
  };
  
  createdAt: string;
}

// Official Documented File Record for Every Doctor Visit (Permanently Saved)
export interface ClinicalEncounterDoc {
  id: string; // e.g. REC-20261028-001
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  patientPhone: string;
  patientLocation: string; // Residential Address
  visitTimestamp: string;
  purposeOfVisit: string; // Chief complaint / Symptoms in detail
  examiningDoctor: string;
  clinicName: string;
  clinicAddress: string;
  clinicGoogleMaps: string;
  doctorNotes: string;
  diagnosis: string;
  medication: {
    prescribed: boolean;
    name?: string;
    dosage?: string;
    instructions?: string;
    pharmacyName?: string;
    pharmacyAddress?: string;
    pharmacyGoogleMaps?: string;
  };
  laboratory: {
    ordered: boolean;
    testName?: string;
    priority?: 'Routine' | 'Urgent';
    appointmentDate?: string;
    appointmentTime?: string;
    facilityName?: string;
    facilityAddress?: string;
    facilityGoogleMaps?: string;
  };
  referral: {
    referred: boolean;
    specialist?: string;
    famousDoctorName?: string;
    famousHospital?: string;
    googleMapsUrl?: string;
    reason?: string;
  };
  followUp: {
    scheduledDate?: string;
    scheduledTime?: string;
  };
  savedPermanently: boolean;
  filePath?: string;
}
