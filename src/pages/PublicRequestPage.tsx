import React, { useState } from 'react';
import { Camera, Send, CheckCircle2, AlertTriangle, User, Briefcase, MapPin, AlignLeft } from 'lucide-react';
import { useStore } from '../store';

export function PublicRequestPage() {
  const { addWorkOrder, facilities } = useStore();
  
  // Try to parse query parameters
  const params = new URLSearchParams(window.location.search);
  const initialLocation = params.get('location') || '';
  const facilityId = params.get('facilityId') || '';
  const subFacilityId = params.get('subFacilityId') || '';

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    jobTitle: '',
    location: initialLocation,
    description: '',
    image: ''
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location || !formData.description) {
      setError('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    // Submit public work order
    const newOrder = {
      id: crypto.randomUUID(),
      title: `بلاغ من ${formData.name}`,
      description: formData.description,
      facilityId: facilityId || undefined,
      subFacilityId: subFacilityId || undefined,
      needsParts: false,
      requiredParts: '',
      maintenanceType: ['PUBLIC_REQUEST'],
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 24 hours
      status: 'PENDING' as const,
      assignedTo: [],
      createdBy: 'PUBLIC_USER',
      createdAt: new Date().toISOString(),
      notes: [],
      image: formData.image,
      
      // Public specific fields
      isPublicRequest: true,
      publicRequesterName: formData.name,
      publicRequesterJobTitle: formData.jobTitle,
      publicLocation: formData.location,
    };

    addWorkOrder(newOrder);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 dir-rtl text-right font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6 animate-fade-in border border-slate-100">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">تم إرسال طلبك بنجاح!</h2>
          <p className="text-slate-600 leading-relaxed">
            شكراً لك <span className="font-bold">{formData.name}</span>.<br/> تم استلام بلاغك للصيانة في موقع 
            <span className="font-bold text-emerald-600 mr-1">{formData.location}</span>.<br/> 
            سيقوم فريق الصيانة بمراجعة الطلب والتعامل معه في أسرع وقت.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors w-full"
          >
            إرسال بلاغ آخر
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8 dir-rtl text-right font-sans">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-emerald-600 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-2xl -ml-8 -mb-8"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white/20 p-3 rounded-2xl mb-4 backdrop-blur-md">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black mb-1">بلاغ صيانة عاجل</h1>
            <p className="text-emerald-100 text-sm">نظام إدارة بلاغات الصيانة للمرافق</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">الاسم الكريم <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-3 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50" 
                  placeholder="اكتب اسمك هنا"
                  required
                />
              </div>
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">الوظيفة / الصفة (اختياري)</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <Briefcase className="h-5 w-5" />
                </div>
                <input 
                  type="text" 
                  value={formData.jobTitle}
                  onChange={e => setFormData({...formData, jobTitle: e.target.value})}
                  className="w-full pl-3 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50" 
                  placeholder="مثال: موظف استقبال، زائر، مدير الإدارة..."
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">موقع البلاغ / المنشأة <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="h-5 w-5" />
                </div>
                <input 
                  type="text" 
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className={`w-full pl-3 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${initialLocation ? 'bg-slate-100 text-slate-600 font-bold' : 'bg-slate-50'}`}
                  placeholder="مثال: الدور الأول، غرفة 103"
                  readOnly={!!initialLocation}
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">وصف المشكلة / العطل <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute top-3 right-3 pointer-events-none text-slate-400">
                  <AlignLeft className="h-5 w-5" />
                </div>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full pl-3 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 min-h-[100px] resize-y" 
                  placeholder="اشرح المشكلة بالتفصيل..."
                  required
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">إرفاق صورة للمشكلة (اختياري)</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {formData.image ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img src={formData.image} alt="Preview" className="h-24 max-w-full rounded-lg object-contain" />
                      </div>
                    ) : (
                      <>
                        <Camera className="w-8 h-8 mb-3 text-slate-400" />
                        <p className="mb-1 text-sm text-slate-500"><span className="font-bold">اضغط لإلتقاط صورة</span> أو اختر ملفاً</p>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-lg transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            إرسال البلاغ الآن
          </button>
        </form>
      </div>
    </div>
  );
}
