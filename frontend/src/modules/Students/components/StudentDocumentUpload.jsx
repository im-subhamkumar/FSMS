import React, { useState, useRef } from 'react';
import { Upload, X, File, FileText, Trash2, CheckCircle, Plus } from 'lucide-react';

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StudentDocumentUpload({ 
  pendingFiles, 
  setPendingFiles, 
  existingDocs = [], 
  onDeleteExisting 
}) {
  const fileRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleFile = (files) => {
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files).map(file => ({
      file,
      type: file.name.replace(/\.[^/.]+$/, '') // Default label to filename
    }));

    setPendingFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files);
  };

  const removePending = (index) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updatePendingType = (index, value) => {
    setPendingFiles(prev => {
      const newArr = [...prev];
      newArr[index].type = value;
      return newArr;
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${dragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
      >
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
          onChange={(e) => handleFile(e.target.files)}
        />
        <Upload className="mx-auto h-10 w-10 text-indigo-400 mb-3" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Drop files here or click to browse
        </p>
        <p className="text-xs text-slate-400 mt-2">
          PDF, JPG, PNG, DOCX — max 10 MB per file
        </p>
      </div>

      {/* List of Files */}
      <div className="space-y-4">
        
        {/* Existing Documents */}
        {existingDocs.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stored Documents</h3>
            {existingDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-xl group/existing transition-all hover:shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {doc.documentType || 'Document'}
                    </span>
                    <a href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `http://${window.location.hostname}:3000${doc.fileUrl}`} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                      View Original File
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteExisting(doc.id)}
                  className="p-2 text-rose-500 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors"
                  title="Permanently remove from database"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pending New Documents */}
        {pendingFiles.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ready to Upload</h3>
            {pendingFiles.map((pf, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm relative group">
                
                <div className="flex items-center gap-3 sm:w-1/3 overflow-hidden border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-slate-800 pb-3 sm:pb-0 sm:pr-4">
                  <File className="h-8 w-8 text-indigo-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{pf.file.name}</p>
                    <p className="text-xs text-slate-500">{formatSize(pf.file.size)}</p>
                  </div>
                </div>

                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Document Label</label>
                    <input 
                      type="text"
                      value={pf.type}
                      onChange={(e) => updatePendingType(index, e.target.value)}
                      placeholder="e.g. Passport, License, Waiver..."
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removePending(index)}
                    className="mt-5 p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/30 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
