
import React, { useMemo, useState } from 'react';
import { ShieldX, Search, Trash2, Clock, User, Filter, AlertTriangle, CheckSquare, Printer, FileText } from 'lucide-react';
import { ReturnRecord, SystemConfig } from '../types';

interface VoidLogViewProps {
  returns: ReturnRecord[];
  systemConfig: SystemConfig;
}

const VoidLogView: React.FC<VoidLogViewProps> = ({ returns, systemConfig }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    return returns.filter(r => 
        r.originalOrderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.authorizedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reason?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [returns, searchTerm]);

  return (
    <div className="p-8 h-full bg-slate-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="p-4 bg-red-600 text-white rounded-3xl shadow-xl shadow-red-100"><ShieldX className="w-8 h-8" /></div>
             <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Void Audit Log</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Forensic record of all cancellations</p>
             </div>
          </div>
          <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                placeholder="Search voids..." 
                className="w-full lg:w-80 pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-red-500" 
              />
          </div>
        </header>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <th className="px-8 py-5">Timestamp</th>
                    <th className="px-8 py-5">Order Reference</th>
                    <th className="px-8 py-5">Authorized By</th>
                    <th className="px-8 py-5">Reason / Note</th>
                    <th className="px-8 py-5 text-right">Value Removed</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-700">
                 {filtered.map(record => (
                    <tr key={record.id} className="hover:bg-red-50/30 transition-colors">
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                             <Clock className="w-4 h-4 text-slate-300" />
                             {record.timestamp.toLocaleString()}
                          </div>
                       </td>
                       <td className="px-8 py-6 font-mono text-xs text-red-600">#{record.originalOrderId.slice(-8).toUpperCase()}</td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                             <User className="w-4 h-4 text-blue-500" />
                             {record.authorizedBy.toUpperCase()}
                          </div>
                       </td>
                       <td className="px-8 py-6 italic text-slate-500">{record.reason || 'No reason provided'}</td>
                       <td className="px-8 py-6 text-right font-black text-red-600">
                          {systemConfig.currency} {record.totalRefunded.toLocaleString()}
                       </td>
                    </tr>
                 ))}
                 {filtered.length === 0 && (
                    <tr><td colSpan={5} className="p-20 text-center text-slate-300 uppercase font-black tracking-widest">No void records found</td></tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default VoidLogView;
