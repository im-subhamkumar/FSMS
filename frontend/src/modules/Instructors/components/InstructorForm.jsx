
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AlertTriangle, Check, ChevronRight, FileText, BookOpen, Plus, Trash2, Loader2, X } from 'lucide-react';
import { instructorsService } from '../services/instructorsService';
import { DOCUMENT_SLOTS, COUNTRIES, INDIAN_STATES, NATIONALITIES, DESIGNATIONS, DEPARTMENTS, EMPLOYMENT_TYPES, AUTHORITIES, LICENSE_TYPES, RATINGS_LIST, AIRCRAFT_TYPES, SUBJECTS_LIST, MEDICAL_CLASSES, WEEKDAYS } from '../utils/formConstants';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import PremiumDatePicker from '../../../components/ui/PremiumDatePicker';
import PremiumSelect from '../../../components/ui/PremiumSelect';
import { ConfirmModal } from '../components/ConfirmModal';


// ✅ DOCUMENT VALIDATION (moved correctly)
const REQUIRED_DOCS = ['License', 'Medical', 'ID Proof'];
const PREMIUM_SELECT_CLASS = "w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white hover:border-gray-400 cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center] bg-[size:16px]";

const validateDocuments = (slotFiles, existingDocs) => {
  const uploadedCategories = [];

  Object.keys(slotFiles).forEach((key) => {
    const fileData = slotFiles[key];
    if (fileData) {
      if (Array.isArray(fileData) && fileData.length === 0) return;
      const slot = DOCUMENT_SLOTS.find(s => s.key === key);
      if (slot) uploadedCategories.push(slot.category);
    }
  });

  existingDocs.forEach(doc => uploadedCategories.push(doc.category));

  if (uploadedCategories.length < 3) {
    return 'Upload at least 3 documents';
  }

  const missing = REQUIRED_DOCS.filter(r => !uploadedCategories.includes(r));

  if (missing.length > 0) {
    return `Missing: ${missing.join(', ')}`;
  }

  // Check for duplicate files across slots
  const fileFingerprints = new Set();
  for (const key in slotFiles) {
    const files = slotFiles[key];
    if (!files) continue;
    const filesArr = Array.isArray(files) ? files : [files];
    for (const f of filesArr) {
      const fingerprint = `${f.name}-${f.size}`;
      if (fileFingerprints.has(fingerprint)) {
        return `Duplicate file detected: ${f.name}. Please upload unique documents.`;
      }
      fileFingerprints.add(fingerprint);
    }
  }

  return null;
};


// Form Steps Components

const handleChange = (e, field, formData, setFormData) => {
  let val = e.target.value;
  if (field === 'email') val = val.toLowerCase();
  if (field === 'licenseNumber' || field === 'medicalCertNumber') val = val.toUpperCase();
  setFormData({ ...formData, [field]: val });
};

const handleCheckbox = (e, field, formData, setFormData) => {
  setFormData({ ...formData, [field]: e.target.checked });
};



