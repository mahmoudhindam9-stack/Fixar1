import React, { useState } from 'react';
import { useStore } from '../store';
import { PreventiveMaintenanceTask, PreventiveMaintenanceFrequency, TaskPart, Facility, SubFacility } from '../types';
import { generateId, formatDate, flattenSubFacilities, getSubFacilityName, formatCode } from '../lib/utils';
import { Plus, Check, Clock, Calendar, Search, Edit2, Trash2, Settings, X, LayoutGrid, List, Network, ArrowUp, ArrowDown, QrCode, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export function PreventiveMaintenance() {
  const { preventiveTasks, users, facilities, inventory, addPreventiveTask, updatePreventiveTask, deletePreventiveTask, addFacility, updateFacility, deleteFacility } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'facilities' | 'treeMap'>('tasks');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Confirmation modals states
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [facilityToDelete, setFacilityToDelete] = useState<string | null>(null);
  const [subFacilityToDelete, setSubFacilityToDelete] = useState<number[] | null>(null);
  const [qrModalData, setQrModalData] = useState<{name: string, facilityId: string, subFacilityId: string} | null>(null);

  // Facilities Management
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);

  // Form states
  const [facilityId, setFacilityId] = useState('');
  const [subFacilityId, setSubFacilityId] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<PreventiveMaintenanceFrequency>('MONTHLY');
  const [nextDueDate, setNextDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [requiresSpareParts, setRequiresSpareParts] = useState(false);
  const [requiredParts, setRequiredParts] = useState<TaskPart[]>([]);

  const [searchTerm, setSearchTerm] = useState('');

  const technicians = users.filter(u => u.role === 'TECHNICIAN' || u.role === 'SUPER_ADMIN');

  const selectedFacilityObj = facilities.find(f => f.id === facilityId);
  const flattenedSelectedSubFacilities = selectedFacilityObj ? flattenSubFacilities(selectedFacilityObj.subFacilities) : [];

  const resetForm = () => {
    setFacilityId('');
    setSubFacilityId('');
    setDescription('');
    setFrequency('MONTHLY');
    setNextDueDate('');
    setAssignedTo('');
    setNotes('');
    setRequiresSpareParts(false);
    setRequiredParts([]);
    setEditingId(null);
    setIsCreating(false);
  };

  const startEdit = (task: PreventiveMaintenanceTask) => {
    setEditingId(task.id);
    setFacilityId(task.facilityId || '');
    setSubFacilityId(task.subFacilityId || '');
    setDescription(task.description);
    setFrequency(task.frequency);
    setNextDueDate(task.nextDueDate);
    setAssignedTo(task.assignedTo || '');
    setNotes(task.notes || '');
    setRequiresSpareParts(task.requiresSpareParts || false);
    setRequiredParts(task.requiredParts || []);
    setIsCreating(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const task = preventiveTasks.find(t => t.id === editingId);
      if (task) {
        updatePreventiveTask({
          ...task,
          facilityId,
          subFacilityId,
          description,
          frequency,
          nextDueDate,
          assignedTo,
          notes,
          requiresSpareParts,
          requiredParts: requiresSpareParts ? requiredParts : []
        });
      }
    } else {
      addPreventiveTask({
        id: generateId(),
        facilityId,
        subFacilityId,
        description,
        frequency,
        nextDueDate,
        assignedTo,
        status: 'PENDING',
        notes,
        requiresSpareParts,
        requiredParts: requiresSpareParts ? requiredParts : []
      });
    }
    resetForm();
  };

  const markCompleted = (task: PreventiveMaintenanceTask) => {
    const today = new Date().toISOString();
    let nextDate = new Date();
    switch (task.frequency) {
      case 'DAILY': nextDate.setDate(nextDate.getDate() + 1); break;
      case 'WEEKLY': nextDate.setDate(nextDate.getDate() + 7); break;
      case 'MONTHLY': nextDate.setMonth(nextDate.getMonth() + 1); break;
      case 'QUARTERLY': nextDate.setMonth(nextDate.getMonth() + 3); break;
      case 'YEARLY': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
    }
    
    updatePreventiveTask({
      ...task,
      status: 'COMPLETED',
      lastPerformed: today,
      nextDueDate: nextDate.toISOString().split('T')[0]
    });
  };

  const frequencyLabels: Record<PreventiveMaintenanceFrequency, string> = {
    DAILY: 'يومي',
    WEEKLY: 'أسبوعي',
    MONTHLY: 'شهري',
    QUARTERLY: 'ربع سنوي',
    YEARLY: 'سنوي'
  };

  const filteredTasks = preventiveTasks.filter(t => {
    const fName = facilities.find(f => f.id === t.facilityId)?.name || '';
    const sfName = getSubFacilityName(facilities, t.facilityId, t.subFacilityId);
    return fName.includes(searchTerm) || sfName.includes(searchTerm) || t.description.includes(searchTerm);
  });

  const handleAddPart = () => {
    setRequiredParts([...requiredParts, { itemId: '', quantity: 1 }]);
  };

  const handlePartChange = (index: number, field: keyof TaskPart, value: any) => {
    const newParts = [...requiredParts];
    newParts[index] = { ...newParts[index], [field]: value };
    setRequiredParts(newParts);
  };

  const handleRemovePart = (index: number) => {
    setRequiredParts(requiredParts.filter((_, i) => i !== index));
  };

  const renderTree = (subFacilities: SubFacility[], parentPath: string = '', showQRCode: boolean = false, rootFacilityId: string = '') => {
    if (!subFacilities || subFacilities.length === 0) return null;
    return (
      <div className="mr-6 border-r-2 border-slate-200">
        {subFacilities.map((sf, idx) => {
          const currentPath = parentPath ? `${parentPath} - ${sf.name}` : sf.name;
          return (
          <div key={`${sf.id}-${idx}`} className="relative">
            <div className="absolute top-6 right-0 w-8 h-[2px] bg-slate-200"></div>
            <div className="pt-2 pr-10 pb-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm font-bold text-slate-800 transition-all hover:border-emerald-400 hover:shadow-md">
                <span>{typeof sf.name === 'object' ? JSON.stringify(sf.name) : (sf.name || 'بدون اسم')}</span>
                {showQRCode && (
                  <button 
                    onClick={() => setQrModalData({ name: currentPath, facilityId: rootFacilityId, subFacilityId: sf.id })}
                    className="mr-2 text-slate-400 hover:text-emerald-600 transition-colors bg-slate-50 p-1 rounded-md border border-slate-200"
                    title="توليد كود QR"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                )}
              </div>
              {renderTree(sf.children || [], currentPath, showQRCode, rootFacilityId)}
            </div>
          </div>
        )})}
      </div>
    );
  };

  // Facility Management functions
  const handleSaveFacility = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFacility) {
      if (facilities.find(f => f.id === editingFacility.id)) {
        updateFacility(editingFacility);
      } else {
        addFacility(editingFacility);
      }
      setEditingFacility(null);
    }
  };

  const updateSubFacilityByPath = (sfs: SubFacility[], path: number[], updater: (sf: SubFacility) => SubFacility | null): SubFacility[] => {
    if (path.length === 0) return sfs;
    const [currentIndex, ...restPath] = path;
    
    const newSfs = [...sfs];
    
    if (restPath.length === 0) {
      // We reached the target node
      const updatedNode = updater(newSfs[currentIndex]);
      if (updatedNode === null) {
        // Delete this node
        newSfs.splice(currentIndex, 1);
      } else {
        newSfs[currentIndex] = updatedNode;
      }
    } else {
      // Traverse deeper
      const childNode = newSfs[currentIndex];
      newSfs[currentIndex] = {
        ...childNode,
        children: updateSubFacilityByPath(childNode.children || [], restPath, updater)
      };
    }
    
    return newSfs;
  };

  const moveSubFacilityByPath = (sfs: SubFacility[], path: number[], direction: 'up' | 'down'): SubFacility[] => {
    if (path.length === 0) return sfs;
    const [currentIndex, ...restPath] = path;
    
    const newSfs = [...sfs];
    
    if (restPath.length === 0) {
      if (direction === 'up' && currentIndex > 0) {
        const temp = newSfs[currentIndex];
        newSfs[currentIndex] = newSfs[currentIndex - 1];
        newSfs[currentIndex - 1] = temp;
      } else if (direction === 'down' && currentIndex < newSfs.length - 1) {
        const temp = newSfs[currentIndex];
        newSfs[currentIndex] = newSfs[currentIndex + 1];
        newSfs[currentIndex + 1] = temp;
      }
    } else {
      const childNode = newSfs[currentIndex];
      newSfs[currentIndex] = {
        ...childNode,
        children: moveSubFacilityByPath(childNode.children || [], restPath, direction)
      };
    }
    
    return newSfs;
  };

  const renderSubFacilitiesEditor = (subFacilities: SubFacility[], path: number[] = []) => {
    if (!editingFacility) return null;
    
    return (
      <div className="space-y-2 mt-2">
        {subFacilities.length === 0 && path.length === 0 && (
          <p className="text-xs text-slate-400">لا توجد تفرعات مضافة.</p>
        )}
        {subFacilities.map((sf, index) => {
          const currentPath = [...path, index];
          return (
            <div key={`${sf.id}-${index}`} className="relative">
              <div className="flex items-center gap-2">
                <div className="w-4 border-b-2 border-l-2 border-slate-300 h-4 rounded-bl -mt-4 mr-1"></div>
                <input 
                  type="text" required
                  value={sf.name} 
                  onChange={e => {
                    const newSFs = updateSubFacilityByPath(editingFacility.subFacilities, currentPath, (node) => ({...node, name: e.target.value}));
                    setEditingFacility({...editingFacility, subFacilities: newSFs});
                  }}
                  className="flex-1 px-3 py-1.5 text-sm border rounded-lg bg-white"
                  placeholder="اسم التفرع"
                />
                <button 
                  type="button" 
                  onClick={() => {
                    const newSFs = updateSubFacilityByPath(editingFacility.subFacilities, currentPath, (node) => ({
                      ...node,
                      children: [...(node.children || []), { id: generateId(), name: '', children: [] }]
                    }));
                    setEditingFacility({...editingFacility, subFacilities: newSFs});
                  }}
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                  title="إضافة تفرع فرعي"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newSFs = moveSubFacilityByPath(editingFacility.subFacilities, currentPath, 'up');
                    setEditingFacility({...editingFacility, subFacilities: newSFs});
                  }}
                  disabled={index === 0}
                  className={`p-1.5 rounded ${index === 0 ? 'text-slate-300' : 'text-blue-500 hover:bg-blue-50'}`}
                  title="تحريك لأعلى"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newSFs = moveSubFacilityByPath(editingFacility.subFacilities, currentPath, 'down');
                    setEditingFacility({...editingFacility, subFacilities: newSFs});
                  }}
                  disabled={index === subFacilities.length - 1}
                  className={`p-1.5 rounded ${index === subFacilities.length - 1 ? 'text-slate-300' : 'text-blue-500 hover:bg-blue-50'}`}
                  title="تحريك لأسفل"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setSubFacilityToDelete(currentPath);
                  }}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {sf.children && sf.children.length > 0 && (
                <div className="mr-6 border-r-2 border-slate-100 pr-2 pb-2">
                  {renderSubFacilitiesEditor(sf.children, currentPath)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const getFullSubFacilityName = (facilityId: string, subFacilityId?: string) => {
    if (!subFacilityId) return null;
    const facility = facilities.find(f => f.id === facilityId);
    if (!facility) return null;
    const flattened = flattenSubFacilities(facility.subFacilities);
    return flattened.find(sf => sf.id === subFacilityId)?.name;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">نظام الصيانة الدورية</h2>
          <p className="text-slate-500 text-sm mt-1">إدارة وجدولة صيانة مرافق ومنشآت النادي</p>
        </div>
        <div className="flex space-x-3 space-x-reverse flex-wrap gap-y-2">
          {activeTab === 'tasks' && (
            <>
              <div className="relative">
                <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="بحث في المهام..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              
              <div className="flex bg-white rounded-lg border border-slate-300 overflow-hidden shadow-sm mr-2">
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
                جدولة مهمة جديدة
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'tasks' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          مهام الصيانة
        </button>
        <button
          onClick={() => setActiveTab('facilities')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'facilities' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          إدارة المنشآت
        </button>
        <button
          onClick={() => setActiveTab('treeMap')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'treeMap' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          خريطة المنشآت
        </button>
      </div>

      {activeTab === 'tasks' && isCreating && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold mb-4 border-b pb-2">{editingId ? 'تعديل المهمة' : 'جدولة مهمة صيانة دورية'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">المنشأة / المرفق الرئيسي</label>
                <select required value={facilityId} onChange={e => { setFacilityId(e.target.value); setSubFacilityId(''); }} className="w-full px-3 py-2 border rounded-lg bg-white">
                  <option value="">اختر المرفق</option>
                  {facilities.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                </select>
              </div>

              {selectedFacilityObj && selectedFacilityObj.subFacilities.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تفرع المنشأة (اختياري)</label>
                  <select value={subFacilityId} onChange={e => setSubFacilityId(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white">
                    <option value="">المنشأة بالكامل / غير محدد</option>
                    {flattenedSelectedSubFacilities.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">معدل التكرار</label>
                <select required value={frequency} onChange={e => setFrequency(e.target.value as PreventiveMaintenanceFrequency)} className="w-full px-3 py-2 border rounded-lg bg-white">
                  {Object.entries(frequencyLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">وصف المهمة (الإجراءات المطلوبة)</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows={2} placeholder="مثال: تنظيف فلاتر التكييف، فحص نسبة الكلور، تشحيم أجهزة الجري..."></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ التنفيذ القادم</label>
                <input required type="date" value={nextDueDate} onChange={e => setNextDueDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">إسناد إلى فني (اختياري)</label>
                <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white">
                  <option value="">غير محدد</option>
                  {technicians.map(t => <option key={t.id} value={t.id}>{t.name} ({t.specialty || 'عام'})</option>)}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات إضافية (أدوات مطلوبة، تعليمات خاصة)</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>

              <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                  <input type="checkbox" checked={requiresSpareParts} onChange={e => setRequiresSpareParts(e.target.checked)} className="rounded text-emerald-600 focus:ring-emerald-500 w-5 h-5" />
                  <span className="font-semibold text-slate-800 text-sm">هل تحتاج هذه المهمة لقطع غيار من المخزن؟</span>
                </label>
                
                {requiresSpareParts && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-slate-600">اختر قطع الغيار والكميات التقديرية المطلوبة لهذه المهمة الدورية:</p>
                    {requiredParts.map((part, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <select 
                          required
                          value={part.itemId} 
                          onChange={e => handlePartChange(index, 'itemId', e.target.value)} 
                          className="flex-1 px-3 py-2 border rounded-lg bg-white text-sm"
                        >
                          <option value="">اختر الصنف من المخزن...</option>
                          {inventory.map(item => (
                            <option key={item.id} value={item.id}>{item.name} (متوفر: {item.quantity} {item.unit})</option>
                          ))}
                        </select>
                        <input 
                          type="number" 
                          required min="1" 
                          value={part.quantity} 
                          onChange={e => handlePartChange(index, 'quantity', Number(e.target.value))} 
                          className="w-24 px-3 py-2 border rounded-lg text-sm" 
                          placeholder="الكمية"
                        />
                        <button type="button" onClick={() => handleRemovePart(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={handleAddPart} className="text-sm flex items-center text-emerald-600 hover:text-emerald-700 font-semibold mt-2">
                      <Plus className="w-4 h-4 ml-1" /> إضافة قطعة غيار أخرى
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
              <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50">إلغاء</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">{editingId ? 'حفظ التعديلات' : 'جدولة المهمة'}</button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'facilities' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h3 className="text-xl font-bold text-slate-900">إدارة المنشآت والتفرعات المتشعبة</h3>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3 border-l pl-4">
              <button 
                onClick={() => setEditingFacility({ id: generateId(), name: '', subFacilities: [] })}
                className="w-full flex items-center justify-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors mb-4"
              >
                <Plus className="w-4 h-4 ml-2" /> منشأة جديدة
              </button>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {facilities.map(f => {
                  const totalBranches = flattenSubFacilities(f.subFacilities).length;
                  return (
                    <div 
                      key={f.id} 
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${editingFacility?.id === f.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}
                      onClick={() => setEditingFacility({...f})}
                    >
                      <div className="font-bold text-slate-800">{f.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{totalBranches} تفرعات</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="md:w-2/3">
              {editingFacility ? (
                <form onSubmit={handleSaveFacility} className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-200 min-h-[400px] flex flex-col">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">اسم المنشأة الرئيسية</label>
                    <input 
                      type="text" required
                      value={editingFacility.name} 
                      onChange={e => setEditingFacility({...editingFacility, name: e.target.value})} 
                      className="w-full px-4 py-2 border rounded-lg text-lg font-bold text-slate-800 bg-white"
                      placeholder="مثال: المبنى الإداري"
                    />
                  </div>
                  <div className="flex-1 border-t border-slate-200 pt-4 mt-2">
                    <div className="flex justify-between items-center mb-4 bg-slate-100 p-2 rounded-lg border border-slate-200">
                      <label className="block text-sm font-bold text-slate-700">شجرة التفرعات (الأقسام / الغرف)</label>
                      <button 
                        type="button" 
                        onClick={() => setEditingFacility({
                          ...editingFacility, 
                          subFacilities: [...editingFacility.subFacilities, { id: generateId(), name: '', children: [] }]
                        })}
                        className="text-sm flex items-center bg-white px-3 py-1 rounded border shadow-sm text-emerald-600 hover:bg-emerald-50 font-bold"
                      >
                        <Plus className="w-4 h-4 ml-1" /> إضافة تفرع رئيسي
                      </button>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-inner max-h-[40vh] overflow-y-auto mb-4">
                      {renderSubFacilitiesEditor(editingFacility.subFacilities)}
                    </div>
                    
                    <div className="border-t border-slate-200 pt-4">
                      <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
                        <Network className="w-5 h-5 ml-2 text-slate-400" />
                        المخطط الشجري للمنشأة
                      </h4>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 overflow-x-auto min-h-[150px] max-h-[30vh] overflow-y-auto" dir="rtl">
                        <div className="inline-block px-6 py-2 bg-emerald-600 text-white rounded-lg shadow-md text-sm font-bold mb-2">
                          {editingFacility.name || 'المنشأة الرئيسية'}
                        </div>
                        {renderTree(editingFacility.subFacilities)}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 space-x-reverse pt-4 border-t mt-auto">
                    {facilities.find(f => f.id === editingFacility.id) && (
                      <button 
                        type="button" 
                        onClick={() => {
                          setFacilityToDelete(editingFacility.id);
                        }} 
                        className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg ml-auto font-bold"
                      >
                        حذف المنشأة
                      </button>
                    )}
                    <button type="submit" className="px-6 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold shadow-sm">حفظ المنشأة وشجرة التفرعات</button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 p-12 text-center border-2 border-dashed rounded-xl bg-slate-50">
                  <div className="flex flex-col items-center gap-2">
                    <Settings className="w-12 h-12 text-slate-300" />
                    <p className="text-lg">اختر منشأة من القائمة لعرض وتعديل تفرعاتها</p>
                    <p className="text-sm">أو قم بإضافة منشأة جديدة وبناء شجرة متكاملة من الأقسام</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col space-y-4"}>
        {filteredTasks.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
            لا توجد مهام صيانة دورية مجدولة. قم بإضافة مهام جديدة للحفاظ على كفاءة مرافق النادي.
          </div>
        ) : (
          filteredTasks.sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()).map(task => {
            const isOverdue = new Date(task.nextDueDate).getTime() < new Date().setHours(0,0,0,0);
            const assignedUser = users.find(u => u.id === task.assignedTo);
            const facilityName = facilities.find(f => f.id === task.facilityId)?.name || 'غير معروف';
            const subFacilityName = getFullSubFacilityName(task.facilityId, task.subFacilityId);
            
            return (
              <div key={task.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden flex ${viewMode === 'grid' ? 'flex-col' : 'flex-row items-stretch'} ${isOverdue ? 'border-red-300' : 'border-slate-200'}`}>
                <div className={`${viewMode === 'grid' ? 'px-5 py-3 border-b flex justify-between items-center' : 'w-1/4 p-5 border-l flex flex-col justify-center'} ${isOverdue ? 'bg-red-50 text-red-800' : 'bg-slate-50 text-slate-800'}`}>
                  <h4 className="font-bold flex flex-col">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      {facilityName}
                    </span>
                    {subFacilityName && <span className="text-xs opacity-75 mt-1 mr-6 whitespace-nowrap overflow-hidden text-ellipsis" title={subFacilityName}>{subFacilityName}</span>}
                  </h4>
                  <span className={`text-xs font-semibold px-2 py-1 bg-white rounded-full border shadow-sm whitespace-nowrap mr-2 w-max ${viewMode === 'list' ? 'mt-3' : ''}`}>
                    {frequencyLabels[task.frequency]}
                  </span>
                </div>
                
                <div className={`p-5 flex-1 flex ${viewMode === 'grid' ? 'flex-col' : 'flex-row items-center gap-6'}`}>
                  <div className={`flex-1 ${viewMode === 'grid' ? 'mb-4' : ''}`}>
                    <p className="text-sm text-slate-700 font-medium font-mono">{formatCode('PMT', task.taskNumber)} - <span className="font-sans">{typeof task.description === 'object' ? JSON.stringify(task.description) : task.description}</span></p>
                    {task.notes && (
                      <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded">
                        <span className="font-semibold block mb-1">ملاحظات:</span>
                        {typeof task.notes === 'object' ? JSON.stringify(task.notes) : task.notes}
                      </p>
                    )}
                  </div>
                  
                  <div className={`space-y-2 text-sm text-slate-600 ${viewMode === 'list' ? 'w-1/3' : 'mt-auto'}`}>
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`} />
                      <span className={isOverdue ? 'text-red-600 font-bold' : ''}>
                        الموعد: {formatDate(task.nextDueDate)}
                        {isOverdue && ' (متأخر)'}
                      </span>
                    </div>
                    {task.lastPerformed && (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>آخر تنفيذ: {formatDate(task.lastPerformed)}</span>
                      </div>
                    )}
                    {assignedUser && (
                      <div className="flex items-center gap-2 pt-2 border-t mt-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                          {assignedUser.name.charAt(0)}
                        </span>
                        <span>{assignedUser.name}</span>
                      </div>
                    )}
                    {task.requiresSpareParts && task.requiredParts && task.requiredParts.length > 0 && viewMode === 'grid' && (
                      <div className="pt-2 border-t mt-2">
                        <span className="font-semibold text-xs text-slate-800 block mb-1">قطع الغيار المطلوبة:</span>
                        <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                          {task.requiredParts.map((part, i) => {
                            const item = inventory.find(inv => inv.id === part.itemId);
                            return (
                              <li key={`${task.id}-part-${i}`}>{item?.name || 'غير معروف'} ({part.quantity})</li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className={`${viewMode === 'grid' ? 'bg-slate-50 px-5 py-3 border-t' : 'bg-slate-50 px-4 py-5 border-r w-48'} border-slate-200 flex ${viewMode === 'grid' ? 'justify-between items-center gap-2' : 'flex-col gap-2 justify-center'}`}>
                  <button 
                    onClick={() => markCompleted(task)}
                    className="flex-1 flex items-center justify-center py-2 px-3 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg text-sm font-bold transition-colors shadow-sm"
                  >
                    <Check className="w-4 h-4 ml-1" /> تم التنفيذ
                  </button>
                  <div className={`flex gap-2 ${viewMode === 'list' ? 'justify-center w-full mt-2' : ''}`}>
                    <button onClick={() => startEdit(task)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex-1 flex justify-center bg-white border border-slate-200">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => {
                      setTaskToDelete(task.id);
                    }} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex-1 flex justify-center bg-white border border-slate-200">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
      )}
      {activeTab === 'treeMap' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-x-auto min-h-[60vh]">
          <div className="mb-6 border-b pb-4">
            <h3 className="text-xl font-bold text-slate-900 flex items-center">
              <Network className="w-6 h-6 ml-2 text-emerald-600" />
              الخريطة الهيكلية للمنشآت
            </h3>
            <p className="text-sm text-slate-500 mt-2">عرض شامل لجميع المرافق والتفرعات داخل النادي.</p>
          </div>
          
          <div className="flex flex-col space-y-8 p-4">
            {facilities.length === 0 ? (
               <div className="text-center text-slate-500 py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                 لا توجد منشآت مضافة بعد. يرجى إضافة منشآت من علامة تبويب "إدارة المنشآت".
               </div>
            ) : (
              facilities.map(facility => (
                <div key={facility.id} className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
                  <div className="flex items-center gap-3 mb-6 pb-2 border-b-2 border-slate-200 w-fit px-4">
                    <h4 className="text-xl font-bold text-slate-800">
                      {facility.name}
                    </h4>
                    <button 
                      onClick={() => setQrModalData({ name: facility.name, facilityId: facility.id, subFacilityId: '' })}
                      className="text-slate-400 hover:text-emerald-600 transition-colors bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm"
                      title="توليد كود QR"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="mr-4">
                    {facility.subFacilities && facility.subFacilities.length > 0 ? (
                      <div dir="rtl">
                        {renderTree(facility.subFacilities, facility.name, true, facility.id)}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm px-4">لا توجد تفرعات لهذه المنشأة</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      {taskToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-2">تأكيد الحذف</h3>
            <p className="text-slate-600 mb-6">هل أنت متأكد من حذف هذه المهمة الدورية؟</p>
            <div className="flex justify-end space-x-3 space-x-reverse">
              <button onClick={() => setTaskToDelete(null)} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50">إلغاء</button>
              <button onClick={() => { deletePreventiveTask(taskToDelete); setTaskToDelete(null); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">تأكيد الحذف</button>
            </div>
          </div>
        </div>
      )}

      {facilityToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-2">تأكيد الحذف</h3>
            <p className="text-slate-600 mb-6">هل أنت متأكد من حذف المنشأة بالكامل؟ جميع التفرعات ستُحذف.</p>
            <div className="flex justify-end space-x-3 space-x-reverse">
              <button onClick={() => setFacilityToDelete(null)} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50">إلغاء</button>
              <button onClick={() => { 
                deleteFacility(facilityToDelete); 
                setEditingFacility(null);
                setFacilityToDelete(null); 
              }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">تأكيد الحذف</button>
            </div>
          </div>
        </div>
      )}

      {subFacilityToDelete && editingFacility && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-2">تأكيد الحذف</h3>
            <p className="text-slate-600 mb-6">هل أنت متأكد من حذف هذا التفرع وما بداخله؟</p>
            <div className="flex justify-end space-x-3 space-x-reverse">
              <button onClick={() => setSubFacilityToDelete(null)} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50">إلغاء</button>
              <button onClick={() => { 
                const newSFs = updateSubFacilityByPath(editingFacility.subFacilities, subFacilityToDelete, () => null);
                setEditingFacility({...editingFacility, subFacilities: newSFs});
                setSubFacilityToDelete(null);
              }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">تأكيد الحذف</button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModalData && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full relative">
            <button 
              onClick={() => setQrModalData(null)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-black text-slate-800 mb-2">رمز الاستجابة السريعة</h3>
              <p className="text-sm text-slate-500 font-bold px-4">{qrModalData.name}</p>
            </div>
            
            <div id="qr-print-area" className="flex flex-col items-center justify-center bg-white p-6 border-2 border-slate-100 rounded-2xl mb-6">
              <div className="mb-4 text-center font-bold text-slate-800 text-lg">
                {qrModalData.name}
              </div>
              <QRCodeSVG 
                value={`${window.location.origin}/?public_request=true&location=${encodeURIComponent(qrModalData.name)}&facilityId=${qrModalData.facilityId}&subFacilityId=${qrModalData.subFacilityId}`} 
                size={220} 
                level="M"
                includeMargin={true}
              />
              <div className="mt-4 text-xs text-slate-500 text-center font-medium">
                امسح الرمز لتقديم بلاغ صيانة لهذا الموقع
              </div>
            </div>

            <button 
              onClick={() => {
                const printContents = document.getElementById('qr-print-area')?.innerHTML;
                const originalContents = document.body.innerHTML;
                if (printContents) {
                  document.body.innerHTML = `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; padding: 20px; text-align: center; font-family: sans-serif;">${printContents}</div>`;
                  window.print();
                  document.body.innerHTML = originalContents;
                  window.location.reload();
                }
              }}
              className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              طباعة الرمز
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
