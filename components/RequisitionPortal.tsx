import React, { useState } from 'react';
import { 
  Plus, Send, Clock, Trash2, Calendar, ClipboardList, 
  Wrench, X, Tag, FileText, CheckSquare, Square, Edit, Scale, Save, Search
} from 'lucide-react';
import { StoreItem, Requisition, StaffMember } from '../types';

interface RequisitionPortalProps {
  storeItems: StoreItem[]; // Changed from Product[] to StoreItem[]
  onCreateRequisition: (req: Requisition) => void;
  myRequisitions: Requisition[];
  currentUser: StaffMember | null;
}

const DEFAULT_DEPARTMENTS = ['Production', 'Logistics', 'Maintenance', 'Administration', 'Kitchen', 'Bar', 'Front House'];
const UNITS = ['pcs', 'kg', 'ltr', 'box', 'pack', 'dozen', 'gm', 'ml', 'set', 'pair'];

const RequisitionPortal: React.FC<RequisitionPortalProps> = ({ 
  storeItems, onCreateRequisition, myRequisitions = [], currentUser 
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  
  // Dynamic Departments State
  const [availableDepartments, setAvailableDepartments] = useState<string[]>(DEFAULT_DEPARTMENTS);
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');

  // Table State
  const [logItems, setLogItems] = useState<Requisition['items']>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const [newItem, setNewItem] = useState({
    name: '',
    department: 'Production',
    quantity: '',
    unit: 'pcs',
    date: new Date().toISOString().split('T')[0],
    details: ''
  });

  // Suggestion State
  const [suggestions, setSuggestions] = useState<StoreItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleNameChange = (val: string) => {
      setNewItem({...newItem, name: val});
      if (val.length > 0) {
          const matches = storeItems.filter(p => p.name.toLowerCase().includes(val.toLowerCase()));
          setSuggestions(matches);
          setShowSuggestions(true);
      } else {
          setSuggestions([]);
          setShowSuggestions(false);
      }
  };

  const selectStoreItemSuggestion = (p: StoreItem) => {
      setNewItem({
          ...newItem,
          name: p.name,
          unit: p.unit || 'pcs'
      });
      setShowSuggestions(false);
  };

  const handleOpenAdd = () => {
      setEditingIndex(null);
      setNewItem({
        name: '',
        department: 'Production',
        quantity: '',
        unit: 'pcs',
        date: new Date().toISOString().split('T')[0],
        details: ''
      });
      setSuggestions([]);
      setIsModalOpen(true);
  };

  const handleOpenEdit = (index: number) => {
      const item = logItems[index];
      setEditingIndex(index);
      setNewItem({
          name: item.itemName,
          department: item.department || 'Production',
          quantity: item.quantity.toString(),
          unit: item.unit || 'pcs',
          date: item.dateRequired || new Date().toISOString().split('T')[0],
          details: item.details || ''
      });
      setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.quantity) return;

    // Try to find matching store item for ID linking
    const matchedItem = storeItems.find(p => p.name.toLowerCase() === newItem.name.toLowerCase());

    const entry = {
        itemName: newItem.name,
        department: newItem.department,
        quantity: parseInt(newItem.quantity),
        unit: newItem.unit,
        dateRequired: newItem.date,
        details: newItem.details,
        itemId: matchedItem ? matchedItem.id : undefined // Link if exact match
    };

    if (editingIndex !== null) {
        // Update existing
        const updatedLogs = [...logItems];
        updatedLogs[editingIndex] = entry;
        setLogItems(updatedLogs);
    } else {
        // Add new
        setLogItems([...logItems, entry]);
    }

    setIsModalOpen(false);
    setEditingIndex(null);
  };

  const handleRemoveItem = (index: number) => {
    if(confirm('Remove this line item?')) {
        setLogItems(logItems.filter((_, i) => i !== index));
    }
  };

  const handleAddDepartment = () => {
      if (newDeptName && !availableDepartments.includes(newDeptName)) {
          setAvailableDepartments([...availableDepartments, newDeptName]);
          setNewItem({...newItem, department: newDeptName});
          setNewDeptName('');
          setIsAddingDept(false);
      }
  };

  const handleSubmit = () => {
    if (logItems.length === 0) return;

    const requisition: Requisition = {
        id: `REQ-${Date.now()}`,
        requesterName: currentUser?.name || 'Staff',
        requesterRole: currentUser?.role || 'MANAGER', // Safe fallback
        items: logItems,
        status: 'PENDING',
        timestamp: new Date()
    };

    onCreateRequisition(requisition);
    setLogItems([]);
    setActiveTab('history');
    alert("Order Fulfillment Log submitted to Store Keeper!");
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-white font-sans overflow-hidden">
      
      {/* Header */}
      <div className="p-8 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
         <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-700 shadow-sm border border-blue-100">
               <Wrench className="w-8 h-8" />
            </div>
            <div>
               <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">Store Keeper's Order Fulfillment Log</h1>
               <p className="text-sm font-medium text-gray-600">Log requirements for internal supply and fulfillment.</p>
            </div>
         </div>
         
         <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
            <button 
                onClick={() => setActiveTab('create')}
                className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'create' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}
            >
                Current Log
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}
            >
                History
            </button>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-gray-50 p-8 custom-scrollbar">
         
         {activeTab === 'create' ? (
            <div className="max-w-7xl mx-auto flex flex-col gap-6 h-full">
                
                {/* Table Container */}
                <div className="bg-white border-2 border-blue-900 rounded-lg overflow-hidden shadow-sm flex-1 flex flex-col min-h-[400px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b-2 border-blue-900 text-blue-900 text-xs font-black uppercase tracking-tight">
                                    <th className="p-4 border-r border-blue-200 w-1/4">Requirement Name</th>
                                    <th className="p-4 border-r border-blue-200 w-1/6">Department Name</th>
                                    <th className="p-4 border-r border-blue-200 w-32">Quantity</th>
                                    <th className="p-4 border-r border-blue-200 w-32">
                                        <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Dates</div>
                                    </th>
                                    <th className="p-4 border-r border-blue-200">Order Required Details</th>
                                    <th className="p-4 w-32 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-gray-900 font-medium">
                                {logItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-gray-500 bg-gray-50 italic font-semibold">
                                            Log is empty. Add a requirement to begin.
                                        </td>
                                    </tr>
                                ) : (
                                    logItems.map((item, idx) => (
                                        <tr key={idx} className="border-b border-gray-200 hover:bg-blue-50/30">
                                            <td className="p-4 border-r border-gray-200 align-top font-bold">{item.itemName}</td>
                                            <td className="p-4 border-r border-gray-200 align-top">
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-bold uppercase">{item.department}</span>
                                            </td>
                                            <td className="p-4 border-r border-gray-200 align-top">
                                                {item.quantity} <span className="text-xs text-gray-600 font-bold">{item.unit}</span>
                                            </td>
                                            <td className="p-4 border-r border-gray-200 align-top font-mono text-xs text-gray-700">{item.dateRequired}</td>
                                            <td className="p-4 border-r border-gray-200 align-top text-gray-800 italic">
                                                {item.details || '-'}
                                            </td>
                                            <td className="p-4 align-top text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => handleOpenEdit(idx)}
                                                        className="p-2 bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 rounded-lg transition-colors"
                                                        title="Edit Line"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleRemoveItem(idx)}
                                                        className="p-2 bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-700 rounded-lg transition-colors"
                                                        title="Delete Line"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                {/* Add Row Placeholder */}
                                <tr className="bg-blue-50/50 cursor-pointer hover:bg-blue-100/50 transition-colors" onClick={handleOpenAdd}>
                                    <td colSpan={6} className="p-3 text-center text-blue-700 font-bold text-xs uppercase tracking-widest border-t-2 border-dashed border-blue-200">
                                        + Click to Add Requirement Row
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="flex justify-end pt-4">
                    <div className="flex flex-col gap-2 items-end w-full md:w-auto">
                        <div className="text-xs font-bold text-gray-600 mb-2">Store Keeper's Signature: _______________________ Date: ___________</div>
                        <button 
                            onClick={handleSubmit}
                            disabled={logItems.length === 0}
                            className="px-8 py-4 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-black uppercase tracking-widest shadow-xl flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            <Send className="w-5 h-5" /> Submit Log to Store
                        </button>
                    </div>
                </div>

            </div>
         ) : (
            /* HISTORY TAB */
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Safe copy before sort */}
                {[...myRequisitions].sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).map(req => (
                    <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-1">Requisition Log #{req.id.split('-')[1]}</h3>
                                <div className="flex items-center gap-4 text-xs font-medium text-gray-600">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {req.timestamp.toLocaleString()}</span>
                                    {req.approvedBy && <span className="flex items-center gap-1 text-green-700 font-bold"><CheckSquare className="w-3 h-3" /> Approved by {req.approvedBy}</span>}
                                </div>
                            </div>
                            <span className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest ${
                                req.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                req.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                                {req.status}
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {req.items.map((item, idx) => (
                                <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="font-bold text-gray-900 text-sm mb-1">{item.itemName}</p>
                                    <div className="flex justify-between items-end">
                                        <div className="text-xs text-gray-600 space-y-0.5">
                                            <p className="uppercase font-bold text-[10px] bg-gray-200 px-1 rounded w-fit text-gray-800">{item.department}</p>
                                            <p className="opacity-80">{item.dateRequired}</p>
                                        </div>
                                        <span className="text-lg font-black text-gray-800">
                                            {item.quantity} <span className="text-xs font-normal text-gray-600">{item.unit}</span>
                                        </span>
                                    </div>
                                    {item.details && <p className="mt-2 text-xs italic text-gray-600 border-t border-gray-200 pt-2">{item.details}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
         )}
      </div>

      {/* --- ADD/EDIT REQUIREMENT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 md:p-8 bg-blue-900 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter">
                            {editingIndex !== null ? 'Edit Requirement' : 'Add Requirement'}
                        </h2>
                        <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mt-1">Log item details for fulfillment</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                </div>

                {/* Form Body */}
                <div className="overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleSaveItem} className="p-6 md:p-8 space-y-6">
                        
                        {/* Requirement Name with Autosuggest from STORE ITEMS */}
                        <div className="space-y-1 relative">
                            <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                                <ClipboardList className="w-3 h-3" /> Requirement Name
                            </label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    autoFocus
                                    required
                                    value={newItem.name}
                                    onChange={e => handleNameChange(e.target.value)}
                                    className="w-full pl-10 pr-5 py-4 bg-gray-100 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold text-black placeholder:text-gray-500"
                                    placeholder="Start typing to search store inventory..."
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                />
                            </div>
                            
                            {/* Suggestions Dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                                    {suggestions.map(p => (
                                        <div 
                                            key={p.id}
                                            onClick={() => selectStoreItemSuggestion(p)}
                                            className="px-5 py-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors border-b border-gray-50 last:border-none"
                                        >
                                            <span className="font-bold text-gray-800 text-sm">{p.name}</span>
                                            <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500 uppercase font-bold tracking-wider">
                                                Stock: {p.stock} {p.unit}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quantity & Unit */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                                    <Tag className="w-3 h-3" /> Quantity
                                </label>
                                <input 
                                    type="number"
                                    required
                                    value={newItem.quantity}
                                    onChange={e => setNewItem({...newItem, quantity: e.target.value})}
                                    className="w-full px-5 py-4 bg-gray-100 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-xl font-black text-black placeholder:text-gray-500"
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                                    <Scale className="w-3 h-3" /> Unit
                                </label>
                                <select
                                    value={newItem.unit}
                                    onChange={e => setNewItem({...newItem, unit: e.target.value})}
                                    className="w-full px-5 py-4 bg-gray-100 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-black appearance-none"
                                >
                                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Department Tags with Add Feature */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                                <Wrench className="w-3 h-3" /> Department Name
                            </label>
                            
                            <div className="flex flex-wrap gap-2 pt-1 mb-2">
                                {availableDepartments.map(dept => (
                                    <button
                                        key={dept}
                                        type="button"
                                        onClick={() => setNewItem({...newItem, department: dept})}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            newItem.department === dept 
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                                        }`}
                                    >
                                        {dept}
                                    </button>
                                ))}
                                
                                {/* Add New Department Button */}
                                {!isAddingDept ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingDept(true)}
                                        className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-50 border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Custom
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-200">
                                        <input 
                                            autoFocus
                                            value={newDeptName}
                                            onChange={e => setNewDeptName(e.target.value)}
                                            className="w-24 px-2 py-1 bg-white border border-blue-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-200 text-black"
                                            placeholder="Name..."
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddDepartment();
                                                }
                                            }}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={handleAddDepartment}
                                            className="p-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setIsAddingDept(false)}
                                            className="p-1 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Date */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> Date Required
                            </label>
                            <input 
                                type="date"
                                required
                                value={newItem.date}
                                onChange={e => setNewItem({...newItem, date: e.target.value})}
                                className="w-full px-5 py-4 bg-gray-100 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-black"
                            />
                        </div>

                        {/* Details */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-2">
                                <FileText className="w-3 h-3" /> Order Required Details
                            </label>
                            <textarea 
                                value={newItem.details}
                                onChange={e => setNewItem({...newItem, details: e.target.value})}
                                rows={3}
                                className="w-full px-5 py-4 bg-gray-100 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm text-black resize-none placeholder:text-gray-500"
                                placeholder="Any specific instructions..."
                            />
                        </div>

                        <button 
                            type="submit"
                            className={`w-full py-5 text-white rounded-3xl font-black text-lg shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                                editingIndex !== null 
                                    ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-100' 
                                    : 'bg-blue-900 hover:bg-blue-800 shadow-blue-100'
                            }`}
                        >
                            {editingIndex !== null ? <Save className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                            {editingIndex !== null ? 'Update Entry' : 'Add to Log'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default RequisitionPortal;
