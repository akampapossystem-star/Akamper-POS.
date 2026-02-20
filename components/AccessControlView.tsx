
import React, { useState } from 'react';
import { 
  Shield, Check, X, Lock, Eye, EyeOff, AlertTriangle, 
  Gavel, FileKey, Users, LayoutDashboard, ShoppingCart, Search,
  CheckCircle2, Info, ArrowRightLeft, ShieldAlert
} from 'lucide-react';
import { AppView, UserRole, RolePermissions, PermissionAction } from '../types';

interface AccessControlViewProps {
  permissions: Record<string, RolePermissions>;
  onUpdatePermissions: (role: UserRole, type: 'view' | 'action', key: string, value: boolean) => void;
}

const ROLES: UserRole[] = ['MANAGER', 'CASHIER', 'WAITER', 'CHEF', 'BARMAN', 'BARISTA', 'STORE_KEEPER', 'HEAD_BAKER'];

const VIEW_CONFIG: { id: AppView; label: string; category: string }[] = [
  { id: AppView.DASHBOARD, label: 'Dashboard Overview', category: 'General' },
  { id: AppView.WAITER_PORTAL, label: 'Restaurant Menu (Ordering)', category: 'Operations' },
  { id: AppView.ORDERS, label: 'Order Log', category: 'Operations' },
  { id: AppView.KITCHEN, label: 'Kitchen Display', category: 'Production' },
  { id: AppView.KITCHEN_INVENTORY, label: 'Kitchen Stock & Recipes', category: 'Production' },
  { id: AppView.BAKERY_INVENTORY, label: 'Bakery Inventory', category: 'Production' },
  { id: AppView.SPIRITS, label: 'Spirits Inventory', category: 'Bar' },
  { id: AppView.BAR_TABS, label: 'Bar Table Map', category: 'Bar' },
  { id: AppView.BAR_MENU, label: 'Bar Menu Pricing', category: 'Bar' },
  { id: AppView.REQUISITION, label: 'Internal Stock Requests', category: 'Inventory' },
  { id: AppView.STORE_KEEPER, label: 'Store Keeper Portal', category: 'Inventory' },
  { id: AppView.INVENTORY, label: 'Product Inventory', category: 'Inventory' },
  { id: AppView.REPORTS, label: 'Financial Analytics', category: 'Admin' },
  { id: AppView.EXPENSES, label: 'Expense Tracker', category: 'Admin' },
  { id: AppView.CRM, label: 'Customer Loyalty & CRM', category: 'Admin' },
  { id: AppView.HRM, label: 'Staff Records & HR', category: 'Admin' },
  { id: AppView.DAY_SHIFTS, label: 'Shift Logs', category: 'Admin' },
  { id: AppView.TABLES, label: 'Table Layout Editor', category: 'Admin' },
  { id: AppView.ACCESS_CONTROL, label: 'Laws & Restrictions', category: 'Admin' },
];

const ACTION_CONFIG: { id: PermissionAction; label: string; desc: string }[] = [
  { id: 'DELETE_ORDER', label: 'Delete Whole Orders', desc: 'Authorized to permanently cancel paid or pending orders.' },
  { id: 'VOID_ITEM', label: 'Void Specific Items', desc: 'Can remove single items from an active table bill.' },
  { id: 'PROCESS_REFUND', label: 'Authorize Refunds', desc: 'Can process cash/digital returns to customers.' },
  { id: 'VIEW_COST_PRICE', label: 'View Cost Prices', desc: 'Visibility of item purchase costs in inventory.' },
  { id: 'MANAGE_STOCK', label: 'Manual Stock Adjust', desc: 'Ability to manually override stock counts.' },
  { id: 'EDIT_MENU', label: 'Edit Menu/Pricing', desc: 'Change prices, product names, or add new items.' },
  { id: 'VIEW_ANALYTICS', label: 'View Sensitive Stats', desc: 'Access to revenue totals and profit calculations.' },
  { id: 'CLOSE_REGISTER', label: 'Close Cash Shift', desc: 'Permission to end a day shift and generate reports.' },
];

