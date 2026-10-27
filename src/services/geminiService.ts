// geminiService.ts - Gemini LLM Medicine & Specialist Recommendation Engine
export interface AiClinicalRecommendation {
  medicationName: string;
  dosage: string;
  instructions: string;
  labTestName: string;
  labPriority: 'Routine' | 'Urgent';
  specialist: string;
  famousDoctorName: string;
  famousHospital: string;
  referralReason: string;
}

export interface SymptomSample {
  id: string;
  label: string;
  emoji: string;
  symptoms: string;
}

export const RECOMMENDED_SYMPTOM_SAMPLES: SymptomSample[] = [
  {
    id: 'headache',
    label: 'Headache & Migraine',
    emoji: '🤕',
    symptoms: 'Severe throbbing headache on right temple with nausea, photo-sensitivity and visual aura'
  },
  {
    id: 'fever',
    label: 'High Fever & Cough',
    emoji: '🔥',
    symptoms: 'High grade fever (102°F) with seasonal productive cough, body aches and chills for 3 days'
  },
  {
    id: 'chest',
    label: 'Chest Pain / Cardiac',
    emoji: '❤️',
    symptoms: 'Exertional substernal chest heaviness, mild breathlessness and bilateral ankle swelling'
  },
  {
    id: 'diabetes',
    label: 'Diabetes & High Sugar',
    emoji: '🩸',
    symptoms: 'Elevated fasting blood sugar (210 mg/dL), excessive thirst, fatigue and frequent urination'
  },
  {
    id: 'acidity',
    label: 'Acidity & GERD',
    emoji: '🤢',
    symptoms: 'Severe burning retrosternal heartburn, sour regurgitation and epigastric discomfort after meals'
  },
  {
    id: 'asthma',
    label: 'Asthma & Wheezing',
    emoji: '🫁',
    symptoms: 'Acute episodic wheezing, nocturnal dry coughing fits and tightness in chest'
  },
  {
    id: 'joint',
    label: 'Joint & Knee Pain',
    emoji: '🦴',
    symptoms: 'Severe bilateral knee stiffness in morning, swelling and difficulty climbing stairs'
  }
];

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export async function getAiMedicineRecommendation(
  symptoms: string,
  patientName?: string,
  age?: number
): Promise<AiClinicalRecommendation> {
  const prompt = `You are a medical decision-support assistant for a clinic consultation platform.
Patient details: Name: "${patientName || 'Patient'}", Age: ${age || 35}, Chief Complaint/Symptoms: "${symptoms}".

Based on the symptom, provide clinically appropriate evidence-based:
1. First-line OTC or standard prescription medication (e.g., for headache: Sumatriptan or Paracetamol; for fever: Paracetamol or Azithromycin; for diabetes: Metformin; for hypertension: Amlodipine/Lisinopril).
2. Standard dosage strength.
3. Patient directions/instructions.
4. Appropriate diagnostic laboratory test (e.g. Brain MRI / Blood test for headache; CBC / Dengue for fever; HbA1c for diabetes; ECG / Troponin for chest pain).
5. Lab priority: either "Routine" or "Urgent".
6. Medical specialist type (e.g. Neurologist, Cardiologist, Endocrinologist, Pulmonologist, Gastroenterologist).
7. A real internet-famous doctor in that field (e.g. Dr. Peter Goadsby, Dr. Devi Shetty, Dr. Naresh Trehan, Dr. Randeep Guleria, Dr. Ambrish Mithal, Dr. Oliver Sacks, Dr. Eric Topol).
8. The famous doctor's renowned hospital / institute (e.g. Mayo Clinic, Narayana Health, Medanta, AIIMS, Johns Hopkins).
9. Brief clinical reason for referral.

Return ONLY a valid JSON object without markdown formatting, code fences, or backticks:
{
  "medicationName": "string",
  "dosage": "string",
  "instructions": "string",
  "labTestName": "string",
  "labPriority": "Routine or Urgent",
  "specialist": "string",
  "famousDoctorName": "string",
  "famousHospital": "string",
  "referralReason": "string"
}`;

  // 1. Try local dev server proxy first (avoids CORS and sandbox limits)
  try {
    const serverRes = await fetch('/api/gemini/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms, patientName, age })
    });
    if (serverRes.ok) {
      const serverData = await serverRes.json();
      if (serverData.recommendation?.medicationName) {
        return normalizeRecommendation(serverData.recommendation);
      }
    }
  } catch {
    // Continue to browser fetch or fallback
  }

  // 2. Try direct Google Gemini API call with official model names
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return normalizeRecommendation(parsed);
      }
    } catch {
      // try next model
    }
  }

  // 3. Fallback to comprehensive medical rules engine
  return getLocalFallbackRecommendation(symptoms);
}

