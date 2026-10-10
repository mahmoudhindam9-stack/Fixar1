import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { 
  Wrench, CheckCircle2, Clock, AlertTriangle, Printer, Palette, Activity, 
  Flame, Filter, Search, ShieldAlert, CheckCircle, Zap, ShieldCheck, Building2,
  Star, Banknote
} from 'lucide-react';
import { formatDate, getSubFacilityName, formatCode } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { OrderRatingStars, OrderCostBadge } from './WorkOrders';

type ThemeKey = 'default' | 'matrix' | 'ocean' | 'sunset';

const themes: { id: ThemeKey; name: string }[] = [
  { id: 'default', name: 'الافتراضي (عصري)' },
  { id: 'matrix', name: 'ماتريكس 💻' },
  { id: 'ocean', name: 'أعماق المحيط 🌊' },
  { id: 'sunset', name: 'الغروب الدافئ 🌅' }
];

const themeStyles = {
  default: {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    card: 'bg-white border-slate-200 border shadow-sm',
    cardText: 'text-slate-900',
    cardLabel: 'text-slate-500',
    tableWrap: 'bg-white border border-slate-200 shadow-sm',
    tableHeader: 'bg-slate-50/80 text-slate-500 border-b border-slate-200 backdrop-blur-sm',
    tableRow: 'bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors',
    tableText: 'text-slate-900',
    tableSubText: 'text-slate-500',
    btn: 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm',
    iconPending: 'bg-amber-100 text-amber-600',
    iconInProgress: 'bg-blue-100 text-blue-600',
    iconCompleted: 'bg-emerald-100 text-emerald-600',
    iconOverdue: 'bg-red-100 text-red-600',
    pillPending: 'bg-amber-100 text-amber-800 border border-amber-200',
    pillInProgress: 'bg-blue-100 text-blue-800 border border-blue-200',
    pillCompleted: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    pillOverdue: 'bg-red-100 text-red-800 border border-red-200',
    indicator: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]'
  },
  matrix: {
    bg: 'bg-black font-mono',
    text: 'text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)] relative z-10',
    card: 'bg-black/80 border border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.15)] relative z-10 backdrop-blur-md',
    cardText: 'text-green-400 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]',
    cardLabel: 'text-green-600',
    tableWrap: 'bg-black/80 border border-green-500/40 relative z-10 backdrop-blur-md',
    tableHeader: 'bg-green-950/40 text-green-500 border-b border-green-500/40',
    tableRow: 'bg-transparent border-b border-green-900/50 hover:bg-green-900/20 transition-all duration-300',
    tableText: 'text-green-400',
    tableSubText: 'text-green-700',
    btn: 'bg-black hover:bg-green-950 text-green-400 border border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)] hover:shadow-[0_0_20px_rgba(34,197,94,0.6)] transition-all',
    iconPending: 'bg-black border border-amber-500/50 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]',
    iconInProgress: 'bg-black border border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]',
    iconCompleted: 'bg-black border border-green-500/50 text-green-400',
    iconOverdue: 'bg-black border border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)]',
    pillPending: 'bg-black border border-amber-500 text-amber-400',
    pillInProgress: 'bg-black border border-cyan-400 text-cyan-400',
    pillCompleted: 'bg-black border border-green-500 text-green-400',
    pillOverdue: 'bg-black border border-red-500 text-red-400',
    indicator: 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,1)]'
  },
  ocean: {
    bg: 'bg-slate-900 relative overflow-hidden',
    text: 'text-cyan-50 font-medium relative z-10',
    card: 'bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative z-10 hover:bg-white/10 transition-colors duration-500',
    cardText: 'text-white',
    cardLabel: 'text-cyan-200',
    tableWrap: 'bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative z-10',
    tableHeader: 'bg-white/5 text-cyan-200 border-b border-white/10',
    tableRow: 'bg-transparent border-b border-white/5 hover:bg-white/10 transition-colors duration-300',
    tableText: 'text-white',
    tableSubText: 'text-cyan-300/70',
    btn: 'bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-50 shadow-[0_4px_14px_0_rgba(8,145,178,0.2)] border border-cyan-400/30 backdrop-blur-md transition-all',
    iconPending: 'bg-cyan-950/50 text-amber-300 border border-amber-500/30',
    iconInProgress: 'bg-blue-500/20 text-blue-300 border border-blue-400/30',
    iconCompleted: 'bg-teal-500/20 text-teal-300 border border-teal-400/30',
    iconOverdue: 'bg-red-500/20 text-red-300 border border-red-400/40',
    pillPending: 'bg-amber-950/50 text-amber-200 border border-amber-700/50',
    pillInProgress: 'bg-blue-500/30 text-blue-100 border border-blue-400/50',
    pillCompleted: 'bg-teal-500/30 text-teal-100 border border-teal-400/50',
    pillOverdue: 'bg-red-950/60 text-red-200 border border-red-500/60',
    indicator: 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]'
  },
  sunset: {
    bg: 'bg-orange-50 relative overflow-hidden',
    text: 'text-rose-950 relative z-10',
    card: 'bg-white/70 border border-orange-200/50 backdrop-blur-md shadow-[0_8px_30px_rgb(251,146,60,0.08)] relative z-10 hover:shadow-[0_8px_30px_rgb(251,146,60,0.15)] transition-shadow duration-500',
    cardText: 'text-rose-900',
    cardLabel: 'text-orange-700',
    tableWrap: 'bg-white/70 border border-orange-200/50 backdrop-blur-md shadow-[0_8px_30px_rgb(251,146,60,0.08)] relative z-10',
    tableHeader: 'bg-orange-100/50 text-orange-800 border-b border-orange-200/50',
    tableRow: 'bg-transparent border-b border-orange-100/50 hover:bg-white/90 transition-colors duration-300',
    tableText: 'text-rose-900',
    tableSubText: 'text-orange-600/80',
    btn: 'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] border-0',
    iconPending: 'bg-amber-100 text-amber-600',
    iconInProgress: 'bg-rose-100 text-rose-600',
    iconCompleted: 'bg-orange-100 text-orange-600',
    iconOverdue: 'bg-red-100 text-red-600',
    pillPending: 'bg-amber-100 text-amber-700 border border-amber-200',
    pillInProgress: 'bg-rose-100 text-rose-700 border border-rose-200',
    pillCompleted: 'bg-orange-100 text-orange-700 border border-orange-200',
    pillOverdue: 'bg-red-100 text-red-700 border border-red-200',
    indicator: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]'
  }
};

