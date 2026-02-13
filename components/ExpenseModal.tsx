
import React, { useState, useEffect } from 'react';
import { X, Banknote, Tag, FileText, Calendar, Plus, ShoppingCart, MapPin, Settings, ArrowLeft, Edit2, Trash2, Check, Save } from 'lucide-react';
import { SystemConfig } from '../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: { 
    itemName: string; 
    department: string; 
    category: string; 
    amount: number; 
    description: string 
  }) => void;
  systemConfig: SystemConfig;
  initialData?: {
    itemName: string;
    department: string;
    category: string;
    amount: number;
    description: string;
  } | null;
}

const DEFAULT_CATEGORIES = ['Supplies', 'Utilities', 'Salary', 'Rent', 'Maintenance', 'Other'];
const DEFAULT_DEPARTMENTS = ['Kitchen', 'Bar', 'Front House', 'Cleaning', 'Administration', 'Logistics', 'Maintenance'];

const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, onSave, systemConfig, initialData }) => {
  // Data State
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [departments, setDepartments] = useState<string[]>(DEFAULT_DEPARTMENTS);

  // Form State
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [department, setDepartment] = useState(DEFAULT_DEPARTMENTS[0]);
  const [description, setDescription] = useState('');

  // UI State
  const [view, setView] = useState<'FORM' | 'MANAGE_CATS' | 'MANAGE_DEPTS'>('FORM');
  
  // Management State
  const [newItemValue, setNewItemValue] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Effect to load initial data for editing
  useEffect(() => {
      if (initialData) {
          setItemName(initialData.itemName);
          setAmount(initialData.amount.toString());
          setCategory(initialData.category);
          setDepartment(initialData.department);
          setDescription(initialData.description);
      } else {
          // Reset form if opening in "Add" mode
          setItemName('');
          setAmount('');
          setCategory(DEFAULT_CATEGORIES[0]);
          setDepartment(DEFAULT_DEPARTMENTS[0]);
          setDescription('');
      }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !itemName) return;
    onSave({
      itemName,
      department,
      category,
      amount: parseFloat(amount),
      description
    });
    // Reset Form
    setItemName('');
    setAmount('');
    setDescription('');
    // Keep category/department as is for convenience
    onClose();
  };

  // --- Management Handlers ---

  const handleAddItem = (type: 'CATS' | 'DEPTS') => {
      if (!newItemValue.trim()) return;
      if (type === 'CATS') {
          if(!categories.includes(newItemValue)) setCategories([...categories, newItemValue]);
      } else {
          if(!departments.includes(newItemValue)) setDepartments([...departments, newItemValue]);
      }
      setNewItemValue('');
  };

  const handleDeleteItem = (type: 'CATS' | 'DEPTS', index: number) => {
      if (!confirm('Are you sure you want to delete this option?')) return;
      if (type === 'CATS') {
          const val = categories[index];
          setCategories(categories.filter((_, i) => i !== index));
          if (category === val) setCategory(categories[0] || '');
      } else {
          const val = departments[index];
          setDepartments(departments.filter((_, i) => i !== index));
          if (department === val) setDepartment(departments[0] || '');
      }
  };

  const startEdit = (val: string, index: number) => {
      setEditingIndex(index);
      setEditingValue(val);
  };

  const saveEdit = (type: 'CATS' | 'DEPTS') => {
      if (editingIndex === null || !editingValue.trim()) return;
      
      if (type === 'CATS') {
          const oldVal = categories[editingIndex];
          const newCats = [...categories];
          newCats[editingIndex] = editingValue;
          setCategories(newCats);
          if (category === oldVal) setCategory(editingValue);
      } else {
          const oldVal = departments[editingIndex];
          const newDepts = [...departments];
          newDepts[editingIndex] = editingValue;
          setDepartments(newDepts);
          if (department === oldVal) setDepartment(editingValue);
      }
      setEditingIndex(null);
      setEditingValue('');
  };

  // --- Render Management View ---
  const renderManager = (type: 'CATS' | 'DEPTS') => {
      const items = type === 'CATS' ? categories : departments;
      const title = type === 'CATS' ? 'Manage Categories' : 'Manage Departments';

      return (
          <div className="flex flex-col h-full bg-white">
              <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                  <button onClick={() => setView('FORM')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                      <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <h3 className="text-lg font-black uppercase text-gray-800 tracking-tight">{title}</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
                  {items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                          {editingIndex === idx ? (
                              <div className="flex gap-2 flex-1">
                                  <input 
                                      autoFocus
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg outline-none font-bold text-sm"
                                  />
                                  <button onClick={() => saveEdit(type)} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"><Check className="w-4 h-4" /></button>
                                  <button onClick={() => setEditingIndex(null)} className="p-2 bg-gray-200 text-gray-500 rounded-lg hover:bg-gray-300"><X className="w-4 h-4" /></button>
                              </div>
                          ) : (
                              <>
                                  <span className="font-bold text-gray-700 text-sm">{item}</span>
                                  <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => startEdit(item, idx)} className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                      <button onClick={() => handleDeleteItem(type, idx)} className="p-2 hover:bg-red-100 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                              </>
                          )}
                      </div>
                  ))}
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50">
                  <div className="flex gap-2">
                      <input 
                          value={newItemValue}
                          onChange={(e) => setNewItemValue(e.target.value)}
                          placeholder={`New ${type === 'CATS' ? 'Category' : 'Department'}...`}
                          className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddItem(type)}
                      />
                      <button 
                          onClick={() => handleAddItem(type)}
                          className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg"
                      >
                          <Plus className="w-5 h-5" />
                      </button>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100 flex flex-col max-h-[95vh]">
        
        {view === 'FORM' ? (
            <>
                <div className="p-6 md:p-8 bg-emerald-600 text-white flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter">
                        {initialData ? 'Edit Expense' : 'Log New Expense'}
                    </h2>
                    <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mt-1">Record business expenditures</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                </div>

                <div className="overflow-y-auto custom-scrollbar">
                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                    
                    <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <ShoppingCart className="w-3 h-3" /> Item Bought
                    </label>
                    <input 
                        autoFocus
                        required
                        type="text"
                        value={itemName}
                        onChange={e => setItemName(e.target.value)}
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-bold text-gray-800 placeholder:text-gray-400"
                        placeholder="e.g. Tomatoes, Soap, Bulb..."
                    />
                    </div>

                    <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Banknote className="w-3 h-3" /> Cost ({systemConfig.currency})
                    </label>
                    <input 
                        required
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-2xl font-black text-gray-800 placeholder:text-gray-200"
                        placeholder="0.00"
                    />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="w-3 h-3" /> Destination Department
                            </label>
                            <button 
                                type="button"
                                onClick={() => setView('MANAGE_DEPTS')}
                                className="text-[9px] text-emerald-600 font-black uppercase flex items-center gap-1 hover:underline"
                            >
                                <Settings className="w-3 h-3" /> Manage
                            </button>
                        </div>
                        <div className="relative">
                            <select
                            value={department}
                            onChange={e => setDepartment(e.target.value)}
                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold text-gray-700 appearance-none"
                            >
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <MapPin className="w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Tag className="w-3 h-3" /> Expense Category
                            </label>
                            <button 
                                type="button"
                                onClick={() => setView('MANAGE_CATS')}
                                className="text-[9px] text-emerald-600 font-black uppercase flex items-center gap-1 hover:underline"
                            >
                                <Settings className="w-3 h-3" /> Manage
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {categories.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategory(cat)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                category === cat 
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' 
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            >
                                {cat}
                            </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-3 h-3" /> Additional Details
                    </label>
                    <textarea 
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={2}
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-sm text-gray-700 resize-none"
                        placeholder="Optional notes..."
                    />
                    </div>

                    <button 
                    type="submit"
                    className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all active:scale-[0.98]"
                    >
                    <Plus className="w-6 h-6" /> {initialData ? 'Update Expense' : 'Save Expense'}
                    </button>
                </form>
                </div>
            </>
        ) : (
            renderManager(view === 'MANAGE_CATS' ? 'CATS' : 'DEPTS')
        )}
      </div>
    </div>
  );
};

export default ExpenseModal;
