
import React, { useState, useEffect, useMemo } from 'react';
import { LogIn, LogOut, MapPin, Calendar, Clock, User, QrCode, CheckCircle2, AlertCircle, X, ChevronRight, Briefcase, DollarSign, LogOut as LogOutIcon, Wallet, ArrowUpRight, Camera, TrendingUp, UserCheck, AlertTriangle } from 'lucide-react';
import { Employee, AttendanceRecord, Location } from '../types';
import QRScanner from './QRScanner';
import PhotoCapture from './PhotoCapture';
import OnboardingFlow from './OnboardingFlow';

interface EmployeePortalProps {
  employee: Employee;
  location: Location;
  onCheckIn: (coords: { lat: number, lng: number }, photoUrl?: string) => Promise<boolean>;
  onCheckOut: () => Promise<boolean>;
  attendanceToday?: AttendanceRecord;
  attendanceHistory: AttendanceRecord[];
  onLogout: () => void;
}

type Tab = 'attendance' | 'history' | 'profile';

const EmployeePortal: React.FC<EmployeePortalProps> = ({ 
  employee, 
  location, 
  onCheckIn, 
  onCheckOut,
  attendanceToday,
  attendanceHistory,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('attendance');
  const [isScanning, setIsScanning] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(!employee.onboarded);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const completedRecords = attendanceHistory.filter(r => r.checkIn);
    let totalHours = 0;
    let overtimeHours = 0;
    const lateDays = completedRecords.filter(r => r.status === 'LATE').length;

    completedRecords.forEach(rec => {
      if (rec.checkIn && rec.checkOut) {
        const diff = (rec.checkOut.getTime() - rec.checkIn.getTime()) / (1000 * 60 * 60);
        totalHours += diff;
        if (diff > 8) overtimeHours += (diff - 8);
      }
    });

    return {
      totalShifts: completedRecords.length,
      lateDays,
      totalHours: totalHours.toFixed(1),
      overtimeHours: overtimeHours.toFixed(1)
    };
  }, [attendanceHistory]);

  const handleScanSuccess = async (qrData: string) => {
    setIsScanning(false);
    if (qrData !== location.qrCode) {
      setStatusMsg({ type: 'error', text: 'Invalid QR Code for this location.' });
      return;
    }
    setIsCapturing(true);
  };

  const handlePhotoCaptured = async (photoBase64: string) => {
    setIsCapturing(false);
    setLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });

      const { latitude, longitude } = pos.coords;
      const success = await onCheckIn({ lat: latitude, lng: longitude }, photoBase64);
      
      if (success) {
        setStatusMsg({ type: 'success', text: 'Identity verified. Check-in complete!' });
      } else {
        setStatusMsg({ type: 'error', text: 'Verification failed: Outside allowed radius.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Could not verify geolocation.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    const success = await onCheckOut();
    if (success) {
      setStatusMsg({ type: 'success', text: 'Checked out successfully!' });
    } else {
      setStatusMsg({ type: 'error', text: 'Checkout failed.' });
    }
    setLoading(false);
  };

  const handleOnboardingComplete = () => {
    setIsOnboarding(false);
    // In a real app, we'd persist this to a backend
    employee.onboarded = true;
  };

  if (isOnboarding) {
    return (
      <OnboardingFlow 
        employee={employee} 
        location={location} 
        onComplete={handleOnboardingComplete} 
      />
    );
  }

  const renderAttendance = () => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <section className="p-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl">
          <p className="text-blue-100 text-sm">Welcome back,</p>
          <h2 className="text-2xl font-bold mt-1">{employee.name}</h2>
          <div className="flex items-center gap-2 mt-4 bg-white/20 w-fit px-3 py-1 rounded-full text-xs">
            <MapPin size={12} />
            <span>{location.name}</span>
          </div>

          <div className="mt-8 flex justify-between items-end">
            <div>
              <p className="text-blue-100 text-xs uppercase tracking-wider font-semibold">Today's Shift</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock size={16} />
                <span className="text-lg font-medium">{location.startTime} - {location.endTime}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-xs uppercase tracking-wider font-semibold">Current Status</p>
              <div className={`mt-1 px-3 py-1 rounded-full text-sm font-bold shadow-lg ${attendanceToday?.checkIn && !attendanceToday.checkOut ? 'bg-green-500' : 'bg-slate-400'}`}>
                {attendanceToday?.checkIn && !attendanceToday.checkOut ? 'Working' : 'Offline'}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="px-6 space-y-6 pb-6">
        {statusMsg && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${statusMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            {statusMsg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-medium">{statusMsg.text}</span>
            <button onClick={() => setStatusMsg(null)} className="ml-auto text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
              <LogIn className="text-orange-600" size={20} />
            </div>
            <p className="text-slate-500 text-xs font-medium">Check-in</p>
            <p className="text-slate-900 font-bold mt-1">
              {attendanceToday?.checkIn ? attendanceToday.checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <LogOut className="text-indigo-600" size={20} />
            </div>
            <p className="text-slate-500 text-xs font-medium">Check-out</p>
            <p className="text-slate-900 font-bold mt-1">
              {attendanceToday?.checkOut ? attendanceToday.checkOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-2 shadow-sm">
          {!attendanceToday?.checkIn || attendanceToday.checkOut ? (
            <button 
              onClick={() => setIsScanning(true)}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-6 flex flex-col items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20"
            >
              <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center ring-4 ring-white/10">
                <QrCode size={32} />
              </div>
              <span className="font-bold text-lg">Scan QR to Check-In</span>
            </button>
          ) : (
            <button 
              onClick={handleCheckOut}
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-6 flex flex-col items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-slate-900/20"
            >
              <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center ring-4 ring-white/10">
                <LogOut size={32} />
              </div>
              <span className="font-bold text-lg">Swipe to Check-Out</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );

  const renderHistory = () => (
    <main className="flex-grow px-6 py-6 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Attendance Log</h2>
      {attendanceHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Calendar size={48} className="mb-4 opacity-20" />
          <p>No records found yet.</p>
        </div>
      ) : (
        attendanceHistory.map((record) => (
          <div key={record.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 transition-transform hover:scale-[1.01]">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${record.status === 'LATE' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                {record.status === 'LATE' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
              </div>
              <div className="flex-grow">
                <p className="text-sm font-bold text-slate-900">
                  {record.checkIn?.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <p className="text-xs text-slate-500">
                  {record.checkIn?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {record.checkOut && ` - ${record.checkOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>
              <div className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${record.status === 'LATE' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                {record.status}
              </div>
            </div>
            {record.photoUrl && (
              <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-slate-100 ml-16">
                <img src={record.photoUrl} alt="Verification" className="w-full h-full object-cover" />
                <div className="absolute top-1 right-1 bg-blue-600 text-white p-0.5 rounded-full">
                   <Camera size={8} />
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </main>
  );

  const renderProfile = () => (
    <main className="flex-grow px-6 py-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <div className="h-32 w-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl mb-4">
            <img src={employee.avatar} alt={employee.name} className="w-full h-full object-cover" />
          </div>
          <div className="absolute bottom-6 right-0 h-8 w-8 bg-green-500 border-4 border-slate-50 rounded-full shadow-sm"></div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{employee.name}</h2>
        <div className="flex flex-col items-center gap-1 mt-1">
          <p className="text-sm text-slate-500 font-medium">Employee ID: {employee.employeeId}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider">{employee.role}</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider">{employee.department}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
            <Calendar size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Shifts</p>
          <p className="text-2xl font-black text-slate-900">{stats.totalShifts}</p>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Late Arrivals</p>
          <p className="text-2xl font-black text-slate-900">{stats.lateDays}</p>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
            <Clock size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Hours</p>
          <p className="text-2xl font-black text-slate-900">{stats.totalHours}h</p>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <TrendingUp size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Overtime</p>
          <p className="text-2xl font-black text-slate-900">{stats.overtimeHours}h</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
        <div className="p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
          <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <MapPin size={20} />
          </div>
          <div className="flex-grow">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Assigned Location</p>
            <p className="text-slate-900 font-medium">{location.name}</p>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </div>
        
        <div className="p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Briefcase size={20} />
          </div>
          <div className="flex-grow">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Position</p>
            <p className="text-slate-900 font-medium">{employee.role} in {employee.department}</p>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </div>
      </div>

      <button 
        onClick={onLogout}
        className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors active:scale-95"
      >
        <LogOutIcon size={18} />
        Sign Out
      </button>
    </main>
  );

  return (
    <div className="flex flex-col min-h-screen pb-20 max-w-md mx-auto bg-slate-50 shadow-2xl relative">
      <header className="p-6 bg-white/80 backdrop-blur border-b sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">AttendFlow</h1>
          <p className="text-xs text-slate-500 font-medium">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Current Time</p>
            <p className="text-xs font-bold text-slate-900 font-mono">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
          </div>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`h-10 w-10 rounded-2xl flex items-center justify-center border-2 transition-all shadow-sm overflow-hidden ${activeTab === 'profile' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-white'}`}
          >
            <img src={employee.avatar} className="w-full h-full object-cover" alt="" />
          </button>
        </div>
      </header>

      <div className="flex-grow">
        {activeTab === 'attendance' && renderAttendance()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'profile' && renderProfile()}
      </div>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t px-8 py-4 flex justify-between items-center z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-[2.5rem] max-w-md mx-auto">
        <button 
          onClick={() => setActiveTab('attendance')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'attendance' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Clock size={24} className={activeTab === 'attendance' ? 'fill-blue-50' : ''} />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'history' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Calendar size={24} className={activeTab === 'history' ? 'fill-blue-50' : ''} />
          <span className="text-[10px] font-bold">Logs</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <User size={24} className={activeTab === 'profile' ? 'fill-blue-50' : ''} />
          <span className="text-[10px] font-bold">Profile</span>
        </button>
      </nav>

      {isScanning && <QRScanner onScan={handleScanSuccess} onClose={() => setIsScanning(false)} />}
      {isCapturing && <PhotoCapture onCapture={handlePhotoCaptured} onCancel={() => setIsCapturing(false)} />}
    </div>
  );
};

export default EmployeePortal;
