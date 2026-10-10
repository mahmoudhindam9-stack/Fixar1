import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showRestored) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 text-center text-xs font-bold py-1.5 px-4 flex items-center justify-center gap-2 shadow-md font-sans transition-all animate-slide-down">
      {!isOnline ? (
        <div className="w-full bg-amber-600 text-white flex items-center justify-center gap-2 py-1.5">
          <WifiOff className="w-4 h-4 animate-bounce" />
          <span>انقطع الاتصال بالشبكة (العمل في وضع الأوفلاين - تم حفظ البيانات محلياً)</span>
        </div>
      ) : (
        <div className="w-full bg-emerald-600 text-white flex items-center justify-center gap-2 py-1.5">
          <Wifi className="w-4 h-4" />
          <span>تم استعادة الاتصال بالشبكة بنجاح!</span>
        </div>
      )}
    </div>
  );
}
