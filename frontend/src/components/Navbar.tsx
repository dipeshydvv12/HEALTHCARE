// Navbar.tsx - Sleek Floating Pill Navbar matching EnsureCare Design
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageTab } from '../types';
import { ArrowRight, RotateCcw, PhoneCall, Phone, X, Check, Bot } from 'lucide-react';
import { placeTwilioCall, checkTwilioStatus, TwilioCallResponse } from '../services/twilioClient';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, resetDemo, missedStepsCount, clinicalRecords } = useApp();

  // Quick Twilio Call Modal
  const [showCallModal, setShowCallModal] = useState(false);
  const [targetNumber, setTargetNumber] = useState('+919528871260');
  const [isCalling, setIsCalling] = useState(false);
  const [callResult, setCallResult] = useState<TwilioCallResponse | null>(null);

  const handleQuickCall = async () => {
    setIsCalling(true);
    setCallResult(null);
    try {
      const res = await placeTwilioCall({
        to: targetNumber.trim(),
        patientName: 'Verified Patient',
        message: 'Hello! This is EnsureCare Healthcare Follow-Up Coordination calling. Your appointment is confirmed and our clinical staff is ready for your visit. Thank you and stay healthy.'
      });
      setCallResult(res);
    } catch (err: unknown) {
      const error = err as Error;
      setCallResult({ success: false, error: error.message || 'Call failed' });
    } finally {
      setIsCalling(false);
    }
  };

  const navItems: { id: PageTab; label: string; badge?: number }[] = [
    { id: 'tasks', label: '⚡ Tasks & Alerts', badge: missedStepsCount },
    { id: 'checkin', label: '1. Clinic Check-in' },
    { id: 'doctor', label: '2. Doctor Desk' },
    { id: 'lab', label: '3. Laboratory' },
    { id: 'lab_reports', label: '🔬 AI Lab Reports' },
    { id: 'pharmacy', label: '4. Pharmacy' },
    { id: 'referrals', label: '5. Referrals' },
    { id: 'tracker', label: '6. Patient Tracker' },
    { id: 'records', label: '7. Medical Records', badge: clinicalRecords.length }
  ];

  return (
    <header className="w-full pt-4 pb-2 px-4 sticky top-0 z-50 bg-[#070D18]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Floating Pill Container */}
        <div className="w-full bg-[#0D1829]/95 border border-slate-700/60 rounded-full px-4 sm:px-5 py-2.5 flex items-center justify-between shadow-2xl shadow-cyan-950/20">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button
              onClick={() => setActiveTab('tasks')}
              className="flex items-center gap-2.5 text-white hover:opacity-95 transition cursor-pointer"
            >
              {/* Spiral Logo Icon from user's image */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 via-teal-400 to-indigo-500 p-0.5 flex items-center justify-center shadow-md shadow-cyan-500/20">
                <div className="w-full h-full bg-[#0B1528] rounded-full flex items-center justify-center overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/30 to-teal-400/10" />
                  <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a10 10 0 0 1 10 10c0 4-2.5 7.5-6 9" />
                    <path d="M12 6a6 6 0 0 1 6 6c0 2.4-1.5 4.5-3.6 5.4" />
                    <path d="M12 10a2 2 0 0 1 2 2c0 .8-.5 1.5-1.2 1.8" />
                  </svg>
                </div>
              </div>
              <span className="text-lg font-bold tracking-tight text-white hidden sm:inline">EnsureCare</span>
            </button>

            {/* Vertical Divider */}
            <div className="h-4 w-px bg-slate-700 hidden md:block" />
          </div>

          {/* Navigation Links in the Pill */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              const hasBadge = !!item.badge && item.badge > 0;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-xs shadow-cyan-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span>{item.label}</span>
                  {hasBadge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-red-500 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Test Call Button */}
            <button
              onClick={() => setShowCallModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition cursor-pointer"
              title="Test real Twilio outbound phone call"
            >
              <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
              <span>Test AI Call</span>
            </button>

            <button
              onClick={resetDemo}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition cursor-pointer"
              title="Reset sample patients & clock"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              onClick={() => setActiveTab('checkin')}
              className="bg-white hover:bg-slate-100 active:scale-98 text-slate-950 font-bold text-xs px-4 sm:px-5 py-2 rounded-full shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>+ New Check-In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="flex lg:hidden overflow-x-auto gap-1.5 py-2 px-2 mt-2 scrollbar-none">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          const hasBadge = !!item.badge && item.badge > 0;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 flex items-center gap-1 ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              <span>{item.label}</span>
              {hasBadge && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-red-500 text-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Twilio Call Test Modal */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B1528] border border-cyan-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative text-left">
            <button
              onClick={() => setShowCallModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Twilio Outbound AI Voice Test</h3>
                <p className="text-[11px] text-slate-400">Caller ID: <span className="font-mono text-cyan-300">+17372508034</span></p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Destination Phone Number (with Country Code)
              </label>
              <input
                type="text"
                value={targetNumber}
                onChange={e => setTargetNumber(e.target.value)}
                placeholder="+919528871260"
                className="w-full bg-[#070D18] border border-slate-700 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
              />
            </div>

            <div className="p-3 bg-[#070D18] border border-slate-800 rounded-xl text-[11px] text-slate-300 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Spoken AI Prompt:</span>
              <p className="italic text-slate-400">
                "Hello! This is EnsureCare Healthcare Follow-Up Coordination calling. Your appointment is confirmed and our clinical staff is ready for your visit. Thank you and stay healthy."
              </p>
            </div>

            {callResult && (
              <div className={`p-3 rounded-xl border text-xs ${
                callResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/40 border-red-500/40 text-red-300'
              }`}>
                {callResult.success ? (
                  <div>
                    <p className="font-bold flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Call Placed via Twilio!
                    </p>
                    <p className="text-[10px] font-mono mt-0.5">Call SID: {callResult.callSid}</p>
                    <p className="text-[10px] text-emerald-400/80 mt-0.5">Your phone should ring in a few seconds.</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold">Call Error</p>
                    <p className="text-[10px] mt-0.5">{callResult.error}</p>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowCallModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Close
              </button>
              <button
                disabled={isCalling}
                onClick={handleQuickCall}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{isCalling ? 'Dialing...' : 'Call Phone Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
