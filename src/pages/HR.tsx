import React, { useState } from 'react';
import { Users, Info, Printer, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useStore } from '../store';

export function HR() {
  const { users, attendanceRecords, checkIn, checkOut, toggleAvailability } = useStore();
  const [activeTab, setActiveTab] = useState<'status' | 'records'>('status');

  const today = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter(r => r.date === today);

  const printHR = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl" lang="ar">
          <head>
            <title>تقرير حضور وانصراف الموظفين</title>
            <style>
              body { font-family: sans-serif; padding: 40px; }
              h2 { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { padding: 10px; border: 1px solid #ccc; text-align: right; }
              th { background-color: #f8fafc; }
            </style>
          </head>
          <body>
            <h2>تقرير حضور وانصراف الموظفين - ${new Date().toLocaleDateString('ar-EG')}</h2>
            
            <h3>حالة الموظفين الحالية</h3>
            <table>
              <tr><th>الموظف</th><th>الدور</th><th>التخصص</th><th>الحالة</th></tr>
              ${users.map(u => `
                <tr>
                  <td>${u.name}</td>
                  <td>${u.role === 'TECHNICIAN' ? 'فني' : u.role === 'RECEPTION' ? 'استقبال' : 'إدارة'}</td>
                  <td>${u.specialty || '-'}</td>
                  <td>${u.isAvailable ? 'حاضر (متاح)' : 'غير متواجد'}</td>
                </tr>
              `).join('')}
            </table>

            <h3 style="margin-top: 40px;">سجل حركات اليوم</h3>
            <table>
              <tr><th>الموظف</th><th>وقت الحضور</th><th>وقت الانصراف</th></tr>
              ${todayRecords.map(r => {
                const u = users.find(u => u.id === r.userId);
                return `
                  <tr>
                    <td>${u?.name || 'غير معروف'}</td>
                    <td>${new Date(r.checkIn).toLocaleTimeString('ar-EG')}</td>
                    <td>${r.checkOut ? new Date(r.checkOut).toLocaleTimeString('ar-EG') : 'لم ينصرف'}</td>
                  </tr>
                `;
              }).join('')}
            </table>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">إدارة الموارد البشرية</h2>
        <button
          onClick={printHR}
          className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          <Printer className="w-5 h-5 ml-2" />
          طباعة تقرير الحضور
        </button>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start">
        <Info className="w-6 h-6 ml-3 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold">نظام الحضور والانصراف</h3>
          <p className="text-sm mt-1 text-emerald-700">تحديث حالة الموظف هنا ينعكس فوراً على قائمة الفنيين المتاحين عند إنشاء طلب صيانة جديد.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-6 py-4 text-sm font-medium ${activeTab === 'status' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            حالة الموظفين (متاح / غير متاح)
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`px-6 py-4 text-sm font-medium ${activeTab === 'records' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            سجل حركات اليوم
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'status' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">الموظف</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">الدور</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">التخصص</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">الحالة</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">تغيير الحالة (تسجيل حضور/انصراف)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{u.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {u.role === 'TECHNICIAN' ? 'فني' : u.role === 'RECEPTION' ? 'استقبال' : 'إدارة'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.specialty || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${u.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {u.isAvailable ? 'متاح' : 'غير متواجد'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        {!u.isAvailable ? (
                          <button
                            onClick={() => checkIn(u.id)}
                            className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-sm font-medium transition-colors"
                          >
                            <CheckCircle className="w-4 h-4 ml-1" /> تسجيل حضور
                          </button>
                        ) : (
                          <button
                            onClick={() => checkOut(u.id)}
                            className="inline-flex items-center px-3 py-1 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium transition-colors"
                          >
                            <XCircle className="w-4 h-4 ml-1" /> تسجيل انصراف
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'records' && (
            <div className="overflow-x-auto">
              {todayRecords.length === 0 ? (
                <div className="text-center text-slate-500 py-8 flex flex-col items-center">
                  <Clock className="w-12 h-12 text-slate-300 mb-3" />
                  لا توجد حركات حضور وانصراف مسجلة اليوم
                </div>
              ) : (
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">الموظف</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">وقت الحضور</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">وقت الانصراف</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">تاريخ الحركة</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {todayRecords.slice().reverse().map(r => {
                      const u = users.find(user => user.id === r.userId);
                      return (
                        <tr key={r.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{u?.name || 'غير معروف'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">
                            {new Date(r.checkIn).toLocaleTimeString('ar-EG')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {r.checkOut ? new Date(r.checkOut).toLocaleTimeString('ar-EG') : <span className="text-yellow-600">لم ينصرف</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {new Date(r.checkIn).toLocaleDateString('ar-EG')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
