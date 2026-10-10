export interface Permission {
  id: string;
  name: string; // e.g. "VIEW_USERS"
  label: string; // e.g. "عرض المستخدمين"
  category?: string; // e.g. "المستخدمين", "الصيانة", "المخزن", "المالية"
}

export interface CustomRole {
  id: string;
  name: string; // e.g. "مدير نظام"
  description?: string;
  permissions: string[]; // List of permission IDs
}

export type Role = 'SUPER_ADMIN' | 'MANAGER' | 'RECEPTION' | 'TECHNICIAN' | 'HR_MANAGER' | 'INVENTORY_MANAGER' | 'FINANCE_MANAGER' | string;

export interface User {
  id: string;
  userNumber?: number;
  username: string;
  password?: string;
  name: string;
  role: Role;
  phone?: string;
  phone2?: string;
  email?: string;
  specialty?: string;
  isAvailable?: boolean;
  status?: 'ACTIVE' | 'INACTIVE';
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  category?: string;
  details: string;
  ipAddress?: string;
  ipOrDevice?: string;
  timestamp: string;
}

export type WorkOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' | 'CANCELLED';

export interface WorkOrderNote {
  id: string;
  userId: string;
  text: string;
  image?: string;
  createdAt: string;
}

export interface WorkOrder {
  id: string;
  orderNumber?: number;
  facilityId?: string;
  subFacilityId?: string;
  title: string;
  reporterPhone?: string;
  reporterPhone2?: string;
  description: string;
  image?: string; // base64
  imageAfter?: string; // base64
  needsParts: boolean;
  requiredParts: string;
  partsSupplied?: boolean;
  needsSpecialEquipment?: boolean;
  requiredEquipment?: string;
  maintenanceType: string[];
  deadline: string;
  status: WorkOrderStatus;
  assignedTo: string[]; // User IDs
  createdBy: string;
  createdAt: string;
  closedAt?: string;
  notes: WorkOrderNote[];
  responseMessage?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  customerRating?: number;
  supervisorRating?: number;
  finalNotes?: string;
  laborCost?: number;
  partsCost?: number;
  isPublicRequest?: boolean;
  publicRequesterName?: string;
  publicRequesterJobTitle?: string;
  publicLocation?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
}

export interface InventoryItem {
  id: string;
  itemNumber?: number;
  name: string;
  category: string;
  quantity: number;
  price?: number;
  unit?: string;
  type: 'CONSUMABLE' | 'EQUIPMENT';
  validityDate?: string;
}

export interface Custody {
  id: string;
  custodyNumber?: number;
  itemId: string;
  userId: string;
  assignedAt: string;
  returnedAt?: string;
  status: 'ACTIVE' | 'RETURNED';
}

export interface EmployeeRecord {
  id: string;
  recordNumber?: number;
  userId: string;
  department: string;
  salary: number; // الراتب الأساسي
  hourlyRate?: number; // أجر الساعة
  allowances?: number; // البدلات والحوافز
  deductions?: number; // الخصومات
  joinDate: string;
}

export interface FinanceTransaction {
  id: string;
  transactionNumber?: number;
  type: 'INCOME' | 'EXPENSE';
  category?: 'WAGES' | 'PARTS' | 'OPERATIONAL_RUNNING' | 'UTILITIES' | 'MAINTENANCE' | 'OTHER';
  amount: number;
  description: string;
  date: string;
  facilityId?: string;
  referenceId?: string; // e.g. WorkOrder ID or Employee User ID
  recordedBy?: string;
}

export type PreventiveMaintenanceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface SubFacility {
  id: string;
  name: string;
  children?: SubFacility[];
}

export interface Facility {
  id: string;
  facilityNumber?: number;
  name: string;
  subFacilities: SubFacility[];
}

export interface TaskPart {
  itemId: string;
  quantity: number;
}

export interface PreventiveMaintenanceTask {
  id: string;
  taskNumber?: number;
  facilityId: string;
  subFacilityId?: string;
  description: string;
  frequency: PreventiveMaintenanceFrequency;
  lastPerformed?: string;
  nextDueDate: string;
  assignedTo?: string; // User ID
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
  notes?: string;
  requiresSpareParts?: boolean;
  requiredParts?: TaskPart[];
}
