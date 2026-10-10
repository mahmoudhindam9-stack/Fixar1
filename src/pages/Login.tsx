import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Wrench, UserCheck, ShieldCheck, ArrowLeft, Eye, EyeOff, RefreshCw, User, Wrench as TechIcon } from 'lucide-react';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  
  const { login, users, customRoles, addUser, clearAllUsers } = useStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = login(username, password);
    if (!result.success) {
      setError(result.message || 'اسم المستخدم أو كلمة المرور غير صحيحة');
    } else {
      if (rememberMe) {
        localStorage.setItem('remember_me', 'true');
      } else {
        localStorage.removeItem('remember_me');
        sessionStorage.setItem('tempSession', 'true');
      }
    }
  };

  const quickLogin = (uName: string, uPass: string) => {
    setUsername(uName);
    setPassword(uPass);
    setError('');
    const result = login(uName, uPass);
    if (!result.success) {
      setError(result.message || 'تعذر تسجيل الدخول بالرمز المحدد');
    }
  };

  const getRoleBadge = (roleId: string) => {
    const custom = customRoles.find(r => r.id === roleId);
    if (custom) return custom.name;
    const rolesInArabic: Record<string, string> = {
      SUPER_ADMIN: 'مدير نظام',
      RECEPTION: 'مكتب استقبال',
      TECHNICIAN: 'فني صيانة',
      HR_MANAGER: 'مدير موارد بشرية',
      INVENTORY_MANAGER: 'أمين مخزن',
      FINANCE_MANAGER: 'مدير مالي'
    };
    return rolesInArabic[roleId] || roleId;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 dir-rtl text-right font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center justify-center select-none pt-4">
          <h2 className="text-center text-7xl font-black tracking-tighter flex items-center drop-shadow-md bg-white px-8 py-4 rounded-3xl border border-slate-100 shadow-2xl" dir="ltr">
            <span className="text-[#4285F4]">F</span>
            <div className="relative flex items-center justify-center w-12 h-16 mx-1">
              <Wrench className="w-14 h-14 text-[#EA4335] absolute transform -rotate-45 hover:scale-110 hover:rotate-12 transition-all duration-300 drop-shadow-sm" strokeWidth={3} />
            </div>
            <span className="text-[#FBBC05]">x</span>
            <span className="text-[#34A853]">a</span>
            <span className="text-[#4285F4]">r</span>
          </h2>
          <p className="mt-5 text-center text-xs uppercase tracking-widest text-slate-500 font-bold bg-white/50 px-4 py-1.5 rounded-full border border-slate-200" dir="ltr">
            developed by lion creativity M.H
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                اسم المستخدم
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم..."
                  className="appearance-none block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm dir-ltr text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                كلمة المرور
              </label>
              <div className="mt-1 relative">
                <input
                  type={showPasswords ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور..."
                  className="appearance-none block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm dir-ltr text-right pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="mr-2 block text-sm text-slate-700 cursor-pointer">
                  تذكرني
                </label>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 font-medium">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all"
              >
                تسجيل الدخول 🚀
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}

