// TaskCoordinatorPage.tsx - Centralized Coordination Platform for Tracking Outstanding Tasks, Detecting Missed Steps, Coordinating Appointments & Escalating Unresolved Cases
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { OutstandingTask, EscalationLevel, TaskType } from '../types';
import {
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  MapPin,
  ExternalLink,
  MessageCircle,
  PhoneCall,
  Phone,
  RotateCcw,
  FastForward,
  User,
  FlaskConical,
  Pill,
  Share2,
  Stethoscope,
  ChevronRight,
  Filter,
  Check,
  Send,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  Radio
} from 'lucide-react';
import {
  checkTwilioStatus,
  placeTwilioCall,
  TwilioStatusResponse,
  TwilioCallResponse
} from '../services/twilioClient';

export const TaskCoordinatorPage: React.FC = () => {
  const {
    patients,
    outstandingTasks,
    missedStepsCount,
    criticalEscalationsCount,
    simulatedNow,
    advanceTime,
    resetTime,
    resolveTask,
    escalateTask,
    rescheduleAppointment,
    setActivePatientId,
    setActiveTab
  } = useApp();

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'missed' | 'pending' | 'escalated' | 'resolved'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | TaskType>('all');

  // Reschedule Modal State
  const [reschedulingTask, setReschedulingTask] = useState<OutstandingTask | null>(null);
  const [newDate, setNewDate] = useState('2026-10-30');
  const [newTime, setNewTime] = useState('11:00 AM');
  const [rescheduleReason, setRescheduleReason] = useState('Patient requested new appointment slot');

  // Escalation Modal / Prompt State
  const [escalatingTaskId, setEscalatingTaskId] = useState<string | null>(null);

  // AI Voice Call Simulator State
  const [callTask, setCallTask] = useState<OutstandingTask | null>(null);
  const [callState, setCallState] = useState<'dialing' | 'ringing' | 'connected' | 'ended'>('dialing');
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

  // Parse simulated time for nice UI display
  const simulatedDateObj = new Date(simulatedNow);
  const formattedSimulatedDate = simulatedDateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedSimulatedTime = simulatedDateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Filtered task list
  const filteredTasks = outstandingTasks.filter(task => {
    if (statusFilter === 'missed' && !task.isMissedStep) return false;
    if (statusFilter === 'pending' && (task.isMissedStep || task.status === 'resolved')) return false;
    if (statusFilter === 'escalated' && task.status !== 'escalated') return false;
    if (statusFilter === 'resolved' && task.status !== 'resolved') return false;

    if (typeFilter !== 'all' && task.taskType !== typeFilter) return false;

    return true;
  });

  // Handle Rescheduling Appointment or Referral
  const handleConfirmReschedule = () => {
    if (!reschedulingTask) return;

    let reschedType: 'lab' | 'referral' | 'doctor' = 'lab';
    if (reschedulingTask.taskType === 'lab_test') reschedType = 'lab';
    else if (reschedulingTask.taskType === 'specialist_referral') reschedType = 'referral';
    else reschedType = 'doctor';

    rescheduleAppointment(reschedulingTask.patientId, reschedType, newDate, newTime);
    resolveTask(reschedulingTask.id); // Clear overdue flag
    setReschedulingTask(null);
  };

  // Helper to open WhatsApp with custom nudge
  const handleWhatsAppNudge = (task: OutstandingTask) => {
    const rawDigits = task.patientPhone.replace(/[^0-9]/g, '');
    const fullPhone = rawDigits.length === 10 ? `91${rawDigits}` : rawDigits;
    
    let msg = `🏥 *EnsureCare Follow-Up Coordination Alert*\n\nHello *${task.patientName}*,\nOur care coordination system noticed an outstanding healthcare step:\n\n📌 *Task:* ${task.title}\n📍 *Facility:* ${task.providerName}\n📅 *Target Time:* ${task.dueDate} at ${task.dueTime}\n\n`;
    if (task.isMissedStep) {
      msg += `⚠️ *Notice:* This appointment/pickup is currently overdue. Please contact our care coordinator immediately or reply to reschedule.\n\n`;
    } else {
      msg += `ℹ️ Please confirm your availability or let us know if you need to reschedule.\n\n`;
    }
    msg += `🗺️ Facility Directions: ${task.googleMapsUrl || 'https://maps.google.com'}\n\nReply to this message to coordinate your care visit.`;

    const url = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Audio ringtone generation
  const startRingtone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = 440;
      osc2.frequency.value = 480;

      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      ringOscillatorRef.current = { osc1, osc2 };
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  const stopRingtone = () => {
    if (ringOscillatorRef.current) {
      try {
        ringOscillatorRef.current.osc1.stop();
        ringOscillatorRef.current.osc2.stop();
        ringOscillatorRef.current.osc1.disconnect();
        ringOscillatorRef.current.osc2.disconnect();
      } catch {
        // Ignored
      }
      ringOscillatorRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {
        // Ignored
      }
    }
  };

  // AI Voice Call Trigger (Twilio Cellular Voice Call + Audio Synthesizer Simulator)
  const handleInitiateCall = async (task: OutstandingTask) => {
    setCallTask(task);
    setCallState('dialing');
    setCallDuration(0);
    setIsSpeaking(false);
    setTwilioCallInfo(null);
    setCallTranscript(`Dialing patient ${task.patientName} at ${task.patientPhone} via Twilio Voice Gateway...`);

    // Refresh Twilio status
    const status = await checkTwilioStatus();
    setTwilioStatus(status);

    const textToSpeak = task.isMissedStep
      ? `Hello ${task.patientName}. This is EnsureCare Patient Coordination calling regarding your overdue ${task.taskType.replace(/_/g, ' ')} for ${task.title}. Our records indicate this step was missed at ${task.providerName}. Would you like our care coordinator to reschedule a convenient time for you?`
      : `Hello ${task.patientName}. This is EnsureCare automated follow-up coordination confirming your upcoming ${task.title} scheduled on ${task.dueDate} at ${task.dueTime} at ${task.providerName}. Please remember to attend. Thank you.`;

    // Attempt real cellular phone call via Twilio
    placeTwilioCall({
      to: task.patientPhone,
      patientName: task.patientName,
      message: textToSpeak,
      taskType: task.taskType,
      providerName: task.providerName
    }).then(res => {
      setTwilioCallInfo(res);
    }).catch(err => {
      console.warn('Twilio coordination call notice:', err);
    });

    setTimeout(() => {
      setCallState('ringing');
      setCallTranscript(`Phone is ringing on patient device (${task.patientPhone})...`);
      startRingtone();
    }, 1800);

    setTimeout(() => {
      stopRingtone();
      setCallState('connected');
      setIsSpeaking(true);
      setCallTranscript(textToSpeak);

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        utterance.onend = () => {
          setIsSpeaking(false);
          setCallTranscript(prev => prev + '\n\n[Patient acknowledged: "Yes, please connect me with a coordinator to reschedule."]');
        };
        window.speechSynthesis.speak(utterance);
      }
    }, 4500);
  };

  const handleEndCall = () => {
    stopRingtone();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCallState('ended');
    setTimeout(() => {
      setCallTask(null);
    }, 800);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setCallDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopRingtone();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const getTaskIcon = (type: TaskType) => {
    switch (type) {
      case 'lab_test':
        return <FlaskConical className="w-4 h-4 text-purple-400" />;
      case 'pharmacy_pickup':
        return <Pill className="w-4 h-4 text-amber-400" />;
      case 'specialist_referral':
        return <Share2 className="w-4 h-4 text-pink-400" />;
      case 'doctor_followup':
        return <Stethoscope className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getTaskTypeBadge = (type: TaskType) => {
    switch (type) {
      case 'lab_test':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">LABORATORY ORDER</span>;
      case 'pharmacy_pickup':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">PHARMACY PICKUP</span>;
      case 'specialist_referral':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/10 text-pink-300 border border-pink-500/30">SPECIALIST REFERRAL</span>;
      case 'doctor_followup':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">CLINIC REVIEW</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-6">
      {/* 1. Header Banner & Executive KPI Metrics */}
      <div className="bg-[#0D1829] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 tracking-wider uppercase">
                Care Coordination Engine
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Watchdog Active
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Tasks, Missed Steps & Coordination Desk
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Tracks outstanding healthcare tasks across clinics, labs, and pharmacies. Automatically detects missed appointments or delayed pickups, escalates to authorized care coordinators, and facilitates 1-click rescheduling.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('checkin')}
              className="bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-full shadow-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>+ New Check-In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          {/* Card 1: Outstanding Tasks */}
          <div className="bg-[#0A1220] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Tasks</p>
              <h3 className="text-2xl font-black text-white mt-0.5">
                {outstandingTasks.filter(t => t.status !== 'resolved').length}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Across clinic, lab & pharmacy</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Missed Steps */}
          <div className={`border rounded-2xl p-4 flex items-center justify-between transition-all ${
            missedStepsCount > 0
              ? 'bg-red-950/20 border-red-500/40 shadow-lg shadow-red-950/30'
              : 'bg-[#0A1220] border-slate-800'
          }`}>
            <div>
              <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1">
                {missedStepsCount > 0 && <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />}
                Missed Steps
              </p>
              <h3 className="text-2xl font-black text-red-300 mt-0.5">
                {missedStepsCount}
              </h3>
              <p className="text-[10px] text-red-400/80 mt-0.5">SLA deadlines breached</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Critical Escalations */}
          <div className="bg-[#0A1220] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Escalated Cases</p>
              <h3 className="text-2xl font-black text-amber-300 mt-0.5">
                {criticalEscalationsCount}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Supervisor & Director alerts</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Resolved Tasks */}
          <div className="bg-[#0A1220] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Resolved</p>
              <h3 className="text-2xl font-black text-emerald-300 mt-0.5">
                {outstandingTasks.filter(t => t.status === 'resolved').length}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Successfully completed</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Time Machine & Watchdog Simulator Bar */}
      <div className="bg-gradient-to-r from-[#0E1A30] via-[#0D1829] to-[#0E1A30] border border-cyan-500/30 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
            <FastForward className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Simulated System Clock:</span>
              <span className="font-mono text-cyan-300 font-bold bg-[#070D18] px-2.5 py-0.5 rounded-md border border-cyan-500/30 text-xs">
                📅 {formattedSimulatedDate} • ⏰ {formattedSimulatedTime}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Advance time forward to test how the watchdog automatically flags overdue tests, uncollected medications, and missed referral bookings.
            </p>
          </div>
        </div>

        {/* Time Advance Quick Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => advanceTime(6)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-cyan-500/50 transition cursor-pointer"
          >
            +6 Hours
          </button>
          <button
            onClick={() => advanceTime(12)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-cyan-500/50 transition cursor-pointer"
          >
            +12 Hours
          </button>
          <button
            onClick={() => advanceTime(24)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition cursor-pointer"
          >
            +24 Hours (Next Day)
          </button>
          <button
            onClick={() => advanceTime(48)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition cursor-pointer"
          >
            +48 Hours
          </button>
          <button
            onClick={resetTime}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition flex items-center gap-1 cursor-pointer"
            title="Reset to default demo time"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Clock</span>
          </button>
        </div>
      </div>

      {/* 3. Filter Bar (Status & Task Types) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0D1829] border border-slate-800 p-3 rounded-2xl">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
              statusFilter === 'all'
                ? 'bg-white text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            All Tasks ({outstandingTasks.length})
          </button>
          <button
            onClick={() => setStatusFilter('missed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'missed'
                ? 'bg-red-500 text-white font-bold shadow-md shadow-red-950/40'
                : 'text-red-400 hover:bg-red-500/10'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            🔴 Missed Steps ({missedStepsCount})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            Pending SLA ({outstandingTasks.filter(t => !t.isMissedStep && t.status !== 'resolved').length})
          </button>
          <button
            onClick={() => setStatusFilter('escalated')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
              statusFilter === 'escalated'
                ? 'bg-purple-600 text-white font-bold shadow-md'
                : 'text-purple-400 hover:bg-purple-500/10'
            }`}
          >
            Escalated ({outstandingTasks.filter(t => t.status === 'escalated').length})
          </button>
          <button
            onClick={() => setStatusFilter('resolved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
              statusFilter === 'resolved'
                ? 'bg-emerald-600 text-white font-bold shadow-md'
                : 'text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            Resolved ({outstandingTasks.filter(t => t.status === 'resolved').length})
          </button>
        </div>

        {/* Type Category Filter */}
        <div className="flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as 'all' | TaskType)}
            className="bg-[#070D18] border border-slate-700 text-xs text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Care Types</option>
            <option value="lab_test">🧪 Laboratory Orders</option>
            <option value="pharmacy_pickup">💊 Pharmacy Pickups</option>
            <option value="specialist_referral">🩺 Specialist Referrals</option>
            <option value="doctor_followup">🏥 Clinic Review Visits</option>
          </select>
        </div>
      </div>

      {/* 4. Task Cards List */}
      <div className="space-y-4">
        {outstandingTasks.length === 0 ? (
          <div className="bg-[#0D1829] border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-200">No Active Tasks in Care Queue</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              All healthcare follow-ups are up to date. Register a patient at the clinic and route to laboratory, pharmacy, or specialist to start tracking tasks and SLAs.
            </p>
            <button
              onClick={() => setActiveTab('checkin')}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shadow-lg transition cursor-pointer mt-2"
            >
              <span>+ Check In First Patient</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-[#0D1829] border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-200">No matching tasks found</h3>
            <p className="text-xs text-slate-500 mt-1">
              All tasks for this filter have been coordinated or resolved.
            </p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isResolved = task.status === 'resolved';

            return (
              <div
                key={task.id}
                className={`rounded-3xl border transition-all p-6 space-y-4 shadow-xl ${
                  isResolved
                    ? 'bg-[#080F1D]/80 border-slate-800/80 opacity-70'
                    : task.isMissedStep
                    ? 'bg-[#120E1E] border-red-500/50 shadow-red-950/20'
                    : 'bg-[#0D1829] border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top Row: Type, Status, Patient Meta */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/70">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                      {getTaskIcon(task.taskType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {getTaskTypeBadge(task.taskType)}
                        <span className="text-xs font-semibold text-slate-300">
                          Patient: <strong className="text-white">{task.patientName}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-cyan-300">{task.patientPhone}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          {task.patientLocation}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Status & SLA Badge */}
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    {isResolved ? (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                        <Check className="w-3.5 h-3.5" /> Resolved & Completed
                      </span>
                    ) : task.isMissedStep ? (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                          🔴 MISSED STEP ({Math.abs(task.hoursRemaining)}h Overdue)
                        </span>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold">
                        <Clock className="w-3.5 h-3.5" /> Due in {task.hoursRemaining} hours
                      </span>
                    )}

                    {/* Escalation Pill */}
                    {task.escalationLevel !== 'none' && !isResolved && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-purple-400" />
                        {task.escalationLevel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Task Indication & Description */}
                  <div className="md:col-span-2 space-y-2">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {task.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {task.description}
                    </p>

                    {/* Missed Step Warning Box if Overdue */}
                    {task.isMissedStep && !isResolved && (
                      <div className="mt-3 p-3 rounded-2xl bg-red-950/30 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-red-300">Watchdog SLA Breach Detected</p>
                          <p className="text-red-300/90 text-[11px] mt-0.5">
                            {task.missedReason || 'Task was scheduled to be fulfilled before current timestamp. Immediate coordination required.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Provider & Appointment Schedule Box */}
                  <div className="bg-[#080E1C] border border-slate-800 rounded-2xl p-3.5 space-y-2">
                    <div className="text-[11px] text-slate-400 font-medium">Assigned Healthcare Facility:</div>
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span className="truncate">{task.providerName}</span>
                      {task.googleMapsUrl && (
                        <a
                          href={task.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] font-semibold shrink-0 ml-1"
                        >
                          <span>Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        Due Date:
                      </span>
                      <span className="font-mono font-bold text-slate-200">
                        {task.dueDate} {task.dueTime ? `at ${task.dueTime}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Coordination Action Bar */}
                {!isResolved && (
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    {/* Left: Communication Nudges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleWhatsAppNudge(task)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="Send customized WhatsApp follow-up reminder"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>WhatsApp Nudge</span>
                      </button>

                      <button
                        onClick={() => handleInitiateCall(task)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="Trigger real-time AI Voice Call to patient"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Twilio Voice Call</span>
                      </button>
                    </div>

                    {/* Right: Appointment Rescheduling, Escalation, Resolution */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Reschedule Button */}
                      <button
                        onClick={() => {
                          setReschedulingTask(task);
                          setNewDate('2026-10-30');
                          setNewTime(task.dueTime || '11:00 AM');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Coordinate / Reschedule</span>
                      </button>

                      {/* Escalate Dropdown */}
                      <div className="relative">
                        <select
                          value={task.escalationLevel}
                          onChange={e => escalateTask(task.id, e.target.value as EscalationLevel)}
                          className="bg-[#070D18] border border-slate-700 hover:border-purple-500 text-xs text-purple-300 font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
                        >
                          <option value="none">No Escalation</option>
                          <option value="Level 1: Care Coordinator">Escalate L1: Care Coordinator</option>
                          <option value="Level 2: Clinic Supervisor">Escalate L2: Clinic Supervisor</option>
                          <option value="Level 3: Medical Director">Escalate L3: Medical Director</option>
                        </select>
                      </div>

                      {/* Mark Resolved */}
                      <button
                        onClick={() => resolveTask(task.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-extrabold shadow transition flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Resolved</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 6. Reschedule & Coordinate Modal */}
      {reschedulingTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D1829] border border-indigo-500/40 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setReschedulingTask(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Coordinate & Reschedule Appointment</h3>
                <p className="text-xs text-slate-400">
                  Patient: <strong className="text-white">{reschedulingTask.patientName}</strong> ({reschedulingTask.patientPhone})
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#080E1C] border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400 font-medium">Original Scheduled Task:</div>
              <div className="font-bold text-white">{reschedulingTask.title}</div>
              <div className="text-slate-400">Facility: {reschedulingTask.providerName}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  New Appointment Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  New Appointment Time
                </label>
                <input
                  type="text"
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  placeholder="e.g. 11:30 AM"
                  className="w-full bg-[#070D18] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Coordination Reason & Resolution Audit Note
              </label>
              <textarea
                value={rescheduleReason}
                onChange={e => setRescheduleReason(e.target.value)}
                rows={2}
                className="w-full bg-[#070D18] border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-400 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setReschedulingTask(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReschedule}
                className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold shadow-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save New Slot & Reset SLA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. AI Voice Call Interactive Modal */}
      {callTask && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B1528] border border-cyan-500/40 rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl relative text-center">
            {/* Top Badge */}
            <div className="flex items-center justify-between">
              {twilioStatus?.configured ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Twilio Live Cellular Connected ({twilioStatus.fromNumber})
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-bold">
                  <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                  Twilio Voice Gateway (Ready in .env)
                </span>
              )}

              <button
                onClick={handleEndCall}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Glowing Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    callState === 'ringing'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-bounce'
                      : callState === 'connected'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <Phone className="w-8 h-8" />
                </div>
                {callState === 'connected' && isSpeaking && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-[#0B1528] animate-ping" />
                )}
              </div>

              <h3 className="text-lg font-bold text-white mt-4">{callTask.patientName}</h3>
              <p className="text-xs text-cyan-300 font-mono mt-0.5">{callTask.patientPhone}</p>

              {/* Twilio Call SID Notification */}
              {twilioCallInfo?.callSid && (
                <div className="mt-2 py-1 px-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[10px] text-emerald-300 font-mono">
                  📞 Cellular Call SID: {twilioCallInfo.callSid} ({twilioCallInfo.status || 'in-progress'})
                </div>
              )}
              {twilioCallInfo?.error && !twilioCallInfo.simulated && (
                <div className="mt-2 py-1 px-3 rounded-lg bg-red-950/40 border border-red-500/30 text-[10px] text-red-300 text-left">
                  Twilio Notice: {twilioCallInfo.error}
                </div>
              )}

              <div className="mt-2 text-xs font-semibold">
                {callState === 'dialing' && <span className="text-slate-400">Initiating Cellular Trunk...</span>}
                {callState === 'ringing' && <span className="text-amber-400 font-mono animate-pulse">Ringing... (Simulated Audio Ringtone Active)</span>}
                {callState === 'connected' && (
                  <span className="text-emerald-400 font-mono">
                    Connected • {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                  </span>
                )}
                {callState === 'ended' && <span className="text-slate-400">Call Completed</span>}
              </div>
            </div>

            {/* Live Spoken Transcript */}
            <div className="p-4 rounded-2xl bg-[#070D18] border border-slate-800 text-left text-xs space-y-1 min-h-[90px] max-h-[140px] overflow-y-auto">
              <div className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Live Spoken Audio Synthesis
              </div>
              <p className="text-slate-200 leading-relaxed whitespace-pre-line text-xs font-sans">
                {callTranscript}
              </p>
            </div>

            {/* Call Action Button */}
            <div className="pt-2">
              <button
                onClick={handleEndCall}
                className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950/40 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4 rotate-[135deg]" />
                <span>Disconnect Call</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
