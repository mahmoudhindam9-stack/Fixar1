import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Wrench, 
  Package, 
  Users, 
  Wallet, 
  UserCircle,
  LogOut,
  Calendar,
  HardHat,
  Database,
  Menu,
  X,
  Maximize,
  Settings,
  Minimize,
  ChevronLeft,
  Bell,
  Sparkles,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Download
} from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  currentTab: string;
  setTab: (tab: string) => void;
}

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_TIMEOUT_MS = 13 * 60 * 1000; // 13 minutes (warning 2 mins before auto logout)

export function Layout({ children, currentTab, setTab }: LayoutProps) {
  const { currentUser, users, logout, checkIn, checkOut, workOrders, preventiveTasks, inventory } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Inactivity & Session Management
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(120);
  const lastActivityRef = useRef<number>(Date.now());


  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      if (showInactivityWarning) {
        setShowInactivityWarning(false);
      }
    };

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    activityEvents.forEach(evt => window.addEventListener(evt, handleActivity));

    const checkInterval = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current;
      if (idleTime >= INACTIVITY_TIMEOUT_MS) {
        setShowInactivityWarning(false);
        logout();
      } else if (idleTime >= WARNING_TIMEOUT_MS) {
        if (!showInactivityWarning) {
          setShowInactivityWarning(true);
        }
        const leftSecs = Math.max(0, Math.ceil((INACTIVITY_TIMEOUT_MS - idleTime) / 1000));
        setRemainingSeconds(leftSecs);
      } else {
        if (showInactivityWarning) {
          setShowInactivityWarning(false);
        }
      }
    }, 1000);

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, handleActivity));
      clearInterval(checkInterval);
    };
  }, [logout, showInactivityWarning]);

  const extendSession = () => {
    lastActivityRef.current = Date.now();
    setShowInactivityWarning(false);
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const pendingWorkOrdersCount = workOrders.filter(w => w.status === 'PENDING').length;
  const overduePreventiveCount = preventiveTasks.filter(t => t.status === 'OVERDUE').length;
  const lowStockCount = inventory.filter(i => i.quantity <= 5).length;

  const getRoleArabicLabel = (role?: string) => {
    if (!role) return '';
    const roles: Record<string, string> = {
      SUPER_ADMIN: 'مدير نظام',
      RECEPTION: 'مكتب استقبال',
      TECHNICIAN: 'فني صيانة',
      HR_MANAGER: 'مدير موارد بشرية',
      INVENTORY_MANAGER: 'أمين مخزن',
      FINANCE_MANAGER: 'مدير مالي'
    };
    return roles[role] || role;
  };

  const getMenu = () => {
    const base = [];
    if (!currentUser) return [];

    const roleUpper = currentUser.role?.toUpperCase() || '';
    const isTech = roleUpper === 'TECHNICIAN' || 
                   roleUpper.includes('TECH') || 
                   roleUpper.includes('فني') ||
                   !!currentUser.specialty;

    if (currentUser.role === 'SUPER_ADMIN') {
      base.push(
        { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
        { id: 'work_orders', label: 'طلبات الصيانة', icon: Wrench, badge: pendingWorkOrdersCount > 0 ? pendingWorkOrdersCount : null, badgeColor: 'bg-amber-500 text-white' },
        { id: 'preventive_maintenance', label: 'الصيانة الدورية', icon: Calendar, badge: overduePreventiveCount > 0 ? overduePreventiveCount : null, badgeColor: 'bg-red-500 text-white' },
        { id: 'technician_dashboard', label: 'لوحة الفنيين', icon: HardHat },
        { id: 'inventory', label: 'المخزن والعهد', icon: Package, badge: lowStockCount > 0 ? lowStockCount : null, badgeColor: 'bg-orange-500 text-white' },
        { id: 'hr', label: 'الموارد البشرية', icon: Users },
        { id: 'finance', label: 'النظام المالي', icon: Wallet },
        { id: 'settings', label: 'الضبط', icon: Settings }
      );
    } else if (isTech) {
      base.push({ id: 'technician_dashboard', label: 'لوحة الفنيين (طلباتي)', icon: Wrench });
    } else if (currentUser.role === 'RECEPTION') {
      base.push(
        { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
        { id: 'work_orders', label: 'طلبات الصيانة', icon: Wrench, badge: pendingWorkOrdersCount > 0 ? pendingWorkOrdersCount : null, badgeColor: 'bg-amber-500 text-white' }
      );
    } else {
      base.push({ id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard });
    }
    return base;
  };

  const menu = getMenu();

  const handleTabClick = (id: string) => {
    setTab(id);
    setIsMobileMenuOpen(false);
  };

  const currentTabLabel = menu.find(m => m.id === currentTab)?.label || 'النظام';

  const sidebarContent = (
    <>
      <div className="py-5 px-4 flex flex-col items-center justify-center border-b border-slate-800 bg-slate-900/95 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -ml-8 -mb-8"></div>
        
        <div className="relative z-10 flex items-center justify-center mb-2 select-none" dir="ltr">
           <h1 className="text-3xl font-black tracking-tighter flex items-center bg-white/5 px-3 py-1.5 rounded-2xl border border-white/10 shadow-xl cursor-default">
              <span className="text-[#4285F4]">F</span>
              <div className="relative flex items-center justify-center w-5 h-8 mx-0.5">
                <Wrench className="w-6 h-6 text-[#EA4335] absolute transform -rotate-45" strokeWidth={3} />
              </div>
              <span className="text-[#FBBC05]">x</span>
              <span className="text-[#34A853]">a</span>
              <span className="text-[#4285F4]">r</span>
           </h1>
        </div>
        <div className="relative z-10 mt-1.5">
           <p className="text-[9px] uppercase tracking-wider text-slate-400 font-medium opacity-80" dir="ltr">
              developed by lion creativity M.H
           </p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-1 px-2">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleTabClick(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all text-right text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
                    isActive 
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold shadow-md shadow-emerald-900/20" 
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  )}
                >
                  <div className="flex items-center min-w-0">
                    <Icon className={cn("w-4 h-4 ml-3 shrink-0", isActive ? "text-white" : "text-slate-400")} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={cn("text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 shadow-xs", item.badgeColor)}>
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center mb-3">
          <div className="w-9 h-9 rounded-full bg-slate-700/80 ring-2 ring-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0 shadow-inner">
            {currentUser?.name.charAt(0)}
          </div>
          <div className="mr-3 overflow-hidden">
            <p className="text-xs font-bold text-white truncate">{currentUser?.name}</p>
            <p className="text-[11px] text-slate-400 truncate">{getRoleArabicLabel(currentUser?.role)}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center px-3 py-2 bg-slate-800/80 hover:bg-slate-800 text-red-400 hover:text-red-300 border border-slate-700/60 rounded-lg transition-all text-xs font-bold shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <LogOut className="w-3.5 h-3.5 ml-1.5" />
          تسجيل الخروج
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col shadow-xl z-20 shrink-0 border-l border-slate-800">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div className={cn(
        "fixed inset-y-0 right-0 w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-50 transition-transform duration-300 ease-in-out md:hidden border-l border-slate-800",
        isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex justify-end p-2 border-b border-slate-800 bg-slate-950/50">
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {sidebarContent}
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        <header className="h-14 md:h-16 bg-white border-b border-slate-200/90 flex items-center px-4 md:px-8 justify-between shadow-2xs z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              title="القائمة"
              aria-label="فتح القائمة الرئيسية"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 truncate">
              <span className="text-xs font-semibold text-slate-400 hidden sm:inline-flex items-center gap-1">
                نظام إدارة المنشآت <ChevronLeft className="w-3.5 h-3.5" />
              </span>
              <h2 className="text-base md:text-xl font-bold text-slate-800 truncate">
                {currentTabLabel}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Quick alert pill if overdue or critical orders exist */}
            {(pendingWorkOrdersCount > 0 || overduePreventiveCount > 0) && (
              <button
                onClick={() => setTab('work_orders')}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-xs font-bold transition-colors cursor-pointer"
                title="عرض الطلبات المعلّقة"
              >
                <Bell className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>{pendingWorkOrdersCount} طلب معلّق</span>
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              title={isFullscreen ? "تصغير الشاشة" : "ملء الشاشة"}
              aria-label="تبديل وضع ملء الشاشة"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-8 bg-slate-50/70">
          <div className={cn("mx-auto h-full", currentTab === 'work_orders' || currentTab === 'preventive_maintenance' || currentTab === 'technician_dashboard' ? "w-full max-w-full" : "max-w-7xl")}>
             {children}
          </div>
        </div>
      </main>

      {/* Session Inactivity Warning Modal */}
      {showInactivityWarning && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-amber-200 text-right space-y-4">
            <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
              <ShieldAlert className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="font-bold text-base text-amber-900">تنبيه انتهاء الجلسة بسبب عدم النشاط</h3>
                <p className="text-xs text-amber-700 font-medium mt-0.5">لم نلاحظ أي تفاعل على الشاشة منذ فترة.</p>
              </div>
            </div>

            <p className="text-slate-700 text-sm leading-relaxed">
              ستنتهي الجلسة ويتم تسجيل الخروج تلقائياً خلال:
            </p>

            <div className="bg-slate-900 text-white rounded-xl p-4 text-center space-y-1 font-mono">
              <span className="text-3xl font-black text-amber-400">
                {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, '0')}
              </span>
              <p className="text-[11px] text-slate-400 font-sans">دقيقة : ثانية</p>
            </div>

            <p className="text-xs text-slate-500">
              يرجى الضغط على زر "تمديد الجلسة" أدناه لمواصلة العمل بدون انقطاع.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={extendSession}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                تمديد الجلسة
              </button>
              <button
                onClick={() => {
                  setShowInactivityWarning(false);
                  logout();
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
              >
                تسجيل الخروج الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High Quality Logo Download Modal */}
    </div>
  );
}


