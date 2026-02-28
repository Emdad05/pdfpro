'use client';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export default function FileUpload({ onFiles, multiple = false, accept, label, sublabel }) {
  const onDrop = useCallback(accepted => { if (accepted.length) onFiles(accepted); }, [onFiles]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple,
    accept: accept ? { 'application/pdf': ['.pdf'], ...accept } : { 'application/pdf': ['.pdf'] },
  });

  return (
    <div {...getRootProps()} className={`drop-zone p-12 sm:p-20 text-center anim-scale-in ${isDragActive ? 'active' : ''}`}>
      <input {...getInputProps()} />

      {/* Icon */}
      <div className="w-10 h-10 border border-white/10 flex items-center justify-center mx-auto mb-6 group-hover:border-gold-400/40 transition-colors">
        <svg className="w-5 h-5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
        </svg>
      </div>

      <p className="font-display text-xl font-light text-white mb-2">
        {isDragActive ? 'Release to upload' : (label || 'Drop your file here')}
      </p>
      <p className="font-mono text-xs text-white/25 mb-6">
        {sublabel || 'or click to browse'}
      </p>

      <button type="button" className="btn-ghost text-xs">
        Browse files
      </button>
    </div>
  );
}
