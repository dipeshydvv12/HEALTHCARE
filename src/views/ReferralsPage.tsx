// ReferralsPage.tsx - Step 3C: Specialist Referral Network with Famous Doctors and Real Locations on Google Maps
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Share2, CheckCircle2, Clock, Calendar, MapPin, Award, ExternalLink } from 'lucide-react';

export const ReferralsPage: React.FC = () => {
  const { patients, updateReferralStatus } = useApp();

  const [bookingForId, setBookingForId] = useState<string | null>(null);
  const [appointmentDate, setAppointmentDate] = useState('2026-11-04 at 10:00 AM');

  // Patients who were given a referral
  const referralOrders = patients.filter(p => p.routing.sendToReferral);

  const handleConfirm = (patientId: string) => {
    updateReferralStatus(patientId, 'scheduled', appointmentDate);
    setBookingForId(null);
  };

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-[#0D1829] border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/15 border border-pink-500/30 text-pink-400 flex items-center justify-center font-bold">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Specialist Referral Network</h2>
            <p className="text-xs text-slate-400">
              Referrals routed by clinic doctors to world-renowned specialist physicians and top hospitals
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20">
          {referralOrders.filter(o => o.routing.referralStatus !== 'scheduled').length} Pending Scheduling
        </span>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {referralOrders.length === 0 ? (
          <div className="text-center py-12 bg-[#0D1829] border border-slate-800 rounded-3xl text-slate-400">
            <Share2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No specialist referrals in queue right now</p>
            <p className="text-xs text-slate-500 mt-1">Check in a patient and choose "Give a Specialist Referral" in the Doctor Desk</p>
          </div>
        ) : (
          referralOrders.map(p => {
            const isScheduled = p.routing.referralStatus === 'scheduled';
            const googleMapsUrl = p.routing.famousHospitalGoogleMaps || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.routing.famousHospital || p.routing.specialist || 'Hospital')}`;

            return (
              <div
                key={p.id}
                className={`p-6 rounded-3xl border transition-all space-y-4 ${
                  isScheduled
                    ? 'bg-[#0A1220] border-slate-800 opacity-90'
                    : 'bg-[#0D1829] border-pink-500/40 shadow-lg shadow-pink-950/20'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                        {p.routing.specialist}
                      </span>
                      <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-pink-400" />
                        <span>{p.routing.famousDoctorName || 'Renowned Specialist'}</span>
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                      <span>Patient: <strong className="text-slate-200">{p.name}</strong> ({p.gender}, {p.age}yo)</span>
                      <span>•</span>
                      <span>Phone: <strong className="text-cyan-300 font-mono">{p.phone}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        {p.location}
                      </span>
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isScheduled ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Appointment Confirmed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold animate-pulse">
                        <Clock className="w-3.5 h-3.5" /> Pending Patient Booking
                      </span>
                    )}
                  </div>
                </div>

                {/* Famous Hospital Location Banner with Google Maps */}
                <div className="p-3 bg-[#111F36] rounded-2xl border border-pink-500/30 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded">
                      Specialist Hospital
                    </span>
                    <span className="font-semibold text-white">{p.routing.famousHospital || 'World-Class Medical Centre'}</span>
                  </div>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-300 hover:text-white flex items-center gap-1 font-bold text-xs"
                  >
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>Open Hospital on Google Maps ↗</span>
                  </a>
                </div>

                {/* Clinical Indication */}
                <div className="text-xs bg-[#111F36] p-3 rounded-2xl border border-slate-800 text-slate-300">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Reason for Referral:</span>
                  {p.routing.referralReason}
                </div>

                {/* If scheduled, show date */}
                {isScheduled && p.routing.referralDate && (
                  <div className="text-xs bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-2xl text-emerald-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Specialist Consultation Booked with {p.routing.famousDoctorName}: <strong>{p.routing.referralDate}</strong></span>
                  </div>
                )}

                {/* Actions */}
                {!isScheduled && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                    {bookingForId === p.id ? (
                      <div className="flex items-center gap-2 w-full flex-wrap sm:flex-nowrap">
                        <input
                          type="text"
                          value={appointmentDate}
                          onChange={e => setAppointmentDate(e.target.value)}
                          placeholder="e.g. Nov 4 at 10:00 AM"
                          className="flex-1 bg-[#111F36] border border-slate-700 text-white text-xs rounded-xl px-3 py-2"
                        />
                        <button
                          onClick={() => handleConfirm(p.id)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Confirm Date
                        </button>
                        <button
                          onClick={() => setBookingForId(null)}
                          className="px-3 py-2 text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setBookingForId(p.id);
                          setAppointmentDate('2026-11-04 at 10:00 AM');
                        }}
                        className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <Calendar className="w-4 h-4" />
                        Accept Referral & Book Appointment
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
