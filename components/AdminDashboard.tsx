
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, MapPin, BarChart3, Clock, Search, Filter, 
  Sparkles, TrendingUp, AlertTriangle, CheckCircle, 
  Plus, X, LayoutDashboard, Activity, ChevronRight, 
  ArrowUpRight, LogOut, Menu, Camera, DollarSign,
  Wallet, Receipt, CreditCard, ShieldCheck, PieChart as PieChartIcon,
  Pencil, Trash2, Globe, Building2, Factory, Warehouse, ShoppingBag,
  QrCode, RefreshCw, FileUp, Download, UserMinus, UserCheck, 
  Banknote, Scale, Percent, ArrowDownRight, Calculator, Calendar
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import { Employee, AttendanceRecord, Location, PayrollReport, PremiseType, UserRole } from '../types';
import { getAttendanceInsights } from '../geminiService';

interface AdminDashboardProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  locations: Location[];
  onAddLocation?: (loc: Location) => void;
  onUpdateLocation?: (loc: Location) => void;
  onDeleteLocation?: (id: string) => void;
  onImportEmployees?: (employees: Employee[]) => void;
  onUpdateEmployee?: (employee: Employee) => void;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  employees, 
  attendance, 
  locations,
  onAddLocation,
  onUpdateLocation,
  onDeleteLocation,
  onImportEmployees,
  onUpdateEmployee,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [aiInsights, setAiInsights] = useState<{ summary: string, trends: string[], recommendations: string[] } | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedPayrollEmpId, setSelectedPayrollEmpId] = useState<string | null>(null);
  const [selectedStatsEmpId, setSelectedStatsEmpId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Payroll Management State
  const [isPayrollAdjustmentModalOpen, setIsPayrollAdjustmentModalOpen] = useState(false);
  const [targetEmployee, setTargetEmployee] = useState<Employee | null>(null);

  // Location Form State
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [locationForm, setLocationForm] = useState<Partial<Location>>({
    name: '',
    type: PremiseType.OFFICE,
    latitude: 0,
    longitude: 0,
    radius: 50,
    qrCode: '',
    startTime: '09:00',
    endTime: '18:00'
  });

  useEffect(() => {
    if (activeTab === 'Overview') {
      const fetchInsights = async () => {
        setLoadingInsights(true);
        const data = await getAttendanceInsights(attendance);
        setAiInsights(data);
        setLoadingInsights(false);
      };
      fetchInsights();
    }
  }, [attendance, activeTab]);

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const departments = useMemo(() => {
    const depts = new Set(employees.map(e => e.department));
    return ['All Departments', ...Array.from(depts)];
  }, [employees]);

  const stats = [
    { label: 'Total Workforce', value: employees.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'On-Site Now', value: attendance.filter(a => a.checkIn && !a.checkOut && isToday(a.checkIn)).length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Exceptions (Late)', value: attendance.filter(a => a.status === 'LATE' && isToday(a.checkIn)).length, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Locations', value: locations.length, icon: MapPin, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const locationAnalytics = useMemo(() => {
    return locations.map(loc => {
      const assignedEmps = employees.filter(e => e.locationId === loc.id);
      const todayRecords = attendance.filter(a => a.locationId === loc.id && isToday(a.checkIn));
      
      const onTime = todayRecords.filter(a => a.status === 'PRESENT').length;
      const late = todayRecords.filter(a => a.status === 'LATE').length;
      const overtime = todayRecords.filter(a => a.status === 'OVERTIME' || (a.checkIn && a.checkOut && (a.checkOut.getTime() - a.checkIn.getTime()) > 8 * 3600 * 1000)).length;
      const present = todayRecords.length;
      const absent = Math.max(0, assignedEmps.length - present);

      return {
        ...loc,
        total: assignedEmps.length,
        onTime,
        late,
        overtime,
        absent,
        present
      };
    });
  }, [locations, employees, attendance]);

  const chartData = locationAnalytics.map(loc => ({
    name: loc.name,
    count: loc.total,
    present: loc.present
  }));

  const navItems = [
    { id: 'Overview', label: 'Overview', icon: BarChart3 },
    { id: 'Employees', label: 'Employees', icon: Users },
    { id: 'Payroll', label: 'Payroll Management', icon: Calculator },
    { id: 'Locations', label: 'Locations', icon: MapPin },
  ];

  const calculateFullPayroll = (empId: string): (PayrollReport & { totalAdjustments: number, penalty: number, loanRepayment: number, bonus: number }) | null => {
    const emp = employees.find(e => e.id === empId);
    // CRITICAL: Filter for ACTIVE status as per requirements
    if (!emp || emp.status !== 'ACTIVE') return null;

    const empRecords = attendance.filter(a => a.employeeId === empId && a.checkIn && a.checkOut);
    let totalHours = 0;
    let overtimeHours = 0;

    empRecords.forEach(rec => {
      const diff = (rec.checkOut!.getTime() - rec.checkIn!.getTime()) / (1000 * 60 * 60);
      totalHours += diff;
      if (diff > 8) overtimeHours += (diff - 8);
    });

    const overtimePay = overtimeHours * emp.hourlyRate * emp.otMultiplier;
    const totalAdjustments = emp.bonus - (emp.penalty + emp.loanRepayment);
    const netPay = emp.baseSalary + overtimePay + totalAdjustments;

    return {
      employeeId: emp.id,
      name: emp.name,
      totalHours,
      overtimeHours,
      baseSalary: emp.baseSalary,
      allowances: emp.bonus,
      deductions: emp.penalty + emp.loanRepayment,
      totalAdjustments,
      penalty: emp.penalty,
      loanRepayment: emp.loanRepayment,
      bonus: emp.bonus,
      netPay
    };
  };

  const handleOpenAdjustmentModal = (emp: Employee) => {
    setTargetEmployee({ ...emp });
    setIsPayrollAdjustmentModalOpen(true);
  };

  const handleUpdateFinancials = () => {
    if (targetEmployee) {
      onUpdateEmployee?.(targetEmployee);
      setIsPayrollAdjustmentModalOpen(false);
    }
  };

  const handleToggleStatus = (emp: Employee) => {
    const newStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    onUpdateEmployee?.({ ...emp, status: newStatus });
  };

  const handleExportPayrollCsv = () => {
    const header = "Name,Employee ID,Department,Status,Base Salary,Bonus,Penalty,Loan,Total OT Hrs,Net Pay\n";
    // CRITICAL: Filter for ACTIVE status as per requirements
    const activeEmployees = employees.filter(e => e.status === 'ACTIVE');
    const csvContent = activeEmployees.map(emp => {
      const p = calculateFullPayroll(emp.id);
      if (!p) return "";
      return `${emp.name},${emp.employeeId},${emp.department},${emp.status},${p.baseSalary},${p.bonus},${p.penalty},${p.loanRepayment},${p.overtimeHours.toFixed(1)},${p.netPay.toFixed(2)}`;
    }).filter(line => line !== "").join("\n");

    const blob = new Blob([header + csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AttendFlow_Active_Payroll_${new Date().toLocaleDateString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenLocationModal = (loc?: Location) => {
    if (loc) {
      setEditingLocationId(loc.id);
      setLocationForm({ ...loc });
    } else {
      setEditingLocationId(null);
      setLocationForm({
        name: '',
        type: PremiseType.OFFICE,
        latitude: 0,
        longitude: 0,
        radius: 50,
        qrCode: `QR-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        startTime: '09:00',
        endTime: '18:00'
      });
    }
    setIsLocationModalOpen(true);
  };

  const handleSaveLocation = () => {
    if (!locationForm.name || !locationForm.qrCode) return;

    if (editingLocationId) {
      onUpdateLocation?.({ ...locationForm, id: editingLocationId } as Location);
    } else {
      onAddLocation?.({ ...locationForm, id: `loc-${Date.now()}` } as Location);
    }
    setIsLocationModalOpen(false);
  };

  const handleCsvImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n');
      const newEmployees: Employee[] = [];

      rows.slice(1).forEach((row, index) => {
        const columns = row.split(',');
        if (columns.length >= 7) {
          newEmployees.push({
            id: `emp-csv-${Date.now()}-${index}`,
            name: columns[0].trim(),
            employeeId: columns[1].trim(),
            role: (columns[2].trim() as UserRole) || 'EMPLOYEE',
            locationId: columns[3].trim() || (locations[0]?.id || ''),
            department: columns[4].trim() || 'Unassigned',
            baseSalary: parseFloat(columns[5].trim()) || 0,
            hourlyRate: parseFloat(columns[6].trim()) || 0,
            otMultiplier: 1.5,
            penalty: 0,
            loanRepayment: 0,
            bonus: 0,
            avatar: `https://picsum.photos/seed/${columns[1].trim()}/200`,
            status: 'ACTIVE',
            onboarded: false
          });
        }
      });

      if (newEmployees.length > 0) {
        onImportEmployees?.(newEmployees);
        alert(`Successfully imported ${newEmployees.length} employees.`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-8 border-b xl:border-none">
        <div className="flex items-center gap-3 text-[#1e1b4b] font-black text-2xl tracking-tighter">
          <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Clock size={22} />
          </div>
          <span>AttendFlow</span>
        </div>
      </div>
      
      <nav className="flex-grow px-6 space-y-2 mt-8">
        <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Operations</p>
        {navItems.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setIsMobileMenuOpen(false);
              setSelectedPayrollEmpId(null);
              setSelectedStatsEmpId(null);
            }}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
            }`}
          >
            <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="p-6">
        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">A</div>
            <div>
              <p className="text-xs font-black text-slate-900">Admin User</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Super Admin</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white text-red-500 border border-red-50 rounded-2xl text-xs font-bold hover:bg-red-50 transition-all shadow-sm"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 md:p-7 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md group">
            <div className="flex items-center justify-between mb-4 md:mb-5">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <ArrowUpRight size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl md:text-3xl font-black text-slate-900 mt-1 md:mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h3 className="text-lg md:text-xl font-black text-slate-900">Workforce Presence by Site</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                  <span className="h-2 w-2 rounded-full bg-indigo-600" /> Assigned
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Present Today
                </div>
              </div>
            </div>
            <div className="h-[250px] md:h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '10px'}} 
                  />
                  <Bar dataKey="count" name="Assigned" fill="#4f46e5" radius={[8, 8, 0, 0]} barSize={20} />
                  <Bar dataKey="present" name="Present Today" fill="#10b981" radius={[8, 8, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg md:text-xl font-black text-slate-900 mb-8">Location Operational Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {locationAnalytics.map((loc) => (
                <div key={loc.id} className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 hover:bg-white hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-black text-slate-900 text-sm truncate pr-2">{loc.name}</h4>
                    <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                      {loc.type}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Presence</p>
                      <div className="flex items-center gap-2">
                        <UserCheck size={14} className="text-emerald-500" />
                        <span className="text-xs font-bold text-slate-700">{loc.onTime} On-Time</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="text-amber-500" />
                        <span className="text-xs font-bold text-slate-700">{loc.late} Late</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Exemptions</p>
                      <div className="flex items-center gap-2">
                        <UserMinus size={14} className="text-rose-500" />
                        <span className="text-xs font-bold text-slate-700">{loc.absent} Absent</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-blue-500" />
                        <span className="text-xs font-bold text-slate-700">{loc.overtime} Overtime</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <div className="h-1.5 flex-grow bg-slate-200 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500" style={{ width: `${(loc.onTime / (loc.total || 1)) * 100}%` }} />
                      <div className="bg-amber-500" style={{ width: `${(loc.late / (loc.total || 1)) * 100}%` }} />
                      <div className="bg-rose-500" style={{ width: `${(loc.absent / (loc.total || 1)) * 100}%` }} />
                    </div>
                    <span className="ml-4 text-[10px] font-black text-slate-400">{loc.present}/{loc.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 md:space-y-8">
          <div className="bg-[#1e1b4b] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-2xl relative overflow-hidden min-h-[300px] flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20" />
            <div className="relative z-10 flex-grow">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Sparkles size={20} className="text-blue-400" />
                </div>
                <h3 className="font-bold text-lg">AI Operations Hub</h3>
              </div>
              {loadingInsights ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-white/10 rounded w-full"></div>
                  <div className="h-4 bg-white/10 rounded w-5/6"></div>
                  <div className="h-20 bg-white/5 rounded-2xl w-full mt-4"></div>
                </div>
              ) : aiInsights ? (
                <div className="space-y-5 text-sm">
                  <p className="leading-relaxed text-slate-300 font-medium">{aiInsights.summary}</p>
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Live Trends</p>
                    {aiInsights.trends.slice(0, 2).map((t, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                        <TrendingUp size={14} className="mt-0.5 text-blue-400" />
                        <span className="text-[11px] font-medium">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <p className="text-slate-500 italic">Predictive analysis pending...</p>}
            </div>
            <button className="relative z-10 mt-6 w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] md:text-xs font-bold transition-all flex items-center justify-center gap-2 border border-white/5">
              Request Full HR Report <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmployees = () => {
    const filteredEmployees = employees.filter(e => {
      const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDept === 'All Departments' || e.department === selectedDept;
      return matchesSearch && matchesDept;
    });

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-2 flex items-center gap-2 flex-grow max-w-2xl">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search associates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-6 py-3 bg-slate-50 border-none rounded-2xl text-xs font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
              />
            </div>
            <div className="h-10 w-px bg-slate-100 mx-2 hidden md:block" />
            <div className="relative min-w-[160px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <select 
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full pl-10 pr-6 py-3 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-0 appearance-none cursor-pointer"
              >
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              onChange={handleCsvImport} 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-3xl font-black text-xs shadow-sm flex items-center gap-3 hover:bg-slate-50 transition-all active:scale-95"
            >
              <FileUp size={18} className="text-indigo-600" /> BULK IMPORT CSV
            </button>
            <button className="h-12 w-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-all">
              <Plus size={24} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Associate</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Rate</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <Users size={48} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-400 font-medium">No employees found matching the criteria.</p>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <button 
                          onClick={() => setSelectedStatsEmpId(emp.id)}
                          className="flex items-center gap-4 text-left hover:opacity-80 transition-opacity outline-none"
                        >
                          <img src={emp.avatar} alt={emp.name} className="h-10 w-10 rounded-xl object-cover" />
                          <div>
                            <p className="font-bold text-slate-900 leading-none mb-1 group-hover:text-indigo-600 transition-colors">{emp.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{emp.employeeId}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-8 py-5">
                         <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-tighter">
                           {emp.department}
                         </span>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-slate-900">${emp.baseSalary.toLocaleString()}/mo</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">${emp.hourlyRate}/hr base</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${emp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                            onClick={() => handleToggleStatus(emp)}
                            title={emp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            className={`p-3 border rounded-xl transition-all shadow-sm ${emp.status === 'ACTIVE' ? 'bg-white text-rose-500 border-rose-50 hover:bg-rose-500 hover:text-white' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white'}`}
                          >
                            {emp.status === 'ACTIVE' ? <UserMinus size={14} /> : <UserCheck size={14} />}
                          </button>
                          <button 
                            onClick={() => setSelectedPayrollEmpId(emp.id)}
                            className="p-3 bg-white border border-slate-100 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-2 text-xs font-bold"
                          >
                            <DollarSign size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderPayrollManagement = () => {
    // CRITICAL: Filter for ACTIVE status as per requirements
    const activeEmployees = employees.filter(e => e.status === 'ACTIVE');

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900">Financial Ledger (Active Staff)</h3>
            <p className="text-xs font-medium text-slate-500">Only staff with an ACTIVE status are eligible for current cycle settlement.</p>
          </div>
          <button 
            onClick={handleExportPayrollCsv}
            disabled={activeEmployees.length === 0}
            className="px-6 py-4 bg-slate-900 text-white rounded-3xl font-black text-xs shadow-xl shadow-slate-900/10 flex items-center gap-3 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Download size={18} className="text-blue-400" /> EXPORT ACTIVE PAYROLL (CSV)
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Associate</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Rate</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-emerald-600 bg-emerald-50/30">Additions</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-rose-600 bg-rose-50/30">Deductions</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Payable</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="mx-auto h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <UserMinus size={40} className="text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-bold text-sm">No active employees found in current ledger.</p>
                      <button onClick={() => setActiveTab('Employees')} className="mt-4 text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Verify Staff Status</button>
                    </td>
                  </tr>
                ) : (
                  activeEmployees.map(emp => {
                    const p = calculateFullPayroll(emp.id);
                    if (!p) return null;
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <img src={emp.avatar} alt={emp.name} className="h-10 w-10 rounded-xl object-cover" />
                            <div>
                              <p className="font-bold text-slate-900 leading-none mb-1">{emp.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">{emp.department}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-sm font-black text-slate-900">${p.baseSalary.toLocaleString()}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">${emp.hourlyRate}/hr</div>
                        </td>
                        <td className="px-8 py-6 bg-emerald-50/10">
                          <div className="text-sm font-black text-emerald-600 flex items-center gap-1.5">
                            <Plus size={12} /> ${p.bonus.toLocaleString()}
                          </div>
                          <div className="text-[10px] font-bold text-emerald-400 uppercase">Monthly Bonus</div>
                        </td>
                        <td className="px-8 py-6 bg-rose-50/10">
                          <div className="text-sm font-black text-rose-600 flex items-center gap-1.5">
                            <UserMinus size={12} /> ${(p.penalty + p.loanRepayment).toLocaleString()}
                          </div>
                          <div className="text-[10px] font-bold text-rose-400 uppercase">Penalty & Loans</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-lg font-black text-slate-900 tracking-tight">${p.netPay.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                          <div className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-1">
                            <Clock size={10} /> incl. {p.overtimeHours.toFixed(1)}h OT
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button 
                            onClick={() => handleOpenAdjustmentModal(emp)}
                            className="p-3 bg-white border border-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                          >
                            <Scale size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const AdjustmentModal = () => {
    if (!isPayrollAdjustmentModalOpen || !targetEmployee) return null;

    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
        <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
          <div className="px-10 py-8 border-b flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Financial Adjustments</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Settlement Config • {targetEmployee.name}</p>
            </div>
            <button onClick={() => setIsPayrollAdjustmentModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full">
              <X size={20} />
            </button>
          </div>

          <div className="p-10 space-y-8 overflow-y-auto max-h-[80vh]">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Salary ($)</label>
                <div className="relative">
                  <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="number" 
                    value={targetEmployee.baseSalary}
                    onChange={e => setTargetEmployee({...targetEmployee, baseSalary: parseFloat(e.target.value)})}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hourly Rate ($)</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="number" 
                    value={targetEmployee.hourlyRate}
                    onChange={e => setTargetEmployee({...targetEmployee, hourlyRate: parseFloat(e.target.value)})}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">OT Multiplier (x)</label>
                <div className="relative">
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="number" 
                    step="0.1"
                    value={targetEmployee.otMultiplier}
                    onChange={e => setTargetEmployee({...targetEmployee, otMultiplier: parseFloat(e.target.value)})}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monthly Bonus (+)</label>
                <div className="relative">
                  <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-300" size={18} />
                  <input 
                    type="number" 
                    value={targetEmployee.bonus}
                    onChange={e => setTargetEmployee({...targetEmployee, bonus: parseFloat(e.target.value)})}
                    className="w-full pl-12 pr-6 py-4 bg-emerald-50/30 border-none rounded-2xl focus:ring-2 focus:ring-emerald-100 font-bold text-emerald-700"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-50">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Penalty Fines (-)</label>
                <div className="relative">
                  <ArrowDownRight className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-300" size={18} />
                  <input 
                    type="number" 
                    value={targetEmployee.penalty}
                    onChange={e => setTargetEmployee({...targetEmployee, penalty: parseFloat(e.target.value)})}
                    className="w-full pl-12 pr-6 py-4 bg-rose-50/30 border-none rounded-2xl focus:ring-2 focus:ring-rose-100 font-bold text-rose-700"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Loan Repayment (-)</label>
                <div className="relative">
                  <Receipt className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-300" size={18} />
                  <input 
                    type="number" 
                    value={targetEmployee.loanRepayment}
                    onChange={e => setTargetEmployee({...targetEmployee, loanRepayment: parseFloat(e.target.value)})}
                    className="w-full pl-12 pr-6 py-4 bg-rose-50/30 border-none rounded-2xl focus:ring-2 focus:ring-rose-100 font-bold text-rose-700"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleUpdateFinancials}
              className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <CheckCircle size={20} /> COMMIT FINANCIAL ADJUSTMENTS
            </button>
          </div>
        </div>
      </div>
    );
  };

  const StatsModal = () => {
    if (!selectedStatsEmpId) return null;
    const emp = employees.find(e => e.id === selectedStatsEmpId);
    if (!emp) return null;

    const empAttendance = attendance.filter(a => a.employeeId === emp.id);
    const lateDays = empAttendance.filter(a => a.status === 'LATE').length;
    const presentDays = empAttendance.filter(a => a.checkIn).length;
    
    let totalOTHours = 0;
    empAttendance.forEach(a => {
      if (a.checkIn && a.checkOut) {
        const diff = (a.checkOut.getTime() - a.checkIn.getTime()) / (1000 * 60 * 60);
        if (diff > 8) totalOTHours += (diff - 8);
      }
    });

    // Mock trend data for area chart
    const trendData = empAttendance.slice(-7).map((a, i) => ({
      day: `Day ${i + 1}`,
      hours: a.checkIn && a.checkOut ? (a.checkOut.getTime() - a.checkIn.getTime()) / (3600 * 1000) : 0
    }));

    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
        <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
          <div className="px-10 py-8 border-b flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{emp.name}</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{emp.department} • Historical Stats</p>
              </div>
            </div>
            <button onClick={() => setSelectedStatsEmpId(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-10 overflow-y-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl"><UserCheck size={18} /></div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Attendance</span>
                </div>
                <p className="text-3xl font-black text-slate-900">{presentDays}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Total Days Present</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-600 text-white rounded-xl"><AlertTriangle size={18} /></div>
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Punctuality</span>
                </div>
                <p className="text-3xl font-black text-slate-900">{lateDays}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Late Arrivals recorded</p>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-600 text-white rounded-xl"><TrendingUp size={18} /></div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Performance</span>
                </div>
                <p className="text-3xl font-black text-slate-900">{totalOTHours.toFixed(1)}h</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Total Overtime Hours</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100">
              <h3 className="text-sm font-black text-slate-900 mb-6 uppercase tracking-widest flex items-center gap-2">
                <Activity size={16} className="text-indigo-600" /> Recent Working Hours Trend
              </h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Area type="monotone" dataKey="hours" stroke="#4f46e5" fillOpacity={1} fill="url(#colorHours)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={16} className="text-indigo-600" /> Shift History
              </h3>
              <div className="space-y-2">
                {empAttendance.slice(-5).map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${a.status === 'LATE' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {a.status === 'LATE' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{a.checkIn?.toLocaleDateString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">In: {a.checkIn?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${a.status === 'LATE' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLocations = () => {
    const premiseIcons = {
      [PremiseType.OFFICE]: Building2,
      [PremiseType.FACTORY]: Factory,
      [PremiseType.WAREHOUSE]: Warehouse,
      [PremiseType.SHOWROOM]: ShoppingBag
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900">Verified Operational Zones</h3>
          <button 
            onClick={() => handleOpenLocationModal()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={18} /> PROVISION NEW ZONE
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((loc) => {
            const Icon = premiseIcons[loc.type] || Building2;
            return (
              <div key={loc.id} className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="h-14 w-14 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Icon size={28} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenLocationModal(loc)}
                      className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => onDeleteLocation?.(loc.id)}
                      className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <h4 className="text-xl font-black text-slate-900 mb-1">{loc.name}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{loc.type} • ID: {loc.id}</p>

                <div className="space-y-3 pt-6 border-t border-slate-50">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-indigo-500" /> Operating Shift
                    </div>
                    <span className="text-slate-900">{loc.startTime} - {loc.endTime}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-indigo-500" /> Geofence Radius
                    </div>
                    <span className="text-slate-900">{loc.radius} Meters</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-2">
                      <QrCode size={14} className="text-indigo-500" /> QR Signature
                    </div>
                    <span className="text-slate-900 font-mono text-[10px]">{loc.qrCode}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const PayrollModal = () => {
    if (!selectedPayrollEmpId) return null;
    const report = calculateFullPayroll(selectedPayrollEmpId);
    if (!report) return null;
    const emp = employees.find(e => e.id === selectedPayrollEmpId);

    const pieData = [
      { name: 'Base Salary', value: report.baseSalary, fill: '#4f46e5' },
      { name: 'Bonus/Allowances', value: report.allowances, fill: '#10b981' },
      { name: 'Overtime', value: report.overtimeHours * (emp?.hourlyRate || 0) * (emp?.otMultiplier || 1), fill: '#f59e0b' },
    ];

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
        <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
          <div className="px-10 py-8 border-b flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Receipt size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Payroll Detail</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Financial Settlement • Current Cycle</p>
              </div>
            </div>
            <button onClick={() => setSelectedPayrollEmpId(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-10 overflow-y-auto space-y-8">
            <div className="flex items-center gap-6 p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
              <img src={emp?.avatar} className="h-20 w-20 rounded-[1.5rem] object-cover ring-4 ring-white shadow-lg" alt="" />
              <div>
                <h3 className="text-xl font-black text-slate-900">{report.name}</h3>
                <p className="text-sm font-bold text-slate-500">{emp?.role}</p>
                <div className="flex items-center gap-4 mt-3">
                   <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                      <Clock size={12} className="text-indigo-500" />
                      <span className="text-[10px] font-black text-slate-700 uppercase">{report.totalHours.toFixed(1)} Total Hrs</span>
                   </div>
                   <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1 rounded-full border border-orange-100 shadow-sm">
                      <TrendingUp size={12} className="text-orange-500" />
                      <span className="text-[10px] font-black text-orange-700 uppercase">{report.overtimeHours.toFixed(1)} OT Hrs</span>
                   </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Earnings & Deductions</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><DollarSign size={16} /></div>
                      <span className="text-sm font-bold text-slate-700">Base Salary</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">${report.baseSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Plus size={16} /></div>
                      <span className="text-sm font-bold text-slate-700">Bonuses</span>
                    </div>
                    <span className="text-sm font-black text-emerald-600">+${report.allowances.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><TrendingUp size={16} /></div>
                      <span className="text-sm font-bold text-slate-700">Overtime Pay</span>
                    </div>
                    <span className="text-sm font-black text-amber-600">+${(report.overtimeHours * (emp?.hourlyRate || 0) * (emp?.otMultiplier || 1)).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-50 text-red-600 rounded-lg"><CreditCard size={16} /></div>
                      <span className="text-sm font-bold text-red-700">Penalties & Loans</span>
                    </div>
                    <span className="text-sm font-black text-red-600">-${report.deductions.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-600/20 rounded-full blur-3xl" />
                
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 relative z-10">Net Take-Home Pay</p>
                <h3 className="text-5xl font-black mb-6 relative z-10">${report.netPay.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                
                <div className="h-40 w-full relative z-10">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{borderRadius: '12px', background: '#fff', border: 'none', color: '#000'}} 
                        />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
                <button className="mt-6 w-full py-4 bg-white text-slate-900 rounded-2xl font-black hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/5">
                  <ShieldCheck size={18} className="text-emerald-500" /> AUTHORIZE PAYOUT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const LocationModal = () => {
    if (!isLocationModalOpen) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
        <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
          <div className="px-10 py-8 border-b flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">{editingLocationId ? 'Modify Operational Zone' : 'Provision New Zone'}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Geofence & Verification Parameters</p>
            </div>
            <button onClick={() => setIsLocationModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full">
              <X size={20} />
            </button>
          </div>

          <div className="p-10 overflow-y-auto space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Zone Name</label>
                <input 
                  type="text" 
                  value={locationForm.name}
                  onChange={e => setLocationForm({...locationForm, name: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold"
                  placeholder="e.g. SF Main Branch"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Premise Type</label>
                <select 
                  value={locationForm.type}
                  onChange={e => setLocationForm({...locationForm, type: e.target.value as PremiseType})}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold"
                >
                  {Object.values(PremiseType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Latitude</label>
                <input 
                  type="number" 
                  step="any"
                  value={locationForm.latitude}
                  onChange={e => setLocationForm({...locationForm, latitude: parseFloat(e.target.value)})}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Longitude</label>
                <input 
                  type="number" 
                  step="any"
                  value={locationForm.longitude}
                  onChange={e => setLocationForm({...locationForm, longitude: parseFloat(e.target.value)})}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Radius (Meters)</label>
                <input 
                  type="number" 
                  value={locationForm.radius}
                  onChange={e => setLocationForm({...locationForm, radius: parseInt(e.target.value)})}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shift Start</label>
                <input 
                  type="time" 
                  value={locationForm.startTime}
                  onChange={e => setLocationForm({...locationForm, startTime: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shift End</label>
                <input 
                  type="time" 
                  value={locationForm.endTime}
                  onChange={e => setLocationForm({...locationForm, endTime: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">QR Unique Signature</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={locationForm.qrCode}
                  onChange={e => setLocationForm({...locationForm, qrCode: e.target.value})}
                  className="flex-grow px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-mono font-bold"
                />
                <button 
                  onClick={() => setLocationForm({...locationForm, qrCode: `QR-${Math.random().toString(36).substr(2, 6).toUpperCase()}`})}
                  className="px-4 py-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
            </div>

            <button 
              onClick={handleSaveLocation}
              className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-xl shadow-indigo-600/20 active:scale-95 transition-all mt-6"
            >
              {editingLocationId ? 'COMMIT CHANGES' : 'CREATE OPERATIONAL ZONE'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <aside className="w-72 bg-white border-r hidden xl:flex flex-col sticky top-0 h-screen z-50">
        <SidebarContent />
      </aside>

      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] transition-opacity duration-300 xl:hidden ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)}>
        <div className={`absolute left-0 top-0 bottom-0 w-72 bg-white transition-transform duration-300 ease-out shadow-2xl ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={e => e.stopPropagation()}>
          <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-8 right-6 p-2 text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
          <SidebarContent />
        </div>
      </div>

      <main className="flex-grow p-5 md:p-10 max-w-[1600px] mx-auto w-full">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-8 md:mb-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-1">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" /> System Online
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">{activeTab}</h1>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="xl:hidden h-12 w-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-600 shadow-sm"
            >
              <Menu size={24} />
            </button>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="relative group flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Quick search..." 
                className="pl-12 pr-6 py-3.5 md:py-4 bg-white border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 w-full md:w-80 transition-all shadow-sm"
              />
            </div>
            <button className="h-12 w-12 md:h-14 md:w-14 bg-white border border-slate-100 flex items-center justify-center rounded-2xl text-slate-500 hover:text-indigo-600 transition-all shadow-sm flex-shrink-0">
              <Filter size={20} />
            </button>
          </div>
        </header>

        {activeTab === 'Overview' && renderOverview()}
        {activeTab === 'Employees' && renderEmployees()}
        {activeTab === 'Payroll' && renderPayrollManagement()}
        {activeTab === 'Locations' && renderLocations()}
        
        {activeTab !== 'Overview' && activeTab !== 'Employees' && activeTab !== 'Locations' && activeTab !== 'Payroll' && (
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 border border-slate-100 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in h-[400px]">
             <h2 className="text-xl md:text-2xl font-black text-slate-900">{activeTab} Module</h2>
             <p className="text-slate-500 max-w-xs mt-4 font-medium text-sm">This operational module is being populated with your live organizational data.</p>
          </div>
        )}
      </main>

      <PayrollModal />
      <LocationModal />
      <AdjustmentModal />
      <StatsModal />
    </div>
  );
};

export default AdminDashboard;
