// App.tsx - EnsureCare Centralized Healthcare Follow-Up Orchestration Platform
import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { TaskCoordinatorPage } from './views/TaskCoordinatorPage';
import { PatientCheckInPage } from './views/PatientCheckInPage';
import { DoctorDeskPage } from './views/DoctorDeskPage';
import { LaboratoryPage } from './views/LaboratoryPage';
import { PharmacyPage } from './views/PharmacyPage';
import { ReferralsPage } from './views/ReferralsPage';
import { PatientTrackerPage } from './views/PatientTrackerPage';
import { ClinicalRecordsPage } from './views/ClinicalRecordsPage';
import { LabReportsPage } from './views/LabReportsPage';

const MainLayout: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navbar matching the uploaded image */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'tasks' && <TaskCoordinatorPage />}
        {activeTab === 'checkin' && <PatientCheckInPage />}
        {activeTab === 'doctor' && <DoctorDeskPage />}
        {activeTab === 'lab' && <LaboratoryPage />}
        {activeTab === 'pharmacy' && <PharmacyPage />}
        {activeTab === 'referrals' && <ReferralsPage />}
        {activeTab === 'tracker' && <PatientTrackerPage />}
        {activeTab === 'records' && <ClinicalRecordsPage />}
        {activeTab === 'lab_reports' && <LabReportsPage />}
      </main>

      {/* Minimal Clean Footer */}
      <footer className="border-t border-slate-800/60 py-4 text-center text-xs text-slate-500 bg-[#070D18]">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-semibold text-slate-400">EnsureCare Coordination Platform</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Synthetic Patient Data Only • Automated Task Watchdog & Multi-Provider Follow-Up
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;
