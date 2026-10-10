import React, { useState } from 'react';
import { Package, Plus, Printer, Edit2, Trash2, ClipboardList, CheckCircle, Wrench, AlertTriangle, Check, Clock } from 'lucide-react';
import { useStore } from '../store';
import { InventoryItem, Custody } from '../types';
import { generateId, formatCode } from '../lib/utils';

export function Inventory() {
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, users, custodies, assignCustody, returnCustody, workOrders, updateWorkOrder } = useStore();
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'REQUESTS'>('INVENTORY');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState<number | ''>('');
  const [unit, setUnit] = useState('');
  const [type, setType] = useState<'CONSUMABLE' | 'EQUIPMENT'>('CONSUMABLE');
  const [validityDate, setValidityDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateInventoryItem({
        id: editingId,
        itemNumber: inventory.find(i => i.id === editingId)?.itemNumber,
        name,
        category,
        quantity,
        price: price === '' ? undefined : price,
        unit,
        type,
        validityDate: validityDate || undefined
      });
      setEditingId(null);
    } else {
      const nextItemNumber = inventory.length > 0 ? Math.max(...inventory.map(i => i.itemNumber || 0)) + 1 : 1;
      addInventoryItem({
        id: generateId(),
        itemNumber: nextItemNumber,
        name,
        category,
        quantity,
        price: price === '' ? undefined : price,
        unit,
        type,
        validityDate: validityDate || undefined
      });
    }
    setIsCreating(false);
    resetForm();
  };

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category);
    setQuantity(item.quantity);
    setPrice(item.price || '');
    setUnit(item.unit || '');
    setType(item.type);
    setValidityDate(item.validityDate || '');
    setIsCreating(true);
  };

  const resetForm = () => {
    setName('');
    setCategory('');
    setQuantity(0);
    setPrice('');
    setUnit('');
    setType('CONSUMABLE');
    setValidityDate('');
    setEditingId(null);
  };

  const printInventory = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      let rows = inventory.map(item => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ccc;">${item.name}</td>
          <td style="padding: 8px; border: 1px solid #ccc;">${item.category}</td>
          <td style="padding: 8px; border: 1px solid #ccc;">${item.quantity} ${item.unit || ''}</td>
          <td style="padding: 8px; border: 1px solid #ccc;">${item.type === 'CONSUMABLE' ? 'استهلاكي' : 'معدات'}</td>
        </tr>
      `).join('');

      printWindow.document.write(`
        <html dir="rtl" lang="ar">
          <head>
            <title>جرد المخزن</title>
            <style>
              body { font-family: sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background: #f1f5f9; padding: 8px; border: 1px solid #ccc; text-align: right; }
            </style>
          </head>
          <body>
            <h2 style="text-align: center;">تقرير جرد المخزن</h2>
            <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</p>
            <table>
              <thead>
                <tr>
                  <th>اسم الصنف</th>
                  <th>التصنيف</th>
                  <th>الكمية</th>
                  <th>النوع</th>
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

  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  const printCustodyReceipt = (custody: Custody) => {
    const item = inventory.find(i => i.id === custody.itemId);
    const user = users.find(u => u.id === custody.userId);
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow && item && user) {
      printWindow.document.write(`
        <html dir="rtl" lang="ar">
          <head>
            <title>محضر تسليم عهدة</title>
            <style>
              body { font-family: sans-serif; padding: 40px; line-height: 1.6; }
              h2 { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
              .content { font-size: 16px; margin-bottom: 40px; }
              .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
              .sign-box { text-align: center; width: 40%; }
            </style>
          </head>
          <body>
            <h2>محضر تسليم عهدة</h2>
            <div class="content">
              <p>إنه في يوم: <strong>${new Date(custody.assignedAt).toLocaleDateString('ar-EG')}</strong></p>
              <p>تم تسليم العهدة التالية إلى السيد / <strong>${user.name}</strong></p>
              <p>الصنف: <strong>${item.name}</strong></p>
              <p>التصنيف: <strong>${item.category}</strong></p>
              <p>رقم العهدة: <strong>${formatCode('CST', custody.custodyNumber)}</strong></p>
              <p><br/>وأقر أنا المستلم بأنني استلمت العهدة المذكورة أعلاه بحالة جيدة وأتعهد بالمحافظة عليها وإعادتها عند الطلب.</p>
            </div>
            <div class="signatures">
              <div class="sign-box">
                <p>توقيع المستلم</p>
                <p>.......................</p>
              </div>
              <div class="sign-box">
                <p>أمين المخزن / المدير</p>
                <p>.......................</p>
              </div>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleAssignCustody = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItemId && selectedUserId) {
      const item = inventory.find(i => i.id === selectedItemId);
      if (item && item.quantity > 0) {
        assignCustody({
          id: generateId(),
          itemId: selectedItemId,
          userId: selectedUserId,
          assignedAt: new Date().toISOString(),
          status: 'ACTIVE'
        });
        updateInventoryItem({ ...item, quantity: item.quantity - 1 });
        setSelectedItemId('');
        setSelectedUserId('');
      } else {
        alert('الصنف غير متوفر بالكمية الكافية.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">إدارة المخزن</h2>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('INVENTORY')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'INVENTORY' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Package className="w-4 h-4 inline-block ml-2" />
            المخزون والعهد
          </button>
          <button
            onClick={() => setActiveTab('REQUESTS')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'REQUESTS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'} relative`}
          >
            <Wrench className="w-4 h-4 inline-block ml-2" />
            طلبات القطع
            {workOrders.filter(w => w.needsParts && !w.partsSupplied).length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>

        {activeTab === 'INVENTORY' ? (
          <div className="flex space-x-2 space-x-reverse">
            <button
              onClick={printInventory}
              className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Printer className="w-5 h-5 ml-2" />
              طباعة الجرد
            </button>
            <button
              onClick={() => { resetForm(); setIsCreating(!isCreating); }}
              className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-5 h-5 ml-2" />
              إضافة صنف
            </button>
          </div>
        ) : <div />}
      </div>

      {activeTab === 'INVENTORY' ? (
        <>

      {isCreating && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold mb-4 border-b pb-2">{editingId ? 'تعديل صنف' : 'إضافة صنف جديد'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم الصنف</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">التصنيف</label>
                <input required type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="مثال: زيوت، فلاتر، أدوات..." className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الكمية</label>
                <input required type="number" min="0" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">السعر</label>
                <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0.00" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">وحدة القياس</label>
                <input type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="مثال: قطعة، متر، لتر..." className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">النوع</label>
                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="CONSUMABLE">مواد استهلاكية</option>
                  <option value="EQUIPMENT">معدات / أجهزة</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الصلاحية (اختياري)</label>
                <input type="date" value={validityDate} onChange={e => setValidityDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
              <button type="button" onClick={() => { setIsCreating(false); resetForm(); }} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50">إلغاء</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">{editingId ? 'تحديث الصنف' : 'حفظ الصنف'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
        {inventory.length === 0 ? (
          <div className="p-8 text-center text-slate-500">لا توجد أصناف في المخزن حالياً.</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">رقم الصنف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">اسم الصنف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">التصنيف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">السعر</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">الكمية</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">الوحدة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">النوع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {inventory.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{formatCode('INV', item.itemNumber)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{item.price ? `${item.price}` : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-bold">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{item.unit || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.type === 'CONSUMABLE' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                      {item.type === 'CONSUMABLE' ? 'استهلاكي' : 'معدات'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex space-x-2 space-x-reverse">
                    <button onClick={() => startEdit(item)} className="text-blue-600 hover:text-blue-900">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => setItemToDelete(item.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* العهد والمستلمين */}
      <div className="mt-8 border-t pt-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
          <ClipboardList className="w-6 h-6 ml-2" />
          إدارة العهد وتسليمها
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-4 border-b pb-2 text-slate-800">تسليم عهدة جديدة</h3>
            <form onSubmit={handleAssignCustody} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الموظف / الفني المستلم</label>
                <select required value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">-- اختر المستلم --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الصنف</label>
                <select required value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">-- اختر الصنف --</option>
                  {inventory.filter(i => i.quantity > 0).map(i => (
                    <option key={i.id} value={i.id}>{i.name} (المتاح: {i.quantity} {i.unit || ''})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex justify-center items-center">
                <CheckCircle className="w-5 h-5 ml-2" />
                تأكيد وتسليم العهدة
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <h3 className="text-lg font-bold mb-4 border-b pb-2 text-slate-800">سجل العهد المسلمة</h3>
            {custodies.length === 0 ? (
              <div className="text-center text-slate-500 py-8">لا توجد عهد مسلمة حالياً.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">المستلم</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">الصنف</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">تاريخ التسليم</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">الحالة</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {custodies.map(custody => {
                      const user = users.find(u => u.id === custody.userId);
                      const item = inventory.find(i => i.id === custody.itemId);
                      return (
                        <tr key={custody.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{user?.name || 'مستخدم غير معروف'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{item?.name || 'صنف غير معروف'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{new Date(custody.assignedAt).toLocaleDateString('ar-EG')}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${custody.status === 'ACTIVE' ? 'bg-yellow-100 text-yellow-800' : 'bg-emerald-100 text-emerald-800'}`}>
                              {custody.status === 'ACTIVE' ? 'في العهدة' : 'مستردة'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center space-x-2 space-x-reverse">
                            <button
                              onClick={() => printCustodyReceipt(custody)}
                              className="text-slate-600 hover:text-slate-900 bg-slate-100 p-1.5 rounded"
                              title="طباعة محضر التسليم"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            {custody.status === 'ACTIVE' && (
                              <button
                                onClick={() => {
                                  returnCustody(custody.id);
                                  if (item) {
                                    updateInventoryItem({ ...item, quantity: item.quantity + 1 });
                                  }
                                }}
                                className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 p-1.5 rounded border border-emerald-200"
                                title="استرداد العهدة للمخزن"
                              >
                                استرداد
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-2">تأكيد الحذف</h3>
            <p className="text-slate-600 mb-6">هل أنت متأكد من حذف هذا الصنف من المخزون؟ لا يمكن التراجع عن هذه العملية.</p>
            <div className="flex justify-end space-x-3 space-x-reverse">
              <button onClick={() => setItemToDelete(null)} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50">إلغاء</button>
              <button onClick={() => { deleteInventoryItem(itemToDelete); setItemToDelete(null); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">تأكيد الحذف</button>
            </div>
          </div>
        </div>
      )}
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <AlertTriangle className="w-5 h-5 ml-2 text-amber-500" />
              طلبات قطع الغيار من الصيانة
            </h3>
          </div>
          {workOrders.filter(w => w.needsParts).length === 0 ? (
            <div className="p-8 text-center text-slate-500">لا توجد طلبات قطع غيار حالياً.</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">رقم الطلب</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">القطع المطلوبة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">المُبلغ / الفني</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">الحالة</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">إجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {workOrders.filter(w => w.needsParts).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
                  <tr key={order.id} className={order.partsSupplied ? 'bg-slate-50' : 'bg-orange-50/30'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700">
                      {formatCode('WO', order.orderNumber)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      {order.requiredParts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {order.assignedTo?.map(id => users.find(u => u.id === id)?.name).join('، ') || 'غير معين'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {order.partsSupplied ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                          تم الصرف
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                          بانتظار الصرف
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {!order.partsSupplied && (
                        <button
                          onClick={() => updateWorkOrder({ ...order, partsSupplied: true })}
                          className="flex items-center justify-center px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors w-full"
                        >
                          <Check className="w-4 h-4 ml-1" />
                          تأكيد الصرف
                        </button>
                      )}
                      {order.partsSupplied && (
                        <button
                          onClick={() => updateWorkOrder({ ...order, partsSupplied: false })}
                          className="flex items-center justify-center px-3 py-1.5 text-slate-500 hover:text-slate-700 transition-colors w-full"
                        >
                          <Clock className="w-4 h-4 ml-1" />
                          تراجع
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
