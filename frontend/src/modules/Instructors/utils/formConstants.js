// ─── COUNTRIES ────────────────────────────────────────────────────────────────
export const COUNTRIES = [
  'India','United States','United Kingdom','Canada','Australia','New Zealand',
  'Singapore','Malaysia','UAE','Saudi Arabia','South Africa','Germany','France',
  'Netherlands','Sweden','Norway','Switzerland','Japan','South Korea','Philippines',
  'Sri Lanka','Nepal','Bangladesh','Pakistan','Kenya','Nigeria','Ghana','Other',
];

// ─── INDIAN STATES ────────────────────────────────────────────────────────────
export const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
  // UTs
  'Andaman and Nicobar Islands','Chandigarh','Dadra & Nagar Haveli and Daman & Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

// ─── NATIONALITIES ────────────────────────────────────────────────────────────
export const NATIONALITIES = [
  'Indian','American','British','Canadian','Australian','New Zealander',
  'Singaporean','Malaysian','Emirati','Saudi','South African','German','French',
  'Dutch','Swedish','Norwegian','Swiss','Japanese','South Korean','Filipino',
  'Sri Lankan','Nepali','Bangladeshi','Pakistani','Kenyan','Nigerian','Ghanaian','Other',
];

// ─── DESIGNATIONS ─────────────────────────────────────────────────────────────
export const DESIGNATIONS = [
  { value: 'CHIEF_FLIGHT_INSTRUCTOR',  label: 'Chief Flight Instructor' },
  { value: 'SENIOR_FLIGHT_INSTRUCTOR', label: 'Senior Flight Instructor' },
  { value: 'FLIGHT_INSTRUCTOR',        label: 'Flight Instructor' },
  { value: 'GROUND_INSTRUCTOR',        label: 'Ground Instructor' },
  { value: 'SIMULATOR_INSTRUCTOR',     label: 'Simulator Instructor' },
];

export const DEPARTMENTS = [
  { value: 'FLYING',    label: 'Flying' },
  { value: 'GROUND',    label: 'Ground' },
  { value: 'SIMULATOR', label: 'Simulator' },
];

export const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT',  label: 'Contract' },
];

export const AUTHORITIES       = ['DGCA','FAA','EASA','Transport Canada','SACAA','Other'];
export const LICENSE_TYPES     = ['CPL','ATPL','PPL','FI','CFI','CFII','IR'];
export const RATINGS_LIST      = ['SEP','MEP','IR','Night Rating','Floatplane','Aerobatics','Mountain Flying'];
export const AIRCRAFT_TYPES    = ['C-172','C-182','PA-28','PA-44','DA-20','DA-40','DA-42','BE-76','BE-58','Tecnam P2010','Other'];
export const SUBJECTS_LIST     = ['Air Navigation','Meteorology','Air Regulations','Technical General','Technical Specific','Radio Telephony (RT)','Human Factors','Flight Planning'];
export const MEDICAL_CLASSES   = ['Class 1','Class 2','Class 3'];
export const WEEKDAYS          = [
  { short: 'MON', label: 'Mon' },{ short: 'TUE', label: 'Tue' },
  { short: 'WED', label: 'Wed' },{ short: 'THU', label: 'Thu' },
  { short: 'FRI', label: 'Fri' },{ short: 'SAT', label: 'Sat' },
  { short: 'SUN', label: 'Sun' },
];

// ─── DOCUMENT SLOTS ───────────────────────────────────────────────────────────
// Each slot = one dedicated upload area in the Documents step
export const DOCUMENT_SLOTS = [
  { key: 'license',     label: 'License Document',               category: 'License',                        required: true,  hint: 'Upload DGCA / FAA license copy (PDF/Image)' },
  { key: 'medical',     label: 'Medical Certificate',            category: 'Medical',                        required: true,  hint: 'Upload valid medical certificate' },
  { key: 'idProof',     label: 'Government ID Proof',            category: 'ID Proof',                       required: true,  hint: 'Passport, Aadhaar, or National ID' },
  { key: 'addressProof',label: 'Address Proof',                  category: 'Address Proof',                  required: false, hint: 'Utility bill, bank statement, rental agreement' },
  { key: 'qualification',label:'Qualification Certificate',      category: 'Qualification Certificate',      required: false, hint: 'Degree / diploma certificates' },
  { key: 'employment',  label: 'Previous Employment Letter',     category: 'Employment Letter',              required: false, hint: 'Relieving or experience letter from previous employer' },
  { key: 'background',  label: 'Background Check Document',      category: 'Background Check',              required: false, hint: 'Police clearance / background verification' },
  { key: 'contract',    label: 'Offer Letter / Contract',        category: 'Contract / Offer Letter',       required: false, hint: 'Signed contract or appointment letter' },
  { key: 'fis',         label: 'FIS Certificate',               category: 'FIS Certificate',               required: false, hint: 'Flight Instructor Standardization certificate' },
  { key: 'groundCert',  label: 'Ground Instructor Certificate',  category: 'Ground Instructor Certificate', required: false, hint: 'Ground instructor qualification certificate' },
];

// ─── VALIDATORS ───────────────────────────────────────────────────────────────
export const validators = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v?.trim() || '') ? '' : 'Enter a valid email address',

  phone: (v) => {
    const stripped = (v || '').replace(/[\s\-().+]/g, '');
    if (!stripped) return 'Phone number is required';
    if (!/^\d{7,15}$/.test(stripped)) return 'Enter 7–15 digits (may include country code)';
    return '';
  },

  pincode: (v, country) => {
    if (!v) return '';
    if ((country === 'India' || !country) && !/^\d{6}$/.test(v)) return 'Indian PIN must be exactly 6 digits';
    if (country === 'United States' && !/^\d{5}(-\d{4})?$/.test(v)) return 'US ZIP must be 5 or 9 digits (e.g. 90210 or 90210-1234)';
    return '';
  },

  required: (v, label) => (!v || !String(v).trim() ? `${label} is required` : ''),

  password: (v) => (!v || v.length < 8 ? 'Password must be at least 8 characters' : ''),

  date: (v, label) => (!v ? `${label} is required` : ''),
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export function parseJSON(str) {
  if (!str) return [];
  try { return JSON.parse(str); } catch { return []; }
}

/** Returns a file "fingerprint" to detect duplicates across slots */
export function fileFingerprint(file) {
  return `${file.name}__${file.size}`;
}
