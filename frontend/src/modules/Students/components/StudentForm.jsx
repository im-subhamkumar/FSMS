import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  User, ShieldCheck, HeartPulse, FileText, Lock, 
  ChevronRight, ChevronLeft, Save, Plus, Trash2, CheckCircle2,
  X, AlertTriangle, Check
} from "lucide-react";

const InputField = ({ label, name, type = "text", required, fullWidth, value, onChange, options }) => (
  <div className={`space-y-1 ${fullWidth ? 'col-span-2' : ''}`}>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {type === "textarea" ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        rows={3}
        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white dark:focus:bg-slate-800 transition-colors"
      />
    ) : type === "select" ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white dark:focus:bg-slate-800 transition-colors"
      >
        <option value="" disabled>Select an option</option>
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white dark:focus:bg-slate-800 transition-colors"
      />
    )}
  </div>
);

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

export const STUDENT_DOCUMENT_SLOTS = [
  { key: 'license',         label: 'Student Pilot License (SPL)',    category: 'Student Pilot License (SPL)',    required: true,  hint: 'Upload DGCA / FAA SPL license copy (PDF/Image)' },
  { key: 'medical',         label: 'Medical Certificate',            category: 'Medical Certificate',            required: true,  hint: 'Upload valid Class 1 or Class 2 medical certificate' },
  { key: 'idProof',         label: 'Government ID Proof',            category: 'ID Proof (Passport / Aadhar / DL)', required: true,  hint: 'Passport, Aadhaar, or Driver\'s License' },
  { key: 'addressProof',    label: 'Address Proof',                  category: 'Address Proof',                  required: false, hint: 'Utility bill, bank statement, or rental agreement' },
  { key: 'enrollment',      label: 'Enrollment Agreement',            category: 'Enrollment Agreement',            required: false, hint: 'Signed flight school enrollment agreement' },
  { key: 'feeReceipt',      label: 'Fee Receipt / Payment Proof',    category: 'Fee Receipt',                    required: false, hint: 'Proof of deposit or tuition fee receipt' },
  { key: 'transcript',      label: 'Academic Transcript',            category: 'Academic Transcript',            required: false, hint: 'High school or college degree transcripts' },
  { key: 'consentWaiver',   label: 'Consent Form / Waiver',          category: 'Consent Form / Waiver',          required: false, hint: 'Parental consent (if minor) or liability waiver' },
];

const REQUIRED_STUDENT_DOCS = ['Student Pilot License (SPL)', 'Medical Certificate', 'ID Proof (Passport / Aadhar / DL)'];

const validateDocuments = (slotFiles, existingDocs = []) => {
  const uploadedCategories = [];

  Object.keys(slotFiles).forEach((key) => {
    const fileData = slotFiles[key];
    if (fileData) {
      if (Array.isArray(fileData) && fileData.length === 0) return;
      const slot = STUDENT_DOCUMENT_SLOTS.find(s => s.key === key);
      if (slot) uploadedCategories.push(slot.category);
    }
  });

  existingDocs.forEach(doc => uploadedCategories.push(doc.documentType));

  const missing = REQUIRED_STUDENT_DOCS.filter(r => !uploadedCategories.includes(r));

  if (missing.length > 0) {
    return `Missing required documents: ${missing.join(', ')}`;
  }

  return null;
};

