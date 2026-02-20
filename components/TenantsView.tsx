import React, { useState, useRef, useMemo } from 'react';
import { 
  Globe, Plus, X, Activity, Power, Eye, Trash2, Server, Lock, AlertTriangle, Edit,
  Search, LogIn, Archive, UserCheck, Calendar, Clock, CreditCard, RefreshCw, ChevronRight,
  ImageIcon, Upload
} from 'lucide-react';
import { BusinessPage, SubscriptionTier, AppView, Product, Table, StoreItem } from '../types';
import { PRODUCTS_DATA, TABLES_DATA, STORE_ITEMS_DATA } from '../mockData';

interface TenantsViewProps {
  businessPages: BusinessPage[];
  setBusinessPages: (pages: BusinessPage[]) => void;
  onPreviewPage: (page: BusinessPage) => void;
  onImpersonate: (page: BusinessPage, targetView?: AppView) => void;
}

const TenantsView: React.FC<TenantsViewProps> = ({ businessPages, setBusinessPages, onPreviewPage, onImpersonate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [renewTenant, setRenewTenant] = useState<BusinessPage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newBiz, setNewBiz] = useState({ 
    name: '', owner: '', slug: '', contact: '', 
    tier: 'BASIC' as SubscriptionTier,
    username: '', password: '', adminPin: '',
    logo: ''
  });

  const openCreateModal = () => {
    setNewBiz({ name: '', owner: '', slug: '', contact: '', tier: 'BASIC', username: '', password: '', adminPin: '', logo: '' });
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
      adminPin: tenant.credentials?.adminPin || '',
      logo: tenant.settings?.logo || ''
    });
    setEditId(tenant.id);
    setIsModalOpen(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewBiz(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const provisionTenantData = (tenantId: string) => {
      try {
          localStorage.setItem(`${tenantId}_products`, JSON.stringify(PRODUCTS_DATA));
          localStorage.setItem(`${tenantId}_tables`, JSON.stringify(TABLES_DATA));
          localStorage.setItem(`${tenantId}_storeItems`, JSON.stringify(STORE_ITEMS_DATA));
      } catch (e) {
          console.error(`[Provisioning] Failed to seed data for ${tenantId}`, e);
      }
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
          settings: {
              ...page.settings,
              logo: newBiz.logo
          },
          credentials: {
            username: newBiz.username,
            password: newBiz.password,
            adminPin: newBiz.adminPin
          }
        } : page
      ));
    } else {
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 1);
      const newId = Math.random().toString(36).substr(2, 9).toUpperCase();

      const page: BusinessPage = {
        id: newId,
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
        settings: {
            logo: newBiz.logo
        },
        credentials: {
            username: newBiz.username,
            password: newBiz.password,
            adminPin: newBiz.adminPin || '0000'
        }
      };

      provisionTenantData(newId);
      setBusinessPages([page, ...businessPages]);
    }
    
    setIsModalOpen(false);
    setNewBiz({ name: '', owner: '', slug: '', contact: '', tier: 'BASIC', username: '', password: '', adminPin: '', logo: '' });
    setEditId(null);
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
    <div className="p-8 h-full overflow-y-auto bg-[#020617] text-white">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
         
         <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <Server className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter">Business Sandbox</h2>
                <p className="text-slate-400 font-medium text-xs uppercase tracking-[0.2em] mt-1">Tenant Registry Management</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                <div className="relative flex-1 sm:min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search Registry..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white font-bold text-sm placeholder:text-slate-600 transition-all shadow-inner"
                    />
                </div>
                <button 
                  onClick={openCreateModal}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest transition-all shadow-2xl shadow-blue-900/40 shrink-0 active:scale-95"
                >
                  <Plus className="w-5 h-5" /> Provision New
                </button>
            </div>
         </div>

         <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden backdrop-blur-xl">
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/10">
                        <th className="px-8 py-6">Business Identity</th>
                        <th className="px-8 py-6">Access Matrix</th>
                        <th className="px-8 py-6">Status Log</th>
                        <th className="px-8 py-6 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {filteredTenants.length === 0 ? (
                        <tr><td colSpan={4} className="p-20 text-center text-slate-500 font-black uppercase tracking-widest opacity-40">No distributed instances found</td></tr>
                     ) : (
                        filteredTenants.map(tenant => {
                           const isArchived = tenant.status === 'ARCHIVED';
                           const isExpired = new Date() > new Date(tenant.subscriptionExpiry);

                           return (
                           <tr key={tenant.id} className={`transition-all ${isArchived ? 'opacity-50 grayscale bg-white/5' : 'hover:bg-white/[0.07]'}`}>
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center font-bold text-blue-300 shadow-xl border border-white/10 overflow-hidden ring-2 ring-blue-500/10 shrink-0">
                                       {tenant.settings?.logo ? (
                                           <img src={tenant.settings.logo} className="w-full h-full object-cover" alt="Logo" />
                                       ) : (
                                           <span className="text-xl text-blue-600">{tenant.businessName.charAt(0)}</span>
                                       )}
                                    </div>
                                    <div>
                                       <div className="font-black text-white text-base uppercase tracking-tight">{tenant.businessName}</div>
                                       <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1">{tenant.tier} Cluster</div>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">ID: {tenant.credentials?.username || 'N/A'}</span>
                                    </div>
                                    <div className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">MASTER PIN: {tenant.credentials?.adminPin || '0000'}</div>
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    isExpired ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                    tenant.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                 }`}>
                                    <Activity className="w-3.5 h-3.5" />
                                    {isExpired ? 'EXPIRED' : tenant.status}
                                 </span>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="flex items-center justify-end gap-3">
                                    <button 
                                       onClick={() => onImpersonate(tenant, AppView.DASHBOARD)}
                                       className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-900/20 active:scale-95"
                                    >
                                       <LogIn className="w-4 h-4" /> Access
                                    </button>
                                    <button onClick={() => openEditModal(tenant)} className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/10 transition-all"><Edit className="w-4 h-4" /></button>
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-[3rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-blue-600/5">
              <div>
                  <h3 className="text-2xl font-black tracking-tighter uppercase text-white flex items-center gap-4">
                      <Globe className="w-7 h-7 text-blue-500" /> {editId ? 'Modify Sandbox' : 'Provision Instance'}
                  </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-full text-slate-500 transition-colors"><X className="w-6 h-6"/></button>
            </div>
            <form onSubmit={handleSaveBiz} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              
              <div className="flex flex-col items-center gap-6 p-8 bg-white/5 rounded-3xl border border-white/5">
                  <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center overflow-hidden shrink-0 border-4 border-blue-500/20 shadow-2xl relative group">
                      {newBiz.logo ? (
                          <img src={newBiz.logo} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                          <ImageIcon className="w-10 h-10 text-slate-700" />
                      )}
                      <input type="file" ref={fileInputRef} className="absolute inset-0 opacity-0 cursor-pointer z-20" accept="image/*" onChange={handleLogoUpload} />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
                          <Upload className="w-6 h-6 text-white" />
                      </div>
                  </div>
                  <div className="text-center">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Business Identity Graphic</p>
                      <p className="text-[9px] text-slate-500">Logo will be force-rounded to eliminate white margins.</p>
                  </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Official Name</label>
                <input required value={newBiz.name} onChange={e => setNewBiz({...newBiz, name: e.target.value})} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white font-bold text-lg" placeholder="e.g. KAMPALA GRILL" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Owner</label>
                    <input required value={newBiz.owner} onChange={e => setNewBiz({...newBiz, owner: e.target.value})} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-white font-bold" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Subscription Tier</label>
                    <select value={newBiz.tier} onChange={e => setNewBiz({...newBiz, tier: e.target.value as SubscriptionTier})} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black appearance-none outline-none cursor-pointer">
                        <option value="BASIC">BASIC</option>
                        <option value="PRO">PRO</option>
                        <option value="ENTERPRISE">ENTERPRISE</option>
                    </select>
                 </div>
              </div>
              
              <div className="p-6 bg-blue-500/5 rounded-[2rem] border border-blue-500/10 space-y-6">
                 <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-3">
                     <Lock className="w-4 h-4" /> Hardened Access Credentials
                 </h4>
                 <div className="grid grid-cols-2 gap-4">
                    <input required value={newBiz.username} onChange={e => setNewBiz({...newBiz, username: e.target.value})} className="w-full px-5 py-4 bg-slate-900 border border-white/5 rounded-2xl text-white font-mono text-sm placeholder:text-slate-700" placeholder="LOGIN ID" />
                    <input required value={newBiz.password} onChange={e => setNewBiz({...newBiz, password: e.target.value})} className="w-full px-5 py-4 bg-slate-900 border border-white/5 rounded-2xl text-white font-mono text-sm placeholder:text-slate-700" placeholder="PASS KEY" />
                    <input required maxLength={4} value={newBiz.adminPin} onChange={e => setNewBiz({...newBiz, adminPin: e.target.value})} className="w-full px-5 py-4 bg-slate-900 border border-white/5 rounded-2xl text-white font-mono text-base tracking-[1em] text-center col-span-2" placeholder="ADMIN PIN" />
                 </div>
              </div>

              <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-blue-900/40 transition-all active:scale-95">
                {editId ? 'Commit Deployment' : 'Deploy Environment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantsView;