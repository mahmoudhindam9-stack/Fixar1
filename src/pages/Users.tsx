import React, { useState, useMemo } from 'react';
import { 
  Plus, Printer, Trash2, Edit2, Shield, Users as UsersIcon, Check, X, 
  Eye, EyeOff, Copy, Key, FileText, Search, Filter, Download, UserX, 
  UserCheck, RefreshCw, AlertCircle, Calendar, ShieldAlert, Lock, Unlock, 
  Info, Activity
} from 'lucide-react';
import { useStore } from '../store';
import { Role, CustomRole, Permission, User } from '../types';
import { generateId, formatCode } from '../lib/utils';

export function Users() {
  const { 
    users, addUser, updateUser, deleteUser, currentUser,
    customRoles, addRole, updateRole, deleteRole,
    systemPermissions, addPermission, deletePermission,
    clearAllUsers, auditLogs, clearAuditLogs
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions' | 'audit'>('users');
  
  // User Filtering & Search
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // User State & Forms
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [showClearUsersConfirm, setShowClearUsersConfirm] = useState(false);
  const [userFormError, setUserFormError] = useState('');

  // User Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('TECHNICIAN');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [specialty, setSpecialty] = useState('');
  
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);

  // Audit Logs Filtering & Search
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<string>('ALL');
  const [showClearAuditConfirm, setShowClearAuditConfirm] = useState(false);

  // Role State
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [roleName, setRoleName] = useState('');
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

  // Permission State
  const [isCreatingPermission, setIsCreatingPermission] = useState(false);
  const [permissionToDelete, setPermissionToDelete] = useState<string | null>(null);
  const [permId, setPermId] = useState('');
  const [permName, setPermName] = useState('');
  const [permLabel, setPermLabel] = useState('');

  // Helpers
  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200' };
    if (pwd.length < 4) return { score: 1, label: 'ضعيفة جداً', color: 'bg-red-500' };
    if (pwd.length < 7) return { score: 2, label: 'ضعيفة', color: 'bg-orange-500' };
    const hasNum = /[0-9]/.test(pwd);
    const hasChar = /[a-zA-Z]/.test(pwd);
    const hasSymbol = /[^a-zA-Z0-9]/.test(pwd);
    if (hasNum && hasChar && hasSymbol && pwd.length >= 8) {
      return { score: 4, label: 'قوية جداً 🛡️', color: 'bg-emerald-600' };
    }
    if ((hasNum && hasChar) || pwd.length >= 8) {
      return { score: 3, label: 'متوسطة القوة', color: 'bg-amber-500' };
    }
    return { score: 2, label: 'ضعيفة', color: 'bg-orange-500' };
  };

  const getRoleName = (roleId: string) => {
    const custom = customRoles.find(r => r.id === roleId);
    if (custom) return custom.name;
    const rolesInArabic: Record<string, string> = {
      SUPER_ADMIN: 'مدير نظام',
      RECEPTION: 'مكتب استقبال',
      TECHNICIAN: 'فني صيانة',
      HR_MANAGER: 'مدير موارد بشرية',
      INVENTORY_MANAGER: 'أمين مخزن',
      FINANCE_MANAGER: 'مدير مالي'
    };
    return rolesInArabic[roleId] || roleId;
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = 
        u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(userSearchQuery)) ||
        formatCode('USR', u.userNumber).toLowerCase().includes(userSearchQuery.toLowerCase());
      
      const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
      const matchStatus = userStatusFilter === 'ALL' || (u.status || 'ACTIVE') === userStatusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, userSearchQuery, userRoleFilter, userStatusFilter]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchSearch = 
        log.userName.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(auditSearchQuery.toLowerCase());
      
      const matchCategory = auditCategoryFilter === 'ALL' || log.category === auditCategoryFilter;

      return matchSearch && matchCategory;
    });
  }, [auditLogs, auditSearchQuery, auditCategoryFilter]);

  // Submit User
  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError('');

    // Check username uniqueness
    const existing = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.id !== editingUserId);
    if (existing) {
      setUserFormError('اسم المستخدم موجود بالفعل، يرجى اختيار اسم مستخدم آخر.');
      return;
    }

    if (editingUserId) {
      updateUser({
        id: editingUserId,
        userNumber: users.find(u => u.id === editingUserId)?.userNumber,
        username: username.trim(),
        password,
        name: name.trim(),
        role,
        phone,
        phone2,
        email: email.trim() || undefined,
        status,
        specialty: role === 'TECHNICIAN' ? specialty : undefined,
        updatedAt: new Date().toISOString()
      });
    } else {
      const nextUserNumber = users.length > 0 ? Math.max(...users.map(u => u.userNumber || 0)) + 1 : 1;
      addUser({
        id: generateId(),
        userNumber: nextUserNumber,
        username: username.trim(),
        password,
        name: name.trim(),
        role,
        phone,
        phone2,
        email: email.trim() || undefined,
        status: status || 'ACTIVE',
        specialty: role === 'TECHNICIAN' ? specialty : undefined,
        createdAt: new Date().toISOString()
      });
    }
    setIsCreatingUser(false);
    setEditingUserId(null);
    resetUserForm();
  };

  const resetUserForm = () => {
    setUsername(''); setPassword(''); setName(''); setPhone(''); setPhone2(''); setEmail(''); setSpecialty(''); setStatus('ACTIVE'); setUserFormError('');
  };

  const startEditUser = (u: User) => {
    setEditingUserId(u.id);
    setUsername(u.username);
    setPassword(u.password || '');
    setName(u.name);
    setRole(u.role);
    setPhone(u.phone || '');
    setPhone2(u.phone2 || '');
    setEmail(u.email || '');
    setStatus(u.status || 'ACTIVE');
    setSpecialty(u.specialty || '');
    setUserFormError('');
    setIsCreatingUser(true);
  };

  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToResetPassword || !newResetPassword) return;
    updateUser({
      ...userToResetPassword,
      password: newResetPassword,
      updatedAt: new Date().toISOString()
    });
    setUserToResetPassword(null);
    setNewResetPassword('');
  };

  const toggleUserStatus = (u: User) => {
    const newStatus = u.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    updateUser({
      ...u,
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
  };

  // Role Submit
  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRole) {
      updateRole({
        ...editingRole,
        name: roleName,
        permissions: rolePermissions
      });
    } else {
      addRole({
        id: generateId(),
        name: roleName,
        permissions: rolePermissions
      });
    }
    setIsCreatingRole(false);
    setEditingRole(null);
    setRoleName('');
    setRolePermissions([]);
  };

  const startEditRole = (r: CustomRole) => {
    setEditingRole(r);
    setRoleName(r.name);
    setRolePermissions(r.permissions);
    setIsCreatingRole(true);
  };

  // Perm Submit
  const handlePermSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPermission({
      id: permId,
      name: permName,
      label: permLabel
    });
    setIsCreatingPermission(false);
    setPermId(''); setPermName(''); setPermLabel('');
  };

  // Export Audit Logs to CSV
  const exportAuditLogsCSV = () => {
    const headers = ['التاريخ والوقت', 'اسم المستخدم', 'الدور', 'التصنيف', 'الحدث', 'التفاصيل', 'عنوان IP'];
    const rows = filteredAuditLogs.map(l => [
      `"${new Date(l.timestamp).toLocaleString('ar-EG')}"`,
      `"${l.userName}"`,
      `"${getRoleName(l.userRole)}"`,
      `"${l.category}"`,
      `"${l.action}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.ipAddress || '127.0.0.1'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pwdStrength = getPasswordStrength(password);

  return (
    <div className="space-y-6 text-right font-sans dir-rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-emerald-600" />
            إدارة المستخدمين والأمان والحسابات
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            التحكم الشامل في حسابات النظام، طبقات الصلاحيات (RBAC)، وسجل التتبع والأمان (Audit Log)
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            إجمالي الحسابات: {users.length}
          </span>
          <span className="text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-600" />
            أحداث الأمان: {auditLogs.length}
          </span>
        </div>
      </div>

      {/* Main Card with Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/70 p-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 rounded-xl transition-all ${
              activeTab === 'users' 
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <UsersIcon className="w-4 h-4" />
            قائمة المستخدمين ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 rounded-xl transition-all ${
              activeTab === 'roles' 
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Shield className="w-4 h-4" />
            الأدوار والصلاحيات ({customRoles.length})
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 rounded-xl transition-all ${
              activeTab === 'permissions' 
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Check className="w-4 h-4" />
            دليل الصلاحيات ({systemPermissions.length})
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 rounded-xl transition-all ${
              activeTab === 'audit' 
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            سجل التدقيق والأمان (Audit Log)
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: USERS */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Search & Actions Bar */}
              <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex flex-1 flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={e => setUserSearchQuery(e.target.value)}
                      placeholder="ابحث بالاسم، اسم المستخدم، رقم الهاتف، أو كود المستخدم..."
                      className="w-full pr-9 pl-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <select
                    value={userRoleFilter}
                    onChange={e => setUserRoleFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="ALL">جميع الأدوار والوظائف</option>
                    {customRoles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>

                  <select
                    value={userStatusFilter}
                    onChange={e => setUserStatusFilter(e.target.value as any)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="ALL">جميع الحالات</option>
                    <option value="ACTIVE">نشط فقط</option>
                    <option value="INACTIVE">معطّل فقط</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowClearUsersConfirm(true)}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-xs flex items-center gap-1.5 border border-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                    مسح جميع المستخدمين
                  </button>

                  <button
                    onClick={() => {
                      setEditingUserId(null);
                      resetUserForm();
                      setIsCreatingUser(!isCreatingUser);
                    }}
                    className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-bold text-xs shadow-sm"
                  >
                    <Plus className="w-4 h-4 ml-1.5" /> 
                    إضافة مستخدم جديد
                  </button>
                </div>
              </div>

              {/* Form Modal/Drawer for Create/Edit User */}
              {isCreatingUser && (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-300 shadow-md space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-emerald-600" />
                      {editingUserId ? 'تعديل بيانات المستخدم' : 'إنشاء حساب مستخدم جديد'}
                    </h3>
                    <button
                      onClick={() => { setIsCreatingUser(false); setEditingUserId(null); resetUserForm(); }}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {userFormError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {userFormError}
                    </div>
                  )}

                  <form onSubmit={handleUserSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل *</label>
                        <input 
                          required 
                          type="text" 
                          value={name} 
                          onChange={e => setName(e.target.value)} 
                          placeholder="مثال: المهندس أحمد محمود" 
                          className="w-full px-3 py-2 border rounded-lg bg-white text-xs font-medium" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">اسم المستخدم (للدخول) *</label>
                        <input 
                          required 
                          type="text" 
                          value={username} 
                          onChange={e => setUsername(e.target.value)} 
                          placeholder="مثال: ahmed_m" 
                          className="w-full px-3 py-2 border rounded-lg bg-white text-xs font-mono" 
                          dir="ltr" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور *</label>
                        <input 
                          required={!editingUserId}
                          type="text" 
                          value={password} 
                          onChange={e => setPassword(e.target.value)} 
                          placeholder="أدخل كلمة المرور..." 
                          className="w-full px-3 py-2 border rounded-lg bg-white text-xs font-mono" 
                          dir="ltr" 
                        />
                        {password && (
                          <div className="mt-1 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className={`h-full ${pwdStrength.color} transition-all`} style={{ width: `${(pwdStrength.score / 4) * 100}%` }}></div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-600">{pwdStrength.label}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">الدور / الصلاحية *</label>
                        <select 
                          value={role} 
                          onChange={e => setRole(e.target.value as Role)} 
                          className="w-full px-3 py-2 border rounded-lg bg-white text-xs font-medium"
                        >
                          {customRoles.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">حالة الحساب *</label>
                        <select 
                          value={status} 
                          onChange={e => setStatus(e.target.value as any)} 
                          className="w-full px-3 py-2 border rounded-lg bg-white text-xs font-medium"
                        >
                          <option value="ACTIVE">نشط (مسموح بالدخول)</option>
                          <option value="INACTIVE">معطّل (محظور الدخول)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
                        <input 
                          type="text" 
                          value={phone} 
                          onChange={e => setPhone(e.target.value)} 
                          placeholder="01000000000" 
                          className="w-full px-3 py-2 border rounded-lg bg-white text-xs font-mono" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني (اختياري)</label>
                        <input 
                          type="email" 
                          value={email} 
                          onChange={e => setEmail(e.target.value)} 
                          placeholder="user@example.com" 
                          className="w-full px-3 py-2 border rounded-lg bg-white text-xs font-mono" 
                          dir="ltr" 
                        />
                      </div>

                      {role === 'TECHNICIAN' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">التخصص (للفنيين)</label>
                          <input 
                            type="text" 
                            value={specialty} 
                            onChange={e => setSpecialty(e.target.value)} 
                            placeholder="مثال: تكييف وتبريد، كهرباء" 
                            className="w-full px-3 py-2 border rounded-lg bg-white text-xs font-medium" 
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-3 gap-2 border-t border-slate-200">
                      <button 
                        type="button" 
                        onClick={() => { setIsCreatingUser(false); setEditingUserId(null); resetUserForm(); }} 
                        className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-200 bg-white text-xs font-bold"
                      >
                        إلغاء
                      </button>
                      <button 
                        type="submit" 
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm"
                      >
                        {editingUserId ? 'حفظ التعديلات' : 'حفظ المستخدم الجديد'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Users Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                <table className="min-w-full divide-y divide-slate-200 text-right">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">الرمز</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">اسم المستخدم / الحساب</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">الحالة</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">كلمة المرور 🔑</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">الهاتف والبريد</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">الصلاحية / الدور</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">إجراءات الأمان والتعديل</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-400 text-xs font-medium">
                          لا يوجد مستخدمين يطابقون خيارات البحث المسجلة.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const isPwdVisible = visiblePasswords[user.id];
                        const isInactive = user.status === 'INACTIVE';
                        return (
                          <tr key={user.id} className={`hover:bg-slate-50/80 transition-colors ${isInactive ? 'bg-slate-50/50 opacity-75' : ''}`}>
                            <td className="px-4 py-3.5 text-xs text-slate-500 font-mono font-bold">
                              {formatCode('USR', user.userNumber)}
                            </td>
                            <td className="px-4 py-3.5 text-xs">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                {user.name} 
                                {user.specialty && (
                                  <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                                    {user.specialty}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5" dir="ltr">
                                @{user.username}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                              <button
                                onClick={() => toggleUserStatus(user)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border flex items-center gap-1 transition-colors cursor-pointer ${
                                  user.status === 'INACTIVE'
                                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                }`}
                                title="اضغط لتغيير حالة التفعيل"
                              >
                                {user.status === 'INACTIVE' ? (
                                  <>
                                    <UserX className="w-3 h-3 text-red-600" />
                                    معطّل (محظور)
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3 h-3 text-emerald-600" />
                                    نشط (مفعل)
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-3.5 text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200 min-w-[80px] text-center" dir="ltr">
                                  {isPwdVisible ? (user.password || '••••••') : '••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility(user.id)}
                                  className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200 transition-colors"
                                  title={isPwdVisible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                                >
                                  {isPwdVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(user.password || '', `pwd-${user.id}`)}
                                  className="text-slate-400 hover:text-emerald-600 p-1 rounded hover:bg-slate-200 transition-colors"
                                  title="نسخ كلمة المرور"
                                >
                                  {copiedId === `pwd-${user.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-slate-600">
                              {user.phone && <div className="font-mono text-[11px]">{user.phone}</div>}
                              {user.email && <div className="font-mono text-[10px] text-slate-400" dir="ltr">{user.email}</div>}
                              {!user.phone && !user.email && <span className="text-slate-400 text-[10px]">غير محدد</span>}
                            </td>
                            <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                              <span className="px-2.5 py-1 inline-flex text-[11px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                {getRoleName(user.role)}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => setUserToResetPassword(user)} 
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 border border-amber-200 rounded-lg transition-colors" 
                                  title="إعادة ضبط كلمة المرور"
                                >
                                  <Key className="w-4 h-4" />
                                </button>

                                <button 
                                  onClick={() => setSelectedUserDetail(user)} 
                                  className="p-1.5 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors" 
                                  title="عرض التقييم وسجل نشاط المستخدم"
                                >
                                  <Info className="w-4 h-4" />
                                </button>

                                <button 
                                  onClick={() => startEditUser(user)} 
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors" 
                                  title="تعديل المستخدم"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>

                                {user.id !== currentUser?.id && (
                                  <button 
                                    onClick={() => setUserToDelete(user.id)} 
                                    className="p-1.5 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors" 
                                    title="حذف الحساب"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ROLES */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-800">الأدوار المخصصة وطبقات الصلاحيات (RBAC)</h3>
                  <p className="text-xs text-slate-500">قم بإنشاء وتعديل الأدوار الوظيفية وتحديد الصلاحيات الدقيقة لكل وظيفة</p>
                </div>
                <button
                  onClick={() => {
                    setEditingRole(null);
                    setRoleName('');
                    setRolePermissions([]);
                    setIsCreatingRole(!isCreatingRole);
                  }}
                  className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm"
                >
                  <Plus className="w-4 h-4 ml-1.5" /> إضافة دور وظيفي جديد
                </button>
              </div>

              {isCreatingRole && (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-300 shadow-md space-y-4 animate-fade-in">
                  <form onSubmit={handleRoleSubmit} className="space-y-4">
                    <h3 className="text-base font-bold text-slate-800 border-b pb-2">
                      {editingRole ? 'تعديل الدور الوظيفي' : 'إضافة دور وظيفي جديد'}
                    </h3>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">اسم الدور الوظيفي *</label>
                      <input 
                        required 
                        type="text" 
                        value={roleName} 
                        onChange={e => setRoleName(e.target.value)} 
                        className="w-full px-3 py-2 border rounded-lg bg-white text-xs font-medium" 
                        placeholder="مثال: مشرف فرع صيانة، محاسب مخازن..." 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">الصلاحيات الممنوحة لهذا الدور:</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {systemPermissions.map(p => (
                          <label key={p.id} className="flex items-center gap-2 bg-white p-3 border rounded-xl cursor-pointer hover:bg-emerald-50/50 transition-colors">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                              checked={rolePermissions.includes(p.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRolePermissions([...rolePermissions, p.id]);
                                } else {
                                  setRolePermissions(rolePermissions.filter(id => id !== p.id));
                                }
                              }}
                            />
                            <div className="text-xs">
                              <span className="font-bold text-slate-800 block">{p.label}</span>
                              <span className="text-[10px] font-mono text-slate-400" dir="ltr">{p.id}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end pt-3 gap-2 border-t border-slate-200">
                      <button type="button" onClick={() => setIsCreatingRole(false)} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-200 bg-white text-xs font-bold">إلغاء</button>
                      <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm">حفظ الدور</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customRoles.map((r) => (
                  <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-emerald-300 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-800">{r.name}</h3>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">ID: {r.id}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => startEditRole(r)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {r.id !== 'SUPER_ADMIN' && (
                          <button onClick={() => setRoleToDelete(r.id)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs font-bold text-slate-600 mb-2">الصلاحيات المفعّلة ({r.permissions.length}):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {r.permissions.map(pid => {
                        const p = systemPermissions.find(sp => sp.id === pid);
                        return (
                          <span key={pid} className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-200">
                            {p?.label || pid}
                          </span>
                        );
                      })}
                      {r.permissions.length === 0 && <span className="text-slate-400 text-xs">لا توجد صلاحيات معينة لهذا الدور</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PERMISSIONS */}
          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-800">قائمة معرفات الصلاحيات الأساسية للنظام</h3>
                  <p className="text-xs text-slate-500">مفاتيح الصلاحيات المستخدمة لضبط وتخصيص مستويات الوصول في واجهات البرنامج</p>
                </div>
                <button
                  onClick={() => setIsCreatingPermission(!isCreatingPermission)}
                  className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm"
                >
                  <Plus className="w-4 h-4 ml-1.5" /> إضافة صلاحية جديدة
                </button>
              </div>

              {isCreatingPermission && (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-300 shadow-md space-y-4 animate-fade-in">
                  <form onSubmit={handlePermSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">رمز الصلاحية (بالإنجليزية) *</label>
                        <input 
                          required 
                          type="text" 
                          value={permId} 
                          onChange={e => {
                            const upper = e.target.value.toUpperCase().replace(/\s+/g, '_');
                            setPermId(upper);
                            setPermName(upper);
                          }} 
                          className="w-full px-3 py-2 border rounded-lg bg-white text-xs font-mono" 
                          placeholder="مثال: MANAGE_BILLS" 
                          dir="ltr" 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">وصف الصلاحية (بالعربي) *</label>
                        <input 
                          required 
                          type="text" 
                          value={permLabel} 
                          onChange={e => setPermLabel(e.target.value)} 
                          className="w-full px-3 py-2 border rounded-lg bg-white text-xs font-medium" 
                          placeholder="مثال: إضافة وتعديل الفواتير والمدفوعات المالية" 
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-3 gap-2 border-t border-slate-200">
                      <button type="button" onClick={() => setIsCreatingPermission(false)} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-200 bg-white text-xs font-bold">إلغاء</button>
                      <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm">حفظ الصلاحية</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                <table className="min-w-full divide-y divide-slate-200 text-right">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase">رمز الصلاحية</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase">الوصف والبيان</th>
                      <th className="px-6 py-3 text-xs font-bold text-slate-600 uppercase">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {systemPermissions.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-xs font-mono font-bold text-emerald-800" dir="ltr">{p.id}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-800">{p.label}</td>
                        <td className="px-6 py-4 text-xs">
                          <button onClick={() => setPermissionToDelete(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              {/* Audit Controls & Search */}
              <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex flex-1 flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    <input
                      type="text"
                      value={auditSearchQuery}
                      onChange={e => setAuditSearchQuery(e.target.value)}
                      placeholder="بحث في سجل التتبع حسب اسم المستخدم، حدث الأمان، أو تفاصيل العملية..."
                      className="w-full pr-9 pl-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <select
                    value={auditCategoryFilter}
                    onChange={e => setAuditCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="ALL">جميع التصنيفات</option>
                    <option value="الأمان والدخول">الأمان والدخول</option>
                    <option value="إدارة المستخدمين">إدارة المستخدمين</option>
                    <option value="طلبات الصيانة">طلبات الصيانة</option>
                    <option value="المخزون والعهد">المخزون والعهد</option>
                    <option value="النظام المالي">النظام المالي</option>
                    <option value="الأدوار والصلاحيات">الأدوار والصلاحيات</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={exportAuditLogsCSV}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs border border-slate-300 flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    تصدير ملف Excel / CSV
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs border border-slate-300 flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Printer className="w-4 h-4 text-blue-600" />
                    طباعة التقرير
                  </button>

                  <button
                    onClick={() => setShowClearAuditConfirm(true)}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-xs border border-red-200 flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    تفريع السجل
                  </button>
                </div>
              </div>

              {/* Audit Log Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                <table className="min-w-full divide-y divide-slate-200 text-right">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">التاريخ والوقت</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">المستخدم والدور</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">التصنيف</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">الحدث / العملية</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">التفاصيل والبيان</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">عنوان IP</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400 text-xs font-medium">
                          لا يوجد سجلات تتبع تطابق معايير البحث والفلترة.
                        </td>
                      </tr>
                    ) : (
                      filteredAuditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 font-mono">
                            {new Date(log.timestamp).toLocaleDateString('ar-EG')} - {new Date(log.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs">
                            <div className="font-bold text-slate-800">{log.userName}</div>
                            <span className="text-[10px] text-slate-500">{getRoleName(log.userRole)}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {log.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-emerald-800">
                            {log.action}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-700 max-w-md">
                            {log.details}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-slate-400" dir="ltr">
                            {log.ipAddress || '127.0.0.1'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Reset Modal */}
      {userToResetPassword && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" />
                إعادة ضبط كلمة المرور للمستخدم
              </h3>
              <button onClick={() => setUserToResetPassword(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
              أنت على وشك تغيير كلمة المرور لـ: <strong>{userToResetPassword.name}</strong> (@{userToResetPassword.username})
            </div>

            <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور الجديدة *</label>
                <input
                  type="text"
                  required
                  value={newResetPassword}
                  onChange={e => setNewResetPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور الجديدة..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  dir="ltr"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUserToResetPassword(null)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-sm"
                >
                  حفظ كلمة المرور الجديدة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Detail View Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                تفاصيل وسجل الحساب
              </h3>
              <button onClick={() => setSelectedUserDetail(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-bold">الاسم:</span>
                  <span className="font-bold text-slate-900">{selectedUserDetail.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">اسم المستخدم:</span>
                  <span className="font-mono text-slate-800" dir="ltr">@{selectedUserDetail.username}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">الدور الوظيفي:</span>
                  <span className="font-bold text-blue-700">{getRoleName(selectedUserDetail.role)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">حالة الحساب:</span>
                  <span className={`font-bold ${selectedUserDetail.status === 'INACTIVE' ? 'text-red-600' : 'text-emerald-600'}`}>
                    {selectedUserDetail.status === 'INACTIVE' ? 'معطّل' : 'نشط'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">رقم الهاتف:</span>
                  <span className="font-mono">{selectedUserDetail.phone || 'غير مسجل'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">آخر تسجيل دخول:</span>
                  <span className="font-mono">
                    {selectedUserDetail.lastLogin ? new Date(selectedUserDetail.lastLogin).toLocaleString('ar-EG') : 'لم يدخل بعد'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">آخر عمليات هذا المستخدم ({auditLogs.filter(l => l.userId === selectedUserDetail.id).length}):</h4>
                <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                  {auditLogs.filter(l => l.userId === selectedUserDetail.id).length === 0 ? (
                    <p className="text-slate-400 text-xs text-center py-4">لا توجد عمليات مسجلة لهذا المستخدم حتى الآن.</p>
                  ) : (
                    auditLogs.filter(l => l.userId === selectedUserDetail.id).slice(0, 10).map(log => (
                      <div key={log.id} className="p-2 bg-white rounded-lg border border-slate-200 text-xs space-y-0.5">
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>{new Date(log.timestamp).toLocaleString('ar-EG')}</span>
                          <span>{log.category}</span>
                        </div>
                        <p className="font-bold text-slate-800">{log.action}</p>
                        <p className="text-slate-600 text-[11px]">{log.details}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full border border-slate-200 text-right">
            <h3 className="text-lg font-bold text-slate-900 mb-2">تأكيد حذف الحساب</h3>
            <p className="text-slate-600 text-xs mb-6">هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذه العملية.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setUserToDelete(null)} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-bold">إلغاء</button>
              <button onClick={() => { deleteUser(userToDelete); setUserToDelete(null); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-sm">تأكيد الحذف</button>
            </div>
          </div>
        </div>
      )}

      {roleToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full border border-slate-200 text-right">
            <h3 className="text-lg font-bold text-slate-900 mb-2">تأكيد حذف الدور</h3>
            <p className="text-slate-600 text-xs mb-6">هل أنت متأكد من حذف هذا الدور؟ قد تفقد الحسابات التابعة له صلاحياتها.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setRoleToDelete(null)} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-bold">إلغاء</button>
              <button onClick={() => { deleteRole(roleToDelete); setRoleToDelete(null); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-sm">تأكيد الحذف</button>
            </div>
          </div>
        </div>
      )}

      {permissionToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full border border-slate-200 text-right">
            <h3 className="text-lg font-bold text-slate-900 mb-2">تأكيد حذف الصلاحية</h3>
            <p className="text-slate-600 text-xs mb-6">هل أنت متأكد من حذف هذه الصلاحية من الدليل العام؟</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPermissionToDelete(null)} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-bold">إلغاء</button>
              <button onClick={() => { deletePermission(permissionToDelete); setPermissionToDelete(null); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-sm">تأكيد الحذف</button>
            </div>
          </div>
        </div>
      )}

      {showClearUsersConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full border border-slate-200 text-right">
            <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              تحذير مسح الحسابات
            </h3>
            <p className="text-slate-600 text-xs mb-6">هل أنت متأكد من مسح جميع المستخدمين؟ سيتم حذف جميع الحسابات وتسجيل خروج النظام.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowClearUsersConfirm(false)} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-bold">إلغاء</button>
              <button onClick={() => { clearAllUsers(); setShowClearUsersConfirm(false); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-sm">مسح الجميع</button>
            </div>
          </div>
        </div>
      )}

      {showClearAuditConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full border border-slate-200 text-right">
            <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              تأكيد تفريغ سجل الأمان
            </h3>
            <p className="text-slate-600 text-xs mb-6">هل أنت متأكد من مسح جميع سجلات الأمان والتتبع؟ لا يمكن استرجاع هذه السجلات بعد مسحها.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowClearAuditConfirm(false)} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-bold">إلغاء</button>
              <button onClick={() => { clearAuditLogs(); setShowClearAuditConfirm(false); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-sm">تأكيد المسح</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
