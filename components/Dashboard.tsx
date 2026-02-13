
import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  ShoppingBag, 
  ChefHat, 
  CheckCircle2, 
  List, 
  UtensilsCrossed, 
  CalendarDays, 
  Timer, 
  RotateCcw, 
  AlertTriangle, 
  Archive, 
  Power,
  CheckSquare,
  Square,
  Landmark,
  Smartphone,
  Banknote,
  DollarSign,
  Briefcase,
  CreditCard,
  User,
  Search,
  Award,
  Crown,
  Printer,
  PieChart,
  Wallet,
  PlayCircle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import { Expense, Order, RegisterState, SystemConfig, UserRole, ReturnRecord } from '../types';
import { printReceipt } from '../services/receiptService';

interface DashboardProps {
  orders: Order[];
  expenses: Expense[];
  registerState: RegisterState;
  systemConfig: SystemConfig;
  userRole: UserRole;
  onCloseRegister: () => void;
  onOpenRegister: (amount: number) => void;
  onEndOfDay?: () => void; 
  returns: ReturnRecord[];
  onToggleReturnConfirmation?: (returnId: string) => void;
}

const formatInvoiceId = (id: string) => {
  const numeric = id.replace(/\D/g, '');
  const shortened = numeric.slice(-8).padStart(8, '0');
  return `${shortened.slice(0, 4)} ${shortened.slice(4)}`;
};

