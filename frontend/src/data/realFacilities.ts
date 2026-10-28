// realFacilities.ts - Real-World Healthcare Facilities with Real Addresses and Google Maps Links

export interface MedicalFacility {
  id: string;
  name: string;
  category: 'Clinic' | 'Laboratory' | 'Pharmacy' | 'Specialist Hospital';
  address: string;
  phone: string;
  hours: string;
  googleMapsUrl: string;
}

export const REAL_CLINIC: MedicalFacility = {
  id: 'clinic-delhi-01',
  name: 'Max Multi Speciality Centre',
  category: 'Clinic',
  address: 'N-110, Panchsheel Park, New Delhi, Delhi 110017',
  phone: '+91 11 4609 7200',
  hours: 'Mon-Sat: 08:00 AM - 08:00 PM',
  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Max+Multi+Speciality+Centre+Panchsheel+Park+New+Delhi'
};

export const REAL_LABORATORY: MedicalFacility = {
  id: 'lab-lalpath-01',
  name: 'Dr. Lal PathLabs National Reference Laboratory',
  category: 'Laboratory',
  address: 'Block E, Sector 18, Rohini, New Delhi, Delhi 110085',
  phone: '+91 11 3988 5050',
  hours: 'Open 24/7 (Specimen Collection & Analysis)',
  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dr+Lal+PathLabs+National+Reference+Lab+Rohini+Delhi'
};

export const REAL_PHARMACY: MedicalFacility = {
  id: 'pharm-apollo-01',
  name: 'Apollo Pharmacy 24x7 Express',
  category: 'Pharmacy',
  address: 'Shop No. 4, Community Centre, New Friends Colony, New Delhi, Delhi 110025',
  phone: '+91 11 2684 0405',
  hours: 'Open 24 Hours, 7 Days a Week',
  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Apollo+Pharmacy+New+Friends+Colony+New+Delhi'
};

export const FAMOUS_SPECIALISTS: Array<{
  specialistType: string;
  doctorName: string;
  title: string;
  hospital: string;
  hospitalAddress: string;
  googleMapsUrl: string;
}> = [
  {
    specialistType: 'Cardiologist',
    doctorName: 'Dr. Devi Prasad Shetty, MS, FRCS',
    title: 'World-Renowned Cardiac Surgeon & Padma Bhushan Awardee',
    hospital: 'Narayana Health City',
    hospitalAddress: '258/A, Bommasandra Industrial Area, Bengaluru, Karnataka 560099',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Narayana+Health+City+Bangalore'
  },
  {
    specialistType: 'Cardiologist',
    doctorName: 'Dr. Naresh Trehan, MBBS, FACS',
    title: 'Chairman & Chief Cardiac Surgeon, Medanta Heart Institute',
    hospital: 'Medanta - The Medicity',
    hospitalAddress: 'CH Bakhtawar Singh Rd, Sector 38, Gurugram, Haryana 122001',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Medanta+The+Medicity+Gurugram'
  },
  {
    specialistType: 'Neurologist',
    doctorName: 'Dr. Peter Goadsby, MD, PhD, FMedSci',
    title: 'World Authority on Migraines & Brain Neuropathy (Brain Prize Winner)',
    hospital: 'Mayo Clinic & King’s College London',
    hospitalAddress: '200 1st St SW, Rochester, MN 55905, USA',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Mayo+Clinic+Rochester+MN'
  },
  {
    specialistType: 'Endocrinologist',
    doctorName: 'Dr. Ambrish Mithal, MD, DM',
    title: 'Chairman of Endocrinology & Diabetes (Padma Bhushan Awardee)',
    hospital: 'Max Super Speciality Hospital',
    hospitalAddress: '1, 2, Press Enclave Marg, Saket, New Delhi, Delhi 110017',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Max+Super+Speciality+Hospital+Saket+New+Delhi'
  },
  {
    specialistType: 'Pulmonologist',
    doctorName: 'Dr. Randeep Guleria, MD, DM',
    title: 'Former Director AIIMS New Delhi & Renowned Pulmonologist',
    hospital: 'Medanta Hospital & AIIMS New Delhi',
    hospitalAddress: 'CH Bakhtawar Singh Rd, Sector 38, Gurugram, Haryana 122001',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Medanta+The+Medicity+Gurugram'
  },
  {
    specialistType: 'Infectious Disease Specialist',
    doctorName: 'Dr. Anthony Fauci, MD',
    title: 'Renowned Immunologist & Infectious Disease Authority',
    hospital: 'National Institutes of Health Clinical Center',
    hospitalAddress: '10 Center Dr, Bethesda, MD 20892, USA',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=NIH+Clinical+Center+Bethesda+MD'
  }
];

