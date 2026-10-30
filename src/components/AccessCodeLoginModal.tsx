import React, { useState } from 'react';
import { 
  KeyRound, 
  Store, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Eye, 
  EyeOff, 
  Sparkles,
  ShieldAlert,
  Users
} from 'lucide-react';
import { useBookkeeping } from '../context/BookkeepingContext';
import { Employee } from '../types';

interface AccessCodeLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AccessCodeLoginModal: React.FC<AccessCodeLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { 
    accessCode, 
    employees, 
    loginStaffWithAccessCode, 
    userProfile 
  } = useBookkeeping();

  const [inputCode, setInputCode] = useState(accessCode);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!inputCode.trim()) {
      setErrorMsg('Masukkan Kode Akses Toko / Usaha.');
      return;
    }

    if (!pin.trim()) {
      setErrorMsg('Masukkan PIN Karyawan.');
      return;
    }

    const result = loginStaffWithAccessCode(
      inputCode.trim(), 
      pin.trim(), 
      selectedEmpId || undefined
    );

    if (result.success) {
      setSuccessMsg(result.message);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 700);
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleQuickDemoLogin = (emp: Employee) => {
    setInputCode(accessCode);
    setSelectedEmpId(emp.id);
    setPin(emp.pin);
    setErrorMsg(null);

    const result = loginStaffWithAccessCode(accessCode, emp.pin, emp.id);
    if (result.success) {
      setSuccessMsg(`Login sukses sebagai ${emp.name}!`);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 700);
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center shadow-md shadow-blue-900/20">
              <KeyRound className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Login Karyawan / Staf
              </h3>
              <p className="text-xs text-slate-500">
                Akses shift kasir & staf dengan Kode Toko + PIN
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* Main Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          
          {/* Kode Akses Toko */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-blue-900" />
                Kode Akses Toko / Usaha *
              </label>
              {inputCode !== accessCode && (
                <button
                  type="button"
                  onClick={() => setInputCode(accessCode)}
                  className="text-[11px] font-bold text-blue-700 hover:underline"
                >
                  Gunakan Kode Toko ({accessCode})
                </button>
              )}
            </div>
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Contoh: UMKM-9824"
              className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold tracking-wider text-slate-800 uppercase focus:ring-2 focus:ring-blue-900 focus:outline-none"
              required
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Kode toko pemilik usaha: <strong className="text-slate-600 font-mono">{accessCode}</strong>
            </p>
          </div>

          {/* Pilih Karyawan */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Pilih Nama Karyawan (Opsional)
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => {
                setSelectedEmpId(e.target.value);
                setPin('');
              }}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-900 focus:outline-none"
            >
              <option value="">-- Deteksi Otomatis dari PIN --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* PIN Akses Karyawan */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              PIN Akses Karyawan (4-6 Digit) *
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Masukkan PIN angka"
                className="w-full p-2.5 pr-10 rounded-xl border border-slate-300 font-mono font-bold tracking-widest text-base text-slate-800 focus:ring-2 focus:ring-blue-900 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            Masuk Sebagai Karyawan
          </button>
        </form>

        {/* Quick Demo Staff Login */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Coba Akun Demo Karyawan (1-Klik Masuk):</span>
          </div>

          <div className="space-y-1.5">
            {employees.map((emp) => {
              const roleColor = 
                emp.role === 'cashier' ? 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100' :
                emp.role === 'manager' ? 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100' :
                'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100';

              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => handleQuickDemoLogin(emp)}
                  className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between text-xs cursor-pointer ${roleColor}`}
                >
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{emp.name}</span>
                      <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-white/70">
                        {emp.role}
                      </span>
                    </div>
                    <div className="text-[11px] opacity-75">
                      PIN: <span className="font-mono font-bold">{emp.pin}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold underline">
                    Masuk Shift &rarr;
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
