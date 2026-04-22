import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  User, ShieldCheck, HeartPulse, FileText, Lock, 
  ChevronRight, ChevronLeft, Save, Plus, Trash2, CheckCircle2,
  Upload, X
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

export default function StudentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", dob: "", gender: "", 
    nationality: "", phone: "", address: "", city: "", state: "", pincode: "",
    licenseNumber: "", licenseType: "", licenseIssueDate: "", licenseExpiryDate: "",
    medicalCertificateNumber: "", medicalIssueDate: "", medicalExpiryDate: "",
    schoolEmail: "", passwordHash: "", batch: "", documents: []
  });

  const steps = [
    { num: 1, title: "Personal Info", icon: User },
    { num: 2, title: "License", icon: ShieldCheck },
    { num: 3, title: "Medical", icon: HeartPulse },
    { num: 4, title: "Account", icon: Lock },
    { num: 5, title: "Documents", icon: FileText }
  ];

  useEffect(() => {
    if (isEdit) {
      loadStudent();
    }
  }, [id, isEdit, loadStudent]);

  const loadStudent = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/students/${id}`);
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
        batch: data.batch || "",
        documents: data.documents || []
      }));
    } catch (error) {
      console.error("Failed to load student:", error);
    }
  }, [id]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validPendingFiles = pendingFiles.filter(pf => pf.file);
    const totalDocs = form.documents.length + validPendingFiles.length;
    
    if (totalDocs < 3) {
      alert("Please ensure at least 3 supporting documents have files actively attached to them before saving.");
      return;
    }

    setIsSubmitting(true);

    const url = isEdit
      ? `http://localhost:3000/api/students/${id}`
      : `http://localhost:3000/api/students`;

    const method = isEdit ? "PUT" : "POST";

    try {
      const formPayload = { ...form };
      delete formPayload.documents; // We handle documents via separate endpoints now

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formPayload)
      });
      const data = await res.json();

      const newStudentId = isEdit ? id : data.id;

      // Upload newly added files seamlessly
      if (validPendingFiles.length > 0) {
        let uploadErrors = 0;
        await Promise.all(validPendingFiles.map(async (pf) => {
          const fd = new FormData();
          fd.append('file', pf.file);
          fd.append('documentType', pf.type || 'General');
          try {
            const upRes = await fetch(`http://localhost:3000/api/students/${newStudentId}/documents`, {
              method: 'POST',
              body: fd
            });
            if (!upRes.ok) {
              uploadErrors++;
              console.error("Failed to upload document", pf.file.name, await upRes.text());
            }
          } catch (err) {
            uploadErrors++;
            console.error("Network error during document upload", err);
          }
        }));

        if (uploadErrors > 0) {
          alert(`Student profile saved, but ${uploadErrors} document(s) failed to upload. Please edit the student to re-upload them.`);
        }
      }

      navigate("/students");
    } catch (error) {
      console.error("Submission failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <div key={s.num} className="flex flex-col items-center flex-1 min-w-[80px] z-10">
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
                <InputField value={form.licenseNumber} onChange={handleChange} label="License Number" name="licenseNumber" required fullWidth />
                <InputField value={form.licenseType} onChange={handleChange} label="License Type (e.g. PPL, CPL)" name="licenseType" required fullWidth />
                <InputField value={form.licenseIssueDate} onChange={handleChange} label="Date of Issue" name="licenseIssueDate" type="date" required />
                <InputField value={form.licenseExpiryDate} onChange={handleChange} label="Expiry Date" name="licenseExpiryDate" type="date" required />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">Medical Certificate</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField value={form.medicalCertificateNumber} onChange={handleChange} label="Certificate Number" name="medicalCertificateNumber" required fullWidth />
                <InputField value={form.medicalIssueDate} onChange={handleChange} label="Date of Medical Exam" name="medicalIssueDate" type="date" required />
                <InputField value={form.medicalExpiryDate} onChange={handleChange} label="Valid Until" name="medicalExpiryDate" type="date" required />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">School Account Access</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField value={form.schoolEmail} onChange={handleChange} label="School Email Address" name="schoolEmail" type="email" required fullWidth />
                <InputField value={form.passwordHash} onChange={handleChange} label="Temporary Password" name="passwordHash" type="password" required={!isEdit} />
                <InputField 
                  value={form.batch} 
                  onChange={handleChange} 
                  label="Training Batch" 
                  name="batch" 
                  type="select" 
                  required
                  options={[
                    {value: "Ground School", label: "Ground School"},
                    {value: "Simulator", label: "Simulator"},
                    {value: "Dual Flights", label: "Dual Flights"},
                    {value: "Solo Flights", label: "Solo Flights"}
                  ]} 
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Supporting Documents</h2>
                  <button 
                    type="button" 
                    onClick={() => setPendingFiles(prev => [...prev, { file: null, type: "" }])}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-sm font-semibold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                  >
                    <Plus size={16} /> Add Document
                  </button>
               </div>
              
              {/* Existing Documents */}
              {form.documents.length > 0 && (
                <div className="mb-6 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Already Uploaded</h3>
                  {form.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl hover:shadow-sm transition-all duration-200 group">
                      <div className="flex items-center gap-3">
                        <FileText className="text-indigo-500" size={24} />
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{doc.documentType || 'Document'} <span className="text-xs font-normal text-slate-500 ml-2">Stored File</span></p>
                          <a href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `http://localhost:3000${doc.fileUrl}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 group-hover:underline">View Original File</a>
                        </div>
                      </div>
                      {isEdit && (
                        <button 
                          type="button" 
                          onClick={async () => {
                            if (!window.confirm("Permanently delete this document?")) return;
                            try {
                              await fetch(`http://localhost:3000/api/students/${id}/documents/${doc.id}`, { method: 'DELETE' });
                              setForm(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== doc.id) }));
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg opacity-60 group-hover:opacity-100 transition-all"
                          title="Delete Stored Document"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pending Files List (Slots) */}
              {pendingFiles.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">New Documents</h3>
                  {pendingFiles.map((pf, idx) => (
                    <div key={idx} className="p-4 bg-indigo-50/30 border border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-800/50 rounded-xl space-y-4 relative">
                      
                      <button 
                        type="button" 
                        onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-4 right-4 p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Document Type / Name</label>
                        <input
                          type="text"
                          placeholder="e.g. ID Proof, Passport"
                          value={pf.type}
                          onChange={(e) => {
                            const updated = [...pendingFiles];
                            updated[idx].type = e.target.value;
                            setPendingFiles(updated);
                          }}
                          className="w-full pr-12 px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Attach File</label>
                        {pf.file ? (
                          <div className="flex items-center justify-between p-3 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-lg">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <FileText className="text-indigo-500 shrink-0" size={20} />
                              <div className="truncate">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{pf.file.name}</p>
                                <p className="text-xs text-slate-500">{(pf.file.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => {
                                const updated = [...pendingFiles];
                                updated[idx].file = null;
                                setPendingFiles(updated);
                              }}
                              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 py-1.5 px-3 rounded-md transition-colors"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="relative flex items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-400 transition-colors cursor-pointer group"
                          >
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const updated = [...pendingFiles];
                                  updated[idx].file = file;
                                  setPendingFiles(updated);
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center pointer-events-none">
                              <Upload className="text-slate-400 group-hover:text-indigo-500 mb-2 transition-colors" size={24} />
                              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Click to browse or drag & drop</p>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              )}
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
                onClick={(e) => { 
                  e.preventDefault(); 
                  const formElement = e.target.closest('form');
                  if (formElement && !formElement.reportValidity()) return;
                  setStep(s => s + 1); 
                }}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/20"
              >
                Next Step <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-70 disabled:cursor-wait"
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