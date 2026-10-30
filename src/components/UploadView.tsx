import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileVideo,
  X,
  CheckCircle,
  AlertTriangle,
  Play,
  Film,
  Sparkles,
  Loader2,
  HardDrive
} from 'lucide-react';
import { VideoRecord } from '../types';
import { formatFileSize } from '../utils/videoUtils';

interface UploadViewProps {
  onUploadSuccess: (video: VideoRecord) => void;
  onLoadSampleSuccess: (video: VideoRecord) => void;
}

export const UploadView: React.FC<UploadViewProps> = ({
  onUploadSuccess,
  onLoadSampleSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const validateFile = (file: File): boolean => {
    const validExtensions = ['.mp4', '.mov', '.webm'];
    const fileName = file.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => fileName.endsWith(ext));
    const isValidMime = file.type.startsWith('video/') || fileName.endsWith('.mp4');

    if (!isValidExt && !isValidMime) {
      setErrorMessage('Unsupported format. Please select an MP4, MOV, or WebM video file.');
      return false;
    }

    if (file.size > 500 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 500MB maximum upload limit.');
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const handleFileChange = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const cancelSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(5);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('video', selectedFile);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 90);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      if (xhr.status === 200 || xhr.status === 201) {
        setUploadProgress(100);
        try {
          const videoRecord = JSON.parse(xhr.responseText);
          onUploadSuccess(videoRecord);
        } catch (err) {
          setErrorMessage('Failed to parse upload response from server.');
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          setErrorMessage(errData.error || 'Video upload failed.');
        } catch (e) {
          setErrorMessage(`Upload failed with status code ${xhr.status}.`);
        }
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      setErrorMessage('Network error during upload. Please check connection.');
    };

    xhr.open('POST', '/api/videos/upload', true);
    xhr.send(formData);
  };

  const cancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleLoadSample = async () => {
    setIsLoadingSample(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/videos/sample', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to generate benchmark sample video');
      const sampleRecord: VideoRecord = await res.json();
      onLoadSampleSuccess(sampleRecord);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load sample benchmark footage');
    } finally {
      setIsLoadingSample(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Module Title Banner */}
      <div className="bg-white p-6 rounded-lg border border-[#E1E5E9]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#20252B]">Video Ingestion Module</h2>
            <p className="text-xs text-[#68717C] mt-0.5">
              Upload raw video surveillance footage (MP4, MOV, WebM) for Gemini AI understanding, entity identification, and timestamped event extraction.
            </p>
          </div>

          {/* Quick One-Click Demo Sample Button */}
          <button
            onClick={handleLoadSample}
            disabled={isLoadingSample || isUploading}
            className="flex items-center space-x-2 px-3.5 py-2 bg-[#E8F1F8] hover:bg-[#2675B9] hover:text-white text-[#2675B9] border border-[#2675B9]/30 rounded-md text-xs font-semibold transition-all shrink-0 disabled:opacity-50"
            title="Instantly generate and ingest benchmark CCTV footage"
          >
            {isLoadingSample ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Film className="w-4 h-4" />
            )}
            <span>Load Benchmark CCTV Footage</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 bg-[#C94B45]/10 border border-[#C94B45]/30 rounded-md flex items-center space-x-2.5 text-xs text-[#C94B45]">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload Box / Drag & Drop */}
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`bg-white border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-[#2675B9] bg-[#E8F1F8]/30 scale-[1.01]'
              : 'border-[#E1E5E9] hover:border-[#2675B9] hover:bg-[#F9FAFB]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp4,.mov,.webm,video/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />

          <div className="w-14 h-14 rounded-full bg-[#E8F1F8] text-[#2675B9] flex items-center justify-center mx-auto mb-4">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="text-sm font-bold text-[#20252B]">
            Drag and drop your video file here, or browse
          </h3>
          <p className="text-xs text-[#68717C] mt-1">
            Supported containers: <span className="font-semibold text-[#20252B]">MP4, MOV, WebM</span> (Up to 500 MB)
          </p>

          <div className="mt-5 inline-flex items-center space-x-2 px-4 py-2 rounded bg-[#2675B9] text-white text-xs font-semibold shadow-xs">
            <FileVideo className="w-4 h-4" />
            <span>Select Video File</span>
          </div>
        </div>
      ) : (
        /* Video Selected - Preview & Metadata Details */
        <div className="bg-white rounded-lg border border-[#E1E5E9] p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E1E5E9]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded bg-[#E8F1F8] text-[#2675B9] flex items-center justify-center">
                <FileVideo className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#20252B] truncate max-w-md">{selectedFile.name}</h4>
                <div className="flex items-center space-x-3 text-xs text-[#68717C] mt-0.5">
                  <span>Size: {formatFileSize(selectedFile.size)}</span>
                  <span>•</span>
                  <span>Type: {selectedFile.type || 'video/mp4'}</span>
                </div>
              </div>
            </div>

            {!isUploading && (
              <button
                onClick={cancelSelection}
                className="p-1.5 rounded-md text-[#68717C] hover:bg-[#F5F6F7] hover:text-[#C94B45] transition-colors"
                title="Cancel file selection"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Local Video Preview */}
          {previewUrl && (
            <div className="rounded-lg overflow-hidden border border-[#E1E5E9] bg-black max-h-[360px] flex items-center justify-center">
              <video
                src={previewUrl}
                controls
                className="w-full max-h-[360px] object-contain"
              />
            </div>
          )}

          {/* Progress Bar when uploading */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#20252B] font-medium">
                <span>Uploading & verifying video stream...</span>
                <span className="font-mono">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-[#E1E5E9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2675B9] transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            {isUploading ? (
              <button
                onClick={cancelUpload}
                className="px-4 py-2 border border-[#C94B45] text-[#C94B45] hover:bg-[#C94B45]/10 rounded-md text-xs font-semibold transition-colors"
              >
                Cancel Upload
              </button>
            ) : (
              <>
                <button
                  onClick={cancelSelection}
                  className="px-4 py-2 border border-[#E1E5E9] text-[#68717C] hover:bg-[#F5F6F7] hover:text-[#20252B] rounded-md text-xs font-medium transition-colors"
                >
                  Choose Different File
                </button>
                <button
                  onClick={handleUpload}
                  className="px-5 py-2 bg-[#2675B9] hover:bg-[#1E6099] text-white rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center space-x-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Start Ingestion & Store</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Guidelines & Ingestion Specifications */}
      <div className="bg-white rounded-lg border border-[#E1E5E9] p-5">
        <h4 className="text-xs font-bold text-[#20252B] uppercase tracking-wider mb-3">
          Ingestion Requirements & Processing Flow
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#68717C]">
          <div className="p-3 bg-[#F5F6F7] rounded border border-[#E1E5E9]">
            <p className="font-semibold text-[#20252B]">1. Format Validation</p>
            <p className="mt-1">
              Supports standard H.264 / VP8 / VP9 encoded video files (MP4, MOV, WebM) up to 1080p / 4K.
            </p>
          </div>
          <div className="p-3 bg-[#F5F6F7] rounded border border-[#E1E5E9]">
            <p className="font-semibold text-[#20252B]">2. Metadata & Probing</p>
            <p className="mt-1">
              FFmpeg server-side probes duration, framerate, and generates keyframe thumbnail at 00:02.
            </p>
          </div>
          <div className="p-3 bg-[#F5F6F7] rounded border border-[#E1E5E9]">
            <p className="font-semibold text-[#20252B]">3. AI Multimodal Index</p>
            <p className="mt-1">
              Submits video to Gemini multimodal API to chronologically extract activities, people, and objects.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
