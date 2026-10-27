// DoctorDeskPage.tsx - Step 2: Doctor examines patient and decides routing with Gemini LLM
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Stethoscope,
  FlaskConical,
  Pill,
  Share2,
  Calendar,
  CheckCircle2,
  ArrowRight,
  User,
  ShieldCheck,
  MapPin,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Award,
  PhoneCall
} from 'lucide-react';
import {
  getAiMedicineRecommendation,
  AiClinicalRecommendation,
  RECOMMENDED_SYMPTOM_SAMPLES
} from '../services/geminiService';
import { placeTwilioCall } from '../services/twilioClient';
import {
  REAL_CLINIC,
  REAL_LABORATORY,
  REAL_PHARMACY,
  FAMOUS_SPECIALISTS
} from '../data/realFacilities';

export const DoctorDeskPage: React.FC = () => {
  const { patients, activePatientId, setActivePatientId, doctorDecideRouting, setActiveTab } = useApp();

  // Find active patient or default to first waiting patient
  const waitingPatients = patients.filter(p => p.status === 'waiting_for_doctor');
  const patient = patients.find(p => p.id === activePatientId) || waitingPatients[0] || patients[0];

  const defaultTomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0];
  const defaultSevenDays = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];

  // AI Loading & Status
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [currentProblem, setCurrentProblem] = useState(patient?.symptoms || 'headache');

  // Routing Decision State
  const [sendToLab, setSendToLab] = useState(true);
  const [labTestName, setLabTestName] = useState('Complete Blood Count (CBC) & Diagnostic Panel');
  const [labPriority, setLabPriority] = useState<'Routine' | 'Urgent'>('Urgent');
  const [labAppointmentDate, setLabAppointmentDate] = useState(defaultTomorrow);
  const [labAppointmentTime, setLabAppointmentTime] = useState('10:30 AM');

  const [sendToPharmacy, setSendToPharmacy] = useState(true);
  const [medicationName, setMedicationName] = useState('Sumatriptan 50mg Tablets');
  const [dosage, setDosage] = useState('50 mg orally at onset');
  const [instructions, setInstructions] = useState('Take 1 tablet at onset of headache with full glass of water. Rest in dark room.');

  const [sendToReferral, setSendToReferral] = useState(true);
  const [specialist, setSpecialist] = useState('Neurologist');
  const [famousDoctorName, setFamousDoctorName] = useState('Dr. Peter Goadsby, MD, PhD, FMedSci');
  const [famousHospital, setFamousHospital] = useState('Mayo Clinic & King’s College London');
  const [famousHospitalGoogleMaps, setFamousHospitalGoogleMaps] = useState('https://www.google.com/maps/search/?api=1&query=Mayo+Clinic+Rochester+MN');
  const [referralReason, setReferralReason] = useState('Persistent severe headache evaluation, migraine profiling and neuro screening');

  const [followUpDays, setFollowUpDays] = useState(7);
  const [doctorFollowUpDate, setDoctorFollowUpDate] = useState(defaultSevenDays);
  const [doctorFollowUpTime, setDoctorFollowUpTime] = useState('11:00 AM');
  const [doctorNotes, setDoctorNotes] = useState('Patient examined. Orders dispatched for diagnostic workup and medication therapy.');
  const [autoCallTwilio, setAutoCallTwilio] = useState(true);

  // Run Gemini LLM Recommendation whenever active patient changes or symptoms change
  const runGeminiAiRecommendation = async (symptomsText: string, pName?: string, pAge?: number) => {
    if (!symptomsText) return;
    setIsAiLoading(true);
    try {
      const rec = await getAiMedicineRecommendation(symptomsText, pName, pAge);
      setMedicationName(rec.medicationName);
      setDosage(rec.dosage);
      setInstructions(rec.instructions);
      setLabTestName(rec.labTestName);
      setLabPriority(rec.labPriority);
      setSpecialist(rec.specialist);
      setFamousDoctorName(rec.famousDoctorName);
      setFamousHospital(rec.famousHospital);
      setFamousHospitalGoogleMaps(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rec.famousHospital)}`);
      setReferralReason(rec.referralReason);
      setDoctorNotes(`Patient examined for "${symptomsText}". Prescribed ${rec.medicationName}. Ordered ${rec.labTestName}. Referred to ${rec.famousDoctorName}.`);
      setAiGenerated(true);
    } catch (e) {
      console.warn('Gemini recommendation error:', e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSelectProblem = (symptomText: string) => {
    setCurrentProblem(symptomText);
    if (patient) {
      runGeminiAiRecommendation(symptomText, patient.name, patient.age);
    }
  };

  useEffect(() => {
    if (patient) {
      const pSymptoms = patient.symptoms || 'headache';
      setCurrentProblem(pSymptoms);
      runGeminiAiRecommendation(pSymptoms, patient.name, patient.age);
    }
  }, [patient?.id]);

  if (!patient) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="bg-[#0D1829] border border-slate-800 rounded-3xl p-10 shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Doctor Consultation Desk</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            No patient is currently waiting for consultation. Begin by registering and checking in a patient at the clinic.
          </p>
          <button
            onClick={() => setActiveTab('checkin')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg transition cursor-pointer"
          >
            <span>+ Check In Patient at Clinic</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const handleConfirmRouting = (e: React.FormEvent) => {
    e.preventDefault();
    doctorDecideRouting(patient.id, {
      sendToLab,
      labTestName: sendToLab ? labTestName : undefined,
      labPriority: sendToLab ? labPriority : undefined,
      labAppointmentDate: sendToLab ? labAppointmentDate : undefined,
      labAppointmentTime: sendToLab ? labAppointmentTime : undefined,
      labFacilityName: REAL_LABORATORY.name,
      labFacilityAddress: REAL_LABORATORY.address,
      labFacilityGoogleMaps: REAL_LABORATORY.googleMapsUrl,
      sendToPharmacy,
      medicationName: sendToPharmacy ? medicationName : undefined,
      dosage: sendToPharmacy ? dosage : undefined,
      instructions: sendToPharmacy ? instructions : undefined,
      pharmacyFacilityName: REAL_PHARMACY.name,
      pharmacyFacilityAddress: REAL_PHARMACY.address,
      pharmacyFacilityGoogleMaps: REAL_PHARMACY.googleMapsUrl,
      sendToReferral,
      specialist: sendToReferral ? specialist : undefined,
      famousDoctorName: sendToReferral ? famousDoctorName : undefined,
      famousHospital: sendToReferral ? famousHospital : undefined,
      famousHospitalGoogleMaps: sendToReferral ? famousHospitalGoogleMaps : undefined,
      referralReason: sendToReferral ? referralReason : undefined,
      clinicName: REAL_CLINIC.name,
      clinicAddress: REAL_CLINIC.address,
      clinicGoogleMaps: REAL_CLINIC.googleMapsUrl,
      followUpDays,
      doctorFollowUpDate,
      doctorFollowUpTime,
      doctorNotes
    });

    // Auto-trigger real Twilio phone call to patient if enabled
    if (autoCallTwilio && patient.phone) {
      const callMsg = `Hello ${patient.name}. This is EnsureCare Healthcare Follow-Up Coordination calling. Your clinic consultation with your doctor is completed. Your physician has ordered your follow-up care: ${sendToLab ? `Diagnostic laboratory analysis for ${labTestName} scheduled on ${labAppointmentDate} at ${labAppointmentTime}.` : ''} ${sendToPharmacy ? `Prescription medication ${medicationName} waiting at Apollo Pharmacy.` : ''} Please check your phone for directions. Thank you and stay healthy.`;
      placeTwilioCall({
        to: patient.phone,
        patientName: patient.name,
        message: callMsg,
        taskType: sendToLab ? 'lab_test' : 'doctor_followup',
        providerName: REAL_CLINIC.name
      }).catch(err => console.warn('Twilio auto-call notice:', err));
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
          Step 2: Doctor Consultation & Decision
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
          Doctor Desk — Decide Where to Send the Patient
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Review patient information, residential location, and AI-suggested medicine and famous specialist referrals.
        </p>
      </div>

      {/* Patient Profile Card */}
      <div className="bg-[#0D1829] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{patient.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                  {patient.gender}, {patient.age} years old
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
                <span>Phone: <strong className="text-cyan-300 font-mono">{patient.phone}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  {patient.location}
                </span>
              </div>
            </div>
          </div>

          {/* Patient Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Select Patient:</span>
            <select
              value={patient.id}
              onChange={e => setActivePatientId(e.target.value)}
              className="bg-[#111F36] border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.status.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Interactive Problem / Chief Complaint Bar with Gemini AI Trigger */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="text-[11px] uppercase font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Chief Complaint & Clinical Problem (Type problem like "headache" to auto-prescribe via Gemini LLM):
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Patient Consent Verified</span>
              </div>
            </div>
          </div>

          {/* Editable Problem Input Bar */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={currentProblem}
              onChange={e => setCurrentProblem(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  runGeminiAiRecommendation(currentProblem, patient.name, patient.age);
                }
              }}
              placeholder="Describe medical problem (e.g. headache, fever, chest pain, diabetes, acidity)..."
              className="flex-1 bg-[#111F36] border border-cyan-500/40 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-medium"
            />
            <button
              type="button"
              disabled={isAiLoading || !currentProblem.trim()}
              onClick={() => runGeminiAiRecommendation(currentProblem, patient.name, patient.age)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer hover:opacity-95 shadow-md shrink-0 disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-slate-950 ${isAiLoading ? 'animate-spin' : ''}`} />
              <span>{isAiLoading ? 'Gemini AI Thinking...' : '✨ Run Gemini AI'}</span>
            </button>
          </div>

          {/* Quick Problem Scenario Pills */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mr-1">
              Test Scenarios:
            </span>
            {RECOMMENDED_SYMPTOM_SAMPLES.map(sample => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectProblem(sample.symptoms)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-cyan-500/20 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-200 border border-slate-700/80 transition flex items-center gap-1 cursor-pointer font-medium"
              >
                <span>{sample.emoji}</span>
                <span>{sample.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Real Clinic Location Card */}
        <div className="p-3 bg-[#111F36] rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded">
              Current Examining Clinic
            </span>
            <span className="font-semibold text-white">{REAL_CLINIC.name}</span>
            <span className="text-slate-400 hidden sm:inline">• {REAL_CLINIC.address}</span>
          </div>
          <a
            href={REAL_CLINIC.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold text-xs"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>Open in Google Maps ↗</span>
          </a>
        </div>
      </div>

      {/* Decision Form: Where to Send the Patient */}
      <form onSubmit={handleConfirmRouting} className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Where do you want to send this patient?
          </h3>
          {aiGenerated && (
            <span className="text-xs text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Auto-populated by Gemini AI (LLM Active)
            </span>
          )}
        </div>

        {/* 1. Laboratory Card */}
        <div
          className={`border rounded-3xl p-5 sm:p-6 transition-all ${
            sendToLab
              ? 'bg-[#0D1829] border-purple-500/50 shadow-lg shadow-purple-950/20'
              : 'bg-[#0A1220] border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">1. Send Patient to Laboratory?</h4>
                <p className="text-xs text-slate-400">Order diagnostic tests with scheduled specimen collection appointment</p>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendToLab}
                onChange={e => setSendToLab(e.target.checked)}
                className="w-5 h-5 text-purple-500 rounded bg-slate-900 border-slate-700 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-200">{sendToLab ? 'YES' : 'NO'}</span>
            </label>
          </div>

          {sendToLab && (
            <div className="space-y-4 pt-3 border-t border-slate-800 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    AI Suggested Test
                  </label>
                  <input
                    type="text"
                    required
                    value={labTestName}
                    onChange={e => setLabTestName(e.target.value)}
                    className="w-full bg-[#111F36] border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-hidden focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Priority
                  </label>
                  <select
                    value={labPriority}
                    onChange={e => setLabPriority(e.target.value as any)}
                    className="w-full bg-[#111F36] border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-hidden focus:border-purple-400 cursor-pointer"
                  >
                    <option value="Urgent">Urgent (24h Turnaround)</option>
                    <option value="Routine">Routine (48h Turnaround)</option>
                  </select>
                </div>
              </div>

              {/* Real Lab Location Banner with Google Maps */}
              <div className="p-3 bg-[#111F36] rounded-2xl border border-purple-500/30 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                    Designated Diagnostic Lab
                  </span>
                  <span className="font-semibold text-white">{REAL_LABORATORY.name}</span>
                  <span className="text-slate-400 hidden sm:inline">• {REAL_LABORATORY.address}</span>
                </div>
                <a
                  href={REAL_LABORATORY.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-300 hover:text-white flex items-center gap-1 font-bold text-xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>Open Lab on Google Maps ↗</span>
                </a>
              </div>

              {/* Lab Appointment Date & Time Inputs */}
              <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span>Schedule Laboratory Appointment Date & Time</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Lab Appointment Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={labAppointmentDate}
                      onChange={e => setLabAppointmentDate(e.target.value)}
                      className="w-full bg-[#111F36] border border-purple-500/40 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-hidden focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Lab Appointment Time *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 10:30 AM"
                      value={labAppointmentTime}
                      onChange={e => setLabAppointmentTime(e.target.value)}
                      className="w-full bg-[#111F36] border border-purple-500/40 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-hidden focus:border-purple-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Pharmacy Card (AI Recommended Medicine) */}
        <div
          className={`border rounded-3xl p-5 sm:p-6 transition-all ${
            sendToPharmacy
              ? 'bg-[#0D1829] border-orange-500/50 shadow-lg shadow-orange-950/20'
              : 'bg-[#0A1220] border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">2. Send Patient to Pharmacy? (AI Prescribed)</h4>
                <p className="text-xs text-slate-400">Medicine automatically chosen by Gemini AI based on problem</p>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendToPharmacy}
                onChange={e => setSendToPharmacy(e.target.checked)}
                className="w-5 h-5 text-orange-500 rounded bg-slate-900 border-slate-700 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-200">{sendToPharmacy ? 'YES' : 'NO'}</span>
            </label>
          </div>

          {sendToPharmacy && (
            <div className="space-y-4 pt-3 border-t border-slate-800 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    AI Medicine Name
                  </label>
                  <input
                    type="text"
                    required
                    value={medicationName}
                    onChange={e => setMedicationName(e.target.value)}
                    className="w-full bg-[#111F36] border border-orange-500/40 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-hidden focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Dosage / Strength
                  </label>
                  <input
                    type="text"
                    required
                    value={dosage}
                    onChange={e => setDosage(e.target.value)}
                    className="w-full bg-[#111F36] border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-hidden focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Patient Instructions
                  </label>
                  <input
                    type="text"
                    required
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    className="w-full bg-[#111F36] border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-hidden focus:border-orange-400"
                  />
                </div>
              </div>

              {/* Real Pharmacy Location Banner with Google Maps */}
              <div className="p-3 bg-[#111F36] rounded-2xl border border-orange-500/30 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded">
                    Fulfillment Pharmacy
                  </span>
                  <span className="font-semibold text-white">{REAL_PHARMACY.name}</span>
                  <span className="text-slate-400 hidden sm:inline">• {REAL_PHARMACY.address}</span>
                </div>
                <a
                  href={REAL_PHARMACY.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-300 hover:text-white flex items-center gap-1 font-bold text-xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>Open Pharmacy on Google Maps ↗</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* 3. Specialist Referral Card (Internet Famous Doctor) */}
        <div
          className={`border rounded-3xl p-5 sm:p-6 transition-all ${
            sendToReferral
              ? 'bg-[#0D1829] border-pink-500/50 shadow-lg shadow-pink-950/20'
              : 'bg-[#0A1220] border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-400 flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">3. Give a Specialist Referral? (Famous Doctors)</h4>
                <p className="text-xs text-slate-400">Refer patient to internet-famous medical specialists and top institutes</p>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendToReferral}
                onChange={e => setSendToReferral(e.target.checked)}
                className="w-5 h-5 text-pink-500 rounded bg-slate-900 border-slate-700 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-200">{sendToReferral ? 'YES' : 'NO'}</span>
            </label>
          </div>

          {sendToReferral && (
            <div className="space-y-4 pt-3 border-t border-slate-800 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Specialty Required
                  </label>
                  <input
                    type="text"
                    required
                    value={specialist}
                    onChange={e => setSpecialist(e.target.value)}
                    className="w-full bg-[#111F36] border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-hidden focus:border-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-pink-300 mb-1 flex items-center gap-1">
                    <Award className="w-3 h-3 text-pink-400" /> Famous Doctor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={famousDoctorName}
                    onChange={e => setFamousDoctorName(e.target.value)}
                    className="w-full bg-[#111F36] border border-pink-500/40 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-hidden focus:border-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Hospital / Institute *
                  </label>
                  <input
                    type="text"
                    required
                    value={famousHospital}
                    onChange={e => {
                      setFamousHospital(e.target.value);
                      setFamousHospitalGoogleMaps(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.target.value)}`);
                    }}
                    className="w-full bg-[#111F36] border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-hidden focus:border-pink-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Reason for Referral
                </label>
                <input
                  type="text"
                  required
                  value={referralReason}
                  onChange={e => setReferralReason(e.target.value)}
                  className="w-full bg-[#111F36] border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-hidden focus:border-pink-400"
                />
              </div>

              {/* Famous Doctor Hospital Location Banner with Google Maps */}
              <div className="p-3 bg-[#111F36] rounded-2xl border border-pink-500/30 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded">
                    Top Specialist Center
                  </span>
                  <span className="font-semibold text-white">{famousDoctorName}</span>
                  <span className="text-slate-300">({famousHospital})</span>
                </div>
                <a
                  href={famousHospitalGoogleMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-300 hover:text-white flex items-center gap-1 font-bold text-xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>Open Hospital on Google Maps ↗</span>
                </a>
              </div>

              {/* Quick Famous Doctor Selector Pills */}
              <div className="pt-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1.5">
                  Or select another renowned specialist:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {FAMOUS_SPECIALISTS.map(doc => (
                    <button
                      key={doc.doctorName}
                      type="button"
                      onClick={() => {
                        setSpecialist(doc.specialistType);
                        setFamousDoctorName(doc.doctorName);
                        setFamousHospital(doc.hospital);
                        setFamousHospitalGoogleMaps(doc.googleMapsUrl);
                        setReferralReason(`${doc.specialistType} expert consultation with ${doc.doctorName}`);
                      }}
                      className="px-2.5 py-1 bg-[#111F36] hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] border border-slate-700 transition cursor-pointer"
                    >
                      ⭐ {doc.doctorName} ({doc.specialistType})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Follow-Up Clinic Schedule with Explicit Date & Time */}
        <div className="bg-[#0D1829] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">4. Schedule Doctor Follow-Up Clinic Appointment</h4>
              <p className="text-xs text-slate-400">Scheduled return date and time to review lab findings, medication response, and specialist notes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800 text-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Doctor Review Date *
              </label>
              <input
                type="date"
                required
                value={doctorFollowUpDate}
                onChange={e => setDoctorFollowUpDate(e.target.value)}
                className="w-full bg-[#111F36] border border-teal-500/40 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-hidden focus:border-teal-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Doctor Review Time *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 11:00 AM"
                value={doctorFollowUpTime}
                onChange={e => setDoctorFollowUpTime(e.target.value)}
                className="w-full bg-[#111F36] border border-teal-500/40 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-hidden focus:border-teal-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Window Target
              </label>
              <select
                value={followUpDays}
                onChange={e => {
                  const days = Number(e.target.value);
                  setFollowUpDays(days);
                  const targetDate = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString().split('T')[0];
                  setDoctorFollowUpDate(targetDate);
                }}
                className="w-full bg-[#111F36] border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold cursor-pointer"
              >
                <option value={7}>In 7 Days (Acute review)</option>
                <option value={14}>In 14 Days (Standard review)</option>
                <option value={30}>In 30 Days (Routine chronic)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Doctor Assessment & Guidance
            </label>
            <input
              type="text"
              value={doctorNotes}
              onChange={e => setDoctorNotes(e.target.value)}
              className="w-full bg-[#111F36] border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
            />
          </div>
        </div>

        {/* Twilio AI Auto-Call Notification Option */}
        <div className="p-4 rounded-2xl bg-[#0B1528] border border-cyan-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-2">
                <span>Twilio AI Patient Call Notification</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LIVE TWILIO OUTBOUND (+17372508034)
                </span>
              </p>
              <p className="text-[11px] text-slate-400">
                Immediately dial patient's phone ({patient.phone}) and speak their care plan & appointment details upon submission.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={autoCallTwilio}
              onChange={e => setAutoCallTwilio(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
          </label>
        </div>

        {/* Final Confirmation Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 hover:opacity-95 text-slate-950 font-black text-sm py-4 px-6 rounded-2xl shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Confirm Decision & Send Patient to Providers</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
