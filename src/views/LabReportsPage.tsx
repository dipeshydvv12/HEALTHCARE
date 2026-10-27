// LabReportsPage.tsx - Advanced Diagnostic AI Laboratory & Reports Studio
// Supports Image and PDF Document Analysis with Automated Model & Modality Detection
// Seamlessly routes to specialized models (ResNet, U-Net, Swin UNETR, EfficientNet, ViT,
// InceptionV3, ConvNeXt, XGBoost, Random Forest, LightGBM, 1D CNN, EEGNet, BioBERT,
// ClinicalBERT, PubMedBERT, CLIP, & Multimodal Neural Networks) based on uploaded scan & report text.

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CLINICAL_DATA_TYPES,
  ClinicalDataType,
  getCategoryById,
  AiModelSpec,
  autoDetectModalityAndModel,
  AutoDetectionResult
} from '../services/aiDiagnosticService';
import { REAL_LABORATORY } from '../data/realFacilities';
import {
  FlaskConical,
  Brain,
  Eye,
  Activity,
  Zap,
  FileText,
  Layers,
  Cpu,
  Sparkles,
  Upload,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  ZoomIn,
  EyeOff,
  MapPin,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileCheck,
  Check,
  Bot,
  Sliders
} from 'lucide-react';

interface LabReportsPageProps {
  onBackToOrders?: () => void;
}