const Dashboard: React.FC<DashboardProps> = ({ orders, expenses, registerState, systemConfig, userRole, returns = [], onCloseRegister, onOpenRegister, onEndOfDay, onToggleReturnConfirmation }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'returns' | 'waiter_effort' | 'expenses' | 'revenue'>('overview');
  
  // Waiter Effort Filter State
  const [waiterSearch, setWaiterSearch] = useState('');
  const [waiterTimeFilter, setWaiterTimeFilter] = useState<'TODAY' | 'YESTERDAY' | 'WEEK' | 'LAST_WEEK' | 'MONTH' | 'LAST_MONTH' | 'YEAR' | 'LAST_YEAR'>('TODAY');

  // Open Register State
  const [openingAmount, setOpeningAmount] = useState<string>('');

  const canManageRegister = ['MANAGER', 'OWNER', 'CASHIER'].includes(userRole || '');
  const canEndDay = ['MANAGER', 'OWNER'].includes(userRole || '');

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const todaysOrders = orders.filter(o => new Date(o.timestamp) >= startOfToday && o.status !== 'cancelled');
  
  // --- CASHIER BREAKDOWN CALCULATIONS ---
  const cashierMetrics = useMemo(() => {
      const metrics = {
          due: 0,
          paid: 0,
          partial: 0,
          bank: 0,
          momo: 0,
          cash: 0,
          card: 0, // Added Card
          others: 0,
          salaryPay: 0, // Track separately
          totalRevenue: 0
      };

      todaysOrders.forEach(o => {
          const paid = o.amountPaid || 0;
          const total = o.grandTotal;
          const outstanding = Math.max(0, total - paid);

          // If staff credit, count towards due but don't count towards revenue yet
          if (o.paymentMethod === 'STAFF_CREDIT') {
              metrics.due += outstanding;
              return;
          }

          metrics.due += outstanding;
          
          // Salary Pay is technically "paid" in status but is Debt. Don't add to Revenue Cash.
          if (o.paymentMethod !== 'SALARY_PAY') {
              metrics.totalRevenue += paid;
          }

          if (o.paymentMethod === 'COMPLEMENTARY') return;

          if (paid >= total) metrics.paid += paid;
          else if (paid > 0) metrics.partial += paid;

          // Method Volume
          if (paid > 0 || (o.paymentMethod === 'SALARY_PAY' && o.grandTotal > 0)) {
              // For salary pay, we use grandTotal if paid is 0 because it might be fully settled by credit immediately
              const value = o.paymentMethod === 'SALARY_PAY' ? o.grandTotal : paid;

              switch (o.paymentMethod) {
                  case 'BANK': metrics.bank += value; break;
                  case 'MOBILE_MONEY': metrics.momo += value; break;
                  case 'CASH': metrics.cash += value; break;
                  case 'CARD': metrics.card += value; break; // Count Card
                  case 'SALARY_PAY': metrics.salaryPay += value; break;
                  default: metrics.others += value; break;
              }
          }
      });

      return metrics;
  }, [todaysOrders]);

  // --- EXPENSE CALCULATIONS ---
  const todaysExpenses = useMemo(() => {
      return expenses.filter(e => new Date(e.timestamp) >= startOfToday);
  }, [expenses, startOfToday]);

  const totalTodaysExpenses = todaysExpenses.reduce((sum, e) => sum + e.amount, 0);

  // --- TOTAL COMPANY REVENUE CALCULATION ---
  // "collect all the expected cash, mobile money, cards and salary pay all together"
  const totalCompanyValue = useMemo(() => {
      const expectedCash = registerState.openingCash + cashierMetrics.cash;
      return expectedCash + cashierMetrics.momo + cashierMetrics.card + cashierMetrics.bank + cashierMetrics.salaryPay;
  }, [registerState.openingCash, cashierMetrics]);


  // --- STAFF DEBT CALCULATIONS (Updated to include Salary Pay) ---
  const staffDebts = useMemo(() => {
      const unpaidStaffOrders = orders.filter(o => 
          (o.paymentMethod === 'STAFF_CREDIT' || o.paymentMethod === 'SALARY_PAY') && 
          o.status !== 'cancelled' && 
          // For Salary Pay, we assume the whole amount is debt until cleared by payroll
          // For Staff Credit, we check outstanding amount
          (o.paymentMethod === 'SALARY_PAY' ? true : (o.amountPaid || 0) < o.grandTotal)
      );

      // Group by Staff Name
      const debtMap: Record<string, number> = {};
      unpaidStaffOrders.forEach(o => {
          // If Salary Pay, the entire value is debt to be deducted
          const debt = o.paymentMethod === 'SALARY_PAY' ? o.grandTotal : (o.grandTotal - (o.amountPaid || 0));
          
          if (debt > 0) {
              debtMap[o.customerName] = (debtMap[o.customerName] || 0) + debt;
          }
      });

      return Object.entries(debtMap).map(([name, amount]) => ({ name, amount })).sort((a,b) => b.amount - a.amount);
  }, [orders]);

  const pendingOrders = todaysOrders.filter(o => o.status === 'pending' || o.status === 'preparing').length;
  const completedOrders = todaysOrders.filter(o => o.status === 'completed' || o.status === 'served').length;
  const activeTables = new Set(todaysOrders.filter(o => o.status !== 'completed' && o.status !== 'paid').map(o => o.table)).size;

  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateKey = d.toDateString();
      const daysOrders = orders.filter(o => new Date(o.timestamp).toDateString() === dateKey && o.status !== 'cancelled');
      data.push({ name: dayName, count: daysOrders.length });
    }
    return data;
  }, [orders]);

  const totalVoidValue = returns.reduce((acc, r) => acc + r.totalRefunded, 0);

  // --- WAITER EFFORT CALCULATIONS ---
  const waiterStats = useMemo(() => {
      // 1. Get unique waiter names
      const allWaiters: string[] = Array.from(new Set(orders.map(o => o.staffName).filter((n): n is string => !!n)));
      
      // 2. Filter waiters based on search
      const filteredWaiters = allWaiters.filter((name: string) => name.toLowerCase().includes(waiterSearch.toLowerCase()));

      // 3. Define Time Range
      const now = new Date();
      let start = new Date(0); // Default all time
      let end = new Date(); // Default now

      switch(waiterTimeFilter) {
          case 'TODAY': 
              start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); 
              break;
          case 'YESTERDAY':
              start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
              end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
              break;
          case 'WEEK': 
              start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7); 
              break;
          case 'LAST_WEEK':
              // Previous Monday to Sunday or just previous 7 days block before this week
              // Let's use simple 7-14 days ago for simplicity or strict calendar week
              const lastWeekStart = new Date(now);
              lastWeekStart.setDate(now.getDate() - 14);
              const lastWeekEnd = new Date(now);
              lastWeekEnd.setDate(now.getDate() - 7);
              start = lastWeekStart;
              end = lastWeekEnd;
              break;
          case 'MONTH': 
              start = new Date(now.getFullYear(), now.getMonth(), 1); 
              break;
          case 'LAST_MONTH':
              start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
              break;
          case 'YEAR': 
              start = new Date(now.getFullYear(), 0, 1); 
              break;
          case 'LAST_YEAR':
              start = new Date(now.getFullYear() - 1, 0, 1);
              end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
              break;
      }

      // 4. Calculate Stats per waiter
      const stats = filteredWaiters.map(name => {
          const waiterOrders = orders.filter(o => 
              o.staffName === name && 
              o.status !== 'cancelled' &&
              new Date(o.timestamp) >= start &&
              new Date(o.timestamp) <= end
          );

          const totalSales = waiterOrders.reduce((sum, o) => sum + o.grandTotal, 0);
          const orderCount = waiterOrders.length;
          const averageTicket = orderCount > 0 ? totalSales / orderCount : 0;

          // Chart data for this waiter in this period (daily breakdown)
          const trendData: Record<string, number> = {};
          waiterOrders.forEach(o => {
              const key = new Date(o.timestamp).toLocaleDateString();
              trendData[key] = (trendData[key] || 0) + o.grandTotal;
          });
          const chart = Object.keys(trendData).map(key => ({ name: key, sales: trendData[key] }));

          return { name, totalSales, orderCount, averageTicket, chart };
      });

      return stats.sort((a,b) => b.totalSales - a.totalSales);
  }, [orders, waiterSearch, waiterTimeFilter]);

  // Identify Top Performers
  const topPerformerByRevenue = useMemo(() => {
      if (waiterStats.length === 0) return null;
      return waiterStats.reduce((prev, current) => (prev.totalSales > current.totalSales) ? prev : current);
  }, [waiterStats]);

  const topPerformerByCount = useMemo(() => {
      if (waiterStats.length === 0) return null;
      return waiterStats.reduce((prev, current) => (prev.orderCount > current.orderCount) ? prev : current);
  }, [waiterStats]);

  // --- PRINT REPORT HANDLER ---
  const handlePrintReport = () => {
      const reportData = {
          ...cashierMetrics,
          totalOrders: todaysOrders.length,
          openingCash: registerState.openingCash,
          printedBy: 'Cashier' // Or pass currentUser.name if available context
      };
      
      printReceipt(systemConfig, null, 'SHIFT_REPORT', reportData);
  };

  const handleStartShift = (e: React.FormEvent) => {
      e.preventDefault();
      const amount = parseFloat(openingAmount);
      if (!isNaN(amount)) {
          onOpenRegister(amount);
          setOpeningAmount('');
      }
  };


  const BentoCard = ({ title, value, icon: Icon, color = 'white', subText, isCurrency = false }: any) => {
    const isBlue = color === 'blue';
    const isRed = color === 'red';
    const isGreen = color === 'green';
    const isIndigo = color === 'indigo';
    const isPink = color === 'pink';
    const isOrange = color === 'orange';

    const bgClass = isBlue ? 'bg-blue-600 text-white shadow-blue-200' : 
                   isRed ? 'bg-red-600 text-white shadow-red-200' :
                   isGreen ? 'bg-emerald-600 text-white shadow-emerald-200' :
                   isIndigo ? 'bg-indigo-600 text-white shadow-indigo-200' :
                   isPink ? 'bg-pink-600 text-white shadow-pink-200' :
                   isOrange ? 'bg-orange-500 text-white shadow-orange-200' :
                   'bg-white text-gray-800 border border-transparent hover:border-gray-200';

    return (
      <div className={`p-6 rounded-[2rem] shadow-sm flex flex-col justify-between h-40 transition-all hover:scale-[1.02] duration-300 ${bgClass}`}>
        <div className="flex justify-between items-start">
          <div className={`p-3 rounded-2xl ${color !== 'white' ? 'bg-white/20' : 'bg-gray-100'}`}>
            <Icon className={`w-6 h-6 ${color !== 'white' ? 'text-white' : 'text-gray-600'}`} />
          </div>
        </div>
        <div>
          <h3 className={`text-sm font-bold mb-1 ${color !== 'white' ? 'text-white/80' : 'text-gray-400 uppercase tracking-wider'}`}>{title}</h3>
          <p className="text-3xl font-black tracking-tight leading-none">
              {isCurrency ? systemConfig.currency + ' ' : ''}{value.toLocaleString()}
          </p>
          {subText && <p className={`text-xs font-medium mt-2 ${color !== 'white' ? 'text-white/60' : 'text-gray-400'}`}>{subText}</p>}
        </div>
      </div>
    );
  };

  // --- REGISTER CLOSED STATE ---
  if (!registerState.isOpen) {
      return (
          <div className="flex items-center justify-center h-full bg-[#f3f4f6] font-sans p-6">
              <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-lg w-full text-center border border-gray-100 animate-in zoom-in-95 duration-300">
                  <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <PlayCircle className="w-12 h-12 text-blue-600" />
                  </div>
                  <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight mb-2">Register Closed</h1>
                  <p className="text-gray-500 font-medium mb-8">Start your shift to begin processing orders and payments.</p>
                  
                  <form onSubmit={handleStartShift} className="space-y-6">
                      <div className="text-left">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 mb-1 block">Opening Cash Float</label>
                          <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">{systemConfig.currency}</span>
                              <input 
                                  autoFocus
                                  type="number" 
                                  value={openingAmount}
                                  onChange={(e) => setOpeningAmount(e.target.value)}
                                  className="w-full pl-16 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-2xl text-gray-800 outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-gray-300"
                                  placeholder="0.00"
                              />
                          </div>
                      </div>
                      
                      <button 
                          disabled={!openingAmount}
                          className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg uppercase tracking-widest shadow-xl shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                      >
                          Start Shift <Clock className="w-5 h-5" />
                      </button>
                  </form>
                  <p className="mt-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Waiters can still add orders while register is closed.</p>
              </div>
          </div>
      );
  }

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto bg-[#f3f4f6] font-sans">
      
      {/* ... Header ... */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Cashier Dashboard</h1>
          <p className="text-gray-400 font-bold text-sm mt-1 uppercase tracking-widest">{formattedDate}</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
            {registerState.isOpen && (
                <button 
                    onClick={handlePrintReport} 
                    className="px-6 py-2 bg-slate-900 hover:bg-black text-white rounded-xl font-black text-xs uppercase shadow-lg flex items-center gap-2 transition-all active:scale-95"
                >
                    <Printer className="w-4 h-4" /> Print Report
                </button>
            )}
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex-wrap">
               <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}><TrendingUp className="w-4 h-4" /> Overview</button>
               <button onClick={() => setActiveTab('expenses')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'expenses' ? 'bg-pink-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}><Banknote className="w-4 h-4" /> Expenses</button>
               <button onClick={() => setActiveTab('revenue')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'revenue' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}><PieChart className="w-4 h-4" /> Revenue</button>
               <button onClick={() => setActiveTab('waiter_effort')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'waiter_effort' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}><Users className="w-4 h-4" /> Waiters</button>
               <button onClick={() => setActiveTab('returns')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'returns' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}><RotateCcw className="w-4 h-4" /> Voids</button>
            </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
          
          {/* --- COLLECTION BREAKDOWN --- */}
          <div className="space-y-4">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                 <DollarSign className="w-4 h-4" /> Liquid Assets & Collections
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <BentoCard title="Total Collected" value={cashierMetrics.totalRevenue} icon={CheckCircle2} color="green" isCurrency={true} subText="Total shift cash-in" />
                <BentoCard title="Cards" value={cashierMetrics.card} icon={CreditCard} color="orange" isCurrency={true} subText="Card terminal payments" />
                <BentoCard title="Mobile Money" value={cashierMetrics.momo} icon={Smartphone} color="pink" isCurrency={true} subText="Digital wallet volume" />
                <BentoCard title="Salary Pay Log" value={cashierMetrics.salaryPay} icon={Briefcase} color="indigo" isCurrency={true} subText="Staff salary deductions" />
              </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <BentoCard title="Today's Orders" value={todaysOrders.length} icon={ShoppingBag} color="blue" subText="Shift transaction count" />
                    <BentoCard title="Active Tables" value={activeTables} icon={UtensilsCrossed} subText="Current in-house tables" />
                </div>

                {/* STAFF DEBT SECTION (Updated Title) */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-indigo-600" /> Staff Debt & Salary Pay
                            </h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Unpaid Staff Meals & Tabs</p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-black text-red-500 block">
                                {systemConfig.currency} {staffDebts.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] font-bold text-red-400 uppercase">Total Owed</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto max-h-[200px] custom-scrollbar space-y-2">
                        {staffDebts.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 font-bold text-xs uppercase italic bg-gray-50 rounded-xl">No outstanding staff debts</div>
                        ) : (
                            staffDebts.map((debt, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                            {debt.name.charAt(0)}
                                        </div>
                                        <span className="font-bold text-gray-700 text-sm">{debt.name}</span>
                                    </div>
                                    <span className="font-black text-red-500 text-sm">{systemConfig.currency} {debt.amount.toLocaleString()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] shadow-sm h-[320px] flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                     <div>
                       <h3 className="font-bold text-gray-800 text-lg">Sales Trend</h3>
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Transaction Volume - 7 Days</p>
                     </div>
                     <div className="p-2 bg-gray-50 rounded-xl"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
                  </div>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} barSize={32}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 700}} dy={10} />
                        <Tooltip cursor={{fill: '#f3f4f6', radius: 8}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold', padding: '12px' }} />
                        <Bar dataKey="count" radius={[20, 20, 20, 20]} fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-orange-50 rounded-2xl"><Clock className="w-6 h-6 text-orange-500" /></div>
                      <div>
                         <h3 className="font-bold text-gray-800">Shift Status</h3>
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{registerState.isOpen ? 'Active' : 'Closed'}</p>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${registerState.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Register</span>
                         </div>
                         <span className="font-bold text-gray-800">{registerState.isOpen ? 'OPEN' : 'CLOSED'}</span>
                      </div>
                      
                      {canManageRegister && registerState.isOpen && (
                          <div className="grid grid-cols-2 gap-2">
                              <button 
                                onClick={handlePrintReport} 
                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] hover:bg-black flex items-center justify-center gap-2 transition-colors"
                              >
                                  <Printer className="w-4 h-4" /> Print Shift
                              </button>
                              <button onClick={onCloseRegister} className="w-full py-3 bg-white border-2 border-orange-100 text-orange-600 rounded-xl font-black uppercase text-[10px] hover:bg-orange-50 flex items-center justify-center gap-2 transition-colors">
                                  <Power className="w-4 h-4" /> Close Shift
                              </button>
                          </div>
                      )}
                   </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm flex-1 flex flex-col">
                   <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                         <div className="p-3 bg-purple-50 rounded-2xl"><List className="w-6 h-6 text-purple-500" /></div>
                         <h3 className="font-bold text-gray-800">Recent Activity</h3>
                      </div>
                   </div>
                   <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 space-y-3">
                      {orders.slice(0, 5).map(order => (
                         <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                            <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs uppercase ${order.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{order.table.substring(0, 3)}</div>
                               <div>
                                  <p className="text-sm font-bold text-gray-800 leading-tight">Order #{order.id.slice(-4)}</p>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase">{order.items.length} Items • {new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                               </div>
                            </div>
                            <span className="text-xs font-black text-gray-800">{systemConfig.currency} {order.grandTotal.toLocaleString()}</span>
                         </div>
                      ))}
                   </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* --- EXPENSES TAB --- */}
      {activeTab === 'expenses' && (
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
              <div className="bg-pink-600 rounded-[2rem] p-8 text-white shadow-xl shadow-pink-200">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-pink-100 text-xs font-black uppercase tracking-widest mb-2">Total Expenses (Today)</p>
                          <h2 className="text-5xl font-black">{systemConfig.currency} {totalTodaysExpenses.toLocaleString()}</h2>
                      </div>
                      <div className="p-4 bg-pink-500/30 rounded-2xl backdrop-blur-sm">
                          <Banknote className="w-8 h-8 text-white" />
                      </div>
                  </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><List className="w-5 h-5 text-gray-400" /> Expense Log (Today)</h3>
                  {todaysExpenses.length === 0 ? (
                      <div className="p-10 text-center text-gray-400 font-bold uppercase text-xs">No expenses recorded today</div>
                  ) : (
                      <div className="space-y-3">
                          {todaysExpenses.map(expense => (
                              <div key={expense.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-pink-50 transition-colors group">
                                  <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">
                                          {expense.category.charAt(0)}
                                      </div>
                                      <div>
                                          <p className="font-bold text-gray-800">{expense.itemName}</p>
                                          <p className="text-xs text-gray-500">{expense.category} • {expense.department}</p>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <p className="font-black text-gray-900">{systemConfig.currency} {expense.amount.toLocaleString()}</p>
                                      <p className="text-[10px] text-gray-400 uppercase">{new Date(expense.timestamp).toLocaleTimeString()}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* --- REVENUE TAB --- */}
      {activeTab === 'revenue' && (
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
              <div className="bg-emerald-600 rounded-[2rem] p-8 text-white shadow-xl shadow-emerald-200">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-emerald-100 text-xs font-black uppercase tracking-widest mb-2">Total Company Revenue (Today)</p>
                          <h2 className="text-5xl font-black">{systemConfig.currency} {totalCompanyValue.toLocaleString()}</h2>
                          <p className="text-emerald-200 text-sm mt-2 font-medium opacity-80">Includes Cash, Digital Payments & Salary Deductions</p>
                      </div>
                      <div className="p-4 bg-emerald-500/30 rounded-2xl backdrop-blur-sm">
                          <PieChart className="w-8 h-8 text-white" />
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><Wallet className="w-5 h-5 text-emerald-500" /> Cash Liquidity</h3>
                      <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                              <span className="text-sm font-bold text-gray-600">Opening Cash</span>
                              <span className="font-black text-gray-900">{systemConfig.currency} {registerState.openingCash.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                              <span className="text-sm font-bold text-gray-600">Cash Sales</span>
                              <span className="font-black text-gray-900">{systemConfig.currency} {cashierMetrics.cash.toLocaleString()}</span>
                          </div>
                          <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between items-center">
                              <span className="text-sm font-black text-gray-800 uppercase">Expected Cash in Drawer</span>
                              <span className="font-black text-xl text-emerald-600">{systemConfig.currency} {(registerState.openingCash + cashierMetrics.cash).toLocaleString()}</span>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-500" /> Digital & Credit</h3>
                      <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                              <span className="text-sm font-bold text-gray-600">Mobile Money</span>
                              <span className="font-black text-gray-900">{systemConfig.currency} {cashierMetrics.momo.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                              <span className="text-sm font-bold text-gray-600">Card Payments</span>
                              <span className="font-black text-gray-900">{systemConfig.currency} {cashierMetrics.card.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                              <span className="text-sm font-bold text-gray-600">Bank Transfers</span>
                              <span className="font-black text-gray-900">{systemConfig.currency} {cashierMetrics.bank.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                              <span className="text-sm font-bold text-gray-600">Salary Deductions</span>
                              <span className="font-black text-gray-900">{systemConfig.currency} {cashierMetrics.salaryPay.toLocaleString()}</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'returns' && (
        /* --- RETURNS TAB --- */
        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
               <div className="bg-red-600 text-white p-6 rounded-[2rem] shadow-xl shadow-red-200">
                   <p className="text-red-200 text-xs font-black uppercase tracking-widest mb-1">Total Voided Value</p>
                   <h2 className="text-4xl font-black">{systemConfig.currency} {totalVoidValue.toLocaleString()}</h2>
               </div>
               <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
                   <div><p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Total Incidents</p><h2 className="text-4xl font-black text-gray-800">{returns.length}</h2></div>
                   <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400"><AlertTriangle className="w-8 h-8" /></div>
               </div>
           </div>
           {/* Table placeholder since real table is in OrdersView VOID tab */}
           <div className="text-center p-8 text-gray-400">View detailed log in Order Log {'>'} Void Tab</div>
        </div>
      )}

      {activeTab === 'waiter_effort' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              
              {/* Filter Bar */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center gap-2 w-full md:w-auto">
                      <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600"><User className="w-5 h-5"/></div>
                      <div>
                          <h3 className="font-bold text-gray-800 text-sm">Waiter Performance</h3>
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Sales & Effort Tracking</p>
                      </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                      {/* Search */}
                      <div className="relative flex-1 md:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                              type="text" 
                              value={waiterSearch}
                              onChange={(e) => setWaiterSearch(e.target.value)}
                              placeholder="Search Waiter Name..."
                              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                      </div>

                      {/* Time Filter */}
                      <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-[400px]">
                          {['TODAY', 'YESTERDAY', 'WEEK', 'LAST_WEEK', 'MONTH', 'LAST_MONTH', 'YEAR', 'LAST_YEAR'].map((tf) => (
                              <button
                                  key={tf}
                                  onClick={() => setWaiterTimeFilter(tf as any)}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${waiterTimeFilter === tf ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                              >
                                  {tf.replace('_', ' ')}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>

              {/* HIGHLIGHTS SECTION */}
              {waiterStats.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {topPerformerByRevenue && (
                          <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-200 flex items-center justify-between relative overflow-hidden">
                              <div className="relative z-10">
                                  <p className="text-xs font-black uppercase tracking-widest text-indigo-200 mb-1">Highest Revenue</p>
                                  <h3 className="text-3xl font-black">{topPerformerByRevenue.name}</h3>
                                  <p className="text-xl font-bold mt-1">{systemConfig.currency} {topPerformerByRevenue.totalSales.toLocaleString()}</p>
                              </div>
                              <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                                  <Crown className="w-8 h-8 text-yellow-300 fill-current" />
                              </div>
                              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                          </div>
                      )}
                      {topPerformerByCount && (
                          <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
                              <div>
                                  <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Most Active</p>
                                  <h3 className="text-3xl font-black text-gray-800">{topPerformerByCount.name}</h3>
                                  <p className="text-xl font-bold mt-1 text-blue-600">{topPerformerByCount.orderCount} Orders</p>
                              </div>
                              <div className="p-4 bg-blue-50 rounded-full">
                                  <ShoppingBag className="w-8 h-8 text-blue-600" />
                              </div>
                          </div>
                      )}
                  </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {waiterStats.map((stat, idx) => (
                      <div key={idx} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all group">
                          <div className="p-6 border-b border-gray-50 bg-gradient-to-br from-white to-gray-50">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center gap-3">
                                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                          {stat.name ? stat.name.charAt(0) : '?'}
                                      </div>
                                      <div>
                                          <h3 className="font-bold text-gray-800 text-lg leading-tight">{stat.name || 'Unknown'}</h3>
                                          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest bg-white px-2 py-0.5 rounded border border-gray-100">
                                              {idx === 0 ? 'Top Performer' : `#${idx + 1} Ranked`}
                                          </span>
                                      </div>
                                  </div>
                                  {idx === 0 && <Award className="w-8 h-8 text-yellow-400 fill-current" />}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mt-2">
                                  <div>
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Revenue</p>
                                      <p className="text-xl font-black text-indigo-600">{systemConfig.currency} {stat.totalSales.toLocaleString()}</p>
                                  </div>
                                  <div>
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Order Count</p>
                                      <p className="text-xl font-black text-gray-800">{stat.orderCount}</p>
                                  </div>
                              </div>
                          </div>

                          <div className="p-6 h-32 relative">
                              <p className="absolute top-4 right-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sales Trend</p>
                              {stat.chart.length > 0 ? (
                                  <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart data={stat.chart}>
                                          <defs>
                                              <linearGradient id={`colorSales-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                              </linearGradient>
                                          </defs>
                                          <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill={`url(#colorSales-${idx})`} />
                                      </AreaChart>
                                  </ResponsiveContainer>
                              ) : (
                                  <div className="h-full flex items-center justify-center text-gray-300 text-xs font-bold uppercase">No Data</div>
                              )}
                          </div>
                      </div>
                  ))}
                  
                  {waiterStats.length === 0 && (
                      <div className="col-span-full py-20 text-center text-gray-400">
                          <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                          <p className="font-bold uppercase tracking-widest">No waiter activity found for this period.</p>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
