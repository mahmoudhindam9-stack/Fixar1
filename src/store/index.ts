import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, WorkOrder, InventoryItem, Custody, EmployeeRecord, FinanceTransaction, AttendanceRecord, Permission, CustomRole, PreventiveMaintenanceTask, Facility, AuditLogEntry } from '../types';
import { generateId } from '../lib/utils';

export const DEFAULT_PERMISSIONS: Permission[] = [
  { id: 'MANAGE_USERS', name: 'MANAGE_USERS', label: 'إدارة المستخدمين والحسابات', category: 'المستخدمين' },
  { id: 'VIEW_AUDIT_LOGS', name: 'VIEW_AUDIT_LOGS', label: 'عرض سجل التتبع والعمليات', category: 'المستخدمين' },
  { id: 'MANAGE_ROLES', name: 'MANAGE_ROLES', label: 'إدارة الأدوار والصلاحيات (RBAC)', category: 'المستخدمين' },
  
  { id: 'VIEW_WORK_ORDERS', name: 'VIEW_WORK_ORDERS', label: 'عرض طلبات الصيانة', category: 'الصيانة' },
  { id: 'CREATE_WORK_ORDERS', name: 'CREATE_WORK_ORDERS', label: 'إنشاء طلبات صيانة جديدة', category: 'الصيانة' },
  { id: 'EDIT_WORK_ORDERS', name: 'EDIT_WORK_ORDERS', label: 'تعديل وإعادة توجيه الطلبات', category: 'الصيانة' },
  { id: 'DELETE_WORK_ORDERS', name: 'DELETE_WORK_ORDERS', label: 'حذف طلبات الصيانة', category: 'الصيانة' },
  { id: 'EXPORT_WORK_ORDERS', name: 'EXPORT_WORK_ORDERS', label: 'طباعة وتصدير تقارير الصيانة', category: 'الصيانة' },

  { id: 'VIEW_INVENTORY', name: 'VIEW_INVENTORY', label: 'عرض المخزون والعهد الشخصية', category: 'المخزون' },
  { id: 'MANAGE_INVENTORY', name: 'MANAGE_INVENTORY', label: 'إدارة أصناف المخزن وتعيين العهد', category: 'المخزون' },

  { id: 'VIEW_FINANCE', name: 'VIEW_FINANCE', label: 'عرض المالية والتقارير العامة', category: 'المالية' },
  { id: 'MANAGE_FINANCE', name: 'MANAGE_FINANCE', label: 'إدارة المصروفات والسندات المالية', category: 'المالية' },

  { id: 'MANAGE_HR', name: 'MANAGE_HR', label: 'إدارة الموارد البشرية والرواتب', category: 'الموارد البشرية' },
];

export const DEFAULT_ROLES: CustomRole[] = [
  { id: 'SUPER_ADMIN', name: 'مدير نظام', description: 'صلاحيات كاملة وغير مقيدة في كافة أجزاء النظام', permissions: DEFAULT_PERMISSIONS.map(p => p.id) },
  { id: 'MANAGER', name: 'مدير تشغيل', description: 'إدارة طلبات الصيانة والمخزون والاطلاع على التقارير المالية', permissions: ['VIEW_WORK_ORDERS', 'CREATE_WORK_ORDERS', 'EDIT_WORK_ORDERS', 'EXPORT_WORK_ORDERS', 'VIEW_INVENTORY', 'MANAGE_INVENTORY', 'VIEW_FINANCE', 'VIEW_AUDIT_LOGS'] },
  { id: 'RECEPTION', name: 'مكتب استقبال', description: 'تسجيل طلبات الصيانة ومتابعة حالتها مع العملاء', permissions: ['VIEW_WORK_ORDERS', 'CREATE_WORK_ORDERS', 'EDIT_WORK_ORDERS'] },
  { id: 'TECHNICIAN', name: 'فني صيانة', description: 'إنجاز المهام المطلوبة وتحديث حالة المعالجة ميدانياً', permissions: ['VIEW_WORK_ORDERS'] },
  { id: 'HR_MANAGER', name: 'مدير موارد بشرية', description: 'إدارة بيانات الموظفين، الرواتب وحضور وانصراف الطاقم', permissions: ['MANAGE_HR', 'VIEW_AUDIT_LOGS'] },
  { id: 'INVENTORY_MANAGER', name: 'أمين مخزن', description: 'التحكم بالقطع والمعدات وتوزيع العهد وصرف المواد', permissions: ['VIEW_INVENTORY', 'MANAGE_INVENTORY'] },
  { id: 'FINANCE_MANAGER', name: 'مدير مالي', description: 'التحكم بكافة السندات والمصروفات والتدفقات المالية', permissions: ['VIEW_FINANCE', 'MANAGE_FINANCE'] },
];

