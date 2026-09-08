import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, Shield, AlertTriangle } from 'lucide-react';

interface MobileWebCameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
}

export const MobileWebCameraCapture: React.FC<MobileWebCameraCaptureProps> = ({
  onCapture,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize browser camera stream
  const startCamera = async (mode: 'environment' | 'user') => {
    setIsLoading(true);
    setCameraError(null);

    // Stop active stream first if existing
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is not supported in this browser context (HTTPS required).');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
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
      console.error('Camera initialization error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please enable camera permissions in your browser.'
          : err.message || 'Unable to access live camera stream.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Flip between rear and front camera
  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture current live frame to canvas
  const handleCaptureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedImage(dataUrl);

      // Pause active stream tracks while reviewing captured image
      if (stream) {
        stream.getTracks().forEach((t) => (t.enabled = false));
      }
    }
  };

  // Retake photo and resume live camera stream
  const handleRetake = () => {
    setCapturedImage(null);
    if (stream) {
      stream.getTracks().forEach((t) => (t.enabled = true));
    }
  };

  // Confirm capture and pass data URL to parent
  const handleConfirm = () => {
    if (capturedImage) {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      onCapture(capturedImage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-100 leading-none">
              Controlled Camera Capture
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Live web browser stream (Gallery selection disabled)
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            if (stream) stream.getTracks().forEach((t) => t.stop());
            onClose();
          }}
          className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Camera Stream / Live Viewport */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {cameraError ? (
          <div className="p-6 max-w-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <p className="text-xs text-rose-300 font-semibold">{cameraError}</p>
            <button
              onClick={() => startCamera(facingMode)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors"
            >
              Retry Camera Access
            </button>
          </div>
        ) : capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured Document Frame"
            className="w-full h-full object-contain"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Viewfinder Bounding Box Guide */}
            <div className="absolute inset-8 md:inset-16 border-2 border-dashed border-emerald-400/70 rounded-2xl pointer-events-none flex flex-col justify-between p-4 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between text-[10px] text-emerald-300 font-mono bg-black/40 px-2.5 py-1 rounded w-fit self-center">
                ALIGN DOCUMENT WITHIN FRAME
              </div>
              <div className="text-[10px] text-slate-400 text-center bg-black/40 px-2 py-1 rounded">
                Live stream actively enforced
              </div>
            </div>
          </>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom Controls Bar */}
      <div className="p-5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-around gap-4 shrink-0">
        {capturedImage ? (
          <>
            <button
              onClick={handleRetake}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Retake Photo
            </button>

            <button
              onClick={handleConfirm}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition-colors"
            >
              <Check className="h-4 w-4" />
              Use This Image
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleFlipCamera}
              disabled={isLoading || !!cameraError}
              className="p-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
              title="Flip Rear / Front Camera"
            >
              <RefreshCw className="h-5 w-5" />
            </button>

            {/* Primary Capture Button */}
            <button
              onClick={handleCaptureFrame}
              disabled={isLoading || !!cameraError}
              className="w-16 h-16 rounded-full border-4 border-white bg-red-600 hover:bg-red-500 active:scale-95 transition-all shadow-lg flex items-center justify-center disabled:opacity-40"
              title="Capture Document Frame"
            >
              <Camera className="h-7 w-7 text-white" />
            </button>

            <div className="w-12" /> {/* Spacer for symmetry */}
          </>
        )}
      </div>
    </div>
  );
};
