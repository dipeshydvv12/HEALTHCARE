// backend/src/services/twilioService.ts
// Handles Twilio Voice API initialization, speech generation and call management
import twilio from 'twilio';

export interface MakeCallParams {
  to: string;
  patientName: string;
  message?: string;
  taskType?: string;
  providerName?: string;
}

export interface CallResult {
  success: boolean;
  callSid?: string;
  status: string;
  message: string;
  to: string;
  from?: string;
  timestamp: string;
  error?: string;
}

export function buildTwimlXml(patientName: string, customMessage?: string): string {
  const speech = customMessage || 
    `Hello ${patientName}. This is an automated clinical reminder from EnsureCare Health Services regarding your scheduled healthcare consultation and follow-up care. Please review your active care plan in the patient portal. Thank you and stay healthy.`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="1"/>
  <Say voice="Polly.Aditi" language="en-IN">${speech}</Say>
  <Pause length="1"/>
  <Say voice="Polly.Aditi" language="en-IN">Goodbye.</Say>
</Response>`;
}

export async function initiateVoiceCall(params: MakeCallParams): Promise<CallResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return {
      success: false,
      status: 'configuration_error',
      message: 'Twilio credentials not configured in environment variables.',
      to: params.to,
      timestamp: new Date().toISOString(),
      error: 'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER missing.'
    };
  }

  try {
    const client = twilio(accountSid, authToken);
    const twiml = buildTwimlXml(params.patientName, params.message);

    const call = await client.calls.create({
      twiml: twiml,
      to: params.to,
      from: fromNumber
    });

    return {
      success: true,
      callSid: call.sid,
      status: call.status,
      message: `Voice call dispatched successfully to ${params.patientName} (${params.to})`,
      to: params.to,
      from: fromNumber,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'failed',
      message: err.message || 'Failed to dispatch Twilio call',
      to: params.to,
      timestamp: new Date().toISOString(),
      error: String(err)
    };
  }
}
