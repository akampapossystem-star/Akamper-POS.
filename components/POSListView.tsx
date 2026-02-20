
import React from 'react';
import { Monitor, LayoutGrid, CheckCircle2, ChevronRight, Power, Clock } from 'lucide-react';
import { AppView } from '../types';

interface POSListViewProps {
  onNavigate: (view: AppView) => void;
  businessName: string;
}

const POSListView: React.FC<POSListViewProps> = ({ onNavigate, businessName }) => {
  const terminals = [
    { id: 'TERM-01', name: 'Main Bar Terminal', status: 'Online', lastActive: 'Now' },
    { id: 'TERM-02', name: 'Kitchen KDS 1', status: 'Online', lastActive: '2m ago' },
    { id: 'TERM-03', name: 'Mobile Waiter Handheld', status: 'Offline', lastActive: '1h ago' },
  ];

  return (
    <div className="p-8 h-full bg-slate-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        <header>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Terminal Registry</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{businessName} Node Network</p>
        </header>

        <div className="grid grid-cols-1 gap-4">
            {terminals.map(term => (
                <button 
                    key={term.id}
                    onClick={() => onNavigate(AppView.SELL)}
                    className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center justify-between hover:shadow-xl hover:border-blue-300 transition-all group"
                >
                    <div className="flex items-center gap-6">
                        <div className={`p-5 rounded-2xl ${term.status === 'Online' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                            <Monitor className="w-8 h-8" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight">{term.name}</h3>
                            <div className="flex items-center gap-3 mt-1">
                                <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${term.status === 'Online' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                    <div className={`w-2 h-2 rounded-full ${term.status === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                    {term.status}
                                </span>
                                <span className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1"><Clock className="w-3 h-3"/> {term.lastActive}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block text-right">
                            <p className="text-[10px] font-black text-slate-300 uppercase">Hardware ID</p>
                            <p className="text-xs font-mono font-bold text-slate-400">{term.id}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <ChevronRight className="w-6 h-6" />
                        </div>
                    </div>
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default POSListView;
