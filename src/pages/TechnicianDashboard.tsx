import React, { useState } from 'react';
import { useStore } from '../store';
import { WorkOrder, WorkOrderStatus, PreventiveMaintenanceTask, PreventiveMaintenanceFrequency } from '../types';
import { formatDate, getSubFacilityName, formatCode } from '../lib/utils';
import { Wrench, CheckCircle, Clock, Check, X, Search, FileText, Printer, Calendar, AlertTriangle, Filter, Sparkles, Image as ImageIcon, Package } from 'lucide-react';

export function TechnicianDashboard() {
  const { workOrders, users, facilities, inventory, updateWorkOrder, currentUser, preventiveTasks, updatePreventiveTask, checkIn, checkOut } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState<'ALL' | 'CRITICAL' | 'WITH_IMAGES' | 'WITH_PARTS'>('ALL');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'IN_PROGRESS' | 'CLOSED' | 'PREVENTIVE'>('PENDING');
  
  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [selectedPreventiveTask, setSelectedPreventiveTask] = useState<PreventiveMaintenanceTask | null>(null);
  
  // Work Order Form response
  const [responseMsg, setResponseMsg] = useState('');
  const [laborCost, setLaborCost] = useState(0);
  const [partsCost, setPartsCost] = useState(0);
  const [imageAfter, setImageAfter] = useState('');

  // Preventive Task Form response
  const [preventiveNotes, setPreventiveNotes] = useState('');

  const frequencyLabels: Record<PreventiveMaintenanceFrequency, string> = {
    DAILY: 'يومي',
    WEEKLY: 'أسبوعي',
    MONTHLY: 'شهري',
    QUARTERLY: 'ربع سنوي',
    YEARLY: 'سنوي'
  };

  // Filter work orders assigned to current technician or show all for admin
  const assignedOrders = workOrders.filter(order => {
    if (currentUser?.role === 'SUPER_ADMIN') return true;
    const assigned = Array.isArray(order.assignedTo) ? order.assignedTo : (order.assignedTo ? [order.assignedTo] : []);
    const cId = currentUser?.id || '';
    const cUser = currentUser?.username || '';
    const cName = currentUser?.name || '';
    return assigned.includes(cId) || assigned.includes(cUser) || assigned.includes(cName);
  });

  // Filter preventive maintenance tasks assigned to current technician or show all for admin
  const assignedPreventiveTasks = preventiveTasks.filter(task => {
    if (currentUser?.role === 'SUPER_ADMIN') return true;
    const cId = currentUser?.id || '';
    const cUser = currentUser?.username || '';
    const cName = currentUser?.name || '';
    return task.assignedTo === cId || task.assignedTo === cUser || task.assignedTo === cName;
  });

  // Smart Search Match for Work Orders
  const matchWorkOrder = (order: WorkOrder) => {
    const facilityName = facilities.find(f => f.id === order.facilityId)?.name || '';
    const subFacilityName = getSubFacilityName(facilities, order.facilityId, order.subFacilityId);
    const assignedTechNames = (Array.isArray(order.assignedTo) ? order.assignedTo : [order.assignedTo])
      .map(id => users.find(u => u.id === id)?.name || '')
      .join(' ');
    const maintenanceTypes = (Array.isArray(order.maintenanceType) ? order.maintenanceType : []).join(' ');

    const searchLower = searchTerm.trim().toLowerCase();
    
    const textMatch = !searchLower || 
      order.title.toLowerCase().includes(searchLower) ||
      order.description.toLowerCase().includes(searchLower) ||
      (order.orderNumber && order.orderNumber.toString().includes(searchLower)) ||
      facilityName.toLowerCase().includes(searchLower) ||
      subFacilityName.toLowerCase().includes(searchLower) ||
      assignedTechNames.toLowerCase().includes(searchLower) ||
      maintenanceTypes.toLowerCase().includes(searchLower) ||
      (order.responseMessage && order.responseMessage.toLowerCase().includes(searchLower)) ||
      (order.requiredParts && order.requiredParts.toLowerCase().includes(searchLower)) ||
      (order.requiredEquipment && order.requiredEquipment.toLowerCase().includes(searchLower));

    let tagMatch = true;
    if (filterTag === 'CRITICAL') {
      tagMatch = order.priority === 'CRITICAL' || order.priority === 'HIGH';
    } else if (filterTag === 'WITH_IMAGES') {
      tagMatch = !!(order.image || order.imageAfter);
    } else if (filterTag === 'WITH_PARTS') {
      tagMatch = order.needsParts || !!order.requiredParts;
    }

    return textMatch && tagMatch;
  };

  // Smart Search Match for Preventive Tasks
  const matchPreventiveTask = (task: PreventiveMaintenanceTask) => {
    const facilityName = facilities.find(f => f.id === task.facilityId)?.name || '';
    const subFacilityName = facilities.find(f => f.id === task.facilityId)?.subFacilities.find(sf => sf.id === task.subFacilityId)?.name || '';
    const freqLabel = frequencyLabels[task.frequency] || '';
    const searchLower = searchTerm.trim().toLowerCase();

    const textMatch = !searchLower ||
      task.description.toLowerCase().includes(searchLower) ||
      facilityName.toLowerCase().includes(searchLower) ||
      subFacilityName.toLowerCase().includes(searchLower) ||
      freqLabel.toLowerCase().includes(searchLower) ||
      (task.notes && task.notes.toLowerCase().includes(searchLower));

    let tagMatch = true;
    if (filterTag === 'CRITICAL') {
      tagMatch = task.status === 'OVERDUE';
    } else if (filterTag === 'WITH_PARTS') {
      tagMatch = !!(task.requiresSpareParts && task.requiredParts && task.requiredParts.length > 0);
    }

    return textMatch && tagMatch;
  };

  const filteredOrders = assignedOrders
    .filter(order => order.status === activeTab && matchWorkOrder(order))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredPreventiveTasks = assignedPreventiveTasks
    .filter(task => matchPreventiveTask(task))
    .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());

  const handleStatusChange = (order: WorkOrder, newStatus: WorkOrderStatus) => {
    updateWorkOrder({
      ...order,
      status: newStatus,
      closedAt: newStatus === 'CLOSED' ? new Date().toISOString() : order.closedAt
    });
  };

  const handleSaveResponse = () => {
    if (!selectedOrder) return;
    
    updateWorkOrder({ 
      ...selectedOrder, 
      responseMessage: responseMsg,
      laborCost: laborCost || undefined,
      partsCost: partsCost || undefined,
      imageAfter: imageAfter || undefined
    });
    
    setSelectedOrder(null);
    setResponseMsg('');
    setLaborCost(0);
    setPartsCost(0);
    setImageAfter('');
  };

  const handleCompletePreventiveTask = () => {
    if (!selectedPreventiveTask) return;

    const today = new Date().toISOString();
    let nextDate = new Date();
    switch (selectedPreventiveTask.frequency) {
      case 'DAILY': nextDate.setDate(nextDate.getDate() + 1); break;
      case 'WEEKLY': nextDate.setDate(nextDate.getDate() + 7); break;
      case 'MONTHLY': nextDate.setMonth(nextDate.getMonth() + 1); break;
      case 'QUARTERLY': nextDate.setMonth(nextDate.getMonth() + 3); break;
      case 'YEARLY': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
    }

    const updatedNotes = preventiveNotes 
      ? `${selectedPreventiveTask.notes ? selectedPreventiveTask.notes + '\n' : ''}[تاريخ التنفيذ ${new Date().toLocaleDateString('ar-EG')}]: ${preventiveNotes}`
      : selectedPreventiveTask.notes;

    updatePreventiveTask({
      ...selectedPreventiveTask,
      status: 'COMPLETED',
      lastPerformed: today,
      nextDueDate: nextDate.toISOString().split('T')[0],
      notes: updatedNotes
    });

    setSelectedPreventiveTask(null);
    setPreventiveNotes('');
  };

  const openOrderModal = (order: WorkOrder) => {
    setSelectedOrder(order);
    setResponseMsg(order.responseMessage || '');
    setLaborCost(order.laborCost || 0);
    setPartsCost(order.partsCost || 0);
    setImageAfter(order.imageAfter || '');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageAfter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const printReceipt = (order: WorkOrder) => {
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
            <title>إيصال صيانة - ${formatCode('WO', order.orderNumber)}</title>
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
              <p>طلب رقم: ${formatCode('WO', order.orderNumber)} | التاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
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

  const printPreventiveReceipt = (task: PreventiveMaintenanceTask) => {
    const facilityName = facilities.find(f => f.id === task.facilityId)?.name || '';
    const subFacilityName = facilities.find(f => f.id === task.facilityId)?.subFacilities.find(sf => sf.id === task.subFacilityId)?.name || '';
    const location = facilityName ? `${facilityName}${subFacilityName ? ` - ${subFacilityName}` : ''}` : 'غير محدد';
    const techName = users.find(u => u.id === task.assignedTo)?.name || 'غير محدد';
    const freqLabel = frequencyLabels[task.frequency] || task.frequency;

    const partsList = (task.requiredParts || []).map(p => {
      const item = inventory.find(i => i.id === p.itemId);
      return item ? `${item.name} (${p.quantity} ${item.unit || 'قطع'})` : '';
    }).filter(Boolean).join('، ');

    const printWindow = window.open('', '', 'width=800,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl" lang="ar">
          <head>
            <title>تقرير صيانة دورية - ${facilityName}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0284c7; padding-bottom: 20px; }
              .header h1 { margin: 0; color: #0284c7; font-size: 24px; }
              .header p { margin: 5px 0 0; color: #666; font-size: 14px; }
              .section { margin-bottom: 25px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
              .section-title { font-weight: bold; margin-bottom: 15px; color: #0f172a; font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; }
              .row { margin-bottom: 10px; display: flex; }
              .label { font-weight: bold; width: 160px; color: #475569; }
              .value { flex: 1; }
              .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
              .sig-box { width: 45%; border: 1px dashed #94a3b8; padding: 20px; border-radius: 8px; background: #f8fafc; }
              .sig-title { font-weight: bold; margin-bottom: 40px; text-align: center; color: #475569; }
              .sig-line { border-bottom: 1px solid #cbd5e1; margin-bottom: 10px; }
              .sig-label { font-size: 12px; color: #64748b; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>تقرير تنفيذ صيانة دورية وقائية</h1>
              <p>التاريخ: ${new Date().toLocaleDateString('ar-EG')} | دورية الصيانة: ${freqLabel}</p>
            </div>
            
            <div class="section">
              <div class="section-title">بيانات مهمة الصيانة الدورية</div>
              <div class="row"><span class="label">الموقع / المنشأة:</span> <span class="value">${location}</span></div>
              <div class="row"><span class="label">الفني المسؤول:</span> <span class="value">${techName}</span></div>
              <div class="row"><span class="label">التكرار الدوري:</span> <span class="value">${freqLabel}</span></div>
              <div class="row"><span class="label">تاريخ الاستحقاق:</span> <span class="value">${formatDate(task.nextDueDate)}</span></div>
              <div class="row"><span class="label">وصف المهمة:</span> <span class="value">${task.description}</span></div>
              ${partsList ? `<div class="row"><span class="label">قطع الغيار/المواد:</span> <span class="value">${partsList}</span></div>` : ''}
            </div>

            <div class="section">
              <div class="section-title">ملاحظات وتقرير الفني</div>
              <div class="row"><span class="label">تفاصيل التنفيذ:</span> <span class="value">${task.notes || 'تمت الصيانة بنجاح وبحالة ممتازة.'}</span></div>
            </div>

            <div class="signatures">
              <div class="sig-box">
                <div class="sig-title">توقيع الفني المنفذ</div>
                <div class="sig-line"></div>
                <div class="sig-label">${techName}</div>
              </div>
              <div class="sig-box">
                <div class="sig-title">اعتماد المشرف / العميل</div>
                <div class="sig-line"></div>
                <div class="sig-label">الاسم والتوقيع</div>
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Quick Duty & Overview Card */}
      {currentUser && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-slate-700">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{currentUser.name}</h3>
                <p className="text-[11px] text-slate-300">فني صيانة وتشغيل</p>
              </div>
            </div>

            <button
              onClick={() => {
                const userInState = users.find(u => u.id === currentUser.id);
                if (userInState?.isAvailable) {
                  checkOut(currentUser.id);
                } else {
                  checkIn(currentUser.id);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-xs ${
                users.find(u => u.id === currentUser.id)?.isAvailable
                  ? 'bg-emerald-500 text-white border-emerald-400 animate-pulse'
                  : 'bg-slate-700 text-slate-300 border-slate-600'
              }`}
            >
              {users.find(u => u.id === currentUser.id)?.isAvailable ? '🟢 متاح للعمل' : '🔴 غير متاح'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-700/60 text-center text-xs">
            <div 
              onClick={() => setActiveTab('PENDING')}
              className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="text-amber-400 font-black text-base">{assignedOrders.filter(o => o.status === 'PENDING').length}</div>
              <div className="text-[10px] text-slate-300">انتظار</div>
            </div>
            <div 
              onClick={() => setActiveTab('IN_PROGRESS')}
              className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="text-blue-400 font-black text-base">{assignedOrders.filter(o => o.status === 'IN_PROGRESS').length}</div>
              <div className="text-[10px] text-slate-300">قيد العمل</div>
            </div>
            <div 
              onClick={() => setActiveTab('CLOSED')}
              className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="text-emerald-400 font-black text-base">{assignedOrders.filter(o => o.status === 'CLOSED').length}</div>
              <div className="text-[10px] text-slate-300">منفذة</div>
            </div>
          </div>
        </div>
      )}

      {/* Header and Smart Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Wrench className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
              لوحة الفنيين والعمليات
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">عرض وتحديث طلبات الصيانة المنفذة، الحالية، والأعمال الوقائية القادمة</p>
          </div>
          
          {/* Smart Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="بحث ذكي وسريع (رقم، اسم، موقع، ملاحظات)..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-9 sm:pr-10 py-2 sm:py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none text-xs sm:text-sm transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Tags */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 ml-1 sm:ml-2">
            <Filter className="w-3.5 h-3.5" /> تصفية سريعة:
          </span>
          <button 
            onClick={() => setFilterTag('ALL')}
            className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${filterTag === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            الكل
          </button>
          <button 
            onClick={() => setFilterTag('CRITICAL')}
            className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${filterTag === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
          >
            عاجل / متأخر
          </button>
          <button 
            onClick={() => setFilterTag('WITH_IMAGES')}
            className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${filterTag === 'WITH_IMAGES' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
          >
            تحتوي على صور
          </button>
          <button 
            onClick={() => setFilterTag('WITH_PARTS')}
            className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${filterTag === 'WITH_PARTS' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
          >
            تحتوي قطع غيار
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex bg-white rounded-xl shadow-xs border border-slate-200 p-1 sm:p-1.5 overflow-x-auto gap-1">
        <button 
          onClick={() => setActiveTab('PENDING')}
          className={`flex-1 min-w-[110px] sm:min-w-[130px] flex items-center justify-center py-2 sm:py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-colors ${activeTab === 'PENDING' ? 'bg-yellow-100 text-yellow-900 shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5" />
          معلقة ({assignedOrders.filter(o => o.status === 'PENDING').length})
        </button>
        <button 
          onClick={() => setActiveTab('IN_PROGRESS')}
          className={`flex-1 min-w-[110px] sm:min-w-[130px] flex items-center justify-center py-2 sm:py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-colors ${activeTab === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-900 shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5" />
          جاري العمل ({assignedOrders.filter(o => o.status === 'IN_PROGRESS').length})
        </button>
        <button 
          onClick={() => setActiveTab('CLOSED')}
          className={`flex-1 min-w-[110px] sm:min-w-[130px] flex items-center justify-center py-2 sm:py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-colors ${activeTab === 'CLOSED' ? 'bg-emerald-100 text-emerald-900 shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5" />
          منفذة ({assignedOrders.filter(o => o.status === 'CLOSED').length})
        </button>
        <button 
          onClick={() => setActiveTab('PREVENTIVE')}
          className={`flex-1 min-w-[125px] sm:min-w-[140px] flex items-center justify-center py-2 sm:py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-colors ${activeTab === 'PREVENTIVE' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5" />
          صيانة دورية ({assignedPreventiveTasks.length})
        </button>
      </div>

      {/* View Section */}
      {activeTab === 'PREVENTIVE' ? (
        /* Preventive Maintenance Tasks Section */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPreventiveTasks.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-slate-700">لا توجد أعمال قادمة مجدولة مطابقة للبحث حالياً.</p>
              <p className="text-xs text-slate-400 mt-1">يتم نزول المهام الوقائية الدورية المسندة إليك تلقائياً في هذه القائمة.</p>
            </div>
          ) : (
            filteredPreventiveTasks.map(task => {
              const facilityName = facilities.find(f => f.id === task.facilityId)?.name || 'غير محدد';
              const subFacilityName = facilities.find(f => f.id === task.facilityId)?.subFacilities.find(sf => sf.id === task.subFacilityId)?.name || '';
              const freqLabel = frequencyLabels[task.frequency] || task.frequency;
              
              const isOverdue = task.status === 'OVERDUE' || (new Date(task.nextDueDate) < new Date() && task.status !== 'COMPLETED');

              return (
                <div key={task.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-2.5 py-1 bg-cyan-100 text-cyan-800 font-bold rounded-lg text-xs flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        صيانة دورية: {freqLabel}
                      </span>

                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        isOverdue ? 'bg-red-100 text-red-700' :
                        task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {isOverdue ? 'متأخرة' : task.status === 'COMPLETED' ? 'مكتملة' : 'مستحقة'}
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-slate-900 mb-1">
                      {facilityName} {subFacilityName ? ` - ${subFacilityName}` : ''}
                    </h4>

                    <p className="text-sm text-slate-600 mb-4 line-clamp-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {typeof task.description === 'object' ? JSON.stringify(task.description) : task.description}
                    </p>

                    <div className="mt-auto space-y-2 text-xs text-slate-500">
                      <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                        <span className="font-bold text-slate-700">تاريخ الاستحقاق القادم:</span>
                        <span className={`font-bold ${isOverdue ? 'text-red-600' : 'text-slate-800'}`}>
                          {formatDate(task.nextDueDate)}
                        </span>
                      </div>

                      {task.lastPerformed && (
                        <p><strong>آخر تنفيذ:</strong> {formatDate(task.lastPerformed)}</p>
                      )}

                      {task.requiresSpareParts && task.requiredParts && task.requiredParts.length > 0 && (
                        <div className="bg-amber-50 text-amber-800 p-2 rounded-lg border border-amber-200">
                          <strong className="block mb-1">قطع الغيار المطلوبة:</strong>
                          <ul className="list-disc list-inside space-y-0.5">
                            {task.requiredParts.map((p, idx) => {
                              const item = inventory.find(i => i.id === p.itemId);
                              return (
                                <li key={idx}>
                                  {item ? item.name : 'قطعة'} ({p.quantity} {item?.unit || 'قطع'})
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {task.notes && (
                        <p className="text-slate-500 italic">
                          <strong>ملاحظات:</strong> {typeof task.notes === 'object' ? JSON.stringify(task.notes) : task.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex gap-2">
                    <button 
                      onClick={() => {
                        setSelectedPreventiveTask(task);
                        setPreventiveNotes('');
                      }}
                      className="flex-1 flex items-center justify-center py-2 text-xs font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4 ml-1.5" />
                      إتمام وتحديث
                    </button>
                    <button 
                      onClick={() => printPreventiveReceipt(task)}
                      className="flex items-center justify-center p-2 text-xs text-slate-700 font-bold bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                      title="طباعة تقرير للصيانة الدورية"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Work Orders Section (PENDING / IN_PROGRESS / CLOSED) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
              <Wrench className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-slate-700">لا توجد طلبات في هذه القائمة حالياً.</p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const facilityName = facilities.find(f => f.id === order.facilityId)?.name || '';
              const subFacilityName = getSubFacilityName(facilities, order.facilityId, order.subFacilityId);
              const totalCost = (order.laborCost || 0) + (order.partsCost || 0);

              return (
                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                  {/* Images Header */}
                  {(order.image || order.imageAfter) && (
                    <div className="h-44 w-full bg-slate-900 relative flex">
                      {order.image && (
                        <div className="relative h-full flex-1 border-l border-slate-700">
                          <img src={order.image} alt="قبل الصيانة" className="w-full h-full object-cover" />
                          <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-bold backdrop-blur-sm">قبل الصيانة</span>
                        </div>
                      )}
                      {order.imageAfter && (
                        <div className="relative h-full flex-1">
                          <img src={order.imageAfter} alt="بعد الصيانة" className="w-full h-full object-cover" />
                          <span className="absolute bottom-1.5 right-1.5 bg-emerald-600/90 text-white text-[10px] px-2 py-0.5 rounded font-bold backdrop-blur-sm">بعد الصيانة</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-base text-slate-900 line-clamp-1 flex items-center gap-1.5">
                        {formatCode('WO', order.orderNumber)} - {order.title}
                        {order.priority && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
                            ${order.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                              order.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                              order.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {order.priority === 'CRITICAL' ? 'حرجة' : order.priority === 'HIGH' ? 'عالية' : order.priority === 'MEDIUM' ? 'متوسطة' : 'منخفضة'}
                          </span>
                        )}
                      </h4>
                      
                      <select 
                        value={order.status}
                        onChange={(e) => handleStatusChange(order, e.target.value as WorkOrderStatus)}
                        className={`text-xs font-bold rounded-full px-2 py-1 border-none outline-none cursor-pointer w-max
                          ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 focus:ring-yellow-500' : 
                            order.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 focus:ring-blue-500' : 
                            'bg-emerald-100 text-emerald-800 focus:ring-emerald-500'}`}
                      >
                        <option value="PENDING">قيد الانتظار</option>
                        <option value="IN_PROGRESS">جاري العمل</option>
                        <option value="CLOSED">مكتمل</option>
                      </select>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {order.maintenanceType?.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{t}</span>
                      ))}
                    </div>

                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{typeof order.description === 'object' ? JSON.stringify(order.description) : order.description}</p>
                    
                    <div className="mt-auto space-y-2 text-xs text-slate-500">
                      {currentUser?.role === 'SUPER_ADMIN' && order.assignedTo && (
                        <p><strong>الفنيين:</strong> {
                          (Array.isArray(order.assignedTo) ? order.assignedTo : [order.assignedTo])
                            .map(id => users.find(u => u.id === id)?.name)
                            .filter(Boolean)
                            .join('، ') || 'غير محدد'
                        }</p>
                      )}

                      {facilityName && (
                        <p><strong>الموقع:</strong> <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{facilityName}{subFacilityName ? ` - ${subFacilityName}` : ''}</span></p>
                      )}

                      <p><strong>الانتهاء المطلوب:</strong> {formatDate(order.deadline)}</p>
                      
                      {order.responseMessage && (
                        <div className="bg-emerald-50 text-emerald-900 p-2 rounded-lg border border-emerald-100">
                          <strong className="block text-xs text-emerald-700">ملاحظات الفني:</strong>
                          <p className="text-xs line-clamp-2">{order.responseMessage}</p>
                        </div>
                      )}

                      {order.status === 'CLOSED' && totalCost > 0 && (
                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200 text-slate-800 font-bold">
                          <span>إجمالي تكلفة التنفيذ:</span>
                          <span className="text-emerald-700">{totalCost} جنيه</span>
                        </div>
                      )}

                      {order.needsParts && (
                        <p className="text-orange-600"><strong>قطع الغيار:</strong> {order.requiredParts}</p>
                      )}
                      {order.needsSpecialEquipment && (
                        <p className="text-blue-600"><strong>معدات خاصة:</strong> {order.requiredEquipment}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex gap-2">
                    <button 
                      onClick={() => openOrderModal(order)}
                      className="flex-1 flex items-center justify-center py-2 text-xs text-emerald-700 font-bold bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
                    >
                      <FileText className="w-4 h-4 ml-1.5" />
                      {order.status === 'CLOSED' ? 'تفاصيل الإنجاز' : 'تحديث وتفاصيل'}
                    </button>
                    <button 
                      onClick={() => printReceipt(order)}
                      className="flex-1 flex items-center justify-center py-2 text-xs text-slate-700 font-bold bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                      title="طباعة إيصال الصيانة"
                    >
                      <Printer className="w-4 h-4 ml-1.5" />
                      طباعة إيصال
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Work Order Details/Update Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                طلب صيانة {formatCode('WO', selectedOrder.orderNumber)} - {selectedOrder.title}
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 text-sm">
              <div>
                <h4 className="text-xs font-bold text-slate-500 mb-1">وصف العطل</h4>
                <p className="text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">{typeof selectedOrder.description === 'object' ? JSON.stringify(selectedOrder.description) : selectedOrder.description}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">تسجيل استجابتك للطلب / ملاحظات التنفيذ</label>
                <textarea 
                  value={responseMsg} 
                  onChange={e => setResponseMsg(e.target.value)} 
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none h-24 text-sm"
                  placeholder="اكتب ماذا تم إنجازه..."
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تكلفة العمالة (جنيه)</label>
                  <input 
                    type="number" 
                    value={laborCost} 
                    onChange={e => setLaborCost(Number(e.target.value))} 
                    className="w-full px-3 py-2 border rounded-lg text-sm" 
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تكلفة قطع الغيار (جنيه)</label>
                  <input 
                    type="number" 
                    value={partsCost} 
                    onChange={e => setPartsCost(Number(e.target.value))} 
                    className="w-full px-3 py-2 border rounded-lg text-sm" 
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">إرفاق صورة بعد الصيانة (اختياري)</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full px-3 py-2 border rounded-lg bg-slate-50 text-xs" />
                {imageAfter && (
                  <div className="mt-2 h-36 relative rounded-lg overflow-hidden border border-slate-200">
                    <img src={imageAfter} alt="بعد الصيانة" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setImageAfter('')} 
                      className="absolute top-2 left-2 bg-red-100 text-red-600 p-1 rounded-full hover:bg-red-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end space-x-3 space-x-reverse bg-slate-50 rounded-b-xl">
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-bold text-sm"
              >
                إغلاق
              </button>
              <button 
                onClick={handleSaveResponse} 
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold shadow-sm text-sm"
              >
                حفظ الاستجابة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Preventive Task Modal */}
      {selectedPreventiveTask && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-cyan-600" />
                إتمام مهمة صيانة دورية
              </h3>
              <button onClick={() => setSelectedPreventiveTask(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="bg-cyan-50 p-3.5 rounded-lg border border-cyan-100">
                <p className="font-bold text-cyan-900 mb-1">
                  {facilities.find(f => f.id === selectedPreventiveTask.facilityId)?.name}
                </p>
                <p className="text-xs text-cyan-800">{typeof selectedPreventiveTask.description === 'object' ? JSON.stringify(selectedPreventiveTask.description) : selectedPreventiveTask.description}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات وتقرير المعاينة عند الإتمام</label>
                <textarea 
                  value={preventiveNotes}
                  onChange={e => setPreventiveNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none h-28 text-sm"
                  placeholder="اكتب أي ملاحظات أو فحص تم إنجازه..."
                ></textarea>
              </div>

              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                💡 عند التأكيد سيتم تسجيل تاريخ اليوم كآخر تنفيذ، وسيتم تلقائياً احتساب الموعد القادم بناءً على الدورية ({frequencyLabels[selectedPreventiveTask.frequency]}).
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end space-x-3 space-x-reverse bg-slate-50 rounded-b-xl">
              <button 
                onClick={() => setSelectedPreventiveTask(null)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-bold text-sm"
              >
                إغلاق
              </button>
              <button 
                onClick={handleCompletePreventiveTask}
                className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-bold shadow-sm text-sm"
              >
                تأكيد وإتمام الصيانة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

