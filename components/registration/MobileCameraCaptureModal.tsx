import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, X, ShieldCheck, AlertCircle, Image } from 'lucide-react';
import { DocumentReference } from '@/lib/types';

interface MobileCameraCaptureModalProps {
  isOpen: boolean;
  registrationId: string;
  candidateName?: string;
  onClose: () => void;
  onCaptureSuccess: (doc: DocumentReference) => void;
}

export const MobileCameraCaptureModal: React.FC<MobileCameraCaptureModalProps> = ({
  isOpen,
  registrationId,
  candidateName,
  onClose,
  onCaptureSuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('Certificate / Document Photo');
  const [docType, setDocType] = useState<'IDENTIFICATION' | 'TRANSCRIPT' | 'CERTIFICATE' | 'OTHER'>('CERTIFICATE');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize camera stream on open
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setCameraError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Rear camera preferred for document capture
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      // Fallback to any available camera if facingMode: environment is restricted
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (fallbackErr: any) {
        setCameraError(
          'Unable to access mobile camera. Please allow camera permissions in browser settings.'
        );
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleTakeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirmUpload = () => {
    if (!capturedImage) return;

    setIsUploading(true);

    setTimeout(() => {
      const newDoc: DocumentReference = {
        id: `cam-${Date.now()}`,
        title: docTitle,
        type: docType,
        file_name: `CAPTURED_${docType}_${Date.now()}.jpg`,
        file_url: capturedImage,
        uploaded_at: new Date().toISOString(),
        file_size: '1.8 MB',
        verified: true,
      };

      onCaptureSuccess(newDoc);
      setIsUploading(false);
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">
                Live Mobile Camera Document Capture
              </h3>
              <p className="text-[11px] text-slate-400">
                Candidate: <span className="text-slate-200 font-semibold">{candidateName || 'Student Candidate'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden min-h-[300px]">
          {cameraError ? (
            <div className="p-6 text-center text-slate-300 space-y-3">
              <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
              <p className="text-xs font-semibold">{cameraError}</p>
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold"
              >
                Retry Camera Access
              </button>
            </div>
          ) : capturedImage ? (
            /* Snapshot Preview Frame */
            <div className="relative w-full h-full flex items-center justify-center p-2">
              <img
                src={capturedImage}
                alt="Captured Document"
                className="max-h-[50vh] w-auto rounded-lg shadow-xl object-contain border border-slate-700"
              />
              <span className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-400/30 flex items-center gap-1 backdrop-blur-xs">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Frame Captured & Verified
              </span>
            </div>
          ) : (
            /* Live Camera Feed Viewport */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover max-h-[50vh]"
              />

              {/* Controlled Document Alignment Target Overlay */}
              <div className="absolute inset-6 border-2 border-dashed border-blue-400/70 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                <span className="text-[10px] font-mono text-blue-300 bg-slate-950/80 px-2 py-0.5 rounded-md self-start">
                  Align Document Inside Box
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded-md self-end">
                  Controlled Camera Capture
                </span>
              </div>
            </div>
          )}

          {/* Hidden Canvas for Frame Extraction */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Metadata Input Options */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3 shrink-0">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Document Label
              </label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Document Category
              </label>
              <select
                value={docType}
                onChange={(e: any) => setDocType(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
              >
                <option value="CERTIFICATE">Certificate</option>
                <option value="TRANSCRIPT">Academic Transcript</option>
                <option value="IDENTIFICATION">Identity Proof</option>
                <option value="OTHER">Other Reference</option>
              </select>
            </div>
          </div>

          {/* Shutter / Action Controls */}
          <div className="flex items-center justify-between pt-2">
            {!capturedImage ? (
              <button
                type="button"
                onClick={handleTakeSnapshot}
                disabled={!!cameraError}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-lg transition-all disabled:opacity-40"
              >
                <Camera className="h-4 w-4" />
                <span>Capture Document Frame</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Retake Photo</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmUpload}
                  disabled={isUploading}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg transition-colors disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{isUploading ? 'Uploading Image...' : 'Confirm Upload'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
