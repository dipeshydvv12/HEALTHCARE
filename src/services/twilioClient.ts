// src/services/twilioClient.ts - Frontend API Client for Twilio AI Voice Calls
export interface TwilioStatusResponse {
  configured: boolean;
  fromNumber: string | null;
  voice: string;
  language: string;
}

export interface TwilioCallRequest {
  to: string;
  patientName: string;
  message: string;
  taskType?: string;
  providerName?: string;
}

export interface TwilioCallResponse {
  success: boolean;
  simulated?: boolean;
  callSid?: string;
  status?: string;
  to?: string;
  from?: string;
  error?: string;
  details?: string;
}

export async function checkTwilioStatus(): Promise<TwilioStatusResponse> {
  try {
    const res = await fetch('/api/twilio/status');
    if (!res.ok) {
      return { configured: false, fromNumber: null, voice: 'Polly.Aditi', language: 'en-IN' };
    }
    return await res.json();
  } catch (err) {
    console.warn('Could not reach Twilio status endpoint:', err);
    return { configured: false, fromNumber: null, voice: 'Polly.Aditi', language: 'en-IN' };
  }
}

export async function placeTwilioCall(payload: TwilioCallRequest): Promise<TwilioCallResponse> {
  try {
    const res = await fetch('/api/twilio/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data: TwilioCallResponse = await res.json();
    return data;
  } catch (err: unknown) {
    const error = err as Error;
    return {
      success: false,
      error: error.message || 'Network error attempting to contact Twilio API'
    };
  }
}

