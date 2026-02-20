
import React, { useState, useMemo } from 'react';
import { Users, MapPin, X, Trash2, ShieldCheck, UserCheck, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { StaffMember, Table, SectionAllocation, SystemConfig } from '../types';

interface WaiterAllocationsViewProps {
  staff: StaffMember[];
  tables: Table[];
  allocations: SectionAllocation[];
  onUpdateAllocations: (allocations: SectionAllocation[]) => void;
  systemConfig: SystemConfig;
}

const WaiterAllocationsView: React.FC<WaiterAllocationsViewProps> = ({ 
  staff, tables, allocations, onUpdateAllocations, systemConfig 
}) => {
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');

  const availableWaiters = staff.filter(s => s.role === 'WAITER' || s.role === 'BARMAN');
  const sections = useMemo(() => Array.from(new Set(tables.map(t => t.section || 'General'))), [tables]);

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !selectedSection) return;

    const member = staff.find(s => s.id === selectedStaff);
    if (!member) return;

    // Check if section already assigned
    const existingIdx = allocations.findIndex(a => a.sectionName === selectedSection);
    const newAlloc: SectionAllocation = {
      id: `ALC-${Date.now()}`,
      sectionName: selectedSection,
      waiterId: member.id,
      waiterName: member.name,
      timestamp: new Date()
    };

    if (existingIdx !== -1) {
        const updated = [...allocations];
        updated[existingIdx] = newAlloc;
        onUpdateAllocations(updated);
    } else {
        onUpdateAllocations([...allocations, newAlloc]);
    }

    setSelectedStaff('');
    setSelectedSection('');
  };

  const clearAllocation = (id: string) => {
    onUpdateAllocations(allocations.filter(a => a.id !== id));
  };

  const clearAll = () => {
    if (confirm("Reset ALL current waiter allocations?")) {
        onUpdateAllocations([]);
    }
  };

  return (
    <div className="p-8 h-full bg-slate-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl"><UserCheck className="w-8 h-8" /></div>
             <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Waiter Allocations</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Section Zoning & Portal Permissions</p>
             </div>
          </div>
          <button 
            onClick={clearAll}
            className="px-6 py-3 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black text-xs uppercase flex items-center gap-2 hover:bg-red-100 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Reset Shifts
          </button>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* ASSIGNMENT FORM */}
            <div className="xl:col-span-1 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-lg">
                <h3 className="text-lg font-black text-slate-900 uppercase mb-6">Create Assignment</h3>
                <form onSubmit={handleAssign} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Member</label>
                        <select 
                            required
                            value={selectedStaff}
                            onChange={e => setSelectedStaff(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                        >
                            <option value="">Select Waiter/Waitress...</option>
                            {availableWaiters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location Section</label>
                        <select 
                            required
                            value={selectedSection}
                            onChange={e => setSelectedSection(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                        >
                            <option value="">Select Area Zone...</option>
                            {sections.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2">
                        <Layers className="w-4 h-4" /> Finalize Allocation
                    </button>
                </form>

                <div className="mt-8 p-5 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 font-bold uppercase leading-relaxed tracking-tight">
                        Waiters assigned here will have exclusive access to these areas in their portals. Others will be restricted.
                    </p>
                </div>
            </div>

            {/* LIVE REGISTRY */}
            <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Active Zone Registry</h3>
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black">{allocations.length} Active</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 bg-slate-50/30">
                                <th className="px-8 py-5">Staff Name</th>
                                <th className="px-8 py-5">Assigned Section</th>
                                <th className="px-8 py-5">Allocation Type</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {allocations.map(alc => (
                                <tr key={alc.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black shadow-sm">
                                                {alc.waiterName.charAt(0)}
                                            </div>
                                            <span className="font-bold text-slate-700 text-sm">{alc.waiterName}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                            {alc.sectionName}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Administrative
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button 
                                            onClick={() => clearAllocation(alc.id)}
                                            className="p-2 text-red-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {allocations.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center opacity-30 italic text-slate-400 uppercase font-black tracking-widest">
                                        No zoning restrictions active.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default WaiterAllocationsView;
