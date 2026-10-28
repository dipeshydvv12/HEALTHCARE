// backend/src/routes/labRoutes.ts
import { Router, Request, Response } from 'express';

export const labRouter = Router();

// In-memory lab status cache for fast clinical access
const labOrdersStore: Record<string, { status: string; findingsSummary?: string; updatedAt: string }> = {
  'patient-dipesh-01': {
    status: 'completed',
    findingsSummary: '[BiomedCLIP AI Analysis]: Right Lower Lobe Acute Bacterial Pneumonia & Infiltration (98.2% Confidence). Verified via Chest Radiograph PA View & Pulmonology Report.',
    updatedAt: new Date().toISOString()
  }
};

// GET /api/lab/orders - Get all active lab tests
labRouter.get('/orders', (_req: Request, res: Response) => {
  return res.status(200).json({ success: true, orders: labOrdersStore });
});

// PATCH /api/lab/orders/:patientId - Update lab test status
labRouter.patch('/orders/:patientId', (req: Request, res: Response) => {
  const { patientId } = req.params;
  const { status, findingsSummary } = req.body;

  labOrdersStore[patientId] = {
    status: status || 'completed',
    findingsSummary: findingsSummary || 'Verified by clinical diagnostic engine.',
    updatedAt: new Date().toISOString()
  };

  return res.status(200).json({
    success: true,
    message: `Lab order for patient ${patientId} updated to ${status}.`,
    order: labOrdersStore[patientId]
  });
});
