"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Camera, X, Loader2 } from "lucide-react";

interface FoodCameraProps {
  onCapture: (imageBase64: string) => void;
  onClose: () => void;
  isAnalyzing: boolean;
  analysisStage: string;
}

export function FoodCamera({
  onCapture,
  onClose,
  isAnalyzing,
  analysisStage,
}: FoodCameraProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: 1280, height: 720 },
          audio: false,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch (err) {
        if (mounted) {
          setError("Camera access denied. Please allow camera permissions.");
        }
      }
    }

    startCamera();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.85);
    onCapture(base64);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close camera"
        className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Camera feed */}
      <div className="flex-1 relative">
        {error ? (
          <div className="flex items-center justify-center h-full px-8">
            <p className="text-white text-center">{error}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />
        )}

        {/* Analysis overlay */}
        {isAnalyzing && (
          <div role="status" aria-live="polite" className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 text-white animate-spin" />
            <p className="text-white text-sm font-medium">{analysisStage}</p>
          </div>
        )}
      </div>

      {/* Capture button */}
      <div className="bg-black p-6 flex items-center justify-center safe-area-bottom">
        <button
          onClick={handleCapture}
          aria-label="Capture photo"
          disabled={!cameraReady || isAnalyzing}
          className={cn(
            "w-18 h-18 rounded-full border-4 border-white flex items-center justify-center transition-all",
            cameraReady && !isAnalyzing
              ? "bg-white/20 active:bg-white/40"
              : "opacity-40"
          )}
        >
          <Camera className="h-8 w-8 text-white" />
        </button>
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
