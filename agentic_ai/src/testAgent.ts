// agentic_ai/src/testAgent.ts
// Test runner demonstrating the autonomous agentic AI diagnostic cycle
import { ClinicalOrchestrator } from './agents/clinicalOrchestrator.js';

async function main() {
  console.log('================================================================');
  console.log('🩺 ENSURECARE AGENTIC HEALTHCARE AI • DIAGNOSTIC CYCLE TEST');
  console.log('================================================================\n');

  const orchestrator = new ClinicalOrchestrator();

  const sampleCase = {
    patientName: 'Dipesh Yadav',
    imageName: 'chest_xray_pa_view_patient.png',
    reportText: `MODALITY: Digital Chest Radiograph (PA View) + Pulmonology Examination
PATIENT: Dipesh Yadav | AGE: 24 | STUDY ID: CXR-2026-9042
CLINICAL INDICATION: Productive cough with fever (102°F) and right pleuritic chest discomfort for 4 days.
RADIOGRAPH FINDINGS:
- Right lower lobe dense patchy air-space consolidation with visible air bronchograms.
- Costophrenic angles sharp, no pleural effusion.
- Cardiac silhouette and mediastinum normal.
IMPRESSION: Right lower lobe acute lobar pneumonia.`
  };

  const dossier = await orchestrator.executeCareCycle(sampleCase);

  console.log('\n✅ Multi-Agent Diagnostic Dossier Generated:');
  console.log(`- Patient:           ${dossier.patientName}`);
  console.log(`- Modality:          ${dossier.scanResult.modality}`);
  console.log(`- Model Architecture:${dossier.scanResult.selectedModel.name} (${dossier.scanResult.selectedModel.parameters})`);
  console.log(`- Benchmark Score:   ${dossier.scanResult.selectedModel.accuracy}`);
  console.log(`- Primary Finding:   ${dossier.scanResult.primaryPathology}`);
  console.log(`- Severity:          ${dossier.scanResult.severity}`);
  console.log(`- Saliency Region:   ${dossier.scanResult.heatmapCoordinates[0].label} (Intensity: ${dossier.scanResult.heatmapCoordinates[0].intensity})`);
  console.log(`- Bounding Box:      ${dossier.scanResult.boundingBox?.label}`);
  console.log(`- Confidence Score:  ${(dossier.confidenceScore * 100).toFixed(1)}%`);
  console.log('\n📊 Extracted Biomarkers:');
  dossier.reportResult.entities.forEach(e => {
    console.log(`  * ${e.name.padEnd(20)}: ${e.value} [${e.status.toUpperCase()}]`);
  });
  console.log(`\n🔍 Synthesis: ${dossier.crossModalSynthesis}`);
  console.log(`\n💊 Recommended Triage: ${dossier.finalClinicalTriage}`);
  console.log('\n================================================================');
  console.log('🎉 AGENTIC PIPELINE EXECUTION COMPLETED SUCCESSFULLY');
  console.log('================================================================');
}

main().catch(console.error);
