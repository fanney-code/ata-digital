import React, { useState } from 'react';
import { DocumentReference } from '@/lib/types';
import {
  X,
  FileCheck2,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  FileText,
} from 'lucide-react';

interface DocumentPreviewModalProps {
  document: DocumentReference | null;
  candidateName?: string;
  institutionName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  candidateName,
  institutionName,
  isOpen,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !document) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold leading-tight text-white">
                  {document.title || document.file_name}
                </h3>
                {document.verified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-sans text-[10px] font-bold border border-emerald-400/30">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified Document
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Candidate: <span className="text-slate-200 font-semibold">{candidateName || 'Student Candidate'}</span> | {institutionName || 'Institution Record'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-mono text-slate-400 w-12 text-center">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRotate}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              title="Rotate Image"
            >
              <RotateCw className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body Viewer Viewport */}
        <div className="flex-1 bg-slate-950 p-6 overflow-auto flex items-center justify-center min-h-[350px]">
          <div
            className="transition-transform duration-200 ease-out max-w-full"
            style={{
              transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
            }}
          >
            {document.file_url ? (
              <img
                src={document.file_url}
                alt={document.title}
                className="max-h-[60vh] rounded-lg shadow-2xl border border-slate-800 object-contain mx-auto"
              />
            ) : (
              <div className="w-96 h-64 rounded-xl bg-slate-900 border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <FileText className="h-10 w-10 mb-2 text-slate-600" />
                <span className="text-xs font-bold text-slate-300">
                  Private Document Preview
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Captured via Phone Live Camera Stream
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Meta Bar */}
        <div className="flex flex-wrap items-center justify-between p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <FileCheck2 className="h-3.5 w-3.5 text-blue-500" />
              {document.file_name} ({document.file_size || '1.2 MB'})
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Uploaded: {new Date(document.uploaded_at).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <a
              href={document.file_url || '#'}
              download={document.file_name}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download Document
            </a>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
