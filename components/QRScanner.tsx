
import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, X } from 'lucide-react';

interface QRScannerProps {
  onScan: (qrData: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setLoading(false);
      } catch (err) {
        setError('Camera access denied or not available.');
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

  // Mock scan after 3 seconds
  useEffect(() => {
    if (!loading && !error) {
      const timer = setTimeout(() => {
        onScan('HQ-OFFICE-001'); // Mock scanning the HQ QR code
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [loading, error, onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-10">
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white">
          <X size={24} />
        </button>
      </div>

      <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center">
        {loading && <RefreshCw className="text-blue-500 animate-spin" size={48} />}
        {error ? (
          <div className="text-white text-center p-6">
            <X className="text-red-500 mx-auto mb-4" size={48} />
            <p>{error}</p>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-blue-500/50 animate-pulse"></div>
              </div>
              <p className="mt-8 text-white font-medium bg-black/50 px-4 py-2 rounded-full flex items-center gap-2">
                <Camera size={18} />
                Scanning for QR Code...
              </p>
            </div>
          </>
        )}
      </div>

      <div className="mt-12 text-center text-slate-400 text-sm">
        Align the QR code within the frame to automatically check in/out.
      </div>
    </div>
  );
};

export default QRScanner;
