import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calculator,
  Printer,
  Plus,
  Search,
  Building2,
  Users,
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Trash2,
  Edit3,
  FileText,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ShieldCheck,
  Briefcase,
  Calendar,
  Zap,
  Tag,
  HelpCircle,
  X,
  ChevronLeft
} from 'lucide-react';
import { useStore } from '../store';
import { FinanceTransaction, EmployeeRecord, User } from '../types';
import { generateId, formatCode } from '../lib/utils';

export function Finance() {
  const {
    transactions,
    addTransaction,
    deleteTransaction,
    workOrders,
    employees,
    addEmployee,
    updateEmployee,
    users,
    facilities
  } = useStore();

  const [activeTab, setActiveTab] = useState<'RUNNING_COSTS' | 'WAGES' | 'LEDGER' | 'CALCULATOR'>('RUNNING_COSTS');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [facilityFilter, setFacilityFilter] = useState<string>('ALL');
  const [dateFilterMonth, setDateFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Modals
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState<User | null>(null);
  const [selectedSalarySlipUser, setSelectedSalarySlipUser] = useState<User | null>(null);

  // New Transaction Form State
  const [txType, setTxType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [txCategory, setTxCategory] = useState<'WAGES' | 'PARTS' | 'OPERATIONAL_RUNNING' | 'UTILITIES' | 'MAINTENANCE' | 'OTHER'>('OPERATIONAL_RUNNING');
  const [txAmount, setTxAmount] = useState<number | ''>('');
  const [txDescription, setTxDescription] = useState('');
  const [txFacilityId, setTxFacilityId] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);

  // Edit Employee Salary State
  const [empDepartment, setEmpDepartment] = useState('');
  const [empSalary, setEmpSalary] = useState<number>(0);
  const [empHourlyRate, setEmpHourlyRate] = useState<number>(0);
  const [empAllowances, setEmpAllowances] = useState<number>(0);
  const [empDeductions, setEmpDeductions] = useState<number>(0);

  // Running Cost Calculator State
  const [calcFacilityId, setCalcFacilityId] = useState(facilities[0]?.id || '');
  const [calcOperatingHours, setCalcOperatingHours] = useState<number>(300);
  const [calcPowerConsumptionKw, setCalcPowerConsumptionKw] = useState<number>(25);
  const [calcKwhPrice, setCalcKwhPrice] = useState<number>(2.5);
  const [calcPreventiveMonthlyCost, setCalcPreventiveMonthlyCost] = useState<number>(1200);
  const [calcTechnicianHourlyRate, setCalcTechnicianHourlyRate] = useState<number>(50);
  const [calcTechHoursNeeded, setCalcTechHoursNeeded] = useState<number>(40);
  const [calcChemicalsConsumables, setCalcChemicalsConsumables] = useState<number>(1500);

  // -------------------------------------------------------------
  // CALCULATIONS FOR RUNNING COSTS & FINANCIAL OVERVIEW
  // -------------------------------------------------------------
  
  // 1. Work Orders Financials
  const closedWorkOrders = workOrders.filter(w => w.status === 'CLOSED');
  const totalWOLaborCost = closedWorkOrders.reduce((sum, w) => sum + (w.laborCost || 0), 0);
  const totalWOPartsCost = closedWorkOrders.reduce((sum, w) => sum + (w.partsCost || 0), 0);
  const totalWOCosts = totalWOLaborCost + totalWOPartsCost;

  // 2. Transactions Financials
  const totalDirectIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDirectExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const directRunningCostExpenses = transactions
    .filter(t => t.type === 'EXPENSE' && (t.category === 'OPERATIONAL_RUNNING' || t.category === 'UTILITIES'))
    .reduce((sum, t) => sum + t.amount, 0);

  const directWagesExpenses = transactions
    .filter(t => t.type === 'EXPENSE' && t.category === 'WAGES')
    .reduce((sum, t) => sum + t.amount, 0);

  const directPartsExpenses = transactions
    .filter(t => t.type === 'EXPENSE' && t.category === 'PARTS')
    .reduce((sum, t) => sum + t.amount, 0);

  // Combined Total Running Cost (تكلفة التشغيل الإجمالية)
  // Total Running Cost = WO Parts + WO Labor + Direct Operational Expenses + Direct Utilities + Direct Parts Expenses
  const grandTotalRunningCost = totalWOPartsCost + totalWOLaborCost + directRunningCostExpenses + directPartsExpenses;

  // Average running cost per closed work order
  const avgCostPerWorkOrder = closedWorkOrders.length > 0 ? (grandTotalRunningCost / closedWorkOrders.length) : 0;

  // -------------------------------------------------------------
  // FACILITY BREAKDOWN OF RUNNING COSTS
  // -------------------------------------------------------------
  const facilityRunningCostBreakdown = facilities.map(fac => {
    // Work orders for this facility
    const facClosedOrders = closedWorkOrders.filter(w => w.facilityId === fac.id);
    const facLabor = facClosedOrders.reduce((sum, w) => sum + (w.laborCost || 0), 0);
    const facParts = facClosedOrders.reduce((sum, w) => sum + (w.partsCost || 0), 0);

    // Transactions for this facility
    const facTxExpenses = transactions
      .filter(t => t.type === 'EXPENSE' && t.facilityId === fac.id)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalFacRunningCost = facLabor + facParts + facTxExpenses;
    const percentage = grandTotalRunningCost > 0 ? ((totalFacRunningCost / grandTotalRunningCost) * 100) : 0;

    return {
      facility: fac,
      closedOrdersCount: facClosedOrders.length,
      laborCost: facLabor,
      partsCost: facParts,
      directExpenses: facTxExpenses,
      totalRunningCost: totalFacRunningCost,
      percentage: percentage.toFixed(1)
    };
  });

  // -------------------------------------------------------------
  // WAGE & PAYROLL CALCULATIONS
  // -------------------------------------------------------------
  // Get all technicians and staff
  const staffUsers = users.filter(u => u.role === 'TECHNICIAN' || u.role === 'SUPER_ADMIN' || u.role === 'RECEPTION' || u.role === 'INVENTORY_MANAGER' || u.role === 'FINANCE_MANAGER');

  const payrollSummary = staffUsers.map(user => {
    // Find employee record
    const empRecord = employees.find(e => e.userId === user.id) || {
      id: `emp-${user.id}`,
      userId: user.id,
      department: user.specialty || 'قسم الصيانة العامة',
      salary: user.role === 'TECHNICIAN' ? 6000 : 5000,
      hourlyRate: 40,
      allowances: 300,
      deductions: 0,
      joinDate: '2023-01-01'
    };

    // Find closed work orders assigned to this user
    const assignedClosedOrders = closedWorkOrders.filter(w => w.assignedTo && w.assignedTo.includes(user.id));
    
    // Total labor cost earned from assigned work orders
    const orderLaborEarned = assignedClosedOrders.reduce((sum, w) => {
      const assigneesCount = w.assignedTo.length || 1;
      return sum + ((w.laborCost || 0) / assigneesCount);
    }, 0);

    // Calculate Gross & Net Wage
    const baseSalary = empRecord.salary || 0;
    const allowances = empRecord.allowances || 0;
    const deductions = empRecord.deductions || 0;
    const netWage = baseSalary + orderLaborEarned + allowances - deductions;

    // Check if paid this month
    const currentMonth = dateFilterMonth; // YYYY-MM
    const paidTransaction = transactions.find(t => 
      t.type === 'EXPENSE' && 
      t.category === 'WAGES' && 
      t.referenceId === user.id &&
      t.date.startsWith(currentMonth)
    );

    return {
      user,
      empRecord,
      closedOrdersCount: assignedClosedOrders.length,
      orderLaborEarned,
      baseSalary,
      allowances,
      deductions,
      netWage,
      isPaid: !!paidTransaction,
      paidTransaction
    };
  });

  const totalMonthlyPayroll = payrollSummary.reduce((sum, item) => sum + item.netWage, 0);

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || Number(txAmount) <= 0 || !txDescription.trim()) return;

    const nextTxNumber = transactions.length > 0 ? Math.max(...transactions.map(t => t.transactionNumber || 0)) + 1 : 1;
    const newTx: FinanceTransaction = {
      id: generateId(),
      transactionNumber: nextTxNumber,
      type: txType,
      category: txCategory,
      amount: Number(txAmount),
      description: txDescription.trim(),
      facilityId: txFacilityId || undefined,
      date: txDate || new Date().toISOString().split('T')[0],
      recordedBy: 'المدير المالي'
    };

    addTransaction(newTx);
    setShowAddTransactionModal(false);
    // Reset form
    setTxAmount('');
    setTxDescription('');
    setTxFacilityId('');
  };

  const handleOpenEditEmployee = (user: User) => {
    const emp = employees.find(e => e.userId === user.id);
    setEmpDepartment(emp?.department || user.specialty || 'قسم الصيانة العامة');
    setEmpSalary(emp?.salary || 6000);
    setEmpHourlyRate(emp?.hourlyRate || 40);
    setEmpAllowances(emp?.allowances || 300);
    setEmpDeductions(emp?.deductions || 0);
    setShowEditEmployeeModal(user);
  };

  const handleSaveEmployeeRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditEmployeeModal) return;

    const existing = employees.find(e => e.userId === showEditEmployeeModal.id);
    const updatedRecord: EmployeeRecord = {
      id: existing ? existing.id : generateId(),
      userId: showEditEmployeeModal.id,
      department: empDepartment || 'قسم الصيانة العامة',
      salary: Number(empSalary) || 0,
      hourlyRate: Number(empHourlyRate) || 0,
      allowances: Number(empAllowances) || 0,
      deductions: Number(empDeductions) || 0,
      joinDate: existing?.joinDate || new Date().toISOString().split('T')[0]
    };

    if (existing) {
      updateEmployee(updatedRecord);
    } else {
      addEmployee(updatedRecord);
    }

    setShowEditEmployeeModal(null);
  };

  const handlePayWage = (item: typeof payrollSummary[0]) => {
    if (item.isPaid) return;

    const nextTxNumber = transactions.length > 0 ? Math.max(...transactions.map(t => t.transactionNumber || 0)) + 1 : 1;
    const newTx: FinanceTransaction = {
      id: generateId(),
      transactionNumber: nextTxNumber,
      type: 'EXPENSE',
      category: 'WAGES',
      amount: item.netWage,
      description: `صرف مسير أجر شهر ${dateFilterMonth} - ${item.user.name} (${item.empRecord.department})`,
      referenceId: item.user.id,
      date: new Date().toISOString().split('T')[0],
      recordedBy: 'المدير المالي'
    };

    addTransaction(newTx);
  };

  // -------------------------------------------------------------
  // PRINT FUNCTIONS
  // -------------------------------------------------------------

  const printRunningCostsReport = () => {
    const printWindow = window.open('', '', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>تقرير تكاليف التشغيل المجمع (Running Costs Report)</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; background: #fff; }
            h1 { text-align: center; color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
            .header-info { display: flex; justify-content: space-between; margin-bottom: 25px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
            .kpi-card { background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #cbd5e1; }
            .kpi-card .val { font-size: 20px; font-weight: bold; color: #0369a1; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: right; font-size: 13px; }
            th { background-color: #0f172a; color: white; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <h1>تقرير تحليل تكاليف التشغيل (Running Costs Statement)</h1>
          <div class="header-info">
            <div><strong>الفترة:</strong> ${dateFilterMonth}</div>
            <div><strong>تاريخ الإصدار:</strong> ${new Date().toLocaleDateString('ar-EG')}</div>
            <div><strong>عدد المنشآت:</strong> ${facilities.length}</div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card">
              <div>إجمالي تكلفة التشغيل</div>
              <div class="val">${grandTotalRunningCost.toLocaleString()} ج.م</div>
            </div>
            <div class="kpi-card">
              <div>أجور أعمال الصيانة</div>
              <div class="val">${totalWOLaborCost.toLocaleString()} ج.م</div>
            </div>
            <div class="kpi-card">
              <div>تكلفة قطع الغيار</div>
              <div class="val">${(totalWOPartsCost + directPartsExpenses).toLocaleString()} ج.م</div>
            </div>
            <div class="kpi-card">
              <div>المصاريف التشغيلية المباشرة</div>
              <div class="val">${directRunningCostExpenses.toLocaleString()} ج.م</div>
            </div>
          </div>

          <h2>تفاصيل تكلفة التشغيل حسب المنشأة</h2>
          <table>
            <thead>
              <tr>
                <th>اسم المنشأة</th>
                <th>طلبات الصيانة المغلقة</th>
                <th>تكلفة الأجور (ج.م)</th>
                <th>قطع الغيار (ج.م)</th>
                <th>مصاريف تشغيلية (ج.م)</th>
                <th>إجمالي التكلفة (ج.م)</th>
                <th>النسبة من التشغيل</th>
              </tr>
            </thead>
            <tbody>
              ${facilityRunningCostBreakdown.map(item => `
                <tr>
                  <td><strong>${item.facility.name}</strong></td>
                  <td>${item.closedOrdersCount}</td>
                  <td>${item.laborCost.toLocaleString()}</td>
                  <td>${item.partsCost.toLocaleString()}</td>
                  <td>${item.directExpenses.toLocaleString()}</td>
                  <td><strong>${item.totalRunningCost.toLocaleString()} ج.م</strong></td>
                  <td>${item.percentage}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            تم استخراج هذا التقرير آلياً بواسطة نظام إدارة الصيانة والمالية - جميع الحقوق محفوظة © ${new Date().getFullYear()}
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const printPayrollReport = () => {
    const printWindow = window.open('', '', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>مسير أجور ورواتب الفنيين والعاملين (Payroll Sheet)</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; background: #fff; }
            h1 { text-align: center; color: #0f172a; border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-bottom: 20px; }
            .header-info { display: flex; justify-content: space-between; margin-bottom: 25px; background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: right; font-size: 13px; }
            th { background-color: #065f46; color: white; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .total-row { background-color: #ecfdf5 !important; font-weight: bold; font-size: 14px; }
            .signature-block { display: flex; justify-content: space-between; margin-top: 50px; padding: 0 30px; }
            .sig { text-align: center; border-top: 1px dashed #94a3b8; width: 200px; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>مسير احتساب الأجور والرواتب الشهري</h1>
          <div class="header-info">
            <div><strong>فترة المسير:</strong> شهر ${dateFilterMonth}</div>
            <div><strong>إجمالي الاستحقاقات:</strong> ${totalMonthlyPayroll.toLocaleString()} ج.م</div>
            <div><strong>تاريخ الاعتماد:</strong> ${new Date().toLocaleDateString('ar-EG')}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>اسم الموظف / الفني</th>
                <th>القسم / التخصص</th>
                <th>الراتب الأساسي</th>
                <th>أوامر صيانة منفذة</th>
                <th>مستحق مهام الصيانة</th>
                <th>البدلات والحوافز</th>
                <th>الخصومات</th>
                <th>صافي الأجر المستحق</th>
                <th>حالة الصرف</th>
              </tr>
            </thead>
            <tbody>
              ${payrollSummary.map(item => `
                <tr>
                  <td><strong>${item.user.name}</strong></td>
                  <td>${item.empRecord.department}</td>
                  <td>${item.baseSalary.toLocaleString()} ج.م</td>
                  <td>${item.closedOrdersCount} أمر صيانة</td>
                  <td>${item.orderLaborEarned.toLocaleString()} ج.م</td>
                  <td>+${item.allowances.toLocaleString()} ج.م</td>
                  <td>-${item.deductions.toLocaleString()} ج.م</td>
                  <td><strong style="color: #047857;">${item.netWage.toLocaleString()} ج.م</strong></td>
                  <td>${item.isPaid ? 'تم الصرف' : 'بانتظار الصرف'}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="7">إجمالي الأجور المستحقة للموظفين:</td>
                <td colspan="2" style="color: #047857;">${totalMonthlyPayroll.toLocaleString()} ج.م</td>
              </tr>
            </tbody>
          </table>

          <div class="signature-block">
            <div class="sig">توقيع المحاسب المالي</div>
            <div class="sig">توقيع مدير الموارد البشرية</div>
            <div class="sig">اعتماد المدير العام</div>
          </div>

          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const printSalarySlip = (item: typeof payrollSummary[0]) => {
    const printWindow = window.open('', '', 'width=700,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>قسيمة مفردات أجر - ${item.user.name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
            .slip-box { border: 2px solid #0f172a; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; }
            .title { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 25px; font-size: 14px; background: #f8fafc; padding: 15px; border-radius: 8px; }
            .detail-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .detail-table td, .detail-table th { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: right; }
            .net-box { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 8px; text-align: center; margin-top: 20px; }
            .net-val { font-size: 24px; font-weight: bold; color: #047857; }
          </style>
        </head>
        <body>
          <div class="slip-box">
            <div class="title">
              <h2 style="margin:0;">قسيمة مفردات أجر راتب شهر (${dateFilterMonth})</h2>
              <p style="margin:5px 0 0 0; color:#64748b; font-size:13px;">إشعار أجر ومستحقات صيانة فردي</p>
            </div>

            <div class="info-grid">
              <div><strong>اسم الموظف:</strong> ${item.user.name}</div>
              <div><strong>القسم/التخصص:</strong> ${item.empRecord.department}</div>
              <div><strong>نوع الحساب:</strong> ${item.user.role}</div>
              <div><strong>تاريخ الإصدار:</strong> ${new Date().toLocaleDateString('ar-EG')}</div>
            </div>

            <h3>تفاصيل الاستحقاقات والاستقطاعات:</h3>
            <table class="detail-table">
              <tr>
                <td>الراتب الأساسي الشهري</td>
                <td><strong>${item.baseSalary.toLocaleString()} ج.م</strong></td>
              </tr>
              <tr>
                <td>عائد أجور مهام الصيانة المنفذة (${item.closedOrdersCount} طلب صيانة)</td>
                <td><strong>+${item.orderLaborEarned.toLocaleString()} ج.م</strong></td>
              </tr>
              <tr>
                <td>البدلات والحوافز الإضافية</td>
                <td><strong>+${item.allowances.toLocaleString()} ج.م</strong></td>
              </tr>
              <tr>
                <td>الاستقطاعات والخصومات</td>
                <td style="color:#dc2626;"><strong>-${item.deductions.toLocaleString()} ج.م</strong></td>
              </tr>
            </table>

            <div class="net-box">
              <div style="font-size:13px; color:#065f46;">صافي الأجر المحول للموظف</div>
              <div class="net-val">${item.netWage.toLocaleString()} ج.م</div>
            </div>

            <div style="margin-top:30px; display:flex; justify-between; font-size:12px; color:#64748b; text-align:center;">
              <div style="flex:1;">توقيع المستلم: ....................</div>
              <div style="flex:1;">توقيع الحسابات: ....................</div>
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const printGeneralLedgerReport = () => {
    const printWindow = window.open('', '', 'width=950,height=750');
    if (!printWindow) return;

    const totalExpense = filteredTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = filteredTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>تقرير دفتر القيود والمصروفات المالية (General Ledger)</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; background: #fff; }
            h1 { text-align: center; color: #0f172a; border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 20px; }
            .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #a7f3d0; font-size: 13px; }
            .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
            .card { padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #cbd5e1; }
            .card-title { font-size: 12px; color: #64748b; }
            .card-value { font-size: 18px; font-weight: bold; margin-top: 4px; }
            .expense { background: #fff1f2; border-color: #fecdd3; color: #be123c; }
            .income { background: #f0fdf4; border-color: #bbf7d0; color: #047857; }
            .balance { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: right; font-size: 12px; }
            th { background-color: #0f172a; color: white; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .badge-expense { color: #dc2626; font-weight: bold; }
            .badge-income { color: #16a34a; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <h1>تقرير دفتر القيود والمصروفات المالية</h1>
          <div class="header-info">
            <div><strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-EG')}</div>
            <div><strong>التصنيف المصفى:</strong> ${categoryFilter === 'ALL' ? 'جميع التصنيفات' : categoryFilter}</div>
            <div><strong>عدد القيود:</strong> ${filteredTransactions.length} قيد مالي</div>
          </div>

          <div class="summary-cards">
            <div class="card expense">
              <div class="card-title">إجمالي المصروفات</div>
              <div class="card-value">${totalExpense.toLocaleString()} ج.م</div>
            </div>
            <div class="card income">
              <div class="card-title">إجمالي المقبوضات / الإيراد</div>
              <div class="card-value">${totalIncome.toLocaleString()} ج.م</div>
            </div>
            <div class="card balance">
              <div class="card-title">صافي التدفق المالي</div>
              <div class="card-value">${(totalIncome - totalExpense).toLocaleString()} ج.م</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>رقم القيد</th>
                <th>التاريخ</th>
                <th>النوع</th>
                <th>التصنيف</th>
                <th>البيان / التفاصيل</th>
                <th>المنشأة</th>
                <th>المبلغ (ج.م)</th>
                <th>المحرر</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map((tx) => {
                const fac = facilities.find(f => f.id === tx.facilityId)?.name || 'غير محدد';
                const isExp = tx.type === 'EXPENSE';
                const categoryAr = tx.category === 'WAGES' ? 'أجور ومرتبات' :
                  tx.category === 'PARTS' ? 'قطع غيار' :
                  tx.category === 'OPERATIONAL_RUNNING' ? 'تكلفة تشغيل' :
                  tx.category === 'UTILITIES' ? 'مرافق وكهرباء' :
                  tx.category === 'MAINTENANCE' ? 'صيانة' : 'عام';
                return `
                  <tr>
                    <td><strong>${formatCode('FIN', tx.transactionNumber)}</strong></td>
                    <td>${tx.date}</td>
                    <td class="${isExp ? 'badge-expense' : 'badge-income'}">${isExp ? 'سند مصروف' : 'سند إيراد'}</td>
                    <td>${categoryAr}</td>
                    <td>${tx.description}</td>
                    <td>${fac}</td>
                    <td class="${isExp ? 'badge-expense' : 'badge-income'}"><strong>${isExp ? '-' : '+'}${tx.amount.toLocaleString()} ج.م</strong></td>
                    <td>${tx.recordedBy || 'المدير المالي'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="footer">
            تم استخراج هذا التقرير آلياً بواسطة نظام إدارة الصيانة والمالية - جميع الحقوق محفوظة © ${new Date().getFullYear()}
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const printSingleTransactionVoucher = (tx: FinanceTransaction) => {
    const printWindow = window.open('', '', 'width=750,height=650');
    if (!printWindow) return;

    const fac = facilities.find(f => f.id === tx.facilityId)?.name || 'المقر الرئيسي / المجمعات العامة';
    const isExp = tx.type === 'EXPENSE';
    const voucherTitle = isExp ? 'سند صرف مالي (Payment Voucher)' : 'سند قبض / إيراد (Receipt Voucher)';
    const categoryAr = tx.category === 'WAGES' ? 'أجور ومرتبات' :
      tx.category === 'PARTS' ? 'قطع غيار ومستلزمات' :
      tx.category === 'OPERATIONAL_RUNNING' ? 'مصاريف تشغيلية (Running Cost)' :
      tx.category === 'UTILITIES' ? 'مرافق وفواتير كهرباء/ماء' :
      tx.category === 'MAINTENANCE' ? 'صيانة وتحديثات' : 'عام / أخرى';

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>${voucherTitle} - ${formatCode('FIN', tx.transactionNumber)}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #0f172a; background: #fff; }
            .voucher-card { border: 2px solid #0f172a; border-radius: 12px; padding: 30px; max-width: 650px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
            .org-name { font-size: 18px; font-weight: bold; color: #0f172a; }
            .v-title { font-size: 16px; font-weight: bold; color: ${isExp ? '#be123c' : '#047857'}; margin-top: 5px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
            .amount-box { background: ${isExp ? '#fff1f2' : '#f0fdf4'}; border: 2px solid ${isExp ? '#fecdd3' : '#bbf7d0'}; padding: 15px; border-radius: 10px; text-align: center; margin-bottom: 20px; }
            .amount-val { font-size: 26px; font-weight: bold; color: ${isExp ? '#be123c' : '#047857'}; font-family: monospace; }
            .details-box { font-size: 14px; line-height: 1.8; margin-bottom: 30px; }
            .details-row { display: flex; border-bottom: 1px solid #f1f5f9; padding: 8px 0; }
            .label { font-weight: bold; width: 140px; color: #475569; }
            .val { flex: 1; color: #0f172a; }
            .sig-block { display: flex; justify-content: space-between; margin-top: 40px; text-align: center; font-size: 12px; color: #475569; }
            .sig { border-top: 1px dashed #94a3b8; width: 160px; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="voucher-card">
            <div class="header">
              <div class="org-name">نظام إدارة الصيانة التشغيلية والمالية</div>
              <div class="v-title">${voucherTitle}</div>
            </div>

            <div class="meta-grid">
              <div><strong>رقم القيد / السند:</strong> ${formatCode('FIN', tx.transactionNumber)}</div>
              <div><strong>تاريخ القيد:</strong> ${tx.date}</div>
              <div><strong>نوع المعاملة:</strong> ${isExp ? 'مصروف مالي' : 'إيراد / ميزانية'}</div>
              <div><strong>محرر القيد:</strong> ${tx.recordedBy || 'المدير المالي'}</div>
            </div>

            <div class="amount-box">
              <div style="font-size:12px; color:${isExp ? '#9f1239' : '#065f46'}; font-weight:bold;">المبلغ الإجمالي المسجل</div>
              <div class="amount-val">${tx.amount.toLocaleString()} ج.م</div>
            </div>

            <div class="details-box">
              <div class="details-row">
                <div class="label">التصنيف المالي:</div>
                <div class="val"><strong>${categoryAr}</strong></div>
              </div>
              <div class="details-row">
                <div class="label">المنشأة التابعة:</div>
                <div class="val">${fac}</div>
              </div>
              <div class="details-row">
                <div class="label">البيان والتفاصيل:</div>
                <div class="val">${tx.description}</div>
              </div>
            </div>

            <div class="sig-block">
              <div class="sig">توقيع المحاسب / المحرر</div>
              <div class="sig">توقيع المستلم / الفني</div>
              <div class="sig">اعتماد المدير المالي</div>
            </div>
          </div>

          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // -------------------------------------------------------------
  // CALCULATOR OUTPUTS
  // -------------------------------------------------------------
  const calcPowerCostMonthly = (calcOperatingHours * calcPowerConsumptionKw * calcKwhPrice);
  const calcTechCostMonthly = (calcTechHoursNeeded * calcTechnicianHourlyRate);
  const totalCalculatedMonthlyRunningCost = calcPowerCostMonthly + calcTechCostMonthly + calcPreventiveMonthlyCost + calcChemicalsConsumables;
  const totalCalculatedAnnualRunningCost = totalCalculatedMonthlyRunningCost * 12;
  const costPerOperatingHour = calcOperatingHours > 0 ? (totalCalculatedMonthlyRunningCost / calcOperatingHours) : 0;

  // -------------------------------------------------------------
  // FILTERED TRANSACTIONS LEDGER
  // -------------------------------------------------------------
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
    const matchesFacility = facilityFilter === 'ALL' || t.facilityId === facilityFilter;
    return matchesSearch && matchesCategory && matchesFacility;
  });

  return (
    <div className="space-y-6 pb-12 dir-rtl">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit mb-2 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5" />
            النظام المالي وحساب تكاليف التشغيل والأجور
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">النظام المالي والقيود</h2>
          <p className="text-sm text-slate-500 mt-1">
            احتساب تكاليف التشغيل (Running Costs)، مسير أجور ورواتب الفنيين، وتتبع القيود الماليّة.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddTransactionModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            إضافة قيد / مصروف جديد
          </button>

          {activeTab === 'RUNNING_COSTS' && (
            <button
              onClick={printRunningCostsReport}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-900 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              طباعة تقرير تكاليف التشغيل
            </button>
          )}

          {activeTab === 'WAGES' && (
            <button
              onClick={printPayrollReport}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-900 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              طباعة كشف الأجور
            </button>
          )}

          {activeTab === 'LEDGER' && (
            <button
              onClick={printGeneralLedgerReport}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-900 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              طباعة دفتر القيود
            </button>
          )}
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('RUNNING_COSTS')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'RUNNING_COSTS'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          تكاليف التشغيل (Running Costs)
        </button>

        <button
          onClick={() => setActiveTab('WAGES')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'WAGES'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          احتساب الأجور والرواتب
        </button>

        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'LEDGER'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Wallet className="w-4 h-4" />
          دفتر القيود والمصروفات
        </button>

        <button
          onClick={() => setActiveTab('CALCULATOR')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'CALCULATOR'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Calculator className="w-4 h-4" />
          حاسبة محاكاة التكاليف التشغيلية
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: RUNNING COSTS SYSTEM */}
      {/* ============================================================== */}
      {activeTab === 'RUNNING_COSTS' && (
        <div className="space-y-6">
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>إجمالي تكاليف التشغيل (Running Costs)</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {grandTotalRunningCost.toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span>
              </div>
              <p className="text-xs text-slate-500">تشمل أجور الصيانة + قطع الغيار + المصاريف المباشرة</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>إجمالي أجور الصيانة والعمالة</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Wrench className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-blue-900 font-mono">
                {totalWOLaborCost.toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span>
              </div>
              <p className="text-xs text-slate-500">من واقع أوامر الصيانة المغلقة المنجزة</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>تكلفة قطع الغيار والمعدات</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Tag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-900 font-mono">
                {(totalWOPartsCost + directPartsExpenses).toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span>
              </div>
              <p className="text-xs text-slate-500">المستهلكة في طلبات الصيانة والمشتريات</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>متوسط التكلفة لأمر الصيانة</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Calculator className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-indigo-900 font-mono">
                {Math.round(avgCostPerWorkOrder).toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م/طلب</span>
              </div>
              <p className="text-xs text-slate-500">بناءً على {closedWorkOrders.length} طلب صيانة مغلق</p>
            </div>
          </div>

          {/* FACILITY RUNNING COST BREAKDOWN TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">تحليل تكلفة التشغيل لكل منشأة (Facility Running Cost Breakdown)</h3>
                <p className="text-xs text-slate-500 mt-0.5">توزيع التكاليف التشغيلية بين المجمع الرياضي والمسابح والتكييف والكهرباء</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                عدد المنشآت: {facilities.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4">اسم المنشأة / المجمع</th>
                    <th className="py-3 px-4">طلبات الصيانة المغلقة</th>
                    <th className="py-3 px-4">أجور الصيانة (ج.م)</th>
                    <th className="py-3 px-4">قطع الغيار (ج.م)</th>
                    <th className="py-3 px-4">مصاريف تشغيلية (ج.م)</th>
                    <th className="py-3 px-4">إجمالي تكلفة التشغيل</th>
                    <th className="py-3 px-4 w-48">مؤشر المساهمة من التشغيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {facilityRunningCostBreakdown.map((item) => (
                    <tr key={item.facility.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        {item.facility.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-md">
                          {item.closedOrdersCount} طلب مغلق
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-700">
                        {item.laborCost.toLocaleString()} ج.م
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-amber-700">
                        {item.partsCost.toLocaleString()} ج.م
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-purple-700">
                        {item.directExpenses.toLocaleString()} ج.م
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-emerald-800 text-sm">
                        {item.totalRunningCost.toLocaleString()} ج.م
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                            <span>{item.percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(Number(item.percentage), 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* WORK ORDERS COST DETAILS LIST */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">سجل تكاليف أجور وقطع غيار أوامر الصيانة</h3>
                <p className="text-xs text-slate-500 mt-0.5">تكلفة كل طلب صيانة بناءً على العمالة وقطع الغيار المستخدمة</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4">رقم / عنوان الطلب</th>
                    <th className="py-3 px-4">المنشأة التابعة</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4">الفنيون المسؤولون</th>
                    <th className="py-3 px-4">أجر العمالة (ج.م)</th>
                    <th className="py-3 px-4">تكلفة قطع الغيار (ج.م)</th>
                    <th className="py-3 px-4">التكلفة الإجمالية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workOrders.map((order) => {
                    const facName = facilities.find(f => f.id === order.facilityId)?.name || 'عام';
                    const orderCost = (order.laborCost || 0) + (order.partsCost || 0);
                    const assigneesNames = order.assignedTo
                      .map(id => users.find(u => u.id === id)?.name || id)
                      .join(', ') || 'غير معين';

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {formatCode('WO', order.orderNumber)} - {order.title}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{facName}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            order.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-800' :
                            order.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {order.status === 'CLOSED' ? 'مغلق نهائياً' : order.status === 'COMPLETED' ? 'مكتمل' : 'قيد التنفيذ'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{assigneesNames}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-blue-700">{(order.laborCost || 0).toLocaleString()} ج.م</td>
                        <td className="py-3 px-4 font-mono font-semibold text-amber-700">{(order.partsCost || 0).toLocaleString()} ج.م</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{orderCost.toLocaleString()} ج.م</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: WAGES & PAYROLL SYSTEM */}
      {/* ============================================================== */}
      {activeTab === 'WAGES' && (
        <div className="space-y-6">
          {/* HEADER SUMMARY */}
          <div className="bg-emerald-900 text-white p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-emerald-300 bg-emerald-800/80 px-3 py-1 rounded-full border border-emerald-700">
                  نظام احتساب الأجور والرواتب الشهري
                </span>
                <h3 className="text-xl font-bold mt-2">مسير الأجور والرواتب للفنيين والموظفين</h3>
                <p className="text-xs text-emerald-200 mt-1">
                  يتم إحتساب الأجر النهائي تلقائياً بناءً على: (الراتب الأساسي) + (مستحق أجور طلبات الصيانة المنفذة) + (البدلات) - (الخصومات).
                </p>
              </div>

              <div className="bg-emerald-800/60 p-4 rounded-xl border border-emerald-700 text-left dir-ltr min-w-[200px]">
                <div className="text-xs text-emerald-300">Total Monthly Payroll</div>
                <div className="text-2xl font-black text-white font-mono">{totalMonthlyPayroll.toLocaleString()} EGP</div>
              </div>
            </div>
          </div>

          {/* PAYROLL SHEET TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">جدول مسير أجور الكادر والفنيين (Payroll Sheet)</h3>
                <p className="text-xs text-slate-500 mt-0.5">عرض الموظفين، الراتب الأساسي، أجور مهام الصيانة، البدلات، والصافي</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">اختر شهر المسير:</span>
                <input
                  type="month"
                  value={dateFilterMonth}
                  onChange={(e) => setDateFilterMonth(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4">الموظف / الفني</th>
                    <th className="py-3.5 px-4">القسم / التخصص</th>
                    <th className="py-3.5 px-4">الراتب الأساسي</th>
                    <th className="py-3.5 px-4">أوامر الصيانة المنفذة</th>
                    <th className="py-3.5 px-4">أجور مهام الصيانة (Labor)</th>
                    <th className="py-3.5 px-4">البدلات (+)</th>
                    <th className="py-3.5 px-4">الخصومات (-)</th>
                    <th className="py-3.5 px-4">صافي الأجر المستحق</th>
                    <th className="py-3.5 px-4">حالة الصرف</th>
                    <th className="py-3.5 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {payrollSummary.map((item) => (
                    <tr key={item.user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                            {item.user.name.slice(0, 1)}
                          </div>
                          <div>
                            <div>{item.user.name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{item.user.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{item.empRecord.department}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold">{item.baseSalary.toLocaleString()} ج.م</td>
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[11px]">
                          {item.closedOrdersCount} طلب صيانة
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-700">
                        +{item.orderLaborEarned.toLocaleString()} ج.م
                      </td>
                      <td className="py-3.5 px-4 font-mono text-emerald-700 font-semibold">
                        +{item.allowances.toLocaleString()} ج.م
                      </td>
                      <td className="py-3.5 px-4 font-mono text-rose-600 font-semibold">
                        -{item.deductions.toLocaleString()} ج.م
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-slate-900 text-sm bg-emerald-50/50">
                        {item.netWage.toLocaleString()} ج.م
                      </td>
                      <td className="py-3.5 px-4">
                        {item.isPaid ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            تم الصرف
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-[11px] font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            بانتظار الصرف
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!item.isPaid && (
                            <button
                              onClick={() => handlePayWage(item)}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 text-[11px] transition-colors shadow-2xs"
                              title="تسجيل صرف الأجر المالي"
                            >
                              صرف الأجر
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEditEmployee(item.user)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="تعديل مفردات الراتب"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => printSalarySlip(item)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="طباعة قسيمة الأجر التفصيلية"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: FINANCIAL LEDGER & TRANSACTIONS */}
      {/* ============================================================== */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-6">
          {/* SEARCH & FILTER BAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="بحث في القيود والبيان..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-9 pl-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <span>التصنيف:</span>
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">جميع التصنيفات</option>
                <option value="WAGES">أجور ومرتبات</option>
                <option value="PARTS">قطع غيار ومستلزمات</option>
                <option value="OPERATIONAL_RUNNING">مصاريف تشغيلية (Running Cost)</option>
                <option value="UTILITIES">فواتير ومرافق (كهرباء/ماء)</option>
                <option value="MAINTENANCE">صيانة وتحديثات</option>
                <option value="OTHER">أخرى</option>
              </select>

              <select
                value={facilityFilter}
                onChange={(e) => setFacilityFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">جميع المنشآت</option>
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* TRANSACTIONS TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">دفتر القيود والمصروفات التشغيلية</h3>
              <span className="text-xs text-slate-500 font-semibold">
                عدد القيود المسجلة: {filteredTransactions.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4">رقم القيد</th>
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4">نوع القيد</th>
                    <th className="py-3 px-4">التصنيف المالي</th>
                    <th className="py-3 px-4">البيان / التفاصيل</th>
                    <th className="py-3 px-4">المنشأة التابعة</th>
                    <th className="py-3 px-4">المبلغ (ج.م)</th>
                    <th className="py-3 px-4 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">
                        لا توجد قيود مالية مطابقة للبحث.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const facName = facilities.find(f => f.id === tx.facilityId)?.name || 'غير محدد';
                      const isExpense = tx.type === 'EXPENSE';

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-500">{formatCode('FIN', tx.transactionNumber)}</td>
                          <td className="py-3 px-4 font-mono text-slate-500">
                            {new Date(tx.date).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isExpense ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isExpense ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                              {isExpense ? 'مصروف' : 'إيراد / ميزانية'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {tx.category === 'WAGES' ? 'أجور ومرتبات' :
                             tx.category === 'PARTS' ? 'قطع غيار' :
                             tx.category === 'OPERATIONAL_RUNNING' ? 'تكلفة تشغيل (Running Cost)' :
                             tx.category === 'UTILITIES' ? 'مرافق وكهرباء' :
                             tx.category === 'MAINTENANCE' ? 'صيانة ومعدات' : 'عام'}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900">{tx.description}</td>
                          <td className="py-3 px-4 text-slate-600">{facName}</td>
                          <td className={`py-3 px-4 font-mono font-bold text-sm ${isExpense ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {isExpense ? '-' : '+'}{tx.amount.toLocaleString()} ج.م
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => printSingleTransactionVoucher(tx)}
                                className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="طباعة سند القيد المالي"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { if (window.confirm('هل أنت متأكد من حذف هذه العملية؟')) deleteTransaction(tx.id); }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="حذف القيد"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: RUNNING COST CALCULATOR & SIMULATOR */}
      {/* ============================================================== */}
      {activeTab === 'CALCULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CALCULATOR INPUT FORM */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-600" />
                حاسبة محاكاة تكلفة التشغيل (Running Cost Simulator)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                قم بإدخال معاملات التشغيل والطاقة وأجور الفنيين للوصول إلى تقدير هدمي دقيق لتكلفة تشغيل المنشأة الميدانية.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">المنشأة المستهدفة للمحاكاة</label>
                <select
                  value={calcFacilityId}
                  onChange={(e) => setCalcFacilityId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {facilities.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ساعات التشغيل الشهرية المتوقعة (ساعة/شهر)</label>
                <input
                  type="number"
                  value={calcOperatingHours}
                  onChange={(e) => setCalcOperatingHours(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">معدل استهلاك الطاقة (كيلوواط/ساعة)</label>
                <input
                  type="number"
                  value={calcPowerConsumptionKw}
                  onChange={(e) => setCalcPowerConsumptionKw(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">سعر الكيلوواط/ساعة للكهرباء والوقود (ج.م)</label>
                <input
                  type="number"
                  step="0.1"
                  value={calcKwhPrice}
                  onChange={(e) => setCalcKwhPrice(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ساعات عمل الصيانة والعمالة المطلوبة (ساعة)</label>
                <input
                  type="number"
                  value={calcTechHoursNeeded}
                  onChange={(e) => setCalcTechHoursNeeded(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">معدل أجر الفني للساعة (ج.م/ساعة)</label>
                <input
                  type="number"
                  value={calcTechnicianHourlyRate}
                  onChange={(e) => setCalcTechnicianHourlyRate(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">تكلفة الصيانة الوقائية الشهرية المخططة (ج.م)</label>
                <input
                  type="number"
                  value={calcPreventiveMonthlyCost}
                  onChange={(e) => setCalcPreventiveMonthlyCost(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">تكلفة المستهلكات والمواد الكيميائية الشهرية (ج.م)</label>
                <input
                  type="number"
                  value={calcChemicalsConsumables}
                  onChange={(e) => setCalcChemicalsConsumables(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* CALCULATOR RESULTS CARD */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col justify-between space-y-6 shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                  نتائج تقدير تكلفة التشغيل
                </span>
                <Zap className="w-5 h-5 text-amber-400" />
              </div>

              <h4 className="text-lg font-bold mt-4">إجمالي التكلفة التشغيلية التقديرية</h4>
              
              <div className="mt-4 p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
                <div className="text-xs text-slate-400">تكلفة التشغيل الشهرية المتوقعة</div>
                <div className="text-3xl font-black text-emerald-400 font-mono">
                  {Math.round(totalCalculatedMonthlyRunningCost).toLocaleString()} <span className="text-xs font-normal text-slate-300">ج.م/شهر</span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700">
                  <div className="text-slate-400 text-[10px]">التكلفة السنوية التقديرية</div>
                  <div className="font-bold text-white font-mono mt-1">
                    {Math.round(totalCalculatedAnnualRunningCost).toLocaleString()} ج.م
                  </div>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700">
                  <div className="text-slate-400 text-[10px]">تكلفة الساعة التشغيلية</div>
                  <div className="font-bold text-amber-300 font-mono mt-1">
                    {costPerOperatingHour.toFixed(1)} ج.م/ساعة
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs border-t border-slate-800 pt-3 text-slate-300">
                <div className="flex justify-between">
                  <span>تكلفة الكهرباء والوقود:</span>
                  <span className="font-mono text-white">{calcPowerCostMonthly.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span>أجور العمالة المباشرة:</span>
                  <span className="font-mono text-white">{calcTechCostMonthly.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span>الصيانة الوقائية:</span>
                  <span className="font-mono text-white">{calcPreventiveMonthlyCost.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span>المواد والمستهلكات:</span>
                  <span className="font-mono text-white">{calcChemicalsConsumables.toLocaleString()} ج.م</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                alert(`تم اعتماد نتيجة التقدير للمنشأة بتكلفة تشغيل شهرية قدرها ${Math.round(totalCalculatedMonthlyRunningCost)} ج.م.`);
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors shadow-xs"
            >
              حفظ واعتماد محاكاة التكلفة
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: ADD TRANSACTION MODAL */}
      {/* ============================================================== */}
      {showAddTransactionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                إضافة قيد / مصروف جديد للنظام المالي
              </h3>
              <button
                onClick={() => setShowAddTransactionModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نوع القيد المالي</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as 'EXPENSE' | 'INCOME')}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="EXPENSE">مصروف (Expense)</option>
                    <option value="INCOME">إيراد / ميزانية (Income)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">التصنيف المالي</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="OPERATIONAL_RUNNING">مصاريف تشغيلية (Running Cost)</option>
                    <option value="WAGES">أجور ومرتبات</option>
                    <option value="PARTS">قطع غيار ومستلزمات</option>
                    <option value="UTILITIES">فواتير ومرافق (كهرباء/ماء)</option>
                    <option value="MAINTENANCE">صيانة ومعدات</option>
                    <option value="OTHER">أخرى</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">المبلغ المطلوب (ج.م) *</label>
                <input
                  type="number"
                  required
                  placeholder="أدخل المبلغ..."
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">المنشأة التابعة (اختر إن وجدت)</label>
                <select
                  value={txFacilityId}
                  onChange={(e) => setTxFacilityId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- مصروف عام / غير مرتبط بفرع معين --</option>
                  {facilities.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">البيان / الوصف التفصيلي *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="وصف القيد أو شحنة قطع الغيار أو المصروف..."
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">التاريخ</label>
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTransactionModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  حفظ القيد المالي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: EDIT EMPLOYEE SALARY & WAGES DATA */}
      {/* ============================================================== */}
      {showEditEmployeeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">تعديل هيكل أجر وراتب الموظف</h3>
                <p className="text-xs text-slate-500">{showEditEmployeeModal.name} ({showEditEmployeeModal.role})</p>
              </div>
              <button
                onClick={() => setShowEditEmployeeModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployeeRecord} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">القسم / التخصص الوظيفي</label>
                <input
                  type="text"
                  value={empDepartment}
                  onChange={(e) => setEmpDepartment(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الراتب الأساسي (ج.م)</label>
                  <input
                    type="number"
                    value={empSalary}
                    onChange={(e) => setEmpSalary(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">أجر الساعة التقديري (ج.م)</label>
                  <input
                    type="number"
                    value={empHourlyRate}
                    onChange={(e) => setEmpHourlyRate(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">البدلات والحوافز (+)</label>
                  <input
                    type="number"
                    value={empAllowances}
                    onChange={(e) => setEmpAllowances(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الخصومات والاستقطاعات (-)</label>
                  <input
                    type="number"
                    value={empDeductions}
                    onChange={(e) => setEmpDeductions(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-rose-600"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600">تقدير صافي الراتب المستحق:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  {(empSalary + empAllowances - empDeductions).toLocaleString()} ج.م
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditEmployeeModal(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
