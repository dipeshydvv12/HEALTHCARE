// PatientTrackerPage.tsx - Step 4: Comprehensive Follow-Up Journey Tracker
import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Activity,
  FlaskConical,
  Pill,
  Share2,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
  ShieldCheck,
  ChevronRight,
  MapPin,
  Award,
  ExternalLink
} from 'lucide-react';

export const PatientTrackerPage: React.FC = () => {
  const { patients, setActivePatientId, setActiveTab } = useApp();

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-[#0D1829] border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              CENTRAL COORDINATION TRACKER
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Patient Follow-Up Journeys
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tracks where each patient was sent (Lab, Pharmacy, Referral) and verifies whether every step was fulfilled.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('checkin')}
          className="bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-full shadow-lg transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>+ Check In New Patient</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Journeys List */}
      <div className="space-y-4">
        {patients.length === 0 ? (
          <div className="text-center py-16 bg-[#0D1829] border border-slate-800 rounded-3xl text-slate-400 space-y-3">
            <User className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Patient Journeys Registered Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start by checking in a patient at the clinic. The complete journey across clinic, laboratory, pharmacy, and specialist referrals will be tracked here.
            </p>
            <button
              onClick={() => setActiveTab('checkin')}
              className="bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-full shadow-lg transition inline-flex items-center gap-1.5 cursor-pointer mt-2"
            >
              <span>+ Check In First Patient</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          patients.map(p => {
          const hasRouting = p.status === 'sent_to_providers' || p.status === 'completed';

          return (
            <div
              key={p.id}
              className="bg-[#0D1829] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5"
            >
              {/* Patient Top Row */}
              <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{p.name}</h3>
                      <span className="text-xs text-slate-400">
                        ({p.gender}, {p.age}yo)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                      <span className="font-mono text-cyan-300">{p.phone}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        {p.location}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      p.status === 'waiting_for_doctor'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {p.status.replace(/_/g, ' ')}
                  </span>

                  {p.status === 'waiting_for_doctor' && (
                    <button
                      onClick={() => {
                        setActivePatientId(p.id);
                        setActiveTab('doctor');
                      }}
                      className="px-3 py-1 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-cyan-400 cursor-pointer"
                    >
                      Consult with Doctor →
                    </button>
                  )}
                </div>
              </div>

              {/* Symptoms */}
              <div className="text-xs text-slate-300 bg-[#111F36] p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Reported Symptoms:</span>
                "{p.symptoms}"
              </div>

              {/* 4-Step Journey Progression Cards */}
              {hasRouting && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                    Follow-Up Progression across Providers:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    {/* Step 1: Clinic Visit */}
                    <div className="bg-[#111F36] border border-emerald-500/30 p-3.5 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-emerald-400">
                        <span>1. Clinic Visit</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="text-white font-semibold">Doctor Examined</div>
                      <div className="text-[11px] text-slate-400">Orders Dispatched</div>
                    </div>

                    {/* Step 2: Laboratory */}
                    <div
                      onClick={() => p.routing.sendToLab && setActiveTab('lab')}
                      className={`p-3.5 rounded-2xl border space-y-1 transition ${
                        !p.routing.sendToLab
                          ? 'bg-[#0B1320] border-slate-800/80 opacity-50'
                          : p.routing.labStatus === 'completed'
                          ? 'bg-[#111F36] border-emerald-500/30'
                          : 'bg-[#111F36] border-purple-500/50 shadow-md cursor-pointer hover:border-purple-400'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-purple-400">
                        <span>2. Laboratory</span>
                        {p.routing.sendToLab ? (
                          p.routing.labStatus === 'completed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          )
                        ) : null}
                      </div>

                      <div className="text-white font-semibold truncate">
                        {p.routing.sendToLab ? p.routing.labTestName : 'Not Ordered'}
                      </div>

                      {p.routing.sendToLab && (
                        <div className="text-[10px] text-purple-300 font-mono bg-purple-950/40 px-2 py-0.5 rounded">
                          📅 {p.routing.labAppointmentDate || '2026-10-28'} @ {p.routing.labAppointmentTime || '10:30 AM'}
                        </div>
                      )}

                      <div className="text-[11px] text-slate-400">
                        {p.routing.sendToLab
                          ? p.routing.labStatus === 'completed'
                            ? 'Results Released'
                            : 'Pending Analysis (Click to view)'
                          : 'No lab required'}
                      </div>
                    </div>

                    {/* Step 3: Pharmacy */}
                    <div
                      onClick={() => p.routing.sendToPharmacy && setActiveTab('pharmacy')}
                      className={`p-3.5 rounded-2xl border space-y-1 transition ${
                        !p.routing.sendToPharmacy
                          ? 'bg-[#0B1320] border-slate-800/80 opacity-50'
                          : p.routing.pharmacyStatus === 'dispensed'
                          ? 'bg-[#111F36] border-emerald-500/30'
                          : 'bg-[#111F36] border-orange-500/50 shadow-md cursor-pointer hover:border-orange-400'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-orange-400">
                        <span>3. Pharmacy</span>
                        {p.routing.sendToPharmacy ? (
                          p.routing.pharmacyStatus === 'dispensed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          )
                        ) : null}
                      </div>

                      <div className="text-white font-semibold truncate">
                        {p.routing.sendToPharmacy ? p.routing.medicationName : 'Not Prescribed'}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        {p.routing.sendToPharmacy
                          ? p.routing.pharmacyStatus === 'dispensed'
                            ? 'Dispensed to Patient'
                            : 'Ready for Pickup (Click to view)'
                          : 'No prescription'}
                      </div>
                    </div>

                    {/* Step 4: Specialist Referral */}
                    <div
                      onClick={() => p.routing.sendToReferral && setActiveTab('referrals')}
                      className={`p-3.5 rounded-2xl border space-y-1 transition ${
                        !p.routing.sendToReferral
                          ? 'bg-[#0B1320] border-slate-800/80 opacity-50'
                          : p.routing.referralStatus === 'scheduled'
                          ? 'bg-[#111F36] border-emerald-500/30'
                          : 'bg-[#111F36] border-pink-500/50 shadow-md cursor-pointer hover:border-pink-400'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-pink-400">
                        <span>4. Referral</span>
                        {p.routing.sendToReferral ? (
                          p.routing.referralStatus === 'scheduled' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          )
                        ) : null}
                      </div>

                      <div className="text-white font-semibold truncate flex items-center gap-1">
                        {p.routing.sendToReferral ? (
                          <>
                            <Award className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                            <span className="truncate">{p.routing.famousDoctorName || p.routing.specialist}</span>
                          </>
                        ) : 'No Referral'}
                      </div>

                      {p.routing.sendToReferral && p.routing.famousHospital && (
                        <div className="text-[10px] text-pink-300 truncate">
                          🏥 {p.routing.famousHospital}
                        </div>
                      )}

                      <div className="text-[11px] text-slate-400">
                        {p.routing.sendToReferral
                          ? p.routing.referralStatus === 'scheduled'
                            ? 'Consult Booked'
                            : 'Pending Booking (Click to view)'
                          : 'Direct care only'}
                      </div>
                    </div>
                  </div>

                  {/* Return Date reminder */}
                  {(p.routing.doctorFollowUpDate || p.routing.followUpDays) && (
                    <div className="mt-3 text-xs text-teal-300 flex items-center justify-between flex-wrap gap-2 bg-[#111F36] p-3 rounded-2xl border border-teal-500/20 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-teal-400 shrink-0" />
                        <span>
                          Scheduled Doctor Clinic Follow-Up: <strong>{p.routing.doctorFollowUpDate || `In ${p.routing.followUpDays} days`}</strong> at <strong>{p.routing.doctorFollowUpTime || '11:00 AM'}</strong>
                        </span>
                      </div>
                      <span className="text-[10px] text-teal-400/80 bg-teal-500/10 px-2 py-0.5 rounded font-mono">
                        Follow-Up Consultation
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }))}
      </div>
    </div>
  );
};

