// AppContext.tsx - Fast & Simple Patient Coordination & Missed Step Detection Store
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { PatientRecord, PageTab, OutstandingTask, EscalationLevel, ClinicalEncounterDoc } from '../types';
import { REAL_CLINIC, REAL_LABORATORY, REAL_PHARMACY } from '../data/realFacilities';

interface AppContextType {
  activeTab: PageTab;
  setActiveTab: (tab: PageTab) => void;
  patients: PatientRecord[];
  activePatientId: string | null;
  setActivePatientId: (id: string | null) => void;
  
  // Simulated Time & Watchdog
  simulatedNow: string; // ISO string
  advanceTime: (hours: number) => void;
  resetTime: () => void;
  
  // Outstanding Tasks & Missed Step Detection
  outstandingTasks: OutstandingTask[];
  missedStepsCount: number;
  criticalEscalationsCount: number;

  // Permanent Clinical Visit Documentation Records
  clinicalRecords: ClinicalEncounterDoc[];
  saveClinicalRecord: (doc: ClinicalEncounterDoc) => Promise<void>;

  // Actions
  checkInPatient: (patientData: Omit<PatientRecord, 'id' | 'status' | 'routing' | 'createdAt'>) => string;
  doctorDecideRouting: (patientId: string, routing: PatientRecord['routing']) => void;
  updateLabStatus: (patientId: string, status: 'in_progress' | 'completed', result?: string) => void;
  updatePharmacyStatus: (patientId: string, status: 'dispensed') => void;
  updateReferralStatus: (patientId: string, status: 'scheduled', date?: string) => void;
  markWhatsAppReminderSent: (patientId: string) => void;
  markAiCallCompleted: (patientId: string) => void;
  resolveTask: (taskId: string, notes?: string) => void;
  escalateTask: (taskId: string, level: EscalationLevel) => void;
  rescheduleAppointment: (patientId: string, type: 'lab' | 'referral' | 'doctor', newDate: string, newTime: string) => void;
  resetDemo: () => void;
}

const DEFAULT_SIMULATED_TIME = new Date().toISOString();

const SAMPLE_PATIENT: PatientRecord = {
  id: 'pat-9528',
  name: 'Dipesh Yadav',
  age: 24,
  gender: 'Male',
  phone: '+919528871260',
  location: 'Connaught Place, Central Delhi, Delhi 110001',
  symptoms: 'Mild fever (100°F) and seasonal cough for 2 days',
  consentGranted: true,
  status: 'sent_to_providers',
  routing: {
    sendToLab: true,
    labTestName: 'Complete Blood Count (CBC) & Diagnostic Panel',
    labPriority: 'Urgent',
    labStatus: 'pending',
    labAppointmentDate: '2026-10-29',
    labAppointmentTime: '10:30 AM',
    labFacilityName: REAL_LABORATORY.name,
    labFacilityAddress: REAL_LABORATORY.address,
    labFacilityGoogleMaps: REAL_LABORATORY.googleMapsUrl,
    labReminderSentWhatsApp: false,
    labReminderCallStatus: 'not_called',
    sendToPharmacy: true,
    medicationName: 'Paracetamol 650mg & Vitamin C',
    dosage: '1 tablet twice daily after meals',
    instructions: 'Take with food and drink plenty of water.',
    pharmacyStatus: 'pending',
    pharmacyFacilityName: REAL_PHARMACY.name,
    pharmacyFacilityAddress: REAL_PHARMACY.address,
    pharmacyFacilityGoogleMaps: REAL_PHARMACY.googleMapsUrl,
    sendToReferral: true,
    specialist: 'Pulmonologist (Chest & Lungs Specialist)',
    famousDoctorName: 'Dr. Randeep Guleria, MD, DM',
    famousHospital: 'Medanta Hospital & Former Director AIIMS',
    famousHospitalGoogleMaps: 'https://www.google.com/maps/search/?api=1&query=Medanta+The+Medicity+Gurugram',
    referralReason: 'Evaluation for seasonal febrile cough profile',
    referralStatus: 'pending',
    clinicName: REAL_CLINIC.name,
    clinicAddress: REAL_CLINIC.address,
    clinicGoogleMaps: REAL_CLINIC.googleMapsUrl,
    followUpDays: 5,
    doctorFollowUpDate: '2026-11-03',
    doctorFollowUpTime: '11:00 AM',
    doctorNotes: 'Patient checked in with febrile cough. Routine lab panel ordered and antipyretic protocol initiated.'
  },
  createdAt: new Date().toISOString()
};