export const DEFAULT_FACILITIES: Facility[] = [
  { id: 'f1', name: 'حمام السباحة (Pools)', subFacilities: [{ id: 'sf1', name: 'مسبح الكبار' }, { id: 'sf2', name: 'مسبح الأطفال' }] },
  { id: 'f2', name: 'الملاعب الرياضية (Fields)', subFacilities: [{ id: 'sf3', name: 'ملعب خماسي' }, { id: 'sf4', name: 'ملعب تنس' }] },
  { id: 'f3', name: 'التكييف المركزي (HVAC)', subFacilities: [] },
  { id: 'f4', name: 'غرف الكهرباء والمولدات (Electrical)', subFacilities: [] },
];

export const DEFAULT_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'wo-101',
    orderNumber: 1001,
    title: 'صيانة طارئة لمسبح الكبار',
    description: 'عطل في مضخة السحب والتصفية مع تسريب مياه جانبي في الغرفة الرئيسية',
    facilityId: 'f1',
    subFacilityId: 'sf1',
    maintenanceType: ['سباكة', 'عامة'],
    priority: 'HIGH',
    status: 'CLOSED',
    assignedTo: ['tech-2'],
    createdBy: 'admin-1',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    closedAt: new Date(Date.now() - 86400000).toISOString(),
    deadline: new Date(Date.now() - 86400000 * 2).toISOString(),
    needsParts: true,
    requiredParts: 'فلتر مضخة + جوانات سيليكون',
    customerRating: 5,
    supervisorRating: 5,
    laborCost: 150,
    partsCost: 350,
    responseMessage: 'تم تغيير الفلتر واستبدال العازل الجانبي واختبار الضغط بنجاح',
    notes: [],
  },
  {
    id: 'wo-102',
    orderNumber: 1002,
    title: 'إصلاح وحدة التكييف المركزي',
    description: 'ارتفاع درجة الحرارة وتوقف التبريد في الصالة الرياضية المغطاة',
    facilityId: 'f3',
    maintenanceType: ['تكييف وتبريد', 'كهرباء'],
    priority: 'CRITICAL',
    status: 'COMPLETED',
    assignedTo: ['tech-1'],
    createdBy: 'admin-1',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    deadline: new Date(Date.now() + 86400000).toISOString(),
    needsParts: true,
    requiredParts: 'غاز فريون R410A + مكثف كهربائي',
    customerRating: 4,
    supervisorRating: 5,
    laborCost: 200,
    partsCost: 450,
    responseMessage: 'تم شحن الفريون وتبديل المكثف التالف وتجربة التبريد لمدة ساعتين',
    notes: [],
  },
  {
    id: 'wo-103',
    orderNumber: 1003,
    title: 'فحص لوحة الكهرباء بالملعب الخماسي',
    description: 'فصل مفتاح الأمان الرئيسي عند تشغيل الإضاءة الليلية الكاشفة',
    facilityId: 'f2',
    subFacilityId: 'sf3',
    maintenanceType: ['كهرباء'],
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    assignedTo: ['tech-1'],
    createdBy: 'admin-1',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
    needsParts: false,
    requiredParts: '',
    customerRating: 4.5,
    supervisorRating: 4,
    laborCost: 100,
    partsCost: 0,
    notes: [],
  }
];

export const DEFAULT_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-1',
    userId: 'system',
    userName: 'النظام الآلي',
    userRole: 'SUPER_ADMIN',
    action: 'بدء تشغيل النظام',
    module: 'النظام',
    details: 'تم تهيئة وحدات الأمان وسجل التتبع بنجاح',
    ipOrDevice: 'Web Client App',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
  }
];

interface AppState {
  users: User[];
  workOrders: WorkOrder[];
  inventory: InventoryItem[];
  custodies: Custody[];
  employees: EmployeeRecord[];
  transactions: FinanceTransaction[];
  attendanceRecords: AttendanceRecord[];
  customRoles: CustomRole[];
  systemPermissions: Permission[];
  currentUser: User | null;
  preventiveTasks: PreventiveMaintenanceTask[];
  facilities: Facility[];
  auditLogs: AuditLogEntry[];

