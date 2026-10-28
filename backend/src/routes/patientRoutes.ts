// backend/src/routes/patientRoutes.ts
import { Router, Request, Response } from 'express';
import { saveClinicalRecord, listAllRecords, getRecordsDir } from '../services/recordService.js';
import fs from 'fs';
import path from 'path';

export const patientRouter = Router();

// POST /api/records - Persist consultation visit record
patientRouter.post('/', (req: Request, res: Response) => {
  try {
    const record = req.body;
    if (!record || !record.patientName) {
      return res.status(400).json({ success: false, message: 'Invalid encounter record data.' });
    }

    const { jsonPath, mdPath } = saveClinicalRecord(record);
    return res.status(201).json({
      success: true,
      message: 'Consultation visit record successfully persisted to disk.',
      recordId: record.id,
      jsonPath,
      mdPath
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/records - List all saved encounter records
patientRouter.get('/', (_req: Request, res: Response) => {
  try {
    const records = listAllRecords();
    return res.status(200).json({ success: true, count: records.length, records });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/records/:id - Retrieve a specific record
patientRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const dir = getRecordsDir();
    const files = fs.readdirSync(dir).filter(f => f.startsWith(req.params.id) && f.endsWith('.json'));

    if (files.length === 0) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    const raw = fs.readFileSync(path.join(dir, files[0]), 'utf8');
    return res.status(200).json(JSON.parse(raw));
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
