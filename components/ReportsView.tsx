
import React, { useMemo, useState } from 'react';
import { BarChart2, TrendingUp, Calendar, DollarSign, PieChart, Activity, ShoppingCart, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { Order, Expense, SystemConfig } from '../types';

interface ReportsViewProps {
  orders: Order[];
  expenses: Expense[];
  systemConfig: SystemConfig;
}

const ReportsView: React.FC<ReportsViewProps> = ({ orders, expenses, systemConfig }) => {
  const [timeFilter, setTimeFilter] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'YEAR'>('MONTH');

  // Helper to filter data by date range
  const getFilteredData = () => {
      const now = new Date();
      let start = new Date(0);
      
      switch(timeFilter) {
          case 'TODAY': start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
          case 'WEEK': start = new Date(now.setDate(now.getDate() - 7)); break;
          case 'MONTH': start = new Date(now.getFullYear(), now.getMonth(), 1); break;
          case 'YEAR': start = new Date(now.getFullYear(), 0, 1); break;
      }

      const filteredOrders = orders.filter(o => new Date(o.timestamp) >= start && o.status !== 'cancelled');
      const filteredExpenses = expenses.filter(e => new Date(e.timestamp) >= start);
      
      return { filteredOrders, filteredExpenses };
  };

  const { filteredOrders, filteredExpenses } = useMemo(getFilteredData, [orders, expenses, timeFilter]);

  // Calculations
  const totalRevenue = filteredOrders.reduce((acc, o) => acc + o.grandTotal, 0);
  const totalExpenseAmount = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalRevenue - totalExpenseAmount;
  const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
  
  // Profit Margin (Prevent div by zero)
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Chart Data Preparation (Group by Day)
  const chartData = useMemo(() => {
      const groupedData: Record<string, { name: string, revenue: number, expenses: number }> = {};
      
      // Initialize based on range to ensure empty days/months show up could be complex, 
      // for simplicity we aggregate what we have.
      
      filteredOrders.forEach(o => {
          const dateKey = new Date(o.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!groupedData[dateKey]) groupedData[dateKey] = { name: dateKey, revenue: 0, expenses: 0 };
          groupedData[dateKey].revenue += o.grandTotal;
      });

      filteredExpenses.forEach(e => {
          const dateKey = new Date(e.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!groupedData[dateKey]) groupedData[dateKey] = { name: dateKey, revenue: 0, expenses: 0 };
          groupedData[dateKey].expenses += e.amount;
      });

      // Sort by date roughly (relying on string sort might be buggy for cross month, but okay for MVP)
      // Ideally convert keys back to dates for sort.
      return Object.values(groupedData).sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime());
  }, [filteredOrders, filteredExpenses]);

  return (
    <div className="p-8 h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
                <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                    <BarChart2 className="w-8 h-8 text-blue-600" /> Analytics & Reports
                </h1>
                <p className="text-gray-500 font-medium mt-1">Financial insights and performance metrics.</p>
            </div>
            
            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex">
                {['TODAY', 'WEEK', 'MONTH', 'YEAR'].map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setTimeFilter(filter as any)}
                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                            timeFilter === filter 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="relative z-10">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Revenue</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-black text-gray-900">{systemConfig.currency} {totalRevenue.toLocaleString()}</span>
                    </div>
                </div>
                <div className="absolute right-[-10px] bottom-[-10px] opacity-10 rotate-12 group-hover:scale-110 transition-transform">
                    <DollarSign className="w-24 h-24 text-blue-600" />
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="relative z-10">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Net Profit</h3>
                    <div className="flex items-end gap-2">
                        <span className={`text-2xl font-black ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {systemConfig.currency} {netProfit.toLocaleString()}
                        </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-2 ${netProfit >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {profitMargin.toFixed(1)}% Margin
                    </span>
                </div>
                <div className="absolute right-[-10px] bottom-[-10px] opacity-10 rotate-12 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-24 h-24 text-green-600" />
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="relative z-10">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Expenses</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-black text-red-500">{systemConfig.currency} {totalExpenseAmount.toLocaleString()}</span>
                    </div>
                </div>
                <div className="absolute right-[-10px] bottom-[-10px] opacity-10 rotate-12 group-hover:scale-110 transition-transform">
                    <TrendingDown className="w-24 h-24 text-red-600" />
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="relative z-10">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Orders Processed</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-black text-gray-900">{filteredOrders.length}</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 mt-2 block">
                        Avg: {systemConfig.currency} {Math.round(averageOrderValue).toLocaleString()} / Order
                    </span>
                </div>
                <div className="absolute right-[-10px] bottom-[-10px] opacity-10 rotate-12 group-hover:scale-110 transition-transform">
                    <ShoppingCart className="w-24 h-24 text-orange-500" />
                </div>
            </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Revenue Trend Chart */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-80 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-500" /> Revenue Trend
                    </h3>
                </div>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                formatter={(value: number) => [`${systemConfig.currency} ${value.toLocaleString()}`, 'Revenue']}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Profit vs Expense Chart */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-80 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-purple-500" /> Income vs Expense
                    </h3>
                </div>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} dy={10} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                cursor={{fill: '#f9fafb'}}
                            />
                            <Bar dataKey="revenue" fill="#4ade80" radius={[4, 4, 0, 0]} name="Income" />
                            <Bar dataKey="expenses" fill="#f87171" radius={[4, 4, 0, 0]} name="Expense" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ReportsView;