const AnimatedNumber = ({ value, className }: { value: number, className?: string }) => {
  return (
    <div className="overflow-hidden h-9 relative inline-block">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={value}
          initial={{ y: 20, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={className}
        >
          {value}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// --- Live Light Notification Beacon Component ---
function LiveLightBeacon({ 
  status, 
  priority, 
  isOverdue 
}: { 
  status: string; 
  priority?: string; 
  isOverdue: boolean; 
}) {
  if (status === 'COMPLETED' || status === 'CLOSED') {
    return (
      <div className="relative flex items-center justify-center w-3.5 h-3.5">
        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
      </div>
    );
  }

  if (isOverdue || priority === 'CRITICAL') {
    return (
      <div className="relative flex items-center justify-center w-4 h-4">
        <span className="absolute inline-flex w-full h-full bg-red-500 rounded-full opacity-75 animate-ping" />
        <span className="relative inline-flex w-2.5 h-2.5 bg-red-600 rounded-full shadow-[0_0_12px_rgba(239,68,68,1)]" />
      </div>
    );
  }

  if (priority === 'HIGH' || status === 'PENDING') {
    return (
      <div className="relative flex items-center justify-center w-4 h-4">
        <span className="absolute inline-flex w-full h-full bg-amber-400 rounded-full opacity-60 animate-pulse" />
        <span className="relative inline-flex w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.9)]" />
      </div>
    );
  }

  // IN_PROGRESS
  return (
    <div className="relative flex items-center justify-center w-4 h-4">
      <span className="absolute inline-flex w-full h-full bg-cyan-400 rounded-full opacity-50 animate-pulse" />
      <span className="relative inline-flex w-2.5 h-2.5 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.9)]" />
    </div>
  );
}

// --- Live Order Countdown Timer Component ---
function LiveOrderCountdown({ 
  deadline, 
  status, 
  priority 
}: { 
  deadline: string; 
  status: string; 
  priority?: string;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (status === 'COMPLETED' || status === 'CLOSED') return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  if (status === 'COMPLETED' || status === 'CLOSED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" /> تم الإنجاز
      </span>
    );
  }

  if (!deadline) {
    return <span className="text-slate-400 text-xs">غير محدد</span>;
  }

  // Parse deadline string
  let targetTime = new Date(deadline).getTime();
  // If date string didn't include time, default to end of day
  if (deadline.length <= 10 && !isNaN(targetTime)) {
    targetTime += (23 * 3600 + 59 * 60 + 59) * 1000;
  }

  if (isNaN(targetTime)) {
    return <span className="text-slate-400 text-xs">تاريخ غير صالحة</span>;
  }

  const diffMs = targetTime - now;

  if (diffMs <= 0) {
    const overdueSeconds = Math.floor(Math.abs(diffMs) / 1000);
    const hrs = Math.floor(overdueSeconds / 3600);
    const mins = Math.floor((overdueSeconds % 3600) / 60);
    const secs = overdueSeconds % 60;

    const pad = (n: number) => String(n).padStart(2, '0');
    const display = hrs > 24 
      ? `متأخر بـ ${Math.floor(hrs / 24)} يوم`
      : `متأخر بـ ${pad(hrs)}:${pad(mins)}:${pad(secs)}`;

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse shadow-sm">
        <Flame className="w-3.5 h-3.5 text-red-600 animate-bounce" />
        {display}
      </span>
    );
  }

  const totalSecs = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSecs / (3600 * 24));
  const hrs = Math.floor((totalSecs % (3600 * 24)) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
  if (totalSecs < 7200 || priority === 'CRITICAL') { // < 2 hours or critical
    badgeColor = "bg-amber-100 text-amber-800 border-amber-300 font-bold";
  } else if (status === 'IN_PROGRESS') {
    badgeColor = "bg-blue-50 text-blue-700 border-blue-200 font-medium";
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold border ${badgeColor}`}>
      <Clock className="w-3.5 h-3.5 text-slate-500" />
      {days > 0 ? `${days}d ${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(hrs)}:${pad(mins)}:${pad(secs)}`}
    </span>
  );
}

export function Dashboard() {
  const { workOrders, users, preventiveTasks, facilities } = useStore();
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('default');
  
  // Real-time pulse effect state
  const [pulse, setPulse] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'OVERDUE' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => !p);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Compute live metrics dynamically synchronized with store state
  const now = Date.now();
  const isOrderOverdue = (order: any) => {
    if (order.status === 'COMPLETED' || order.status === 'CLOSED' || order.status === 'CANCELLED') return false;
    if (!order.deadline) return false;
    let targetTime = new Date(order.deadline).getTime();
    if (order.deadline.length <= 10 && !isNaN(targetTime)) {
      targetTime += (23 * 3600 + 59 * 60 + 59) * 1000;
    }
    return !isNaN(targetTime) && targetTime < now;
  };

  const pending = workOrders.filter(w => w.status === 'PENDING').length;
  const inProgress = workOrders.filter(w => w.status === 'IN_PROGRESS').length;
  const completed = workOrders.filter(w => w.status === 'COMPLETED' || w.status === 'CLOSED').length;
  const overdueCount = workOrders.filter(w => isOrderOverdue(w)).length;
  const criticalCount = workOrders.filter(w => w.priority === 'CRITICAL' && w.status !== 'COMPLETED' && w.status !== 'CLOSED').length;

  const totalPreventiveOverdue = preventiveTasks.filter(t => t.status === 'OVERDUE').length;

  // Rating & Cost Aggregations - Only count orders that are CLOSED
  const ratedOrders = workOrders.filter(w => w.status === 'CLOSED' && ((w.customerRating && w.customerRating > 0) || (w.supervisorRating && w.supervisorRating > 0)));
  const totalRatingSum = ratedOrders.reduce((sum, w) => {
    const ratings = [];
    if (w.customerRating) ratings.push(w.customerRating);
    if (w.supervisorRating) ratings.push(w.supervisorRating);
    return sum + (ratings.reduce((a, b) => a + b, 0) / ratings.length);
  }, 0);
  const avgOverallRating = ratedOrders.length > 0 ? (totalRatingSum / ratedOrders.length).toFixed(1) : '5.0';

  const totalMaintenanceCost = workOrders.reduce((sum, w) => sum + (w.laborCost || 0) + (w.partsCost || 0), 0);

  // Filtered orders list
  const filteredOrders = workOrders.filter(order => {
    const matchesSearch = searchQuery === '' || 
      order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.orderNumber && order.orderNumber.toString().includes(searchQuery)) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'OVERDUE') return isOrderOverdue(order) || order.priority === 'CRITICAL';
    if (selectedFilter === 'PENDING') return order.status === 'PENDING';
    if (selectedFilter === 'IN_PROGRESS') return order.status === 'IN_PROGRESS';
    if (selectedFilter === 'COMPLETED') return order.status === 'COMPLETED' || order.status === 'CLOSED';
    return true;
  });

  const printDashboard = () => {
    const printWindow = window.open('', '', 'width=850,height=700');
    if (printWindow) {
      let rows = filteredOrders.slice().reverse().map(order => {
        const assignedToArray = Array.isArray(order.assignedTo) ? order.assignedTo : (order.assignedTo ? [order.assignedTo] : []);
        const techNames = assignedToArray.map((id: string) => users.find(u => u.id === id)?.name).filter(Boolean).join('، ') || 'غير معين';
        const statusStr = order.status === 'PENDING' ? 'قيد الانتظار' : order.status === 'IN_PROGRESS' ? 'جاري العمل' : 'مكتمل';
        const locationStr = facilities.find(f => f.id === order.facilityId)?.name || 'غير محدد';
        
        const ratings = [];
        if (order.status === 'CLOSED') {
          if (order.customerRating) ratings.push(order.customerRating);
          if (order.supervisorRating) ratings.push(order.supervisorRating);
        }
        const avgR = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '-';
        const costVal = (order.laborCost || 0) + (order.partsCost || 0);

        return `
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${formatCode('WO', order.orderNumber)} - ${order.title}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${statusStr}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${locationStr}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #b45309;">${avgR !== '-' ? `${avgR} ⭐` : 'غير مقيم'}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #047857;">${costVal > 0 ? `${costVal} ج.م` : 'غير محددة'}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${techNames}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${formatDate(order.deadline)}</td>
          </tr>
        `;
      }).join('');

      printWindow.document.write(`
        <html dir="rtl" lang="ar">
          <head>
            <title>تقرير الشاشة الرئيسية المباشر</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #1e293b; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
              th { background: #f8fafc; padding: 10px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; }
              .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; }
              .stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 25px; }
              .stat-box { border: 1px solid #cbd5e1; padding: 10px; border-radius: 10px; text-align: center; background: #fafafa; }
              .stat-val { font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 5px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2 style="margin:0;">تقرير نظام إدارة الصيانة - التتبع المباشر</h2>
              <p style="margin:5px 0 0; color: #64748b;">تاريخ التقرير: ${new Date().toLocaleString('ar-EG')}</p>
            </div>
            
            <div class="stats">
              <div class="stat-box">
                <div style="font-size: 11px; color: #64748b;">قيد الانتظار</div>
                <div class="stat-val" style="color: #d97706;">${pending}</div>
              </div>
              <div class="stat-box">
                <div style="font-size: 11px; color: #64748b;">جاري العمل</div>
                <div class="stat-val" style="color: #2563eb;">${inProgress}</div>
              </div>
              <div class="stat-box">
                <div style="font-size: 11px; color: #64748b;">تم الإنجاز</div>
                <div class="stat-val" style="color: #16a34a;">${completed}</div>
              </div>
              <div class="stat-box">
                <div style="font-size: 11px; color: #64748b;">متأخرة / طارئة</div>
                <div class="stat-val" style="color: #dc2626;">${overdueCount}</div>
              </div>
              <div class="stat-box">
                <div style="font-size: 11px; color: #64748b;">متوسط التقييم</div>
                <div class="stat-val" style="color: #b45309;">${avgOverallRating} ⭐</div>
              </div>
              <div class="stat-box">
                <div style="font-size: 11px; color: #64748b;">إجمالي التكلفة</div>
                <div class="stat-val" style="color: #047857;">${totalMaintenanceCost} ج.م</div>
              </div>
            </div>

            <h3>جدول الطلبات الحالية (${filteredOrders.length})</h3>
            <table>
              <thead>
                <tr>
                  <th>الطلب / العنوان</th>
                  <th>الحالة</th>
                  <th>المرفق / الموقع</th>
                  <th>متوسط التقييم</th>
                  <th>تكلفة الطلب</th>
                  <th>الفني المكلف</th>
                  <th>الموعد النهائي</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const s = themeStyles[currentTheme];

  // Background Elements based on theme
  const renderBackgroundElements = () => {
    if (currentTheme === 'matrix') {
      return (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-30 mix-blend-screen overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wLDBMODwySDhWMkwwLDBaIiBmaWxsPSIjMDUwIiBmaWxsLW9wYWNpdHk9IjAuMSI+PC9wYXRoPjwvc3ZnPg==')] opacity-40"></div>
          <motion.div 
            animate={{ y: ['-100%', '1000%'] }} 
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className="w-full h-10 bg-gradient-to-b from-transparent via-green-500/20 to-transparent absolute top-0 left-0"
          />
        </div>
      );
    }
    if (currentTheme === 'ocean') {
      return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, -50, 0]
            }} 
            transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
            className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-600/30 rounded-full blur-[100px]"
          />
        </div>
      );
    }
    if (currentTheme === 'sunset') {
      return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3]
            }} 
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
            className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-400/20 to-rose-400/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4"
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`transition-colors duration-700 ${s.bg} -m-3 sm:-m-8 p-3 sm:p-8 min-h-[calc(100vh-4rem)] relative`}>
      {renderBackgroundElements()}
      
      <div className="space-y-6 relative z-10">
        
        {/* Top Critical Alert Banner if overdue or critical orders exist */}
        {(overdueCount > 0 || criticalCount > 0 || totalPreventiveOverdue > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white p-4 rounded-xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 border border-red-400/30"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg animate-pulse">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                  تنبيه عمليات حي: يوجد طلبات تتطلب انتباهاً فورياً!
                </h4>
                <p className="text-xs text-red-100 mt-0.5">
                  {overdueCount > 0 && `${overdueCount} طلب صيانة متأخر `}
                  {criticalCount > 0 && `| ${criticalCount} طلب بحالة حرجة طارئة `}
                  {totalPreventiveOverdue > 0 && `| ${totalPreventiveOverdue} صيانة وقائية متأخرة`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedFilter('OVERDUE')}
              className="px-4 py-2 bg-white text-red-700 font-bold text-xs rounded-lg shadow hover:bg-red-50 transition-colors whitespace-nowrap"
            >
              عرض الطلبات الحرجة والمتأخرة ⚡
            </button>
          </motion.div>
        )}

        {/* Top Bar Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <h2 className={`text-2xl font-bold ${s.text}`}>الشاشة الرئيسية للتتبع الحي</h2>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              currentTheme === 'matrix' ? 'bg-green-900/30 text-green-400 border-green-500/30' :
              currentTheme === 'ocean' ? 'bg-cyan-900/40 text-cyan-200 border-cyan-500/30' :
              currentTheme === 'sunset' ? 'bg-orange-100 text-orange-700 border-orange-200' :
              'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <motion.div 
                animate={{ scale: pulse ? 1.3 : 1, opacity: pulse ? 1 : 0.6 }}
                transition={{ duration: 1 }}
                className={`w-2.5 h-2.5 rounded-full ${s.indicator}`}
              />
              تزامن حي متجدد
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="relative group">
              <div className={`flex items-center px-3 py-2 rounded-lg cursor-pointer ${s.card}`}>
                <Palette className={`w-5 h-5 ml-2 ${s.cardLabel}`} />
                <select 
                  value={currentTheme}
                  onChange={(e) => setCurrentTheme(e.target.value as ThemeKey)}
                  className={`bg-transparent outline-none appearance-none cursor-pointer pr-1 pl-6 ${s.cardText} font-medium`}
                >
                  {themes.map(t => (
                    <option key={t.id} value={t.id} className="bg-white text-slate-800">
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={printDashboard}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors flex-1 sm:flex-none justify-center font-medium ${s.btn}`}
            >
              <Printer className="w-5 h-5 ml-2" />
              طباعة التقرير
            </motion.button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Pending */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => setSelectedFilter('PENDING')}
            className={`cursor-pointer overflow-hidden rounded-xl p-5 ${s.card} hover:ring-2 hover:ring-amber-400 transition-all`}
          >
            <div className="flex items-center justify-between">
              <div>
                <dt className={`text-xs font-semibold uppercase tracking-wider mb-1 ${s.cardLabel}`}>قيد الانتظار</dt>
                <dd className={`text-3xl font-black ${s.cardText}`}>
                  <AnimatedNumber value={pending} />
                </dd>
              </div>
              <div className={`p-3.5 rounded-xl ${s.iconPending}`}>
                <Clock className="h-7 w-7" />
              </div>
            </div>
          </motion.div>

          {/* In Progress */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setSelectedFilter('IN_PROGRESS')}
            className={`cursor-pointer overflow-hidden rounded-xl p-5 ${s.card} hover:ring-2 hover:ring-blue-400 transition-all`}
          >
            <div className="flex items-center justify-between">
              <div>
                <dt className={`text-xs font-semibold uppercase tracking-wider mb-1 ${s.cardLabel}`}>جاري العمل</dt>
                <dd className={`text-3xl font-black ${s.cardText}`}>
                  <AnimatedNumber value={inProgress} />
                </dd>
              </div>
              <div className={`p-3.5 rounded-xl ${s.iconInProgress}`}>
                <Wrench className="h-7 w-7" />
              </div>
            </div>
          </motion.div>

          {/* Overdue / Urgent */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => setSelectedFilter('OVERDUE')}
            className={`cursor-pointer overflow-hidden rounded-xl p-5 ${s.card} hover:ring-2 hover:ring-red-400 transition-all relative ${overdueCount > 0 ? 'bg-red-50/30' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <dt className={`text-xs font-bold uppercase tracking-wider mb-1 ${overdueCount > 0 ? 'text-red-600' : s.cardLabel}`}>
                  متأخرة / طارئة ⚡
                </dt>
                <dd className={`text-3xl font-black ${overdueCount > 0 ? 'text-red-600' : s.cardText}`}>
                  <AnimatedNumber value={overdueCount} />
                </dd>
              </div>
              <div className={`p-3.5 rounded-xl ${s.iconOverdue}`}>
                <AlertTriangle className="h-7 w-7 animate-pulse" />
              </div>
            </div>
          </motion.div>

          {/* Completed */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => setSelectedFilter('COMPLETED')}
            className={`cursor-pointer overflow-hidden rounded-xl p-5 ${s.card} hover:ring-2 hover:ring-emerald-400 transition-all`}
          >
            <div className="flex items-center justify-between">
              <div>
                <dt className={`text-xs font-semibold uppercase tracking-wider mb-1 ${s.cardLabel}`}>تم الإنجاز</dt>
                <dd className={`text-3xl font-black ${s.cardText}`}>
                  <AnimatedNumber value={completed} />
                </dd>
              </div>
              <div className={`p-3.5 rounded-xl ${s.iconCompleted}`}>
                <CheckCircle className="h-7 w-7" />
              </div>
            </div>
          </motion.div>

        </div>

        {/* Additional Real-Time Context Strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className={`p-3.5 rounded-xl flex items-center justify-between ${s.card}`}>
            <span className="text-xs font-medium text-slate-500">إجمالي طلبات الصيانة</span>
            <span className="text-sm font-bold">{workOrders.length}</span>
          </div>
          <div className={`p-3.5 rounded-xl flex items-center justify-between ${s.card}`}>
            <span className="text-xs font-medium text-slate-500">الصيانة الوقائية</span>
            <span className="text-sm font-bold text-blue-600">{preventiveTasks.length}</span>
          </div>
          <div className={`p-3.5 rounded-xl flex items-center justify-between ${s.card}`}>
            <span className="text-xs font-medium text-slate-500">عدد الفنيين</span>
            <span className="text-sm font-bold text-emerald-600">
              {users.filter(u => u.role === 'TECHNICIAN').length}
            </span>
          </div>
          <div className={`p-3.5 rounded-xl flex items-center justify-between ${s.card}`}>
            <span className="text-xs font-medium text-slate-500">المرافق والمنشآت</span>
            <span className="text-sm font-bold text-slate-700">{facilities.length}</span>
          </div>
          <div className={`p-3.5 rounded-xl flex items-center justify-between bg-amber-50/60 border border-amber-200/80`}>
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              متوسط التقييم العام
            </span>
            <span className="text-sm font-extrabold font-mono text-amber-700">{avgOverallRating} ★</span>
          </div>
          <div className={`p-3.5 rounded-xl flex items-center justify-between bg-emerald-50/60 border border-emerald-200/80`}>
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
              إجمالي تكلفة الصيانة
            </span>
            <span className="text-sm font-extrabold font-mono text-emerald-700">{totalMaintenanceCost} ج.م</span>
          </div>
        </div>

        {/* Live Tracking Table & Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-xl overflow-hidden ${s.tableWrap}`}
        >
          {/* Header & Controls */}
          <div className={`px-5 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b ${s.tableHeader}`}>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
              <h3 className="text-lg font-bold">
                جدول المتابعة المباشرة والعداد التنازلي للطلبات
              </h3>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setSelectedFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedFilter === 'ALL' 
                    ? 'bg-slate-800 text-white shadow' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل ({workOrders.length})
              </button>
              <button
                onClick={() => setSelectedFilter('OVERDUE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  selectedFilter === 'OVERDUE' 
                    ? 'bg-red-600 text-white shadow' 
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5" /> طارئة / متأخرة ({overdueCount})
              </button>
              <button
                onClick={() => setSelectedFilter('PENDING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedFilter === 'PENDING' 
                    ? 'bg-amber-600 text-white shadow' 
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                قيد الانتظار ({pending})
              </button>
              <button
                onClick={() => setSelectedFilter('IN_PROGRESS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedFilter === 'IN_PROGRESS' 
                    ? 'bg-blue-600 text-white shadow' 
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                جاري العمل ({inProgress})
              </button>
              <button
                onClick={() => setSelectedFilter('COMPLETED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedFilter === 'COMPLETED' 
                    ? 'bg-emerald-600 text-white shadow' 
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                مكتملة ({completed})
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="البحث برقم الطلب، العنوان، المرفق أو اسم الفني..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm outline-none text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600">
                إلغاء
              </button>
            )}
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {filteredOrders.length === 0 ? (
              <div className={`p-12 text-center ${s.tableSubText} flex flex-col items-center justify-center`}>
                <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 flex items-center justify-center opacity-50">
                  <Wrench className="w-8 h-8" />
                </div>
                <p className="text-lg font-medium">لا توجد طلبات صيانة مطابقة للفلتر المحدد.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-transparent">
                <thead className={s.tableHeader}>
                  <tr>
                    <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">التنبيه الحي</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">رقم وعنوان الطلب</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">الموقع / المرفق</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">الحالة</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">متوسط التقييم ⭐</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">تكلفة الطلب 💰</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">العداد التنازلي المباشر ⏱️</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">الفني المكلف</th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">تاريخ الطلب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-transparent">
                  <AnimatePresence>
                    {filteredOrders.slice().reverse().map((order, idx) => {
                      const assignedToArray = Array.isArray(order.assignedTo) ? order.assignedTo : (order.assignedTo ? [order.assignedTo] : []);
                      const techNames = assignedToArray.map((id: string) => users.find(u => u.id === id)?.name).filter(Boolean).join('، ') || 'غير معين';
                      
                      const facilityObj = facilities.find(f => f.id === order.facilityId);
                      const facilityName = facilityObj?.name || '';
                      const subFacilityName = getSubFacilityName(facilities, order.facilityId, order.subFacilityId);
                      const locationStr = facilityName ? `${facilityName}${subFacilityName ? ` > ${subFacilityName}` : ''}` : 'غير محدد';

                      const overdue = isOrderOverdue(order);
                      const isCritical = order.priority === 'CRITICAL';

                      return (
                        <motion.tr 
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.3) }}
                          key={order.id} 
                          className={`${s.tableRow} ${overdue ? 'bg-red-50/40 hover:bg-red-50/80' : ''}`}
                        >
                          {/* Live Light Indicator */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <LiveLightBeacon 
                                status={order.status} 
                                priority={order.priority} 
                                isOverdue={overdue} 
                              />
                              {isCritical && (
                                <span className="text-[10px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded animate-pulse">
                                  طوارئ
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Order Title */}
                          <td className={`px-5 py-4 whitespace-nowrap text-sm font-bold ${overdue ? 'text-red-700' : s.tableText}`}>
                            <div className="flex flex-col">
                              <span className="flex items-center gap-1.5">
                                {formatCode('WO', order.orderNumber)} - {order.title}
                              </span>
                              {order.needsParts && (
                                <span className="text-[11px] font-normal text-amber-600 mt-0.5">
                                  ⚙️ يحتاج قطع غيار ({order.requiredParts || 'محددة'})
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Facility */}
                          <td className={`px-5 py-4 whitespace-nowrap text-xs font-medium ${s.tableSubText}`}>
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1 rounded">
                              <Building2 className="w-3 h-3 text-slate-500" />
                              {locationStr}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="px-5 py-4 whitespace-nowrap text-xs font-bold">
                            <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-md ${
                              order.status === 'PENDING' ? s.pillPending : 
                              order.status === 'IN_PROGRESS' ? s.pillInProgress : 
                              s.pillCompleted
                            }`}>
                              {order.status === 'PENDING' ? '⏳ قيد الانتظار' : order.status === 'IN_PROGRESS' ? '⚙️ جاري العمل' : '✅ مكتمل'}
                            </span>
                          </td>

                          {/* Average Rating Stars */}
                          <td className="px-5 py-4 whitespace-nowrap text-xs">
                            <OrderRatingStars customerRating={order.customerRating} supervisorRating={order.supervisorRating} status={order.status} />
                          </td>

                          {/* Total Cost Badge */}
                          <td className="px-5 py-4 whitespace-nowrap text-xs">
                            <OrderCostBadge laborCost={order.laborCost} partsCost={order.partsCost} />
                          </td>

                          {/* Countdown Timer */}
                          <td className="px-5 py-4 whitespace-nowrap text-xs">
                            <LiveOrderCountdown 
                              deadline={order.deadline} 
                              status={order.status} 
                              priority={order.priority} 
                            />
                          </td>

                          {/* Tech */}
                          <td className={`px-5 py-4 whitespace-nowrap text-xs font-medium ${s.tableSubText}`}>
                            {techNames}
                          </td>

                          {/* Created date */}
                          <td className={`px-5 py-4 whitespace-nowrap text-xs ${s.tableSubText}`}>
                            {formatDate(order.createdAt)}
                          </td>

                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