function MultiSelectPills({ options, selectedValues, onChange }) {
  const toggle = (val) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const value = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        const isSelected = selectedValues.includes(value);
        return (
          <button
            type="button"
            key={value}
            onClick={() => toggle(value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border outline-none ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export function PersonalInfo({ formData, setFormData }) {
  const [errors, setErrors] = useState({});

  const maxDob = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  }, []);

  const isIndia = formData.nationality === 'Indian' || !formData.nationality;

  const validateField = (name, value, otherPhoneVal) => {
    if (name === "email") {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "Invalid email format";
      }
    }

    if (name === "phone" || name === "emergencyPhone") {
      if (value && !/^\d{10}$/.test(value)) {
        return "Must be exactly 10 digits";
      }
      const otherVal = otherPhoneVal !== undefined ? otherPhoneVal : (name === "phone" ? formData.emergencyPhone : formData.phone);
      if (value && value === otherVal) {
        return "Numbers cannot be the same";
      }
    }

    if (name === "pinCode" && isIndia) {
      if (value && !/^\d{6}$/.test(value)) {
        return "Pincode must be 6 digits";
      }
    }

    return "";
  };

  const handleInput = (e, field) => {
    let value = e.target.value;

    if (field === "phone" || field === "emergencyPhone" || field === "pinCode") {
      value = value.replace(/\D/g, "");
    }

    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    setErrors((prev) => {
      const updatedErrors = {
        ...prev,
        [field]: validateField(field, value, field === 'phone' ? formData.emergencyPhone : formData.phone)
      };

      // If we change one phone number, re-validate the other to clear/show consistency error
      if (field === "phone") {
        updatedErrors.emergencyPhone = validateField("emergencyPhone", formData.emergencyPhone, value);
      } else if (field === "emergencyPhone") {
        updatedErrors.phone = validateField("phone", formData.phone, value);
      }

      return updatedErrors;
    });
  };

  return (
    <div className="space-y-4 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div>
          <label className="block text-sm font-medium mb-1">First Name *</label>
          <input
            type="text"
            className="w-full border rounded-xl p-2"
            value={formData.firstName || ''}
            onChange={(e) => handleInput(e, 'firstName')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Last Name *</label>
          <input
            type="text"
            className="w-full border rounded-xl p-2"
            value={formData.lastName || ''}
            onChange={(e) => handleInput(e, 'lastName')}
          />
        </div>

        {/* EMAIL */}
        <div>
          <label className="block text-sm font-medium mb-1">Email *</label>
          <input
            type="email"
            className={`w-full border rounded-xl p-2 ${errors.email ? "border-red-500" : ""}`}
            value={formData.email || ''}
            onChange={(e) => handleInput(e, 'email')}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <PremiumDatePicker
            label="Date of Birth"
            max={maxDob}
            value={formData.dateOfBirth || ''}
            onChange={(e) => handleInput(e, 'dateOfBirth')}
          />
        </div>

        <PremiumSelect
          label="Gender"
          options={['Male', 'Female', 'Other']}
          value={formData.gender || ''}
          onChange={(e) => handleInput(e, 'gender')}
        />

        <PremiumSelect
          label="Nationality"
          options={NATIONALITIES}
          value={formData.nationality || ''}
          onChange={(e) => handleInput(e, 'nationality')}
        />

        {/* PHONE */}
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="text"
            maxLength={10}
            className={`w-full border rounded-xl p-2 ${errors.phone ? "border-red-500" : ""}`}
            value={formData.phone || ''}
            onChange={(e) => handleInput(e, 'phone')}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        {/* EMERGENCY PHONE */}
        <div>
          <label className="block text-sm font-medium mb-1">Emergency Phone</label>
          <input
            type="text"
            maxLength={10}
            className={`w-full border rounded-xl p-2 ${errors.emergencyPhone ? "border-red-500" : ""}`}
            value={formData.emergencyPhone || ''}
            onChange={(e) => handleInput(e, 'emergencyPhone')}
          />
          {errors.emergencyPhone && <p className="text-red-500 text-xs mt-1">{errors.emergencyPhone}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <textarea
          className="w-full border rounded-xl p-2"
          value={formData.address || ''}
          onChange={(e) => handleInput(e, 'address')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <input
            type="text"
            className="w-full border rounded-xl p-2"
            value={formData.city || ''}
            onChange={(e) => handleInput(e, 'city')}
          />
        </div>

        <PremiumSelect
          label="State"
          options={INDIAN_STATES}
          value={formData.state || ''}
          onChange={(e) => handleInput(e, 'state')}
        />

        {/* PINCODE */}
        <div>
          <label className="block text-sm font-medium mb-1">PIN Code</label>
          <input
            type="text"
            maxLength={6}
            className={`w-full border rounded-xl p-2 ${errors.pinCode ? "border-red-500" : ""}`}
            value={formData.pinCode || ''}
            onChange={(e) => handleInput(e, 'pinCode')}
          />
          {errors.pinCode && <p className="text-red-500 text-xs mt-1">{errors.pinCode}</p>}
        </div>

      </div>
    </div>
  );
}

export function Employment({ formData, setFormData }) {
  return (
    <div className="space-y-4 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium mb-1">Employee ID</label>
          <input type="text" className="w-full border rounded-xl p-2 bg-gray-50 text-gray-400 cursor-not-allowed" value={formData.employeeId || 'Auto-generated upon save'} disabled />
        </div>
        <PremiumSelect
          label="Designation"
          options={DESIGNATIONS}
          value={formData.designation || ''}
          onChange={(e) => handleChange(e, 'designation', formData, setFormData)}
        />
        <PremiumSelect
          label="Department"
          options={DEPARTMENTS}
          value={formData.department || ''}
          onChange={(e) => handleChange(e, 'department', formData, setFormData)}
        />
        <PremiumSelect
          label="Employment Type"
          options={EMPLOYMENT_TYPES}
          value={formData.employmentType || ''}
          onChange={(e) => handleChange(e, 'employmentType', formData, setFormData)}
        />
        <div>
          <PremiumDatePicker
            label="Date of Joining"
            value={formData.dateOfJoining || ''}
            onChange={(e) => handleChange(e, 'dateOfJoining', formData, setFormData)}
          />
        </div>
      </div>
    </div>
  );
}

export function Licenses({ formData, setFormData }) {
  const [errors, setErrors] = useState({});

  const parseJSON = (str) => {
    try { return str ? JSON.parse(str) : []; } catch { return []; }
  };
  const parsedLicenseTypes = parseJSON(formData.licenseTypes);
  const parsedRatings = parseJSON(formData.ratings);
  const parsedTypeRatings = parseJSON(formData.typeRatings);

  const validateDates = (field, value, otherDate) => {
    if (field === 'licenseIssueDate') {
      if (otherDate && value && value >= otherDate) return "Issue date must be before expiry date";
    }
    if (field === 'licenseExpiryDate') {
      if (otherDate && value && value <= otherDate) return "Expiry date must be after issue date";
    }
    return "";
  };

  const wrapChange = (e, field) => {
    const val = e.target.value;
    handleChange(e, field, formData, setFormData);

    // Cross-validate dates without waiting for state update
    const nextIssue = field === 'licenseIssueDate' ? val : formData.licenseIssueDate;
    const nextExpiry = field === 'licenseExpiryDate' ? val : formData.licenseExpiryDate;

    if (field === 'licenseIssueDate' || field === 'licenseExpiryDate') {
      const issueError = validateDates('licenseIssueDate', nextIssue, nextExpiry);
      const expiryError = validateDates('licenseExpiryDate', nextExpiry, nextIssue);
      setErrors(prev => ({
        ...prev,
        licenseIssueDate: issueError,
        licenseExpiryDate: expiryError
      }));
    } else if (field === 'licenseNumber') {
      const isValid = /^[A-Z0-9/-]{3,20}$/.test(val || '');
      setErrors(prev => ({ ...prev, [field]: isValid ? '' : 'Invalid format (Use letters, numbers, / or -)' }));
    }
  };

  const handlePillChange = (field, newArray) => {
    setFormData({ ...formData, [field]: JSON.stringify(newArray) });
  };

  const maxToday = useMemo(() => new Date().toISOString().split('T')[0], []);

  return (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">License Number</label>
          <input
            type="text"
            placeholder="e.g. MH-12345/A"
            className={`w-full border rounded-xl p-2.5 ${errors.licenseNumber ? 'border-red-500' : 'border-gray-300'}`}
            value={formData.licenseNumber || ''}
            onChange={(e) => wrapChange(e, 'licenseNumber')}
          />
          {errors.licenseNumber && <p className="text-red-500 text-xs mt-1">{errors.licenseNumber}</p>}
        </div>
        <PremiumSelect
          label="Issuing Authority"
          options={AUTHORITIES}
          value={formData.issuingAuthority || ''}
          onChange={(e) => handleChange(e, 'issuingAuthority', formData, setFormData)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">License Types</label>
        <MultiSelectPills options={LICENSE_TYPES} selectedValues={parsedLicenseTypes} onChange={(arr) => handlePillChange('licenseTypes', arr)} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Ratings</label>
        <MultiSelectPills options={RATINGS_LIST} selectedValues={parsedRatings} onChange={(arr) => handlePillChange('ratings', arr)} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Aircraft Type Ratings</label>
        <MultiSelectPills options={AIRCRAFT_TYPES} selectedValues={parsedTypeRatings} onChange={(arr) => handlePillChange('typeRatings', arr)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <PremiumDatePicker
            label="Issue Date"
            max={maxToday}
            value={formData.licenseIssueDate || ''}
            onChange={(e) => wrapChange(e, 'licenseIssueDate')}
          />
          {errors.licenseIssueDate && <p className="text-red-500 text-xs">{errors.licenseIssueDate}</p>}
        </div>
        <div className="space-y-1">
          <PremiumDatePicker
            label="Expiry Date"
            min={formData.licenseIssueDate || ''}
            value={formData.licenseExpiryDate || ''}
            onChange={(e) => wrapChange(e, 'licenseExpiryDate')}
          />
          {errors.licenseExpiryDate && <p className="text-red-500 text-xs">{errors.licenseExpiryDate}</p>}
        </div>
      </div>
    </div>
  );
}

export function Medical({ formData, setFormData }) {
  const maxToday = useMemo(() => new Date().toISOString().split('T')[0], []);
  return (
    <div className="space-y-4 text-left">
      <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Medical Certificate Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PremiumSelect
          label="Medical Class"
          options={MEDICAL_CLASSES}
          value={formData.medicalClass || ''}
          onChange={(e) => handleChange(e, 'medicalClass', formData, setFormData)}
        />
        <div><label className="block text-sm font-medium mb-1">Certificate Number</label><input type="text" placeholder="e.g. MED/2024/789" className="w-full border rounded-xl p-2.5 border-gray-300" value={formData.medicalCertNumber || ''} onChange={(e) => handleChange(e, 'medicalCertNumber', formData, setFormData)} /></div>
        <div><label className="block text-sm font-medium mb-1">Issuing AME</label><input type="text" className="w-full border rounded-xl p-2.5 border-gray-300" value={formData.medicalIssuingAME || ''} onChange={(e) => handleChange(e, 'medicalIssuingAME', formData, setFormData)} /></div>
        <PremiumSelect
          label="Medical Status"
          options={[
            { value: 'VALID', label: 'Valid' },
            { value: 'EXPIRING_SOON', label: 'Expiring Soon' },
            { value: 'EXPIRED', label: 'Expired' }
          ]}
          value={formData.medicalStatus || ''}
          onChange={(e) => handleChange(e, 'medicalStatus', formData, setFormData)}
        />
        <PremiumDatePicker
          label="Issue Date"
          max={maxToday}
          value={formData.medicalIssueDate || ''}
          onChange={(e) => handleChange(e, 'medicalIssueDate', formData, setFormData)}
        />
        <PremiumDatePicker
          label="Expiry Date"
          min={formData.medicalIssueDate || ''}
          value={formData.medicalExpiryDate || ''}
          onChange={(e) => handleChange(e, 'medicalExpiryDate', formData, setFormData)}
        />
      </div>
    </div>
  );
}

export function Experience({ formData, setFormData }) {
  const maxToday = useMemo(() => new Date().toISOString().split('T')[0], []);
  return (
    <div className="space-y-4 text-left">
      <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Experience & Currency</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div><label className="block text-sm font-medium mb-1">Total Hours</label><input type="number" placeholder="Total flying hours" className="w-full border rounded-xl p-2.5 border-gray-300" value={formData.totalHours || ''} onChange={(e) => handleChange(e, 'totalHours', formData, setFormData)} /></div>
        <div><label className="block text-sm font-medium mb-1">PIC Hours</label><input type="number" placeholder="Hours as PIC" className="w-full border rounded-xl p-2.5 border-gray-300" value={formData.picHours || ''} onChange={(e) => handleChange(e, 'picHours', formData, setFormData)} /></div>
        <div><label className="block text-sm font-medium mb-1">Dual Hours</label><input type="number" placeholder="Hours as Instructor" className="w-full border rounded-xl p-2.5 border-gray-300" value={formData.dualHours || ''} onChange={(e) => handleChange(e, 'dualHours', formData, setFormData)} /></div>
        <div><label className="block text-sm font-medium mb-1">Simulator Hours</label><input type="number" placeholder="Sim hours" className="w-full border rounded-xl p-2.5 border-gray-300" value={formData.simHours || ''} onChange={(e) => handleChange(e, 'simHours', formData, setFormData)} /></div>
        <div><label className="block text-sm font-medium mb-1">Night Hours</label><input type="number" placeholder="Night flying" className="w-full border rounded-xl p-2.5 border-gray-300" value={formData.nightHours || ''} onChange={(e) => handleChange(e, 'nightHours', formData, setFormData)} /></div>
        <div><label className="block text-sm font-medium mb-1">Instrument Hours</label><input type="number" placeholder="Instrument hours" className="w-full border rounded-xl p-2.5 border-gray-300" value={formData.instrumentHours || ''} onChange={(e) => handleChange(e, 'instrumentHours', formData, setFormData)} /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PremiumDatePicker
          label="Last Flight Date"
          max={maxToday}
          value={formData.lastFlightDate || ''}
          onChange={(e) => handleChange(e, 'lastFlightDate', formData, setFormData)}
        />
        <PremiumSelect
          label="Flight Currency Status"
          options={[
            { value: 'VALID', label: 'Valid' },
            { value: 'EXPIRING_SOON', label: 'Expiring Soon' },
            { value: 'EXPIRED', label: 'Expired' }
          ]}
          value={formData.flightCurrencyStatus || ''}
          onChange={(e) => handleChange(e, 'flightCurrencyStatus', formData, setFormData)}
        />
      </div>
    </div>
  );
}

export function GroundQuals({ formData, setFormData }) {
  const parseJSON = (str) => {
    try { return str ? JSON.parse(str) : []; } catch { return []; }
  };
  const parsedSubjects = parseJSON(formData.subjectsCanTeach);
  const handlePillChange = (field, newArray) => {
    setFormData({ ...formData, [field]: JSON.stringify(newArray) });
  };
  return (
    <div className="space-y-6 text-left">
      <div>
        <label className="block text-sm font-medium mb-2">Subjects Qualified to Teach</label>
        <MultiSelectPills options={SUBJECTS_LIST} selectedValues={parsedSubjects} onChange={(arr) => handlePillChange('subjectsCanTeach', arr)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PremiumDatePicker
          label="FIS Standardization Date"
          value={formData.fisDate || ''}
          onChange={(e) => handleChange(e, 'fisDate', formData, setFormData)}
        />
      </div>
    </div>
  );
}

export function Availability({ formData, setFormData }) {
  const parseJSON = (str) => {
    try { return str ? JSON.parse(str) : []; } catch { return []; }
  };
  const parsedDays = parseJSON(formData.workDays);
  const handlePillChange = (field, newArray) => {
    setFormData({ ...formData, [field]: JSON.stringify(newArray) });
  };
  return (
    <div className="space-y-6 text-left">
      <div>
        <label className="block text-sm font-medium mb-2">Working Days</label>
        <MultiSelectPills options={WEEKDAYS.map(w => ({ label: w.label, value: w.short }))} selectedValues={parsedDays} onChange={(arr) => handlePillChange('workDays', arr)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium mb-1">Preferred Start Time (e.g., 08:00)</label><input type="time" className="w-full border rounded-xl p-2" value={formData.preferredStartTime || ''} onChange={(e) => handleChange(e, 'preferredStartTime', formData, setFormData)} /></div>
        <div><label className="block text-sm font-medium mb-1">Preferred End Time (e.g., 17:00)</label><input type="time" className="w-full border rounded-xl p-2" value={formData.preferredEndTime || ''} onChange={(e) => handleChange(e, 'preferredEndTime', formData, setFormData)} /></div>
        <div><label className="block text-sm font-medium mb-1">Max Flight Hrs/Day</label><input type="number" className="w-full border rounded-xl p-2" value={formData.maxFlightHrsDay || ''} onChange={(e) => handleChange(e, 'maxFlightHrsDay', formData, setFormData)} /></div>
        <div><label className="block text-sm font-medium mb-1">Max Dual Hrs/Month</label><input type="number" className="w-full border rounded-xl p-2" value={formData.maxDualHrsMonth || ''} onChange={(e) => handleChange(e, 'maxDualHrsMonth', formData, setFormData)} /></div>
      </div>
      <div className="flex flex-wrap gap-6 mt-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={formData.canDoSim || false} onChange={(e) => handleCheckbox(e, 'canDoSim', formData, setFormData)} />
          Simulator Sessions
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={formData.canDoGround || false} onChange={(e) => handleCheckbox(e, 'canDoGround', formData, setFormData)} />
          Ground School
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={formData.canDoNight || false} onChange={(e) => handleCheckbox(e, 'canDoNight', formData, setFormData)} />
          Night Flying
        </label>
      </div>
    </div>
  );
}

export function Documents({ slotFiles, setSlotFiles, existingDocs = [], onDeleteExisting }) {
  const handleFileChange = (slotKey, filesArr, multiple) => {
    if (multiple) {
      const current = slotFiles[slotKey] || [];
      // Append new files instead of replacing for multi-slots
      setSlotFiles(prev => ({ ...prev, [slotKey]: [...current, ...Array.from(filesArr)] }));
    } else {
      setSlotFiles(prev => ({ ...prev, [slotKey]: filesArr[0] }));
    }
  };

  const removeFile = (slotKey, index = -1) => {
    setSlotFiles(prev => {
      const newState = { ...prev };
      if (index === -1 || !Array.isArray(newState[slotKey])) {
        delete newState[slotKey];
      } else {
        newState[slotKey] = newState[slotKey].filter((_, i) => i !== index);
        if (newState[slotKey].length === 0) delete newState[slotKey];
      }
      return newState;
    });
  };

  const getExistingForSlot = (category) => {
    return existingDocs.filter(d => d.category === category);
  };

  return (
    <div className="space-y-4 text-left">
      <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Manage Documents</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DOCUMENT_SLOTS.map(slot => {
          const isMultiple = slot.key === 'license';
          const newFiles = slotFiles[slot.key];
          const existing = getExistingForSlot(slot.category);

          return (
            <div key={slot.key} className="border border-gray-200 p-5 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-1">
                <label className="block font-bold text-sm text-gray-800">
                  {slot.label} {slot.required && <span className="text-red-500">*</span>}
                </label>
                {existing.length > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase">Stored</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-4">{slot.hint}</p>

              <div className="space-y-3">
                {/* Existing Files (From DB) */}
                {existing.length > 0 && (
                  <div className="space-y-1">
                    {existing.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-emerald-50/50 border border-emerald-100 rounded-xl group/existing">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span className="text-xs text-emerald-700 font-medium truncate">{doc.label || 'Existing Document'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeleteExisting(doc.id)}
                          className="p-1 hover:bg-white rounded-md text-red-500 opacity-60 hover:opacity-100 transition-all shadow-sm"
                          title="Permanently remove from database"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New Files (Pending Upload) */}
                {newFiles && (
                  <div className="space-y-1">
                    {isMultiple && Array.isArray(newFiles) ? (
                      newFiles.map((f, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-100 rounded-xl">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="h-3 w-3 text-blue-600 shrink-0" />
                            <span className="text-xs text-blue-700 font-medium truncate">{f.name}</span>
                          </div>
                          <button type="button" onClick={() => removeFile(slot.key, i)} className="p-1 hover:bg-white rounded-md text-red-500 transition-colors">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-100 rounded-xl">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="h-3 w-3 text-blue-600 shrink-0" />
                          <span className="text-xs text-blue-700 font-medium truncate">{newFiles.name}</span>
                        </div>
                        <button type="button" onClick={() => removeFile(slot.key)} className="p-1 hover:bg-white rounded-md text-red-500 transition-colors">
                          <AlertTriangle className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="relative">
                  <input
                    type="file"
                    multiple={isMultiple}
                    id={`file-${slot.key}`}
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={(e) => handleFileChange(slot.key, e.target.files, isMultiple)}
                    className="hidden"
                  />
                  <label
                    htmlFor={`file-${slot.key}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border-2 border-dashed border-gray-200 rounded-xl text-blue-600 text-xs font-bold hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <Plus className="h-3 w-3" />
                    {existing.length > 0 || newFiles ? 'Add New File' : 'Choose File'}
                  </label>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

// ─── MAIN FORM ────────────────────────────────────────────────────────────────
export function InstructorForm({ isEdit = false }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(() => {
    if (!isEdit) {
      const saved = localStorage.getItem('instructorFormDraft');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.step || 0;
        } catch (e) {
          return 0;
        }
      }
    }
    return 0;
  });

  const [maxStepReached, setMaxStepReached] = useState(() => {
    if (!isEdit) {
      const saved = localStorage.getItem('instructorFormDraft');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.maxStepReached || 0;
        } catch (e) {
          return 0;
        }
      }
    }
    return 0;
  });

  const [slotFiles, setSlotFiles] = useState({});
  const [existingDocs, setExistingDocs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null, confirmLabel: '' });

  const [formData, setFormData] = useState(() => {
    const defaults = {
      canDoSim: true,
      canDoGround: true,
      canDoNight: false,
      country: 'India',
      flightCurrencyStatus: 'VALID',
      medicalStatus: 'VALID'
    };
    if (!isEdit) {
      const saved = localStorage.getItem('instructorFormDraft');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.formData) return { ...defaults, ...parsed.formData };
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }
    }
    return defaults;
  });
  const isLastStep = step === 7;

  useEffect(() => {
    if (isEdit && id) {
      instructorsService.get(id).then(data => {
        const parseDate = (d) => d ? new Date(d).toISOString().split('T')[0] : '';
        setFormData({
          ...data,
          ...data.user,
          dateOfBirth: parseDate(data.dateOfBirth),
          dateOfJoining: parseDate(data.dateOfJoining),
          licenseIssueDate: parseDate(data.licenseIssueDate),
          licenseExpiryDate: parseDate(data.licenseExpiryDate),
          medicalIssueDate: parseDate(data.medicalIssueDate),
          medicalExpiryDate: parseDate(data.medicalExpiryDate),
          lastFlightDate: parseDate(data.lastFlightDate),
          fisDate: parseDate(data.fisDate)
        });
        setExistingDocs(data.documents || []);
        setMaxStepReached(7);
      }).catch(err => setSaveError('Failed to load instructor data'));
    }
  }, [isEdit, id]);

  const deleteExistingDoc = async (docId) => {
    setConfirmModal({
      open: true,
      title: "Delete Document?",
      message: "Are you sure you want to permanently delete this document? This action cannot be undone.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await instructorsService.deleteDocument(id, docId);
          setExistingDocs(prev => prev.filter(d => d.id !== docId));
        } catch (err) {
          setSaveError("Failed to delete document: " + err.message);
        }
      }
    });
  };

  useEffect(() => {
    if (!isEdit) {
      localStorage.setItem('instructorFormDraft', JSON.stringify({ formData, step, maxStepReached }));
    }
  }, [formData, step, maxStepReached, isEdit]);

  // ✅ VALIDATION + BLOCKING
  const validateStepFields = () => {
    let required = [];
    if (step === 0) required = ['firstName', 'lastName', 'email', 'dateOfBirth', 'gender', 'nationality', 'phone', 'emergencyPhone', 'address', 'city', 'state', 'pinCode'];
    else if (step === 1) required = ['designation', 'department', 'employmentType', 'dateOfJoining'];
    else if (step === 2) required = ['licenseNumber', 'issuingAuthority', 'licenseTypes', 'ratings', 'typeRatings', 'licenseIssueDate', 'licenseExpiryDate'];
    else if (step === 3) required = ['medicalClass', 'medicalCertNumber', 'medicalIssuingAME', 'medicalStatus', 'medicalIssueDate', 'medicalExpiryDate'];
    else if (step === 4) required = ['totalHours', 'picHours', 'dualHours', 'simHours', 'nightHours', 'instrumentHours', 'lastFlightDate', 'flightCurrencyStatus'];
    else if (step === 5) required = ['subjectsCanTeach', 'fisDate'];
    else if (step === 6) required = ['workDays', 'preferredStartTime', 'preferredEndTime', 'maxFlightHrsDay', 'maxDualHrsMonth'];

    for (const field of required) {
      const val = formData[field];
      if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '') || val === '[]') {
        const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        return `Mandatory field missing: ${fieldName}`;
      }
    }

    if (step === 0) {
      if (!/^[A-Za-z\s]{1,}$/.test(formData.firstName)) return 'First name must contain at least 1 alphabetic character.';
      if (!/^[A-Za-z\s]{1,}$/.test(formData.lastName)) return 'Last name must contain at least 1 alphabetic character.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Invalid email format.';
      if (!/^\d{10}$/.test(formData.phone)) return 'Phone must contain exactly 10 digits.';
      if (!/^\d{10}$/.test(formData.emergencyPhone)) return 'Emergency phone must contain exactly 10 digits.';
      if (formData.phone === formData.emergencyPhone) return 'Emergency phone cannot be exactly the same as personal phone.';
      if (formData.address?.length < 5) return 'Address is too short.';
      if (formData.city?.length < 3) return 'City is too short.';
    } else if (step === 2) {
      if (formData.licenseIssueDate && formData.licenseExpiryDate && formData.licenseExpiryDate <= formData.licenseIssueDate) {
        return 'License Expiry Date must be after the Issue Date.';
      }
    } else if (step === 3) {
      if (formData.medicalIssueDate && formData.medicalExpiryDate && formData.medicalExpiryDate <= formData.medicalIssueDate) {
        return 'Medical Expiry Date must be after the Issue Date.';
      }
    } else if (step === 4) {
      if (formData.totalHours && parseFloat(formData.totalHours) < 0) return 'Total Hours cannot be negative.';
      if (formData.picHours && parseFloat(formData.picHours) < 0) return 'PIC Hours cannot be negative.';
    }

    return '';
  };

  const handleNext = () => {
    const errorMsg = validateStepFields();
    if (errorMsg) {
      setSaveError(errorMsg);
      return;
    }

    if (step === 7) {
      const docError = validateDocuments(slotFiles, existingDocs);
      if (docError) {
        setSaveError(docError);
        return;
      }
    }

    setSaveError('');
    const nextStep = step + 1;
    setMaxStepReached((prev) => Math.max(prev, nextStep));
    setStep(nextStep);
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    setSaving(true);
    setSaveError('');

    try {
      let instructorId;

      const payload = { ...formData };
      const numericFields = ['totalHours', 'picHours', 'dualHours', 'simHours', 'nightHours', 'instrumentHours', 'maxFlightHrsDay', 'maxDualHrsMonth'];
      numericFields.forEach(f => {
        if (payload[f]) payload[f] = parseFloat(payload[f]);
      });

      if (isEdit) {
        await instructorsService.update(id, payload);
        instructorId = id;
      } else {
        const created = await instructorsService.create(payload);
        instructorId = created.id;
        localStorage.removeItem('instructorFormDraft');
        // Give DB a tiny moment to commit before hammering it with uploads
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // 🔸 UPLOAD DOCUMENTS
      console.log('Starting document uploads for Instructor ID:', instructorId);
      const uploadPromises = [];
      
      for (const slot of DOCUMENT_SLOTS) {
        const fileOrFiles = slotFiles[slot.key];
        if (fileOrFiles) {
          const filesArr = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
          console.log(`Slot ${slot.key} has ${filesArr.length} files`);
          
          for (const f of filesArr) {
            console.log(`Queueing upload: ${slot.category} - ${f.name}`);
            uploadPromises.push(
              instructorsService.uploadDocument(instructorId, f, slot.category, slot.label || f.name)
                .then(res => {
                  console.log(`✅ Uploaded ${f.name} successfully`);
                  return res;
                })
                .catch(err => {
                  console.error(`❌ Failed to upload ${f.name}:`, err);
                  return null; 
                })
            );
          }
        } else {
          console.log(`Slot ${slot.key} is empty`);
        }
      }

      if (uploadPromises.length > 0) {
        const results = await Promise.all(uploadPromises);
        const failedCount = results.filter(r => r === null).length;
        if (failedCount > 0) {
          setConfirmModal({
            open: true,
            title: "Upload Warning",
            message: `${failedCount} document(s) failed to upload. You can re-upload them in Edit mode.`,
            confirmLabel: "Understood",
            onConfirm: () => navigate(`/instructors/${instructorId}`)
          });
          return; // Wait for user to acknowledge
        }
      }



      navigate(`/instructors/${instructorId}`);

    } catch (err) {
      setSaveError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  // 🔥 VALIDATION STATE
  const docError = validateDocuments(slotFiles, existingDocs);
  const isNextDisabled = step === 7 && !!docError;


  const renderStep = () => {
    switch (step) {
      case 0:
        return <PersonalInfo formData={formData} setFormData={setFormData} />;

      case 1:
        return <Employment formData={formData} setFormData={setFormData} />;

      case 2:
        return <Licenses formData={formData} setFormData={setFormData} />;

      case 3:
        return <Medical formData={formData} setFormData={setFormData} />;

      case 4:
        return <Experience formData={formData} setFormData={setFormData} />;

      case 5:
        return <GroundQuals formData={formData} setFormData={setFormData} />;

      case 6:
        return <Availability formData={formData} setFormData={setFormData} />;

      case 7:
        return (
          <Documents
            slotFiles={slotFiles}
            setSlotFiles={setSlotFiles}
            existingDocs={existingDocs}
            onDeleteExisting={deleteExistingDoc}
          />
        );

      default:
        return null;
    }
  };

  const STEPS = [
    { title: 'Personal Info' },
    { title: 'Employment' },
    { title: 'Licenses' },
    { title: 'Medical' },
    { title: 'Experience' },
    { title: 'Ground Quals' },
    { title: 'Availability' },
    { title: 'Documents' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.confirmStep ? () => { confirmModal.onConfirm(); setConfirmModal(prev => ({ ...prev, open: false })); } : async () => { if (confirmModal.onConfirm) await confirmModal.onConfirm(); setConfirmModal(prev => ({ ...prev, open: false })); }}
        onCancel={() => setConfirmModal(prev => ({ ...prev, open: false }))}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{isEdit ? 'Edit Instructor Profile' : 'Add New Instructor'}</h1>
          <p className="text-gray-500">Fill in all sections to create a complete instructor profile.</p>
        </div>
        {isEdit && (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save Changes
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6 mt-6">

        {/* TOP HORIZONTAL BREADCRUMB STEPPER */}
        <div className="flex flex-wrap items-center gap-2 bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100">
          {STEPS.map((s, idx) => {
            const isCompleted = step > idx;
            const isCurrent = step === idx;
            const isEnabled = isEdit || idx <= maxStepReached;
            const lastVisibleIdx = isEdit ? STEPS.length - 1 : maxStepReached;

            if (!isEnabled) return null;

            return (
              <React.Fragment key={idx}>
                <button
                  type="button"
                  onClick={() => setStep(idx)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${isCurrent ? 'bg-blue-50 text-blue-700 shadow-sm' :
                    isCompleted ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <div className={`flex items-center justify-center h-6 w-6 rounded-full shrink-0 ${isCompleted ? 'bg-emerald-500 text-white' :
                    isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                    {isCompleted ? <Check className="h-4 w-4 flex-shrink-0 stroke-[3]" /> : <span className="text-[11px] font-bold">{idx + 1}</span>}
                  </div>
                  <span className={`text-sm font-semibold ${isCurrent ? 'text-blue-700' : 'text-gray-600'}`}>{s.title}</span>
                </button>
                {idx < lastVisibleIdx && <ChevronRight className="h-4 w-4 text-gray-300 mx-1" />}
              </React.Fragment>
            )
          })}
        </div>

        {/* RIGHT FORM AREA */}
        <div className="w-full">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[500px] flex flex-col">

            {/* STEP HEADER */}
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                {STEPS[step].title === "Ground Quals" ? <BookOpen className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{STEPS[step].title}</h2>
                <p className="text-sm text-gray-500 font-medium">Step {step + 1} of 8</p>
              </div>
            </div>

            {/* PROGRESS */}
            <div className="w-full bg-gray-100 h-1.5 rounded-full mb-8 overflow-hidden">
              <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
            </div>

            <div className="flex-1">
              {/* ERROR DISPLAY */}
              {step === 7 && docError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {docError}
                </div>
              )}
              {saveError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {saveError}
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* BOTTOM ACTIONS */}
            <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between items-center">
              <button
                onClick={handleBack}
                disabled={step === 0}
                className={`flex items-center gap-2 font-semibold transition-colors ${step === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900'}`}
              >
                &lt; Back
              </button>

              <div className="flex gap-3">
                <button type="button" onClick={() => navigate('/instructors')} className="px-6 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
                {isLastStep ? (
                  <button
                    onClick={handleSubmit}
                    disabled={saving || isNextDisabled}
                    className="px-8 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="px-8 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}