function normalizeRecommendation(parsed: Partial<AiClinicalRecommendation>): AiClinicalRecommendation {
  return {
    medicationName: parsed.medicationName || 'Sumatriptan 50mg Tablets',
    dosage: parsed.dosage || '50 mg orally at onset',
    instructions: parsed.instructions || 'Take 1 tablet with water at onset of symptoms. Rest in a dark, quiet room.',
    labTestName: parsed.labTestName || 'Complete Blood Count (CBC) & Diagnostic Panel',
    labPriority: parsed.labPriority === 'Urgent' ? 'Urgent' : 'Routine',
    specialist: parsed.specialist || 'Neurologist',
    famousDoctorName: parsed.famousDoctorName || 'Dr. Peter Goadsby, MD, PhD, FMedSci',
    famousHospital: parsed.famousHospital || 'Mayo Clinic & King’s College London',
    referralReason: parsed.referralReason || 'Specialized diagnostic evaluation and clinical management'
  };
}

// Fallback recommendations if offline, sandboxed, or key format differs
export function getLocalFallbackRecommendation(symptoms: string): AiClinicalRecommendation {
  const s = symptoms.toLowerCase();
  
  // 1. Headache / Migraine / Cluster Headaches
  if (s.includes('headache') || s.includes('migraine') || s.includes('head pain') || s.includes('temple')) {
    return {
      medicationName: 'Sumatriptan 50mg Tablets',
      dosage: '50 mg single tablet orally',
      instructions: 'Take 1 tablet at the first sign of migraine or severe headache with water. Rest in a dark, quiet room. May repeat after 2 hours if required.',
      labTestName: 'MRI Brain with Contrast & Inflammatory Marker (ESR)',
      labPriority: 'Routine',
      specialist: 'Neurologist',
      famousDoctorName: 'Dr. Peter Goadsby, MD, PhD, FMedSci',
      famousHospital: 'Mayo Clinic & King’s College London',
      referralReason: 'Persistent severe headache evaluation, migraine profiling and neurological screening'
    };
  }
  
  // 2. Fever / Chills / Viral / Flu / Dengue
  if (s.includes('fever') || s.includes('chills') || s.includes('temp') || s.includes('dengue') || s.includes('malaria') || s.includes('pyrexia')) {
    return {
      medicationName: 'Paracetamol 650mg & Azithromycin 500mg',
      dosage: '1 tablet twice daily after meals for 5 days',
      instructions: 'Stay thoroughly hydrated with electrolyte fluids. Take strictly after meals to prevent gastric irritation.',
      labTestName: 'Complete Blood Count (CBC) + Widal & Dengue NS1 Antigen',
      labPriority: 'Urgent',
      specialist: 'Infectious Disease Specialist',
      famousDoctorName: 'Dr. Randeep Guleria, MD, DM (Former Director AIIMS)',
      famousHospital: 'Medanta The Medicity & AIIMS New Delhi',
      referralReason: 'Unresolved pyrexia investigation, viral/bacterial antigen profiling and complete hematology review'
    };
  }
  
  // 3. Chest Pain / Cardiac / Heart / Palpitations / Blood Pressure
  if (s.includes('chest') || s.includes('heart') || s.includes('breath') || s.includes('palpitation') || s.includes('angina') || s.includes('bp') || s.includes('hypertension')) {
    return {
      medicationName: 'Furosemide (Lasix) 40mg & Carvedilol 12.5mg',
      dosage: '40 mg once every morning',
      instructions: 'Take in the morning with a full glass of water. Monitor blood pressure and daily body weight regularly.',
      labTestName: 'Cardiac Biomarker (NT-proBNP & Troponin I) + 12-Lead ECG',
      labPriority: 'Urgent',
      specialist: 'Cardiologist',
      famousDoctorName: 'Dr. Devi Prasad Shetty, MS, FRCS',
      famousHospital: 'Narayana Institute of Cardiac Sciences',
      referralReason: 'Acute cardiac evaluation, 2D-Echocardiogram and myocardial strain biomarker review'
    };
  }
  
  // 4. Diabetes / High Sugar / Thirst / Polyuria
  if (s.includes('sugar') || s.includes('glucose') || s.includes('diabetes') || s.includes('thirst') || s.includes('urination')) {
    return {
      medicationName: 'Metformin Hydrochloride Extended-Release 500mg',
      dosage: '500 mg twice daily with meals',
      instructions: 'Take 1 tablet with breakfast and 1 tablet with evening meal to prevent stomach upset.',
      labTestName: 'Hemoglobin A1c (HbA1c) & Fasting Lipid Panel',
      labPriority: 'Routine',
      specialist: 'Endocrinologist',
      famousDoctorName: 'Dr. Ambrish Mithal, MD, DM (Padma Bhushan Awardee)',
      famousHospital: 'Max Super Speciality Hospital, Saket',
      referralReason: 'Suboptimal glycemic control, diabetes management and insulin resistance review'
    };
  }

  // 5. Stomach / Acidity / Acid Reflux / GERD / Gastritis
  if (s.includes('stomach') || s.includes('acid') || s.includes('reflux') || s.includes('gerd') || s.includes('heartburn') || s.includes('nausea') || s.includes('vomit') || s.includes('abdomen')) {
    return {
      medicationName: 'Pantoprazole 40mg & Domperidone 30mg SR',
      dosage: '1 capsule once daily before breakfast',
      instructions: 'Take 30 minutes before morning breakfast on an empty stomach with water. Avoid oily or spicy food.',
      labTestName: 'Upper GI Endoscopy & H. Pylori Stool Antigen Test',
      labPriority: 'Routine',
      specialist: 'Gastroenterologist',
      famousDoctorName: 'Dr. Randhir Sud, MD, DM (Padma Shri Awardee)',
      famousHospital: 'Medanta - The Medicity',
      referralReason: 'Gastroesophageal reflux evaluation, mucosal lining endoscopy and acid management'
    };
  }

  // 6. Asthma / Cough / Wheezing / Bronchitis
  if (s.includes('cough') || s.includes('asthma') || s.includes('wheez') || s.includes('bronch') || s.includes('lungs')) {
    return {
      medicationName: 'Budesonide & Formoterol Inhaler (Symbicort 200/6mcg)',
      dosage: '2 puffs twice daily with spacer',
      instructions: 'Inhale through spacer device as demonstrated. Rinse mouth thoroughly with water after inhalation.',
      labTestName: 'Spirometry (Pulmonary Function Test) & High-Resolution Chest CT',
      labPriority: 'Urgent',
      specialist: 'Pulmonologist',
      famousDoctorName: 'Dr. Randeep Guleria, MD, DM (Former Director AIIMS)',
      famousHospital: 'Medanta Hospital & AIIMS New Delhi',
      referralReason: 'Airway hyperresponsiveness evaluation and bronchodilator reversibility profiling'
    };
  }

  // 7. Joint / Knee / Bone / Arthritis / Back Pain
  if (s.includes('joint') || s.includes('knee') || s.includes('bone') || s.includes('back') || s.includes('arthritis') || s.includes('swelling') || s.includes('spine')) {
    return {
      medicationName: 'Etoricoxib 90mg & Pregabalin 75mg',
      dosage: '1 tablet once daily after dinner',
      instructions: 'Take after meals with water. Do not engage in high-impact physical exertion during acute phase.',
      labTestName: 'Digital Joint X-Ray & Rheumatoid Factor (RF) + Anti-CCP',
      labPriority: 'Routine',
      specialist: 'Orthopedic & Rheumatology Specialist',
      famousDoctorName: 'Dr. Ashok Rajgopal, MS, MCh, FRCS',
      famousHospital: 'Medanta Bone & Joint Institute',
      referralReason: 'Musculoskeletal inflammatory assessment and joint preservation therapy'
    };
  }

  // Default / General Consultation
  return {
    medicationName: 'Amoxicillin & Clavulanate 625mg',
    dosage: '1 tablet twice daily after meals',
    instructions: 'Take with food for 5 full consecutive days. Complete the full antibiotic course.',
    labTestName: 'Comprehensive Metabolic Panel (CMP) + CBC',
    labPriority: 'Routine',
    specialist: 'Internal Medicine Consultant',
    famousDoctorName: 'Dr. Naresh Trehan, MBBS, FACS',
    famousHospital: 'Medanta - The Medicity',
    referralReason: 'Comprehensive clinical evaluation and diagnostic follow-up'
  };
}
