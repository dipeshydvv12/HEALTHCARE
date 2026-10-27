// PharmacyPage.tsx - Step 3B: Pharmacy Department fulfills e-prescriptions with Real Location on Google Maps
import React from 'react';
import { useApp } from '../context/AppContext';
import { Pill, CheckCircle2, Clock, PackageCheck, MapPin, ExternalLink } from 'lucide-react';
import { REAL_PHARMACY } from '../data/realFacilities';

export const PharmacyPage: React.FC = () => {
  const { patients, updatePharmacyStatus } = useApp();

  // Patients who were sent to the pharmacy
  const pharmacyOrders = patients.filter(p => p.routing.sendToPharmacy);

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-[#0D1829] border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center font-bold">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Community Pharmacy Fulfillment Queue</h2>
            <p className="text-xs text-slate-400">
              E-prescriptions routed by clinic doctors for verification and patient dispensing
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
          {pharmacyOrders.filter(o => o.routing.pharmacyStatus !== 'dispensed').length} Pending Fulfillment
        </span>
      </div>

      {/* Real Pharmacy Location Banner */}
      <div className="p-4 bg-[#0D1829] border border-orange-500/30 rounded-3xl shadow-lg flex items-center justify-between flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
            <MapPin className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{REAL_PHARMACY.name}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                24/7 Dispensing Active
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">{REAL_PHARMACY.address} • Phone: {REAL_PHARMACY.phone}</p>
          </div>
        </div>

        <a
          href={REAL_PHARMACY.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
        >
          <MapPin className="w-3.5 h-3.5 text-rose-400" />
          <span>Open Pharmacy on Google Maps ↗</span>
        </a>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {pharmacyOrders.length === 0 ? (
          <div className="text-center py-12 bg-[#0D1829] border border-slate-800 rounded-3xl text-slate-400">
            <Pill className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No prescriptions in queue right now</p>
            <p className="text-xs text-slate-500 mt-1">Check in a patient and choose "Send to Pharmacy" in the Doctor Desk</p>
          </div>
        ) : (
          pharmacyOrders.map(p => {
            const isDispensed = p.routing.pharmacyStatus === 'dispensed';

            return (
              <div
                key={p.id}
                className={`p-6 rounded-3xl border transition-all space-y-3 ${
                  isDispensed
                    ? 'bg-[#0A1220] border-slate-800 opacity-90'
                    : 'bg-[#0D1829] border-orange-500/40 shadow-lg shadow-orange-950/20'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                        Rx Order
                      </span>
                      <h3 className="text-base font-bold text-white">{p.routing.medicationName}</h3>
                      <span className="text-xs font-mono text-orange-300">({p.routing.dosage})</span>
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
                    {isDispensed ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Dispensed to Patient
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold animate-pulse">
                        <Clock className="w-3.5 h-3.5" /> Ready for Dispense
                      </span>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-xs bg-[#111F36] p-3 rounded-2xl border border-slate-800 text-slate-300">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Patient Directions / Sig:</span>
                  {p.routing.instructions}
                </div>

                {/* Actions */}
                {!isDispensed && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-end">
                    <button
                      onClick={() => updatePharmacyStatus(p.id, 'dispensed')}
                      className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <PackageCheck className="w-4 h-4" />
                      Dispense Medication to Patient
                    </button>
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