const INITIAL_PATIENTS: PatientRecord[] = [SAMPLE_PATIENT];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<PageTab>('lab');
  const [simulatedNow, setSimulatedNow] = useState<string>(() => {
    return new Date().toISOString();
  });

  const [patients, setPatients] = useState<PatientRecord[]>(() => {
    // Clear out to ensure the sample user is loaded
    try {
      localStorage.removeItem('ensurecare_patients_v5_clean');
      localStorage.removeItem('ensurecare_patients_v4');
      localStorage.removeItem('ensurecare_patients_v3');
      localStorage.removeItem('ensurecare_patients_v2');
      localStorage.removeItem('ensurecare_simulated_time');
    } catch {
      // Ignore
    }
    return INITIAL_PATIENTS;
  });
  const [activePatientId, setActivePatientId] = useState<string | null>('pat-9528');
  const [taskOverrides, setTaskOverrides] = useState<Record<string, { status?: 'resolved' | 'escalated'; escalationLevel?: EscalationLevel }>>({});

  // Permanent Clinical Visit Documentation Records
  const [clinicalRecords, setClinicalRecords] = useState<ClinicalEncounterDoc[]>(() => {
    try {
      const stored = localStorage.getItem('ensurecare_clinical_records_v1');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  // Sync with filesystem permanent records on load
  useEffect(() => {
    fetch('/api/records')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.records) && data.records.length > 0) {
          setClinicalRecords(data.records);
          localStorage.setItem('ensurecare_clinical_records_v1', JSON.stringify(data.records));
        }
      })
      .catch(err => {
        console.warn('Permanent records fetch notice:', err);
      });
  }, []);

  const saveClinicalRecord = async (doc: ClinicalEncounterDoc) => {
    setClinicalRecords(prev => [doc, ...prev.filter(r => r.id !== doc.id)]);
    try {
      localStorage.setItem('ensurecare_clinical_records_v1', JSON.stringify([doc, ...clinicalRecords.filter(r => r.id !== doc.id)]));
      await fetch('/api/records/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc)
      });
    } catch (err) {
      console.warn('Failed to save record to disk:', err);
    }
  };

  useEffect(() => {
    localStorage.setItem('ensurecare_patients_v5_clean', JSON.stringify(patients));
    localStorage.setItem('ensurecare_simulated_time', simulatedNow);
  }, [patients, simulatedNow]);

  const advanceTime = (hours: number) => {
    const current = new Date(simulatedNow);
    current.setHours(current.getHours() + hours);
    setSimulatedNow(current.toISOString());
  };

  const resetTime = () => {
    setSimulatedNow(DEFAULT_SIMULATED_TIME);
  };

  // AUTOMATED TASK GENERATION & MISSED-STEP DETECTION ENGINE
  const outstandingTasks = useMemo(() => {
    const tasks: OutstandingTask[] = [];
    const currentTimeMs = new Date(simulatedNow).getTime();

    patients.forEach(p => {
      // 1. Check Laboratory Tasks
      if (p.routing.sendToLab && p.routing.labStatus !== 'completed') {
        const appointmentDateStr = p.routing.labAppointmentDate || '2026-10-28';
        const appointmentTimeStr = p.routing.labAppointmentTime || '10:30 AM';
        
        // Approximate timestamp of appointment
        const [hourPart, minutePart] = appointmentTimeStr.split(':');
        const hour = parseInt(hourPart, 10) + (appointmentTimeStr.includes('PM') && parseInt(hourPart, 10) < 12 ? 12 : 0);
        const minute = parseInt(minutePart || '0', 10);
        const apptDate = new Date(`${appointmentDateStr}T00:00:00.000Z`);
        apptDate.setUTCHours(isNaN(hour) ? 10 : hour, isNaN(minute) ? 0 : minute);

        const diffHours = Math.round((apptDate.getTime() - currentTimeMs) / (1000 * 60 * 60));
        const isOverdue = diffHours < 0;

        const taskId = `task-lab-${p.id}`;
        const override = taskOverrides[taskId];

        if (override?.status !== 'resolved') {
          tasks.push({
            id: taskId,
            patientId: p.id,
            patientName: p.name,
            patientPhone: p.phone,
            patientLocation: p.location,
            taskType: 'lab_test',
            title: `Laboratory Specimen & Analysis: ${p.routing.labTestName}`,
            description: `Scheduled at ${p.routing.labFacilityName || REAL_LABORATORY.name}. Specimen collection must be completed.`,
            dueDate: appointmentDateStr,
            dueTime: appointmentTimeStr,
            hoursRemaining: diffHours,
            isMissedStep: isOverdue,
            missedReason: isOverdue ? `Lab appointment passed by ${Math.abs(diffHours)} hours without sample collection!` : undefined,
            escalationLevel: override?.escalationLevel || (isOverdue ? 'Level 2: Clinic Supervisor' : 'none'),
            status: override?.status || (isOverdue ? 'escalated' : 'pending'),
            providerName: p.routing.labFacilityName || REAL_LABORATORY.name,
            googleMapsUrl: p.routing.labFacilityGoogleMaps || REAL_LABORATORY.googleMapsUrl
          });
        }
      }

      // 2. Check Pharmacy Pickup Tasks
      if (p.routing.sendToPharmacy && p.routing.pharmacyStatus !== 'dispensed') {
        // Prescriptions should be picked up within 24 hours of creation
        const createdMs = new Date(p.createdAt).getTime();
        const pickupDeadlineMs = createdMs + 24 * 3600 * 1000;
        const diffHours = Math.round((pickupDeadlineMs - currentTimeMs) / (1000 * 60 * 60));
        const isOverdue = diffHours < 0;

        const taskId = `task-pharm-${p.id}`;
        const override = taskOverrides[taskId];

        if (override?.status !== 'resolved') {
          tasks.push({
            id: taskId,
            patientId: p.id,
            patientName: p.name,
            patientPhone: p.phone,
            patientLocation: p.location,
            taskType: 'pharmacy_pickup',
            title: `Medication Pick-Up: ${p.routing.medicationName}`,
            description: `${p.routing.dosage} waiting at ${p.routing.pharmacyFacilityName || REAL_PHARMACY.name}. Directions: ${p.routing.instructions}`,
            dueDate: new Date(pickupDeadlineMs).toISOString().split('T')[0],
            dueTime: 'End of Day',
            hoursRemaining: diffHours,
            isMissedStep: isOverdue,
            missedReason: isOverdue ? `Medication unclaimed at pharmacy for over ${Math.abs(diffHours)} hours past 24h pickup window!` : undefined,
            escalationLevel: override?.escalationLevel || (isOverdue ? 'Level 1: Care Coordinator' : 'none'),
            status: override?.status || (isOverdue ? 'escalated' : 'pending'),
            providerName: p.routing.pharmacyFacilityName || REAL_PHARMACY.name,
            googleMapsUrl: p.routing.pharmacyFacilityGoogleMaps || REAL_PHARMACY.googleMapsUrl
          });
        }
      }

      // 3. Check Specialist Referral Tasks
      if (p.routing.sendToReferral && p.routing.referralStatus !== 'scheduled') {
        // Referrals must be confirmed within 48h
        const createdMs = new Date(p.createdAt).getTime();
        const referralDeadlineMs = createdMs + 48 * 3600 * 1000;
        const diffHours = Math.round((referralDeadlineMs - currentTimeMs) / (1000 * 60 * 60));
        const isOverdue = diffHours < 0;

        const taskId = `task-ref-${p.id}`;
        const override = taskOverrides[taskId];

        if (override?.status !== 'resolved') {
          tasks.push({
            id: taskId,
            patientId: p.id,
            patientName: p.name,
            patientPhone: p.phone,
            patientLocation: p.location,
            taskType: 'specialist_referral',
            title: `Specialist Referral Triage: ${p.routing.famousDoctorName || p.routing.specialist}`,
            description: `Consultation at ${p.routing.famousHospital || 'Hospital'}. Reason: ${p.routing.referralReason}`,
            dueDate: new Date(referralDeadlineMs).toISOString().split('T')[0],
            dueTime: '5:00 PM',
            hoursRemaining: diffHours,
            isMissedStep: isOverdue,
            missedReason: isOverdue ? `Referral unconfirmed beyond 48-hour response target! Consultation still unscheduled.` : undefined,
            escalationLevel: override?.escalationLevel || (isOverdue ? 'Level 2: Clinic Supervisor' : 'none'),
            status: override?.status || (isOverdue ? 'escalated' : 'pending'),
            providerName: p.routing.famousHospital || 'Specialist Hospital',
            googleMapsUrl: p.routing.famousHospitalGoogleMaps
          });
        }
      }

      // 4. Check Doctor Follow-up Appointment Tasks
      if (p.routing.doctorFollowUpDate) {
        const apptDateStr = p.routing.doctorFollowUpDate;
        const apptTimeStr = p.routing.doctorFollowUpTime || '11:00 AM';
        const apptDate = new Date(`${apptDateStr}T11:00:00.000Z`);
        const diffHours = Math.round((apptDate.getTime() - currentTimeMs) / (1000 * 60 * 60));
        const isOverdue = diffHours < -2; // 2 hours grace period

        const taskId = `task-doctor-${p.id}`;
        const override = taskOverrides[taskId];

        if (override?.status !== 'resolved' && (isOverdue || diffHours < 48)) {
          tasks.push({
            id: taskId,
            patientId: p.id,
            patientName: p.name,
            patientPhone: p.phone,
            patientLocation: p.location,
            taskType: 'doctor_followup',
            title: `Doctor Follow-Up Review Consultation`,
            description: `Review lab results, medication tolerance, and specialist recommendations with Dr. Michael Hayes at ${p.routing.clinicName || REAL_CLINIC.name}.`,
            dueDate: apptDateStr,
            dueTime: apptTimeStr,
            hoursRemaining: diffHours,
            isMissedStep: isOverdue,
            missedReason: isOverdue ? `Patient missed scheduled clinic review visit (No-Show detected)!` : undefined,
            escalationLevel: override?.escalationLevel || (isOverdue ? 'Level 3: Medical Director' : 'none'),
            status: override?.status || (isOverdue ? 'escalated' : 'pending'),
            providerName: p.routing.clinicName || REAL_CLINIC.name,
            googleMapsUrl: p.routing.clinicGoogleMaps || REAL_CLINIC.googleMapsUrl
          });
        }
      }
    });

    return tasks;
  }, [patients, simulatedNow, taskOverrides]);

  const missedStepsCount = useMemo(() => {
    return outstandingTasks.filter(t => t.isMissedStep && t.status !== 'resolved').length;
  }, [outstandingTasks]);

  const criticalEscalationsCount = useMemo(() => {
    return outstandingTasks.filter(t => (t.escalationLevel === 'Level 2: Clinic Supervisor' || t.escalationLevel === 'Level 3: Medical Director') && t.status !== 'resolved').length;
  }, [outstandingTasks]);

  const checkInPatient: AppContextType['checkInPatient'] = patientData => {
    const newId = `pat-${Date.now().toString().slice(-4)}`;
    const newPatient: PatientRecord = {
      ...patientData,
      id: newId,
      status: 'waiting_for_doctor',
      routing: {
        sendToLab: false,
        sendToPharmacy: false,
        sendToReferral: false,
        clinicName: REAL_CLINIC.name,
        clinicAddress: REAL_CLINIC.address,
        clinicGoogleMaps: REAL_CLINIC.googleMapsUrl
      },
      createdAt: new Date().toISOString()
    };
    
    setPatients(prev => [newPatient, ...prev]);
    setActivePatientId(newId);
    setActiveTab('doctor');
    return newId;
  };

  const doctorDecideRouting: AppContextType['doctorDecideRouting'] = (patientId, routing) => {
    const targetPatient = patients.find(p => p.id === patientId);
    if (targetPatient) {
      const recordDate = new Date().toISOString();
      const recId = `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const docRecord: ClinicalEncounterDoc = {
        id: recId,
        patientId: targetPatient.id,
        patientName: targetPatient.name,
        patientAge: targetPatient.age,
        patientGender: targetPatient.gender,
        patientPhone: targetPatient.phone,
        patientLocation: targetPatient.location,
        visitTimestamp: recordDate,
        purposeOfVisit: targetPatient.symptoms,
        examiningDoctor: 'Dr. Michael Hayes, MD (Senior Attending Physician)',
        clinicName: routing.clinicName || REAL_CLINIC.name,
        clinicAddress: routing.clinicAddress || REAL_CLINIC.address,
        clinicGoogleMaps: routing.clinicGoogleMaps || REAL_CLINIC.googleMapsUrl,
        doctorNotes: routing.doctorNotes || `Patient examined for "${targetPatient.symptoms}". Clinical orders dispatched for diagnostic workup and medication therapy.`,
        diagnosis: routing.doctorNotes || targetPatient.symptoms,
        medication: {
          prescribed: Boolean(routing.sendToPharmacy),
          name: routing.medicationName,
          dosage: routing.dosage,
          instructions: routing.instructions,
          pharmacyName: routing.pharmacyFacilityName || REAL_PHARMACY.name,
          pharmacyAddress: routing.pharmacyFacilityAddress || REAL_PHARMACY.address,
          pharmacyGoogleMaps: routing.pharmacyFacilityGoogleMaps || REAL_PHARMACY.googleMapsUrl
        },
        laboratory: {
          ordered: Boolean(routing.sendToLab),
          testName: routing.labTestName,
          priority: routing.labPriority,
          appointmentDate: routing.labAppointmentDate,
          appointmentTime: routing.labAppointmentTime,
          facilityName: routing.labFacilityName || REAL_LABORATORY.name,
          facilityAddress: routing.labFacilityAddress || REAL_LABORATORY.address,
          facilityGoogleMaps: routing.labFacilityGoogleMaps || REAL_LABORATORY.googleMapsUrl
        },
        referral: {
          referred: Boolean(routing.sendToReferral),
          specialist: routing.specialist,
          famousDoctorName: routing.famousDoctorName,
          famousHospital: routing.famousHospital,
          googleMapsUrl: routing.famousHospitalGoogleMaps,
          reason: routing.referralReason
        },
        followUp: {
          scheduledDate: routing.doctorFollowUpDate,
          scheduledTime: routing.doctorFollowUpTime
        },
        savedPermanently: true,
        filePath: `patient_records/${recId}_${targetPatient.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`
      };

      // Permanently archive to disk and state
      saveClinicalRecord(docRecord);
    }

    setPatients(prev =>
      prev.map(p => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          status: 'sent_to_providers',
          routing: {
            ...routing,
            clinicName: routing.clinicName || REAL_CLINIC.name,
            clinicAddress: routing.clinicAddress || REAL_CLINIC.address,
            clinicGoogleMaps: routing.clinicGoogleMaps || REAL_CLINIC.googleMapsUrl,
            labFacilityName: routing.sendToLab ? (routing.labFacilityName || REAL_LABORATORY.name) : undefined,
            labFacilityAddress: routing.sendToLab ? (routing.labFacilityAddress || REAL_LABORATORY.address) : undefined,
            labFacilityGoogleMaps: routing.sendToLab ? (routing.labFacilityGoogleMaps || REAL_LABORATORY.googleMapsUrl) : undefined,
            pharmacyFacilityName: routing.sendToPharmacy ? (routing.pharmacyFacilityName || REAL_PHARMACY.name) : undefined,
            pharmacyFacilityAddress: routing.sendToPharmacy ? (routing.pharmacyFacilityAddress || REAL_PHARMACY.address) : undefined,
            pharmacyFacilityGoogleMaps: routing.sendToPharmacy ? (routing.pharmacyFacilityGoogleMaps || REAL_PHARMACY.googleMapsUrl) : undefined,
            labStatus: routing.sendToLab ? 'pending' : undefined,
            pharmacyStatus: routing.sendToPharmacy ? 'pending' : undefined,
            referralStatus: routing.sendToReferral ? 'pending' : undefined,
            labReminderSentWhatsApp: false,
            labReminderCallStatus: 'not_called'
          }
        };
      })
    );
    // Switch to Tasks & Missed Steps tab so the user can immediately observe the tracked tasks and SLAs!
    setActiveTab('tasks');
  };

  const updateLabStatus: AppContextType['updateLabStatus'] = (patientId, status, result) => {
    setPatients(prev =>
      prev.map(p => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          routing: {
            ...p.routing,
            labStatus: status,
            labResult: result || p.routing.labResult || 'Results verified: Normal reference parameters'
          }
        };
      })
    );
    // Auto-resolve associated lab task
    setTaskOverrides(prev => ({
      ...prev,
      [`task-lab-${patientId}`]: { status: 'resolved' }
    }));
  };

  const updatePharmacyStatus: AppContextType['updatePharmacyStatus'] = (patientId, status) => {
    setPatients(prev =>
      prev.map(p => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          routing: {
            ...p.routing,
            pharmacyStatus: status
          }
        };
      })
    );
    setTaskOverrides(prev => ({
      ...prev,
      [`task-pharm-${patientId}`]: { status: 'resolved' }
    }));
  };

  const updateReferralStatus: AppContextType['updateReferralStatus'] = (patientId, status, date) => {
    setPatients(prev =>
      prev.map(p => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          routing: {
            ...p.routing,
            referralStatus: status,
            referralDate: date || 'Scheduled for Next Tuesday at 11:00 AM'
          }
        };
      })
    );
    setTaskOverrides(prev => ({
      ...prev,
      [`task-ref-${patientId}`]: { status: 'resolved' }
    }));
  };

  const markWhatsAppReminderSent = (patientId: string) => {
    setPatients(prev =>
      prev.map(p => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          routing: {
            ...p.routing,
            labReminderSentWhatsApp: true
          }
        };
      })
    );
  };

  const markAiCallCompleted = (patientId: string) => {
    setPatients(prev =>
      prev.map(p => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          routing: {
            ...p.routing,
            labReminderCallStatus: 'completed'
          }
        };
      })
    );
  };

  const resolveTask = (taskId: string) => {
    setTaskOverrides(prev => ({
      ...prev,
      [taskId]: { status: 'resolved' }
    }));
  };

  const escalateTask = (taskId: string, level: EscalationLevel) => {
    setTaskOverrides(prev => ({
      ...prev,
      [taskId]: { status: 'escalated', escalationLevel: level }
    }));
  };

  const rescheduleAppointment = (patientId: string, type: 'lab' | 'referral' | 'doctor', newDate: string, newTime: string) => {
    setPatients(prev =>
      prev.map(p => {
        if (p.id !== patientId) return p;
        if (type === 'lab') {
          return {
            ...p,
            routing: { ...p.routing, labAppointmentDate: newDate, labAppointmentTime: newTime }
          };
        } else if (type === 'referral') {
          return {
            ...p,
            routing: { ...p.routing, referralDate: `${newDate} at ${newTime}`, referralStatus: 'scheduled' }
          };
        } else {
          return {
            ...p,
            routing: { ...p.routing, doctorFollowUpDate: newDate, doctorFollowUpTime: newTime }
          };
        }
      })
    );
  };

  const resetDemo = () => {
    setPatients([]);
    setActivePatientId(null);
    setSimulatedNow(new Date().toISOString());
    setTaskOverrides({});
    setActiveTab('checkin');
    try {
      localStorage.removeItem('ensurecare_patients_v5_clean');
      localStorage.removeItem('ensurecare_patients_v4');
      localStorage.removeItem('ensurecare_patients_v3');
      localStorage.removeItem('ensurecare_patients_v2');
      localStorage.removeItem('ensurecare_simulated_time');
    } catch {
      // Ignore
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        patients,
        activePatientId,
        setActivePatientId,
        simulatedNow,
        advanceTime,
        resetTime,
        outstandingTasks,
        missedStepsCount,
        criticalEscalationsCount,
        clinicalRecords,
        saveClinicalRecord,
        checkInPatient,
        doctorDecideRouting,
        updateLabStatus,
        updatePharmacyStatus,
        updateReferralStatus,
        markWhatsAppReminderSent,
        markAiCallCompleted,
        resolveTask,
        escalateTask,
        rescheduleAppointment,
        resetDemo
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
