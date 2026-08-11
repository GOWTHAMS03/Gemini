import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  X,
  Phone,
  Mail,
  ShieldCheck,
  Edit3,
  Trash2,
  KeyRound,
  CheckCircle2,
  LayoutGrid,
  List,
  Truck,
  UserCheck,
  Briefcase,
  Calendar,
  Building2,
  Award,
  Smartphone,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  MapPin,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Shield,
  CreditCard,
  Clock,
  DollarSign,
  Receipt,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Wallet,
  CheckCircle,
  Clock3
} from 'lucide-react';
import { 
  employeeApi, 
  salaryApi, 
  ApiEmployee, 
  ApiEmployeeSalary, 
  ApiEmployeeSalaryHistory, 
  ApiSalaryExpenseDashboard 
} from '../services/apiService';

type MainViewTab = 'STAFF_DIRECTORY' | 'SALARY_MANAGEMENT';
type RoleTab = 'ALL' | 'ROLE_DRIVER' | 'ROLE_SALES_EXECUTIVE' | 'ROLE_EMPLOYEE';

const ROLE_TABS: { key: RoleTab; label: string; icon: React.ElementType; color: string; bgColor: string; borderColor: string }[] = [
  { key: 'ALL', label: 'All Staff', icon: Users, color: 'text-slate-700 dark:text-slate-200', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/20' },
  { key: 'ROLE_DRIVER', label: 'Drivers', icon: Truck, color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
  { key: 'ROLE_SALES_EXECUTIVE', label: 'Sales Executives', icon: UserCheck, color: 'text-indigo-700 dark:text-indigo-300', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/20' },
  { key: 'ROLE_EMPLOYEE', label: 'Employees', icon: Briefcase, color: 'text-teal-700 dark:text-teal-300', bgColor: 'bg-teal-500/10', borderColor: 'border-teal-500/20' },
];

const getRoleBadge = (roles: string[]) => {
  if (roles.includes('ROLE_SALES_EXECUTIVE')) return { label: 'Sales Executive', color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', gradient: 'from-indigo-500 to-purple-600' };
  if (roles.includes('ROLE_DRIVER')) return { label: 'Driver', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-500/10', border: 'border-blue-500/20', gradient: 'from-blue-500 to-cyan-600' };
  if (roles.includes('ROLE_EMPLOYEE')) return { label: 'Employee', color: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-500/10', border: 'border-teal-500/20', gradient: 'from-teal-500 to-emerald-600' };
  return { label: 'Staff', color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/20', gradient: 'from-slate-500 to-gray-600' };
};

const inputClass = "w-full bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-[#1C1C1C] dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition";
const labelClass = "block text-[11px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase mb-1.5 tracking-wider";
const selectClass = "w-full bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-[#1C1C1C] dark:text-slate-200 focus:outline-none focus:border-blue-500 transition appearance-none";

export const EmployeesPage: React.FC = () => {
  const [mainView, setMainView] = useState<MainViewTab>('STAFF_DIRECTORY');
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<RoleTab>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // ─── Salary State ────────────────────────────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');
  const [salaries, setSalaries] = useState<ApiEmployeeSalary[]>([]);
  const [salaryDashboard, setSalaryDashboard] = useState<ApiSalaryExpenseDashboard | null>(null);
  const [isSalaryLoading, setIsSalaryLoading] = useState(false);
  const [salarySearch, setSalarySearch] = useState('');
  const [salaryStatusFilter, setSalaryStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<ApiEmployee | null>(null);
  const [driverStep, setDriverStep] = useState(1);

  // Salary Modals
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<ApiEmployeeSalary | null>(null);
  const [selectedEmployeeForSalary, setSelectedEmployeeForSalary] = useState<number | null>(null);
  const [salaryBasic, setSalaryBasic] = useState<number>(25000);
  const [salaryAllowance, setSalaryAllowance] = useState<number>(0);
  const [salaryDeduction, setSalaryDeduction] = useState<number>(0);
  const [salaryTripBeta, setSalaryTripBeta] = useState<number>(0);
  const [salaryOther, setSalaryOther] = useState<number>(0);
  const [salaryNotes, setSalaryNotes] = useState<string>('');

  // Payment Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingSalary, setPayingSalary] = useState<ApiEmployeeSalary | null>(null);
  const [paymentMode, setPaymentMode] = useState<'BANK_TRANSFER' | 'CASH' | 'UPI' | 'CHEQUE'>('BANK_TRANSFER');
  const [paymentDate, setPaymentDate] = useState<string>('2026-08-31');
  const [paymentRefNumber, setPaymentRefNumber] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Receipt Modal
  const [receiptSalary, setReceiptSalary] = useState<ApiEmployeeSalary | null>(null);

  // History Modal
  const [historyData, setHistoryData] = useState<ApiEmployeeSalaryHistory | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Staff Form Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleGroup, setRoleGroup] = useState('EMPLOYEE');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [mobileAccessEnabled, setMobileAccessEnabled] = useState(true);
  const [permissionsInput, setPermissionsInput] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [assignedVehicle, setAssignedVehicle] = useState('');
  const [primaryRoute, setPrimaryRoute] = useState('');
  const [dlNumber, setDlNumber] = useState('');
  const [dlExpiryDate, setDlExpiryDate] = useState('');
  const [govtIdType, setGovtIdType] = useState('AADHAAR');
  const [govtIdNumber, setGovtIdNumber] = useState('');
  const [policeVerificationStatus, setPoliceVerificationStatus] = useState('PENDING');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await employeeApi.getAll();
      setEmployees(res.data || []);
    } catch (err) {
      console.error('Error loading employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSalaries = async () => {
    setIsSalaryLoading(true);
    try {
      const [res, dashRes] = await Promise.all([
        salaryApi.getAll(selectedMonth),
        salaryApi.getDashboard(selectedMonth)
      ]);
      setSalaries(res.data || []);
      setSalaryDashboard(dashRes.data);
    } catch (err) {
      console.error('Error loading salaries:', err);
    } finally {
      setIsSalaryLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (mainView === 'SALARY_MANAGEMENT') {
      loadSalaries();
    }
  }, [mainView, selectedMonth]);

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    const newM = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newM);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    const newM = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newM);
  };

  const handleProcessSalaries = async () => {
    try {
      setIsSalaryLoading(true);
      const res = await salaryApi.processMonthly(selectedMonth);
      setSalaries(res.data || []);
      showToast(`Processed monthly salary roster for ${selectedMonth} (${res.data?.length || 0} staff)`);
      loadSalaries();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error processing monthly salary');
    } finally {
      setIsSalaryLoading(false);
    }
  };

  const handleOpenSalaryConfig = (emp?: ApiEmployee, sal?: ApiEmployeeSalary) => {
    if (sal) {
      setEditingSalary(sal);
      setSelectedEmployeeForSalary(sal.employeeId);
      setSalaryBasic(sal.basicSalary);
      setSalaryAllowance(sal.allowanceAmount);
      setSalaryDeduction(sal.deductionAmount);
      setSalaryTripBeta(sal.tripBetaAmount);
      setSalaryOther(sal.otherExpenses);
      setSalaryNotes(sal.notes || '');
    } else if (emp) {
      setEditingSalary(null);
      setSelectedEmployeeForSalary(emp.id);
      const isDriver = emp.roles.includes('ROLE_DRIVER');
      const isSales = emp.roles.includes('ROLE_SALES_EXECUTIVE');
      setSalaryBasic(isDriver ? 25000 : isSales ? 22000 : 20000);
      setSalaryAllowance(0);
      setSalaryDeduction(0);
      setSalaryTripBeta(0);
      setSalaryOther(0);
      setSalaryNotes('');
    }
    setIsSalaryModalOpen(true);
  };

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeForSalary) return;
    try {
      await salaryApi.createOrUpdate({
        employeeId: selectedEmployeeForSalary,
        salaryMonth: selectedMonth,
        basicSalary: salaryBasic,
        allowanceAmount: salaryAllowance,
        deductionAmount: salaryDeduction,
        tripBetaAmount: salaryTripBeta,
        otherExpenses: salaryOther,
        notes: salaryNotes,
      });
      setIsSalaryModalOpen(false);
      showToast('Salary details saved successfully');
      loadSalaries();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error saving salary record');
    }
  };

  const handleOpenPayModal = (sal: ApiEmployeeSalary) => {
    setPayingSalary(sal);
    setPaymentMode('BANK_TRANSFER');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentRefNumber(`TXN-SAL-${Date.now().toString().slice(-6)}`);
    setPaymentNotes('');
    setIsPayModalOpen(true);
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingSalary) return;
    try {
      await salaryApi.paySalary(payingSalary.id, {
        paymentMode,
        paymentDate,
        referenceNumber: paymentRefNumber,
        notes: paymentNotes,
      });
      setIsPayModalOpen(false);
      showToast(`Salary of ₹${payingSalary.netSalary.toLocaleString()} marked as PAID for ${payingSalary.employeeName}`);
      loadSalaries();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to disburse salary');
    }
  };

  const handleViewHistory = async (empId: number) => {
    setIsHistoryLoading(true);
    try {
      const res = await salaryApi.getHistory(empId);
      setHistoryData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setUsername('');
    setPassword('');
    setEmail('');
    setPhone('');
    setRoleGroup('EMPLOYEE');
    setDepartment('');
    setDesignation('');
    setBasicSalary('');
    setJoiningDate('');
    setMobileAccessEnabled(true);
    setPermissionsInput('');
    setEmergencyContact('');
    setAssignedVehicle('');
    setPrimaryRoute('');
    setDlNumber('');
    setDlExpiryDate('');
    setGovtIdType('AADHAAR');
    setGovtIdNumber('');
    setPoliceVerificationStatus('PENDING');
    setEditingEmployee(null);
    setDriverStep(1);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: ApiEmployee) => {
    setEditingEmployee(emp);
    setFullName(emp.fullName);
    setUsername(emp.username);
    setPassword('');
    setEmail(emp.email || '');
    setPhone(emp.phone || '');
    if (emp.roles.includes('ROLE_SALES_EXECUTIVE')) setRoleGroup('SALES_EXECUTIVE');
    else if (emp.roles.includes('ROLE_DRIVER')) setRoleGroup('DRIVER');
    else setRoleGroup('EMPLOYEE');
    setDepartment(emp.department || '');
    setDesignation(emp.designation || '');
    setBasicSalary(emp.basicSalary ? emp.basicSalary.toString() : '');
    setJoiningDate(emp.joiningDate || '');
    setMobileAccessEnabled(emp.mobileAccessEnabled);
    setPermissionsInput(emp.permissions?.join(', ') || '');
    setEmergencyContact(emp.emergencyContact || '');
    setAssignedVehicle(emp.assignedVehicle || '');
    setPrimaryRoute(emp.primaryRoute || '');
    setDlNumber(emp.dlNumber || '');
    setDlExpiryDate(emp.dlExpiryDate || '');
    setGovtIdType(emp.govtIdType || 'AADHAAR');
    setGovtIdNumber(emp.govtIdNumber || '');
    setPoliceVerificationStatus(emp.policeVerificationStatus || 'PENDING');
    setDriverStep(1);
    setIsModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const permissions = permissionsInput.split(',').map(p => p.trim()).filter(Boolean);
    const payload = {
      username,
      password: password || undefined,
      fullName,
      email: email || undefined,
      phone: phone || undefined,
      roleGroup,
      department: department || undefined,
      designation: designation || undefined,
      basicSalary: basicSalary ? parseFloat(basicSalary) : undefined,
      joiningDate: joiningDate || undefined,
      mobileAccessEnabled,
      permissions,
      emergencyContact: roleGroup === 'DRIVER' ? emergencyContact : undefined,
      assignedVehicle: roleGroup === 'DRIVER' ? assignedVehicle : undefined,
      primaryRoute: roleGroup === 'DRIVER' ? primaryRoute : undefined,
      dlNumber: roleGroup === 'DRIVER' ? dlNumber : undefined,
      dlExpiryDate: roleGroup === 'DRIVER' ? dlExpiryDate : undefined,
      govtIdType: roleGroup === 'DRIVER' ? govtIdType : undefined,
      govtIdNumber: roleGroup === 'DRIVER' ? govtIdNumber : undefined,
      policeVerificationStatus: roleGroup === 'DRIVER' ? policeVerificationStatus : undefined,
    };

    try {
      if (editingEmployee) {
        await employeeApi.update(editingEmployee.id, payload);
        showToast('Employee updated successfully');
      } else {
        await employeeApi.create(payload as any);
        showToast('New employee created successfully');
      }
      setIsModalOpen(false);
      loadEmployees();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error saving employee');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await employeeApi.toggleStatus(id);
      showToast('Status updated');
      loadEmployees();
    } catch (err) {
      showToast('Failed to toggle status');
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this employee?')) return;
    try {
      await employeeApi.delete(id);
      showToast('Employee deleted');
      loadEmployees();
    } catch (err: any) {
      showToast(err.response?.data?.error || err.response?.data?.message || 'Failed to delete employee');
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.phone?.includes(searchQuery) ||
      emp.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && emp.isActive) ||
      (statusFilter === 'INACTIVE' && !emp.isActive);
    const matchesRole =
      activeTab === 'ALL' || emp.roles.includes(activeTab);
    return matchesSearch && matchesStatus && matchesRole;
  });

  const filteredSalaries = salaries.filter(sal => {
    const matchesSearch =
      sal.employeeName?.toLowerCase().includes(salarySearch.toLowerCase()) ||
      sal.employeeUsername?.toLowerCase().includes(salarySearch.toLowerCase()) ||
      sal.role?.toLowerCase().includes(salarySearch.toLowerCase());
    const matchesStatus =
      salaryStatusFilter === 'ALL' || sal.status === salaryStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-4 bg-slate-900 text-emerald-400 border border-emerald-500/50 rounded-2xl text-xs font-extrabold flex items-center justify-between shadow-2xl shadow-emerald-950/40 animate-in fade-in slide-in-from-bottom-4 fixed bottom-6 right-6 z-[999999] max-w-md">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="leading-snug">{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white hover:opacity-75 cursor-pointer ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Main View Tabs */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
              Staff & Salary Management
            </h1>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Manage company drivers, sales team, monthly salaries, allowances, and expense ledger
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => setMainView('STAFF_DIRECTORY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 border ${
              mainView === 'STAFF_DIRECTORY'
                ? 'bg-[#1C1C1C] dark:bg-blue-600 text-white border-transparent'
                : 'bg-[#F8F9FA] dark:bg-slate-700 text-[#1C1C1C] dark:text-slate-200 border-[#E9ECEF] dark:border-slate-600 hover:bg-[#F0F2F5] dark:hover:bg-slate-600'
            }`}
          >
            <Users className="w-4 h-4" />
            Staff Directory
          </button>
          <button
            onClick={() => setMainView('SALARY_MANAGEMENT')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 border ${
              mainView === 'SALARY_MANAGEMENT'
                ? 'bg-[#1C1C1C] dark:bg-emerald-600 text-white border-transparent'
                : 'bg-[#F8F9FA] dark:bg-slate-700 text-[#1C1C1C] dark:text-slate-200 border-[#E9ECEF] dark:border-slate-600 hover:bg-[#F0F2F5] dark:hover:bg-slate-600'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Salary Management
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 1. MONTHLY SALARY MANAGEMENT VIEW                                     */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {mainView === 'SALARY_MANAGEMENT' && (
        <div className="space-y-6">
          {/* Salary Month Bar & Top Actions */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-2xs border border-[#F0F2F5] dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-[#F8F9FA] dark:bg-slate-900 rounded-xl p-1 border border-[#E9ECEF] dark:border-slate-700">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition text-slate-600 dark:text-slate-300 shadow-xs"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-4 py-1 flex items-center gap-2 text-sm font-bold tracking-wide text-slate-900 dark:text-white">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition text-slate-600 dark:text-slate-300 shadow-xs"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <span className="text-xs text-[#8C8C8C] dark:text-slate-400 font-medium">
                Cycle: 01-{new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'short' })} to End of Month
              </span>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleProcessSalaries}
                disabled={isSalaryLoading}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1C1C1C] dark:bg-emerald-600 hover:bg-black dark:hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSalaryLoading ? 'animate-spin' : ''}`} />
                Process {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'short' })} Salaries
              </button>
            </div>
          </div>

          {/* Salary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Monthly Salary</span>
                <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  ₹{(salaryDashboard?.totalMonthlySalary || 0).toLocaleString()}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  For {salaryDashboard?.totalEmployees || salaries.length} total staff members
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Salary Paid</span>
                <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  ₹{(salaryDashboard?.totalSalaryPaid || 0).toLocaleString()}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  {salaryDashboard?.paidEmployeesCount || 0} employees completed
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Salary Pending</span>
                <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                  <Clock3 className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  ₹{(salaryDashboard?.totalSalaryPending || 0).toLocaleString()}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  {salaryDashboard?.pendingEmployeesCount || 0} staff disbursements pending
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Trip Beta Allowance</span>
                <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Truck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  ₹{(salaryDashboard?.totalBetaPaid || 0).toLocaleString()}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Across {salaryDashboard?.totalBetaPaidTrips || 0} dispatched route trips
                </p>
              </div>
            </div>
          </div>

          {/* Salary Table Filter & Search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name, username, or role..."
                value={salarySearch}
                onChange={e => setSalarySearch(e.target.value)}
                className="w-full bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setSalaryStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  salaryStatusFilter === 'ALL'
                    ? 'bg-[#1C1C1C] dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-[#F8F9FA] dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-[#F0F2F5]'
                }`}
              >
                All ({salaries.length})
              </button>
              <button
                onClick={() => setSalaryStatusFilter('PAID')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  salaryStatusFilter === 'PAID'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#F8F9FA] dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-[#F0F2F5]'
                }`}
              >
                Paid ({salaries.filter(s => s.status === 'PAID').length})
              </button>
              <button
                onClick={() => setSalaryStatusFilter('PENDING')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  salaryStatusFilter === 'PENDING'
                    ? 'bg-amber-500 text-black shadow-xs'
                    : 'bg-[#F8F9FA] dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-[#F0F2F5]'
                }`}
              >
                Pending ({salaries.filter(s => s.status !== 'PAID').length})
              </button>
            </div>
          </div>

          {/* Salary Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4 text-right">Basic Salary</th>
                    <th className="py-3.5 px-4 text-right">Allowances</th>
                    <th className="py-3.5 px-4 text-right">Deductions</th>
                    <th className="py-3.5 px-4 text-right">Net Payable</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4">Payment Info</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredSalaries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-400">
                        <DollarSign className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="font-semibold text-sm">No salary records found for {selectedMonth}</p>
                        <p className="text-xs mt-1">Click "Process {selectedMonth} Salaries" above to generate default salaries.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSalaries.map(sal => (
                      <tr key={sal.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                              {sal.employeeName?.charAt(0) || 'E'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{sal.employeeName}</div>
                              <div className="text-[11px] text-slate-400">@{sal.employeeUsername}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            sal.role.includes('Driver') ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                            sal.role.includes('Sales') ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20' :
                            'bg-slate-500/10 text-slate-600 border border-slate-500/20'
                          }`}>
                            {sal.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-700 dark:text-slate-300">
                          ₹{sal.basicSalary?.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                          +₹{((sal.allowanceAmount || 0) + (sal.tripBetaAmount || 0) + (sal.otherExpenses || 0)).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-rose-500">
                          -₹{(sal.deductionAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white text-sm">
                          ₹{sal.netSalary?.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {sal.status === 'PAID' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold text-[11px]">
                              <CheckCircle className="w-3 h-3" /> Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold text-[11px]">
                              <Clock3 className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {sal.status === 'PAID' ? (
                            <div className="text-[11px]">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">
                                {sal.paymentDate || 'Paid'} via {sal.paymentMode || 'BANK_TRANSFER'}
                              </div>
                              <div className="text-slate-400 text-[10px]">
                                Exp: {sal.expenseNumber || 'EXP-SAL'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Unpaid</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {sal.status !== 'PAID' ? (
                              <>
                                <button
                                  onClick={() => handleOpenSalaryConfig(undefined, sal)}
                                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
                                  title="Edit Salary"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleOpenPayModal(sal)}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1"
                                >
                                  <CreditCard className="w-3 h-3" /> Pay
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setReceiptSalary(sal)}
                                className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold transition flex items-center gap-1"
                              >
                                <Receipt className="w-3 h-3" /> Receipt
                              </button>
                            )}

                            <button
                              onClick={() => handleViewHistory(sal.employeeId)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 rounded-lg transition"
                              title="Salary History"
                            >
                              <FileText className="w-4 h-4" />
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
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 2. STAFF DIRECTORY VIEW                                               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {mainView === 'STAFF_DIRECTORY' && (
        <div className="space-y-6">
          {/* Top Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {ROLE_TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                      isActive
                        ? 'bg-[#1C1C1C] dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs'
                        : 'bg-[#F8F9FA] dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-[#F0F2F5] dark:hover:bg-slate-800 border-[#E9ECEF] dark:border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center bg-[#F8F9FA] dark:bg-slate-900 p-1 rounded-xl border border-[#E9ECEF] dark:border-slate-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                Add Employee
              </button>
            </div>
          </div>

          {/* Staff Cards Grid */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEmployees.map(emp => {
                const badge = getRoleBadge(emp.roles);
                const isDriver = emp.roles.includes('ROLE_DRIVER');
                return (
                  <div
                    key={emp.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs hover:shadow-sm transition p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full ${badge.bg} ${badge.color} border ${badge.border} flex items-center justify-center font-black text-lg shadow-sm`}>
                            {emp.fullName?.charAt(0) || 'E'}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                              {emp.fullName}
                            </h3>
                            <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400">@{emp.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {emp.roles.includes('ROLE_SALES_EXECUTIVE') && (
                            <div className={`p-1.5 rounded-lg border transition-colors ${
                              emp.mobileAccessEnabled 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' 
                                : 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400'
                            }`} title={emp.mobileAccessEnabled ? 'Mobile App Access Enabled' : 'Mobile App Access Disabled'}>
                              <Smartphone className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${badge.bg} ${badge.color} ${badge.border}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-y-3 gap-x-2 text-[11px] text-[#1C1C1C] dark:text-slate-300 font-medium">
                        {emp.phone && (
                          <div className="flex items-center gap-2 col-span-2 md:col-span-1">
                            <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 flex items-center justify-center text-[#8C8C8C] shadow-xs shrink-0">
                              <Phone className="w-3 h-3" />
                            </div>
                            <span className="truncate">{emp.phone}</span>
                          </div>
                        )}
                        {emp.email && (
                          <div className="flex items-center gap-2 col-span-2 md:col-span-1">
                            <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 flex items-center justify-center text-[#8C8C8C] shadow-xs shrink-0">
                              <Mail className="w-3 h-3" />
                            </div>
                            <span className="truncate">{emp.email}</span>
                          </div>
                        )}
                        {emp.department && (
                          <div className="flex items-center gap-2 col-span-2 md:col-span-1">
                            <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 flex items-center justify-center text-[#8C8C8C] shadow-xs shrink-0">
                              <Briefcase className="w-3 h-3" />
                            </div>
                            <span className="truncate">{emp.department}</span>
                          </div>
                        )}
                        {emp.designation && (
                          <div className="flex items-center gap-2 col-span-2 md:col-span-1">
                            <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 flex items-center justify-center text-[#8C8C8C] shadow-xs shrink-0">
                              <Award className="w-3 h-3" />
                            </div>
                            <span className="truncate">{emp.designation}</span>
                          </div>
                        )}
                        {emp.basicSalary && (
                          <div className="flex items-center gap-2 col-span-2 md:col-span-1">
                            <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
                              <DollarSign className="w-3 h-3" />
                            </div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{emp.basicSalary.toLocaleString()}</span>
                          </div>
                        )}
                        {emp.joiningDate && (
                          <div className="flex items-center gap-2 col-span-2 md:col-span-1">
                            <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 flex items-center justify-center text-[#8C8C8C] shadow-xs shrink-0">
                              <Calendar className="w-3 h-3" />
                            </div>
                            <span className="truncate">{emp.joiningDate}</span>
                          </div>
                        )}
                        {isDriver && emp.assignedVehicle && (
                          <div className="flex items-center gap-2 col-span-2 md:col-span-1">
                            <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center text-blue-600 shadow-xs shrink-0">
                              <Truck className="w-3 h-3" />
                            </div>
                            <span><span className="font-bold text-blue-600 dark:text-blue-400">{emp.assignedVehicle}</span></span>
                          </div>
                        )}
                        {isDriver && emp.primaryRoute && (
                          <div className="flex items-center gap-2 col-span-2 md:col-span-1">
                            <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 flex items-center justify-center text-[#8C8C8C] shadow-xs shrink-0">
                              <MapPin className="w-3 h-3" />
                            </div>
                            <span>{emp.primaryRoute}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#F0F2F5] dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(emp.id)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                            emp.isActive
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20'
                              : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20'
                          }`}
                        >
                          {emp.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenSalaryConfig(emp)}
                          className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 rounded-lg transition"
                          title="Configure Salary"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1.5 bg-[#F8F9FA] text-[#1C1C1C] hover:bg-[#F0F2F5] dark:bg-slate-700 dark:text-slate-200 rounded-lg transition border border-[#E9ECEF] dark:border-slate-600"
                          title="Edit Profile"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp.id)}
                          className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-lg transition"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Staff Member</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Vehicle / Route</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredEmployees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{emp.fullName}</div>
                        <div className="text-[11px] text-slate-400">@{emp.username}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${getRoleBadge(emp.roles).bg} ${getRoleBadge(emp.roles).color}`}>
                          {getRoleBadge(emp.roles).label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>{emp.phone || 'N/A'}</div>
                        <div className="text-slate-400 text-[11px]">{emp.email || ''}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div>{emp.assignedVehicle || '—'}</div>
                        <div className="text-slate-400 text-[11px]">{emp.primaryRoute || ''}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          emp.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                        }`}>
                          {emp.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenSalaryConfig(emp)}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg text-xs font-bold"
                          >
                            Salary
                          </button>
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 rounded-lg"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 3. CONFIGURE / EDIT SALARY MODAL                                      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isSalaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-xl border border-[#F0F2F5] dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0F2F5] dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
              <div>
                <h3 className="text-base font-bold text-[#1C1C1C] dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  Configure Monthly Salary ({selectedMonth})
                </h3>
                <p className="text-xs text-[#8C8C8C] dark:text-slate-400 mt-0.5">
                  Set basic pay, allowances, deductions, and trip beta
                </p>
              </div>
              <button
                onClick={() => setIsSalaryModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSalary} className="p-6 space-y-4">
              <div>
                <label className={labelClass}>Employee</label>
                <select
                  value={selectedEmployeeForSalary || ''}
                  onChange={e => setSelectedEmployeeForSalary(Number(e.target.value))}
                  className={selectClass}
                  required
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({getRoleBadge(emp.roles).label})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Basic Salary (₹)</label>
                  <input
                    type="number"
                    value={salaryBasic}
                    onChange={e => setSalaryBasic(Number(e.target.value))}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Other Allowance (₹)</label>
                  <input
                    type="number"
                    value={salaryAllowance}
                    onChange={e => setSalaryAllowance(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Trip Beta / Allowance (₹)</label>
                  <input
                    type="number"
                    value={salaryTripBeta}
                    onChange={e => setSalaryTripBeta(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Deductions (₹)</label>
                  <input
                    type="number"
                    value={salaryDeduction}
                    onChange={e => setSalaryDeduction(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Net Salary Calculation Banner */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Calculated Net Salary:
                </span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                  ₹{(Number(salaryBasic || 0) + Number(salaryAllowance || 0) + Number(salaryTripBeta || 0) + Number(salaryOther || 0) - Number(salaryDeduction || 0)).toLocaleString()}
                </span>
              </div>

              <div>
                <label className={labelClass}>Notes / Remarks</label>
                <textarea
                  value={salaryNotes}
                  onChange={e => setSalaryNotes(e.target.value)}
                  placeholder="Monthly performance bonus, fuel adjustment, etc."
                  rows={2}
                  className={inputClass}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0F2F5] dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsSalaryModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#8C8C8C] hover:text-[#1C1C1C] dark:text-slate-400 dark:hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1C1C1C] dark:bg-emerald-600 hover:bg-black dark:hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95"
                >
                  Save Salary Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 4. SALARY DISBURSEMENT / PAYMENT MODAL                                */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isPayModalOpen && payingSalary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-xl border border-[#F0F2F5] dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0F2F5] dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
              <div>
                <h3 className="text-base font-bold text-[#1C1C1C] dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                  Disburse Salary Payment
                </h3>
                <p className="text-xs text-[#8C8C8C] dark:text-slate-400 mt-0.5">
                  Posts expense to company ledger, general journal, and cash/bank treasury
                </p>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecutePayment} className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{payingSalary.employeeName}</div>
                  <div className="text-xs text-slate-400">{payingSalary.role} • Month: {payingSalary.salaryMonth}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-bold uppercase">Net Amount</div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    ₹{payingSalary.netSalary?.toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value as any)}
                  className={selectClass}
                  required
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="UPI">UPI Direct Payout</option>
                  <option value="CASH">Cash Counter Treasury</option>
                  <option value="CHEQUE">Company Cheque</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Reference Number</label>
                  <input
                    type="text"
                    value={paymentRefNumber}
                    onChange={e => setPaymentRefNumber(e.target.value)}
                    className={inputClass}
                    placeholder="UTR / Cheque No."
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Payment Notes / Memo</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  placeholder="Processed via HDFC Corporate Payroll"
                  className={inputClass}
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 text-[11px] text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  This payment will automatically record a Company Expense (`SALARIES`), adjust Cash/Bank balances, and post double-entry Journal Lines.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0F2F5] dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#8C8C8C] hover:text-[#1C1C1C] dark:text-slate-400 dark:hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1C1C1C] dark:bg-emerald-600 hover:bg-black dark:hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Confirm & Disburse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 5. SALARY RECEIPT MODAL                                               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {receiptSalary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl border border-[#F0F2F5] dark:border-slate-700 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#F0F2F5] dark:border-slate-700 pb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-base text-[#1C1C1C] dark:text-white">Salary Payment Receipt</h3>
              </div>
              <button onClick={() => setReceiptSalary(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center py-2">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold text-xs rounded-full">
                PAID & RECONCILED
              </span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-3">
                ₹{receiptSalary.netSalary?.toLocaleString()}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Disbursed on {receiptSalary.paymentDate || 'N/A'} via {receiptSalary.paymentMode || 'BANK_TRANSFER'}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl space-y-2 text-xs border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-slate-500">
                <span>Employee Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{receiptSalary.employeeName}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Role:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{receiptSalary.role}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Salary Month:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{receiptSalary.salaryMonth}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Basic Salary:</span>
                <span>₹{receiptSalary.basicSalary?.toLocaleString()}</span>
              </div>
              {Number(receiptSalary.allowanceAmount) > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Allowances:</span>
                  <span className="text-emerald-600">+₹{receiptSalary.allowanceAmount?.toLocaleString()}</span>
                </div>
              )}
              {Number(receiptSalary.deductionAmount) > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Deductions:</span>
                  <span className="text-rose-500">-₹{receiptSalary.deductionAmount?.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-slate-900 dark:text-white">
                <span>Expense Ref:</span>
                <span>{receiptSalary.expenseNumber || 'EXP-SAL'}</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setReceiptSalary(null)}
                className="w-full py-2.5 bg-[#1C1C1C] hover:bg-black dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold transition"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 6. EMPLOYEE SALARY HISTORY MODAL                                      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {historyData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-xl border border-[#F0F2F5] dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0F2F5] dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
              <div>
                <h3 className="text-base font-bold text-[#1C1C1C] dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Salary History: {historyData.employeeName}
                </h3>
                <p className="text-xs text-[#8C8C8C] dark:text-slate-400">{historyData.role} • Historical Disbursements</p>
              </div>
              <button onClick={() => setHistoryData(null)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Total Paid (YTD)</span>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                    ₹{historyData.totalPaidYtd?.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Total Pending</span>
                  <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">
                    ₹{historyData.totalPending?.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-500">
                    <tr>
                      <th className="py-2.5 px-3">Month</th>
                      <th className="py-2.5 px-3 text-right">Net Salary</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3">Payment Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {historyData.history?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">No salary history recorded</td>
                      </tr>
                    ) : (
                      historyData.history?.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{item.salaryMonth}</td>
                          <td className="py-2.5 px-3 text-right font-black">₹{item.netSalary?.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                            {item.paymentDate ? `${item.paymentDate} (${item.paymentMode})` : 'Pending'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setHistoryData(null)}
                  className="px-5 py-2 bg-[#1C1C1C] hover:bg-black dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold transition"
                >
                  Close History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 7. CREATE / EDIT STAFF MEMBER MODAL                                   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-2xl shadow-xl border border-[#F0F2F5] dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-[#F0F2F5] dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#F8F9FA] dark:bg-slate-700 border border-[#E9ECEF] dark:border-slate-600 text-[#1C1C1C] dark:text-white rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1C1C1C] dark:text-white">
                    {editingEmployee ? 'Edit Staff Member' : 'Register New Staff Member'}
                  </h3>
                  <p className="text-xs text-[#8C8C8C] dark:text-slate-400">Driver, Sales Executive, or Plant Staff</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className={inputClass}
                    placeholder="Raj Kumar"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Username *</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className={inputClass}
                    placeholder="raj_driver"
                    required
                    disabled={!!editingEmployee}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Role Group *</label>
                  <select
                    value={roleGroup}
                    onChange={e => setRoleGroup(e.target.value)}
                    className={selectClass}
                    required
                  >
                    <option value="DRIVER">Driver (Fleet & Trips)</option>
                    <option value="SALES_EXECUTIVE">Sales Executive (Shop Visits & Orders)</option>
                    <option value="EMPLOYEE">General Employee (Plant / Store)</option>
                  </select>
                </div>
                {roleGroup === 'SALES_EXECUTIVE' && (
                  <div>
                    <label className={labelClass}>Password {editingEmployee ? '(Leave blank to keep)' : '*'}</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={inputClass}
                      placeholder="••••••••"
                      required={!editingEmployee}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className={inputClass}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className={labelClass}>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="raj@breadfactory.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className={labelClass}>Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className={inputClass}
                    placeholder="Sales, HR, etc."
                  />
                </div>
                <div>
                  <label className={labelClass}>Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    className={inputClass}
                    placeholder="Manager, Executive, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className={labelClass}>Joining Date</label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={e => setJoiningDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Basic Salary (₹)</label>
                  <input
                    type="number"
                    value={basicSalary}
                    onChange={e => setBasicSalary(e.target.value)}
                    className={inputClass}
                    placeholder="25000"
                  />
                </div>
              </div>

              {/* Driver Specific Fields */}
              {roleGroup === 'DRIVER' && (
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase flex items-center gap-1.5">
                    <Truck className="w-4 h-4" /> Driver & License Information
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Assigned Vehicle</label>
                      <input
                        type="text"
                        value={assignedVehicle}
                        onChange={e => setAssignedVehicle(e.target.value)}
                        className={inputClass}
                        placeholder="TN-XX-1234"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Primary Route</label>
                      <input
                        type="text"
                        value={primaryRoute}
                        onChange={e => setPrimaryRoute(e.target.value)}
                        className={inputClass}
                        placeholder="Salem North"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Driving License No.</label>
                      <input
                        type="text"
                        value={dlNumber}
                        onChange={e => setDlNumber(e.target.value)}
                        className={inputClass}
                        placeholder="DL-0420110012345"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>DL Expiry Date</label>
                      <input
                        type="date"
                        value={dlExpiryDate}
                        onChange={e => setDlExpiryDate(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              )}

              {roleGroup === 'SALES_EXECUTIVE' && (
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Mobile App Access</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Allow logging into field sales app</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={mobileAccessEnabled}
                    onClick={() => setMobileAccessEnabled(!mobileAccessEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      mobileAccessEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        mobileAccessEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0F2F5] dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#8C8C8C] hover:text-[#1C1C1C] dark:text-slate-400 dark:hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95"
                >
                  {editingEmployee ? 'Update Staff Member' : 'Register Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
