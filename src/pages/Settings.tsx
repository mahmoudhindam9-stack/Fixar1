import React, { useState } from 'react';
import { Users } from './Users';
import { Settings as SettingsIcon, Palette, Download, Upload, Cloud, HardDrive, Shield } from 'lucide-react';
import { useStore } from '../store';

export function Settings() {
  const [activeTab, setActiveTab] = useState<'users' | 'themes' | 'backup'>('users');
  const { currentUser } = useStore();

  return (
    <div className="space-y-6 text-right font-sans dir-rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <SettingsIcon className="w-7 h-7 text-emerald-600" />
            الضبط والإعدادات
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            إدارة المستخدمين، المظهر، والنسخ الاحتياطي للبيانات
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'users' 
              ? 'bg-emerald-600 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          المستخدمين والصلاحيات
        </button>
        <button
          onClick={() => setActiveTab('themes')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'themes' 
              ? 'bg-emerald-600 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Palette className="w-4 h-4" />
          المظهر والأنماط
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'backup' 
              ? 'bg-emerald-600 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          النسخ الاحتياطي
        </button>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'users' && <Users />}
        {activeTab === 'themes' && <ThemesSettings />}
        {activeTab === 'backup' && <BackupSettings isAdmin={currentUser?.role === 'SUPER_ADMIN'} />}
      </div>
    </div>
  );
}

function ThemesSettings() {
  const themes = [
    { id: 'emerald', name: 'الزمرد (الافتراضي)', color: 'bg-emerald-500' },
    { id: 'blue', name: 'الأزرق المحيطي', color: 'bg-blue-500' },
    { id: 'indigo', name: 'النيلي الداكن', color: 'bg-indigo-500' },
    { id: 'rose', name: 'الوردي الهادئ', color: 'bg-rose-500' },
    { id: 'amber', name: 'الكهرماني', color: 'bg-amber-500' },
    { id: 'purple', name: 'البنفسجي الملكي', color: 'bg-purple-500' },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">تخصيص المظهر</h3>
        <p className="text-sm text-slate-500 mb-6">اختر النمط اللوني المفضل للتطبيق (سيتم تطبيقه محلياً على جهازك).</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {themes.map(theme => (
          <button
            key={theme.id}
            onClick={() => alert('سيتم تطبيق هذا النمط قريباً!')}
            className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-slate-50 transition-all group"
          >
            <div className={`w-12 h-12 rounded-full ${theme.color} shadow-lg group-hover:scale-110 transition-transform`} />
            <span className="text-xs font-bold text-slate-700">{theme.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function BackupSettings({ isAdmin }: { isAdmin: boolean }) {
  const handleLocalBackup = () => {
    const data = localStorage.getItem('maintenance-storage');
    if (!data) {
      alert('لا توجد بيانات للنسخ الاحتياطي!');
      return;
    }
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fixar-Backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLocalRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          // Validate it's proper JSON
          JSON.parse(content);
          localStorage.setItem('maintenance-storage', content);
          alert('تم استعادة البيانات بنجاح! سيتم إعادة تحميل التطبيق.');
          window.location.reload();
        } catch (err) {
          alert('الملف غير صالح أو تالف.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Local Backup */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">نسخة احتياطية محلية</h3>
              <p className="text-xs text-slate-500">حفظ واستعادة البيانات من وإلى جهازك الشخصي</p>
            </div>
          </div>
          
          <div className="flex-1 text-sm text-slate-600 mb-6">
            قم بتنزيل نسخة كاملة من جميع البيانات (المهام، المستخدمين، الأصول) في ملف مضغوط، ويمكنك استعادتها لاحقاً في أي وقت.
          </div>

          <div className="grid grid-cols-2 gap-3 mt-auto">
            <button 
              onClick={handleLocalBackup}
              className="flex justify-center items-center gap-2 py-3 px-4 bg-emerald-50 text-emerald-700 font-bold rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              تنزيل نسخة
            </button>
            <button 
              onClick={handleLocalRestore}
              className="flex justify-center items-center gap-2 py-3 px-4 bg-white text-slate-700 font-bold rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              استعادة بيانات
            </button>
          </div>
        </div>

        {/* Cloud Backup */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">النسخ السحابي (Google Drive)</h3>
              <p className="text-xs text-slate-500">ربط مع حساب جوجل لنسخ احتياطي آمن</p>
            </div>
          </div>
          
          <div className="flex-1 text-sm text-slate-600 mb-6">
            قم بربط حساب جوجل الخاص بك لحفظ نسخة احتياطية مشفرة في Google Drive واستعادتها بسلاسة عبر السحابة. (للمدير العام فقط)
          </div>

          <div className="grid grid-cols-2 gap-3 mt-auto">
            <button 
              onClick={() => isAdmin ? alert('يتطلب إعداد Google Workspace OAuth أولاً!') : alert('هذه الخاصية متاحة للمدير العام فقط')}
              disabled={!isAdmin}
              className={`flex justify-center items-center gap-2 py-3 px-4 font-bold rounded-xl border transition-colors ${isAdmin ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'}`}
            >
              <Download className="w-4 h-4" />
              نسخ للسحابة
            </button>
            <button 
              onClick={() => isAdmin ? alert('يتطلب إعداد Google Workspace OAuth أولاً!') : alert('هذه الخاصية متاحة للمدير العام فقط')}
              disabled={!isAdmin}
              className={`flex justify-center items-center gap-2 py-3 px-4 font-bold rounded-xl border transition-colors ${isAdmin ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50' : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'}`}
            >
              <Upload className="w-4 h-4" />
              استعادة من السحابة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
