import { useState, useCallback } from 'react';

export default function FileUpload({ onFileSelect, accept = '.csv', disabled = false }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect, disabled]
  );

  const handleFileInput = useCallback(
    (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-lg p-12 text-center transition-all
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-500'}
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
      `}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />

      <div className="flex flex-col items-center space-y-4">
        {/* Upload Icon */}
        <svg
          className={`w-16 h-16 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        {/* Instructions */}
        <div>
          <p className="text-lg font-medium text-gray-900">
            {isDragging ? 'Drop your CSV file here' : 'Drag and drop your CSV file'}
          </p>
          <p className="text-sm text-gray-500 mt-1">or click to browse</p>
        </div>

        {/* File Format Info */}
        <div className="text-xs text-gray-400 mt-2">
          Accepts CSV files up to 10,000 rows
        </div>
      </div>
    </div>
  );
}