const AccessControlView: React.FC<AccessControlViewProps> = ({ permissions, onUpdatePermissions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeAuditorRole, setActiveAuditorRole] = useState<UserRole>(null);

  const filteredViews = VIEW_CONFIG.filter(v => v.label.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredActions = ACTION_CONFIG.filter(a => a.label.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#f8fafc] font-sans">
      
      {/* Header */}
      <div className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Gavel className="w-10 h-10 text-indigo-600" /> System Laws & Restrictions
          </h1>
          <p className="text-slate-500 font-medium mt-1">Configure role-based access and operational boundaries for your staff.</p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search permissions..."
                    className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                />
            </div>
            <div className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-slate-700 text-xs font-black uppercase tracking-wider shadow-sm">
                <Shield className="w-4 h-4 text-indigo-600" /> Authoritative Mode
            </div>
        </div>
      </div>

      {/* --- MODULE ACCESS MATRIX --- */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden mb-10">
         <div className="p-8 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
                   <LayoutDashboard className="w-6 h-6 text-indigo-400" /> View Visibility Matrix
                </h2>
                <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">Control which tabs each staff role can access.</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
                <Info className="w-3.5 h-3.5" /> Toggle switches below to apply laws instantly.
            </div>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                     <th className="p-6 w-80 border-r border-slate-100">System Module / Screen</th>
                     {ROLES.map(role => (
                        <th key={role} className="p-6 text-center min-w-[110px] border-r border-slate-100 last:border-0 bg-slate-50/30">
                           {role?.replace('_', ' ')}
                        </th>
                     ))}
                  </tr>
               </thead>
               <tbody className="text-sm font-bold text-slate-700">
                  {filteredViews.map((view, vIdx) => (
                     <tr key={view.id} className={`${vIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'} border-b border-slate-100 hover:bg-indigo-50 transition-colors group`}>
                        <td className="p-6 border-r border-slate-100">
                           <div className="flex items-center gap-3">
                               <div className="w-2 h-2 rounded-full bg-indigo-200 group-hover:bg-indigo-500 transition-colors"></div>
                               <div>
                                   <div className="text-slate-800">{view.label}</div>
                                   <div className="text-[9px] text-slate-400 uppercase tracking-widest font-black">{view.category}</div>
                               </div>
                           </div>
                        </td>
                        {ROLES.map(role => {
                           const canSee = permissions[role as string]?.allowedViews.includes(view.id);
                           return (
                              <td key={role} className="p-6 text-center border-r border-slate-100 last:border-0">
                                 <button 
                                    onClick={() => onUpdatePermissions(role, 'view', view.id, !canSee)}
                                    className={`relative w-12 h-6 rounded-full p-1 transition-all duration-300 ease-in-out shadow-inner ${
                                       canSee ? 'bg-emerald-500' : 'bg-slate-300'
                                    }`}
                                 >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                                       canSee ? 'translate-x-6' : 'translate-x-0'
                                    }`}></div>
                                 </button>
                              </td>
                           );
                        })}
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* --- ACTION LIMIT Matrix --- */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden mb-10">
         <div className="p-8 bg-indigo-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
                   <AlertTriangle className="w-6 h-6 text-orange-400" /> Operational Action Restrictions
                </h2>
                <p className="text-xs text-indigo-200 mt-1 uppercase font-bold tracking-wider">Define strict limits on deletions, adjustments and pricing.</p>
            </div>
            <ShieldAlert className="w-8 h-8 text-white/20 hidden md:block" />
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-indigo-50/50 border-b border-slate-200 text-[10px] font-black uppercase tracking-[0.15em] text-indigo-900/60">
                     <th className="p-6 w-80 border-r border-slate-100">Restricted Critical Action</th>
                     {ROLES.map(role => (
                        <th key={role} className="p-6 text-center min-w-[110px] border-r border-slate-100 last:border-0 bg-indigo-50/20">
                           {role?.replace('_', ' ')}
                        </th>
                     ))}
                  </tr>
               </thead>
               <tbody className="text-sm font-bold text-slate-700">
                  {filteredActions.map((action, aIdx) => (
                     <tr key={action.id} className={`${aIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'} border-b border-slate-100 hover:bg-orange-50 transition-colors group`}>
                        <td className="p-6 border-r border-slate-100">
                           <div className="font-black text-slate-800">{action.label}</div>
                           <div className="text-[10px] text-slate-400 font-medium font-sans mt-1 leading-relaxed">{action.desc}</div>
                        </td>
                        {ROLES.map(role => {
                           const canDo = permissions[role as string]?.allowedActions.includes(action.id);
                           return (
                              <td key={role} className="p-6 text-center border-r border-slate-100 last:border-0">
                                 <button 
                                    onClick={() => onUpdatePermissions(role, 'action', action.id, !canDo)}
                                    className={`relative inline-flex items-center justify-center p-3 rounded-xl transition-all group/btn ${
                                       canDo 
                                          ? 'bg-red-50 text-red-600 hover:bg-red-500 hover:text-white shadow-sm ring-1 ring-red-200' 
                                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white shadow-sm ring-1 ring-emerald-200'
                                    }`}
                                    title={canDo ? "Restricted: Click to prohibit" : "Open: Click to authorize"}
                                 >
                                    {canDo ? <Lock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                 </button>
                              </td>
                           );
                        })}
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* --- QUICK ROLE AUDITOR --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
          <div className="xl:col-span-1 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-lg">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" /> Permission Auditor
              </h3>
              <p className="text-xs text-slate-500 mb-6">Select a role to see their full active permission profile.</p>
              
              <div className="space-y-2">
                  {ROLES.map(role => (
                      <button
                        key={role}
                        onClick={() => setActiveAuditorRole(role)}
                        className={`w-full flex items-center justify-between px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
                            activeAuditorRole === role 
                                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                          {role?.replace('_', ' ')}
                          <ChevronRight className={`w-4 h-4 transition-transform ${activeAuditorRole === role ? 'rotate-90' : ''}`} />
                      </button>
                  ))}
              </div>
          </div>

          <div className="xl:col-span-2 bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                  <Shield className="w-64 h-64 text-white" />
              </div>
              
              {activeAuditorRole ? (
                  <div className="relative z-10 animate-in fade-in slide-in-from-right-4">
                      <div className="flex items-baseline gap-2 mb-6">
                          <h4 className="text-4xl font-black tracking-tighter uppercase">{activeAuditorRole?.replace('_', ' ')}</h4>
                          <span className="text-indigo-400 font-bold uppercase text-xs tracking-[0.2em]">Live Profile</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Can View Modules</p>
                              <div className="space-y-2">
                                  {permissions[activeAuditorRole as string]?.allowedViews.slice(0, 8).map(v => (
                                      <div key={v} className="flex items-center gap-2 text-sm font-bold text-emerald-400"><Check className="w-4 h-4"/> {v.replace('_', ' ')}</div>
                                  ))}
                                  {permissions[activeAuditorRole as string]?.allowedViews.length > 8 && (
                                      <p className="text-[10px] text-slate-500 italic mt-2">+ {permissions[activeAuditorRole as string]?.allowedViews.length - 8} more screens</p>
                                  )}
                              </div>
                          </div>
                          <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Restricted Actions</p>
                              <div className="space-y-2">
                                  {ACTION_CONFIG.map(act => {
                                      const hasAct = permissions[activeAuditorRole as string]?.allowedActions.includes(act.id);
                                      return (
                                          <div key={act.id} className={`flex items-center gap-2 text-sm font-bold ${hasAct ? 'text-blue-400' : 'text-slate-600'}`}>
                                              {hasAct ? <Lock className="w-4 h-4"/> : <X className="w-4 h-4"/>} {act.label}
                                          </div>
                                      )
                                  })}
                              </div>
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 italic">
                      <Users className="w-16 h-16 mb-4 opacity-20" />
                      <p>Select a staff role on the left to audit their laws.</p>
                  </div>
              )}
          </div>
      </div>

      <div className="mt-8 p-6 bg-yellow-50 border-2 border-yellow-100 rounded-3xl flex items-start gap-4 shadow-sm">
         <div className="p-3 bg-white rounded-2xl shadow-sm text-yellow-600">
             <FileKey className="w-6 h-6" />
         </div>
         <div>
            <h4 className="text-lg font-black text-yellow-800 uppercase tracking-tight">Security Protocol Compliance</h4>
            <p className="text-sm text-yellow-700 mt-1 leading-relaxed">
               Modifications to staff "Laws" are logged in the global audit trail. New restrictions apply immediately upon the staff member's next page interaction. 
               <br/><span className="font-black">Owner accounts bypass all restrictions by default.</span>
            </p>
         </div>
      </div>

    </div>
  );
};

// Helper Icon
const ChevronRight = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);

export default AccessControlView;
