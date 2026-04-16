import React, { useState, useRef } from 'react';
import { Upload, X, File, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

const DOCUMENT_CATEGORIES = [
  'License',
  'Medical',
  'ID Proof',
  'Address Proof',
  'Qualification Certificate',
  'Employment Letter',
  'Background Check',
  'Contract / Offer Letter',
  'FIS Certificate',
  'Ground Instructor Certificate',
  'Other',
];

const REQUIRED_DOCS = ['License', 'Medical', 'ID Proof'];

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUpload({ onUpload, documents = [], onDelete, isLoading = false }) {
  const fileRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Other');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // 🔹 Handle file select
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

  // 🔹 Upload handler
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
      setSelectedCategory('Other');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // 🔥 VALIDATION FUNCTION (IMPORTANT)
  const uploadedCategories = documents ? documents.map((d) => d.category) : [];

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

  const isPdf = (url) => url?.toLowerCase().endsWith('.pdf');

  return (
    <div className="space-y-4">

      {/* 🔥 GLOBAL VALIDATION MESSAGE */}
      {validationError && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertTriangle className="h-4 w-4" />
          {validationError}
        </div>
      )}

      {/* REQUIRED DOCS TRACKER */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-gray-700 mr-1">Required:</span>
        {REQUIRED_DOCS.map(req => {
          const isUploaded = uploadedCategories.includes(req);
          return (
             <span key={req} className={`px-2.5 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5 transition-colors ${
               isUploaded ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
             }`}>
               {isUploaded ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
               {req}
             </span>
          )
        })}
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
          ${dragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }`}
      >
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm font-medium text-gray-600">
          {selectedFile ? selectedFile.name : 'Drop file here or click to browse'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          PDF, JPG, PNG — max 10 MB
        </p>
      </div>

      {/* File Config */}
      {selectedFile && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <File className="h-5 w-5 text-blue-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{formatSize(selectedFile.size)}</p>
            </div>
            <button onClick={() => setSelectedFile(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-sm border rounded-lg px-3 py-1.5"
            >
              {DOCUMENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>

            <input
              type="text"
              value={selectedLabel}
              onChange={(e) => setSelectedLabel(e.target.value)}
              placeholder="Label"
              className="text-sm border rounded-lg px-3 py-1.5"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs">
              <AlertTriangle className="h-3.5 w-3.5" /> {error}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      )}

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-xl">
              <File className="h-4 w-4" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{doc.label || doc.fileName}</p>
                <p className="text-xs text-gray-500">{doc.category}</p>
              </div>
              <a href={`http://localhost:3000${doc.fileUrl}`} target="_blank" rel="noreferrer">
                View
              </a>
              {onDelete && (
                <button onClick={() => onDelete(doc.id)}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      )}
    </div>
  );
}