function DocumentsSection({ slotFiles, setSlotFiles, existingDocs = [], onDeleteExisting }) {
  const handleFileChange = (slotKey, filesArr, multiple) => {
    if (multiple) {
      const current = slotFiles[slotKey] || [];
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
    return existingDocs.filter(d => d.documentType === category);
  };

  return (
    <div className="space-y-4 text-left animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {STUDENT_DOCUMENT_SLOTS.map(slot => {
          const isMultiple = slot.key === 'license';
          const newFiles = slotFiles[slot.key];
          const existing = getExistingForSlot(slot.category);

          return (
            <div key={slot.key} className="border border-slate-200 dark:border-slate-700 p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-1">
                <label className="block font-bold text-sm text-slate-800 dark:text-slate-200">
                  {slot.label} {slot.required && <span className="text-rose-500">*</span>}
                </label>
                {existing.length > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-full uppercase">Stored</span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{slot.hint}</p>

              <div className="space-y-3">
                {/* Existing Files (From DB) */}
                {existing.length > 0 && (
                  <div className="space-y-1">
                    {existing.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl group/existing">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium truncate">
                            {doc.documentType || 'Existing Document'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeleteExisting(doc.id)}
                          className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-md text-rose-500 opacity-60 hover:opacity-100 transition-all shadow-sm"
                          title="Permanently remove from database"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
                        <div key={i} className="flex items-center justify-between p-2 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium truncate">{f.name}</span>
                          </div>
                          <button type="button" onClick={() => removeFile(slot.key, i)} className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-md text-rose-500 transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-between p-2 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium truncate">{newFiles.name}</span>
                        </div>
                        <button type="button" onClick={() => removeFile(slot.key)} className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-md text-rose-500 transition-colors">
                          <X className="h-3.5 w-3.5" />
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
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-900/50 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <Plus className="h-3.5 w-3.5" />
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

export default function StudentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slotFiles, setSlotFiles] = useState({});

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", dob: "", gender: "", 
    nationality: "", phone: "", address: "", city: "", state: "", pincode: "",
    licenseNumber: "", licenseType: "", licenseIssueDate: "", licenseExpiryDate: "",
    medicalCertificateNumber: "", medicalIssueDate: "", medicalExpiryDate: "",
    schoolEmail: "", passwordHash: "", documents: []
  });

  const steps = [
    { num: 1, title: "Personal Info", icon: User },
    { num: 2, title: "License", icon: ShieldCheck },
    { num: 3, title: "Medical", icon: HeartPulse },
    { num: 4, title: "Account", icon: Lock },
    { num: 5, title: "Documents", icon: FileText }
  ];

  const loadNextId = async () => {
    try {
      const res = await fetch(`${API_BASE}/students`);
      const students = await res.json();
      
      let nextNumber = 1;
      if (Array.isArray(students) && students.length > 0) {
        const highestNumber = students.reduce((max, s) => {
          if (!s.studentId) return max;
          const parts = s.studentId.split('-');
          if (parts.length === 3) {
             const num = parseInt(parts[2], 10);
             return !isNaN(num) && num > max ? num : max;
          }
          return max;
        }, 0);
        nextNumber = highestNumber + 1;
      }
      
      const nextId = `fsms-stu-${String(nextNumber).padStart(4, "0")}`;

      setForm(prev => ({
        ...prev,
        schoolEmail: `${nextId.toLowerCase()}@fsms.com`,
        passwordHash: '123456'
      }));
    } catch (error) {
      console.error("Failed to load next ID:", error);
    }
  };

  const loadStudent = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/students/${id}`);
      const data = await res.json();

      setForm(prev => ({
        ...prev,
        ...data,
        licenseNumber: data.licenses?.[0]?.licenseNumber || "",
        licenseType: data.licenses?.[0]?.licenseType || "",
        licenseIssueDate: data.licenses?.[0]?.issueDate?.slice(0, 10) || "",
        licenseExpiryDate: data.licenses?.[0]?.expiryDate?.slice(0, 10) || "",
        medicalCertificateNumber: data.medicals?.[0]?.medicalCertificateNumber || "",
        medicalIssueDate: data.medicals?.[0]?.issueDate?.slice(0, 10) || "",
        medicalExpiryDate: data.medicals?.[0]?.expiryDate?.slice(0, 10) || "",
        documents: data.documents || []
      }));
    } catch (error) {
      console.error("Failed to load student:", error);
    }
  }, [id]);

  useEffect(() => {
    if (isEdit) {
      loadStudent();
    } else {
      loadNextId();
    }
  }, [id, isEdit, loadStudent]);

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Permanently delete this document?")) return;
    try {
      await fetch(`${API_BASE}/students/${id}/documents/${docId}`, { method: 'DELETE' });
      setForm(prev => ({ 
        ...prev, 
        documents: prev.documents.filter(d => d.id !== docId) 
      }));
    } catch (e) {
      console.error("Failed to delete document", e);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const validateStep = (currentStep) => {
    switch (currentStep) {
      case 1:
        // Only validate strictly required personal fields
        return !!(form.firstName?.trim() && form.lastName?.trim() && form.email?.trim() && form.dob);
      case 2:
        return true; // Optional license details
      case 3:
        return true; // Optional medical certificate
      case 4:
        return !!form.schoolEmail?.trim();
      case 5:
        return validateDocuments(slotFiles, form.documents) === null; 
      default:
        return true;
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validateStep(step)) {
      setStep(s => s + 1);
    } else {
      if (step === 5) {
        const docErr = validateDocuments(slotFiles, form.documents);
        alert(docErr || "Please fill all required fields in this section before proceeding.");
      } else {
        alert("Please fill all required fields in this section before proceeding.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const url = isEdit
      ? `${API_BASE}/students/${id}`
      : `${API_BASE}/students`;

    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || "Failed to save student details");
      }
      const newStudentId = isEdit ? id : data.id;

      // Upload slotFiles
      const uploadPromises = [];
      let uploadErrors = [];

      for (const slot of STUDENT_DOCUMENT_SLOTS) {
        const fileOrFiles = slotFiles[slot.key];
        if (fileOrFiles) {
          const filesArr = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
          for (const f of filesArr) {
            const fd = new FormData();
            fd.append('file', f);
            fd.append('documentType', slot.category);
            
            uploadPromises.push(
              fetch(`${API_BASE}/students/${newStudentId}/documents`, {
                method: 'POST',
                body: fd
              }).then(async (upRes) => {
                if (!upRes.ok) {
                  const errText = await upRes.text();
                  let errMsg = errText;
                  try { errMsg = JSON.parse(errText).error || JSON.parse(errText).details || errText; } catch(e){}
                  uploadErrors.push(`${f.name}: ${errMsg}`);
                }
              }).catch(() => {
                uploadErrors.push(`${f.name}: Network Error`);
              })
            );
          }
        }
      }

      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
        if (uploadErrors.length > 0) {
          alert(`Student profile saved, but some documents failed to upload:\n\n${uploadErrors.join('\n')}`);
        }
      }

      navigate("/students");
    } catch (error) {
      console.error("Submission failed", error);
      alert(error.message || "Failed to save student profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const docError = step === 5 ? validateDocuments(slotFiles, form.documents) : null;
  const isSaveDisabled = step === 5 && !!docError;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto min-h-full">
      {/* HEADER */}
      <div className="mb-8">
        <button 
          onClick={() => navigate('/students')}
          className="flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 mb-4 transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Directory
        </button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {isEdit ? "Edit Student Profile" : "Register Student"}
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Complete the form below to {isEdit ? "update the" : "create a new"} student record.
        </p>
      </div>

      {/* STEP INDICATOR */}
      <div className="mb-10">
        <div className="flex flex-wrap gap-2 md:gap-0 md:justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-100 dark:bg-slate-800 -z-10 hidden md:block rounded-full"></div>
          {steps.map((s) => {
            const Icon = s.icon;
            const isCompleted = step > s.num;
            const isActive = step === s.num;
            return (
              <div 
                key={s.num} 
                className="flex flex-col items-center flex-1 min-w-[80px] z-10 cursor-pointer"
                onClick={() => {
                  if (s.num < step) {
                    setStep(s.num);
                  } else {
                    let canGo = true;
                    for (let i = 1; i < s.num; i++) {
                      if (!validateStep(i)) {
                        canGo = false;
                        break;
                      }
                    }
                    if (canGo) setStep(s.num);
                    else alert("Please fill all required fields in the active sections first.");
                  }
                }}
              >
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-gray-50 dark:border-slate-900 transition-colors duration-300
                    ${isCompleted ? 'bg-emerald-500 text-white' : 
                      isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : 
                      'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}
                  `}
                >
                  {isCompleted ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                </div>
                <span className={`text-xs font-semibold mt-2 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-700 overflow-hidden">
        
        {/* FORM CONTENT */}
        <div className="p-6 md:p-8">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField value={form.firstName} onChange={handleChange} label="First Name" name="firstName" required />
                <InputField value={form.lastName} onChange={handleChange} label="Last Name" name="lastName" required />
                <InputField value={form.email} onChange={handleChange} label="Personal Email" name="email" type="email" required fullWidth />
                <InputField value={form.dob} onChange={handleChange} label="Date of Birth" name="dob" type="date" required />
                <InputField value={form.gender} onChange={handleChange} label="Gender" name="gender" type="select" options={[{value:"Male",label:"Male"},{value:"Female",label:"Female"},{value:"Prefer not to say",label:"Prefer not to say"}]} />
                <InputField value={form.nationality} onChange={handleChange} label="Nationality" name="nationality" />
                <InputField value={form.phone} onChange={handleChange} label="Phone Number" name="phone" />
                <InputField value={form.address} onChange={handleChange} label="Residential Address" name="address" type="textarea" fullWidth />
                <InputField value={form.city} onChange={handleChange} label="City" name="city" />
                <InputField value={form.state} onChange={handleChange} label="State/Province" name="state" />
                <InputField value={form.pincode} onChange={handleChange} label="Pincode / ZIP" name="pincode" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">Aviation License Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField value={form.licenseNumber} onChange={handleChange} label="License Number" name="licenseNumber" fullWidth />
                <InputField value={form.licenseType} onChange={handleChange} label="License Type (e.g. PPL, CPL)" name="licenseType" fullWidth />
                <InputField value={form.licenseIssueDate} onChange={handleChange} label="Date of Issue" name="licenseIssueDate" type="date" />
                <InputField value={form.licenseExpiryDate} onChange={handleChange} label="Expiry Date" name="licenseExpiryDate" type="date" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">Medical Certificate</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField value={form.medicalCertificateNumber} onChange={handleChange} label="Certificate Number" name="medicalCertificateNumber" fullWidth />
                <InputField value={form.medicalIssueDate} onChange={handleChange} label="Date of Medical Exam" name="medicalIssueDate" type="date" />
                <InputField value={form.medicalExpiryDate} onChange={handleChange} label="Valid Until" name="medicalExpiryDate" type="date" />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">School Account Access</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField value={form.schoolEmail} onChange={handleChange} label="School Email Address" name="schoolEmail" type="email" fullWidth />
                <InputField value={form.passwordHash} onChange={handleChange} label="Temporary Password" name="passwordHash" type="password" fullWidth />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Supporting Documents</h2>
                <p className="text-sm text-slate-500 mt-1">Upload any required licenses, medical certificates, IDs, and other records.</p>
              </div>

              {docError && (
                <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-rose-600 dark:text-rose-400 text-sm flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <span className="font-medium">{docError}</span>
                </div>
              )}
              
              <DocumentsSection 
                slotFiles={slotFiles}
                setSlotFiles={setSlotFiles}
                existingDocs={form.documents}
                onDeleteExisting={handleDeleteDocument}
              />
            </div>
          )}
        </div>

        {/* NAVIGATION FOOTER */}
        <div className="bg-slate-50/80 dark:bg-slate-800/80 px-6 md:px-8 py-5 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setStep(s => s - 1); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm"
              >
                <ChevronLeft size={18} /> Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/students")}
              className="px-5 py-2.5 text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Cancel
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/20"
              >
                Next Step <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || isSaveDisabled}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">Processing...</span>
                ) : (
                  <><Save size={18} /> Save Student</>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}