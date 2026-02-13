
import React, { useState } from 'react';
import { Banknote, Search, Filter, Trash2, Plus, Calendar, ArrowUpRight, PieChart, Tag, ShoppingCart, MapPin, ClipboardList, Edit2, Clock, ChevronDown } from 'lucide-react';
import { Expense, SystemConfig } from '../types';

interface ExpensesViewProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onAddExpense: () => void;
  onEditExpense?: (expense: Expense) => void;
  systemConfig: SystemConfig;
}

const ExpensesView: React.FC<ExpensesViewProps> = ({ expenses, onDeleteExpense, onAddExpense, onEditExpense, systemConfig }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState<string>('THIS_MONTH'); // Default to This Month for better utility

  // Get unique categories for filter
  const categories = ['All', ...Array.from(new Set(expenses.map(e => e.category)))];

  // Helper: Time Filter Logic
  const checkTimeFilter = (date: Date) => {
      const now = new Date();
      const expenseDate = new Date(date);
      
      // Normalize dates to start of day for accurate comparison
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const expenseStart = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), expenseDate.getDate());

      switch (timeFilter) {
          case 'TODAY': 
              return expenseStart.getTime() === todayStart.getTime();
          case 'YESTERDAY':
              const yesterday = new Date(todayStart);
              yesterday.setDate(todayStart.getDate() - 1);
              return expenseStart.getTime() === yesterday.getTime();
          case 'THIS_WEEK':
              const firstDayOfWeek = new Date(todayStart);
              firstDayOfWeek.setDate(todayStart.getDate() - todayStart.getDay()); // Sunday as start
              return expenseStart >= firstDayOfWeek;
          case 'LAST_WEEK':
              const startLastWeek = new Date(todayStart);
              startLastWeek.setDate(todayStart.getDate() - todayStart.getDay() - 7);
              const endLastWeek = new Date(startLastWeek);
              endLastWeek.setDate(startLastWeek.getDate() + 6);
              return expenseStart >= startLastWeek && expenseStart <= endLastWeek;
          case 'THIS_MONTH':
              return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
          case 'LAST_MONTH':
              const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              return expenseDate.getMonth() === lastMonthDate.getMonth() && expenseDate.getFullYear() === lastMonthDate.getFullYear();
          case 'THIS_YEAR':
              return expenseDate.getFullYear() === now.getFullYear();
          case 'LAST_YEAR':
              return expenseDate.getFullYear() === now.getFullYear() - 1;
          case 'ALL':
          default: 
              return true;
      }
  };

  // Filter logic
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = 
      expense.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.amount.toString().includes(searchTerm);
    
    const matchesCategory = categoryFilter === 'All' || expense.category === categoryFilter;
    const matchesTime = checkTimeFilter(expense.timestamp);

    return matchesSearch && matchesCategory && matchesTime;
  });

  // Sort by date (newest first)
  const sortedExpenses = [...filteredExpenses].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Calculations
  const totalAmount = sortedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const averageAmount = sortedExpenses.length > 0 ? totalAmount / sortedExpenses.length : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      
      {/* Header Section */}
      <div className="shrink-0 p-8 pb-4 overflow-y-auto max-h-[40vh] custom-scrollbar">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-3">
              <Banknote className="w-8 h-8 text-pink-500" /> Expense Tracker
            </h1>
            <p className="text-gray-500 font-medium">Monitor expenditures, item purchases, and department allocations.</p>
          </div>
          <button 
            onClick={onAddExpense}
            className="px-8 py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-pink-200 transition-all active:scale-95 flex items-center gap-3"
          >
            <Plus className="w-5 h-5" /> LOG EXPENSE
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-8 flex flex-col xl:flex-row gap-4 items-center justify-between">
          
          {/* Time & Category Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
              
              {/* Time Filter Dropdown */}
              <div className="relative w-full sm:w-auto">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-pink-600">
                      <Clock className="w-4 h-4" />
                  </div>
                  <select 
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                      className="w-full sm:w-48 pl-9 pr-8 py-2.5 bg-pink-50 text-pink-700 border border-pink-100 rounded-xl text-xs font-black uppercase tracking-wider outline-none focus:ring-2 focus:ring-pink-500 appearance-none cursor-pointer hover:bg-pink-100 transition-colors"
                  >
                      <option value="TODAY">Today</option>
                      <option value="YESTERDAY">Yesterday</option>
                      <option value="THIS_WEEK">This Week</option>
                      <option value="LAST_WEEK">Last Week</option>
                      <option value="THIS_MONTH">This Month</option>
                      <option value="LAST_MONTH">Last Month</option>
                      <option value="THIS_YEAR">This Year</option>
                      <option value="LAST_YEAR">Last Year</option>
                      <option value="ALL">All Time</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400 pointer-events-none" />
              </div>

              {/* Category Chips */}
              <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar border-l border-gray-100 pl-3">
                  <Filter className="w-4 h-4 text-gray-400 shrink-0 hidden sm:block" />
                  <div className="flex gap-2">
                    {categories.map(cat => (
                        <button 
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider whitespace-nowrap transition-colors border-2 ${
                              categoryFilter === cat 
                                ? 'bg-gray-800 text-white border-gray-800' 
                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border-transparent'
                          }`}
                        >
                          {cat}
                        </button>
                    ))}
                  </div>
              </div>
          </div>

          {/* Search */}
          <div className="relative w-full xl:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search items, details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 font-medium text-sm transition-all"
              />
          </div>

        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    Total Expense <span className="text-pink-600 bg-pink-50 px-1.5 rounded">({timeFilter.replace('_', ' ')})</span>
                </p>
                <h3 className="text-3xl font-black text-gray-800">{systemConfig.currency} {totalAmount.toLocaleString()}</h3>
            </div>
            <div className="absolute right-[-10px] bottom-[-10px] opacity-10 rotate-12">
                <Banknote className="w-24 h-24 text-gray-800" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Transaction Count</p>
                <h3 className="text-3xl font-black text-gray-800">{filteredExpenses.length}</h3>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-auto overflow-hidden">
                <div className="h-full bg-pink-500 w-2/3 rounded-full"></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Average Cost</p>
                <h3 className="text-3xl font-black text-gray-800">{systemConfig.currency} {Math.round(averageAmount).toLocaleString()}</h3>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-orange-500">
                <ArrowUpRight className="w-3 h-3" /> Estimate
            </div>
          </div>
        </div>
      </div>

      {/* Table List (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-8 pt-4">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 sticky top-0 z-10 shadow-sm">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Item Bought</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedExpenses.map(expense => (
                    <tr key={expense.id} className="hover:bg-pink-50/20 transition-colors group">
                      <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {expense.timestamp.toLocaleDateString()} 
                          </div>
                      </td>
                      <td className="px-6 py-4">
                          <div className="flex items-center gap-2 font-black text-gray-800">
                             <ShoppingCart className="w-4 h-4 text-pink-500" />
                             {expense.itemName}
                          </div>
                      </td>
                      <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg w-fit">
                             <MapPin className="w-3 h-3 text-gray-400" />
                             {expense.department}
                          </div>
                      </td>
                      <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-black text-gray-600 uppercase shadow-sm">
                            <Tag className="w-3 h-3 text-pink-400" /> {expense.category}
                          </span>
                      </td>
                      <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                             {expense.description ? <ClipboardList className="w-3 h-3 text-gray-400" /> : null}
                             <span className="truncate max-w-[200px]">{expense.description || '-'}</span>
                          </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                          <span className="text-sm font-black text-pink-600">
                            - {systemConfig.currency} {expense.amount.toLocaleString()}
                          </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                              {onEditExpense && (
                                  <button 
                                    onClick={() => onEditExpense(expense)}
                                    className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit Expense"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                              )}
                              <button 
                                onClick={() => onDeleteExpense(expense.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                      </td>
                    </tr>
                ))}
                {sortedExpenses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-300">
                            <PieChart className="w-12 h-12 mb-4 opacity-50" />
                            <p className="text-xs font-black uppercase tracking-widest">No expenses found for this period</p>
                          </div>
                      </td>
                    </tr>
                )}
              </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ExpensesView;
