
import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, X, Check } from 'lucide-react';

interface PhotoCaptureProps {
  onCapture: (photoBase64: string) => void;
  onCancel: () => void;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: 640, height: 640 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setLoading(false);
      } catch (err) {
        setError('Camera access denied. Verification requires a photo.');
        setLoading(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
      }
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[#0f172a] flex flex-col items-center justify-center p-6 md:p-10 animate-in fade-in duration-300">
      <div className="max-w-md w-full flex flex-col items-center">
        <div className="text-center mb-8">
          <h2 className="text-white text-2xl font-black tracking-tight">Verification Photo</h2>
          <p className="text-slate-400 text-sm mt-2 font-medium">Please take a selfie to verify your identity</p>
        </div>

        <div className="relative w-full aspect-square rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-2xl ring-4 ring-white/5">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw className="text-blue-500 animate-spin" size={48} />
            </div>
          )}
          
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <X className="text-red-500 mb-4" size={48} />
              <p className="text-white font-medium">{error}</p>
              <button onClick={onCancel} className="mt-6 px-6 py-2 bg-white/10 text-white rounded-full text-sm font-bold">Close</button>
            </div>
          ) : (
            <>
              {capturedImage ? (
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover animate-in zoom-in-95 duration-200" />
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              )}
              
              {!capturedImage && !loading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="w-4/5 h-4/5 border-2 border-white/20 rounded-full border-dashed" />
                </div>
              )}
            </>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="mt-10 flex items-center gap-4 w-full">
          {!capturedImage ? (
            <>
              <button 
                onClick={onCancel}
                className="flex-1 py-4 bg-white/5 text-slate-400 font-bold rounded-2xl hover:bg-white/10 transition-all border border-white/5"
              >
                Cancel
              </button>
              <button 
                onClick={takePhoto}
                disabled={loading}
                className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                <Camera size={20} /> CAPTURE PHOTO
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleRetake}
                className="flex-1 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all border border-white/5 flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} /> Retake
              </button>
              <button 
                onClick={handleConfirm}
                className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <Check size={20} /> CONFIRM IDENTITY
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoCapture;
