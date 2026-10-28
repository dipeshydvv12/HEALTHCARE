// agentic_ai/src/agents/patientWatchdogAgent.ts
// Autonomous Watchdog Agent monitoring patient follow-up deadlines, laboratory orders, and care milestones

export interface PatientMilestone {
  patientId: string;
  patientName: string;
  phone: string;
  scheduledTime: string;
  taskType: 'lab_collection' | 'pharmacy_pickup' | 'specialist_referral' | 'doctor_followup';
  status: 'pending' | 'in_progress' | 'overdue' | 'completed';
  facilityName: string;
}

export interface WatchdogAlert {
  patientId: string;
  severity: 'low' | 'medium' | 'urgent';
  reason: string;
  recommendedAction: string;
  autoCallTriggered: boolean;
}

export class PatientWatchdogAgent {
  name = 'EnsureCare Patient Watchdog Agent';
  version = '3.1.0';

  /**
   * Scans active patient milestones and detects overdue or critical tasks needing autonomous intervention.
   */
  public evaluateMilestones(milestones: PatientMilestone[]): WatchdogAlert[] {
    const alerts: WatchdogAlert[] = [];

    for (const m of milestones) {
      if (m.status === 'overdue' || m.status === 'pending') {
        const isUrgent = m.taskType === 'lab_collection' || m.taskType === 'specialist_referral';
        alerts.push({
          patientId: m.patientId,
          severity: isUrgent ? 'urgent' : 'medium',
          reason: `Patient ${m.patientName} has pending ${m.taskType.replace('_', ' ')} at ${m.facilityName}.`,
          recommendedAction: `Dispatch automated voice reminder call to ${m.phone} to ensure timely clinic attendance.`,
          autoCallTriggered: isUrgent
        });
      }
    }

    return alerts;
  }
}
