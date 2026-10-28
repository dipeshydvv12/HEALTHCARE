// backend/src/routes/twilioRoutes.ts
import { Router, Request, Response } from 'express';
import { initiateVoiceCall, buildTwimlXml } from '../services/twilioService.js';

export const twilioRouter = Router();

// POST /api/twilio/call - Trigger voice reminder call
twilioRouter.post('/call', async (req: Request, res: Response) => {
  const { to, patientName, message, taskType, providerName } = req.body;

  if (!to || !patientName) {
    return res.status(400).json({
      success: false,
      message: 'Parameters "to" and "patientName" are required.'
    });
  }

  const result = await initiateVoiceCall({
    to,
    patientName,
    message,
    taskType,
    providerName
  });

  if (result.success) {
    return res.status(200).json(result);
  } else {
    return res.status(500).json(result);
  }
});

// POST /api/twilio/twiml - Return TwiML XML dynamically
twilioRouter.all('/twiml', (req: Request, res: Response) => {
  const patientName = (req.query.patientName || req.body.patientName || 'Valued Patient') as string;
  const message = (req.query.message || req.body.message) as string | undefined;

  const xml = buildTwimlXml(patientName, message);
  res.type('text/xml');
  return res.send(xml);
});

// POST /api/twilio/test-call - Quick test call helper
twilioRouter.post('/test-call', async (req: Request, res: Response) => {
  const targetPhone = req.body.to || '+919528871260';
  const patientName = req.body.patientName || 'Dipesh Yadav';

  const result = await initiateVoiceCall({
    to: targetPhone,
    patientName,
    message: `Hello ${patientName}. This is an automated test reminder from EnsureCare Healthcare System. Your verification test is running successfully. Stay healthy.`
  });

  return res.status(result.success ? 200 : 500).json(result);
});
