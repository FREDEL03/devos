"use client";

import React, { useState, useCallback, DragEvent } from "react";
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from "./icons";

interface ScreenshotUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (file: File) => Promise<void>;
  isAnalyzing: boolean;
}

export function ScreenshotUploadModal({
  isOpen,
  onClose,
  onAnalyze,
  isAnalyzing,
}: ScreenshotUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supportedFormats = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  const maxSizeMB = 5;

  const reset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setError(null);
    setDragActive(false);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const validateFile = (file: File): string | null => {
    if (!supportedFormats.includes(file.type)) {
      return `Unsupported format. Please upload PNG, JPG, or WEBP.`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File too large. Maximum size is ${maxSizeMB}MB.`;
    }
    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setError(null);
    try {
      await onAnalyze(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze screenshot");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-[#121217] p-5 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <h3 className="text-base font-semibold text-white">Import from Screenshot</h3>
            <p className="mt-0.5 text-xs text-zinc-400">
              Upload a work ticket screenshot to generate tasks automatically
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            disabled={isAnalyzing}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Upload Area */}
        {!file ? (
          <div
            className={`relative mb-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              dragActive
                ? "border-violet-500 bg-violet-500/5"
                : "border-white/10 bg-black/20 hover:border-white/20"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
              <Upload className="h-5 w-5 text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-zinc-200">Drag & drop your screenshot</p>
            <p className="mt-1 text-xs text-zinc-500">or click to browse files</p>
            <p className="mt-3 text-[11px] text-zinc-500">
              Supported: PNG, JPG, WEBP • Max {maxSizeMB}MB
            </p>
            <input
              type="file"
              id="screenshot-upload"
              accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={handleFileInputChange}
              disabled={isAnalyzing}
            />
          </div>
        ) : (
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                  <ImageIcon className="h-5 w-5 text-violet-400" />
                </div>
                <div className="overflow-hidden">
                  <p className="truncate text-xs font-medium text-zinc-200">{file.name}</p>
                  <p className="text-[11px] text-zinc-500">
                    {(file.size / 1024).toFixed(1)} KB • {file.type.split("/")[1].toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={reset}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                disabled={isAnalyzing}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {preview && (
              <div className="relative overflow-hidden rounded-lg border border-white/10">
                <img
                  src={preview}
                  alt="Preview"
                  className="h-auto w-full object-contain max-h-64 bg-black"
                />
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/5">
          <button
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            disabled={isAnalyzing}
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            {file && (
              <button
                onClick={reset}
                className="rounded-lg px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                disabled={isAnalyzing}
              >
                Replace Image
              </button>
            )}
            <button
              onClick={handleAnalyze}
              disabled={!file || isAnalyzing}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-violet-700/30 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ImageIcon className="h-3.5 w-3.5" />
                  Analyze Screenshot
                </>
              )}
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-4 rounded-lg border border-white/5 bg-black/20 p-3 text-xs">
          <p className="font-medium text-zinc-300">💡 How it works:</p>
          <ul className="mt-1.5 space-y-1 text-zinc-400">
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
              Upload a clear screenshot of a work ticket (Jira, GitHub, etc.)
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
              AI extracts title, description, priority, and deadline
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
              Review suggested tasks before adding them to your list
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}