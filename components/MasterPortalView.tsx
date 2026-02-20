
import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Trash2, Key, RefreshCcw, Power, Lock, 
  LayoutGrid, Globe, Plus, X, CheckCircle2, ToggleLeft, ToggleRight,
  Users, UserPlus, Phone, Mail, BadgeCheck, UserCog, Briefcase, Eye, EyeOff,
  Server, AlertOctagon, Activity, CreditCard, Calendar, LogIn, Save, ImageIcon, DollarSign, Menu, Upload, Contact, Banknote, ArrowRightLeft, Coins, LifeBuoy, FileText, Database, Download, ShieldCheck
} from 'lucide-react';
import { SystemConfig, BusinessPage, UserRole, StaffMember, Customer, SubscriptionTier, SystemAuditLog } from '../types';

interface MasterPortalViewProps {
  onKillSwitch: () => void;
  systemConfig: SystemConfig;
  onUpdateConfig: (config: SystemConfig) => void;
  businessPages: BusinessPage[]; 
  setBusinessPages: (pages: BusinessPage[]) => void;
  onPreviewPage: (page: BusinessPage) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onExportData: () => void; // New
  auditLogs: SystemAuditLog[]; // New
}

const MOCK_CUSTOMERS: Customer[] = [
  { id: 'C1', name: 'VIP Guest One', contact: '0700-000-001', email: 'vip@example.com', loyaltyPoints: 1500, lastVisit: new Date() },
  { id: 'C2', name: 'Regular Joe', contact: '0700-000-002', email: 'joe@example.com', loyaltyPoints: 200, lastVisit: new Date() },
];

