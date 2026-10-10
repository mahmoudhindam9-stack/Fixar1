import React, { useState } from 'react';
import { useStore } from '../store';
import { WorkOrder, WorkOrderStatus, SubFacility } from '../types';
import { generateId, formatDate, flattenSubFacilities, getSubFacilityName, formatCode } from '../lib/utils';
import { 
  Plus, Printer, Edit2, Check, X, Trash2, Eye, LayoutGrid, List, MessageSquare, 
  Share2, Send, Copy, ExternalLink, Phone, Sparkles, SlidersHorizontal, Maximize2, 
  ArrowLeftRight, Image as ImageIcon, MapPin, UserCheck, Calendar, Clock, ShieldAlert,
  CheckCircle2, Upload, RefreshCw, Layers, Star, Banknote, DollarSign,
  ChevronDown, ChevronUp
} from 'lucide-react';

export const OrderRatingStars = React.memo(function OrderRatingStars({ customerRating, supervisorRating, status }: { customerRating?: number; supervisorRating?: number; status?: string }) {
  if (status && status !== 'CLOSED') {
    return (
      <div className="flex items-center gap-1.5 bg-slate-100 text-slate-500 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200" title="يُحتسب التقييم فقط عند إغلاق الطلب نهائياً">
        <Star className="w-3.5 h-3.5 text-slate-400" />
        <span>التقييم: ينشط عند الإغلاق</span>
      </div>
    );
  }

  const ratings: number[] = [];
  if (typeof customerRating === 'number' && customerRating > 0) ratings.push(customerRating);
  if (typeof supervisorRating === 'number' && supervisorRating > 0) ratings.push(supervisorRating);

  if (ratings.length === 0) {
    return (
      <div className="flex items-center gap-1.5 bg-slate-100 text-slate-500 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200">
        <Star className="w-3.5 h-3.5 text-slate-400" />
        <span>متوسط التقييم: غير مقيم</span>
      </div>
    );
  }

  const avg = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;

  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-900 border border-amber-200/90 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs">
      <span className="text-amber-800 font-bold whitespace-nowrap">التقييم:</span>
      <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'
            }`}
          />
        ))}
      </div>
      <span className="font-mono text-xs font-black text-amber-800 bg-amber-200/60 px-1.5 py-0.5 rounded">{avg.toFixed(1)}/5</span>
      {(customerRating !== undefined || supervisorRating !== undefined) && (
        <span className="text-[10px] text-amber-700 font-normal hidden sm:inline-block border-r border-amber-200 pr-1.5">
          {customerRating && `عميل: ${customerRating}★`}
          {customerRating && supervisorRating && ` • `}
          {supervisorRating && `مشرف: ${supervisorRating}★`}
        </span>
      )}
    </div>
  );
});

export const OrderCostBadge = React.memo(function OrderCostBadge({ laborCost, partsCost }: { laborCost?: number; partsCost?: number }) {
  const total = (laborCost || 0) + (partsCost || 0);

  return (
    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-950 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs">
      <Banknote className="w-4 h-4 text-emerald-600 flex-shrink-0" />
      <span className="text-emerald-800 font-bold whitespace-nowrap">التكلفة:</span>
      <span className="font-mono text-sm font-black text-emerald-700">{total > 0 ? `${total} ج.م` : 'غير محددة'}</span>
      {(laborCost || partsCost) ? (
        <span className="text-[10px] text-emerald-700 font-normal hidden sm:inline-block border-r border-emerald-200 pr-1.5">
          {laborCost ? `مصنعية: ${laborCost}` : ''}
          {laborCost && partsCost ? ` • ` : ''}
          {partsCost ? `قطع: ${partsCost}` : ''}
        </span>
      ) : null}
    </div>
  );
});

export function WorkOrders() {
  const { workOrders, users, facilities, inventory, addWorkOrder, updateWorkOrder, deleteWorkOrder, currentUser } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [inspectOrder, setInspectOrder] = useState<WorkOrder | null>(null);
  const [closingOrder, setClosingOrder] = useState<WorkOrder | null>(null);
  const [whatsAppModalOrder, setWhatsAppModalOrder] = useState<WorkOrder | null>(null);
  const [whatsAppTargetPhone, setWhatsAppTargetPhone] = useState<string>('');
  const [whatsAppCustomPhone, setWhatsAppCustomPhone] = useState<string>('');
  const [copiedToast, setCopiedToast] = useState(false);

  // Before & After Interactive Comparison states
  const [comparisonOrder, setComparisonOrder] = useState<WorkOrder | null>(null);
  const [comparisonSliderPos, setComparisonSliderPos] = useState<number>(50);
  const [comparisonMode, setComparisonMode] = useState<'slider' | 'sideBySide'>('slider');
  const [fullscreenImage, setFullscreenImage] = useState<{ url: string; title: string } | null>(null);

  const [customerRating, setCustomerRating] = useState(5);
  const [supervisorRating, setSupervisorRating] = useState(5);
  const [finalNotes, setFinalNotes] = useState('');
  const [laborCost, setLaborCost] = useState(0);
  const [partsCost, setPartsCost] = useState(0);
  const [responseMsg, setResponseMsg] = useState('');
  const [inspectImageAfter, setInspectImageAfter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  // Pagination & Filtering states (default 5 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  
  const technicians = users.filter(u => u.role === 'TECHNICIAN' || u.role === 'SUPER_ADMIN');

  const maintenanceTypeOptions = ['عامة', 'كهرباء', 'سباكة', 'تكييف وتبريد', 'نجارة', 'أخرى'];

  // Form states
  const [title, setTitle] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [reporterPhone2, setReporterPhone2] = useState('');
  const [desc, setDesc] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [needsParts, setNeedsParts] = useState(false);
  const [parts, setParts] = useState('');
  const [partSearchQuery, setPartSearchQuery] = useState('');
  const [needsSpecialEquipment, setNeedsSpecialEquipment] = useState(false);
  const [equipment, setEquipment] = useState('');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('LOW');
  const [facilityId, setFacilityId] = useState('');
  const [subFacilityId, setSubFacilityId] = useState('');
  const [image, setImage] = useState('');
  const [imageAfter, setImageAfter] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleImageAfterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageAfter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleQuickImageAfterUploadForOrder = (order: WorkOrder, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      updateWorkOrder({ ...order, imageAfter: result });
    };
    reader.readAsDataURL(file);
  };

  const selectedFacilityObj = facilities.find(f => f.id === facilityId);
  const flattenedSelectedSubFacilities = selectedFacilityObj ? flattenSubFacilities(selectedFacilityObj.subFacilities) : [];

  const toggleSelection = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]);
  };

  const startEdit = (order: WorkOrder) => {
    setEditingId(order.id);
    setTitle(order.title);
    setReporterPhone(order.reporterPhone || '');
    setReporterPhone2(order.reporterPhone2 || '');
    setDesc(order.description);
    setTypes(Array.isArray(order.maintenanceType) ? order.maintenanceType : (order.maintenanceType ? [order.maintenanceType as unknown as string] : []));
    setNeedsParts(order.needsParts);
    setParts(order.requiredParts);
    setNeedsSpecialEquipment(order.needsSpecialEquipment || false);
    setEquipment(order.requiredEquipment || '');
    setAssignedTo(Array.isArray(order.assignedTo) ? order.assignedTo : (order.assignedTo ? [order.assignedTo] : []));
    setDeadline(order.deadline);
    setPriority(order.priority || 'LOW');
    setFacilityId(order.facilityId || '');
    setSubFacilityId(order.subFacilityId || '');
    setImage(order.image || '');
    setImageAfter(order.imageAfter || '');
    setCustomerRating(order.customerRating || 5);
    setSupervisorRating(order.supervisorRating || 5);
    setLaborCost(order.laborCost || 0);
    setPartsCost(order.partsCost || 0);
    setIsCreating(true);
  };

  const resetForm = () => {
    setTitle(''); setReporterPhone(''); setReporterPhone2(''); setDesc(''); setParts(''); setNeedsParts(false); setNeedsSpecialEquipment(false); setEquipment(''); setDeadline(''); setPriority('LOW'); setFacilityId(''); setSubFacilityId(''); setImage(''); setImageAfter(''); setTypes([]); setAssignedTo([]); setCustomerRating(5); setSupervisorRating(5); setLaborCost(0); setPartsCost(0); setEditingId(null); setIsCreating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const order = workOrders.find(w => w.id === editingId);
      if (order) {
        updateWorkOrder({
          ...order,
          title,
          reporterPhone,
          reporterPhone2,
          description: desc,
          image,
          imageAfter,
          needsParts,
          requiredParts: parts,
          needsSpecialEquipment,
          requiredEquipment: equipment,
          maintenanceType: types,
          deadline,
          priority,
          facilityId,
          subFacilityId,
          assignedTo,
          customerRating,
          supervisorRating,
          laborCost,
          partsCost
        });
      }
    } else {
      const newOrder: WorkOrder = {
        id: generateId(),
        title,
        reporterPhone,
        reporterPhone2,
        description: desc,
        image,
        imageAfter,
        needsParts,
        requiredParts: parts,
        needsSpecialEquipment,
        requiredEquipment: equipment,
        maintenanceType: types,
        deadline,
        priority,
        facilityId,
        subFacilityId,
        status: 'PENDING',
        assignedTo,
        createdBy: currentUser!.id,
        createdAt: new Date().toISOString(),
        customerRating,
        supervisorRating,
        laborCost,
        partsCost,
        notes: [],
      };
      addWorkOrder(newOrder);
    }
    resetForm();
  };

  const generateWhatsAppCardText = (order: WorkOrder) => {
    const assignedToArray = Array.isArray(order.assignedTo) ? order.assignedTo : (order.assignedTo ? [order.assignedTo] : []);
    const techUsers = users.filter(u => assignedToArray.includes(u.id));
    const techNames = techUsers.map(u => u.name).join('، ') || 'غير محدد';
    const facilityName = facilities.find(f => f.id === order.facilityId)?.name || '';
    const subFacilityName = getSubFacilityName(facilities, order.facilityId, order.subFacilityId);
    const location = facilityName ? `${facilityName}${subFacilityName ? ` - ${subFacilityName}` : ''}` : 'غير محدد';
    const orderNum = formatCode(order.isPublicRequest ? 'PR' : 'WO', order.orderNumber);
    const priorityArabic = order.priority === 'CRITICAL' ? '🔴 حرجة طارئة' : order.priority === 'HIGH' ? '🟠 عالية' : order.priority === 'MEDIUM' ? '🟡 متوسطة' : '🟢 منخفضة';
    const statusArabic = order.status === 'PENDING' ? '⏳ قيد الانتظار' : order.status === 'IN_PROGRESS' ? '⚙️ جاري العمل' : order.status === 'COMPLETED' ? '✅ مكتمل' : order.status === 'CLOSED' ? '🔒 مغلق' : '❌ ملغى';
    
    const orderUrl = `${window.location.origin}?orderId=${order.id}`;

    let text = `*🛠️ كارت طلب صيانة ${orderNum}*\n`;
    text += `━━━━━━━━━━━━━━━━━━\n`;
    text += `*🆔 رقم الطلب:* ${orderNum}\n`;
    text += `*👨‍🔧 الفني الموجه إليه:* ${techNames}\n`;
    text += `*👤 اسم المُبلغ:* ${order.title}\n`;
    if (order.reporterPhone) {
      text += `*📞 هاتف المُبلغ:* ${order.reporterPhone}${order.reporterPhone2 ? ` / ${order.reporterPhone2}` : ''}\n`;
    }
    text += `*🏢 الموقع:* ${location}\n`;
    text += `*🚨 الأولوية:* ${priorityArabic}\n`;
    text += `*📌 الحالة:* ${statusArabic}\n`;
    text += `*📝 وصف العطل:* ${order.description}\n`;
    if (order.needsParts && order.requiredParts) {
      text += `*⚙️ قطع الغيار:* ${order.requiredParts}\n`;
    }
    if (order.needsSpecialEquipment && order.requiredEquipment) {
      text += `*🏗️ معدات خاصة:* ${order.requiredEquipment}\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━\n`;
    text += `*🔗 رابط معاينة ومتابعة الطلب:*\n${orderUrl}`;

    return text;
  };

  const openWhatsAppApp = (order: WorkOrder, phoneNum?: string) => {
    const text = generateWhatsAppCardText(order);
    const cleanPhone = phoneNum ? phoneNum.replace(/[^0-9]/g, '') : '';
    const url = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const openWhatsAppWeb = (order: WorkOrder, phoneNum?: string) => {
    const text = generateWhatsAppCardText(order);
    const cleanPhone = phoneNum ? phoneNum.replace(/[^0-9]/g, '') : '';
    const url = cleanPhone
      ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`
      : `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleStatusChange = (order: WorkOrder, newStatus: WorkOrderStatus) => {
    if (newStatus === 'CLOSED') {
      setClosingOrder(order);
      setCustomerRating(5);
      setSupervisorRating(5);
      setFinalNotes('');
      setLaborCost(0);
      setPartsCost(0);
    } else {
      updateWorkOrder({ ...order, status: newStatus });
    }
  };

  const printOrder = (order: WorkOrder) => {
    const assignedToArray = Array.isArray(order.assignedTo) ? order.assignedTo : (order.assignedTo ? [order.assignedTo] : []);
    const techNames = assignedToArray.map((id: string) => users.find(u => u.id === id)?.name).filter(Boolean).join('، ') || 'غير محدد';
    const facilityName = facilities.find(f => f.id === order.facilityId)?.name || '';
    const subFacilityName = getSubFacilityName(facilities, order.facilityId, order.subFacilityId);
    const location = facilityName ? `${facilityName}${subFacilityName ? ` - ${subFacilityName}` : ''}` : 'غير محدد';
    const printWindow = window.open('', '', 'width=800,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl" lang="ar">
          <head>
            <title>إيصال صيانة - ${formatCode(order.isPublicRequest ? 'PR' : 'WO', order.orderNumber)}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #059669; padding-bottom: 20px; }
              .header h1 { margin: 0; color: #059669; font-size: 24px; }
              .header p { margin: 5px 0 0; color: #666; font-size: 14px; }
              .section { margin-bottom: 25px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
              .section-title { font-weight: bold; margin-bottom: 15px; color: #0f172a; font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; }
              .row { margin-bottom: 10px; display: flex; }
              .label { font-weight: bold; width: 150px; color: #475569; }
              .value { flex: 1; }
              .cost-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              .cost-table th, .cost-table td { border: 1px solid #cbd5e1; padding: 10px; text-align: right; }
              .cost-table th { background-color: #f1f5f9; color: #334155; }
              .total-row { font-weight: bold; background-color: #e2e8f0; }
              .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
              .sig-box { width: 45%; border: 1px dashed #94a3b8; padding: 20px; border-radius: 8px; background: #f8fafc; }
              .sig-title { font-weight: bold; margin-bottom: 40px; text-align: center; color: #475569; }
              .sig-line { border-bottom: 1px solid #cbd5e1; margin-bottom: 10px; }
              .sig-label { font-size: 12px; color: #64748b; text-align: center; }
              .images { display: flex; gap: 20px; margin-top: 20px; }
              .img-box { flex: 1; }
              .img-box p { text-align: center; font-weight: bold; color: #475569; margin-bottom: 10px; }
              .img-box img { width: 100%; max-height: 250px; object-fit: contain; border: 1px solid #cbd5e1; border-radius: 8px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>إيصال إتمام صيانة</h1>
              <p>طلب رقم: ${formatCode(order.isPublicRequest ? 'PR' : 'WO', order.orderNumber)} | التاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
            </div>
            
            <div class="section">
              <div class="section-title">تفاصيل الطلب</div>
              <div class="row"><span class="label">اسم المبلغ ووظيفته:</span> <span class="value">${order.title}</span></div>
              <div class="row"><span class="label">الموقع:</span> <span class="value">${location}</span></div>
              <div class="row"><span class="label">الفني المختص:</span> <span class="value">${techNames}</span></div>
              <div class="row"><span class="label">وصف العطل الأساسي:</span> <span class="value">${order.description}</span></div>
            </div>

            <div class="section">
              <div class="section-title">تقرير التنفيذ (ملاحظات الفني)</div>
              <div class="row"><span class="label">ما تم إنجازه:</span> <span class="value">${order.responseMessage || 'لم يتم تسجيل ملاحظات'}</span></div>
              ${(order.laborCost || order.partsCost) ? `
              <table class="cost-table">
                <thead>
                  <tr>
                    <th>البند</th>
                    <th>التكلفة (جنيه)</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.laborCost ? `<tr><td>أجور العمالة / الفحص</td><td>${order.laborCost}</td></tr>` : ''}
                  ${order.partsCost ? `<tr><td>قطع الغيار المستخدمة</td><td>${order.partsCost}</td></tr>` : ''}
                  <tr class="total-row">
                    <td>الإجمالي</td>
                    <td>${(order.laborCost || 0) + (order.partsCost || 0)}</td>
                  </tr>
                </tbody>
              </table>
              ` : ''}
            </div>

            ${(order.image || order.imageAfter) ? `
            <div class="section">
              <div class="section-title">الصور المرفقة</div>
              <div class="images">
                ${order.image ? `
                <div class="img-box">
                  <p>قبل الصيانة</p>
                  <img src="${order.image}" alt="قبل" />
                </div>
                ` : ''}
                ${order.imageAfter ? `
                <div class="img-box">
                  <p>بعد الصيانة</p>
                  <img src="${order.imageAfter}" alt="بعد" />
                </div>
                ` : ''}
              </div>
            </div>
            ` : ''}

            <div class="signatures">
              <div class="sig-box">
                <div class="sig-title">الفني المنفذ</div>
                <div class="sig-line"></div>
                <div class="sig-label">الاسم والتوقيع</div>
              </div>
              <div class="sig-box">
                <div class="sig-title">العميل / المستلم</div>
                <div class="sig-line"></div>
                <div class="sig-label">الاسم والتوقيع</div>
                <div style="margin-top: 15px;">
                  <span style="font-size: 12px; color: #64748b;">ملاحظات العميل:</span>
                  <div style="border-bottom: 1px dotted #cbd5e1; height: 20px; margin-top: 5px;"></div>
                  <div style="border-bottom: 1px dotted #cbd5e1; height: 20px; margin-top: 5px;"></div>
                </div>
              </div>
            </div>
            
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const setSmartDate = (type: 'endOfDay' | 'tomorrowMorning' | 'after3Days' | 'nextWeek') => {
    const d = new Date();
    if (type === 'endOfDay') {
      d.setHours(23, 59, 0, 0);
    } else if (type === 'tomorrowMorning') {
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
    } else if (type === 'after3Days') {
      d.setDate(d.getDate() + 3);
      d.setHours(12, 0, 0, 0);
    } else if (type === 'nextWeek') {
      d.setDate(d.getDate() + 7);
      d.setHours(12, 0, 0, 0);
    }
    
    // Adjust for local timezone offset before converting to ISO string
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
    setDeadline(localISOTime);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">إدارة طلبات الصيانة</h2>
        
        <div className="flex space-x-3 space-x-reverse items-center">
          <div className="flex bg-white rounded-lg border border-slate-300 overflow-hidden shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
              title="عرض شبكي"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
              title="عرض قائمة"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => { resetForm(); setIsCreating(true); }}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5 ml-2" />
            إضافة طلب جديد
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold mb-4 border-b pb-2">{editingId ? 'تعديل طلب صيانة' : 'إنشاء طلب صيانة جديد'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم المبلغ ووظيفته</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="مثال: د. أحمد - مدير العيادات" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم هاتف المبلغ</label>
                <input type="text" value={reporterPhone} onChange={e => setReporterPhone(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="01000000000" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم هاتف إضافي للمبلغ</label>
                <input type="text" value={reporterPhone2} onChange={e => setReporterPhone2(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="01100000000 (اختياري)" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">موعد الانتهاء المطلوب</label>
                <input required type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2" />
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => setSmartDate('endOfDay')} className="text-xs px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-transparent hover:border-emerald-200 text-slate-600 rounded transition-colors">بنهاية اليوم</button>
                  <button type="button" onClick={() => setSmartDate('tomorrowMorning')} className="text-xs px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-transparent hover:border-emerald-200 text-slate-600 rounded transition-colors">غداً صباحاً</button>
                  <button type="button" onClick={() => setSmartDate('after3Days')} className="text-xs px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-transparent hover:border-emerald-200 text-slate-600 rounded transition-colors">بعد 3 أيام</button>
                  <button type="button" onClick={() => setSmartDate('nextWeek')} className="text-xs px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-transparent hover:border-emerald-200 text-slate-600 rounded transition-colors">بعد أسبوع</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الأولوية</label>
                <select value={priority} onChange={e => setPriority(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg bg-white">
                  <option value="LOW">منخفضة</option>
                  <option value="MEDIUM">متوسطة</option>
                  <option value="HIGH">عالية</option>
                  <option value="CRITICAL">حرجة / طارئة</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">المنشأة الرئيسية</label>
                <select value={facilityId} onChange={e => { setFacilityId(e.target.value); setSubFacilityId(''); }} className="w-full px-3 py-2 border rounded-lg bg-white">
                  <option value="">-- اختر المنشأة --</option>
                  {facilities.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              {facilityId && flattenedSelectedSubFacilities.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">القسم / التفرع</label>
                  <select value={subFacilityId} onChange={e => setSubFacilityId(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white">
                    <option value="">-- القسم الرئيسي --</option>
                    {flattenedSelectedSubFacilities.map(sf => (
                      <option key={sf.id} value={sf.id}>{sf.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">التفاصيل والوصف</label>
                <textarea required value={desc} onChange={e => setDesc(e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows={3}></textarea>
              </div>
              
              <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">نوع الصيانة (يمكن اختيار أكثر من نوع)</label>
                <div className="flex flex-wrap gap-2">
                  {maintenanceTypeOptions.map(t => (
                    <button 
                      key={t}
                      type="button"
                      onClick={() => toggleSelection(setTypes, t)}
                      className={`px-3 py-1.5 text-sm rounded-full border ${types.includes(t) ? 'bg-emerald-100 border-emerald-500 text-emerald-800 font-bold' : 'bg-white border-slate-300 text-slate-600'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">تحديد الفنيين المختصين (يمكن اختيار أكثر من فني)</label>
                <div className="flex flex-wrap gap-2">
                  {technicians.map(t => (
                    <button 
                      key={t.id}
                      type="button"
                      disabled={!t.isAvailable}
                      onClick={() => toggleSelection(setAssignedTo, t.id)}
                      className={`px-3 py-1.5 text-sm rounded-full border flex items-center ${assignedTo.includes(t.id) ? 'bg-blue-100 border-blue-500 text-blue-800 font-bold' : (!t.isAvailable ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400')}`}
                    >
                      <span className={`w-2 h-2 rounded-full mr-2 ml-1 ${t.isAvailable ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                      {t.name} ({t.specialty || 'عام'})
                      {!t.isAvailable && ' - غير متاح'}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="flex items-center space-x-2 space-x-reverse mt-2">
                  <input type="checkbox" checked={needsParts} onChange={e => setNeedsParts(e.target.checked)} className="rounded text-emerald-600 w-5 h-5" />
                  <span className="text-sm font-medium text-slate-700">يحتاج قطع غيار؟ (يُرسل إشعار للمخزن)</span>
                </label>
              </div>
              
              {needsParts && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">بيان قطع الغيار المطلوبة</label>
                  <input required={needsParts} type="text" value={parts} onChange={e => setParts(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-3" placeholder="مثال: فلتر، زيت..." />
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-2">بحث وإضافة سريع من المخزون:</label>
                    <input 
                      type="text" 
                      value={partSearchQuery} 
                      onChange={e => setPartSearchQuery(e.target.value)} 
                      placeholder="ابحث باسم القطعة..." 
                      className="w-full px-3 py-1.5 text-sm border rounded-md mb-2"
                    />
                    {partSearchQuery.trim() !== '' && (
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {inventory
                          .filter(i => i.name.toLowerCase().includes(partSearchQuery.toLowerCase()))
                          .slice(0, 10)
                          .map(item => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setParts(prev => prev ? `${prev}، ${item.name}` : item.name);
                                setPartSearchQuery('');
                              }}
                              className="text-xs bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 text-slate-700 px-2 py-1 rounded-md transition-colors flex items-center"
                            >
                              <Plus className="w-3 h-3 ml-1" />
                              {item.name} ({item.quantity} متوفر)
                            </button>
                          ))}
                        {inventory.filter(i => i.name.toLowerCase().includes(partSearchQuery.toLowerCase())).length === 0 && (
                          <div className="text-xs text-slate-500 w-full text-center py-2">لا توجد نتائج مطابقة</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="flex items-center space-x-2 space-x-reverse mt-2">
                  <input type="checkbox" checked={needsSpecialEquipment} onChange={e => setNeedsSpecialEquipment(e.target.checked)} className="rounded text-blue-600 w-5 h-5" />
                  <span className="text-sm font-medium text-slate-700">يتطلب معدات خاصة؟</span>
                </label>
              </div>
              
              {needsSpecialEquipment && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">بيان المعدات المطلوبة</label>
                  <input required={needsSpecialEquipment} type="text" value={equipment} onChange={e => setEquipment(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="مثال: سقالة، دريل كبير..." />
                </div>
              )}
              
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                    صورة قبل الصيانة (وصف العطل)
                  </label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-xs px-3 py-2 border rounded-lg bg-white" />
                  {image ? (
                    <div className="relative mt-2 rounded-lg overflow-hidden border border-red-200 group">
                      <img src={image} alt="قبل الصيانة" className="h-32 w-full object-cover" />
                      <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">قبل</span>
                      <button type="button" onClick={() => setImage('')} className="absolute top-2 left-2 bg-slate-900/70 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 h-20 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs">
                      <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                      اضغط لاختيار صورة العطل
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                    صورة بعد الصيانة (الإنجاز والنتيجة)
                  </label>
                  <input type="file" accept="image/*" onChange={handleImageAfterUpload} className="w-full text-xs px-3 py-2 border rounded-lg bg-white" />
                  {imageAfter ? (
                    <div className="relative mt-2 rounded-lg overflow-hidden border border-emerald-200 group">
                      <img src={imageAfter} alt="بعد الصيانة" className="h-32 w-full object-cover" />
                      <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">بعد</span>
                      <button type="button" onClick={() => setImageAfter('')} className="absolute top-2 left-2 bg-slate-900/70 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 h-20 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs">
                      <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                      اضغط لاختيار صورة النتيجة والبراعة
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Ratings & Costs Section */}
              <div className="md:col-span-2 bg-gradient-to-r from-amber-50/50 via-slate-50 to-emerald-50/50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-xs text-slate-800 mb-3 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  تقييم الطلب والتكلفة المالية (اختياري)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">تقييم العميل (1-5)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="5" 
                      step="0.5" 
                      value={customerRating} 
                      onChange={e => setCustomerRating(Number(e.target.value))} 
                      className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">تقييم المشرف (1-5)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="5" 
                      step="0.5" 
                      value={supervisorRating} 
                      onChange={e => setSupervisorRating(Number(e.target.value))} 
                      className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">تكلفة المصنعية (ج.م)</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={laborCost} 
                      onChange={e => setLaborCost(Number(e.target.value))} 
                      className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">تكلفة قطع الغيار (ج.م)</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={partsCost} 
                      onChange={e => setPartsCost(Number(e.target.value))} 
                      className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white" 
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
              <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50">إلغاء</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">{editingId ? 'حفظ التعديلات' : 'حفظ وإرسال'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Search, Filter & Pagination Header Bar */}
      {(() => {
        const filteredOrders = workOrders.slice().reverse().filter(order => {
          const query = searchQuery.trim().toLowerCase();
          const matchesSearch = !query || 
            order.title.toLowerCase().includes(query) ||
            order.description.toLowerCase().includes(query) ||
            (order.orderNumber && order.orderNumber.toString().includes(query)) ||
            (order.reporterPhone && order.reporterPhone.includes(query));

          const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
          const matchesPriority = priorityFilter === 'ALL' || order.priority === priorityFilter;

          return matchesSearch && matchesStatus && matchesPriority;
        });

        const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
        const validPage = Math.min(currentPage, totalPages);
        const startIndex = (validPage - 1) * itemsPerPage;
        const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

        return (
          <>
            {/* Filter Controls Bar */}
            <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1 flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  placeholder="بحث في الطلبات (الاسم، الوصف، الرقم، الهاتف)..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="px-3.5 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-64"
                />

                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-2 text-xs border rounded-lg bg-white outline-none cursor-pointer"
                >
                  <option value="ALL">جميع الحالات</option>
                  <option value="PENDING">⏳ قيد الانتظار</option>
                  <option value="IN_PROGRESS">⚙️ جاري العمل</option>
                  <option value="COMPLETED">✅ مكتمل</option>
                  <option value="CLOSED">🔒 مغلق</option>
                  <option value="CANCELLED">❌ ملغى</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={e => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-2 text-xs border rounded-lg bg-white outline-none cursor-pointer"
                >
                  <option value="ALL">جميع الأولويات</option>
                  <option value="CRITICAL">🔴 حرجة طارئة</option>
                  <option value="HIGH">🟠 عالية</option>
                  <option value="MEDIUM">🟡 متوسطة</option>
                  <option value="LOW">🟢 منخفضة</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 justify-between md:justify-end">
                <span className="whitespace-nowrap font-medium">عرض الطلبات:</span>
                <select
                  value={itemsPerPage}
                  onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-2.5 py-1.5 border rounded-lg bg-white font-bold text-emerald-700 outline-none cursor-pointer"
                >
                  <option value={5}>5 طلبات (يناسب ارتفاع الشاشة)</option>
                  <option value={10}>10 طلبات</option>
                  <option value={20}>20 طلب</option>
                  <option value={50}>50 طلب</option>
                  <option value={1000}>جميع الطلبات (تمرير كامل لأسفل)</option>
                </select>
              </div>
            </div>

            {/* Empty state if no orders match */}
            {paginatedOrders.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-3">
                <p className="text-base font-bold text-slate-700">لا توجد طلبات صيانة تطابق المعايير الحالية</p>
                <p className="text-xs">جرب تغيير فلتر البحث أو إضافة طلب جديد</p>
              </div>
            ) : viewMode === 'list' ? (
              /* Compact Table Mode - Fits 5 orders on screen without scrolling */
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse min-w-[950px]">
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
                        <th className="py-3 px-3.5 text-right">رقم وعنوان الطلب</th>
                        <th className="py-3 px-3.5 text-right">الموقع / المرفق</th>
                        <th className="py-3 px-3.5 text-right">الأولوية والحالة</th>
                        <th className="py-3 px-3.5 text-right">الفني المكلف</th>
                        <th className="py-3 px-3.5 text-right">التقييم والتكلفة</th>
                        <th className="py-3 px-3.5 text-center">الصور</th>
                        <th className="py-3 px-3.5 text-center">إجراءات سريعة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {paginatedOrders.map((order) => {
                        const assignedToArray = Array.isArray(order.assignedTo) ? order.assignedTo : (order.assignedTo ? [order.assignedTo] : []);
                        const techNames = assignedToArray.map((id: string) => users.find(u => u.id === id)?.name).filter(Boolean);
                        const facilityName = facilities.find(f => f.id === order.facilityId)?.name || '';
                        const subFacilityName = getSubFacilityName(facilities, order.facilityId, order.subFacilityId);
                        const totalCost = (order.laborCost || 0) + (order.partsCost || 0);
                        const isExpanded = expandedOrderId === order.id;

                        return (
                          <React.Fragment key={order.id}>
                            <tr className={`hover:bg-slate-50/90 transition-colors ${isExpanded ? 'bg-emerald-50/30' : ''}`}>
                              {/* Order ID & Title */}
                              <td className="py-2.5 px-3.5">
                                <div className="flex items-center gap-2">
                                  <span className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded shadow-2xs border ${order.isPublicRequest ? 'bg-red-50 text-red-700 border-red-200' : 'text-slate-800 bg-slate-100 border-slate-200'}`}>
                                    {formatCode(order.isPublicRequest ? 'PR' : 'WO', order.orderNumber)}
                                  </span>
                                  {order.isPublicRequest && (
                                    <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold animate-pulse">
                                      بلاغ عام
                                    </span>
                                  )}
                                  <span className="font-bold text-slate-900 text-xs line-clamp-1 max-w-[200px]" title={order.title}>
                                    {order.title}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 max-w-[240px]">
                                  {order.isPublicRequest ? `مُقدم البلاغ: ${order.publicRequesterName} ${order.publicRequesterJobTitle ? `(${order.publicRequesterJobTitle})` : ''}` : order.description}
                                </p>
                              </td>

                              {/* Facility */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap">
                                <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                  <span>{facilityName || 'غير محدد'}{subFacilityName ? ` - ${subFacilityName}` : ''}</span>
                                </div>
                              </td>

                              {/* Priority & Status */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  {order.priority && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      order.priority === 'CRITICAL' ? 'bg-red-50 text-red-700 border border-red-200' :
                                      order.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                                      order.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                      'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    }`}>
                                      {order.priority === 'CRITICAL' ? 'حرجة' : order.priority === 'HIGH' ? 'عالية' : order.priority === 'MEDIUM' ? 'متوسطة' : 'منخفضة'}
                                    </span>
                                  )}
                                  <select 
                                    value={order.status}
                                    onChange={(e) => handleStatusChange(order, e.target.value as WorkOrderStatus)}
                                    className={`text-[11px] font-bold rounded-md px-2 py-0.5 border cursor-pointer outline-none ${
                                      order.status === 'PENDING' ? 'bg-amber-50 text-amber-800 border-amber-200' : 
                                      order.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-800 border-blue-200' : 
                                      order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                      order.status === 'CLOSED' ? 'bg-slate-100 text-slate-800 border-slate-300' :
                                      'bg-red-50 text-red-800 border-red-200'
                                    }`}
                                  >
                                    <option value="PENDING">⏳ قيد الانتظار</option>
                                    <option value="IN_PROGRESS">⚙️ جاري العمل</option>
                                    <option value="COMPLETED">✅ مكتمل</option>
                                    <option value="CLOSED">🔒 مغلق</option>
                                    <option value="CANCELLED">❌ ملغى</option>
                                  </select>
                                </div>
                              </td>

                              {/* Technician & Deadline */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap">
                                <div className="text-slate-800 font-medium">
                                  {techNames.length > 0 ? techNames.join('، ') : 'غير محدد'}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {formatDate(order.deadline)}
                                </div>
                              </td>

                              {/* Rating & Cost */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <OrderRatingStars customerRating={order.customerRating} supervisorRating={order.supervisorRating} status={order.status} />
                                  <span className="font-mono font-bold text-emerald-700 text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    {totalCost > 0 ? `${totalCost} ج.م` : 'غير محددة'}
                                  </span>
                                </div>
                              </td>

                              {/* Image Thumbnails */}
                              <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  {order.image ? (
                                    <img 
                                      src={order.image} 
                                      alt="قبل" 
                                      title="صورة قبل الصيانة - اضغط للتكبير"
                                      onClick={() => setFullscreenImage({ url: order.image!, title: `قبل الصيانة - طلب ${formatCode(order.isPublicRequest ? 'PR' : 'WO', order.orderNumber)}` })}
                                      className="w-8 h-8 rounded-md object-cover border border-red-300 cursor-pointer hover:scale-110 transition-transform shadow-2xs" 
                                    />
                                  ) : (
                                    <span className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] text-slate-400">قبل</span>
                                  )}

                                  {order.imageAfter ? (
                                    <img 
                                      src={order.imageAfter} 
                                      alt="بعد" 
                                      title="صورة بعد الصيانة - اضغط للتكبير"
                                      onClick={() => setFullscreenImage({ url: order.imageAfter!, title: `بعد الصيانة - طلب ${formatCode(order.isPublicRequest ? 'PR' : 'WO', order.orderNumber)}` })}
                                      className="w-8 h-8 rounded-md object-cover border border-emerald-300 cursor-pointer hover:scale-110 transition-transform shadow-2xs" 
                                    />
                                  ) : (
                                    <span className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] text-slate-400">بعد</span>
                                  )}
                                </div>
                              </td>

                              {/* Action Buttons */}
                              <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1">
                                  <button 
                                    onClick={() => {
                                      setWhatsAppModalOrder(order);
                                      setWhatsAppTargetPhone(order.reporterPhone || '');
                                      setWhatsAppCustomPhone(order.reporterPhone || '');
                                    }} 
                                    className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-2xs"
                                    title="مراسلة عبر واتساب"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>

                                  <button 
                                    onClick={() => { setInspectOrder(order); setResponseMsg(order.responseMessage || ''); setInspectImageAfter(order.imageAfter || ''); }}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                                    title="فحص التفاصيل والصور"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                  </button>

                                  <button 
                                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                    className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                                    title={isExpanded ? "إغلاق التفاصيل" : "عرض جميع التفاصيل"}
                                  >
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>

                                  <button 
                                    onClick={() => startEdit(order)}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                                    title="تعديل"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                                  </button>

                                  <button 
                                    onClick={() => printOrder(order)}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                                    title="طباعة"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                                  </button>

                                  <button 
                                    onClick={() => setOrderToDelete(order.id)} 
                                    className="p-1.5 bg-slate-100 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                    title="حذف"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Expanded Details Drawer */}
                            {isExpanded && (
                              <tr className="bg-slate-50/90 border-b border-slate-200">
                                <td colSpan={7} className="p-4">
                                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                                    <div className="flex items-center justify-between border-b pb-2">
                                      <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                        <span>تفاصيل طلب الصيانة {formatCode(order.isPublicRequest ? 'PR' : 'WO', order.orderNumber)}: {order.title}</span>
                                      </h5>
                                      {order.image && order.imageAfter && (
                                        <button 
                                          onClick={() => { setComparisonOrder(order); setComparisonSliderPos(50); }}
                                          className="text-xs font-bold bg-emerald-600 text-white px-3 py-1 rounded-lg flex items-center gap-1.5"
                                        >
                                          <ArrowLeftRight className="w-3.5 h-3.5" />
                                          فتح المقارنة التفاعلية (قبل وبعد)
                                        </button>
                                      )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                      <div>
                                        <p className="font-bold text-slate-700 mb-1">وصف العطل / الخدمة:</p>
                                        <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">{order.description}</p>

                                        {order.reporterPhone && (
                                          <p className="mt-2 text-slate-600">
                                            <strong>هاتف المبلغ: </strong>
                                            <a href={`tel:${order.reporterPhone}`} className="text-emerald-700 font-mono underline">{order.reporterPhone}</a>
                                            {order.reporterPhone2 && ` / ${order.reporterPhone2}`}
                                          </p>
                                        )}
                                      </div>

                                      {/* Interactive Before & After preview */}
                                      <div className="flex items-center gap-3 bg-slate-900 text-white p-3 rounded-xl">
                                        <div className="flex-1 text-center">
                                          <p className="text-[10px] text-red-400 font-bold mb-1">قبل الصيانة</p>
                                          {order.image ? (
                                            <img src={order.image} alt="قبل" className="h-20 w-full object-cover rounded border border-slate-700" />
                                          ) : (
                                            <div className="h-20 bg-slate-800 rounded flex items-center justify-center text-[10px] text-slate-500">لا توجد صورة</div>
                                          )}
                                        </div>

                                        <div className="flex-1 text-center">
                                          <p className="text-[10px] text-emerald-400 font-bold mb-1">بعد الصيانة</p>
                                          {order.imageAfter ? (
                                            <img src={order.imageAfter} alt="بعد" className="h-20 w-full object-cover rounded border border-slate-700" />
                                          ) : (
                                            <div className="h-20 bg-slate-800 rounded flex items-center justify-center text-[10px] text-slate-500">لا توجد صورة</div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Work Orders Grid Cards View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedOrders.map(order => {
                  const assignedToArray = Array.isArray(order.assignedTo) ? order.assignedTo : (order.assignedTo ? [order.assignedTo] : []);
                  const techNames = assignedToArray.map((id: string) => users.find(u => u.id === id)?.name).filter(Boolean);
                  const facilityName = facilities.find(f => f.id === order.facilityId)?.name || '';
                  const subFacilityName = getSubFacilityName(facilities, order.facilityId, order.subFacilityId);

                  return (
                    <div key={order.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200/80 overflow-hidden flex flex-col">
                      {/* Card Header Bar */}
                      <div className={`px-5 py-3.5 border-b flex items-center justify-between gap-3 flex-wrap ${order.isPublicRequest ? 'bg-red-50/50 border-red-100' : 'bg-slate-50/80 border-slate-100'}`}>
                        <div className="flex items-center gap-2.5">
                          <span className={`font-mono font-extrabold text-sm px-2.5 py-1 rounded-lg shadow-2xs border ${order.isPublicRequest ? 'bg-red-600 text-white border-red-700' : 'text-slate-800 bg-white border-slate-200'}`}>
                            {formatCode(order.isPublicRequest ? 'PR' : 'WO', order.orderNumber)}
                          </span>
                          {order.isPublicRequest && (
                            <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded font-bold animate-pulse">
                              بلاغ عام
                            </span>
                          )}
                          <h4 className="font-bold text-base text-slate-900 line-clamp-1">{order.title}</h4>
                        </div>

                        <div className="flex items-center gap-2">
                          {order.priority && (
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs ${
                              order.priority === 'CRITICAL' ? 'bg-red-50 text-red-700 border border-red-200' :
                              order.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                              order.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                order.priority === 'CRITICAL' ? 'bg-red-500 animate-pulse' :
                                order.priority === 'HIGH' ? 'bg-orange-500' :
                                order.priority === 'MEDIUM' ? 'bg-amber-500' :
                                'bg-emerald-500'
                              }`} />
                              {order.priority === 'CRITICAL' ? 'حرجة' : order.priority === 'HIGH' ? 'عالية' : order.priority === 'MEDIUM' ? 'متوسطة' : 'منخفضة'}
                            </span>
                          )}

                          <select 
                            value={order.status}
                            onChange={(e) => handleStatusChange(order, e.target.value as WorkOrderStatus)}
                            className={`text-xs font-bold rounded-lg px-2.5 py-1 border cursor-pointer outline-none transition-colors ${
                              order.status === 'PENDING' ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' : 
                              order.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100' : 
                              order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' :
                              order.status === 'CLOSED' ? 'bg-slate-100 text-slate-800 border-slate-300' :
                              'bg-red-50 text-red-800 border-red-200'
                            }`}
                          >
                            <option value="PENDING">⏳ قيد الانتظار</option>
                            <option value="IN_PROGRESS">⚙️ جاري العمل</option>
                            <option value="COMPLETED">✅ مكتمل</option>
                            <option value="CLOSED">🔒 مغلق</option>
                            <option value="CANCELLED">❌ ملغى</option>
                          </select>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 flex-1 flex flex-col space-y-4">
                        {/* Average Rating & Total Cost Banner (Outside View) */}
                        <div className="flex items-center justify-between gap-2 flex-wrap bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                          <OrderRatingStars customerRating={order.customerRating} supervisorRating={order.supervisorRating} status={order.status} />
                          <OrderCostBadge laborCost={order.laborCost} partsCost={order.partsCost} />
                        </div>

                        {/* Description & Types */}
                        <div>
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {order.isPublicRequest ? `مُقدم البلاغ: ${order.publicRequesterName} ${order.publicRequesterJobTitle ? `(${order.publicRequesterJobTitle})` : ''}` : order.description}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {(Array.isArray(order.maintenanceType) ? order.maintenanceType : (order.maintenanceType ? [order.maintenanceType as unknown as string] : [])).map(t => (
                              <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-medium border border-slate-200/60">{t}</span>
                            ))}
                          </div>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50/60 p-3 rounded-xl border border-slate-100 text-xs text-slate-600">
                          {facilityName && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span className="truncate font-medium text-slate-800">{facilityName}{subFacilityName ? ` - ${subFacilityName}` : ''}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <span className="truncate">{techNames.length > 0 ? techNames.join('، ') : 'غير محدد'}</span>
                          </div>
                          {order.reporterPhone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                              <a href={`tel:${order.reporterPhone}`} className="font-mono text-slate-800 hover:text-emerald-600 hover:underline">
                                {order.reporterPhone}{order.reporterPhone2 ? ` / ${order.reporterPhone2}` : ''}
                              </a>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            <span>{formatDate(order.deadline)}</span>
                          </div>
                        </div>

                        {/* Parts or Equipment info */}
                        {(order.needsParts || order.needsSpecialEquipment) && (
                          <div className="flex flex-wrap gap-2 text-xs">
                            {order.needsParts && (
                              <span className="bg-orange-50 text-orange-800 border border-orange-200 px-2.5 py-1 rounded-lg">
                                <strong>قطع غيار:</strong> {order.requiredParts}
                              </span>
                            )}
                            {order.needsSpecialEquipment && (
                              <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg">
                                <strong>معدات خاصة:</strong> {order.requiredEquipment}
                              </span>
                            )}
                          </div>
                        )}

                        {/* STUNNING BEFORE & AFTER SHOWCASE */}
                        <div className="mt-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-3.5 shadow-md border border-slate-700/50">
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                              التوثيق البصري للصيانة (قبل وبعد)
                            </span>
                            {order.image && order.imageAfter && (
                              <button 
                                onClick={() => { setComparisonOrder(order); setComparisonSliderPos(50); }}
                                className="text-[11px] font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1 transition-all transform active:scale-95 cursor-pointer"
                              >
                                <ArrowLeftRight className="w-3 h-3" />
                                مقارنة تفاعلية قبل وبعد
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2.5">
                            {/* BEFORE IMAGE BOX */}
                            <div className="relative group rounded-xl overflow-hidden bg-slate-950/80 border border-slate-700/80 aspect-4/3 flex items-center justify-center">
                              {order.image ? (
                                <>
                                  <img src={order.image} alt="قبل الصيانة" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                                  <span className="absolute top-2 right-2 bg-red-600/90 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm border border-red-400/30 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                    قبل الصيانة
                                  </span>
                                  <button 
                                    onClick={() => setFullscreenImage({ url: order.image!, title: `قبل الصيانة - طلب ${formatCode(order.isPublicRequest ? 'PR' : 'WO', order.orderNumber)}` })}
                                    className="absolute bottom-2 left-2 bg-slate-900/80 hover:bg-slate-900 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="تثبيت المكبر"
                                  >
                                    <Maximize2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <div className="p-3 text-center flex flex-col items-center justify-center text-slate-500">
                                  <ImageIcon className="w-6 h-6 mb-1 opacity-40" />
                                  <span className="text-[10px]">لا توجد صورة قبل</span>
                                </div>
                              )}
                            </div>

                            {/* AFTER IMAGE BOX */}
                            <div className="relative group rounded-xl overflow-hidden bg-slate-950/80 border border-slate-700/80 aspect-4/3 flex items-center justify-center">
                              {order.imageAfter ? (
                                <>
                                  <img src={order.imageAfter} alt="بعد الصيانة" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                                  <span className="absolute top-2 right-2 bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm border border-emerald-400/30 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                    بعد الصيانة
                                  </span>
                                  <button 
                                    onClick={() => setFullscreenImage({ url: order.imageAfter!, title: `بعد الصيانة - طلب ${formatCode(order.isPublicRequest ? 'PR' : 'WO', order.orderNumber)}` })}
                                    className="absolute bottom-2 left-2 bg-slate-900/80 hover:bg-slate-900 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="تثبيت المكبر"
                                  >
                                    <Maximize2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <label className="p-2 text-center flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-700 hover:border-emerald-500 rounded-xl cursor-pointer hover:bg-slate-800/50 transition-colors w-full h-full">
                                  <Upload className="w-5 h-5 mb-1 text-emerald-400" />
                                  <span className="text-[10px] font-bold text-slate-300">رفع صورة بعد الصيانة</span>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleQuickImageAfterUploadForOrder(order, file);
                                    }} 
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Response message or closure costs */}
                        {order.responseMessage && (
                          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-900">
                            <p className="font-bold mb-0.5 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              الاستجابة المسجلة:
                            </p>
                            <p className="text-emerald-800 leading-relaxed">{order.responseMessage}</p>
                          </div>
                        )}

                        {order.status === 'CLOSED' && order.laborCost !== undefined && order.partsCost !== undefined && (
                          <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold text-slate-800">
                            <span>إجمالي تكلفة الصيانة:</span>
                            <span className="text-emerald-700 text-sm font-black">{order.laborCost + order.partsCost} ج.م</span>
                          </div>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="bg-slate-50 p-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                        <button 
                          onClick={() => {
                            setWhatsAppModalOrder(order);
                            setWhatsAppTargetPhone(order.reporterPhone || '');
                            setWhatsAppCustomPhone(order.reporterPhone || '');
                          }} 
                          className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          واتساب
                        </button>

                        <button 
                          onClick={() => { setInspectOrder(order); setResponseMsg(order.responseMessage || ''); setInspectImageAfter(order.imageAfter || ''); }}
                          className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          فحص
                        </button>

                        <button 
                          onClick={() => startEdit(order)}
                          className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                          تعديل
                        </button>

                        <button 
                          onClick={() => printOrder(order)}
                          className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          طباعة
                        </button>

                        <button 
                          onClick={() => setOrderToDelete(order.id)} 
                          className="py-2 px-2.5 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 font-bold text-xs rounded-xl flex items-center justify-center transition-colors"
                          title="حذف الطلب"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Navigation Bar */}
            {filteredOrders.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                <div className="text-xs text-slate-600 font-medium">
                  عرض <span className="font-bold text-slate-900">{startIndex + 1}</span> إلى <span className="font-bold text-slate-900">{Math.min(startIndex + itemsPerPage, filteredOrders.length)}</span> من إجمالي <span className="font-bold text-emerald-700">{filteredOrders.length}</span> طلب صيانة
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={validPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    السابق
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 text-xs font-bold rounded-lg border transition-all ${
                        pageNum === validPage
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    disabled={validPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {orderToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-2">تأكيد الحذف</h3>
            <p className="text-slate-600 mb-6">هل أنت متأكد من رغبتك في حذف هذا الطلب نهائياً؟ لا يمكن التراجع عن هذه العملية.</p>
            <div className="flex justify-end space-x-3 space-x-reverse">
              <button 
                onClick={() => setOrderToDelete(null)} 
                className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button 
                onClick={() => {
                  deleteWorkOrder(orderToDelete);
                  setOrderToDelete(null);
                }} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {closingOrder && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">
              إغلاق الطلب {formatCode(closingOrder.isPublicRequest ? 'PR' : 'WO', closingOrder.orderNumber)}
            </h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">ملاحظات وردود الفنيين</h4>
                {closingOrder.notes && closingOrder.notes.length > 0 ? (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 max-h-40 overflow-y-auto space-y-2">
                    {closingOrder.notes.map(note => {
                      const user = users.find(u => u.id === note.userId);
                      return (
                        <div key={note.id} className="bg-white p-2 rounded shadow-sm text-sm border border-slate-100">
                          <span className="font-bold text-slate-700">{user?.name || 'فني'}: </span>
                          <span className="text-slate-600">{note.text}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">لا توجد ملاحظات من الفنيين.</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تقييم العميل (1-5)</label>
                  <input type="number" min="1" max="5" value={customerRating} onChange={e => setCustomerRating(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تقييم المشرف (1-5)</label>
                  <input type="number" min="1" max="5" value={supervisorRating} onChange={e => setSupervisorRating(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تكلفة المصنعية</label>
                  <input type="number" min="0" value={laborCost} onChange={e => setLaborCost(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تكلفة قطع الغيار</label>
                  <input type="number" min="0" value={partsCost} onChange={e => setPartsCost(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              
              <div className="bg-emerald-50 p-3 rounded-lg flex justify-between items-center border border-emerald-100">
                <span className="font-bold text-emerald-800">التكلفة الإجمالية:</span>
                <span className="font-bold text-xl text-emerald-600">{laborCost + partsCost}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات ختامية (اختياري)</label>
                <textarea 
                  value={finalNotes} 
                  onChange={e => setFinalNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg h-24 resize-none"
                  placeholder="أي ملاحظات إضافية قبل إغلاق الطلب نهائياً..."
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end space-x-3 space-x-reverse mt-6 pt-4 border-t border-slate-200">
              <button 
                onClick={() => setClosingOrder(null)} 
                className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button 
                onClick={() => {
                  updateWorkOrder({ 
                    ...closingOrder, 
                    status: 'CLOSED',
                    customerRating,
                    supervisorRating,
                    laborCost,
                    partsCost,
                    finalNotes,
                    closedAt: new Date().toISOString()
                  });
                  setClosingOrder(null);
                }} 
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                حفظ وإغلاق الطلب
              </button>
            </div>
          </div>
        </div>
      )}

      {inspectOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-600" />
              فحص واستجابة للطلب {formatCode(inspectOrder.isPublicRequest ? 'PR' : 'WO', inspectOrder.orderNumber)}
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-xs font-bold text-slate-500 mb-0.5">العنوان / المُبلغ</p>
                <p className="text-slate-900 font-bold">{inspectOrder.title}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 mb-0.5">الوصف</p>
                <p className="text-slate-700 text-sm leading-relaxed">{inspectOrder.description}</p>
              </div>

              {/* Before and After Images in Inspect */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  الصور والتوثيق البصري:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 mb-1">صورة قبل الصيانة:</p>
                    {inspectOrder.image ? (
                      <img src={inspectOrder.image} alt="قبل الصيانة" className="w-full h-28 object-cover rounded-lg border border-slate-200" />
                    ) : (
                      <div className="h-28 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400">لا توجد صورة قبل</div>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 mb-1">صورة بعد الصيانة:</p>
                    {inspectImageAfter || inspectOrder.imageAfter ? (
                      <div className="relative group rounded-lg overflow-hidden border border-slate-200">
                        <img src={inspectImageAfter || inspectOrder.imageAfter} alt="بعد الصيانة" className="w-full h-28 object-cover" />
                        <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold cursor-pointer transition-opacity">
                          تغيير الصورة
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setInspectImageAfter(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }} 
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="h-28 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-lg flex flex-col items-center justify-center text-emerald-700 bg-emerald-50/50 cursor-pointer text-xs transition-colors p-2 text-center">
                        <Upload className="w-5 h-5 mb-1" />
                        <span>إرفاق صورة بعد الإنجاز</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setInspectImageAfter(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }} 
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رسالة الاستجابة (لمقدم الطلب)</label>
                <textarea 
                  value={responseMsg} 
                  onChange={e => setResponseMsg(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm h-24 resize-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="اكتب هنا ردك أو الاستجابة الفعلية التي تمت للطلب..."
                ></textarea>
              </div>
            </div>
            <div className="flex justify-between items-center space-x-3 space-x-reverse border-t pt-4">
              <button 
                onClick={() => {
                  setWhatsAppModalOrder(inspectOrder);
                  setWhatsAppTargetPhone(inspectOrder.reporterPhone || '');
                  setWhatsAppCustomPhone(inspectOrder.reporterPhone || '');
                }}
                className="px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold rounded-xl hover:bg-emerald-100 flex items-center gap-1.5 text-xs"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                واتساب
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setInspectOrder(null); setResponseMsg(''); setInspectImageAfter(''); }} 
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button 
                  onClick={() => {
                    updateWorkOrder({ 
                      ...inspectOrder, 
                      responseMessage: responseMsg,
                      ...(inspectImageAfter ? { imageAfter: inspectImageAfter } : {})
                    });
                    setInspectOrder(null);
                    setResponseMsg('');
                    setInspectImageAfter('');
                  }} 
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
                >
                  حفظ الاستجابة والتوثيق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Before & After Comparison Modal */}
      {comparisonOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl max-w-4xl w-full border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    طلب {formatCode(comparisonOrder.isPublicRequest ? 'PR' : 'WO', comparisonOrder.orderNumber)}
                  </span>
                  <h3 className="text-lg font-black text-white">{comparisonOrder.title}</h3>
                </div>
                <p className="text-xs text-slate-400">مقارنة بصرية تفاعلية لنتائج صيانة العطل</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-slate-950 p-1 rounded-xl border border-slate-700 flex gap-1 text-xs">
                  <button 
                    onClick={() => setComparisonMode('slider')}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      comparisonMode === 'slider' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    منزلق تفاعلي
                  </button>
                  <button 
                    onClick={() => setComparisonMode('sideBySide')}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      comparisonMode === 'sideBySide' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    جنباً إلى جنب
                  </button>
                </div>

                <button onClick={() => setComparisonOrder(null)} className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {comparisonMode === 'slider' ? (
                <div className="space-y-4">
                  {/* Image Interactive Container */}
                  <div className="relative w-full aspect-16/9 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl select-none group">
                    {/* Base Image: BEFORE */}
                    <img 
                      src={comparisonOrder.image || ''} 
                      alt="قبل الصيانة" 
                      className="absolute inset-0 w-full h-full object-cover" 
                    />
                    
                    {/* Overlay Image: AFTER (Clipped) */}
                    <div 
                      className="absolute inset-0 overflow-hidden" 
                      style={{ width: `${comparisonSliderPos}%` }}
                    >
                      <img 
                        src={comparisonOrder.imageAfter || ''} 
                        alt="بعد الصيانة" 
                        className="absolute top-0 right-0 h-full max-w-none object-cover"
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>

                    {/* Badges */}
                    <div className="absolute top-4 right-4 bg-red-600/90 text-white font-bold text-xs px-3 py-1 rounded-lg shadow-lg border border-red-400/40 backdrop-blur-xs flex items-center gap-1.5 pointer-events-none">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      قبل الصيانة (العطل)
                    </div>

                    <div className="absolute top-4 left-4 bg-emerald-600/90 text-white font-bold text-xs px-3 py-1 rounded-lg shadow-lg border border-emerald-400/40 backdrop-blur-xs flex items-center gap-1.5 pointer-events-none">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      بعد الصيانة (الإنجاز)
                    </div>

                    {/* Slider Handle Line */}
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] pointer-events-none z-10"
                      style={{ left: `${comparisonSliderPos}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-emerald-500 border-2 border-white text-white flex items-center justify-center shadow-2xl">
                        <ArrowLeftRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Slider Control Bar */}
                  <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <span className="text-xs font-bold text-slate-300 min-w-[70px]">تحريك المنزلق:</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={comparisonSliderPos} 
                        onChange={(e) => setComparisonSliderPos(Number(e.target.value))}
                        className="w-full md:w-64 accent-emerald-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
                      />
                      <span className="text-xs font-mono font-bold text-emerald-400 min-w-[40px]">{comparisonSliderPos}%</span>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      <button 
                        onClick={() => setComparisonSliderPos(0)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        قبل فقط (0%)
                      </button>
                      <button 
                        onClick={() => setComparisonSliderPos(50)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        منتصف (50%)
                      </button>
                      <button 
                        onClick={() => setComparisonSliderPos(100)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        بعد فقط (100%)
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-red-400 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        صورة قبل الصيانة (العطل الأصلي)
                      </span>
                      <button 
                        onClick={() => setFullscreenImage({ url: comparisonOrder.image!, title: 'صورة قبل الصيانة' })}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" /> تكبير
                      </button>
                    </div>
                    {comparisonOrder.image ? (
                      <img src={comparisonOrder.image} alt="قبل" className="w-full h-72 object-cover rounded-xl border border-slate-700" />
                    ) : (
                      <div className="h-72 flex items-center justify-center bg-slate-900 rounded-xl text-slate-500 text-sm">
                        لا توجد صورة قبل
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        صورة بعد الصيانة (النتيجة النهائية)
                      </span>
                      <button 
                        onClick={() => setFullscreenImage({ url: comparisonOrder.imageAfter!, title: 'صورة بعد الصيانة' })}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" /> تكبير
                      </button>
                    </div>
                    {comparisonOrder.imageAfter ? (
                      <img src={comparisonOrder.imageAfter} alt="بعد" className="w-full h-72 object-cover rounded-xl border border-slate-700" />
                    ) : (
                      <div className="h-72 flex items-center justify-center bg-slate-900 rounded-xl text-slate-500 text-sm">
                        لا توجد صورة بعد
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Lightbox Modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setFullscreenImage(null)}>
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-full flex items-center justify-between p-3 bg-slate-900/80 text-white rounded-t-2xl border-b border-slate-800">
              <span className="font-bold text-sm">{fullscreenImage.title}</span>
              <button onClick={() => setFullscreenImage(null)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <img src={fullscreenImage.url} alt={fullscreenImage.title} className="w-full h-auto max-h-[80vh] object-contain rounded-b-2xl" />
          </div>
        </div>
      )}

      {/* WhatsApp Share Modal */}
      {whatsAppModalOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-emerald-100 flex flex-col">
            {/* Modal Header */}
            <div className="bg-emerald-600 text-white p-5 flex justify-between items-center rounded-t-2xl">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="bg-white/20 p-2 rounded-xl">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">إرسال كارت الطلب عبر واتساب (WhatsApp)</h3>
                  <p className="text-emerald-100 text-xs">طلب صيانة {formatCode(whatsAppModalOrder.isPublicRequest ? 'PR' : 'WO', whatsAppModalOrder.orderNumber)}</p>
                </div>
              </div>
              <button onClick={() => setWhatsAppModalOrder(null)} className="text-emerald-100 hover:text-white p-1 rounded-lg hover:bg-emerald-700/50">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Card Message Preview */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2 relative">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-900 text-sm">معاينة نص كارت الطلب:</span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                    {formatCode(whatsAppModalOrder.isPublicRequest ? 'PR' : 'WO', whatsAppModalOrder.orderNumber)}
                  </span>
                </div>

                <div className="space-y-1.5 text-slate-700 text-sm">
                  <p><strong>👨‍🔧 الفني الموجه إليه:</strong> {
                    (Array.isArray(whatsAppModalOrder.assignedTo) ? whatsAppModalOrder.assignedTo : [])
                      .map(id => users.find(u => u.id === id)?.name).filter(Boolean).join('، ') || 'غير محدد'
                  }</p>
                  <p><strong>👤 اسم المُبلغ:</strong> {whatsAppModalOrder.title}</p>
                  {whatsAppModalOrder.reporterPhone && (
                    <p><strong>📞 هاتف المُبلغ:</strong> {whatsAppModalOrder.reporterPhone} {whatsAppModalOrder.reporterPhone2 ? ` / ${whatsAppModalOrder.reporterPhone2}` : ''}</p>
                  )}
                  <p><strong>🏢 الموقع:</strong> {
                    facilities.find(f => f.id === whatsAppModalOrder.facilityId)?.name || 'غير محدد'
                  }</p>
                  <p><strong>📝 وصف العطل:</strong> {whatsAppModalOrder.description}</p>
                  <div className="pt-2 border-t border-slate-200 text-emerald-700 font-semibold flex items-center gap-1 dir-ltr text-right">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="truncate">{window.location.origin}?orderId={whatsAppModalOrder.id}</span>
                  </div>
                </div>
              </div>

              {/* Recipient Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">اختر المستلم أو ادخل رقم الهاتف:</label>
                <div className="space-y-2">
                  {whatsAppModalOrder.reporterPhone && (
                    <label className="flex items-center space-x-3 space-x-reverse p-3 border rounded-xl cursor-pointer hover:bg-slate-50 bg-white">
                      <input 
                        type="radio" 
                        name="recipient" 
                        checked={whatsAppTargetPhone === whatsAppModalOrder.reporterPhone}
                        onChange={() => {
                          setWhatsAppTargetPhone(whatsAppModalOrder.reporterPhone || '');
                          setWhatsAppCustomPhone(whatsAppModalOrder.reporterPhone || '');
                        }}
                        className="text-emerald-600 focus:ring-emerald-500" 
                      />
                      <div className="text-sm">
                        <span className="font-bold text-slate-800">المُبلغ ({whatsAppModalOrder.title})</span>
                        <span className="block text-xs text-slate-500 font-mono">{whatsAppModalOrder.reporterPhone} {whatsAppModalOrder.reporterPhone2 ? `(إضافي: ${whatsAppModalOrder.reporterPhone2})` : ''}</span>
                      </div>
                    </label>
                  )}

                  {(Array.isArray(whatsAppModalOrder.assignedTo) ? whatsAppModalOrder.assignedTo : []).map(id => {
                    const u = users.find(u => u.id === id);
                    if (!u) return null;
                    return (
                      <label key={u.id} className="flex items-center space-x-3 space-x-reverse p-3 border rounded-xl cursor-pointer hover:bg-slate-50 bg-white">
                        <input 
                          type="radio" 
                          name="recipient" 
                          checked={whatsAppTargetPhone === (u.phone || u.id)}
                          onChange={() => {
                            setWhatsAppTargetPhone(u.phone || u.id);
                            setWhatsAppCustomPhone(u.phone || '');
                          }}
                          className="text-emerald-600 focus:ring-emerald-500" 
                        />
                        <div className="text-sm">
                          <span className="font-bold text-slate-800">الفني: {u.name}</span>
                          <span className="block text-xs text-slate-500 font-mono">
                            {u.phone ? `${u.phone} ${u.phone2 ? `(إضافي: ${u.phone2})` : ''}` : 'بدون رقم هاتف مسجل'}
                          </span>
                        </div>
                      </label>
                    );
                  })}

                  <label className="flex items-center space-x-3 space-x-reverse p-3 border rounded-xl cursor-pointer hover:bg-slate-50 bg-white">
                    <input 
                      type="radio" 
                      name="recipient" 
                      checked={whatsAppTargetPhone === 'custom'}
                      onChange={() => {
                        setWhatsAppTargetPhone('custom');
                      }}
                      className="text-emerald-600 focus:ring-emerald-500" 
                    />
                    <div className="text-sm flex-1">
                      <span className="font-bold text-slate-800">إدخال رقم هاتف آخر أو إرسال عام</span>
                    </div>
                  </label>

                  {whatsAppTargetPhone === 'custom' && (
                    <div className="mr-7 mt-1">
                      <input 
                        type="text" 
                        value={whatsAppCustomPhone} 
                        onChange={e => setWhatsAppCustomPhone(e.target.value)} 
                        placeholder="مثال: 01000000000 أو اتركه فارغاً للاختيار من واتساب"
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white" 
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => openWhatsAppApp(whatsAppModalOrder, whatsAppCustomPhone)}
                  className="flex-1 py-3 px-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  فتح في تطبيق واتساب (App)
                </button>
                
                <button 
                  onClick={() => openWhatsAppWeb(whatsAppModalOrder, whatsAppCustomPhone)}
                  className="flex-1 py-3 px-4 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold rounded-xl hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  فتح في واتساب ويب (Web)
                </button>
              </div>

              <button 
                onClick={() => {
                  const text = generateWhatsAppCardText(whatsAppModalOrder);
                  navigator.clipboard.writeText(text);
                  setCopiedToast(true);
                  setTimeout(() => setCopiedToast(false), 3000);
                }}
                className="w-full py-2.5 px-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Copy className="w-4 h-4" />
                {copiedToast ? 'تم نسخ نص الكارت والرابط بنجاح! ✓' : 'نسخ نص الكارت والرابط للحافظة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}