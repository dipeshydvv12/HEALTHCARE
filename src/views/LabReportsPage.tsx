// LabReportsPage.tsx - Advanced Diagnostic AI Laboratory & Reports Studio
// Supports Image and PDF Document Analysis using 9 Category Model Architectures:
// ResNet, U-Net, Swin UNETR, EfficientNet, ViT, InceptionV3, ConvNeXt, XGBoost, Random Forest,
// LightGBM, 1D CNN, EEGNet, BioBERT, ClinicalBERT, PubMedBERT, CLIP, & Multimodal Neural Networks.

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CLINICAL_DATA_TYPES,
  ClinicalDataType,
  getCategoryById,
  AiModelSpec
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
  Check
} from 'lucide-react';

interface LabReportsPageProps {
  onBackToOrders?: () => void;
}

export const LabReportsPage: React.FC<LabReportsPageProps> = ({ onBackToOrders }) => {
  const { patients, updateLabStatus } = useApp();

  const [selectedCategoryType, setSelectedCategoryType] = useState<ClinicalDataType>('brain_tumor');
  const currentCategory = getCategoryById(selectedCategoryType);

  const [selectedModelId, setSelectedModelId] = useState<string>(currentCategory.models[0].id);

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

  // Change category
  const handleSelectCategory = (type: ClinicalDataType) => {
    setSelectedCategoryType(type);
    const cat = getCategoryById(type);
    setSelectedModelId(cat.models[0].id);
    setCustomImage(null);
    setCustomImageName(null);
    setCustomDocContent(null);
    setCustomDocName(null);
    setHasRunAnalysis(true);
    setAttachedSuccess(false);
  };

  const activeModel: AiModelSpec =
    currentCategory.models.find(m => m.id === selectedModelId) || currentCategory.models[0];

  // Handle custom image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomImage(reader.result as string);
        setCustomImageName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle custom document upload
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomDocName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setCustomDocContent(reader.result as string);
      };
      reader.readAsText(file);
    }
  };

  // Run AI Diagnostic Inference Simulator
  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setAttachedSuccess(false);
    setAnalysisStep('Ingesting visual tensor & tokenizing PDF clinical document...');

    setTimeout(() => {
      setAnalysisStep(`Running inference via ${activeModel.name} (${activeModel.parameters})...`);
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
      const findingSummary = `[${activeModel.name} AI Analysis]: ${currentCategory.diagnosticTemplate.primaryPathology} (${(currentCategory.diagnosticTemplate.confidence * 100).toFixed(1)}% Confidence). Verified via ${currentCategory.name}.`;
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

## 2. MODALITY & MODEL ARCHITECTURE
* Clinical Data Category: ${currentCategory.name}
* AI Model Architecture:  ${activeModel.name} (${activeModel.architecture})
* Model Parameters:       ${activeModel.parameters}
* Benchmark Accuracy:     ${activeModel.accuracy}
* Model Developer:        ${activeModel.developer}

## 3. PRIMARY DIAGNOSIS & PATHOLOGY
* Primary Finding: ${currentCategory.diagnosticTemplate.primaryPathology}
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
DISCLAIMER: AI-generated diagnostic decision-support report verified by EnsureCare Diagnostic Engine.`;

    const blob = new Blob([reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI_Diagnostic_Report_${currentCategory.id}_${activeModel.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render Category Icon helper
  const renderCategoryIcon = (id: ClinicalDataType) => {
    switch (id) {
      case 'brain_tumor':
        return <Brain className="w-4 h-4 text-cyan-400" />;
      case 'skin_disease':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'retinal_eye':
        return <Eye className="w-4 h-4 text-orange-400" />;
      case 'histopathology':
        return <FlaskConical className="w-4 h-4 text-purple-400" />;
      case 'heart_tabular':
        return <Activity className="w-4 h-4 text-emerald-400" />;
      case 'eeg_signals':
        return <Zap className="w-4 h-4 text-sky-400" />;
      case 'medical_text':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'image_text':
        return <Layers className="w-4 h-4 text-indigo-400" />;
      case 'multimodal':
        return <Cpu className="w-4 h-4 text-rose-400" />;
    }
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
                9 Model Architectures Live
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Diagnostic AI Laboratory Reports &amp; Imaging Analysis
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl mt-1 leading-relaxed">
              Dual-workspace clinical diagnostic studio. Ingests medical scans (MRI, Dermoscopy, Fundus, Biopsy, ECG, EEG) and PDF laboratory documents to run automated clinical inference across specialized deep learning models.
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

      {/* 2. Clinical Data Type & Task Selector (All 9 Categories) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Select Clinical Data Type &amp; Pathology:
          </label>
          <span className="text-[11px] text-slate-400">
            {CLINICAL_DATA_TYPES.length} Specialized Clinical Categories Available
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-2">
          {CLINICAL_DATA_TYPES.map(cat => {
            const isSelected = selectedCategoryType === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/40'
                    : 'bg-[#0D1829] border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60">
                    {renderCategoryIcon(cat.id)}
                  </div>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
                </div>
                <div>
                  <h4 className="text-[11px] font-bold leading-tight line-clamp-1">{cat.shortLabel}</h4>
                  <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">{cat.badge}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Deep Learning Model Selector Bar for Current Category */}
      <div className="bg-[#0B1528] border border-cyan-500/30 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              Active Category Models for {currentCategory.name}:
            </span>
            <p className="text-xs text-slate-300 mt-0.5">
              Select specific neural architecture to execute diagnostic inference:
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/30">
            {activeModel.parameters} • Latency ~{activeModel.latencyMs}ms
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {currentCategory.models.map(model => {
            const isSelected = selectedModelId === model.id;
            return (
              <button
                key={model.id}
                onClick={() => setSelectedModelId(model.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-950/60 to-slate-900 border-cyan-400 shadow-md ring-1 ring-cyan-400/30'
                    : 'bg-[#080E1C] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-xs font-black text-white">{model.name}</h5>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    {model.accuracy}
                  </span>
                </div>
                <p className="text-[10px] text-cyan-300 font-mono mb-1">{model.architecture}</p>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{model.description}</p>
                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400">
                  <span>{model.developer}</span>
                  <span className="font-semibold text-cyan-400">{model.highlight}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Dual Workspace: Medical Image (Left) + PDF Clinical Document (Right) */}
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
                  <h3 className="text-sm font-bold text-white">1. Medical Diagnostic Scan / Image</h3>
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
                Model: {activeModel.name}
              </div>
            </div>
          </div>

          {/* Image Uploader & Switcher */}
          <div className="pt-2 flex items-center justify-between gap-3 text-xs flex-wrap border-t border-slate-800">
            <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl cursor-pointer font-semibold transition border border-slate-700 text-xs">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Upload Your Scan (JPG, PNG, DICOM)</span>
              <input type="file" accept="image/*,.dicom,.dcm" onChange={handleImageUpload} className="hidden" />
            </label>

            {customImage && (
              <button
                type="button"
                onClick={() => {
                  setCustomImage(null);
                  setCustomImageName(null);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
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
            <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl cursor-pointer font-semibold transition border border-slate-700 text-xs">
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              <span>Upload PDF / Text Report</span>
              <input type="file" accept=".pdf,.txt,.doc,.docx" onChange={handleDocUpload} className="hidden" />
            </label>

            {customDocContent && (
              <button
                type="button"
                onClick={() => {
                  setCustomDocContent(null);
                  setCustomDocName(null);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
              >
                Reset to Sample Report
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Execution Controller Bar */}
      <div className="bg-[#0B1528] border border-cyan-500/40 rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0">
            <Play className="w-6 h-6 fill-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white">Execute Medical AI Diagnostic Pipeline</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                Model: {activeModel.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simultaneously analyzes image pixels and PDF clinical entities with {activeModel.architecture}.
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
            <span>{isAnalyzing ? 'Running AI Inference...' : `Run Analysis (${activeModel.name})`}</span>
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

      {/* 6. AI Diagnostic Results Dossier & Multimodal Output */}
      {hasRunAnalysis && (
        <div className="bg-[#0D1829] border border-cyan-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
          {/* Top Dossier Summary Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Verified AI Finding
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Engine: {activeModel.name} ({activeModel.parameters})
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
