import React, { useState, useRef } from 'react';
import { Upload, X, File, Loader2, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

const STUDENT_DOCUMENT_CATEGORIES = [
  'Student Pilot License (SPL)',
  'Private Pilot License (PPL)',
  'Commercial Pilot License (CPL)',
  'Medical Certificate',
  'ID Proof (Passport / Aadhar / DL)',
  'Address Proof',
  'Enrollment Agreement',
  'Fee Receipt',
  'Academic Transcript',
  'Insurance Certificate',
  'Consent Form / Waiver',
  'Other',
];

const REQUIRED_DOCS = [
  'Student Pilot License (SPL)',
  'Medical Certificate',
  'ID Proof (Passport / Aadhar / DL)'
];

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StudentDocumentSection({ 
  onUpload, 
  documents = [], 
  onDelete, 
  isLoading = false,
  readOnly = false 
}) {
  const fileRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(STUDENT_DOCUMENT_CATEGORIES[0]);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Handle file select
  const handleFile = (file) => {
    if (!file) return;

    // File size validation (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size should be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setSelectedLabel(file.name.replace(/\.[^/.]+$/, ''));
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  // Upload handler
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      await onUpload(selectedFile, selectedCategory, selectedLabel);
      setSelectedFile(null);
      setSelectedLabel('');
      setSelectedCategory(STUDENT_DOCUMENT_CATEGORIES[0]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Helper to parse category from student documentType (e.g. "License - PPL Front")
  const getCategoryFromType = (type = '') => {
    const matched = STUDENT_DOCUMENT_CATEGORIES.find(cat => type.startsWith(cat));
    return matched || 'Other';
  };

  // Validation function
  const uploadedCategories = documents ? documents.map((d) => getCategoryFromType(d.documentType)) : [];

  const validateDocuments = () => {
    if (!documents || documents.length < 3) {
      return 'Please upload at least 3 documents';
    }

    const missing = REQUIRED_DOCS.filter(
      (req) => !uploadedCategories.includes(req)
    );

    if (missing.length > 0) {
      return `Missing required documents: ${missing.join(', ')}`;
    }

    return null;
  };

  const validationError = validateDocuments();

  return (
    <div className="space-y-6">

      {/* Global Validation Message */}
      {validationError && (
        <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl p-4">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
          <span className="font-semibold">{validationError}</span>
        </div>
      )}

      {/* Required Docs Tracker */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Required Status:</span>
          {REQUIRED_DOCS.map(req => {
            const isUploaded = uploadedCategories.includes(req);
            return (
              <span key={req} className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-colors ${
                isUploaded 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
              }`}>
                {isUploaded ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                {req}
              </span>
            );
          })}
        </div>
      </div>

      {/* Upload Zone (Hidden in readOnly mode) */}
      {!readOnly && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200
              ${dragging
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
          >
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              onChange={(e) => handleFile(e.target.files[0])}
            />
            <Upload className="mx-auto h-9 w-9 text-indigo-400 mb-2.5" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {selectedFile ? selectedFile.name : 'Drop file here or click to browse'}
            </p>
            <p className="text-xs text-slate-400 mt-1.5">
              PDF, JPG, PNG, DOCX — max 10 MB
            </p>
          </div>

          {/* File Config Panel */}
          {selectedFile && (
            <div className="bg-indigo-50/50 dark:bg-indigo-950/15 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0">
                  <File className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{formatSize(selectedFile.size)}</p>
                </div>
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-950 dark:text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    {STUDENT_DOCUMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Custom Label</label>
                  <input
                    type="text"
                    value={selectedLabel}
                    onChange={(e) => setSelectedLabel(e.target.value)}
                    placeholder="e.g. Front View, Page 2"
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-950 dark:text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-rose-600 text-xs">
                  <AlertTriangle className="h-4 w-4" /> {error}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/10 active:scale-[0.99]"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Document List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Attached Documents ({documents.length})</h3>
        {documents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {documents.map((doc) => {
              const fileUrl = doc.fileUrl.startsWith('http') ? doc.fileUrl : `http://${window.location.hostname}:3000${doc.fileUrl}`;
              return (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-3xl transition-all hover:shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-10 w-10 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center rounded-xl text-slate-400 shrink-0">
                      <File className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-slate-950 dark:text-white truncate">
                        {doc.documentType || 'Document'}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <a 
                      href={fileUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                      title="View file"
                    >
                      <ExternalLink className="h-4.5 w-4.5" />
                    </a>
                    
                    {!readOnly && onDelete && (
                      <button 
                        onClick={() => onDelete(doc.id)}
                        className="p-2 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                        title="Delete document"
                      >
                        <X className="h-4.5 w-4.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <p className="text-sm text-slate-400 italic">No documents attached to this student record.</p>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" /> Updating documents...
        </div>
      )}
    </div>
  );
}
