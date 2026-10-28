// agentic_ai/src/pipelines/autonomousPipeline.ts
// End-to-end automated clinical inference pipeline for hospital decision support
import { ClinicalOrchestrator } from '../agents/clinicalOrchestrator.js';

export async function runAutomatedClinicalPipeline(params: {
  patientName: string;
  imageFileName: string;
  reportDocumentText: string;
}) {
  const orchestrator = new ClinicalOrchestrator();
  const dossier = await orchestrator.executeCareCycle({
    patientName: params.patientName,
    imageName: params.imageFileName,
    reportText: params.reportDocumentText
  });

  return dossier;
}
