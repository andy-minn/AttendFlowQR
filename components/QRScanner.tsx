
import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, X, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (qrData: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const scannerId = "qr-reader";

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(scannerId);
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        const config = { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        };

        await html5QrCode.start(
          { facingMode: "environment" }, 
          config, 
          (decodedText) => {
            // Success Callback
            if (!scannedResult) {
              setScannedResult(decodedText);
              // Brief delay to show success UI before closing
              setTimeout(() => {
                onScan(decodedText);
              }, 800);
            }
          },
          () => {
            // Silent error callback (occurs every frame when no QR is found)
          }
        );
        setIsReady(true);
      } catch (err: any) {
        console.error("Scanner Start Error:", err);
        setError(err?.message || "Camera access denied or hardware not found.");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Scanner Stop Error:", err));
      }
    };
  }, [onScan, scannedResult]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center animate-in fade-in duration-300">
      {/* Header */}
      <div className="absolute top-0 inset-x-0 p-6 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${scannedResult ? 'bg-emerald-500' : 'bg-blue-600 animate-pulse'}`}>
            {scannedResult ? <CheckCircle2 className="text-white" size={24} /> : <Zap className="text-white" size={20} />}
          </div>
          <div>
            <h2 className="text-white font-black text-lg leading-none">Security Scanner</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
              {scannedResult ? 'Verifying Signature...' : 'Awaiting QR Code'}
            </p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all active:scale-90"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Scanner Viewport */}
      <div className="relative w-full max-w-md aspect-square bg-slate-900 overflow-hidden shadow-2xl">
        <div id={scannerId} className="w-full h-full object-cover" />
        
        {/* Semi-transparent Overlay (Shutter effect) */}
        {!isReady && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-10">
            <RefreshCw className="text-blue-500 animate-spin mb-4" size={48} />
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Warming Hardware...</p>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 p-8 text-center z-10">
            <AlertCircle className="text-rose-500 mb-6" size={64} />
            <h3 className="text-white font-black text-xl mb-2">Camera Unavailable</h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[240px]">
              {error} Please ensure permissions are granted and no other app is using the camera.
            </p>
            <button 
              onClick={onClose}
              className="mt-8 px-8 py-4 bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all"
            >
              Go Back
            </button>
          </div>
        )}

        {/* Success Pulse */}
        {scannedResult && (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 backdrop-blur-[2px] z-10 animate-in fade-in zoom-in duration-300">
            <div className="bg-emerald-500 text-white p-6 rounded-[2.5rem] shadow-2xl shadow-emerald-500/40">
              <CheckCircle2 size={64} />
            </div>
          </div>
        )}

        {/* Scanner HUD UI */}
        {isReady && !scannedResult && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* The Scanning Frame */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] flex items-center justify-center">
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-blue-500 rounded-tl-3xl shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-blue-500 rounded-tr-3xl shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-3xl shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-3xl shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
              
              {/* Laser Scanning Line */}
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-[scan_2s_infinite] shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
            </div>

            {/* Dark Mask */}
            <div className="absolute inset-0 border-[calc((100%-250px)/2)] border-black/60 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]"></div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-12 text-center space-y-4 px-10">
        <p className="text-slate-400 text-sm font-medium leading-relaxed">
          Position the building's QR code within the frame to authorize your shift.
        </p>
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <Zap size={10} className="text-blue-500" /> Auto-Focus
          </div>
          <div className="h-1 w-1 bg-slate-800 rounded-full" />
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <RefreshCw size={10} className="text-blue-500" /> Real-Time
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-120px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(120px); opacity: 0; }
        }
        #qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
      `}</style>
    </div>
  );
};

export default QRScanner;
