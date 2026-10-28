// agentic_ai/src/agents/voiceCommunicationAgent.ts
// Voice Dialogue & Script Generation Agent for Patient Communications

export interface VoiceDialogueScript {
  patientName: string;
  targetPhone: string;
  synthesizedSpeech: string;
  preferredLanguage: string;
  urgencyLevel: string;
}

export class VoiceCommunicationAgent {
  name = 'EnsureCare Voice Communication Agent';
  version = '2.1.0';

  /**
   * Generates a context-aware clinical telephone script tailored to patient's upcoming medical task.
   */
  public generateAppointmentScript(params: {
    patientName: string;
    targetPhone: string;
    appointmentType: string;
    facilityName: string;
    scheduledTime: string;
    specialInstructions?: string;
  }): VoiceDialogueScript {
    const instructions = params.specialInstructions
      ? ` Please note: ${params.specialInstructions}.`
      : ' Please arrive 10 minutes prior to your appointment.';

    const speech = `Hello ${params.patientName}. This is an automated reminder from EnsureCare Health Services calling on behalf of ${params.facilityName}. You have a scheduled ${params.appointmentType} appointment set for ${params.scheduledTime}.${instructions} If you need to reschedule or require clinic assistance, please connect with our care desk. Thank you and stay healthy.`;

    return {
      patientName: params.patientName,
      targetPhone: params.targetPhone,
      synthesizedSpeech: speech,
      preferredLanguage: 'en-IN',
      urgencyLevel: 'Standard Reminder'
    };
  }
}
