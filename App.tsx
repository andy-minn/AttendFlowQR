
import React, { useState, useEffect } from 'react';
import { Employee, AttendanceRecord, Location, UserRole } from './types';
import { EMPLOYEES, LOCATIONS, MOCK_ATTENDANCE } from './constants';
import EmployeePortal from './components/EmployeePortal';
import AdminDashboard from './components/AdminDashboard';
import { Clock, Smartphone, Monitor, ShieldCheck, LogIn, Lock } from 'lucide-react';

const App: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminCreds, setAdminCreds] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(MOCK_ATTENDANCE);
  const [locations, setLocations] = useState<Location[]>(LOCATIONS);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isWithinRadius = (lat1: number, lon1: number, lat2: number, lon2: number, radius: number) => {
    const distance = Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
    return distance < (radius / 111320);
  };

  const handleCheckIn = async (coords: { lat: number, lng: number }, photoUrl?: string): Promise<boolean> => {
    if (!currentUser) return false;
    const location = locations.find(l => l.id === currentUser.locationId);
    if (!location) return false;

    const inRange = isWithinRadius(coords.lat, coords.lng, location.latitude, location.longitude, location.radius);
    
    if (inRange) {
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        employeeId: currentUser.id,
        locationId: location.id,
        checkIn: new Date(),
        checkOut: null,
        status: new Date().getHours() > 9 ? 'LATE' : 'PRESENT',
        lat: coords.lat,
        lng: coords.lng,
        photoUrl: photoUrl
      };
      setAttendance(prev => [newRecord, ...prev]);
      return true;
    }
    return false;
  };

  const handleCheckOut = async (): Promise<boolean> => {
    if (!currentUser) return false;
    const today = new Date().toDateString();
    const updatedAttendance = attendance.map(rec => {
      if (rec.employeeId === currentUser.id && rec.checkIn?.toDateString() === today && !rec.checkOut) {
        return { ...rec, checkOut: new Date() };
      }
      return rec;
    });
    setAttendance(updatedAttendance);
    return true;
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCreds.username === 'admin' && adminCreds.password === 'pass123') {
      setIsAdminLoggedIn(true);
      setCurrentRole('ADMIN');
      setLoginError('');
    } else {
      setLoginError('Invalid administrator credentials.');
    }
  };

  const handleLogout = () => {
    setCurrentRole(null);
    setCurrentUser(null);
    setIsAdminLoggedIn(false);
    setShowAdminLogin(false);
    setAdminCreds({ username: '', password: '' });
  };

  const getAttendanceToday = () => {
    if (!currentUser) return undefined;
    const today = new Date().toDateString();
    return attendance.find(a => a.employeeId === currentUser.id && a.checkIn?.toDateString() === today);
  };

  const getUserAttendanceHistory = () => {
    if (!currentUser) return [];
    return attendance.filter(a => a.employeeId === currentUser.id).sort((a, b) => {
      return (b.checkIn?.getTime() || 0) - (a.checkIn?.getTime() || 0);
    });
  };

  const handleImportEmployees = (newEmployees: Employee[]) => {
    setEmployees(prev => [...prev, ...newEmployees]);
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    setEmployees(prev => prev.map(e => e.id === updatedEmp.id ? updatedEmp : e));
  };

  const handleAddEmployee = (newEmp: Employee) => {
    setEmployees(prev => [newEmp, ...prev]);
  };

  if (!currentRole && !showAdminLogin) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(30,58,138,0.2),_transparent)] pointer-events-none" />
        
        <div className="max-w-md w-full glass-morphism p-10 rounded-[3rem] shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-500 relative z-10">
          <div className="text-center mb-12">
            <div className="h-24 w-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/40 transform -rotate-6 transition-transform hover:rotate-0">
              <Clock className="text-white" size={48} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight text-center">AttendFlow</h1>
            <p className="text-slate-500 mt-3 font-semibold uppercase tracking-widest text-[10px] text-center">Enterprise Workforce Management</p>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={() => {
                setCurrentRole('EMPLOYEE');
                setCurrentUser(employees[0]); 
              }}
              className="w-full group flex items-center justify-between p-6 bg-white/50 hover:bg-white rounded-3xl border-2 border-transparent hover:border-blue-500 transition-all active:scale-95 shadow-sm"
            >
              <div className="flex items-center gap-5">
                <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Smartphone size={28} />
                </div>
                <div className="text-left">
                  <p className="font-extrabold text-slate-900">Employee Portal</p>
                  <p className="text-xs text-slate-500 font-medium">Check-in via Mobile</p>
                </div>
              </div>
              <LogIn size={20} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
            </button>

            {!isMobile && (
              <button 
                onClick={() => setShowAdminLogin(true)}
                className="w-full group flex items-center justify-between p-6 bg-white/50 hover:bg-white rounded-3xl border-2 border-transparent hover:border-indigo-500 transition-all active:scale-95 shadow-sm"
              >
                <div className="flex items-center gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Monitor size={28} />
                  </div>
                  <div className="text-left">
                    <p className="font-extrabold text-slate-900">Admin Console</p>
                    <p className="text-xs text-slate-500 font-medium">Desktop Operations</p>
                  </div>
                </div>
                <LogIn size={20} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </button>
            )}
          </div>

          <div className="mt-12 text-center flex flex-col items-center gap-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2026 AttendFlow Systems</p>
            {isMobile && (
              <button 
                onClick={() => setShowAdminLogin(true)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest border-t border-slate-100 pt-4 w-full justify-center"
              >
                <Lock size={10} />
                Authorized Admin Login
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showAdminLogin && !isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full">
          <div className="bg-white p-10 md:p-12 rounded-[3rem] border border-slate-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin Login</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Identity Verification</p>
              </div>
            </div>
            
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Administrator Identity</label>
                <input 
                  type="text" 
                  value={adminCreds.username}
                  onChange={(e) => setAdminCreds({...adminCreds, username: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-medium"
                  placeholder="Username (admin)"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
                <input 
                  type="password" 
                  value={adminCreds.password}
                  onChange={(e) => setAdminCreds({...adminCreds, password: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-medium"
                  placeholder="Password (pass123)"
                />
              </div>
              {loginError && <p className="text-red-500 text-[10px] font-bold bg-red-50 px-4 py-3 rounded-xl border border-red-100 animate-in shake">{loginError}</p>}
              
              <button 
                type="submit"
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/30 active:scale-[0.98]"
              >
                AUTHORIZE ACCESS
              </button>
              <button 
                type="button"
                onClick={() => setShowAdminLogin(false)}
                className="w-full py-2 text-slate-400 text-xs font-bold hover:text-slate-600 transition-all uppercase tracking-widest"
              >
                Cancel Request
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {currentRole === 'EMPLOYEE' && currentUser && (
        <EmployeePortal 
          employee={currentUser}
          location={locations.find(l => l.id === currentUser.locationId) || locations[0]}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          attendanceToday={getAttendanceToday()}
          attendanceHistory={getUserAttendanceHistory()}
          onLogout={handleLogout}
        />
      )}

      {currentRole === 'ADMIN' && isAdminLoggedIn && (
        <AdminDashboard 
          employees={employees} 
          attendance={attendance} 
          locations={locations} 
          onAddLocation={(l) => setLocations([...locations, l])}
          onUpdateLocation={(l) => setLocations(locations.map(loc => loc.id === l.id ? l : loc))}
          onDeleteLocation={(id) => setLocations(locations.filter(l => l.id !== id))}
          onImportEmployees={handleImportEmployees}
          onUpdateEmployee={handleUpdateEmployee}
          onAddEmployee={handleAddEmployee}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default App;
