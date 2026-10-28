// LaboratoryPage.tsx - Step 3A: Laboratory Department with Appointment Date/Time, WhatsApp & Real AI Voice Call
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { LabReportsPage } from './LabReportsPage';
import {
  FlaskConical,
  CheckCircle2,
  Clock,
  Calendar,
  MessageCircle,
  PhoneCall,
  Phone,
  Send,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Bot,
  AlertCircle,
  MapPin,
  ExternalLink,
  Radio
} from 'lucide-react';
import {
  checkTwilioStatus,
  placeTwilioCall,
  TwilioStatusResponse,
  TwilioCallResponse
} from '../services/twilioClient';

export const LaboratoryPage: React.FC = () => {
  const { patients, updateLabStatus, markWhatsAppReminderSent, markAiCallCompleted } = useApp();

  const [enteringResultForId, setEnteringResultForId] = useState<string | null>(null);
  const [resultText, setResultText] = useState('Elevated cardiac biomarkers consistent with fluid retention.');
  const [labView, setLabView] = useState<'orders' | 'reports'>('orders');

  // Test Call & Custom Voice Reminder Modal State
  const [activeCallPatient, setActiveCallPatient] = useState<(typeof patients)[0] | null>(null);
  const [callState, setCallState] = useState<'compose' | 'dialing' | 'ringing' | 'connected' | 'ended'>('compose');
  const [customPhone, setCustomPhone] = useState('+919528871260');
  const [customReminderText, setCustomReminderText] = useState('');
  const [isPreviewSpeaking, setIsPreviewSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callTranscript, setCallTranscript] = useState('');
  const [twilioStatus, setTwilioStatus] = useState<TwilioStatusResponse | null>(null);
  const [twilioCallInfo, setTwilioCallInfo] = useState<TwilioCallResponse | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const ringOscillatorRef = useRef<{ osc1: OscillatorNode; osc2: OscillatorNode } | null>(null);

  useEffect(() => {
    checkTwilioStatus().then(setTwilioStatus);
  }, []);

  // Patients who were sent to the lab
  const labOrders = patients.filter(p => p.routing.sendToLab);

  const handleComplete = (patientId: string) => {
    updateLabStatus(patientId, 'completed', resultText);
    setEnteringResultForId(null);
  };

  // Helper to format phone for WhatsApp (handles 10-digit Indian numbers or international)
  const getCleanWhatsAppUrl = (phone: string, name: string, testName: string, date: string, time: string) => {
    const rawDigits = phone.replace(/[^0-9]/g, '');
    const fullPhone = rawDigits.length === 10 ? `91${rawDigits}` : rawDigits;
    const msg = `🏥 *EnsureCare Laboratory Reminder*\n\nHello *${name}*,\nThis is a reminder for your upcoming *${testName}* appointment scheduled on:\n\n📅 *Date:* ${date}\n⏰ *Time:* ${time}\n📍 *Location:* EnsureCare Diagnostic Center\n\n⚠️ *Preparation:* Please fast for 8-10 hours prior to your sample collection.\n\nReply *YES* to confirm this appointment.`;
    return `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(msg)}`;
  };

  const handleSendWhatsApp = (patient: (typeof patients)[0]) => {
    const url = getCleanWhatsAppUrl(
      patient.phone,
      patient.name,
      patient.routing.labTestName || 'Diagnostic Test',
      patient.routing.labAppointmentDate || 'Tomorrow',
      patient.routing.labAppointmentTime || '10:00 AM'
    );
    window.open(url, '_blank');
    markWhatsAppReminderSent(patient.id);
  };

  // Open the Twilio Call Composer where user writes the reminder text
  const handleOpenTestCall = (patient: (typeof patients)[0]) => {
    setActiveCallPatient(patient);
    setCallState('compose');
    setCustomPhone(patient.phone || '+919528871260');
    // Start with clean empty custom reminder text so user can write whatever message they want
    setCustomReminderText('');
    setTwilioCallInfo(null);
    checkTwilioStatus().then(setTwilioStatus);
  };

  // Play audio preview of the text locally via speech synthesis
  const handlePreviewAudio = () => {
    if ('speechSynthesis' in window) {
      if (isPreviewSpeaking) {
        window.speechSynthesis.cancel();
        setIsPreviewSpeaking(false);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(customReminderText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.includes('en') && (v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Zira') || v.name.includes('Aditi')));
      if (voice) utterance.voice = voice;
      utterance.onstart = () => setIsPreviewSpeaking(true);
      utterance.onend = () => setIsPreviewSpeaking(false);
      utterance.onerror = () => setIsPreviewSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Play realistic phone ring tone using Web Audio API
  const playRingtone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.setValueAtTime(480, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();

      ringOscillatorRef.current = { osc1, osc2 };
    } catch (e) {
      console.warn('Audio ringtone not available:', e);
    }
  };

  const stopRingtone = () => {
    try {
      if (ringOscillatorRef.current) {
        ringOscillatorRef.current.osc1.stop();
        ringOscillatorRef.current.osc2.stop();
        ringOscillatorRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } catch (e) {
      // ignore
    }
  };

  // Execute the Test Call: Calls Twilio with the exact custom reminder text written by user
  const handleExecuteCall = async () => {
    if (!activeCallPatient || !customPhone.trim() || !customReminderText.trim()) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPreviewSpeaking(false);
    }

    setCallState('dialing');
    setCallDuration(0);
    setTwilioCallInfo(null);
    setCallTranscript(`Initiating Twilio Voice Call for ${customPhone}...`);

    const status = await checkTwilioStatus();
    setTwilioStatus(status);

    placeTwilioCall({
      to: customPhone.trim(),
      patientName: activeCallPatient.name,
      message: customReminderText.trim(),
      taskType: 'lab_test',
      providerName: activeCallPatient.routing.labFacilityName
    }).then(res => {
      setTwilioCallInfo(res);
    }).catch(err => {
      console.warn('Twilio call notice:', err);
    });

    // Step 1: Dialing for 1.2s
    setTimeout(() => {
      setCallState('ringing');
      setCallTranscript(`Ringing device (${customPhone})...`);
      playRingtone();

      // Step 2: Connected after 2.5s ring
      setTimeout(() => {
        stopRingtone();
        setCallState('connected');
        setCallTranscript(customReminderText);

        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(customReminderText);
          utterance.rate = 0.95;
          utterance.pitch = 1.0;

          const voices = window.speechSynthesis.getVoices();
          const femaleVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Zira') || v.name.includes('Aditi')));
          if (femaleVoice) utterance.voice = femaleVoice;

          utterance.onstart = () => setIsSpeaking(true);
          utterance.onend = () => {
            setIsSpeaking(false);
            markAiCallCompleted(activeCallPatient.id);
          };
          utterance.onerror = () => setIsSpeaking(false);

          window.speechSynthesis.speak(utterance);
        } else {
          setTimeout(() => markAiCallCompleted(activeCallPatient.id), 5000);
        }
      }, 2500);
    }, 1200);
  };

  // End active call
  const endCall = () => {
    stopRingtone();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPreviewSpeaking(false);
    setCallState('ended');
    if (activeCallPatient) {
      markAiCallCompleted(activeCallPatient.id);
    }
    setTimeout(() => {
      setActiveCallPatient(null);
    }, 500);
  };

  // Duration timer when connected
  useEffect(() => {
    let interval: any = null;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setCallDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  if (labView === 'reports') {
    return (
      <div className="space-y-6">
        <LabReportsPage onBackToOrders={() => setLabView('orders')} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-[#0D1829] border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Diagnostic Laboratory Department</h2>
            <p className="text-xs text-slate-400">
              Orders electronically routed by clinic doctors with scheduled appointment date/time and automated patient reminders
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLabView('reports')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer hover:opacity-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>Open AI Reports &amp; Imaging Studio</span>
          </button>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            {labOrders.filter(o => o.routing.labStatus !== 'completed').length} Pending Test(s)
          </span>
        </div>
      </div>

      {/* Sub-navigation Switcher: Orders vs AI Reports Studio */}
      <div className="flex items-center gap-2 p-1.5 bg-[#0B1426] border border-slate-800 rounded-2xl w-fit">
        <button
          onClick={() => setLabView('orders')}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white shadow-md flex items-center gap-2 cursor-pointer"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span>Specimen Orders &amp; Follow-Up ({labOrders.length})</span>
        </button>

        <button
          onClick={() => setLabView('reports')}
          className="px-4 py-2 rounded-xl text-xs font-bold text-cyan-300 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>🔬 AI Reports &amp; Imaging Analysis (Image + PDF Models)</span>
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {labOrders.length === 0 ? (
          <div className="text-center py-12 bg-[#0D1829] border border-slate-800 rounded-3xl text-slate-400">
            <FlaskConical className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No laboratory orders active right now</p>
            <p className="text-xs text-slate-500 mt-1">Check in a patient and choose "Send to Laboratory" in the Doctor Desk</p>
          </div>
        ) : (
          labOrders.map(p => {
            const isCompleted = p.routing.labStatus === 'completed';

            return (
              <div
                key={p.id}
                className={`p-6 rounded-3xl border transition-all space-y-4 ${
                  isCompleted
                    ? 'bg-[#0A1220] border-slate-800 opacity-90'
                    : 'bg-[#0D1829] border-purple-500/40 shadow-lg shadow-purple-950/20'
                }`}
              >
                {/* Top Row: Priority & Test Name & Status */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {p.routing.labPriority || 'Routine'}
                      </span>
                      <h3 className="text-base font-bold text-white">{p.routing.labTestName}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                      <span>Patient: <strong className="text-slate-200">{p.name}</strong> ({p.gender}, {p.age}yo)</span>
                      <span>•</span>
                      <span>Phone: <strong className="font-mono text-cyan-300 font-semibold">{p.phone}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        {p.location}
                      </span>
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isCompleted ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Results Released
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold animate-pulse">
                        <Clock className="w-3.5 h-3.5" /> Specimen In Analysis
                      </span>
                    )}
                  </div>
                </div>

                {/* PROMINENT APPOINTMENT DATE & TIME BADGE (AS REQUESTED) */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-[#111F36] border border-purple-500/30 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-purple-300 block">
                        Scheduled Lab Appointment Date & Time
                      </span>
                      <div className="text-sm font-extrabold text-white flex items-center gap-2">
                        <span>{p.routing.labAppointmentDate || '2026-10-28'}</span>
                        <span className="text-purple-400">•</span>
                        <span className="text-cyan-300 font-mono">{p.routing.labAppointmentTime || '10:30 AM'}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
                    Scheduled by Doctor
                  </span>
                </div>

                {/* Real Laboratory Location on Google Maps */}
                <div className="p-3 bg-[#111F36] rounded-2xl border border-purple-500/30 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                      Collection Facility
                    </span>
                    <span className="font-semibold text-white">{p.routing.labFacilityName || 'Dr. Lal PathLabs National Reference Lab'}</span>
                    <span className="text-slate-400 hidden sm:inline">• {p.routing.labFacilityAddress || 'Block E, Sector 18, Rohini, New Delhi'}</span>
                  </div>
                  <a
                    href={p.routing.labFacilityGoogleMaps || 'https://www.google.com/maps/search/?api=1&query=Dr+Lal+PathLabs+National+Reference+Lab+Rohini+Delhi'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-300 hover:text-white flex items-center gap-1 font-bold text-xs"
                  >
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>Open Lab on Google Maps ↗</span>
                  </a>
                </div>

                {/* Clinical Indication */}
                <div className="text-xs bg-[#111F36] p-3 rounded-2xl border border-slate-800 text-slate-300">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Clinical Indication:</span>
                  "{p.symptoms}"
                </div>

                {/* Completed Results Display */}
                {isCompleted && p.routing.labResult && (
                  <div className="text-xs bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-2xl text-emerald-300">
                    <strong className="block text-[10px] uppercase font-bold text-emerald-400 mb-0.5">Verified Laboratory Findings:</strong>
                    {p.routing.labResult}
                  </div>
                )}

                {/* AUTOMATED OUTREACH ACTIONS: WHATSAPP & REAL AI VOICE CALL (AS REQUESTED) */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* 1. Real WhatsApp Button */}
                    <button
                      onClick={() => handleSendWhatsApp(p)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                      title="Send real WhatsApp message to patient's phone"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-200 fill-emerald-200" />
                      <span>Send WhatsApp Reminder</span>
                      {p.routing.labReminderSentWhatsApp && (
                        <span className="ml-1 text-[10px] bg-emerald-800 text-emerald-200 px-1.5 py-0.2 rounded font-semibold">
                          Sent ✓
                        </span>
                      )}
                    </button>

                    {/* 2. Twilio Call Feature (User writes custom reminder text) */}
                    <button
                      onClick={() => handleOpenTestCall(p)}
                      className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-95 active:scale-98 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                      title="Write reminder text and call patient via Twilio"
                    >
                      <PhoneCall className="w-4 h-4 text-slate-950" />
                      <span>Test Call (Twilio)</span>
                      {p.routing.labReminderCallStatus === 'completed' && (
                        <span className="ml-1 text-[10px] bg-teal-800 text-teal-100 px-1.5 py-0.2 rounded font-semibold">
                          Called ✓
                        </span>
                      )}
                    </button>

                    {/* 3. AI Scan & PDF Report Studio */}
                    <button
                      onClick={() => setLabView('reports')}
                      className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      title="Analyze scan & PDF report using Medical AI Models (ResNet, Swin UNETR, BioBERT, Multimodal)"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>AI Scan &amp; Report Analysis</span>
                    </button>
                  </div>

                  {/* Complete Lab Test Action */}
                  {!isCompleted && (
                    <div>
                      {enteringResultForId === p.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={resultText}
                            onChange={e => setResultText(e.target.value)}
                            placeholder="Enter lab findings / values..."
                            className="bg-[#111F36] border border-slate-700 text-white text-xs rounded-xl px-3 py-2 w-56"
                          />
                          <button
                            onClick={() => handleComplete(p.id)}
                            className="px-3.5 py-2 bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs rounded-xl cursor-pointer"
                          >
                            Release
                          </button>
                          <button
                            onClick={() => setEnteringResultForId(null)}
                            className="text-xs text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEnteringResultForId(p.id);
                            setResultText(`Analysis complete: Parameter values verified for ${p.routing.labTestName}.`);
                          }}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Complete Test & Release Findings
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* TEST CALL & CUSTOM VOICE REMINDER MODAL */}
      {activeCallPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          {callState === 'compose' ? (
            /* 1. WRITE REMINDER TEXT COMPOSER VIEW */
            <div className="bg-[#0B1528] border border-cyan-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl text-left space-y-4 relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setActiveCallPatient(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Twilio Voice Call Feature</h3>
                    {twilioStatus?.configured ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Twilio Live ({twilioStatus.fromNumber})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                        Simulator Ready
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Write the reminder text below. Twilio will dial this user and speak this exact message.
                  </p>
                </div>
              </div>

              {/* Phone Number to Dial */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Recipient Phone Number to Call:
                </label>
                <input
                  type="text"
                  value={customPhone}
                  onChange={e => setCustomPhone(e.target.value)}
                  placeholder="+919528871260"
                  className="w-full bg-[#070D18] border border-slate-700 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none"
                />
              </div>

              {/* Editable Reminder Text Area */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    Write Reminder Text to Speak:
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {customReminderText.length} characters
                  </span>
                </div>
                <textarea
                  value={customReminderText}
                  onChange={e => setCustomReminderText(e.target.value)}
                  rows={4}
                  placeholder="Type the reminder message here that Twilio will call and speak to the user (e.g. Please remember your lab test appointment tomorrow at 10:30 AM)..."
                  className="w-full bg-[#070D18] border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-xs text-white focus:outline-none leading-relaxed resize-none font-sans"
                />

                {/* Quick Helper Chips */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[10px]">
                  <span className="text-slate-500 font-semibold">Templates:</span>
                  <button
                    type="button"
                    onClick={() => setCustomReminderText(`Hello ${activeCallPatient.name}, this is a reminder for your upcoming medical appointment. Please remember to attend on time. Thank you.`)}
                    className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                  >
                    Short Reminder
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomReminderText(prev => (prev ? prev + ' ' : '') + 'Please remember to fast for 8 to 10 hours prior to your sample collection.')}
                    className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                  >
                    + Fasting Notice
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomReminderText(prev => (prev ? prev + ' ' : '') + 'Please arrive 15 minutes before your scheduled slot.')}
                    className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                  >
                    + Arrive Early
                  </button>
                  {customReminderText && (
                    <button
                      type="button"
                      onClick={() => setCustomReminderText('')}
                      className="px-2 py-0.5 rounded-md bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 transition cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800/80">
                <button
                  type="button"
                  disabled={!customReminderText.trim()}
                  onClick={handlePreviewAudio}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Listen to how the voice will sound before dialing"
                >
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isPreviewSpeaking ? 'Stop Audio' : 'Listen Preview'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCallPatient(null)}
                    className="px-3 py-2 text-xs text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={!customReminderText.trim()}
                    onClick={handleExecuteCall}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 hover:opacity-95 disabled:opacity-40 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Place Twilio Call</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* 2. ACTIVE OUTBOUND CALL SCREEN */
            <div className="bg-[#0B1528] border border-cyan-500/40 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center space-y-5 relative overflow-hidden">
              <button
                onClick={endCall}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Status Header */}
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2 mb-1">
                  {twilioStatus?.configured ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Twilio Live Voice Active ({twilioStatus.fromNumber})
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold text-cyan-300">
                      <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                      Twilio Voice Simulator
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-extrabold text-white pt-1">{activeCallPatient.name}</h3>
                <p className="text-sm font-mono text-cyan-300 font-semibold">{customPhone}</p>

                {twilioCallInfo?.callSid && (
                  <div className="mt-2 py-1 px-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[10px] text-emerald-300 font-mono">
                    📞 Cellular Call Placed • SID: {twilioCallInfo.callSid}
                  </div>
                )}
                {twilioCallInfo?.error && !twilioCallInfo.simulated && (
                  <div className="mt-2 py-1 px-3 rounded-lg bg-red-950/40 border border-red-500/30 text-[10px] text-red-300 text-left">
                    Twilio Notice: {twilioCallInfo.error}
                  </div>
                )}
              </div>

              {/* Animated Avatar */}
              <div className="py-2 flex flex-col items-center justify-center">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    callState === 'dialing' || callState === 'ringing'
                      ? 'bg-amber-500/20 border-2 border-amber-500 animate-pulse'
                      : callState === 'connected'
                      ? 'bg-cyan-500/20 border-2 border-cyan-400 shadow-xl shadow-cyan-500/30'
                      : 'bg-slate-800'
                  }`}
                >
                  <Bot
                    className={`w-10 h-10 ${
                      callState === 'dialing' || callState === 'ringing'
                        ? 'text-amber-400 animate-bounce'
                        : callState === 'connected'
                        ? 'text-cyan-300'
                        : 'text-slate-400'
                    }`}
                  />
                </div>

                <div className="mt-3 space-y-0.5">
                  {callState === 'dialing' && (
                    <p className="text-xs font-bold text-amber-400 animate-pulse">Dialing {customPhone}...</p>
                  )}
                  {callState === 'ringing' && (
                    <p className="text-xs font-bold text-amber-400 animate-bounce">Ringing ({customPhone})...</p>
                  )}
                  {callState === 'connected' && (
                    <div>
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-xs font-bold text-emerald-400">Call Connected — Speaking Reminder</span>
                      </div>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">
                        00:{callDuration < 10 ? `0${callDuration}` : callDuration}
                      </p>
                    </div>
                  )}
                  {callState === 'ended' && (
                    <p className="text-xs font-bold text-slate-400">Call Completed</p>
                  )}
                </div>

                {callState === 'connected' && isSpeaking && (
                  <div className="flex items-center gap-1 mt-3">
                    <span className="w-1.5 h-6 bg-cyan-400 rounded-full animate-pulse" />
                    <span className="w-1.5 h-10 bg-teal-400 rounded-full animate-pulse delay-75" />
                    <span className="w-1.5 h-4 bg-cyan-400 rounded-full animate-pulse delay-150" />
                    <span className="w-1.5 h-8 bg-teal-300 rounded-full animate-pulse delay-100" />
                    <span className="w-1.5 h-5 bg-cyan-300 rounded-full animate-pulse delay-200" />
                  </div>
                )}
              </div>

              {/* Spoken Text Box */}
              <div className="text-left bg-[#070D18] border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-300 max-h-28 overflow-y-auto">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Spoken Reminder Text:
                </span>
                <p className="text-slate-200 leading-relaxed font-sans italic text-[11px]">{callTranscript}</p>
              </div>

              {/* Call Controls */}
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  onClick={() => setCallState('compose')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Edit Message & Redial
                </button>

                <button
                  onClick={endCall}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center gap-2 cursor-pointer"
                >
                  <Phone className="w-4 h-4 rotate-135" />
                  <span>End Call</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
