
import React, { useEffect, useState, useRef } from 'react';
import { X, Camera, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

interface VideoDevice {
  id: string;
  label: string;
}

declare global {
  interface Window {
    Html5Qrcode: any;
  }
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScan }) => {
  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const scannerRef = useRef<any>(null);
  const readerId = "reader-stream";

  // 저장된 카메라 ID 불러오기
  useEffect(() => {
    const savedId = localStorage.getItem('winpos3_preferred_camera');
    if (savedId) {
      setSelectedDeviceId(savedId);
    }
  }, []);

  // 카메라 기기 목록 가져오기
  useEffect(() => {
    if (isOpen && window.Html5Qrcode) {
      window.Html5Qrcode.getCameras().then((cameras: any[]) => {
        if (cameras && cameras.length) {
          const formattedDevices = cameras.map(c => ({ id: c.id, label: c.label }));
          setDevices(formattedDevices);
          
          // 저장된 ID가 없거나 현재 목록에 없으면 첫 번째 카메라 선택
          if (!selectedDeviceId || !formattedDevices.find(d => d.id === selectedDeviceId)) {
            const defaultId = formattedDevices[0].id;
            setSelectedDeviceId(defaultId);
            localStorage.setItem('winpos3_preferred_camera', defaultId); // 기본값 저장
          }
        } else {
          setErrorMsg("사용 가능한 카메라를 찾을 수 없습니다.");
        }
      }).catch((err: any) => {
        console.error("Error getting cameras", err);
        setErrorMsg("카메라 권한을 허용해주세요.");
      });
    }
  }, [isOpen]);

  // 스캔 시작/중지 로직
  useEffect(() => {
    let html5QrcodeScanner: any;

    const startScanning = async () => {
      if (isOpen && selectedDeviceId && !isScanning) {
        try {
          setErrorMsg('');
          html5QrcodeScanner = new window.Html5Qrcode(readerId);
          scannerRef.current = html5QrcodeScanner;

          await html5QrcodeScanner.start(
            selectedDeviceId, 
            {
              fps: 10,    // Optional, frame per seconds for qr code scanning
              qrbox: { width: 250, height: 250 },  // Optional, if you want bounded box UI
              aspectRatio: 1.0
            },
            (decodedText: string) => {
              // Success callback
              // Beep sound
              try {
                const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
                audio.play().catch(e => console.log('Audio play failed', e));
              } catch(e) {}

              onScan(decodedText);
              onClose();
            },
            (errorMessage: string) => {
              // Parse error, ignore it.
            }
          );
          setIsScanning(true);
        } catch (err: any) {
          console.error("Error starting scanner", err);
          setErrorMsg("카메라를 시작할 수 없습니다. 다른 앱에서 사용 중인지 확인하세요.");
          setIsScanning(false);
        }
      }
    };

    // 스캐너 중지 함수
    const stopScanning = async () => {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (err) {
          console.error("Failed to stop scanner", err);
        }
        scannerRef.current = null;
        setIsScanning(false);
      }
    };

    if (isOpen) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen, selectedDeviceId]); // selectedDeviceId가 바뀌면 재실행

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedDeviceId(newId);
    localStorage.setItem('winpos3_preferred_camera', newId);
    // Effect hook will trigger restart
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-rose-600" />
            <h2 className="text-lg font-bold text-slate-800">바코드 스캔</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-black relative min-h-[300px] flex items-center justify-center">
           <div id={readerId} className="w-full h-full"></div>
           {!isScanning && !errorMsg && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 gap-2">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <span className="text-sm">카메라 연결 중...</span>
             </div>
           )}
           {errorMsg && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 gap-2 p-4 text-center bg-black/90 z-10">
                <AlertCircle className="w-10 h-10" />
                <span className="text-sm font-bold">{errorMsg}</span>
             </div>
           )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200 space-y-3">
           <div className="flex flex-col gap-1">
             <label className="text-xs font-bold text-slate-500 uppercase">카메라 선택 (Selection Saved)</label>
             <div className="relative">
               <select 
                 value={selectedDeviceId} 
                 onChange={handleDeviceChange}
                 disabled={devices.length === 0}
                 className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 appearance-none"
               >
                 {devices.length === 0 && <option>카메라 찾는 중...</option>}
                 {devices.map(device => (
                   <option key={device.id} value={device.id}>
                     {device.label || `Camera ${device.id.substring(0, 5)}...`}
                   </option>
                 ))}
               </select>
               <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                 <Check className="w-4 h-4 text-slate-400" />
               </div>
             </div>
           </div>
           <p className="text-xs text-center text-slate-400">
             바코드를 사각형 안에 비추면 자동으로 입력됩니다.
           </p>
        </div>
      </div>
    </div>
  );
};
