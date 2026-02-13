
import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Trash2, Key, RefreshCcw, Power, Lock, 
  LayoutGrid, Globe, Plus, X, CheckCircle2, ToggleLeft, ToggleRight,
  Users, UserPlus, Phone, Mail, BadgeCheck, UserCog, Briefcase, Eye, EyeOff,
  Server, AlertOctagon, Activity, CreditCard, Calendar, LogIn, Save, ImageIcon, DollarSign, Menu, Upload, Contact, Banknote, ArrowRightLeft, Coins, LifeBuoy, FileText
} from 'lucide-react';
import { SystemConfig, BusinessPage, UserRole, StaffMember, Customer, SubscriptionTier } from '../types';

interface MasterPortalViewProps {
  onKillSwitch: () => void;
  systemConfig: SystemConfig;
  onUpdateConfig: (config: SystemConfig) => void;
  businessPages: BusinessPage[]; // Now acts as Tenants List
  setBusinessPages: (pages: BusinessPage[]) => void;
  onPreviewPage: (page: BusinessPage) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onSeedTenantData?: (tenantId: string) => void; // New Prop
}

const MOCK_CUSTOMERS: Customer[] = [
  { id: 'C1', name: 'VIP Guest One', contact: '0700-000-001', email: 'vip@example.com', loyaltyPoints: 1500, lastVisit: new Date() },
  { id: 'C2', name: 'Regular Joe', contact: '0700-000-002', email: 'joe@example.com', loyaltyPoints: 200, lastVisit: new Date() },
];

