
import React, { useState, useMemo } from 'react';
import { 
  Globe, Plus, X, Activity, Power, Eye, Trash2, Server, Lock, AlertTriangle, Edit,
  Search, LogIn, Archive, UserCheck, Calendar, Clock, CreditCard, RefreshCw
} from 'lucide-react';
import { BusinessPage, SubscriptionTier, AppView } from '../types';

interface TenantsViewProps {
  businessPages: BusinessPage[];
  setBusinessPages: (pages: BusinessPage[]) => void;
  onPreviewPage: (page: BusinessPage) => void;
  onImpersonate: (page: BusinessPage, targetView?: AppView) => void;
  onSeedTenantData?: (tenantId: string) => void;
}

const TenantsView: React.FC<TenantsViewProps> = ({ businessPages, setBusinessPages, onPreviewPage, onImpersonate, onSeedTenantData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [renewTenant, setRenewTenant] = useState<BusinessPage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [newBiz, setNewBiz] = useState({ 
    name: '', owner: '', slug: '', contact: '', 
    tier: 'BASIC' as SubscriptionTier,
    username: '', password: '', adminPin: ''
  });

  const openCreateModal = () => {
    setNewBiz({ name: '', owner: '', slug: '', contact: '', tier: 'BASIC', username: '', password: '', adminPin: '' });
    setEditId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (tenant: BusinessPage) => {
    setNewBiz({
      name: tenant.businessName,
      owner: tenant.ownerName,
      slug: tenant.slug,
      contact: tenant.contact,
      tier: tenant.tier,
      username: tenant.credentials?.username || '',
      password: tenant.credentials?.password || '',
      adminPin: tenant.credentials?.adminPin || ''
    });
    setEditId(tenant.id);
    setIsModalOpen(true);
  };

  const handleSaveBiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBiz.username || !newBiz.password) {
        alert("Please assign a Login ID and Password for the client.");
        return;
    }

    if (editId) {
      setBusinessPages(businessPages.map(page => 
        page.id === editId ? {
          ...page,
          businessName: newBiz.name,
          ownerName: newBiz.owner,
          contact: newBiz.contact,
          slug: newBiz.slug || newBiz.name.toLowerCase().replace(/\s+/g, '-'),
          tier: newBiz.tier,
          credentials: {
            username: newBiz.username,
            password: newBiz.password,
            adminPin: newBiz.adminPin
          }
        } : page
      ));
    } else {
      // Default expiry 1 month from now for new tenants
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 1);

      const page: BusinessPage = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        businessName: newBiz.name,
        ownerName: newBiz.owner,
        contact: newBiz.contact,
        slug: newBiz.slug || newBiz.name.toLowerCase().replace(/\s+/g, '-'),
        status: 'ACTIVE',
        tier: newBiz.tier,
        createdAt: new Date(),
        lastPaymentDate: new Date(),
        subscriptionExpiry: expiry,
        isActive: true,
        credentials: {
            username: newBiz.username,
            password: newBiz.password,
            adminPin: newBiz.adminPin || '0000'
        }
      };
      setBusinessPages([page, ...businessPages]);
      if (onSeedTenantData) onSeedTenantData(page.id);
    }
    
    setIsModalOpen(false);
    setNewBiz({ name: '', owner: '', slug: '', contact: '', tier: 'BASIC', username: '', password: '', adminPin: '' });
    setEditId(null);
  };

  const handleRenew = (months: number) => {
      if (!renewTenant) return;
      
      const currentExpiry = new Date(renewTenant.subscriptionExpiry);
      const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
      
      const newExpiry = new Date(baseDate);
      newExpiry.setMonth(newExpiry.getMonth() + months);

      setBusinessPages(businessPages.map(p => 
          p.id === renewTenant.id 
          ? { ...p, subscriptionExpiry: newExpiry, lastPaymentDate: new Date(), status: 'ACTIVE', isActive: true } 
          : p
      ));
      
      setIsRenewModalOpen(false);
      setRenewTenant(null);
      alert(`${renewTenant.businessName} activated until ${newExpiry.toLocaleDateString()}`);
  };

  const toggleTenantStatus = (id: string) => {
    setBusinessPages(businessPages.map(p => {
      if (p.id === id) {
        const newStatus = p.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        return { ...p, status: newStatus, isActive: newStatus === 'ACTIVE' };
      }
      return p;
    }));
  };

  const updateTenantTier = (id: string, newTier: SubscriptionTier) => {
    if(confirm(`Change Subscription Tier to ${newTier}?`)) {
      setBusinessPages(businessPages.map(p => p.id === id ? { ...p, tier: newTier } : p));
    }
  };

  const archivePage = (id: string, name: string) => {
    const confirmation = prompt(`⚠️ ARCHIVE TENANT ⚠️\n\nTo archive "${name}", please type "ARCHIVE" below.`);
    if (confirmation === "ARCHIVE") {
      setBusinessPages(businessPages.map(p => p.id === id ? { ...p, status: 'ARCHIVED', isActive: false } : p));
    }
  };

  const filteredTenants = businessPages.filter(tenant => {
    const search = searchTerm.toLowerCase();
    return (
      tenant.businessName.toLowerCase().includes(search) ||
      tenant.ownerName.toLowerCase().includes(search) ||
      tenant.id.toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#111827] text-white">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         
         <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Server className="w-8 h-8 text-indigo-400" />
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter">Tenant Management</h2>
                <p className="text-gray-400 font-medium text-xs uppercase tracking-widest mt-1">Activation & Subscription Control</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                <div className="relative flex-1 sm:min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                        type="text" 
                        placeholder="Search tenants..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold text-sm placeholder:text-gray-600 transition-all shadow-inner"
                    />
                </div>
                <button 
                  onClick={openCreateModal}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-2xl flex items-center justify-center gap-2 font-black text-sm uppercase transition-all shadow-lg shadow-indigo-900/40 shrink-0"
                >
                  <Plus className="w-5 h-5" /> Provision Tenant
                </button>
            </div>
         </div>

         <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-gray-950 text-gray-500 text-[10px] font-black uppercase tracking-widest border-b border-gray-800">
                        <th className="px-6 py-4">Business Info</th>
                        <th className="px-6 py-4">Credentials & PIN</th>
                        <th className="px-6 py-4">Expiry Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                     {filteredTenants.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">{searchTerm ? `No tenants found matching "${searchTerm}"` : 'No active tenants distributed.'}</td></tr>
                     ) : (
                        filteredTenants.map(tenant => {
                           const isArchived = tenant.status === 'ARCHIVED';
                           const isExpired = new Date() > new Date(tenant.subscriptionExpiry);
                           const expiryColor = isExpired ? 'text-red-500' : 'text-emerald-400';

                           return (
                           <tr key={tenant.id} className={`transition-colors ${isArchived ? 'opacity-50 grayscale bg-gray-900/50' : 'hover:bg-gray-800/50'}`}>
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-900 rounded-xl flex items-center justify-center font-bold text-indigo-300">
                                       {tenant.businessName.charAt(0)}
                                    </div>
                                    <div>
                                       <div className="font-bold text-white text-sm">{tenant.businessName}</div>
                                       <div className="text-[10px] font-mono text-gray-500">{tenant.tier} Plan</div>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                        <span className="font-mono text-indigo-300 bg-indigo-900/30 px-1 rounded">{tenant.credentials?.username || 'N/A'}</span>
                                        <span className="font-mono text-gray-300 bg-gray-800 px-1 rounded">{tenant.credentials?.password || '***'}</span>
                                    </div>
                                    <div className="text-[10px] font-mono text-emerald-500/70">PIN: {tenant.credentials?.adminPin || '0000'}</div>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className={`flex items-center gap-2 font-mono text-xs font-bold ${expiryColor}`}>
                                    <Calendar className="w-3 h-3" />
                                    {new Date(tenant.subscriptionExpiry).toLocaleDateString()}
                                 </div>
                                 {isExpired && <span className="text-[9px] font-black uppercase text-red-400 block mt-0.5">Access Suspended</span>}
                              </td>
                              <td className="px-6 py-4">
                                 <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    isExpired ? 'bg-red-900/30 text-red-400 border border-red-900' :
                                    tenant.status === 'ACTIVE' ? 'bg-green-900/30 text-green-400 border border-green-900' :
                                    tenant.status === 'ARCHIVED' ? 'bg-gray-800 text-gray-500 border border-gray-700' :
                                    'bg-orange-900/30 text-orange-400 border border-orange-900'
                                 }`}>
                                    <Activity className="w-3 h-3" />
                                    {isExpired ? 'EXPIRED' : tenant.status}
                                 </span>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-2">
                                    <button 
                                       onClick={() => { setRenewTenant(tenant); setIsRenewModalOpen(true); }}
                                       className="px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors font-bold text-xs uppercase flex items-center gap-2"
                                       title="Renew Subscription"
                                    >
                                       <RefreshCw className="w-3.5 h-3.5" /> Renew
                                    </button>
                                    
                                    <div className="w-px h-6 bg-gray-700 mx-1"></div>
                                    
                                    <button 
                                       onClick={() => onImpersonate(tenant, AppView.DASHBOARD)}
                                       disabled={isArchived}
                                       className="px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors font-bold text-xs uppercase flex items-center gap-2 disabled:opacity-50"
                                       title="Access Dashboard"
                                    >
                                       <LogIn className="w-3.5 h-3.5" /> Login
                                    </button>
                                    
                                    <button onClick={() => openEditModal(tenant)} className="p-2 text-blue-400 hover:text-white"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => archivePage(tenant.id, tenant.businessName)} className="p-2 text-gray-500 hover:text-orange-400"><Archive className="w-4 h-4" /></button>
                                 </div>
                              </td>
                           </tr>
                        )})
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      {/* RENEW MODAL */}
      {isRenewModalOpen && renewTenant && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-4">
              <div className="bg-gray-900 border border-emerald-500/30 rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
                  <div className="p-8 bg-emerald-600 text-white text-center">
                      <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin-slow" />
                      <h3 className="text-2xl font-black uppercase tracking-tight">Activate System Access</h3>
                      <p className="text-emerald-100 text-sm mt-1">{renewTenant.businessName}</p>
                  </div>
                  <div className="p-8 space-y-6">
                      <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 text-center">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Current Expiry</p>
                          <p className="font-mono text-xl font-bold text-emerald-400">{new Date(renewTenant.subscriptionExpiry).toLocaleDateString()}</p>
                      </div>

                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block text-center">Select Activation Period</label>
                          <div className="grid grid-cols-1 gap-3">
                              <button onClick={() => handleRenew(1)} className="p-4 bg-gray-800 border border-gray-700 rounded-2xl flex justify-between items-center hover:border-emerald-500 hover:bg-emerald-900/10 transition-all group">
                                  <div className="text-left">
                                      <p className="font-bold text-white uppercase text-sm">One Month</p>
                                      <p className="text-[10px] text-gray-500">Standard cycle</p>
                                  </div>
                                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-emerald-500" />
                              </button>
                              <button onClick={() => handleRenew(6)} className="p-4 bg-gray-800 border border-gray-700 rounded-2xl flex justify-between items-center hover:border-emerald-500 hover:bg-emerald-900/10 transition-all group">
                                  <div className="text-left">
                                      <p className="font-bold text-white uppercase text-sm">Six Months</p>
                                      <p className="text-[10px] text-emerald-500 font-black uppercase">Popular Choice</p>
                                  </div>
                                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-emerald-500" />
                              </button>
                              <button onClick={() => handleRenew(12)} className="p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-2xl flex justify-between items-center hover:border-indigo-500 hover:bg-indigo-900/30 transition-all group">
                                  <div className="text-left">
                                      <p className="font-black text-indigo-400 uppercase text-sm">One Year</p>
                                      <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Enterprise Priority</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <span className="text-[9px] bg-indigo-500 text-white font-black px-2 py-0.5 rounded uppercase">-20% Off</span>
                                      <ChevronRight className="w-5 h-5 text-indigo-500" />
                                  </div>
                              </button>
                          </div>
                      </div>

                      <button onClick={() => setIsRenewModalOpen(false)} className="w-full py-4 text-gray-500 font-bold uppercase text-xs hover:text-white transition-colors">Cancel</button>
                  </div>
              </div>
          </div>
      )}

      {/* PROVISION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-indigo-600/10">
              <div><h3 className="text-2xl font-black tracking-tighter uppercase text-white flex items-center gap-3"><Globe className="w-6 h-6 text-indigo-400" /> {editId ? 'Edit Tenant' : 'New Tenant'}</h3></div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-gray-400"><X /></button>
            </div>
            <form onSubmit={handleSaveBiz} className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Business Name</label>
                <input required value={newBiz.name} onChange={e => setNewBiz({...newBiz, name: e.target.value})} className="w-full px-5 py-3 bg-gray-800 border border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Owner</label>
                    <input required value={newBiz.owner} onChange={e => setNewBiz({...newBiz, owner: e.target.value})} className="w-full px-5 py-3 bg-gray-800 border border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tier</label>
                    <select value={newBiz.tier} onChange={e => setNewBiz({...newBiz, tier: e.target.value as SubscriptionTier})} className="w-full px-5 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-white font-bold appearance-none outline-none">
                        <option value="BASIC">Basic</option>
                        <option value="PRO">Pro</option>
                        <option value="ENTERPRISE">Enterprise</option>
                    </select>
                 </div>
              </div>
              
              <div className="p-4 bg-gray-800/50 rounded-2xl border border-gray-700 space-y-4">
                 <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Lock className="w-3 h-3" /> Client Credentials</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <input required value={newBiz.username} onChange={e => setNewBiz({...newBiz, username: e.target.value})} className="w-full px-5 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white font-mono text-sm" placeholder="Username" />
                    <input required value={newBiz.password} onChange={e => setNewBiz({...newBiz, password: e.target.value})} className="w-full px-5 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white font-mono text-sm" placeholder="Password" />
                    <input required maxLength={4} value={newBiz.adminPin} onChange={e => setNewBiz({...newBiz, adminPin: e.target.value})} className="w-full px-5 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white font-mono text-sm tracking-widest text-center col-span-2" placeholder="Master PIN (4 Digits)" />
                 </div>
              </div>

              <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/50 transition-all">
                {editId ? 'Update Tenant' : 'Activate Tenant'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Internal Helper for Icons
const ChevronRight = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);

export default TenantsView;
