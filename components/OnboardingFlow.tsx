
import React, { useState } from 'react';
import { 
  Sparkles, ShieldCheck, MapPin, Clock, 
  ArrowRight, CheckCircle2, User, QrCode,
  DollarSign, ChevronRight, PartyPopper
} from 'lucide-react';
import { Employee, Location } from '../types';

interface OnboardingFlowProps {
  employee: Employee;
  location: Location;
  onComplete: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ employee, location, onComplete }) => {
  const [step, setStep] = useState(1);

  const steps = [
    { title: 'Welcome', icon: PartyPopper },
    { title: 'Profile', icon: User },
    { title: 'Duty', icon: MapPin },
    { title: 'Tutorial', icon: Sparkles },
  ];

  const renderWelcome = () => (
    <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="h-24 w-24 bg-blue-100 text-blue-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-blue-500/10">
        <PartyPopper size={48} />
      </div>
      <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Welcome to AttendFlow!</h2>
      <p className="text-slate-500 font-medium max-w-xs mb-10 leading-relaxed">
        We're excited to have you on the team. Let's get your workstation set up in just a few seconds.
      </p>
      <button 
        onClick={() => setStep(2)}
        className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        START SETUP <ArrowRight size={20} />
      </button>
    </div>
  );

  const renderProfile = () => (
    <div className="flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
      <h2 className="text-2xl font-black text-slate-900 mb-2">Verify Identity</h2>
      <p className="text-slate-500 text-sm font-medium mb-8">Confirm your digital employee credentials.</p>
      
      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 mb-8">
        <div className="flex items-center gap-6">
          <img src={employee.avatar} className="h-20 w-20 rounded-2xl shadow-lg ring-4 ring-white" alt="" />
          <div>
            <p className="text-sm font-black text-slate-900">{employee.name}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{employee.employeeId}</p>
            <span className="mt-2 inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-full">Active Status</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-10">
        <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ShieldCheck size={20} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Assigned Role</p>
            <p className="text-sm font-bold text-slate-900">{employee.role}</p>
          </div>
        </div>
      </div>

      <button 
        onClick={() => setStep(3)}
        className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        CONFIRM PROFILE <CheckCircle2 size={20} />
      </button>
    </div>
  );

  const renderDuty = () => (
    <div className="flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
      <h2 className="text-2xl font-black text-slate-900 mb-2">Workspace Briefing</h2>
      <p className="text-slate-500 text-sm font-medium mb-8">This is where your attendance tracking will occur.</p>
      
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-8">
        <div className="h-32 bg-indigo-600 flex items-center justify-center relative">
          <MapPin size={48} className="text-white animate-bounce" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
        <div className="p-6">
          <h3 className="font-black text-slate-900 text-lg mb-1">{location.name}</h3>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-1.5">
            <Clock size={14} /> {location.startTime} - {location.endTime} Shift
          </p>
          <div className="mt-6 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl">
             <span>Verification Radius</span>
             <span>{location.radius} Meters</span>
          </div>
        </div>
      </div>

      <button 
        onClick={() => setStep(4)}
        className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        UNDERSTOOD <ArrowRight size={20} />
      </button>
    </div>
  );

  const renderTutorial = () => (
    <div className="flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
      <h2 className="text-2xl font-black text-slate-900 mb-2">How it Works</h2>
      <p className="text-slate-500 text-sm font-medium mb-8">A quick guide to navigating the system.</p>
      
      <div className="space-y-4 mb-10">
        <div className="p-5 bg-white border border-slate-100 rounded-3xl flex items-start gap-4">
           <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><QrCode size={20} /></div>
           <div>
              <p className="font-black text-slate-900 text-sm mb-1">1. Scan & Verify</p>
              <p className="text-xs text-slate-500 font-medium">Scan the office QR and take a selfie to check-in instantly.</p>
           </div>
        </div>
        <div className="p-5 bg-white border border-slate-100 rounded-3xl flex items-start gap-4">
           <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0"><DollarSign size={20} /></div>
           <div>
              <p className="font-black text-slate-900 text-sm mb-1">2. Track Earnings</p>
              <p className="text-xs text-slate-500 font-medium">Monitor your monthly salary and overtime in real-time.</p>
           </div>
        </div>
        <div className="p-5 bg-white border border-slate-100 rounded-3xl flex items-start gap-4">
           <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0"><Clock size={20} /></div>
           <div>
              <p className="font-black text-slate-900 text-sm mb-1">3. History Logs</p>
              <p className="text-xs text-slate-500 font-medium">Keep a transparent record of all your working shifts.</p>
           </div>
        </div>
      </div>

      <button 
        onClick={onComplete}
        className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
      >
        LET'S GET STARTED <PartyPopper size={20} />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col items-center justify-center p-6 sm:p-10">
      <div className="max-w-md w-full">
        {/* Progress Bar */}
        <div className="flex items-center justify-between gap-2 mb-12">
          {steps.map((s, i) => {
            const num = i + 1;
            const isActive = step === num;
            const isDone = step > num;
            return (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-2">
                   <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                      <s.icon size={18} />
                   </div>
                   <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>{s.title}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-grow h-0.5 rounded-full ${step > num ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] border border-slate-100 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50" />
          
          <div className="relative z-10">
            {step === 1 && renderWelcome()}
            {step === 2 && renderProfile()}
            {step === 3 && renderDuty()}
            {step === 4 && renderTutorial()}
          </div>
        </div>

        <div className="mt-8 text-center">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Secure Onboarding • AttendFlow v2.0</p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
