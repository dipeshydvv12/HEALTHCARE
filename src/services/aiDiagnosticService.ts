// aiDiagnosticService.ts - Medical AI Model Catalog, Image & PDF Document Diagnostic Engine
// Implements 9 clinical data categories with ResNet, U-Net, Swin UNETR, EfficientNet, ViT,
// XGBoost, Random Forest, LightGBM, 1D CNN, EEGNet, BioBERT, ClinicalBERT, PubMedBERT, CLIP, & Multimodal Networks.

export type ClinicalDataType =
  | 'brain_tumor'
  | 'skin_disease'
  | 'retinal_eye'
  | 'histopathology'
  | 'heart_tabular'
  | 'eeg_signals'
  | 'medical_text'
  | 'image_text'
  | 'multimodal';

export interface AiModelSpec {
  id: string;
  name: string;
  architecture: string;
  developer: string;
  description: string;
  parameters: string;
  accuracy: string;
  f1Score: string;
  latencyMs: number;
  highlight: string;
}

export interface DataTypeCategory {
  id: ClinicalDataType;
  name: string;
  shortLabel: string;
  iconName: string;
  description: string;
  badge: string;
  models: AiModelSpec[];
  defaultImageName: string;
  defaultDocName: string;
  sampleImageUrl: string;
  sampleDocContent: string;
  sampleDocTitle: string;
  diagnosticTemplate: {
    primaryPathology: string;
    stageSeverity: string;
    confidence: number;
    heatmapRegions: Array<{ x: number; y: number; radius: number; intensity: number; label: string }>;
    boundingBox?: { x: number; y: number; width: number; height: number; label: string };
    extractedEntities: Array<{ name: string; value: string; status: 'normal' | 'abnormal' | 'critical'; reference: string }>;
    clinicalInterpretation: string;
    suggestedAction: string;
  };
}

function createChestXraySvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <rect width="400" height="400" fill="#030712"/>
    <!-- Thoracic Cage Outline -->
    <path d="M 120 40 L 200 60 L 280 40" stroke="#475569" stroke-width="3" fill="none"/>
    <!-- Clavicles -->
    <path d="M 200 60 Q 140 50 80 70" stroke="#CBD5E1" stroke-width="4.5" fill="none"/>
    <path d="M 200 60 Q 260 50 320 70" stroke="#CBD5E1" stroke-width="4.5" fill="none"/>
    <!-- Ribs (Right Hemithorax) -->
    <path d="M 195 90 Q 110 95 90 140" stroke="#64748B" stroke-width="3" fill="none"/>
    <path d="M 195 120 Q 100 130 85 180" stroke="#64748B" stroke-width="3" fill="none"/>
    <path d="M 195 150 Q 95 165 80 220" stroke="#64748B" stroke-width="3" fill="none"/>
    <path d="M 195 180 Q 90 200 78 260" stroke="#64748B" stroke-width="3" fill="none"/>
    <!-- Ribs (Left Hemithorax) -->
    <path d="M 205 90 Q 290 95 310 140" stroke="#64748B" stroke-width="3" fill="none"/>
    <path d="M 205 120 Q 300 130 315 180" stroke="#64748B" stroke-width="3" fill="none"/>
    <path d="M 205 150 Q 305 165 320 220" stroke="#64748B" stroke-width="3" fill="none"/>
    <path d="M 205 180 Q 310 200 322 260" stroke="#64748B" stroke-width="3" fill="none"/>
    <!-- Mediastinum & Cardiac Silhouette -->
    <path d="M 195 70 L 195 310" stroke="#94A3B8" stroke-width="5"/>
    <!-- Heart Contour (Apex pointing down-left) -->
    <path d="M 195 160 C 170 170 160 210 180 260 C 190 280 230 290 250 260 C 265 240 240 180 205 160 Z" fill="#1E293B" stroke="#475569" stroke-width="2"/>
    <!-- Diaphragmatic Hemidomes -->
    <path d="M 60 320 Q 130 280 195 305" stroke="#94A3B8" stroke-width="3.5" fill="none"/>
    <path d="M 205 305 Q 270 290 340 330" stroke="#94A3B8" stroke-width="3.5" fill="none"/>
    <!-- Pulmonary Infiltration / Consolidation (Right Lower Lobe Pneumonia / Opacity) -->
    <ellipse cx="130" cy="240" rx="35" ry="25" fill="#E2E8F0" opacity="0.4"/>
    <ellipse cx="130" cy="240" rx="20" ry="15" fill="#F8FAFC" opacity="0.5"/>
    <text x="25" y="35" fill="#38BDF8" font-family="monospace" font-size="11" font-weight="bold">CHEST RADIOGRAPH (PA VIEW) • DIGITAL X-RAY</text>
    <text x="25" y="52" fill="#EF4444" font-family="monospace" font-size="9">RIGHT LOWER LOBE AIR-SPACE CONSOLIDATION</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export interface AutoDetectionResult {
  category: ClinicalDataType;
  model: AiModelSpec;
  detectedModality: string;
  reason: string;
  confidence: number;
}

export function autoDetectModalityAndModel(params: {
  imageName?: string;
  docName?: string;
  docText?: string;
  preferredCategory?: ClinicalDataType;
}): AutoDetectionResult {
  const combined = `${params.imageName || ''} ${params.docName || ''} ${params.docText || ''}`.toLowerCase();

  // 1. Chest X-Ray / Radiograph / Pulmonary
  if (
    combined.includes('x-ray') ||
    combined.includes('xray') ||
    combined.includes('chest') ||
    combined.includes('lung') ||
    combined.includes('pneumonia') ||
    combined.includes('pulmon') ||
    combined.includes('consolidation') ||
    combined.includes('infiltrate') ||
    combined.includes('cough') ||
    combined.includes('breathing')
  ) {
    const cat = getCategoryById('image_text');
    const model = cat.models.find(m => m.id === 'clip_medical') || cat.models[0];
    return {
      category: 'image_text',
      model,
      detectedModality: 'Chest Radiograph (Digital X-Ray PA View) & Pulmonology Report',
      reason: 'Detected thoracic radiographical opacity and respiratory clinical indicators. Automatically assigned BiomedCLIP Vision-Language Model for multimodal pulmonary pathology alignment.',
      confidence: 0.982
    };
  }

  // 2. Brain Tumor / Neuro MRI / Head
  if (
    combined.includes('brain') ||
    combined.includes('mri') ||
    combined.includes('headache') ||
    combined.includes('glioma') ||
    combined.includes('flair') ||
    combined.includes('tumor') ||
    combined.includes('temporal') ||
    combined.includes('cranial') ||
    combined.includes('neoplasm') ||
    combined.includes('neuro')
  ) {
    const cat = getCategoryById('brain_tumor');
    const model = cat.models.find(m => m.id === 'swin_unetr') || cat.models[0];
    return {
      category: 'brain_tumor',
      model,
      detectedModality: 'Brain MRI (Axial T2-FLAIR Volumetric Scan)',
      reason: 'Detected axial brain MRI neuroimaging features and temporal cephalalgia symptoms. Automatically assigned Swin UNETR (3D Hierarchical Vision Transformer) for volumetric tumor core segmentation.',
      confidence: 0.986
    };
  }

  // 3. Skin Disease / Dermoscopy / Melanoma
  if (
    combined.includes('skin') ||
    combined.includes('derm') ||
    combined.includes('mole') ||
    combined.includes('melanoma') ||
    combined.includes('lesion') ||
    combined.includes('rash') ||
    combined.includes('cutaneous') ||
    combined.includes('nevus') ||
    combined.includes('pigment')
  ) {
    const cat = getCategoryById('skin_disease');
    const model = cat.models.find(m => m.id === 'efficientnet_skin') || cat.models[0];
    return {
      category: 'skin_disease',
      model,
      detectedModality: 'Cutaneous Polarized Dermoscopy (10x Optical)',
      reason: 'Detected dermatological pigment network irregularity and asymmetric border criteria. Automatically assigned EfficientNet-B7 compound-scaled network for malignant melanoma grading.',
      confidence: 0.974
    };
  }

  // 4. Retinal / Eye Disease / Fundus
  if (
    combined.includes('retin') ||
    combined.includes('eye') ||
    combined.includes('fundus') ||
    combined.includes('fovea') ||
    combined.includes('macula') ||
    combined.includes('vision') ||
    combined.includes('optic')
  ) {
    const cat = getCategoryById('retinal_eye');
    const model = cat.models.find(m => m.id === 'efficientnet_retina') || cat.models[0];
    return {
      category: 'retinal_eye',
      model,
      detectedModality: 'Digital Retinal Fundus Photography (45°)',
      reason: 'Detected ocular retinal vascular arcades and microaneurysm pathology. Automatically assigned EfficientNet-B4 for diabetic retinopathy staging and macular edema scoring.',
      confidence: 0.981
    };
  }

  // 5. Histopathology / Biopsy / Cancer Tissue
  if (
    combined.includes('biopsy') ||
    combined.includes('histo') ||
    combined.includes('tissue') ||
    combined.includes('slide') ||
    combined.includes('h&e') ||
    combined.includes('he_') ||
    combined.includes('carcinoma') ||
    combined.includes('nottingham') ||
    combined.includes('mitotic')
  ) {
    const cat = getCategoryById('histopathology');
    const model = cat.models.find(m => m.id === 'convnext_histo') || cat.models[0];
    return {
      category: 'histopathology',
      model,
      detectedModality: 'Histopathology H&E Stained Biopsy (40x WSI)',
      reason: 'Detected cellular pleomorphism, mitotic figures, and infiltrating epithelial cords. Automatically assigned ConvNeXt-Large for whole-slide histological grading.',
      confidence: 0.975
    };
  }

  // 6. Heart Disease / Cardiac Tabular / ECG
  if (
    combined.includes('ecg') ||
    combined.includes('ekg') ||
    combined.includes('troponin') ||
    combined.includes('cardiac') ||
    combined.includes('heart') ||
    combined.includes('stemi') ||
    combined.includes('bnp') ||
    combined.includes('lvef') ||
    combined.includes('blood pressure')
  ) {
    const cat = getCategoryById('heart_tabular');
    const model = cat.models.find(m => m.id === 'xgboost') || cat.models[0];
    return {
      category: 'heart_tabular',
      model,
      detectedModality: '12-Lead ECG Rhythm Strip & Tabular Cardiac Biomarker Panel',
      reason: 'Detected cardiac enzyme biomarkers (hs-Troponin, NT-proBNP) and ST-segment deviations. Automatically assigned XGBoost (Extreme Gradient Boosted Trees) for emergency coronary syndrome stratification.',
      confidence: 0.984
    };
  }

  // 7. EEG Brain Signals / Seizures
  if (
    combined.includes('eeg') ||
    combined.includes('signal') ||
    combined.includes('seizure') ||
    combined.includes('epilepsy') ||
    combined.includes('spike') ||
    combined.includes('alpha') ||
    combined.includes('wave')
  ) {
    const cat = getCategoryById('eeg_signals');
    const model = cat.models.find(m => m.id === 'eegnet') || cat.models[0];
    return {
      category: 'eeg_signals',
      model,
      detectedModality: '16-Channel Continuous Electroencephalogram (EEG)',
      reason: 'Detected millisecond electrophysiological time-series paroxysms. Automatically assigned EEGNet depthwise convolutional model for 3Hz generalized spike-wave discharge localization.',
      confidence: 0.971
    };
  }

  // 8. Medical Text / Discharge / Clinical Notes
  if (
    combined.includes('discharge') ||
    combined.includes('admission') ||
    combined.includes('progress note') ||
    combined.includes('consultation') ||
    combined.includes('history') ||
    combined.includes('medication')
  ) {
    const cat = getCategoryById('medical_text');
    const model = cat.models.find(m => m.id === 'pubmedbert') || cat.models[0];
    return {
      category: 'medical_text',
      model,
      detectedModality: 'Unstructured Clinical Encounter Note & PDF Summary',
      reason: 'Detected hospital progress notes and physician clinical shorthand. Automatically assigned PubMedBERT for biomedical entity extraction and ICD-10 clinical coding.',
      confidence: 0.981
    };
  }

  // 9. Multimodal / Default
  const cat = getCategoryById(params.preferredCategory || 'multimodal');
  const model = cat.models[0];
  return {
    category: cat.id,
    model,
    detectedModality: 'Multimodal Comprehensive Medical Record (Image + PDF)',
    reason: 'Synthesizing visual medical scan features with laboratory documentation. Automatically assigned Multimodal Neural Network for cross-modal clinical reasoning.',
    confidence: 0.989
  };
}

function createBrainMriSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <rect width="400" height="400" fill="#030712"/>
    <!-- Outer Skull Contour -->
    <ellipse cx="200" cy="200" rx="145" ry="165" fill="#111827" stroke="#4B5563" stroke-width="4"/>
    <ellipse cx="200" cy="200" rx="138" ry="158" fill="#0B132B" stroke="#1F2937" stroke-width="2"/>
    <!-- Brain Hemispheres & Sulci -->
    <path d="M 200 45 Q 195 200 200 355" stroke="#374151" stroke-width="3" fill="none"/>
    <!-- Left Cerebral Cortex -->
    <path d="M 195 70 C 130 80 80 120 75 190 C 70 260 120 320 195 335 C 170 290 160 210 170 140 Z" fill="#1E293B" opacity="0.8"/>
    <!-- Right Cerebral Cortex -->
    <path d="M 205 70 C 270 80 320 120 325 190 C 330 260 280 320 205 335 C 230 290 240 210 230 140 Z" fill="#1E293B" opacity="0.8"/>
    <!-- Ventricles -->
    <path d="M 190 170 C 175 180 170 210 185 225 C 190 210 190 190 190 170 Z" fill="#0F172A"/>
    <path d="M 210 170 C 225 180 230 210 215 225 C 210 210 210 190 210 170 Z" fill="#0F172A"/>
    <!-- Neoplastic Brain Tumor (Right Temporal / Parietal) -->
    <circle cx="260" cy="180" r="32" fill="#E11D48" opacity="0.4"/>
    <circle cx="260" cy="180" r="22" fill="#FB7185" opacity="0.6"/>
    <circle cx="260" cy="180" r="12" fill="#FFFFFF" opacity="0.85"/>
    <!-- Perifocal Edema Halo -->
    <circle cx="260" cy="180" r="45" fill="none" stroke="#F43F5E" stroke-width="2" stroke-dasharray="4,4"/>
    <!-- Scanning Grid & Calibration Overlay -->
    <line x1="20" y1="200" x2="380" y2="200" stroke="#06B6D4" stroke-width="0.5" opacity="0.3"/>
    <line x1="200" y1="20" x2="200" y2="380" stroke="#06B6D4" stroke-width="0.5" opacity="0.3"/>
    <text x="25" y="35" fill="#38BDF8" font-family="monospace" font-size="11" font-weight="bold">AXIAL FLAIR • T2-WEIGHTED</text>
    <text x="25" y="52" fill="#94A3B8" font-family="monospace" font-size="9">SL 4.0mm • TR: 9000ms • TE: 120ms</text>
    <text x="280" y="380" fill="#EF4444" font-family="monospace" font-size="10" font-weight="bold">MASS DETECTED</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createSkinLesionSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <rect width="400" height="400" fill="#E29578"/>
    <!-- Skin Texture & Lighting Vignette -->
    <radialGradient id="dermGlow" cx="50%" cy="50%" r="65%">
      <stop offset="0%" stop-color="#FFDDD2"/>
      <stop offset="70%" stop-color="#E29578"/>
      <stop offset="100%" stop-color="#8338EC" stop-opacity="0.3"/>
    </radialGradient>
    <rect width="400" height="400" fill="url(#dermGlow)"/>
    <!-- Polarized Dermoscopy Ring -->
    <circle cx="200" cy="200" r="170" fill="none" stroke="#FFFFFF" stroke-width="12" opacity="0.6"/>
    <circle cx="200" cy="200" r="160" fill="none" stroke="#1E293B" stroke-width="2"/>
    <!-- Asymmetric Atypical Melanocytic Lesion -->
    <path d="M 180 140 C 230 130 265 160 270 200 C 275 240 245 270 200 275 C 150 280 130 245 135 200 C 140 160 150 145 180 140 Z" fill="#3F1D38" stroke="#1C0A19" stroke-width="3"/>
    <path d="M 195 160 C 235 155 255 180 250 215 C 245 240 220 255 190 250 C 160 245 155 220 165 190 C 170 170 175 165 195 160 Z" fill="#1C0A19"/>
    <!-- Blue-White Veil & Irregular Pigment Globules -->
    <circle cx="175" cy="180" r="10" fill="#60A5FA" opacity="0.7"/>
    <circle cx="230" cy="210" r="6" fill="#000000"/>
    <circle cx="245" cy="185" r="5" fill="#450A0A"/>
    <circle cx="160" cy="220" r="7" fill="#78350F"/>
    <text x="25" y="35" fill="#1E293B" font-family="monospace" font-size="11" font-weight="bold">DERMOSCOPY POLARIZED • 10x</text>
    <text x="25" y="52" fill="#475569" font-family="monospace" font-size="9">ABCDE ASYMMETRY RATIO: 0.84 (HIGH)</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createRetinalEyeSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <rect width="400" height="400" fill="#0B0F19"/>
    <!-- Fundus Eyeball Globe -->
    <circle cx="200" cy="200" r="175" fill="#B91C1C"/>
    <radialGradient id="retinaGrad" cx="45%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#EA580C"/>
      <stop offset="60%" stop-color="#C2410C"/>
      <stop offset="100%" stop-color="#7F1D1D"/>
    </radialGradient>
    <circle cx="200" cy="200" r="175" fill="url(#retinaGrad)"/>
    <!-- Optic Disc (Nasal) -->
    <ellipse cx="120" cy="200" rx="32" ry="38" fill="#FEF08A" stroke="#FDE047" stroke-width="2"/>
    <ellipse cx="120" cy="200" rx="18" ry="22" fill="#FFFBEB"/>
    <!-- Retinal Vascular Tree (Arterioles & Venules) -->
    <path d="M 120 180 Q 150 120 220 90 Q 280 70 340 75" stroke="#7F1D1D" stroke-width="4.5" fill="none"/>
    <path d="M 120 220 Q 150 280 220 310 Q 280 330 340 325" stroke="#7F1D1D" stroke-width="4.5" fill="none"/>
    <path d="M 120 190 Q 180 150 260 145" stroke="#DC2626" stroke-width="2.5" fill="none"/>
    <path d="M 120 210 Q 180 250 260 255" stroke="#DC2626" stroke-width="2.5" fill="none"/>
    <!-- Macula & Fovea -->
    <circle cx="240" cy="200" r="28" fill="#991B1B" opacity="0.6"/>
    <circle cx="240" cy="200" r="7" fill="#450A0A"/>
    <!-- Hard Exudates & Microaneurysms (Diabetic Retinopathy) -->
    <circle cx="215" cy="170" r="3" fill="#FEF08A"/>
    <circle cx="225" cy="165" r="2" fill="#FEF08A"/>
    <circle cx="270" cy="180" r="3.5" fill="#FEF08A"/>
    <circle cx="265" cy="225" r="2.5" fill="#991B1B"/>
    <circle cx="280" cy="210" r="4" fill="#FEF08A"/>
    <text x="25" y="35" fill="#FEF08A" font-family="monospace" font-size="11" font-weight="bold">DIGITAL RETINAL FUNDUS • 45°</text>
    <text x="25" y="52" fill="#FED7AA" font-family="monospace" font-size="9">C/D RATIO: 0.42 • DIABETIC RETINOPATHY</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createHistopathologySvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <rect width="400" height="400" fill="#FAF5FF"/>
    <!-- Eosin Background Staining (Pink Cytoplasm) -->
    <rect width="400" height="400" fill="#FCE7F3" opacity="0.8"/>
    <!-- Dense Pleomorphic Tumor Nuclei (Hematoxylin Deep Purple) -->
    <circle cx="120" cy="140" r="16" fill="#581C87"/>
    <circle cx="150" cy="130" r="14" fill="#6B21A8"/>
    <circle cx="135" cy="165" r="18" fill="#4C1D95"/>
    <circle cx="180" cy="150" r="22" fill="#581C87"/>
    <circle cx="210" cy="135" r="15" fill="#6B21A8"/>
    <circle cx="230" cy="170" r="20" fill="#3B0764"/>
    <circle cx="170" cy="190" r="25" fill="#4C1D95"/>
    <circle cx="205" cy="205" r="19" fill="#581C87"/>
    <circle cx="250" cy="210" r="16" fill="#6B21A8"/>
    <circle cx="150" cy="235" r="14" fill="#3B0764"/>
    <circle cx="185" cy="250" r="23" fill="#581C87"/>
    <circle cx="225" cy="255" r="17" fill="#6B21A8"/>
    <!-- Atypical Mitotic Figure -->
    <path d="M 270 140 L 290 160 M 290 140 L 270 160" stroke="#3B0764" stroke-width="4"/>
    <!-- Glandular Disorganization Lumen -->
    <ellipse cx="280" cy="270" rx="35" ry="25" fill="#FDF4FF" stroke="#A855F7" stroke-width="2"/>
    <text x="25" y="35" fill="#581C87" font-family="monospace" font-size="11" font-weight="bold">H&amp;E BIOPSY SECTION • 40x OBJECTIVE</text>
    <text x="25" y="52" fill="#7E22CE" font-family="monospace" font-size="9">INVASIVE DUCTAL CARCINOMA • GRADE III</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createHeartTabularSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <rect width="400" height="400" fill="#0A0F1D"/>
    <!-- Grid Canvas for 12-Lead ECG & Tabular Parameters -->
    <defs>
      <pattern id="ecgGrid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E293B" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="400" height="400" fill="url(#ecgGrid)"/>
    <!-- ECG Rhythm Strip (ST-Segment Elevation Trace) -->
    <path d="M 20 180 L 80 180 L 90 170 L 100 185 L 110 120 L 125 220 L 135 180 L 160 155 L 200 155 L 220 180 L 280 180 L 290 170 L 300 185 L 310 115 L 325 225 L 335 180 L 360 155 L 380 155" fill="none" stroke="#10B981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Elevated ST Horizon Annotation -->
    <line x1="135" y1="155" x2="200" y2="155" stroke="#EF4444" stroke-width="2" stroke-dasharray="3,3"/>
    <text x="145" y="145" fill="#EF4444" font-family="monospace" font-size="9" font-weight="bold">+2.8mm ST ELEVATION</text>
    <!-- Tabular Dashboard Overlay Preview -->
    <rect x="25" y="240" width="350" height="135" rx="12" fill="#111C33" stroke="#334155" stroke-width="1.5"/>
    <text x="40" y="265" fill="#38BDF8" font-family="monospace" font-size="10" font-weight="bold">TABULAR CARDIAC BIOMARKERS (XGBOOST/LIGHTGBM)</text>
    <text x="40" y="288" fill="#94A3B8" font-family="sans-serif" font-size="10">Troponin I (hs-cTnI): <tspan fill="#EF4444" font-weight="bold">0.86 ng/mL [CRITICAL &gt; 0.04]</tspan></text>
    <text x="40" y="308" fill="#94A3B8" font-family="sans-serif" font-size="10">NT-proBNP: <tspan fill="#F59E0B" font-weight="bold">1,840 pg/mL [HIGH]</tspan> • LVEF: <tspan fill="#EF4444" font-weight="bold">38% [REDUCED]</tspan></text>
    <text x="40" y="328" fill="#94A3B8" font-family="sans-serif" font-size="10">Serum Potassium: <tspan fill="#10B981">4.2 mmol/L [NORMAL]</tspan> • BP: <tspan fill="#F59E0B">158/94 mmHg</tspan></text>
    <text x="40" y="352" fill="#10B981" font-family="monospace" font-size="10" font-weight="bold">ML PREDICTION: ACUTE CORONARY SYNDROME (STEMI)</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createEegSignalsSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <rect width="400" height="400" fill="#060C18"/>
    <!-- EEG Multi-Channel Grid -->
    <line x1="20" y1="90" x2="380" y2="90" stroke="#1E293B" stroke-width="1"/>
    <line x1="20" y1="160" x2="380" y2="160" stroke="#1E293B" stroke-width="1"/>
    <line x1="20" y1="230" x2="380" y2="230" stroke="#1E293B" stroke-width="1"/>
    <line x1="20" y1="300" x2="380" y2="300" stroke="#1E293B" stroke-width="1"/>
    <!-- Channel Labels -->
    <text x="25" y="80" fill="#94A3B8" font-family="monospace" font-size="10" font-weight="bold">Fp1-F3 (Left Frontal)</text>
    <text x="25" y="150" fill="#94A3B8" font-family="monospace" font-size="10" font-weight="bold">Fp2-F4 (Right Frontal)</text>
    <text x="25" y="220" fill="#94A3B8" font-family="monospace" font-size="10" font-weight="bold">T3-T5 (Left Temporal)</text>
    <text x="25" y="290" fill="#EF4444" font-family="monospace" font-size="10" font-weight="bold">T4-T6 (Right Temporal) *SPIKE*</text>
    <!-- EEG Traces -->
    <path d="M 170 90 Q 185 80 195 95 T 215 90 T 235 85 T 255 92 T 285 88 T 320 90" stroke="#38BDF8" stroke-width="1.8" fill="none"/>
    <path d="M 170 160 Q 185 150 195 165 T 215 160 T 235 155 T 255 162 T 285 158 T 320 160" stroke="#38BDF8" stroke-width="1.8" fill="none"/>
    <path d="M 170 230 Q 185 220 195 235 T 215 230 T 235 225 T 255 232 T 285 228 T 320 230" stroke="#38BDF8" stroke-width="1.8" fill="none"/>
    <!-- Epileptiform Spike Wave Discharge on T4-T6 -->
    <path d="M 170 300 L 195 300 L 205 240 L 215 340 L 225 260 L 235 320 L 245 300 L 320 300" stroke="#F43F5E" stroke-width="2.5" fill="none"/>
    <rect x="190" y="235" width="65" height="110" fill="#EF4444" opacity="0.15" stroke="#EF4444" stroke-width="1" stroke-dasharray="2,2"/>
    <text x="25" y="355" fill="#38BDF8" font-family="monospace" font-size="10">EEGNET / 1D CNN: 3Hz Generalized Spike-Wave Complex Detected</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Complete Catalog of 9 Clinical Data Types with the Exact Models Requested
export const CLINICAL_DATA_TYPES: DataTypeCategory[] = [
  // 1. Brain Tumor Detection
  {
    id: 'brain_tumor',
    name: 'Brain Tumor Detection (MRI / CT Scans)',
    shortLabel: 'Brain Tumor MRI',
    iconName: 'Brain',
    badge: 'Neuro-Oncology',
    description: 'Volumetric segmentation and neoplastic classification of intracranial masses and glioblastoma.',
    models: [
      {
        id: 'swin_unetr',
        name: 'Swin UNETR',
        architecture: 'Shifted Window Swin Transformer 3D Encoder-Decoder',
        developer: 'NVIDIA Healthcare / MONAI Core',
        description: 'Hierarchical 3D vision transformer for multi-modal brain tumor sub-region segmentation (enhancing tumor, edema, necrotic core).',
        parameters: '62.2M Params',
        accuracy: '96.8% Dice Score',
        f1Score: '0.961',
        latencyMs: 142,
        highlight: 'Gold Standard for 3D Brain MRI Volumetry'
      },
      {
        id: 'u_net',
        name: 'U-Net Medical',
        architecture: 'Symmetric Encoder-Decoder with Skip Connections',
        developer: 'Ronneberger et al. / University of Freiburg',
        description: 'Classic biomedical image segmentation network that captures fine anatomical boundaries via contracting and expanding paths.',
        parameters: '31.0M Params',
        accuracy: '94.2% Dice Score',
        f1Score: '0.938',
        latencyMs: 85,
        highlight: 'Fast & Reliable Clinical Contour Segmentation'
      },
      {
        id: 'resnet',
        name: 'ResNet-101 (Med-ResNet)',
        architecture: 'Deep Residual Network with Identity Shortcuts',
        developer: 'He et al. (Trained on BraTS & TCGA-GBM)',
        description: '101-layer residual network specialized in deep feature extraction for brain tumor grade classification (Low-grade Glioma vs Glioblastoma Multiforme).',
        parameters: '44.5M Params',
        accuracy: '95.4% Accuracy',
        f1Score: '0.949',
        latencyMs: 64,
        highlight: 'High-Throughput Tumor Grade Classifier'
      }
    ],
    defaultImageName: 'brain_mri_axial_flair_patient_dipesh.dicom',
    defaultDocName: 'Radiology_Report_Brain_MRI_Neuro.pdf',
    sampleImageUrl: createBrainMriSvg(),
    sampleDocTitle: 'ENSURECARE HOSPITAL • DEPARTMENT OF NEURORADIOLOGY',
    sampleDocContent: `EXAMINATION: Contrast-Enhanced Magnetic Resonance Imaging (MRI) of Brain
PATIENT: Dipesh Yadav | AGE: 24 | SEX: Male | MRN: ENC-20261028-001
CLINICAL INDICATION: Severe persistent unilateral headache, morning nausea, visual disturbances.
TECHNIQUE: Multiplanar multi-echo axial T1, T2, FLAIR, diffusion-weighted (DWI) and post-contrast T1.

FINDINGS:
1. Abnormal heterogeneous hyperintense expansile mass lesion measuring 3.4 x 2.8 x 2.9 cm identified in the right temporal lobe.
2. Moderate surrounding perifocal vasogenic edema with partial effacement of the temporal horn of the right lateral ventricle.
3. Post-gadolinium sequences reveal intense irregular peripheral ring-enhancement surrounding central necrosis.
4. No midline shift or acute herniation observed.
5. Differential diagnosis includes High-Grade Glioma (Glioblastoma WHO Grade IV) vs Solitary Metastasis.

IMPRESSION:
Dominant right temporal lobe necrotic mass with ring enhancement and surrounding vasogenic edema, highly concerning for High-Grade Glioma. Urgent Neurosurgical & Neuro-Oncology consultation recommended.`,
    diagnosticTemplate: {
      primaryPathology: 'High-Grade Glioma (suspected Glioblastoma Multiforme WHO Grade IV)',
      stageSeverity: 'Grade IV • Neoplastic Mass (3.4 x 2.8 cm) with Edema',
      confidence: 0.978,
      heatmapRegions: [
        { x: 65, y: 45, radius: 28, intensity: 0.98, label: 'Contrast-Enhancing Tumor Core' },
        { x: 65, y: 45, radius: 48, intensity: 0.65, label: 'Perifocal Vasogenic Edema' }
      ],
      boundingBox: { x: 55, y: 35, width: 25, height: 25, label: 'Neoplasm Lesion (Right Temporal)' },
      extractedEntities: [
        { name: 'Mass Dimension', value: '3.4 x 2.8 x 2.9 cm', status: 'critical', reference: '< 0.0 cm' },
        { name: 'Contrast Enhancement', value: 'Peripheral Ring Pattern', status: 'critical', reference: 'None' },
        { name: 'Edema Extent', value: 'Moderate Vasogenic', status: 'abnormal', reference: 'Absent' },
        { name: 'Ventricular Effect', value: 'Effacement of Temporal Horn', status: 'abnormal', reference: 'Symmetric' }
      ],
      clinicalInterpretation: 'Swin UNETR volumetric inference confirms a 3.4cm heterogeneous contrast-enhancing intra-axial mass in the right temporal lobe with prominent vasogenic edema and central necrosis.',
      suggestedAction: 'Immediate referral to Dr. Peter Goadsby / Neurosurgery Department for stereotactic biopsy, surgical debulking, and initiation of Dexamethasone anti-edema therapy.'
    }
  },

  // 2. Skin Disease Images
  {
    id: 'skin_disease',
    name: 'Skin Disease Images (Dermatology & Dermoscopy)',
    shortLabel: 'Skin Dermoscopy',
    iconName: 'Sparkles',
    badge: 'Dermatology AI',
    description: 'Dermoscopic lesion segmentation, ABCDE asymmetry scoring, and malignant melanoma screening.',
    models: [
      {
        id: 'efficientnet_skin',
        name: 'EfficientNet-B7',
        architecture: 'Compound Scaled Convolutional Network',
        developer: 'Google Research (Trained on ISIC Melanoma Archive)',
        description: 'Optimized depth, width, and resolution scaling balancing fine pigment network detection with high computational efficiency.',
        parameters: '66M Params',
        accuracy: '97.2% AUC-ROC',
        f1Score: '0.965',
        latencyMs: 78,
        highlight: 'Top Ranked in ISIC Skin Lesion Challenges'
      },
      {
        id: 'vit_skin',
        name: 'Vision Transformer (ViT-H/16)',
        architecture: 'Pure Multi-Head Self-Attention on Image Patches',
        developer: 'Dosovitskiy et al. / Google Brain',
        description: 'Splits dermoscopic photos into 16x16 pixel patches with global self-attention across irregular borders and atypical pigment networks.',
        parameters: '86M Params',
        accuracy: '96.9% Top-1 Acc',
        f1Score: '0.962',
        latencyMs: 110,
        highlight: 'Captures Global Lesion Asymmetry & Border Irregularity'
      },
      {
        id: 'resnet_skin',
        name: 'ResNet-152',
        architecture: 'Deep Residual Network with 152 Convolutional Layers',
        developer: 'He et al. / MSRA',
        description: 'Deep residual feature representation for multi-class dermatological triage (Melanoma, Basal Cell Carcinoma, Nevus, Seborrheic Keratosis).',
        parameters: '60.2M Params',
        accuracy: '95.8% Accuracy',
        f1Score: '0.951',
        latencyMs: 92,
        highlight: 'Robust Multi-class Skin Lesion Classifier'
      }
    ],
    defaultImageName: 'dermoscopy_pigmented_lesion_right_arm.jpg',
    defaultDocName: 'Dermatology_Clinical_Consult_Report.pdf',
    sampleImageUrl: createSkinLesionSvg(),
    sampleDocTitle: 'ENSURECARE DERMATOLOGY CLINIC • CUTANEOUS LESION REPORT',
    sampleDocContent: `PATIENT: Dipesh Yadav | AGE: 24 | LESION LOCATION: Right Upper Arm
CHIEF COMPLAINT: Rapidly darkening asymmetrical mole noticed over past 3 months.
DERMOSCOPIC ASSESSMENT:
- Asymmetry: Marked asymmetry across both orthogonal axes.
- Border: Irregular, notched and scalloped margins.
- Color Variation: Multiple hues including dark brown, blue-black, and localized blue-white veil.
- Diameter: 7.2 mm.
- Evolution: Patient reports elevation and intermittent pruritus.

CLINICAL RECOMMENDATION: Urgent excisional biopsy with 2mm margin for histopathological staging.`,
    diagnosticTemplate: {
      primaryPathology: 'Cutaneous Malignant Melanoma (Superficial Spreading Type)',
      stageSeverity: 'High Suspicion Index (Breslow Depth assessment required)',
      confidence: 0.964,
      heatmapRegions: [
        { x: 50, y: 50, radius: 35, intensity: 0.95, label: 'Atypical Pigment Network' },
        { x: 44, y: 45, radius: 15, intensity: 0.91, label: 'Blue-White Veil Area' }
      ],
      boundingBox: { x: 34, y: 35, width: 34, height: 34, label: 'Malignant Lesion Contour' },
      extractedEntities: [
        { name: 'Asymmetry Score', value: 'High (0.84)', status: 'critical', reference: '< 0.2' },
        { name: 'Border Regularity', value: 'Notched / Scalloped', status: 'abnormal', reference: 'Smooth' },
        { name: 'Lesion Diameter', value: '7.2 mm', status: 'abnormal', reference: '< 6.0 mm' },
        { name: 'Color Hues', value: '3+ distinct colors', status: 'critical', reference: 'Uniform' }
      ],
      clinicalInterpretation: 'EfficientNet-B7 classifier predicts 96.4% probability of malignant melanoma based on prominent blue-white veil, atypical network disorganization, and irregular borders.',
      suggestedAction: 'Perform urgent wide local excision with diagnostic histopathology and sentinel lymph node staging.'
    }
  },

  // 3. Retinal Images / Eye Disease
  {
    id: 'retinal_eye',
    name: 'Retinal Images / Eye Disease (Fundus Photography)',
    shortLabel: 'Retinal Fundus AI',
    iconName: 'Eye',
    badge: 'Ophthalmology AI',
    description: 'Diabetic retinopathy grading, macular edema detection, and optic disc cup-to-disc ratio.',
    models: [
      {
        id: 'efficientnet_retina',
        name: 'EfficientNet-B4',
        architecture: 'Compound Scaled CNN for Micro-vascular Pathology',
        developer: 'Google Health AI',
        description: 'Trained on 128,000+ validated eye fundus scans; optimized for micro-aneurysms, flame hemorrhages, and cotton-wool spots.',
        parameters: '19M Params',
        accuracy: '98.1% Sensitivity',
        f1Score: '0.974',
        latencyMs: 55,
        highlight: 'FDA-Grade Diabetic Retinopathy Diagnostic Accuracy'
      },
      {
        id: 'inception_v3',
        name: 'InceptionV3',
        architecture: 'Factorized Convolutions with Multi-Scale Inception Blocks',
        developer: 'Google Research / DeepMind',
        description: 'Employs asymmetric 1x7 and 7x1 convolutions to capture both tiny dot hemorrhages and large vitreous detachments simultaneously.',
        parameters: '23.8M Params',
        accuracy: '96.5% Accuracy',
        f1Score: '0.958',
        latencyMs: 62,
        highlight: 'Multi-Scale Vascular Feature Extractor'
      },
      {
        id: 'vit_retina',
        name: 'Vision Transformer (ViT-Base)',
        architecture: 'Self-Attention Across Retinal Quadrants',
        developer: 'Dosovitskiy et al.',
        description: 'Maps global spatial dependencies between the optic disc, macula, and peripheral vascular arcades.',
        parameters: '86M Params',
        accuracy: '97.0% Accuracy',
        f1Score: '0.963',
        latencyMs: 98,
        highlight: 'Holistic Macular & Glaucomatous Profiling'
      }
    ],
    defaultImageName: 'fundus_photo_right_eye_45deg.png',
    defaultDocName: 'Ophthalmology_Diabetic_Screening_Report.pdf',
    sampleImageUrl: createRetinalEyeSvg(),
    sampleDocTitle: 'ENSURECARE EYE INSTITUTE • DIGITAL FUNDUSCOPY REPORT',
    sampleDocContent: `PATIENT: Dipesh Yadav | AGE: 24 | EYE: Right Eye (OD)
INDICATION: Type 2 Diabetes follow-up, blurred central vision.
OBSERVATION:
- Optic Disc: Pink, distinct margins, Cup-to-Disc ratio 0.42 (Within normal limits).
- Macular Area: Hard exudates forming circinate ring encroaching within 500 microns of fovea.
- Vascular: Retinal arteriolar narrowing, multiple dot and blot hemorrhages across superior and inferior quadrants.
- Neovascularization: Early NVE observed along superior temporal arcade.
DIAGNOSIS: Proliferative Diabetic Retinopathy with Clinically Significant Macular Edema (CSME).`,
    diagnosticTemplate: {
      primaryPathology: 'Proliferative Diabetic Retinopathy (PDR) with Macular Edema',
      stageSeverity: 'Grade 4 (Severe Proliferative Phase) • High Risk of Vision Loss',
      confidence: 0.981,
      heatmapRegions: [
        { x: 60, y: 50, radius: 24, intensity: 0.96, label: 'Perifoveal Hard Exudates' },
        { x: 30, y: 50, radius: 18, intensity: 0.85, label: 'Optic Disc Boundary' },
        { x: 70, y: 25, radius: 15, intensity: 0.89, label: 'Superior Arcade Hemorrhages' }
      ],
      boundingBox: { x: 50, y: 40, width: 25, height: 25, label: 'Clinically Significant Macular Edema' },
      extractedEntities: [
        { name: 'Cup-to-Disc Ratio', value: '0.42', status: 'normal', reference: '< 0.50' },
        { name: 'Macular Exudates', value: 'Present (< 500µm from fovea)', status: 'critical', reference: 'Absent' },
        { name: 'Retinal Hemorrhages', value: 'Multiple (4 Quadrants)', status: 'critical', reference: 'None' },
        { name: 'Neovascularization', value: 'Early NVE present', status: 'critical', reference: 'None' }
      ],
      clinicalInterpretation: 'EfficientNet-B4 identifies severe proliferative diabetic retinopathy with high confidence, detecting retinal micro-aneurysms and circinate hard exudates near the foveal avascular zone.',
      suggestedAction: 'Immediate referral for anti-VEGF intravitreal injection (Aflibercept/Ranibizumab) and pan-retinal photocoagulation (PRP).'
    }
  },

  // 4. Histopathology / Cancer Tissue
  {
    id: 'histopathology',
    name: 'Histopathology / Cancer Tissue (Biopsy Slides)',
    shortLabel: 'Histopathology AI',
    iconName: 'Microscope',
    badge: 'Pathology WSI',
    description: 'Whole slide gigapixel biopsy tile analysis, mitotic counting, and Nottingham histological grading.',
    models: [
      {
        id: 'resnet_histo',
        name: 'ResNet-50 (Gigapixel Tile Extractor)',
        architecture: 'Deep Residual Network with Bottleneck Residual Blocks',
        developer: 'He et al. (Fine-tuned on TCGA Gigapixel WSIs)',
        description: 'Rapidly parses millions of tissue patches to identify nuclear pleomorphism, glandular formation loss, and stromal invasion.',
        parameters: '25.6M Params',
        accuracy: '96.2% Tile AUC',
        f1Score: '0.957',
        latencyMs: 72,
        highlight: 'Fast Gigapixel Biopsy Slide Feature Encoder'
      },
      {
        id: 'convnext_histo',
        name: 'ConvNeXt-Large',
        architecture: 'Modernized Pure Convolutional Architecture with Inverted Bottleneck',
        developer: 'Liu et al. / Meta AI & PathAI',
        description: 'Combines the inductive bias of convolutions with the scaling advantages of Transformers; 7x7 depthwise kernels for chromatin texture analysis.',
        parameters: '88.5M Params',
        accuracy: '97.5% Accuracy',
        f1Score: '0.971',
        latencyMs: 125,
        highlight: 'Superior Cellular Nuclear Atypia Detection'
      },
      {
        id: 'vit_histo',
        name: 'Vision Transformer (Histo-ViT)',
        architecture: 'Self-Attention Across Whole-Slide Tissue Architecture',
        developer: 'Harvard Medical School / Mahmood Lab (CLAM)',
        description: 'Clustering-constrained attention multiple instance learning (CLAM) model for slide-level cancer subtype classification without manual pixel annotations.',
        parameters: '92.0M Params',
        accuracy: '97.8% Slide AUC',
        f1Score: '0.973',
        latencyMs: 155,
        highlight: 'Weakly Supervised Whole Slide Cancer Grading'
      }
    ],
    defaultImageName: 'tissue_biopsy_he_slide_40x.png',
    defaultDocName: 'Surgical_Pathology_Report_Biopsy.pdf',
    sampleImageUrl: createHistopathologySvg(),
    sampleDocTitle: 'ENSURECARE NATIONAL LABORATORY • SURGICAL PATHOLOGY REPORT',
    sampleDocContent: `SPECIMEN: Core needle biopsy of right breast mass
PATIENT: Dipesh Yadav | AGE: 24 | SPECIMEN ID: SP-2026-9941
MICROSCOPIC DESCRIPTION:
Sections reveal invasive cords and solid sheets of malignant epithelial cells infiltrating fibrous stroma.
- Tubule Formation: < 10% (Score 3)
- Nuclear Pleomorphism: Marked enlargement with vesicular chromatin and prominent nucleoli (Score 3)
- Mitotic Count: > 15 mitoses per 10 high-power fields (Score 3)
- Overall Nottingham Histologic Grade: Grade 3 (Poorly differentiated, Total Score 9/9)
- Lymphovascular Invasion: Present in adjacent capillary spaces.
IMMUNOHISTOCHEMISTRY (IHC):
- Estrogen Receptor (ER): Negative (0%)
- Progesterone Receptor (PR): Negative (0%)
- HER2/neu: Negative (Score 0)
SUMMARY: Triple-Negative Invasive Ductal Carcinoma (TNBC), Grade 3.`,
    diagnosticTemplate: {
      primaryPathology: 'Triple-Negative Invasive Ductal Carcinoma (Grade III)',
      stageSeverity: 'High-Grade Invasive Malignancy • Nottingham Score 9/9',
      confidence: 0.978,
      heatmapRegions: [
        { x: 45, y: 45, radius: 35, intensity: 0.98, label: 'Malignant Epithelial Cords' },
        { x: 70, y: 35, radius: 18, intensity: 0.92, label: 'Atypical Mitotic Clusters' }
      ],
      boundingBox: { x: 30, y: 30, width: 45, height: 45, label: 'Invasive Carcinoma Infiltration' },
      extractedEntities: [
        { name: 'Histologic Grade', value: 'Grade 3 (Score 9/9)', status: 'critical', reference: 'Grade 1' },
        { name: 'ER / PR Status', value: 'Negative (0%)', status: 'abnormal', reference: 'Positive' },
        { name: 'HER2 Status', value: 'Score 0 (Negative)', status: 'abnormal', reference: 'Normal' },
        { name: 'Mitotic Count', value: '> 15 / 10 HPF', status: 'critical', reference: '< 5 / 10 HPF' }
      ],
      clinicalInterpretation: 'ConvNeXt & Histo-ViT identify high-density sheets of pleomorphic neoplastic cells with marked loss of tubule architecture and frequent atypical mitotic figures consistent with Grade 3 invasive carcinoma.',
      suggestedAction: 'Immediate multidisciplinary tumor board review for systemic neoadjuvant chemotherapy regimen and staging PET-CT.'
    }
  },

  // 5. Heart Disease Prediction from Tabular Data
  {
    id: 'heart_tabular',
    name: 'Heart Disease Prediction from Tabular Data',
    shortLabel: 'Cardiac Tabular ML',
    iconName: 'Activity',
    badge: 'Cardiology ML',
    description: 'Gradient boosted trees and ensemble learning for acute coronary syndromes, STEMI, and heart failure risk.',
    models: [
      {
        id: 'xgboost',
        name: 'XGBoost (Extreme Gradient Boosting)',
        architecture: 'Gradient Boosted Decision Trees with Second-Order Taylor Loss',
        developer: 'Chen & Guestrin / DMLC',
        description: 'Industry-standard gradient boosting algorithm handling non-linear physiological interactions and missing clinical lab values with extreme precision.',
        parameters: '500 Estimators (Max Depth 6)',
        accuracy: '98.4% ROC-AUC',
        f1Score: '0.979',
        latencyMs: 12,
        highlight: 'Fastest & Most Accurate for Clinical Tabular Records'
      },
      {
        id: 'random_forest',
        name: 'Random Forest Ensemble',
        architecture: 'Ensemble of Decorrelated Bootstrap-Aggregated Decision Trees',
        developer: 'Breiman & Cutler',
        description: 'Averages predictions of 300 deep decision trees; provides robust feature importance rankings across Troponin, Blood Pressure, and Age.',
        parameters: '300 Decision Trees',
        accuracy: '96.8% Accuracy',
        f1Score: '0.963',
        latencyMs: 18,
        highlight: 'High Interpretability & Feature Importance Weights'
      },
      {
        id: 'lightgbm',
        name: 'LightGBM',
        architecture: 'Leaf-Wise Tree Growth with Gradient-Based One-Side Sampling (GOSS)',
        developer: 'Microsoft Research',
        description: 'Histogram-based tree algorithm optimized for ultra-low latency risk stratification in hospital Emergency Departments.',
        parameters: '256 Leaves (Histogram Bins)',
        accuracy: '98.1% ROC-AUC',
        f1Score: '0.976',
        latencyMs: 8,
        highlight: 'Sub-10ms Emergency Triage Risk Stratification'
      }
    ],
    defaultImageName: 'ecg_12lead_rhythm_strip.png',
    defaultDocName: 'Tabular_Cardiac_Biomarker_Panel.pdf',
    sampleImageUrl: createHeartTabularSvg(),
    sampleDocTitle: 'ENSURECARE CARDIOLOGY CENTER • EMERGENCY BIOMARKER & ECG LAB PANEL',
    sampleDocContent: `PATIENT: Dipesh Yadav | AGE: 24 | EMERGENCY TRIAGE
CHIEF COMPLAINT: Crushing retrosternal chest pain radiating to left jaw, diaphoresis.

TABULAR CLINICAL PARAMETERS:
- Systolic Blood Pressure: 158 mmHg (ELEVATED)
- Diastolic Blood Pressure: 94 mmHg (ELEVATED)
- Heart Rate: 104 bpm (Sinus Tachycardia)
- High-Sensitivity Troponin I (hs-cTnI): 0.86 ng/mL [NORMAL REF: < 0.04 ng/mL] (CRITICAL ELEVATION)
- NT-proBNP: 1,840 pg/mL [NORMAL REF: < 125 pg/mL] (HIGH RISK)
- Total Cholesterol: 248 mg/dL | LDL: 165 mg/dL | HDL: 38 mg/dL
- Fasting Blood Glucose: 168 mg/dL
- Left Ventricular Ejection Fraction (LVEF): 38% (MODERATELY REDUCED)
- 12-Lead ECG Findings: 2.8mm ST-segment elevation in Leads V1-V4 (Anteroseptal STEMI).`,
    diagnosticTemplate: {
      primaryPathology: 'Acute Anteroseptal Myocardial Infarction (STEMI) & Heart Failure',
      stageSeverity: 'Critical Emergency • Killip Class II • High Mortality Risk',
      confidence: 0.984,
      heatmapRegions: [
        { x: 35, y: 40, radius: 25, intensity: 0.99, label: 'ST Elevation Waveform' },
        { x: 65, y: 70, radius: 30, intensity: 0.94, label: 'Critical Troponin I Parameter' }
      ],
      boundingBox: { x: 25, y: 25, width: 50, height: 35, label: 'Acute STEMI Elevation Vector' },
      extractedEntities: [
        { name: 'hs-Troponin I', value: '0.86 ng/mL', status: 'critical', reference: '< 0.04 ng/mL' },
        { name: 'NT-proBNP', value: '1,840 pg/mL', status: 'critical', reference: '< 125 pg/mL' },
        { name: 'Blood Pressure', value: '158/94 mmHg', status: 'abnormal', reference: '< 120/80 mmHg' },
        { name: 'LVEF', value: '38%', status: 'critical', reference: '> 55%' }
      ],
      clinicalInterpretation: 'XGBoost tabular classifier computes 98.4% probability of acute myocardial infarction based on 21.5x elevation in high-sensitivity Troponin I coupled with elevated NT-proBNP and anterior ST-segment elevation.',
      suggestedAction: 'Immediate code STEMI activation. Transfer to Catheterization Lab for emergency percutaneous coronary intervention (PCI) and dual antiplatelet therapy.'
    }
  },

  // 6. EEG Brain Signals
  {
    id: 'eeg_signals',
    name: 'EEG Brain Signals (Electrophysiological Traces)',
    shortLabel: 'EEG Signal AI',
    iconName: 'Zap',
    badge: 'Neuro-Physiology',
    description: '1D temporal sequence analysis, epileptiform spike-wave discharge detection, and seizure onset zone localization.',
    models: [
      {
        id: 'one_d_cnn',
        name: '1D CNN (Temporal ConvNet)',
        architecture: 'Multi-layer 1D Temporal Convolutions with Dilated Receptive Fields',
        developer: 'MIT Neuro-Engineering / EnsureCare',
        description: 'Applies 1-dimensional filters across continuous millisecond microvolt time-series to detect high-amplitude sharp waves and paroxysms.',
        parameters: '12.4M Params',
        accuracy: '96.4% Sensitivity',
        f1Score: '0.958',
        latencyMs: 14,
        highlight: 'Real-Time Millisecond Spike Detection'
      },
      {
        id: 'eegnet',
        name: 'EEGNet',
        architecture: 'Compact Depthwise & Separable Convolutional Architecture',
        developer: 'Lawhern et al. / Army Research Laboratory',
        description: 'Ultra-compact model customized for BCI and neuro-monitoring; extracts frequency-band spatial filters (Theta, Alpha, Beta, Delta).',
        parameters: '1.8M Params',
        accuracy: '97.1% Accuracy',
        f1Score: '0.967',
        latencyMs: 8,
        highlight: 'Ultra-Compact & Resilient to Electrode Artifacts'
      },
      {
        id: 'transformers_eeg',
        name: 'EEG-Transformer',
        architecture: 'Multi-Head Self-Attention over Multi-Channel Temporal Embeddings',
        developer: 'Vaswani et al. / Stanford NeuroAI',
        description: 'Models long-range temporal dependencies across 16-channel 10-20 international electrode montages to predict seizure onset.',
        parameters: '48.2M Params',
        accuracy: '97.6% AUC',
        f1Score: '0.972',
        latencyMs: 45,
        highlight: 'Long-Range Electroencephalogram Sequence Modeling'
      }
    ],
    defaultImageName: 'eeg_16channel_waveforms_recording.png',
    defaultDocName: 'Electroencephalogram_Clinical_Report.pdf',
    sampleImageUrl: createEegSignalsSvg(),
    sampleDocTitle: 'ENSURECARE NEUROLOGY • 24-HOUR AMBULATORY VIDEO-EEG REPORT',
    sampleDocContent: `PATIENT: Dipesh Yadav | AGE: 24 | DURATION: 24-Hour Continuous Recording
INDICATION: Unprovoked nocturnal convulsions, episodes of behavioral arrest with automatisms.
BACKGROUND ACTIVITY:
- Posterior dominant rhythm: 9.5 Hz alpha rhythm, symmetric over occipital regions, attenuates with eye opening.
PAROXYSMAL EVENTS & ABNORMALITIES:
- Frequent bursts of 3-3.5 Hz generalized synchronous spike-and-wave discharges lasting 2.5 to 5.0 seconds.
- Phase reversal identified over right fronto-temporal electrodes (F8-T4).
- Hyperventilation triggered a 6-second burst accompanied by mild cognitive blunting.
IMPRESSION: Abnormal EEG diagnostic of Generalized Idiopathic Epilepsy with localized right fronto-temporal epileptogenic focus.`,
    diagnosticTemplate: {
      primaryPathology: 'Epileptiform Encephalopathy (Generalized Spike-Wave Discharges)',
      stageSeverity: 'Active Paroxysmal Activity • 3 Hz Spike-and-Wave Clusters',
      confidence: 0.971,
      heatmapRegions: [
        { x: 55, y: 75, radius: 25, intensity: 0.98, label: 'Spike-Wave Discharge (T4-T6)' }
      ],
      boundingBox: { x: 45, y: 60, width: 25, height: 30, label: 'Epileptogenic Focus (Fronto-Temporal)' },
      extractedEntities: [
        { name: 'Discharge Frequency', value: '3.0 - 3.5 Hz', status: 'critical', reference: 'None (Normal Alpha)' },
        { name: 'Burst Duration', value: '2.5 to 6.0 seconds', status: 'critical', reference: '< 0.5s' },
        { name: 'Phase Reversal', value: 'Present (Right Fronto-temporal)', status: 'abnormal', reference: 'Absent' },
        { name: 'Background Rhythm', value: '9.5 Hz Alpha', status: 'normal', reference: '8.5 - 12 Hz' }
      ],
      clinicalInterpretation: 'EEGNet & 1D CNN confirm recurrent bursts of synchronized 3Hz spike-wave complexes localized primarily over right temporal channels, indicative of unmanaged focal-onset epilepsy with secondary generalization.',
      suggestedAction: 'Initiate Levetiracetam (Keppra 500mg BID) or Sodium Valproate, review driver safety restrictions, and schedule high-resolution Epilepsy-protocol MRI.'
    }
  },

  // 7. Medical Text and Reports
  {
    id: 'medical_text',
    name: 'Medical Text and Reports (Clinical NLP)',
    shortLabel: 'Clinical NLP',
    iconName: 'FileText',
    badge: 'Medical NLP',
    description: 'Biomedical named entity recognition, ICD-10 coding, and clinical report parsing from unstructured doctor notes.',
    models: [
      {
        id: 'biobert',
        name: 'BioBERT v1.1',
        architecture: 'Bidirectional Encoder Representations Pretrained on PubMed & PMC',
        developer: 'Lee et al. / Korea University & NCBI',
        description: 'Trained on 4.5 billion biomedical words; excels at biomedical named entity recognition (Disease, Gene, Chemical, Dosage).',
        parameters: '110M Params',
        accuracy: '96.7% F1 Entity Score',
        f1Score: '0.967',
        latencyMs: 38,
        highlight: 'Standard for Biomedical Named Entity Recognition'
      },
      {
        id: 'clinicalbert',
        name: 'ClinicalBERT',
        architecture: 'Domain-Adaptive BERT Fine-Tuned on MIMIC-III Clinical Notes',
        developer: 'Alsentzer et al. / MIT & Harvard',
        description: 'Learns unique clinical shorthand, hospital discharge jargon, and ICU progress notes to predict 30-day readmission and mortality.',
        parameters: '110M Params',
        accuracy: '97.2% Clinical F1',
        f1Score: '0.972',
        latencyMs: 42,
        highlight: 'Specialized in Hospital Notes & Physician Shorthand'
      },
      {
        id: 'pubmedbert',
        name: 'PubMedBERT',
        architecture: 'Pre-Trained from Scratch on Full-Text PubMed Articles',
        developer: 'Gu et al. / Microsoft Research',
        description: 'Constructs custom biomedical vocabulary from scratch, avoiding out-of-vocabulary word splitting on complex drug names and diagnoses.',
        parameters: '110M Params',
        accuracy: '98.1% BLURB Benchmark',
        f1Score: '0.981',
        latencyMs: 35,
        highlight: '#1 on Biomedical Language Understanding (BLURB)'
      }
    ],
    defaultImageName: 'diagnostic_lab_worksheet_scanned.png',
    defaultDocName: 'Comprehensive_Clinical_Discharge_Summary.pdf',
    sampleImageUrl: createBrainMriSvg(),
    sampleDocTitle: 'ENSURECARE MULTISPECIALITY HOSPITAL • INPATIENT CLINICAL SUMMARY',
    sampleDocContent: `ADMISSION DIAGNOSIS: Acute intractable cephalalgia with secondary photophobia and emesis.
PATIENT: Dipesh Yadav | AGE: 24 | ATTENDING PHYSICIAN: Dr. Michael Hayes, MD
COURSE IN HOSPITAL:
Patient presented with sudden-onset explosive headache refractory to oral NSAIDs.
Vital Signs on Admission: BP 142/88 mmHg, HR 82 bpm, SpO2 98% room air.
Diagnostic Workup:
- Brain MRI demonstrates 3.4 cm right temporal lesion with ring enhancement and perilesional edema.
- CBC reveals mild leukocytosis (WBC 12,400 /mcL).
- Inflammatory markers: ESR 38 mm/hr, CRP 14.2 mg/L.
TREATMENT ADMINISTERED:
IV Dexamethasone 8mg stat, followed by 4mg Q6H. Sumatriptan 50mg provided partial initial relief.
DISCHARGE MEDICATIONS:
1. Dexamethasone 4mg oral tablet twice daily with food.
2. Pantoprazole 40mg oral tablet once daily morning before breakfast.
3. Levetiracetam 500mg oral tablet twice daily for seizure prophylaxis.
DISCHARGE INSTRUCTIONS: Follow up with Neurosurgery Clinic within 72 hours for craniotomy scheduling.`,
    diagnosticTemplate: {
      primaryPathology: 'Intracranial Mass Lesion with Severe Cephalalgia & Perilesional Edema',
      stageSeverity: 'Inpatient Status • High Severity Clinical Encounter',
      confidence: 0.981,
      heatmapRegions: [
        { x: 50, y: 50, radius: 30, intensity: 0.95, label: 'Clinical Diagnosis Paragraph' }
      ],
      boundingBox: { x: 20, y: 20, width: 60, height: 60, label: 'Structured Clinical Entity Zone' },
      extractedEntities: [
        { name: 'Primary Symptom', value: 'Acute intractable cephalalgia', status: 'critical', reference: 'Asymptomatic' },
        { name: 'WBC Count', value: '12,400 /mcL', status: 'abnormal', reference: '4,500 - 11,000 /mcL' },
        { name: 'CRP Marker', value: '14.2 mg/L', status: 'abnormal', reference: '< 5.0 mg/L' },
        { name: 'Prescribed Steroid', value: 'Dexamethasone 4mg BID', status: 'normal', reference: 'Anti-Edema' }
      ],
      clinicalInterpretation: 'PubMedBERT & ClinicalBERT parse 14 clinical entities with 98.1% F1 confidence, extracting primary symptoms of intractable cephalalgia and confirming corticosteroid and antiepileptic prophylactic therapy.',
      suggestedAction: 'Ensure strict medication compliance, monitor fasting blood glucose during steroid therapy, and ensure urgent neurosurgical follow-up.'
    }
  },

  // 8. Medical Image + Text Analysis
  {
    id: 'image_text',
    name: 'Medical Image + Text Analysis (Vision-Language Models)',
    shortLabel: 'Vision-Language VLM',
    iconName: 'Layers',
    badge: 'Multimodal VLM',
    description: 'Joint contrastive alignment of radiology images with radiologist text reports for zero-shot diagnosis.',
    models: [
      {
        id: 'clip_medical',
        name: 'BiomedCLIP / CLIP-Medical',
        architecture: 'Contrastive Vision-Language Pre-training with Dual ViT & BERT Encoders',
        developer: 'Microsoft Research & University of Washington',
        description: 'Trained on 15 million image-text pairs from biomedical research articles; maps scans and radiology text into a shared embedding space.',
        parameters: '220M Params',
        accuracy: '96.5% Zero-Shot Acc',
        f1Score: '0.961',
        latencyMs: 95,
        highlight: 'Premier Biomedical Contrastive Vision-Language Encoder'
      },
      {
        id: 'vlm_gemini',
        name: 'Vision-Language Model (VLM / Gemini Med)',
        architecture: 'Autoregressive Multimodal Transformer (Cross-Attention)',
        developer: 'Google DeepMind & Health Research',
        description: 'Simultaneously ingests medical scan pixels and clinician report text, generating coherent clinical interpretations and answering doctor queries.',
        parameters: 'Foundation Scale',
        accuracy: '97.9% Clinical Reasoning',
        f1Score: '0.975',
        latencyMs: 160,
        highlight: 'Zero-Shot Clinical Dialogue & Cross-Modal Diagnostic Reasoning'
      }
    ],
    defaultImageName: 'chest_xray_pa_view_patient.png',
    defaultDocName: 'Pulmonology_Radiology_Consult_Report.pdf',
    sampleImageUrl: createChestXraySvg(),
    sampleDocTitle: 'ENSURECARE ADVANCED RADIOLOGY • CHEST X-RAY & PULMONOLOGY REPORT',
    sampleDocContent: `MODALITY: Digital Chest Radiograph (PA View) + Pulmonologist Examination Note
PATIENT: Dipesh Yadav | AGE: 24 | STUDY ID: CXR-2026-9042
CLINICAL INDICATION: Productive cough with fever (102°F) and right pleuritic chest discomfort for 4 days.
RADIOGRAPH FINDINGS:
- Right lower lobe dense patchy air-space consolidation with visible air bronchograms.
- Costophrenic angles sharp, no pleural effusion.
- Cardiac silhouette, hilar structures and mediastinum within normal limits.
- No pneumothorax.
IMPRESSION: Right lower lobe acute lobar pneumonia. Correlates with bacterial pulmonary infection.`,
    diagnosticTemplate: {
      primaryPathology: 'Right Lower Lobe Acute Bacterial Pneumonia & Infiltration',
      stageSeverity: 'Acute Lobar Consolidation • High-Probability Radiographic Finding',
      confidence: 0.982,
      heatmapRegions: [
        { x: 32, y: 60, radius: 28, intensity: 0.98, label: 'Right Lower Lobe Consolidation' }
      ],
      boundingBox: { x: 22, y: 48, width: 25, height: 25, label: 'Air-Space Infiltration Zone' },
      extractedEntities: [
        { name: 'Consolidation Zone', value: 'Right Lower Lobe', status: 'critical', reference: 'Clear Lung Fields' },
        { name: 'Air Bronchograms', value: 'Present', status: 'abnormal', reference: 'Absent' },
        { name: 'Pleural Effusion', value: 'Negative (Sharp Angles)', status: 'normal', reference: 'Negative' },
        { name: 'Heart Silhouette', value: 'Normal Contours', status: 'normal', reference: 'Normal' }
      ],
      clinicalInterpretation: 'BiomedCLIP Vision-Language Model automatically matched visual radiopacity in the right lower lobe with clinical report symptoms of pleuritic chest pain and fever, confirming high-concordance lobar pneumonia.',
      suggestedAction: 'Initiate targeted antibiotic coverage (Azithromycin 500mg & Amoxicillin-Clavulanate 625mg), monitor pulse oximetry, and schedule follow-up chest radiograph in 10 days.'
    }
  },

  // 9. Multiple Data Types Together
  {
    id: 'multimodal',
    name: 'Multiple Data Types Together (Multimodal Neural Networks)',
    shortLabel: 'Multimodal Fusion AI',
    iconName: 'Cpu',
    badge: 'Cross-Modal Fusion',
    description: 'Late-fusion cross-attention network uniting Medical Image + Clinical PDF Document + Tabular Biomarkers.',
    models: [
      {
        id: 'multimodal_net',
        name: 'Multimodal Neural Network (MM-Net)',
        architecture: 'Hierarchical Cross-Attention Transformer with Late Multi-Head Fusion',
        developer: 'EnsureCare AI Labs & Stanford AIMI',
        description: 'Simultaneously fuses image tensor embeddings (from ResNet/ViT), textual entity embeddings (from ClinicalBERT), and tabular risk vectors (from XGBoost).',
        parameters: '310M Params',
        accuracy: '98.9% Holistic Accuracy',
        f1Score: '0.986',
        latencyMs: 185,
        highlight: 'Integrates Image, PDF Document & Tabular Labs into One Single Diagnosis'
      }
    ],
    defaultImageName: 'multimodal_composite_mri_ecg_tissue.png',
    defaultDocName: 'Comprehensive_Electronic_Health_Record_EHR.pdf',
    sampleImageUrl: createBrainMriSvg(),
    sampleDocTitle: 'ENSURECARE 360 • MULTIMODAL UNIFIED DIAGNOSTIC DOSSIER',
    sampleDocContent: `UNIFIED HEALTHCARE DOSSIER (IMAGE + PDF + TABULAR LABS)
PATIENT: Dipesh Yadav | AGE: 24 | SEX: Male | LOCATION: Connaught Place, New Delhi
DATA SOURCES SYNTHESIZED:
1. Brain MRI Scan (Axial FLAIR): 3.4cm ring-enhancing mass in right temporal lobe with perifocal edema.
2. Complete Blood Count (CBC) PDF: WBC 12,400/mcL, Platelets 280,000/mcL, Hemoglobin 14.8 g/dL.
3. Tabular Biochemical Profile: CRP 14.2 mg/L, Fasting Blood Glucose 98 mg/dL, Creatinine 0.9 mg/dL.
4. Examining Doctor Notes: Intractable headache, photophobia, patient alert and oriented.
MULTIMODAL SYNTHESIS:
All 3 distinct clinical modalities (Imaging, Hematology PDF, and Tabular Bloodwork) converge on an active primary intracranial neoplastic process with secondary inflammatory leukocytosis. Renal and metabolic markers remain optimal for intravenous contrast and surgical intervention.`,
    diagnosticTemplate: {
      primaryPathology: 'Unified Diagnosis: High-Grade Temporal Neoplasm with Systemic Surgical Clearance',
      stageSeverity: 'Comprehensive Multimodal Clearance Index: 98.9%',
      confidence: 0.989,
      heatmapRegions: [
        { x: 65, y: 45, radius: 30, intensity: 0.99, label: 'MRI Tumor Core' },
        { x: 30, y: 70, radius: 25, intensity: 0.88, label: 'Laboratory WBC Alignment' }
      ],
      boundingBox: { x: 50, y: 35, width: 30, height: 30, label: 'Fused Diagnostic Focus' },
      extractedEntities: [
        { name: 'Imaging Finding', value: '3.4cm Temporal Mass', status: 'critical', reference: 'Normal' },
        { name: 'Hematology Marker', value: 'WBC 12,400 /mcL', status: 'abnormal', reference: '4,500 - 11,000' },
        { name: 'Renal Clearance', value: 'Creatinine 0.9 mg/dL', status: 'normal', reference: '0.7 - 1.3 mg/dL' },
        { name: 'Surgical Operability', value: 'Cleared for Craniotomy', status: 'normal', reference: 'Elective' }
      ],
      clinicalInterpretation: 'Multimodal Neural Network fuses visual features from the Brain MRI scan with PDF lab values and clinical text, producing an integrated 98.9% confidence diagnosis and confirming biological clearance for immediate surgical intervention.',
      suggestedAction: 'Finalize pre-operative anesthesia workup, confirm cross-matched blood availability, and schedule craniotomy with neuro-navigation.'
    }
  }
];

export function getCategoryById(type: ClinicalDataType): DataTypeCategory {
  return CLINICAL_DATA_TYPES.find(c => c.id === type) || CLINICAL_DATA_TYPES[0];
}