export const LabReportsPage: React.FC<LabReportsPageProps> = ({ onBackToOrders }) => {
  const { patients, updateLabStatus } = useApp();

  // Initial detection: Starts with Brain MRI sample
  const [autoDetection, setAutoDetection] = useState<AutoDetectionResult>(() =>
    autoDetectModalityAndModel({ imageName: 'brain_mri_axial_flair_patient_dipesh.dicom' })
  );

  const selectedCategoryType = autoDetection.category;
  const currentCategory = getCategoryById(selectedCategoryType);
  const activeModel: AiModelSpec = autoDetection.model;

  // Custom User Uploads (or defaults)
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [customImageName, setCustomImageName] = useState<string | null>(null);
  const [customDocContent, setCustomDocContent] = useState<string | null>(null);
  const [customDocName, setCustomDocName] = useState<string | null>(null);

  // Viewer Controls
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showBoundingBox, setShowBoundingBox] = useState(true);
  const [highContrast, setHighContrast] = useState(false);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [hasRunAnalysis, setHasRunAnalysis] = useState(true);
  const [attachedSuccess, setAttachedSuccess] = useState(false);

  // Active Patient to link results
  const defaultPatient = patients[0] || { name: 'Dipesh Yadav', id: 'patient-dipesh-01' };
  const [selectedPatientId, setSelectedPatientId] = useState(defaultPatient.id);

  // Handle custom image upload with AUTOMATIC modality & model detection
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageResult = reader.result as string;
        setCustomImage(imageResult);
        setCustomImageName(file.name);

        // Auto-detect modality and model automatically based on image file & existing report
        const detection = autoDetectModalityAndModel({
          imageName: file.name,
          docName: customDocName || undefined,
          docText: customDocContent || undefined
        });
        setAutoDetection(detection);
        setHasRunAnalysis(true);
        setAttachedSuccess(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle custom document upload with AUTOMATIC model detection
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomDocName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const docText = reader.result as string;
        setCustomDocContent(docText);

        // Auto-detect modality and model automatically based on document content & existing image
        const detection = autoDetectModalityAndModel({
          imageName: customImageName || undefined,
          docName: file.name,
          docText: docText,
          preferredCategory: selectedCategoryType
        });
        setAutoDetection(detection);
        setHasRunAnalysis(true);
        setAttachedSuccess(false);
      };
      reader.readAsText(file);
    }
  };

  // Quick Clinical Sample Presets (auto-routes category and model with 1 click)
  const handleSelectSample = (type: ClinicalDataType) => {
    const cat = getCategoryById(type);
    const detection = autoDetectModalityAndModel({
      imageName: cat.defaultImageName,
      docName: cat.defaultDocName,
      docText: cat.sampleDocContent,
      preferredCategory: type
    });
    setAutoDetection(detection);
    setCustomImage(null);
    setCustomImageName(null);
    setCustomDocContent(null);
    setCustomDocName(null);
    setHasRunAnalysis(true);
    setAttachedSuccess(false);
  };

  // Run AI Diagnostic Inference Simulator
  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setAttachedSuccess(false);
    setAnalysisStep('Ingesting visual tensor & tokenizing PDF clinical document...');

    setTimeout(() => {
      setAnalysisStep(`Executing automated inference via ${activeModel.name} (${activeModel.parameters})...`);
      setTimeout(() => {
        setAnalysisStep('Computing Grad-CAM attention heatmap & cross-modal feature alignment...');
        setTimeout(() => {
          setIsAnalyzing(false);
          setHasRunAnalysis(true);
        }, 600);
      }, 700);
    }, 600);
  };

  // Attach results to patient lab order
  const handleAttachToPatient = () => {
    const targetPatient = patients.find(p => p.id === selectedPatientId) || patients[0];
    if (targetPatient) {
      const findingSummary = `[${activeModel.name} AI Analysis]: ${currentCategory.diagnosticTemplate.primaryPathology} (${(currentCategory.diagnosticTemplate.confidence * 100).toFixed(1)}% Confidence). Verified via ${autoDetection.detectedModality}.`;
      updateLabStatus(targetPatient.id, 'completed', findingSummary);
      setAttachedSuccess(true);
      setTimeout(() => setAttachedSuccess(false), 4000);
    }
  };

  // Download AI Diagnostic Lab Report File
  const handleDownloadReport = () => {
    const reportText = `# OFFICIAL AI DIAGNOSTIC LABORATORY & IMAGING REPORT
================================================================================
LABORATORY FACILITY: ${REAL_LABORATORY.name}
FACILITY ADDRESS:    ${REAL_LABORATORY.address}
GOOGLE MAPS:         ${REAL_LABORATORY.googleMapsUrl}
REPORT DATE:         ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}
================================================================================

## 1. PATIENT DEMOGRAPHICS
* Patient Name: ${defaultPatient.name}
* Age / Sex:    24 Years / Male
* Phone:        +919528871260
* Location:     Connaught Place, Central Delhi, Delhi 110001

## 2. MODALITY & AUTOMATICALLY ASSIGNED AI MODEL
* Detected Modality:      ${autoDetection.detectedModality}
* Auto-Selected Model:    ${activeModel.name} (${activeModel.architecture})
* Model Parameters:       ${activeModel.parameters}
* Benchmark Accuracy:     ${activeModel.accuracy}
* Model Developer:        ${activeModel.developer}
* Model Assignment Logic: ${autoDetection.reason}

## 3. PRIMARY DIAGNOSIS & PATHOLOGY
* Primary Finding:  ${currentCategory.diagnosticTemplate.primaryPathology}
* Stage / Severity: ${currentCategory.diagnosticTemplate.stageSeverity}
* Confidence Score: ${(currentCategory.diagnosticTemplate.confidence * 100).toFixed(1)}%

## 4. EXTRACTED CLINICAL BIOMARKERS & ENTITIES
${currentCategory.diagnosticTemplate.extractedEntities
  .map(e => `* ${e.name.padEnd(25)}: ${e.value} [Status: ${e.status.toUpperCase()}] (Ref: ${e.reference})`)
  .join('\n')}

## 5. MULTIMODAL CLINICAL INTERPRETATION
${currentCategory.diagnosticTemplate.clinicalInterpretation}

## 6. RECOMMENDED CLINICAL INTERVENTION
${currentCategory.diagnosticTemplate.suggestedAction}
================================================================================
DISCLAIMER: Automated medical AI diagnostic decision-support report verified by EnsureCare Diagnostic Engine.`;

    const blob = new Blob([reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI_Diagnostic_Report_${currentCategory.id}_${activeModel.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayImage = customImage || currentCategory.sampleImageUrl;
  const displayImageName = customImageName || currentCategory.defaultImageName;
  const displayDocContent = customDocContent || currentCategory.sampleDocContent;
  const displayDocName = customDocName || currentCategory.defaultDocName;

  return (
    <div className="max-w-7xl mx-auto py-2 space-y-6 text-left">
      {/* 1. Header Banner */}
      <div className="bg-[#0D1829] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                Laboratory Department • Step 3B
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                🔬 AI Reports &amp; Medical Imaging Studio
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Automatic Model Decision Engine Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Diagnostic AI Laboratory Reports &amp; Imaging Analysis
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl mt-1 leading-relaxed">
              Upload any medical scan (X-Ray, MRI, CT, Dermoscopy, Biopsy, ECG) or laboratory PDF report. The system automatically inspects the content, determines the clinical modality, and auto-selects the optimal AI model to execute diagnostic inference.
            </p>
          </div>

          {onBackToOrders && (
            <button
              onClick={onBackToOrders}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>← Back to Lab Orders</span>
            </button>
          )}
        </div>

        {/* Real Laboratory Facility Details */}
        <div className="pt-4 flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-md">
              Testing Facility
            </span>
            <span className="font-semibold text-white">{REAL_LABORATORY.name}</span>
            <span className="text-slate-400 hidden lg:inline">• {REAL_LABORATORY.address}</span>
          </div>
          <a
            href={REAL_LABORATORY.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-300 hover:text-white flex items-center gap-1 font-bold text-xs"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>Open Lab on Google Maps ↗</span>
          </a>
        </div>
      </div>

      {/* 2. Automated AI Engine Status Banner (Replaces Manual Model Cards) */}
      <div className="bg-gradient-to-r from-[#0C172E] via-[#0D1E3A] to-[#0A162C] border border-cyan-500/40 rounded-3xl p-5 shadow-2xl space-y-3 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 shadow-lg">
              <Bot className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-black bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-md border border-cyan-500/30">
                  ⚡ Auto-Detected Modality
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Confidence: {(autoDetection.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">
                {autoDetection.detectedModality}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#070D18]/80 border border-slate-700/80 rounded-2xl px-4 py-2.5 shrink-0">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Auto-Assigned Model</span>
              <span className="text-sm font-black text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {activeModel.name}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Benchmark</span>
              <span className="text-xs font-mono font-bold text-cyan-300">{activeModel.accuracy}</span>
            </div>
          </div>
        </div>

        {/* AI Routing Justification */}
        <div className="p-3 bg-[#081020]/90 rounded-2xl border border-cyan-500/20 text-xs text-slate-300 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-cyan-300">Automated Pipeline Decision: </strong>
            {autoDetection.reason}
          </p>
        </div>

        {/* Quick Clinical Test Scenarios (Instant 1-Click Testing) */}
        <div className="pt-1 flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider mr-1">
            Test Scenarios:
          </span>
          <button
            type="button"
            onClick={() => handleSelectSample('image_text')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
              selectedCategoryType === 'image_text'
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <span>🩻</span>
            <span>Chest X-Ray / Radiograph</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSample('brain_tumor')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
              selectedCategoryType === 'brain_tumor'
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <span>🧠</span>
            <span>Brain MRI Scan</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSample('skin_disease')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
              selectedCategoryType === 'skin_disease'
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <span>✨</span>
            <span>Skin Dermoscopy</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSample('retinal_eye')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
              selectedCategoryType === 'retinal_eye'
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <span>👁️</span>
            <span>Retinal Fundus Photo</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSample('histopathology')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
              selectedCategoryType === 'histopathology'
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <span>🔬</span>
            <span>Histopathology Biopsy</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSample('heart_tabular')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
              selectedCategoryType === 'heart_tabular'
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <span>📊</span>
            <span>Cardiac Lab &amp; ECG</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSample('eeg_signals')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
              selectedCategoryType === 'eeg_signals'
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <span>⚡</span>
            <span>EEG Brain Waves</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSample('medical_text')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
              selectedCategoryType === 'medical_text'
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <span>📝</span>
            <span>Clinical Progress Report</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSample('multimodal')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
              selectedCategoryType === 'multimodal'
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <span>🌐</span>
            <span>Multimodal EHR Dossier</span>
          </button>
        </div>
      </div>

      {/* 3. Dual Workspace: Medical Image (Left) + PDF Clinical Document (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ================= LEFT WORKSPACE: MEDICAL IMAGE ================= */}
        <div className="bg-[#0D1829] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between space-y-4">
          <div>
            {/* Header & Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <ZoomIn className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">1. Medical Diagnostic Scan / X-Ray / Image</h3>
                  <p className="text-[10px] text-slate-400 font-mono">{displayImageName}</p>
                </div>
              </div>

              {/* View Overlay Toggles */}
              <div className="flex items-center gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer flex items-center gap-1 ${
                    showHeatmap
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title="Toggle AI Attention / Grad-CAM Heatmap overlay"
                >
                  <span>Grad-CAM</span>
                  <span className="text-[8px] font-mono">{showHeatmap ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowBoundingBox(!showBoundingBox)}
                  className={`px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer flex items-center gap-1 ${
                    showBoundingBox
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title="Toggle Segmentation Mask / Bounding Box"
                >
                  <span>Mask</span>
                  <span className="text-[8px] font-mono">{showBoundingBox ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHighContrast(!highContrast)}
                  className={`px-2 py-1 rounded-lg border font-bold transition cursor-pointer ${
                    highContrast
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title="Toggle DICOM high-contrast filter"
                >
                  Contrast
                </button>
              </div>
            </div>

            {/* Interactive Image Display Canvas */}
            <div className="mt-4 relative rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-square flex items-center justify-center group">
              <img
                src={displayImage}
                alt="Medical Diagnostic Scan"
                className={`w-full h-full object-contain transition duration-200 ${
                  highContrast ? 'contrast-150 brightness-110' : ''
                }`}
              />

              {/* AI Saliency Heatmap Overlay */}
              {showHeatmap && hasRunAnalysis && (
                <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-75">
                  {currentCategory.diagnosticTemplate.heatmapRegions.map((h, idx) => (
                    <div
                      key={idx}
                      className="absolute rounded-full animate-pulse blur-xl"
                      style={{
                        left: `${h.x - h.radius / 2}%`,
                        top: `${h.y - h.radius / 2}%`,
                        width: `${h.radius * 2}%`,
                        height: `${h.radius * 2}%`,
                        background:
                          h.intensity > 0.9
                            ? 'radial-gradient(circle, rgba(239,68,68,0.85) 0%, rgba(245,158,11,0.6) 50%, transparent 75%)'
                            : 'radial-gradient(circle, rgba(56,189,248,0.7) 0%, rgba(59,130,246,0.4) 60%, transparent 80%)'
                      }}
                    />
                  ))}
                </div>
              )}

              {/* AI Segmentation Bounding Box */}
              {showBoundingBox && hasRunAnalysis && currentCategory.diagnosticTemplate.boundingBox && (
                <div
                  className="absolute border-2 border-rose-500 bg-rose-500/10 rounded-lg pointer-events-none transition-all duration-300 flex items-start justify-start p-1"
                  style={{
                    left: `${currentCategory.diagnosticTemplate.boundingBox.x}%`,
                    top: `${currentCategory.diagnosticTemplate.boundingBox.y}%`,
                    width: `${currentCategory.diagnosticTemplate.boundingBox.width}%`,
                    height: `${currentCategory.diagnosticTemplate.boundingBox.height}%`
                  }}
                >
                  <span className="bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                    {currentCategory.diagnosticTemplate.boundingBox.label}
                  </span>
                </div>
              )}

              {/* Watermark Tag */}
              <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/70 backdrop-blur-md border border-slate-700/80 rounded-md text-[10px] font-mono text-cyan-300">
                Auto-Selected: {activeModel.name}
              </div>
            </div>
          </div>

          {/* Image Uploader & Switcher */}
          <div className="pt-2 flex items-center justify-between gap-3 text-xs flex-wrap border-t border-slate-800">
            <label className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-xl cursor-pointer font-bold transition text-xs shadow-md">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload X-Ray / Scan (JPG, PNG, DICOM)</span>
              <input type="file" accept="image/*,.dicom,.dcm" onChange={handleImageUpload} className="hidden" />
            </label>

            {customImage && (
              <button
                type="button"
                onClick={() => {
                  setCustomImage(null);
                  setCustomImageName(null);
                  const detection = autoDetectModalityAndModel({
                    preferredCategory: 'brain_tumor'
                  });
                  setAutoDetection(detection);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer font-medium"
              >
                Reset to Sample Scan
              </button>
            )}
          </div>
        </div>

        {/* ================= RIGHT WORKSPACE: PDF CLINICAL REPORT ================= */}
        <div className="bg-[#0D1829] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between space-y-4">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">2. Medical PDF Report &amp; Clinical Notes</h3>
                  <p className="text-[10px] text-slate-400 font-mono">{displayDocName}</p>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                Document NLP Active
              </span>
            </div>

            {/* Realistic Clinical Document / PDF Reader View */}
            <div className="mt-4 rounded-2xl bg-[#090F1E] border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-y-auto max-h-[400px] space-y-3 shadow-inner">
              <div className="border-b border-slate-800 pb-2 flex items-center justify-between text-[11px] font-bold text-cyan-300">
                <span>{currentCategory.sampleDocTitle}</span>
                <span className="text-slate-500">Page 1 of 1</span>
              </div>

              <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-200">
                {displayDocContent}
              </pre>

              {/* BioBERT Extracted Entities Preview Chips */}
              <div className="pt-3 border-t border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                  BioBERT / ClinicalBERT Extracted Entities:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {currentCategory.diagnosticTemplate.extractedEntities.map((ent, i) => (
                    <span
                      key={i}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                        ent.status === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : ent.status === 'abnormal'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {ent.name}: {ent.value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* PDF Uploader & Switcher */}
          <div className="pt-2 flex items-center justify-between gap-3 text-xs flex-wrap border-t border-slate-800">
            <label className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer font-bold transition text-xs shadow-md">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload PDF / Text Report</span>
              <input type="file" accept=".pdf,.txt,.doc,.docx" onChange={handleDocUpload} className="hidden" />
            </label>

            {customDocContent && (
              <button
                type="button"
                onClick={() => {
                  setCustomDocContent(null);
                  setCustomDocName(null);
                  const detection = autoDetectModalityAndModel({
                    imageName: customImageName || undefined,
                    preferredCategory: 'brain_tumor'
                  });
                  setAutoDetection(detection);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer font-medium"
              >
                Reset to Sample Report
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Execution Controller Bar */}
      <div className="bg-[#0B1528] border border-cyan-500/40 rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0">
            <Play className="w-6 h-6 fill-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-white">Execute Medical AI Diagnostic Pipeline</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                Auto-Selected: {activeModel.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simultaneously analyzes scan pixels and PDF clinical entities with {activeModel.architecture}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={handleRunAnalysis}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 hover:opacity-95 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 text-slate-950 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Running AI Inference...' : `Run Diagnostic Analysis (${activeModel.name})`}</span>
          </button>
        </div>
      </div>

      {/* Progressive Step Feedback */}
      {isAnalyzing && (
        <div className="p-4 bg-cyan-950/40 border border-cyan-500/40 rounded-2xl text-center space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-center gap-2 text-cyan-300 font-bold text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>{analysisStep}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-400 to-teal-300 h-1.5 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      )}

      {/* 5. AI Diagnostic Results Dossier & Multimodal Output */}
      {hasRunAnalysis && (
        <div className="bg-[#0D1829] border border-cyan-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
          {/* Top Dossier Summary Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Verified Diagnostic Finding
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Engine: {activeModel.name} ({activeModel.parameters})
                </span>
                <span className="text-xs text-cyan-400 font-mono">
                  Modality: {autoDetection.detectedModality}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {currentCategory.diagnosticTemplate.primaryPathology}
              </h2>
              <p className="text-xs text-rose-300 font-semibold mt-0.5">
                {currentCategory.diagnosticTemplate.stageSeverity}
              </p>
            </div>

            {/* Confidence Score Gauge */}
            <div className="flex items-center gap-3 bg-[#111C33] border border-cyan-500/30 rounded-2xl p-3.5 shrink-0">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Diagnostic Confidence</span>
                <span className="text-2xl font-black text-cyan-300">
                  {(currentCategory.diagnosticTemplate.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-bold text-xs">
                {activeModel.f1Score} F1
              </div>
            </div>
          </div>

          {/* Extracted Clinical Biomarkers & Entities Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              Extracted Parameters &amp; Clinical Entity Values:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {currentCategory.diagnosticTemplate.extractedEntities.map((ent, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border ${
                    ent.status === 'critical'
                      ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                      : ent.status === 'abnormal'
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                      : 'bg-[#111F36] border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase mb-1">
                    <span className="text-slate-400">{ent.name}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                        ent.status === 'critical'
                          ? 'bg-rose-500 text-white'
                          : ent.status === 'abnormal'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {ent.status.toUpperCase()}
                    </span>
                  </div>
                  <h5 className="text-sm font-extrabold text-white">{ent.value}</h5>
                  <p className="text-[10px] text-slate-500 mt-1">Ref: {ent.reference}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Multimodal Diagnostic Synthesis & Interpretation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-[#111F36] border border-cyan-500/30 space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-cyan-300 tracking-wider flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Cross-Modal Synthesis (Image + PDF):
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {currentCategory.diagnosticTemplate.clinicalInterpretation}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#111F36] border border-emerald-500/30 space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-emerald-300 tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Recommended Clinical Action &amp; Triage:
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {currentCategory.diagnosticTemplate.suggestedAction}
              </p>
            </div>
          </div>

          {/* Action Row: Download, Attach to Patient Chart */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Attach Report to Patient:</span>
              <select
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
                className="bg-[#111F36] border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.routing.labTestName || 'Lab Candidate'})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAttachToPatient}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                {attachedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <FileCheck className="w-3.5 h-3.5" />}
                <span>{attachedSuccess ? 'Attached to Chart ✓' : 'Attach to Lab Findings'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Print official diagnostic report"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadReport}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md hover:opacity-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download AI Diagnostic Report (.md)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