const MasterPortalView: React.FC<MasterPortalViewProps> = ({ 
  onKillSwitch, systemConfig, onUpdateConfig, 
  businessPages, setBusinessPages, onPreviewPage, onToggleSidebar, isSidebarOpen,
  onExportData, auditLogs
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'identity' | 'currency' | 'support' | 'vault'>('overview');
  
  const [customerList, setCustomerList] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({});
  const [tempConfig, setTempConfig] = useState<SystemConfig>(systemConfig);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => { setTempConfig(systemConfig); }, [systemConfig]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000); 
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(tempConfig);
    showNotification("System Configuration Saved Successfully!");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setTempConfig(prev => ({ ...prev, logo: reader.result as string })); };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) return;
    const customer: Customer = { id: `C${Math.floor(Math.random() * 1000)}`, name: newCustomer.name, contact: newCustomer.contact || '', email: newCustomer.email || '', loyaltyPoints: 0, lastVisit: new Date() };
    setCustomerList([customer, ...customerList]);
    setIsAddCustomerModalOpen(false);
    setNewCustomer({});
    showNotification("Customer added successfully");
  };

  const toggleRevealPassword = (id: string) => {
    const newSet = new Set(revealedPasswords);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setRevealedPasswords(newSet);
  };

  return (
    <div className="p-8 h-full bg-[#111827] overflow-y-auto text-white flex flex-col relative font-sans">
      {notification && (
        <div className="fixed bottom-8 right-8 z-[200] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            <div><h4 className="font-black text-sm uppercase tracking-wider">{notification.type === 'success' ? 'Success' : 'Error'}</h4><p className="text-xs font-bold opacity-90">{notification.message}</p></div>
          </div>
        </div>
      )}

      {isSecurityModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1e1e2e] border border-white/10 rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-indigo-600/10">
              <div><h3 className="text-2xl font-black tracking-tighter uppercase text-white flex items-center gap-3"><Key className="w-6 h-6 text-indigo-400" /> Penal Codes & Credentials</h3><p className="text-gray-400 text-xs font-medium mt-1">Master view of all tenant access keys.</p></div>
              <button onClick={() => setIsSecurityModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-gray-400"><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-4">
               {businessPages.map(tenant => (
                  <div key={tenant.id} className="bg-[#2a2a3c] rounded-2xl p-5 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-500/30 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 font-black text-lg">{tenant.businessName.charAt(0)}</div>
                        <div><h4 className="font-bold text-white text-lg leading-tight">{tenant.businessName}</h4><div className="flex items-center gap-2 mt-1"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tenant.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{tenant.status}</span><span className="text-xs text-gray-500 font-mono">ID: {tenant.id}</span></div></div>
                     </div>
                     <div className="grid grid-cols-2 gap-4 bg-black/20 p-3 rounded-xl border border-white/5">
                        <div className="space-y-1"><p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Username</p><p className="text-sm font-bold text-gray-300 font-mono">{tenant.credentials?.username || 'N/A'}</p></div>
                        <div className="space-y-1 relative"><p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Password</p><div className="flex items-center gap-2"><p className="text-sm font-bold text-gray-300 font-mono min-w-[80px]">{revealedPasswords.has(tenant.id) ? tenant.credentials?.password : '••••••••'}</p><button onClick={() => toggleRevealPassword(tenant.id)} className="text-gray-500 hover:text-white transition-colors">{revealedPasswords.has(tenant.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button></div></div>
                        <div className="space-y-1 col-span-2 pt-2 border-t border-white/5"><div className="flex justify-between items-center"><p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">Master PIN</p><p className="text-sm font-bold text-indigo-300 font-mono tracking-widest">{tenant.credentials?.adminPin || '0000'}</p></div></div>
                     </div>
                  </div>
               ))}
            </div>
            <div className="p-6 bg-black/20 border-t border-white/5"><div className="flex items-start gap-3 bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20"><ShieldAlert className="w-5 h-5 text-yellow-500 shrink-0" /><div><h5 className="text-sm font-bold text-yellow-500 uppercase">Security Warning</h5><p className="text-xs text-yellow-200/70 mt-1">These credentials provide full access to tenant instances.</p></div></div></div>
          </div>
        </div>
      )}

      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-indigo-600/10"><div><h3 className="text-2xl font-black tracking-tighter uppercase text-white flex items-center gap-3"><Users className="w-6 h-6 text-indigo-400" /> Add Customer</h3></div><button onClick={() => setIsAddCustomerModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-gray-400"><X /></button></div>
             <form onSubmit={handleAddCustomer} className="p-8 space-y-6">
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Customer Name</label><input required value={newCustomer.name || ''} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Phone Number</label><input value={newCustomer.contact || ''} onChange={e => setNewCustomer({...newCustomer, contact: e.target.value})} className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold" /></div>
                <button className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black text-lg flex items-center justify-center gap-3"><UserPlus className="w-6 h-6" /> Register Customer</button>
             </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-10 flex-1 w-full">
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-800 pb-8 gap-4">
          <div className="flex items-center gap-4"><div className="p-4 bg-indigo-600/20 rounded-2xl border border-indigo-500/50"><ShieldAlert className="w-10 h-10 text-indigo-500" /></div><div><h1 className="text-4xl font-black tracking-tighter uppercase">Abdomen Portal</h1><p className="text-gray-500 font-bold text-sm tracking-widest italic">System Administration & Distribution</p></div></div>
          <div className="text-right">
             <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800 flex-wrap">
                {['overview', 'identity', 'support', 'currency', 'customers', 'vault'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'}`}>
                        {tab.replace('_', ' ')}
                    </button>
                ))}
             </div>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <button onClick={() => setIsSecurityModalOpen(true)} className="p-8 bg-indigo-600 rounded-3xl text-left shadow-2xl hover:scale-[1.02] transition-all overflow-hidden relative"><Key className="w-12 h-12 mb-4" /><h3 className="text-xl font-black mb-1 uppercase tracking-tighter">Penal Codes</h3><p className="opacity-70 text-[11px] font-bold uppercase leading-tight">Credential Audit & Logs</p></button>
              <button onClick={() => setActiveTab('vault')} className="p-8 bg-gray-800 rounded-3xl text-left border border-gray-700 shadow-xl hover:bg-gray-750 transition-all group relative overflow-hidden"><Database className="w-12 h-12 mb-4 text-emerald-400" /><h3 className="text-xl font-black mb-1 uppercase tracking-tighter">System Vault</h3><p className="opacity-70 text-[11px] font-bold uppercase leading-tight">Archiving & Historical Records</p></button>
              <button onClick={() => setActiveTab('support')} className="p-8 bg-gray-800 rounded-3xl text-left border border-gray-700 shadow-xl hover:bg-gray-750 transition-all group relative overflow-hidden"><LifeBuoy className="w-12 h-12 mb-4 text-orange-400" /><h3 className="text-xl font-black mb-1 uppercase tracking-tighter">Support Lines</h3><p className="opacity-70 text-[11px] font-bold uppercase leading-tight">Set Help Numbers</p></button>
            </div>
          </div>
        )}

        {activeTab === 'vault' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-900 border border-gray-800 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><History className="w-24 h-24" /></div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Historical Integrity</p>
                        <h3 className="text-3xl font-black text-white">2.0 YEARS</h3>
                        <p className="text-[9px] text-emerald-400 font-bold uppercase mt-2">Active Retention Policy</p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><FileText className="w-24 h-24" /></div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Administrative Audits</p>
                        <h3 className="text-3xl font-black text-white">{auditLogs.length} Entries</h3>
                        <p className="text-[9px] text-blue-400 font-bold uppercase mt-2">Staff & Setting Changes</p>
                    </div>
                    <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-20"><ShieldCheck className="w-24 h-24" /></div>
                        <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Emergency Export</p>
                        <h3 className="text-3xl font-black text-white">DATA VAULT</h3>
                        <button onClick={onExportData} className="mt-4 flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                            <Download className="w-4 h-4" /> Download archive
                        </button>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] overflow-hidden">
                    <div className="p-8 border-b border-gray-800 flex justify-between items-center">
                        <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                            <Activity className="w-6 h-6 text-indigo-500" /> Audit Log (Staff & Policy)
                        </h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-black/20 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800 sticky top-0">
                                <tr><th className="p-6">Timestamp</th><th className="p-6">Action</th><th className="p-6">User</th><th className="p-6">Details</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800 text-xs font-bold text-gray-400">
                                {auditLogs.length === 0 ? (
                                    <tr><td colSpan={4} className="p-20 text-center uppercase tracking-widest opacity-30">No administrative audits found</td></tr>
                                ) : (
                                    auditLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-white/5">
                                            <td className="p-6 font-mono text-indigo-400">{new Date(log.timestamp).toLocaleString()}</td>
                                            <td className="p-6"><span className="bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded text-[10px] uppercase font-black">{log.action}</span></td>
                                            <td className="p-6 uppercase">{log.performedBy}</td>
                                            <td className="p-6 italic">{log.details}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* REST OF TABS (identity, support, currency, customers) - Kept for consistency */}
        {activeTab === 'identity' && (
           <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8 max-w-4xl mx-auto shadow-2xl">
                 <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-6"><div><h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3"><Contact className="w-6 h-6 text-indigo-500" /> System Identity</h2><p className="text-gray-500 text-sm mt-1">Manage global branding and system name.</p></div></div>
                 <form onSubmit={handleSaveConfig} className="space-y-8">
                    <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-gray-950 rounded-2xl border border-gray-800"><div className="w-32 h-32 rounded-full bg-white p-2 relative group shadow-lg border-4 border-indigo-900/50 overflow-hidden flex items-center justify-center shrink-0">{tempConfig.logo ? (<img src={tempConfig.logo} alt="Logo" className="w-full h-full object-contain rounded-full" />) : (<div className="text-gray-400 font-bold text-xs">NO LOGO</div>)}<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer pointer-events-none rounded-full"><Upload className="w-8 h-8 text-white" /></div><input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /></div><div className="w-full space-y-3"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><ImageIcon className="w-3 h-3" /> Master Logo Source</label><div className="relative"><input type="text" value={tempConfig.logo} onChange={e => setTempConfig({...tempConfig, logo: e.target.value})} className="w-full pl-4 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-white text-sm font-mono truncate" placeholder="https://..." /><div className="absolute right-3 top-1/2 -translate-y-1/2"><Upload className="w-5 h-5 text-gray-500" /></div></div></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-1"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">App / System Name</label><input type="text" value={tempConfig.name} onChange={e => setTempConfig({...tempConfig, name: e.target.value})} className="w-full px-5 py-4 bg-gray-950 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold text-lg" /></div><div className="space-y-1"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Master Override PIN</label><input type="text" value={tempConfig.master_pin} onChange={e => setTempConfig({...tempConfig, master_pin: e.target.value})} className="w-full px-5 py-4 bg-gray-950 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-mono font-bold tracking-widest text-center" /></div></div>
                    <div className="pt-4 flex justify-end"><button type="submit" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95"><Save className="w-5 h-5" /> Save Identity</button></div>
                 </form>
              </div>
           </div>
        )}

        {activeTab === 'support' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8 max-w-4xl mx-auto shadow-2xl">
                 <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-6"><div><h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3"><LifeBuoy className="w-6 h-6 text-indigo-500" /> System Support Configuration</h2><p className="text-gray-500 text-sm mt-1">Define the emergency contact details visible to all Tenants.</p></div></div>
                 <form onSubmit={handleSaveConfig} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-1"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Phone className="w-3 h-3 text-indigo-500" /> System Support Phone</label><input type="text" value={tempConfig.owner_contact} onChange={e => setTempConfig({...tempConfig, owner_contact: e.target.value})} className="w-full px-5 py-4 bg-gray-950 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold" /></div><div className="space-y-1"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Mail className="w-3 h-3 text-indigo-500" /> System Support Email</label><input type="email" value={tempConfig.support_email || ''} onChange={e => setTempConfig({...tempConfig, support_email: e.target.value})} className="w-full px-5 py-4 bg-gray-950 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold" /></div></div>
                    <div className="pt-4 flex justify-end"><button type="submit" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95"><Save className="w-5 h-5" /> Update Global Settings</button></div>
                 </form>
              </div>
           </div>
        )}
      </div>

      <div className="mt-auto pt-10 pb-4 w-full max-w-7xl mx-auto">
         <div className="p-6 bg-red-900/10 border border-red-900/30 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4"><div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/50"><AlertOctagon className="w-8 h-8 text-white" /></div><div><h3 className="text-xl font-black text-white uppercase tracking-tight">Danger Zone</h3><p className="text-red-400 font-medium text-sm">Emergency System Controls</p></div></div>
            <button onClick={onKillSwitch} className="w-full md:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-3 shadow-xl transition-all hover:scale-105"><Power className="w-5 h-5" /> Activate Kill-Switch</button>
         </div>
      </div>
    </div>
  );
};

export default MasterPortalView;
