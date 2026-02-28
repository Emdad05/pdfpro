'use client';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export default function FileUpload({ onFiles, accept = { 'application/pdf': ['.pdf'] }, multiple = false, label, sublabel }) {
  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) onFiles(accepted);
  }, [onFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept, multiple });

  return (
    <div {...getRootProps()} className={`drop-zone ${isDragActive ? 'active' : ''}`}>
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4 relative z-10">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${isDragActive ? 'bg-accent-500/20 scale-110' : 'bg-white/5'}`}
          style={isDragActive ? {boxShadow:'0 0 30px rgba(0,216,214,0.3)'} : {}}>
          <svg className={`w-8 h-8 transition-colors ${isDragActive ? 'text-accent-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
        </div>
        <div className="text-center">
          <p className="text-white font-semibold font-heading text-lg">
            {isDragActive ? 'Drop it here!' : (label || 'Click or drag files here')}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            {sublabel || (multiple ? 'Select one or more files' : 'Select a file')}
          </p>
        </div>
        <button type="button" className="btn-primary text-sm" onClick={e => e.stopPropagation()}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
          </svg>
          Choose {multiple ? 'Files' : 'File'}
        </button>
      </div>
    </div>
  );
}
