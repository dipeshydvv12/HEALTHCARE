// ClinicalRecordsPage.tsx - Step 7: Permanent Clinical Documentation & Visit Records Archive
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClinicalEncounterDoc } from '../types';
import {
  FileText,
  Search,
  Download,
  Eye,
  Printer,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  ShieldCheck,
  Stethoscope,
  Pill,
  FlaskConical,
  Share2,
  ExternalLink,
  FolderLock,
  Sparkles,
  CheckCircle2,
  X,
  FileCode
} from 'lucide-react';

export const ClinicalRecordsPage: React.FC = () => {
  const { clinicalRecords } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'headache' | 'fever' | 'cardiac'>('all');
  const [previewDoc, setPreviewDoc] = useState<ClinicalEncounterDoc | null>(null);

  // Filtered records
  const filteredRecords = clinicalRecords.filter(r => {
    const matchesSearch =
      r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.purposeOfVisit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.patientPhone.includes(searchTerm) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'headache') {
      return r.purposeOfVisit.toLowerCase().includes('headache') || r.purposeOfVisit.toLowerCase().includes('migraine');
    }
    if (selectedFilter === 'fever') {
      return r.purposeOfVisit.toLowerCase().includes('fever') || r.purposeOfVisit.toLowerCase().includes('cough');
    }
    if (selectedFilter === 'cardiac') {
      return r.purposeOfVisit.toLowerCase().includes('chest') || r.purposeOfVisit.toLowerCase().includes('heart');
    }

    return true;
  });

  // Generate downloadable file
  const handleDownload = (doc: ClinicalEncounterDoc, format: 'md' | 'json') => {
    let content = '';
    let mimeType = '';
    let ext = '';

    if (format === 'json') {
      content = JSON.stringify(doc, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    } else {
      const visitDate = new Date(doc.visitTimestamp).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
      content = `# OFFICIAL CLINICAL ENCOUNTER SUMMARY & PERMANENT MEDICAL RECORD
================================================================================
RECORD IDENTIFIER: ${doc.id}
ENCOUNTER DATE:    ${visitDate}
ATTENDING CLINIC:  ${doc.clinicName}
CLINIC LOCATION:   ${doc.clinicAddress}
GOOGLE MAPS:       ${doc.clinicGoogleMaps}
EXAMINING DOCTOR:  ${doc.examiningDoctor}
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
  ${doc.doctorNotes}
* Working Diagnosis:
  ${doc.diagnosis}

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
* Location:             ${doc.clinicName}

================================================================================
Electronic Attestation & Signature:
Signed by: Dr. Michael Hayes, MD (License #MC-DEL-89241)
Senior Attending Physician, Internal Medicine
Archive Path: patient_records/${doc.id}.md
================================================================================
`;
      mimeType = 'text/markdown';
      ext = 'md';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.id}_${doc.patientName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-[#0B1528] border border-cyan-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                <FolderLock className="w-3.5 h-3.5 text-cyan-400" />
                Permanent Clinical Records
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Disk Storage: /patient_records/
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Patient Visit Documentation Archive
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Every time a patient visits the doctor, an official documented clinical file is generated and permanently preserved to disk. It contains patient demographics, residential location, purpose of visit, prescriptions, diagnostic lab tests, and specialist referrals.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-[#070D18] border border-slate-700/80 rounded-2xl px-4 py-3 text-right">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Archived Encounters</span>
              <span className="text-2xl font-black text-white font-mono">{clinicalRecords.length}</span>
            </div>
          </div>
        </div>

        {/* Quick Storage Notice */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 text-cyan-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Automatic Permanent File Generation: Markdown (.md) & Schema (.json)
          </span>
          <span className="text-slate-500 text-[11px]">
            Attending Physician: Dr. Michael Hayes, MD • Max Multi Speciality Centre
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-[#0D1829] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by patient, phone, or purpose of visit..."
            className="w-full bg-[#111F36] border border-slate-700 focus:border-cyan-400 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none placeholder-slate-500"
          />
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          <span className="text-xs text-slate-400 mr-1 font-semibold text-[11px]">Filter:</span>
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            All Visits ({clinicalRecords.length})
          </button>
          <button
            onClick={() => setSelectedFilter('headache')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedFilter === 'headache'
                ? 'bg-cyan-500 text-slate-950 shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            🤕 Headache / Migraine
          </button>
          <button
            onClick={() => setSelectedFilter('fever')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedFilter === 'fever'
                ? 'bg-cyan-500 text-slate-950 shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            🔥 Fever / Cold
          </button>
        </div>
      </div>

      {/* Documented Records List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-[#0D1829] border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Documented Records Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No patient visit records match your search criteria. Check in a patient and complete a doctor consultation to automatically generate and archive permanent clinical files.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRecords.map(doc => {
            const formattedDate = new Date(doc.visitTimestamp).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
            const formattedTime = new Date(doc.visitTimestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={doc.id}
                className="bg-[#0B1528] border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-6 sm:p-7 shadow-xl transition-all space-y-5 relative overflow-hidden"
              >
                {/* Top Header Card */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-500/30">
                          {doc.id}
                        </span>
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Permanent File Saved (.md & .json)
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                        {doc.patientName}
                        <span className="text-xs text-slate-400 font-normal">
                          ({doc.patientGender}, {doc.patientAge} years)
                        </span>
                      </h3>
                    </div>
                  </div>

                  {/* Date & Facility Pill */}
                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-300">
                    <span className="flex items-center gap-1 bg-[#111F36] px-3 py-1.5 rounded-xl border border-slate-700/60 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      {formattedDate} • {formattedTime}
                    </span>
                    <span className="flex items-center gap-1 bg-[#111F36] px-3 py-1.5 rounded-xl border border-slate-700/60">
                      <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                      {doc.clinicName}
                    </span>
                  </div>
                </div>

                {/* Patient Demographics & Contact Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-[#070D18] p-3.5 rounded-2xl border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Patient Phone</span>
                      <span className="font-mono text-slate-200">{doc.patientPhone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Residential Location</span>
                      <span className="text-slate-200">{doc.patientLocation}</span>
                    </div>
                  </div>
                </div>

                {/* Purpose of Visit Card - PROMINENT HIGHLIGHT */}
                <div className="bg-gradient-to-r from-cyan-950/40 via-[#0B1528] to-slate-900 border border-cyan-500/40 rounded-2xl p-4 sm:p-5 space-y-1.5 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-black tracking-wider text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      Purpose of Visit & Chief Complaint
                    </span>
                    <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-bold">
                      Documented Reason
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                    "{doc.purposeOfVisit}"
                  </p>
                </div>

                {/* Clinical Notes & Working Assessment */}
                <div className="bg-[#111F36]/60 rounded-2xl p-4 border border-slate-800 text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Doctor's Clinical Assessment & Notes ({doc.examiningDoctor})
                  </span>
                  <p className="text-slate-200 leading-relaxed font-sans">{doc.doctorNotes}</p>
                </div>

                {/* 3-Column Grid: Medication, Laboratory, Specialist Referral */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* 1. Pharmacy */}
                  <div className="bg-[#111F36] border border-orange-500/30 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-orange-400 font-bold">
                      <Pill className="w-4 h-4" />
                      <span>Prescribed Medication</span>
                    </div>
                    {doc.medication?.prescribed ? (
                      <div className="space-y-1 text-slate-300">
                        <p className="font-bold text-white text-xs">{doc.medication.name}</p>
                        <p className="text-[11px] text-orange-200/90 font-mono">Dosage: {doc.medication.dosage}</p>
                        <p className="text-[11px] text-slate-400 leading-tight">Instructions: {doc.medication.instructions}</p>
                        <div className="pt-2 border-t border-slate-700/60 mt-2 text-[10px]">
                          <span className="text-slate-500 block">Dispensed at:</span>
                          <span className="font-semibold text-white block">{doc.medication.pharmacyName}</span>
                          {doc.medication.pharmacyGoogleMaps && (
                            <a
                              href={doc.medication.pharmacyGoogleMaps}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-400 hover:text-orange-300 flex items-center gap-1 mt-1 font-bold"
                            >
                              <MapPin className="w-3 h-3 text-rose-400" />
                              <span>Open Pharmacy on Maps ↗</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">No medication prescribed.</p>
                    )}
                  </div>

                  {/* 2. Laboratory */}
                  <div className="bg-[#111F36] border border-purple-500/30 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-purple-400 font-bold">
                      <FlaskConical className="w-4 h-4" />
                      <span>Diagnostic Lab Order</span>
                    </div>
                    {doc.laboratory?.ordered ? (
                      <div className="space-y-1 text-slate-300">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-white text-xs">{doc.laboratory.testName}</p>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-purple-500/20 text-purple-300">
                            {doc.laboratory.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-purple-200/90 font-mono">
                          Scheduled: {doc.laboratory.appointmentDate} at {doc.laboratory.appointmentTime}
                        </p>
                        <div className="pt-2 border-t border-slate-700/60 mt-2 text-[10px]">
                          <span className="text-slate-500 block">Lab Facility:</span>
                          <span className="font-semibold text-white block">{doc.laboratory.facilityName}</span>
                          {doc.laboratory.facilityGoogleMaps && (
                            <a
                              href={doc.laboratory.facilityGoogleMaps}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-1 font-bold"
                            >
                              <MapPin className="w-3 h-3 text-rose-400" />
                              <span>Open Lab on Maps ↗</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">No diagnostic test ordered.</p>
                    )}
                  </div>

                  {/* 3. Specialist Referral */}
                  <div className="bg-[#111F36] border border-pink-500/30 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-pink-400 font-bold">
                      <Share2 className="w-4 h-4" />
                      <span>Specialist Referral</span>
                    </div>
                    {doc.referral?.referred ? (
                      <div className="space-y-1 text-slate-300">
                        <p className="font-bold text-white text-xs">{doc.referral.specialist}</p>
                        <p className="text-[11px] text-pink-300 font-semibold">
                          Doctor: {doc.referral.famousDoctorName}
                        </p>
                        <p className="text-[11px] text-slate-400">{doc.referral.famousHospital}</p>
                        <div className="pt-2 border-t border-slate-700/60 mt-2 text-[10px]">
                          <span className="text-slate-500 block">Indication:</span>
                          <span className="text-slate-300 italic block">{doc.referral.reason}</span>
                          {doc.referral.googleMapsUrl && (
                            <a
                              href={doc.referral.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-pink-400 hover:text-pink-300 flex items-center gap-1 mt-1 font-bold"
                            >
                              <MapPin className="w-3 h-3 text-rose-400" />
                              <span>Open Hospital on Maps ↗</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">No specialist referral required.</p>
                    )}
                  </div>
                </div>

                {/* Footer Actions & Document Export Bar */}
                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>File Path: {doc.filePath || `patient_records/${doc.id}.md`}</span>
                  </div>

                  {/* Download & View Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      title="Inspect documented markdown file contents"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>View File</span>
                    </button>

                    <button
                      onClick={() => handleDownload(doc, 'md')}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer hover:opacity-95 shadow-xs"
                      title="Download Markdown documentation file"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-950" />
                      <span>Download .md</span>
                    </button>

                    <button
                      onClick={() => handleDownload(doc, 'json')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center gap-1 transition cursor-pointer"
                      title="Download JSON structured schema"
                    >
                      <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                      <span>.json</span>
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition cursor-pointer"
                      title="Print Official Record"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* File Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0B1528] border border-cyan-500/40 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col relative overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Document File Preview: {previewDoc.id}
                </h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Code / Markdown Box */}
            <div className="flex-1 overflow-auto bg-[#070D18] border border-slate-800 rounded-2xl p-4 font-mono text-xs text-cyan-200/90 whitespace-pre leading-relaxed select-all">
              {`# OFFICIAL CLINICAL ENCOUNTER SUMMARY & PERMANENT MEDICAL RECORD
================================================================================
RECORD IDENTIFIER: ${previewDoc.id}
ENCOUNTER DATE:    ${new Date(previewDoc.visitTimestamp).toLocaleString()}
ATTENDING CLINIC:  ${previewDoc.clinicName}
CLINIC LOCATION:   ${previewDoc.clinicAddress}
EXAMINING DOCTOR:  ${previewDoc.examiningDoctor}
PERMANENT ARCHIVE: Verified & Persisted to Disk Storage (/patient_records)
================================================================================

## 1. PATIENT DEMOGRAPHICS
* Patient Name:         ${previewDoc.patientName}
* Age / Biological Sex: ${previewDoc.patientAge} Years / ${previewDoc.patientGender}
* Contact Phone:        ${previewDoc.patientPhone}
* Residential Location: ${previewDoc.patientLocation}

--------------------------------------------------------------------------------

## 2. PURPOSE OF VISIT & CHIEF COMPLAINT
> "${previewDoc.purposeOfVisit}"

--------------------------------------------------------------------------------

## 3. CLINICAL ASSESSMENT & DOCTOR NOTES
* Attending Clinical Notes:
  ${previewDoc.doctorNotes}
* Working Diagnosis:
  ${previewDoc.diagnosis}

--------------------------------------------------------------------------------

## 4. PHARMACEUTICAL PRESCRIPTION & DISPENSING
${previewDoc.medication?.prescribed ? `* Prescribed Drug:      ${previewDoc.medication.name}
* Strength / Dosage:    ${previewDoc.medication.dosage}
* Directions for Use:   ${previewDoc.medication.instructions}
* Dispensing Pharmacy:  ${previewDoc.medication.pharmacyName}
* Pharmacy Address:     ${previewDoc.medication.pharmacyAddress}
* Open on Google Maps:  ${previewDoc.medication.pharmacyGoogleMaps}` : '* No prescription medication required.'}

--------------------------------------------------------------------------------

## 5. DIAGNOSTIC LABORATORY ORDERS
${previewDoc.laboratory?.ordered ? `* Diagnostic Workup:    ${previewDoc.laboratory.testName}
* Priority Status:      ${previewDoc.laboratory.priority}
* Scheduled Appointment:${previewDoc.laboratory.appointmentDate} at ${previewDoc.laboratory.appointmentTime}
* Collection Facility:  ${previewDoc.laboratory.facilityName}
* Facility Address:     ${previewDoc.laboratory.facilityAddress}
* Open on Google Maps:  ${previewDoc.laboratory.facilityGoogleMaps}` : '* No laboratory test ordered.'}

--------------------------------------------------------------------------------

## 6. SPECIALIST CONSULTATION & REFERRAL
${previewDoc.referral?.referred ? `* Specialized Field:    ${previewDoc.referral.specialist}
* Renowned Specialist:  ${previewDoc.referral.famousDoctorName}
* Hospital / Institute: ${previewDoc.referral.famousHospital}
* Institute Map Link:   ${previewDoc.referral.googleMapsUrl}
* Clinical Indication:  ${previewDoc.referral.reason}` : '* No specialist referral indicated.'}

--------------------------------------------------------------------------------

## 7. FOLLOW-UP CARE & COORDINATION
* Scheduled Follow-Up:  ${previewDoc.followUp?.scheduledDate || 'In 7 Days'} at ${previewDoc.followUp?.scheduledTime || '11:00 AM'}
* Location:             ${previewDoc.clinicName}

================================================================================
Electronic Attestation & Signature:
Signed by: Dr. Michael Hayes, MD (License #MC-DEL-89241)
Archive Path: patient_records/${previewDoc.id}.md
================================================================================`}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400 font-mono">
                Persisted File on Disk: {previewDoc.filePath || `patient_records/${previewDoc.id}.md`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(previewDoc, 'md')}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md File</span>
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