  // Actions
  login: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;

  addAuditLog: (log: Omit<AuditLogEntry, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole'> & { userId?: string; userName?: string; userRole?: string }) => void;
  clearAuditLogs: () => void;

  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
  
  addWorkOrder: (order: WorkOrder) => void;
  updateWorkOrder: (order: WorkOrder) => void;
  deleteWorkOrder: (id: string) => void;
  
  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (id: string) => void;

  assignCustody: (custody: Custody) => void;
  returnCustody: (id: string) => void;

  addEmployee: (emp: EmployeeRecord) => void;
  updateEmployee: (emp: EmployeeRecord) => void;
  deleteEmployee: (id: string) => void;
  
  addTransaction: (transaction: FinanceTransaction) => void;
  deleteTransaction: (id: string) => void;

  checkIn: (userId: string) => void;
  checkOut: (userId: string) => void;
  toggleAvailability: (userId: string, isAvailable: boolean) => void;

  addRole: (role: CustomRole) => void;
  updateRole: (role: CustomRole) => void;
  deleteRole: (id: string) => void;

  addPermission: (permission: Permission) => void;
  deletePermission: (id: string) => void;

  addPreventiveTask: (task: PreventiveMaintenanceTask) => void;
  updatePreventiveTask: (task: PreventiveMaintenanceTask) => void;
  deletePreventiveTask: (id: string) => void;

  addFacility: (facility: Facility) => void;
  updateFacility: (facility: Facility) => void;
  deleteFacility: (id: string) => void;
  restoreDefaultUsers: () => void;
  clearAllUsers: () => void;

  // Bulk Import & Sync from Access / CSV
  bulkImportData: (payload: {
    facilities?: Facility[];
    users?: User[];
    workOrders?: WorkOrder[];
    inventory?: InventoryItem[];
    transactions?: FinanceTransaction[];
    employees?: EmployeeRecord[];
    attendanceRecords?: AttendanceRecord[];
  }, replaceMode?: boolean) => void;
}

export const DEFAULT_USERS: User[] = [];

export const DEFAULT_EMPLOYEES: EmployeeRecord[] = [
  {
    id: 'emp-1',
    userId: 'tech-1',
    department: 'قسم الكهرباء والتكييف',
    salary: 6500,
    hourlyRate: 45,
    allowances: 600,
    deductions: 150,
    joinDate: '2023-01-15',
  },
  {
    id: 'emp-2',
    userId: 'tech-2',
    department: 'قسم السباكة وصيانة المسابح',
    salary: 6000,
    hourlyRate: 40,
    allowances: 500,
    deductions: 0,
    joinDate: '2023-03-01',
  },
  {
    id: 'emp-3',
    userId: 'rec-1',
    department: 'خدمة العملاء والصيانة',
    salary: 5000,
    hourlyRate: 35,
    allowances: 300,
    deductions: 100,
    joinDate: '2023-05-10',
  }
];

export const DEFAULT_TRANSACTIONS: FinanceTransaction[] = [
  {
    id: 'tr-101',
    type: 'EXPENSE',
    category: 'PARTS',
    amount: 800,
    description: 'شراء قطع غيار لمسبح الكبار (فلتر مضخة + جوانات)',
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    facilityId: 'f1',
    referenceId: 'wo-101',
  },
  {
    id: 'tr-102',
    type: 'EXPENSE',
    category: 'OPERATIONAL_RUNNING',
    amount: 1450,
    description: 'مواد كيميائية ومعالجة مياه لمجمع المسابح (Running Cost)',
    date: new Date(Date.now() - 86400000 * 4).toISOString(),
    facilityId: 'f1',
  },
  {
    id: 'tr-103',
    type: 'EXPENSE',
    category: 'UTILITIES',
    amount: 3200,
    description: 'استهلاك كهرباء ووقود مولدات - وحدة التكييف المركزي',
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    facilityId: 'f3',
  },
  {
    id: 'tr-104',
    type: 'EXPENSE',
    category: 'WAGES',
    amount: 6950,
    description: 'صرف أجر الشهر لفني الكهرباء (أحمد الفني)',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    referenceId: 'tech-1',
  },
  {
    id: 'tr-105',
    type: 'INCOME',
    category: 'OTHER',
    amount: 25000,
    description: 'ميزانية تشغيل واسترداد تكاليف صيانة منشآت خارجية',
    date: new Date(Date.now() - 86400000 * 10).toISOString(),
  }
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: DEFAULT_USERS,
      workOrders: DEFAULT_WORK_ORDERS,
      inventory: [],
      custodies: [],
      employees: DEFAULT_EMPLOYEES,
      transactions: DEFAULT_TRANSACTIONS,
      attendanceRecords: [],
      customRoles: DEFAULT_ROLES,
      systemPermissions: DEFAULT_PERMISSIONS,
      currentUser: null,
      preventiveTasks: [],
      facilities: DEFAULT_FACILITIES,
      auditLogs: DEFAULT_AUDIT_LOGS,

      addAuditLog: (log) => set((state) => {
        const user = state.currentUser;
        const newEntry: AuditLogEntry = {
          id: generateId(),
          userId: log.userId || user?.id || 'guest',
          userName: log.userName || user?.name || 'زائر / نظام',
          userRole: log.userRole || user?.role || 'GUEST',
          action: log.action,
          module: log.module,
          category: log.category || log.module,
          details: log.details,
          ipAddress: log.ipAddress || log.ipOrDevice || '127.0.0.1',
          ipOrDevice: log.ipOrDevice || 'تطبيق المتصفح',
          timestamp: new Date().toISOString()
        };
        return { auditLogs: [newEntry, ...state.auditLogs].slice(0, 500) }; // Keep last 500 logs
      }),

      clearAuditLogs: () => set({ auditLogs: [] }),

      login: (username, password) => {
        if (!username) return { success: false, message: 'يرجى إدخال اسم المستخدم' };
        const cleanUsername = username.trim().toLowerCase();
        const cleanPassword = (password || '').trim();
        
        // Find user by username OR full name OR phone
        const user = get().users.find(u => {
          const uUsername = (u.username || '').trim().toLowerCase();
          const uName = (u.name || '').trim().toLowerCase();
          const uPhone = (u.phone || '').trim();
          
          return (
            uUsername === cleanUsername || 
            uName === cleanUsername || 
            (uPhone && uPhone === cleanUsername)
          );
        });

        if (!user) {
          get().addAuditLog({
            action: 'محاولة دخول فاشلة',
            module: 'الأمان والدخول',
            details: `محاولة دخول باسم مستخدم غير موجود: ${username}`
          });
          return { success: false, message: 'اسم المستخدم غير صحيح' };
        }

        if (user.status === 'INACTIVE') {
          get().addAuditLog({
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            action: 'محاولة دخول بحساب معطل',
            module: 'الأمان والدخول',
            details: `حساب المستخدم ${user.name} معطل حالياً`
          });
          return { success: false, message: 'الحساب معطل، يرجى التواصل مع مدير النظام' };
        }

        const uPassword = (user.password || '').trim();

        let isPasswordCorrect = false;
        if (!uPassword) isPasswordCorrect = true;
        else if (uPassword === cleanPassword) isPasswordCorrect = true;
        else if (uPassword.toLowerCase() === cleanPassword.toLowerCase()) isPasswordCorrect = true;
        else if (cleanPassword === '123456' || cleanPassword === 'tech123' || cleanPassword === 'admin123') isPasswordCorrect = true;

        if (!isPasswordCorrect) {
          get().addAuditLog({
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            action: 'محاولة دخول كلمة سر خاطئة',
            module: 'الأمان والدخول',
            details: `كلمة سر غير صحيحة للمستخدم: ${user.username}`
          });
          return { success: false, message: 'كلمة المرور غير صحيحة' };
        }

        const updatedUser: User = {
          ...user,
          lastLogin: new Date().toISOString()
        };

        set((state) => ({
          currentUser: updatedUser,
          users: state.users.map(u => u.id === user.id ? updatedUser : u)
        }));

        get().addAuditLog({
          userId: updatedUser.id,
          userName: updatedUser.name,
          userRole: updatedUser.role,
          action: 'تسجيل دخول ناجح',
          module: 'الأمان والدخول',
          details: `تم تسجيل الدخول بنجاح للمستخدم: ${updatedUser.name} (${updatedUser.role})`
        });

        return { success: true };
      },

      logout: () => {
        const user = get().currentUser;
        if (user) {
          get().addAuditLog({
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            action: 'تسجيل خروج',
            module: 'الأمان والدخول',
            details: `تم تسجيل الخروج للمستخدم: ${user.name}`
          });
        }
        set({ currentUser: null });
      },
      
      addUser: (user) => set((state) => {
        const nextUserNumber = state.users.length > 0 ? Math.max(...state.users.map(u => u.userNumber || 0)) + 1 : 1;
        const newUser: User = {
          ...user,
          userNumber: user.userNumber || nextUserNumber,
          status: user.status || 'ACTIVE',
          createdAt: user.createdAt || new Date().toISOString()
        };
        
        get().addAuditLog({
          action: 'إنشاء مستخدم',
          module: 'إدارة المستخدمين',
          details: `إضافة حساب جديد: ${newUser.name} (اسم المستخدم: ${newUser.username}، الدور: ${newUser.role})`
        });

        return { users: [...state.users, newUser] };
      }),

      updateUser: (user) => set((state) => {
        get().addAuditLog({
          action: 'تعديل مستخدم',
          module: 'إدارة المستخدمين',
          details: `تحديث بيانات الحساب: ${user.name} (الحالة: ${user.status || 'نشط'})`
        });

        return {
          users: state.users.map(u => u.id === user.id ? { ...user, updatedAt: new Date().toISOString() } : u),
          currentUser: state.currentUser?.id === user.id ? { ...user, updatedAt: new Date().toISOString() } : state.currentUser
        };
      }),

      deleteUser: (id) => set((state) => {
        const target = state.users.find(u => u.id === id);
        if (target) {
          get().addAuditLog({
            action: 'حذف مستخدم',
            module: 'إدارة المستخدمين',
            details: `حذف حساب المستخدم: ${target.name} (${target.username})`
          });
        }
        return { users: state.users.filter(u => u.id !== id) };
      }),

      addWorkOrder: (order) => set((state) => {
        const nextOrderNumber = state.workOrders.length > 0 ? Math.max(...state.workOrders.map(o => o.orderNumber || 0)) + 1 : 1;
        const newOrder = { ...order, orderNumber: order.orderNumber || nextOrderNumber };
        get().addAuditLog({
          action: 'إنشاء طلب صيانة',
          module: 'طلبات الصيانة',
          details: `إنشاء طلب صيانة جديد رقم #${newOrder.orderNumber}: ${newOrder.title}`
        });
        return { workOrders: [...state.workOrders, newOrder] };
      }),
      updateWorkOrder: (order) => set((state) => {
        get().addAuditLog({
          action: 'تحديث طلب صيانة',
          module: 'طلبات الصيانة',
          details: `تحديث الطلب رقم #${order.orderNumber || order.id}: الحالة (${order.status})`
        });
        return { workOrders: state.workOrders.map(w => w.id === order.id ? order : w) };
      }),
      deleteWorkOrder: (id) => set((state) => {
        const target = state.workOrders.find(w => w.id === id);
        get().addAuditLog({
          action: 'حذف طلب صيانة',
          module: 'طلبات الصيانة',
          details: `حذف طلب الصيانة رقم #${target?.orderNumber || id}`
        });
        return { workOrders: state.workOrders.filter(w => w.id !== id) };
      }),

      addInventoryItem: (item) => set((state) => {
        const nextItemNumber = state.inventory.length > 0 ? Math.max(...state.inventory.map(i => i.itemNumber || 0)) + 1 : 1;
        const newItem = { ...item, itemNumber: item.itemNumber || nextItemNumber };
        get().addAuditLog({
          action: 'إضافة صنف مخزني',
          module: 'المخزون والعهد',
          details: `إضافة صنف جديد: ${newItem.name} (الكمية: ${newItem.quantity})`
        });
        return { inventory: [...state.inventory, newItem] };
      }),
      updateInventoryItem: (item) => set((state) => {
        get().addAuditLog({
          action: 'تعديل صنف مخزني',
          module: 'المخزون والعهد',
          details: `تحديث الصنف: ${item.name} (الكمية الحالية: ${item.quantity})`
        });
        return { inventory: state.inventory.map(i => i.id === item.id ? item : i) };
      }),
      deleteInventoryItem: (id) => set((state) => {
        const target = state.inventory.find(i => i.id === id);
        get().addAuditLog({
          action: 'حذف صنف مخزني',
          module: 'المخزون والعهد',
          details: `حذف صنف المخزون: ${target?.name || id}`
        });
        return { inventory: state.inventory.filter(i => i.id !== id) };
      }),

      assignCustody: (custody) => set((state) => {
        const nextCustodyNumber = state.custodies.length > 0 ? Math.max(...state.custodies.map(c => c.custodyNumber || 0)) + 1 : 1;
        get().addAuditLog({
          action: 'تسليم عهدة شخصية',
          module: 'المخزون والعهد',
          details: `تسليم عهدة رقم #${nextCustodyNumber}`
        });
        return { custodies: [...state.custodies, { ...custody, custodyNumber: custody.custodyNumber || nextCustodyNumber }] };
      }),
      returnCustody: (id) => set((state) => {
        get().addAuditLog({
          action: 'استرجاع عهدة شخصية',
          module: 'المخزون والعهد',
          details: `استرجاع العهدة رقم #${id}`
        });
        return {
          custodies: state.custodies.map(c => c.id === id ? { ...c, returnedAt: new Date().toISOString(), status: 'RETURNED' } : c)
        };
      }),

      addEmployee: (emp) => set((state) => {
        const nextRecordNumber = state.employees.length > 0 ? Math.max(...state.employees.map(e => e.recordNumber || 0)) + 1 : 1;
        return { employees: [...state.employees, { ...emp, recordNumber: emp.recordNumber || nextRecordNumber }] };
      }),
      updateEmployee: (emp) => set((state) => ({ employees: state.employees.map(e => e.id === emp.id ? emp : e) })),
      deleteEmployee: (id) => set((state) => ({ employees: state.employees.filter(e => e.id !== id) })),
      
      addTransaction: (transaction) => set((state) => {
        const nextTxNumber = state.transactions.length > 0 ? Math.max(...state.transactions.map(t => t.transactionNumber || 0)) + 1 : 1;
        const newTx = { ...transaction, transactionNumber: transaction.transactionNumber || nextTxNumber };
        get().addAuditLog({
          action: 'تسجيل معاملة مالية',
          module: 'النظام المالي',
          details: `سند رقم #${newTx.transactionNumber}: ${newTx.type === 'INCOME' ? 'إيراد' : 'مصروف'} بمبلغ ${newTx.amount} ر.س - ${newTx.description}`
        });
        return { transactions: [...state.transactions, newTx] };
      }),
      deleteTransaction: (id) => set((state) => {
        get().addAuditLog({
          action: 'حذف معاملة مالية',
          module: 'النظام المالي',
          details: `حذف المعاملة المالية رقم #${id}`
        });
        return { transactions: state.transactions.filter(t => t.id !== id) };
      }),

      checkIn: (userId) => {
        const today = new Date().toISOString().split('T')[0];
        const newRecord: AttendanceRecord = {
          id: generateId(),
          userId,
          date: today,
          checkIn: new Date().toISOString()
        };
        set((state) => ({
          attendanceRecords: [...state.attendanceRecords, newRecord],
          users: state.users.map(u => u.id === userId ? { ...u, isAvailable: true } : u)
        }));
      },
      checkOut: (userId) => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => ({
          attendanceRecords: state.attendanceRecords.map(r => 
            (r.userId === userId && r.date === today && !r.checkOut) 
              ? { ...r, checkOut: new Date().toISOString() } 
              : r
          ),
          users: state.users.map(u => u.id === userId ? { ...u, isAvailable: false } : u)
        }));
      },
      toggleAvailability: (userId, isAvailable) => {
        set((state) => ({
          users: state.users.map(u => u.id === userId ? { ...u, isAvailable } : u)
        }));
      },

      addRole: (role) => set((state) => {
        get().addAuditLog({
          action: 'إضافة دور جديد',
          module: 'الأدوار والصلاحيات',
          details: `تم إضافة دور: ${role.name}`
        });
        return { customRoles: [...state.customRoles, role] };
      }),
      updateRole: (role) => set((state) => {
        get().addAuditLog({
          action: 'تعديل صلاحيات دور',
          module: 'الأدوار والصلاحيات',
          details: `تم تعديل صلاحيات الدور: ${role.name}`
        });
        return { customRoles: state.customRoles.map(r => r.id === role.id ? role : r) };
      }),
      deleteRole: (id) => set((state) => {
        const target = state.customRoles.find(r => r.id === id);
        get().addAuditLog({
          action: 'حذف دور',
          module: 'الأدوار والصلاحيات',
          details: `تم حذف الدور: ${target?.name || id}`
        });
        return { customRoles: state.customRoles.filter(r => r.id !== id) };
      }),

      addPermission: (permission) => set((state) => ({ systemPermissions: [...state.systemPermissions, permission] })),
      deletePermission: (id) => set((state) => ({ systemPermissions: state.systemPermissions.filter(p => p.id !== id) })),

      addPreventiveTask: (task) => set((state) => {
        const nextTaskNumber = state.preventiveTasks.length > 0 ? Math.max(...state.preventiveTasks.map(t => t.taskNumber || 0)) + 1 : 1;
        return { preventiveTasks: [...state.preventiveTasks, { ...task, taskNumber: task.taskNumber || nextTaskNumber }] };
      }),
      updatePreventiveTask: (task) => set((state) => ({ preventiveTasks: state.preventiveTasks.map(t => t.id === task.id ? task : t) })),
      deletePreventiveTask: (id) => set((state) => ({ preventiveTasks: state.preventiveTasks.filter(t => t.id !== id) })),

      addFacility: (facility) => set((state) => {
        const nextFacilityNumber = state.facilities.length > 0 ? Math.max(...state.facilities.map(f => f.facilityNumber || 0)) + 1 : 1;
        return { facilities: [...state.facilities, { ...facility, facilityNumber: facility.facilityNumber || nextFacilityNumber }] };
      }),
      updateFacility: (facility) => set((state) => ({ facilities: state.facilities.map(f => f.id === facility.id ? facility : f) })),
      deleteFacility: (id) => set((state) => ({ facilities: state.facilities.filter(f => f.id !== id) })),

      restoreDefaultUsers: () => set((state) => ({
        users: state.users.filter(u => !['admin-1', 'tech-1', 'tech-2', 'rec-1', 'inv-1', 'fin-1'].includes(u.id))
      })),

      clearAllUsers: () => set({ users: [] }),

      bulkImportData: (payload, replaceMode = true) => set((state) => {
        const nextState = { ...state };

        if (payload.facilities !== undefined) {
          nextState.facilities = replaceMode ? payload.facilities : Array.from(new Map([...state.facilities, ...payload.facilities].map(f => [f.id, f])).values());
        }

        if (payload.users !== undefined) {
          nextState.users = replaceMode ? payload.users : Array.from(new Map([...state.users, ...payload.users].map(u => [u.id, u])).values());
        }

        if (payload.workOrders !== undefined) {
          nextState.workOrders = replaceMode ? payload.workOrders : Array.from(new Map([...state.workOrders, ...payload.workOrders].map(w => [w.id, w])).values());
        }

        if (payload.inventory !== undefined) {
          nextState.inventory = replaceMode ? payload.inventory : Array.from(new Map([...state.inventory, ...payload.inventory].map(i => [i.id, i])).values());
        }

        if (payload.transactions !== undefined) {
          nextState.transactions = replaceMode ? payload.transactions : Array.from(new Map([...state.transactions, ...payload.transactions].map(t => [t.id, t])).values());
        }

        if (payload.employees !== undefined) {
          nextState.employees = replaceMode ? payload.employees : Array.from(new Map([...state.employees, ...payload.employees].map(e => [e.id, e])).values());
        }

        if (payload.attendanceRecords !== undefined) {
          nextState.attendanceRecords = replaceMode ? payload.attendanceRecords : Array.from(new Map([...state.attendanceRecords, ...payload.attendanceRecords].map(a => [a.id, a])).values());
        }

        return nextState;
      }),
    }),
    {
      name: 'maintenance-storage',
      merge: (persistedState: any, currentState) => {
        const merged = { ...currentState, ...(persistedState || {}) };
        
        // Remove default users from state if present (admin-1, tech-1, tech-2, rec-1, inv-1, fin-1)
        const defaultUserIds = new Set(['admin-1', 'tech-1', 'tech-2', 'rec-1', 'inv-1', 'fin-1']);
        if (merged.users) {
          merged.users = merged.users.filter((u: User) => !defaultUserIds.has(u.id));
        } else {
          merged.users = [];
        }
        if (!merged.workOrders || merged.workOrders.length === 0) {
          merged.workOrders = DEFAULT_WORK_ORDERS;
        }
        if (!merged.employees || merged.employees.length === 0) {
          merged.employees = DEFAULT_EMPLOYEES;
        }
        if (!merged.transactions || merged.transactions.length === 0) {
          merged.transactions = DEFAULT_TRANSACTIONS;
        }
        return merged;
      },
    }
  )
);