const MasterPortalView: React.FC<MasterPortalViewProps> = ({ 
  onKillSwitch, systemConfig, onUpdateConfig, 
  businessPages, setBusinessPages, onPreviewPage, onToggleSidebar, isSidebarOpen,
  onSeedTenantData
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'identity' | 'currency' | 'support'>('overview');
  
  // Customer State
  const [customerList, setCustomerList] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({});

  // System Config State (for Identity Tab)
  const [tempConfig, setTempConfig] = useState<SystemConfig>(systemConfig);

  // Security / Penal Codes Modal State
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());

  // Notification State
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Sync tempConfig when systemConfig changes
  useEffect(() => {
    setTempConfig(systemConfig);
  }, [systemConfig]);

  // Helper for notifications
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000); // Fade out after 3 seconds
  };

  // --- SYSTEM CONFIG LOGIC ---
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(tempConfig);
    showNotification("System Configuration Saved Successfully!");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempConfig(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- CUSTOMER LOGIC ---
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) return;
    const customer: Customer = {
      id: `C${Math.floor(Math.random() * 1000)}`,
      name: newCustomer.name,
      contact: newCustomer.contact || '',
      email: newCustomer.email || '',
      loyaltyPoints: 0,
      lastVisit: new Date()
    };
    setCustomerList([customer, ...customerList]);
    setIsAddCustomerModalOpen(false);
    setNewCustomer({});
    showNotification("Customer added successfully");
  };

  // --- SECURITY / PENAL CODES LOGIC ---
  const toggleRevealPassword = (id: string) => {
    const newSet = new Set(revealedPasswords);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setRevealedPasswords(newSet);
  };

  return (
    <div className="p-8 h-full bg-[#111827] overflow-y-auto text-white flex flex-col relative">
      
      {/* --- NOTIFICATION TOAST --- */}
      {notification && (
        <div className="fixed bottom-8 right-8 z-[200] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 ${
            notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            <div>
              <h4 className="font-black text-sm uppercase tracking-wider">{notification.type === 'success' ? 'Success' : 'Error'}</h4>
              <p className="text-xs font-bold opacity-90">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}
      
      {/* Security & Penal Codes Modal */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1e1e2e] border border-white/10 rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-indigo-600/10">
              <div>
                <h3 className="text-2xl font-black tracking-tighter uppercase text-white flex items-center gap-3">
                  <Key className="w-6 h-6 text-indigo-400" /> Penal Codes & Credentials
                </h3>
                <p className="text-gray-400 text-xs font-medium mt-1">Master view of all tenant access keys.</p>
              </div>
              <button onClick={() => setIsSecurityModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-gray-400"><X /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-4">
               {businessPages.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 font-bold uppercase text-xs border-2 border-dashed border-gray-800 rounded-2xl">
                     No active tenants found
                  </div>
               ) : (
                  businessPages.map(tenant => (
                     <div key={tenant.id} className="bg-[#2a2a3c] rounded-2xl p-5 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-500/30 transition-colors">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 font-black text-lg">
                              {tenant.businessName.charAt(0)}
                           </div>
                           <div>
                              <h4 className="font-bold text-white text-lg leading-tight">{tenant.businessName}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                 <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    tenant.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                 }`}>
                                    {tenant.status}
                                 </span>
                                 <span className="text-xs text-gray-500 font-mono">ID: {tenant.id}</span>
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-black/20 p-3 rounded-xl border border-white/5">
                           <div className="space-y-1">
                              <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Username</p>
                              <p className="text-sm font-bold text-gray-300 font-mono">{tenant.credentials?.username || 'N/A'}</p>
                           </div>
                           <div className="space-y-1 relative">
                              <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Password</p>
                              <div className="flex items-center gap-2">
                                 <p className="text-sm font-bold text-gray-300 font-mono min-w-[80px]">
                                    {revealedPasswords.has(tenant.id) ? tenant.credentials?.password : '••••••••'}
                                 </p>
                                 <button onClick={() => toggleRevealPassword(tenant.id)} className="text-gray-500 hover:text-white transition-colors">
                                    {revealedPasswords.has(tenant.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                 </button>
                              </div>
                           </div>
                           <div className="space-y-1 col-span-2 pt-2 border-t border-white/5">
                              <div className="flex justify-between items-center">
                                 <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">Master PIN</p>
                                 <p className="text-sm font-bold text-indigo-300 font-mono tracking-widest">{tenant.credentials?.adminPin || '0000'}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  ))
               )}
            </div>
            
            <div className="p-6 bg-black/20 border-t border-white/5">
               <div className="flex items-start gap-3 bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20">
                  <ShieldAlert className="w-5 h-5 text-yellow-500 shrink-0" />
                  <div>
                     <h5 className="text-sm font-bold text-yellow-500 uppercase">Security Warning</h5>
                     <p className="text-xs text-yellow-200/70 mt-1">
                        These credentials provide full access to tenant instances. Ensure they are shared securely. 
                        Use the "Access" button in the Tenants view to impersonate without needing these credentials manually.
                     </p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-indigo-600/10">
                <div><h3 className="text-2xl font-black tracking-tighter uppercase text-white flex items-center gap-3"><Users className="w-6 h-6 text-indigo-400" /> Add Customer</h3></div>
                <button onClick={() => setIsAddCustomerModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-gray-400"><X /></button>
             </div>
             <form onSubmit={handleAddCustomer} className="p-8 space-y-6">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Customer Name</label>
                   <input required value={newCustomer.name || ''} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Phone Number</label>
                   <input value={newCustomer.contact || ''} onChange={e => setNewCustomer({...newCustomer, contact: e.target.value})} className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Email Address</label>
                   <input type="email" value={newCustomer.email || ''} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold" />
                </div>
                <button className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black text-lg flex items-center justify-center gap-3">
                   <UserPlus className="w-6 h-6" /> Register Customer
                </button>
             </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-10 flex-1 w-full">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-800 pb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-600/20 rounded-2xl border border-indigo-500/50">
               <ShieldAlert className="w-10 h-10 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase">Abdomen Portal</h1>
              <p className="text-gray-500 font-bold text-sm tracking-widest italic">System Administration & Distribution</p>
            </div>
          </div>
          <div className="text-right">
             <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800 flex-wrap">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  System Controls
                </button>
                <button 
                  onClick={() => setActiveTab('identity')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'identity' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  <Contact className="w-3 h-3" /> Identity
                </button>
                <button 
                  onClick={() => setActiveTab('support')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'support' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  <LifeBuoy className="w-3 h-3" /> System Support
                </button>
                <button 
                  onClick={() => setActiveTab('currency')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'currency' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  <Coins className="w-3 h-3" /> Currency
                </button>
                <button 
                  onClick={() => setActiveTab('customers')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'customers' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  Customers
                </button>
             </div>
          </div>
        </header>

        {/* --- OVERVIEW TAB (System Controls) --- */}
        {activeTab === 'overview' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Action Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <button 
                onClick={() => setIsSecurityModalOpen(true)}
                className="p-8 bg-indigo-600 rounded-3xl text-left shadow-2xl shadow-indigo-900/40 hover:scale-[1.02] active:scale-95 transition-all group overflow-hidden relative"
              >
                <Key className="w-12 h-12 mb-4" />
                <h3 className="text-xl font-black mb-1 uppercase tracking-tighter">Penal Codes</h3>
                <p className="opacity-70 text-[11px] font-bold uppercase leading-tight">Credential Audit & Logs</p>
              </button>

              <button className="p-8 bg-gray-800 rounded-3xl text-left border border-gray-700 shadow-xl hover:bg-gray-750 transition-all group overflow-hidden relative">
                <RefreshCcw className="w-12 h-12 mb-4 text-indigo-400 group-hover:rotate-180 transition-transform duration-700" />
                <h3 className="text-xl font-black mb-1 uppercase tracking-tighter">Register Override</h3>
                <p className="opacity-70 text-[11px] font-bold uppercase leading-tight">Modify Closed Sales</p>
              </button>

              <button 
                onClick={() => setActiveTab('support')}
                className="p-8 bg-gray-800 rounded-3xl text-left border border-gray-700 shadow-xl hover:bg-gray-750 transition-all group overflow-hidden relative"
              >
                <LifeBuoy className="w-12 h-12 mb-4 text-orange-400" />
                <h3 className="text-xl font-black mb-1 uppercase tracking-tighter">Support Lines</h3>
                <p className="opacity-70 text-[11px] font-bold uppercase leading-tight">Set Help Numbers</p>
              </button>
            </div>
          </div>
        )}

        {/* --- SUPPORT TAB (NEW DEDICATED) --- */}
        {activeTab === 'support' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8 max-w-4xl mx-auto shadow-2xl">
                 <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-6">
                    <div>
                       <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                          <LifeBuoy className="w-6 h-6 text-indigo-500" /> System Support Configuration
                       </h2>
                       <p className="text-gray-500 text-sm mt-1">
                          Define the emergency contact details visible to all Tenants. <br/>
                          <span className="text-orange-400 font-bold">These fields are read-only for tenants.</span>
                       </p>
                    </div>
                 </div>

                 <form onSubmit={handleSaveConfig} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                             <Phone className="w-3 h-3 text-indigo-500" /> System Support Phone
                          </label>
                          <input 
                             type="text" 
                             value={tempConfig.owner_contact} 
                             onChange={e => setTempConfig({...tempConfig, owner_contact: e.target.value})} 
                             className="w-full px-5 py-4 bg-gray-950 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold" 
                             placeholder="e.g. +256 700 000000"
                          />
                          <p className="text-[10px] text-gray-500 pt-1">Displayed on the Login Screen and Receipt Footer.</p>
                       </div>

                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                             <Mail className="w-3 h-3 text-indigo-500" /> System Support Email
                          </label>
                          <input 
                             type="email" 
                             value={tempConfig.support_email || ''} 
                             onChange={e => setTempConfig({...tempConfig, support_email: e.target.value})} 
                             className="w-full px-5 py-4 bg-gray-950 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold" 
                             placeholder="e.g. support@akampapos.cloud"
                          />
                          <p className="text-[10px] text-gray-500 pt-1">Displayed on the Login Screen for help requests.</p>
                       </div>

                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                         <FileText className="w-3 h-3 text-indigo-500" /> Global Receipt Footer (Tail)
                      </label>
                      <textarea 
                         value={tempConfig.receipt.footerText} 
                         onChange={e => setTempConfig({
                             ...tempConfig, 
                             receipt: { ...tempConfig.receipt, footerText: e.target.value }
                         })} 
                         className="w-full px-5 py-4 bg-gray-950 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold min-h-[100px]" 
                         placeholder="e.g. Thank you for your business! Powered by Akampa POS."
                      />
                      <p className="text-[10px] text-gray-500 pt-1">This message appears at the bottom of every receipt. Tenants cannot change this.</p>
                    </div>

                    <div className="p-4 bg-indigo-900/20 border border-indigo-900/50 rounded-2xl flex items-center gap-3">
                        <Lock className="w-5 h-5 text-indigo-400" />
                        <div>
                            <h4 className="text-sm font-bold text-white uppercase">Security Enforcement</h4>
                            <p className="text-xs text-indigo-300">Tenants are physically restricted from editing these values in their settings panel.</p>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button type="submit" className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-3 shadow-lg shadow-indigo-900/50 transition-all hover:scale-105 active:scale-95">
                            <Save className="w-5 h-5" /> Update Global Settings
                        </button>
                    </div>
                 </form>
              </div>
           </div>
        )}

        {/* --- IDENTITY TAB --- */}
        {activeTab === 'identity' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8 max-w-4xl mx-auto shadow-2xl">
                 <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-6">
                    <div>
                       <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                          <Contact className="w-6 h-6 text-indigo-500" /> System Identity
                       </h2>
                       <p className="text-gray-500 text-sm mt-1">Manage global branding and system name.</p>
                    </div>
                 </div>

                 <form onSubmit={handleSaveConfig} className="space-y-8">
                    {/* Logo Section */}
                    <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-gray-950 rounded-2xl border border-gray-800">
                       <div className="w-32 h-32 rounded-full bg-white p-2 relative group shadow-lg border-4 border-indigo-900/50 overflow-hidden flex items-center justify-center shrink-0">
                          {tempConfig.logo ? (
                              <img src={tempConfig.logo} alt="Logo" className="w-full h-full object-contain rounded-full" />
                          ) : (
                              <div className="text-gray-400 font-bold text-xs">NO LOGO</div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer pointer-events-none rounded-full">
                             <Upload className="w-8 h-8 text-white" />
                          </div>
                          <input 
                             type="file" 
                             accept="image/*"
                             onChange={handleLogoUpload}
                             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                       </div>

                       <div className="w-full space-y-3">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                             <ImageIcon className="w-3 h-3" /> Master Logo Source
                          </label>
                          <div className="relative">
                             <input 
                                type="text" 
                                value={tempConfig.logo} 
                                onChange={e => setTempConfig({...tempConfig, logo: e.target.value})} 
                                className="w-full pl-4 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-white text-sm font-mono truncate" 
                                placeholder="https://..."
                             />
                             <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Upload className="w-5 h-5 text-gray-500" />
                             </div>
                          </div>
                          <p className="text-[10px] text-gray-500">
                             Changes to this logo will reflect on the login screen and sidebar.
                          </p>
                       </div>
                    </div>

                    {/* Contact Info Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">App / System Name</label>
                          <input 
                             type="text" 
                             value={tempConfig.name} 
                             onChange={e => setTempConfig({...tempConfig, name: e.target.value})} 
                             className="w-full px-5 py-4 bg-gray-950 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold" 
                          />
                       </div>
                       
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Master Override PIN</label>
                          <input 
                             type="text" 
                             value={tempConfig.master_pin} 
                             onChange={e => setTempConfig({...tempConfig, master_pin: e.target.value})} 
                             className="w-full px-5 py-4 bg-gray-950 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-mono font-bold tracking-widest text-center" 
                          />
                       </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button type="submit" className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-3 shadow-lg shadow-indigo-900/50 transition-all hover:scale-105 active:scale-95">
                            <Save className="w-5 h-5" /> Save Identity
                        </button>
                    </div>
                 </form>
              </div>
           </div>
        )}

        {/* --- CURRENCY TAB (New) --- */}
        {activeTab === 'currency' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8 max-w-4xl mx-auto shadow-2xl">
                 <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-6">
                    <div>
                       <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                          <Coins className="w-6 h-6 text-indigo-500" /> Currency & Locale
                       </h2>
                       <p className="text-gray-500 text-sm mt-1">Manage global currency settings and overrides.</p>
                    </div>
                 </div>

                 <form onSubmit={handleSaveConfig} className="space-y-8">
                    <div className="p-6 bg-indigo-900/20 rounded-2xl border border-indigo-900/50 flex flex-col md:flex-row gap-6 items-center">
                        <div className="p-4 bg-indigo-600 rounded-full shrink-0">
                            <Banknote className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1 space-y-2 text-center md:text-left">
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">System Base Currency</h3>
                            <p className="text-gray-400 text-xs leading-relaxed max-w-md">
                                This setting defines the default currency symbol used across the Master Portal and all tenants who do not have a custom override.
                            </p>
                        </div>
                        <div className="w-full md:w-auto">
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                <input 
                                    type="text" 
                                    value={tempConfig.currency} 
                                    onChange={e => setTempConfig({...tempConfig, currency: e.target.value})} 
                                    className="w-full md:w-32 px-8 py-4 bg-gray-950 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-black text-xl text-center uppercase" 
                                    placeholder="UGX"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6">
                            <h4 className="text-sm font-bold text-white uppercase mb-4 flex items-center gap-2">
                                <ArrowRightLeft className="w-4 h-4 text-gray-500" /> Override Policy
                            </h4>
                            <div className="flex items-center justify-between bg-gray-900 p-4 rounded-xl border border-gray-800">
                                <div>
                                    <p className="text-sm font-bold text-white">Force Global Currency</p>
                                    <p className="text-[10px] text-gray-500 mt-1">Apply this currency to ALL tenants immediately.</p>
                                </div>
                                <button type="button" className="w-12 h-6 bg-indigo-600 rounded-full relative">
                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                </button>
                            </div>
                        </div>

                        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 opacity-50 pointer-events-none">
                            <h4 className="text-sm font-bold text-white uppercase mb-4 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-gray-500" /> Multi-Currency Support
                            </h4>
                            <p className="text-xs text-gray-500 mb-4">Allow tenants to toggle between multiple currencies at checkout.</p>
                            <span className="text-[10px] font-black bg-gray-800 text-gray-400 px-3 py-1 rounded uppercase tracking-widest">Coming Soon</span>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button type="submit" className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-3 shadow-lg shadow-indigo-900/50 transition-all hover:scale-105 active:scale-95">
                            <Save className="w-5 h-5" /> Update Currency
                        </button>
                    </div>
                 </form>
              </div>
           </div>
        )}

        {/* --- CUSTOMERS TAB --- */}
        {activeTab === 'customers' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8">
                 <div className="flex justify-between items-center mb-8">
                    <div>
                       <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                          <Users className="w-6 h-6 text-indigo-500" /> Customer CRM
                       </h2>
                       <p className="text-gray-500 text-sm mt-1">Loyalty program and contact directory</p>
                    </div>
                    <button onClick={() => setIsAddCustomerModalOpen(true)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-lg shadow-indigo-900/20">
                       <Plus className="w-4 h-4" /> Add Customer
                    </button>
                 </div>

                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-2">
                       <thead>
                          <tr className="text-gray-500 text-xs font-black uppercase tracking-widest">
                             <th className="pb-4 pl-4">Customer Name</th>
                             <th className="pb-4">Contact Info</th>
                             <th className="pb-4">Loyalty Status</th>
                             <th className="pb-4 text-right pr-4">Actions</th>
                          </tr>
                       </thead>
                       <tbody>
                          {customerList.map(customer => (
                             <tr key={customer.id} className="bg-gray-950 hover:bg-gray-800/50 transition-colors">
                                <td className="py-4 pl-4 rounded-l-2xl border-l border-y border-gray-800">
                                   <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 font-bold">
                                         {customer.name.charAt(0)}
                                      </div>
                                      <div>
                                         <p className="font-bold text-white">{customer.name}</p>
                                         <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">ID: {customer.id}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="py-4 border-y border-gray-800">
                                   <div className="space-y-1">
                                      <div className="flex items-center gap-2 text-sm text-gray-300"><Phone className="w-3 h-3 text-gray-500" /> {customer.contact}</div>
                                      {customer.email && <div className="flex items-center gap-2 text-sm text-gray-300"><Mail className="w-3 h-3 text-gray-500" /> {customer.email}</div>}
                                   </div>
                                </td>
                                <td className="py-4 border-y border-gray-800">
                                   <div className="flex items-center gap-3">
                                      <div className="text-center">
                                         <span className="block text-xl font-black text-yellow-500">{customer.loyaltyPoints}</span>
                                         <span className="text-[9px] font-bold text-gray-500 uppercase">Points</span>
                                      </div>
                                      {customer.loyaltyPoints > 1000 && <BadgeCheck className="w-5 h-5 text-blue-500" />}
                                   </div>
                                </td>
                                <td className="py-4 pr-4 rounded-r-2xl border-r border-y border-gray-800 text-right">
                                   <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}

      </div>

      {/* --- TAIL / FOOTER: DANGER ZONE --- */}
      <div className="mt-auto pt-10 pb-4 w-full max-w-7xl mx-auto">
         <div className="p-6 bg-red-900/10 border border-red-900/30 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/50">
                  <AlertOctagon className="w-8 h-8 text-white" />
               </div>
               <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Danger Zone</h3>
                  <p className="text-red-400 font-medium text-sm">Emergency System Controls</p>
               </div>
            </div>
            
            <button 
                onClick={onKillSwitch}
                className="w-full md:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-3 shadow-xl shadow-red-900/40 transition-all hover:scale-105"
            >
               <Power className="w-5 h-5" /> Activate Kill-Switch
            </button>
         </div>
      </div>

    </div>
  );
};

export default MasterPortalView;
