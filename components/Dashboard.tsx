
import React, { useMemo, useState } from 'react';
import { 
  CheckCircle2, ShoppingBag, Smartphone, Wallet, Users, 
  PlayCircle, Landmark, Power, List, UtensilsCrossed, Briefcase, 
  CalendarDays, History, Printer, CreditCard, PieChart, Activity,
  TrendingUp, TrendingDown, Clock, Search, Trash2, ChevronRight, FileText, Banknote,
  DollarSign, ShieldX, Delete, ArrowRight, BarChart3, Filter
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Order, RegisterState, SystemConfig, UserRole, ReturnRecord, Expense, StaffMember } from '../types';
import ReceiptPreviewModal from './ReceiptPreviewModal';

interface DashboardProps {
  orders: Order[];
  expenses: Expense[];
  registerState: RegisterState;
  systemConfig: SystemConfig;
  userRole: UserRole;
  currentUser: StaffMember | null;
  onCloseRegister: () => void;
  onOpenRegister: (amount: number) => void;
  returns: ReturnRecord[];
}

type DashboardTab = 'OVERVIEW' | 'VOIDS' | 'ANALYTICS';
type AnalyticsPeriod = 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'LAST_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'LAST_YEAR';

const Dashboard: React.FC<DashboardProps> = ({ 
  orders, expenses, registerState, systemConfig, userRole, currentUser, onCloseRegister, onOpenRegister, returns 
}) => {
  const [openingAmount, setOpeningAmount] = useState<string>('');
  const [activeTab, setActiveTab] = useState<DashboardTab>('OVERVIEW');
  const [analyticsSearch, setAnalyticsSearch] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('TODAY');
  
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const isMaster = currentUser?.id === 'ROOT' || currentUser?.id?.startsWith('MASTER_OVERRIDE');
  const needsRegister = !registerState.isOpen && (userRole === 'CASHIER' || userRole === 'MANAGER') && !isMaster;

  // Helper: check if date falls within selected period
  const isDateInPeriod = (date: Date, period: AnalyticsPeriod) => {
      const d = new Date(date);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (period) {
          case 'TODAY': return d.toDateString() === now.toDateString();
          case 'YESTERDAY': {
              const yesterday = new Date(today);
              yesterday.setDate(today.getDate() - 1);
              return d.toDateString() === yesterday.toDateString();
          }
          case 'THIS_WEEK': {
              const startOfWeek = new Date(today);
              startOfWeek.setDate(today.getDate() - today.getDay());
              return d >= startOfWeek;
          }
          case 'LAST_WEEK': {
              const startOfLastWeek = new Date(today);
              startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
              const endOfLastWeek = new Date(startOfLastWeek);
              endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
              endOfLastWeek.setHours(23, 59, 59, 999);
              return d >= startOfLastWeek && d <= endOfLastWeek;
          }
          case 'THIS_MONTH': return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          case 'LAST_MONTH': {
              const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
          }
          case 'THIS_YEAR': return d.getFullYear() === now.getFullYear();
          case 'LAST_YEAR': return d.getFullYear() === now.getFullYear() - 1;
          default: return false;
      }
  };

  const periodFilteredOrders = useMemo(() => 
    orders.filter(o => isDateInPeriod(o.timestamp, selectedPeriod) && o.status === 'paid')
  , [orders, selectedPeriod]);

  // Aggregate Sales for Analytics Table
  const productAnalytics = useMemo(() => {
    const stats: Record<string, { name: string, qty: number, revenue: number, category: string }> = {};
    
    periodFilteredOrders.forEach(order => {
        order.items.forEach(item => {
            const key = item.product.name;
            if (!stats[key]) {
                stats[key] = { name: item.product.name, qty: 0, revenue: 0, category: item.product.category };
            }
            stats[key].qty += item.quantity;
            stats[key].revenue += (item.quantity * item.product.price);
        });
    });

    return Object.values(stats)
        .filter(s => s.name.toLowerCase().includes(analyticsSearch.toLowerCase()))
        .sort((a, b) => b.qty - a.qty);
  }, [periodFilteredOrders, analyticsSearch]);

  const todaysOrders = useMemo(() => orders.filter(o => 
    new Date(o.timestamp).toDateString() === new Date().toDateString() && o.status !== 'cancelled'
  ), [orders]);

  const metrics = useMemo(() => {
    const m = { total: 0, card: 0, momo: 0, salaryPay: 0, cash: 0, expenses: 0 };
    todaysOrders.forEach(o => {
      const paid = o.amountPaid || 0;
      if (o.status === 'paid') m.total += paid;
      if (o.paymentMethod === 'CARD') m.card += paid;
      else if (o.paymentMethod === 'BANK') m.card += paid;
      else if (o.paymentMethod === 'MOBILE_MONEY') m.momo += paid;
      else if (o.paymentMethod === 'SALARY_PAY') m.salaryPay += o.grandTotal;
      else if (o.paymentMethod === 'STAFF_CREDIT') m.salaryPay += o.grandTotal;
      else if (o.paymentMethod === 'CASH') m.cash += paid;
    });
    m.expenses = expenses
      .filter(e => new Date(e.timestamp).toDateString() === new Date().toDateString())
      .reduce((sum, e) => sum + e.amount, 0);
    return m;
  }, [todaysOrders, expenses]);

  const shiftReportData = useMemo(() => ({
      totalOrders: todaysOrders.length,
      totalRevenue: metrics.total,
      cashRevenue: metrics.cash,
      momoRevenue: metrics.momo,
      cardRevenue: metrics.card,
      staffDebt: metrics.salaryPay,
      totalExpenses: metrics.expenses,
      openingCash: registerState.openingCash,
      netCash: registerState.openingCash + metrics.cash - metrics.expenses,
      voidCount: returns.filter(r => new Date(r.timestamp).toDateString() === new Date().toDateString()).length
  }), [todaysOrders, metrics, registerState, returns]);

  const handlePrintReport = () => {
      setPreviewData(shiftReportData);
      setPreviewOpen(true);
  };

  const handleOpenPadPress = (val: string) => {
      if (val === 'DEL') setOpeningAmount(prev => prev.slice(0, -1));
      else if (val === 'C') setOpeningAmount('');
      else if (val === '.' && openingAmount.includes('.')) return;
      else setOpeningAmount(prev => prev + val);
  };

  const BentoCard = ({ title, value, icon: Icon, colorClass, subText, isCurrency = true }: any) => (
    <div className={`p-6 rounded-3xl shadow-sm flex flex-col justify-between h-44 transition-all hover:scale-[1.02] ${colorClass}`}>
      <div className="flex justify-between items-start">
        <div className="p-3 bg-white/20 rounded-2xl"><Icon className="w-6 h-6 text-white" /></div>
        {subText && <span className="text-[10px] font-black uppercase text-white/60 tracking-widest">{subText}</span>}
      </div>
      <div>
        <h3 className="text-xs font-black mb-1 uppercase tracking-widest text-white/80">{title}</h3>
        <p className="text-3xl font-black text-white">
          {isCurrency ? systemConfig.currency + ' ' : ''} {value.toLocaleString()}
        </p>
        <p className="text-[10px] font-bold text-white/40 mt-1 uppercase tracking-tighter">Live from terminal</p>
      </div>
    </div>
  );

  if (needsRegister) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50 p-6">
        <div className="bg-white rounded-[3rem] shadow-2xl p-10 max-w-sm w-full text-center border border-gray-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center mb-6 text-blue-600 shadow-md"><PlayCircle className="w-8 h-8" /></div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-1">Shift Entry</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Starting Balance Required</p>
          <div className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 mb-8 text-center flex flex-col justify-center min-h-[90px]">
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Opening Cash ({systemConfig.currency})</span>
            <div className="text-3xl font-black text-slate-900 truncate">{openingAmount || '0.00'}</div>
          </div>
          <div className="grid grid-cols-3 gap-2 w-full mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'DEL'].map((k) => (
                <button key={k} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => handleOpenPadPress(k.toString())}
                  className={`h-14 rounded-xl text-lg font-black transition-all active:scale-90 border ${k === 'DEL' ? 'bg-red-50 text-red-600 border-red-100' : k === 'C' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-gray-50 text-slate-800 border-gray-100'}`}>
                  {k === 'DEL' ? <Delete className="w-5 h-5 mx-auto" /> : k}
                </button>
            ))}
          </div>
          <button onClick={() => onOpenRegister(parseFloat(openingAmount) || 0)} disabled={!openingAmount} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-30 active:scale-95">Start Shift</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-100 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Dashboard</h1>
            <p className="text-slate-400 font-bold text-xs tracking-[0.2em] mt-3">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <button onClick={handlePrintReport} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg tracking-widest hover:bg-black transition-all">
                <Printer className="w-4 h-4" /> Print Report
             </button>
             <div className="bg-white p-1 rounded-2xl flex border border-gray-200 shadow-sm">
                {[
                  { id: 'OVERVIEW', icon: Activity, label: 'Live' },
                  { id: 'ANALYTICS', icon: BarChart3, label: 'Analytics' },
                  { id: 'VOIDS', icon: ShieldX, label: 'Voids' }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-[#2563eb] text-white shadow-md' : 'text-slate-500 hover:bg-gray-50'}`}>
                        <tab.icon className="w-3.5 h-3.5" />{tab.label}
                    </button>
                ))}
             </div>
          </div>
        </header>

        {activeTab === 'OVERVIEW' && (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <BentoCard title="Cash Revenue" value={metrics.cash} icon={Wallet} colorClass="bg-[#059669]" subText="Cash in hand" />
                  <BentoCard title="Digital Sales" value={metrics.card + metrics.momo} icon={Smartphone} colorClass="bg-[#db2777]" subText="Card & Mobile Money" />
                  <BentoCard title="Staff Credits" value={metrics.salaryPay} icon={Briefcase} colorClass="bg-[#6366f1]" subText="Salary Deductions" />
                  <BentoCard title="Net Drawer" value={shiftReportData.netCash} icon={CheckCircle2} colorClass="bg-[#1e293b]" subText="Expected Cash Draw" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-200 shadow-sm">
                       <h4 className="font-black text-slate-800 uppercase text-sm tracking-widest mb-6">Shift Reconcile</h4>
                       <div className="space-y-4">
                           <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                               <span className="text-xs font-bold text-slate-500 uppercase">Opening Cash</span>
                               <span className="font-black">{systemConfig.currency} {registerState.openingCash.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl">
                               <span className="text-xs font-bold text-emerald-600 uppercase">Total Cash Sales</span>
                               <span className="font-black text-emerald-700">+{systemConfig.currency} {metrics.cash.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between items-center p-4 bg-red-50 rounded-2xl">
                               <span className="text-xs font-bold text-red-600 uppercase">Paid Expenses</span>
                               <span className="font-black text-red-700">-{systemConfig.currency} {metrics.expenses.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between items-center p-6 bg-slate-900 text-white rounded-3xl shadow-xl">
                               <span className="text-sm font-black uppercase">Expected in Drawer</span>
                               <span className="text-2xl font-black">{systemConfig.currency} {shiftReportData.netCash.toLocaleString()}</span>
                           </div>
                       </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-200 shadow-sm">
                        <h4 className="font-black text-slate-800 uppercase text-sm tracking-widest mb-6">Shift Actions</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={handlePrintReport} className="py-6 bg-slate-100 rounded-3xl flex flex-col items-center gap-3 hover:bg-slate-200 transition-all group">
                                <Printer className="w-8 h-8 text-slate-400 group-hover:text-slate-900" /><span className="text-[10px] font-black uppercase">Print Shift Slip</span>
                            </button>
                            <button onClick={onCloseRegister} className="py-6 bg-orange-50 rounded-3xl flex flex-col items-center gap-3 hover:bg-orange-100 transition-all group">
                                <Power className="w-8 h-8 text-orange-400 group-hover:text-orange-600" /><span className="text-[10px] font-black uppercase">Close Register</span>
                            </button>
                        </div>
                    </div>
                </div>
            </>
        )}

        {activeTab === 'ANALYTICS' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1 w-full">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Filter Item Sales</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                            <input 
                                value={analyticsSearch}
                                onChange={e => setAnalyticsSearch(e.target.value)}
                                placeholder="Search by product name (e.g. Cappuccino)..."
                                className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 font-bold text-lg transition-all"
                            />
                        </div>
                    </div>
                    <div className="shrink-0 w-full md:w-auto">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Performance Period</label>
                        <div className="flex flex-wrap gap-1.5 p-1.5 bg-gray-100 rounded-2xl border border-gray-200">
                            {['TODAY', 'YESTERDAY', 'THIS_WEEK', 'LAST_WEEK', 'THIS_MONTH', 'LAST_MONTH', 'THIS_YEAR', 'LAST_YEAR'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setSelectedPeriod(p as AnalyticsPeriod)}
                                    className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${selectedPeriod === p ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    {p.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-600" /> 
                            Item Performance Registry 
                            <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded ml-2">{selectedPeriod.replace('_', ' ')}</span>
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border-b border-gray-100">
                                    <th className="px-8 py-5">Product Identity</th>
                                    <th className="px-8 py-5">Department</th>
                                    <th className="px-8 py-5 text-center">Qty Sold</th>
                                    <th className="px-8 py-5 text-right">Revenue Generated</th>
                                    <th className="px-8 py-5 text-right">Trend</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm font-bold text-slate-700">
                                {productAnalytics.length === 0 ? (
                                    <tr><td colSpan={5} className="p-20 text-center text-slate-300 uppercase font-black tracking-widest">No matching sales data for this period</td></tr>
                                ) : (
                                    productAnalytics.map((stat, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/20 transition-all group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-black text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">{stat.name.charAt(0)}</div>
                                                    <span className="font-black text-slate-900 text-base">{stat.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-lg tracking-widest">{stat.category}</span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="text-lg font-black text-blue-600">{stat.qty}</span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="font-black text-slate-900">{systemConfig.currency} {stat.revenue.toLocaleString()}</span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5 text-emerald-500 font-black text-xs">
                                                    <TrendingUp className="w-4 h-4" /> Live
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'VOIDS' && (
            <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden animate-in slide-in-from-right-4">
                <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Void Audit Log</h3>
                    <ShieldX className="w-5 h-5 text-red-500" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 border-b border-gray-100">
                                <th className="px-8 py-5">Time</th>
                                <th className="px-8 py-5">Original Waiter</th>
                                <th className="px-8 py-5">Authorized By</th>
                                <th className="px-8 py-5">Reason</th>
                                <th className="px-8 py-5 text-right">Lost Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-xs font-bold text-slate-700">
                            {returns.map(record => (
                                <tr key={record.id}>
                                    <td className="px-8 py-6 font-mono opacity-60">{new Date(record.timestamp).toLocaleTimeString()}</td>
                                    <td className="px-8 py-6 uppercase">{record.originalCreator || 'N/A'}</td>
                                    <td className="px-8 py-6 uppercase">{record.authorizedBy}</td>
                                    <td className="px-8 py-6 italic text-red-500">{record.reason || 'No reason'}</td>
                                    <td className="px-8 py-6 text-right text-red-600 font-black">{systemConfig.currency} {record.totalRefunded.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>

      <ReceiptPreviewModal isOpen={previewOpen} onClose={() => { setPreviewOpen(false); setPreviewData(null); }} order={null} systemConfig={systemConfig} type="SHIFT_REPORT" extraData={previewData} printedBy={currentUser?.name || "System Admin"} />
    </div>
  );
};

export default Dashboard;
