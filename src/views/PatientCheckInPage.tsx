// PatientCheckInPage.tsx - Step 1: Patient visits clinic and enters user data with location
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Sparkles, ArrowRight, ShieldCheck, Locate } from 'lucide-react';

export const PatientCheckInPage: React.FC = () => {
  const { checkInPatient } = useApp();

  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [consentGranted, setConsentGranted] = useState(true);

  // Quick prefill scenarios for fast testing
  const fillSample = (sample: 'fever' | 'headache' | 'chest') => {
    if (sample === 'fever') {
      setName('Dipesh Yadav');
      setAge(20);
      setGender('Female');
      setPhone('9667651600');
      setLocation('South Extension Part II, New Delhi, Delhi 110049');
      setSymptoms('High grade fever (102°F) with headache, chills, and weakness for 2 days.');
      setConsentGranted(true);
    } else if (sample === 'headache') {
      setName('Aarav Sharma');
      setAge(28);
      setGender('Male');
      setPhone('9876543210');
      setLocation('Greater Kailash 1, New Delhi, Delhi 110048');
      setSymptoms('Severe throbbing headache on right temple with nausea and sensitivity to light.');
      setConsentGranted(true);
    } else if (sample === 'chest') {
      setName('Eleanor Vance');
      setAge(71);
      setGender('Female');
      setPhone('9123456789');
      setLocation('Panchsheel Park, New Delhi, Delhi 110017');
      setSymptoms('Shortness of breath on walking, swelling in both ankles for 3 days.');
      setConsentGranted(true);
    }
  };

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocation('Connaught Place, Central Delhi, Delhi 110001');
        },
        () => {
          setLocation('South Extension Part II, New Delhi, Delhi 110049');
        }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !age || !symptoms.trim() || !phone.trim() || !location.trim()) {
      alert('Please fill in all required patient fields: Name, Age, Phone, Location, and Symptoms.');
      return;
    }

    checkInPatient({
      name: name.trim(),
      age: Number(age),
      gender,
      phone: phone.trim(),
      location: location.trim(),
      symptoms: symptoms.trim(),
      consentGranted
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-4">
      {/* Step Header */}
      <div className="text-center mb-6">
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          Step 1: Patient Reception
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
          Patient Clinic Check-In
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Patient arrives at clinic and provides their personal information, symptoms, and residential location.
        </p>

        {/* Quick Sample Fill Buttons */}
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Quick sample:
          </span>
          <button
            type="button"
            onClick={() => fillSample('fever')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer"
          >
            🌡️ Fever & Weakness
          </button>
          <button
            type="button"
            onClick={() => fillSample('headache')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer"
          >
            🧠 Severe Headache / Migraine
          </button>
          <button
            type="button"
            onClick={() => fillSample('chest')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer"
          >
            🫀 Chest Pain / Edema
          </button>
        </div>
      </div>

      {/* Main Check-In Card */}
      <form onSubmit={handleSubmit} className="bg-[#0D1829] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-300 tracking-wider mb-1.5">
            Full Patient Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Dipesh Yadav"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-[#111F36] border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-cyan-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 tracking-wider mb-1.5">
              Age *
            </label>
            <input
              type="number"
              required
              placeholder="e.g. 20"
              value={age}
              onChange={e => setAge(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-[#111F36] border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 tracking-wider mb-1.5">
              Gender
            </label>
            <select
              value={gender}
              onChange={e => setGender(e.target.value as any)}
              className="w-full bg-[#111F36] border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-hidden focus:border-cyan-400 cursor-pointer"
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 tracking-wider mb-1.5">
              WhatsApp / Calling Phone *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 9667651600"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full bg-[#111F36] border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-cyan-400 font-mono"
            />
          </div>
        </div>

        {/* Location Section */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Patient Residential Location / City *</span>
            </label>
            <button
              type="button"
              onClick={handleDetectLocation}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
            >
              <Locate className="w-3 h-3" />
              <span>Detect Location</span>
            </button>
          </div>
          <input
            type="text"
            required
            placeholder="e.g. South Extension Part II, New Delhi, Delhi 110049"
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="w-full bg-[#111F36] border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-300 tracking-wider mb-1.5">
            Symptoms / Reason for Visit *
          </label>
          <textarea
            required
            rows={3}
            placeholder="Describe what problem you are facing (e.g. headache, fever, cough, chest tightness)..."
            value={symptoms}
            onChange={e => setSymptoms(e.target.value)}
            className="w-full bg-[#111F36] border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-cyan-400"
          />
        </div>

        {/* Patient Consent Box */}
        <div className="bg-[#111F36] border border-slate-700/80 rounded-2xl p-4 flex items-start gap-3">
          <input
            type="checkbox"
            id="consent"
            checked={consentGranted}
            onChange={e => setConsentGranted(e.target.checked)}
            className="mt-1 w-4 h-4 text-cyan-500 bg-slate-900 border-slate-600 rounded cursor-pointer"
          />
          <label htmlFor="consent" className="text-xs text-slate-300 cursor-pointer">
            <strong className="text-white block font-semibold mb-0.5">
              Patient Data Consent Authorization
            </strong>
            I grant permission for this clinic to share my clinical visit records with partner laboratories, pharmacies, and specialist physicians as required for my treatment.
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-sm py-3 px-6 rounded-2xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
        >
          <span>Check In Patient & Send to Doctor</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
