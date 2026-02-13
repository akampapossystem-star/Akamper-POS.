
import React, { useState } from 'react';
import { Users, Search, Plus, Phone, Mail, BadgeCheck, Trash2, Edit2, Gift, Briefcase } from 'lucide-react';
import { Customer, SystemConfig } from '../types';

interface CRMViewProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  systemConfig: SystemConfig;
}

const CRMView: React.FC<CRMViewProps> = ({ customers, setCustomers, systemConfig }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({ type: 'REGULAR' });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.contact.includes(searchTerm)
  );

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.contact) return;
    
    const customer: Customer = {
      id: `C-${Math.floor(Math.random() * 10000)}`,
      name: newCustomer.name,
      contact: newCustomer.contact,
      email: newCustomer.email,
      loyaltyPoints: 0,
      lastVisit: new Date(),
      type: newCustomer.type || 'REGULAR'
    };
    
    setCustomers([customer, ...customers]);
    setIsModalOpen(false);
    setNewCustomer({ type: 'REGULAR' });
  };

  const deleteCustomer = (id: string) => {
    if(confirm('Delete this customer record?')) {
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" /> Customer CRM
          </h1>
          <p className="text-gray-500 font-medium">Manage relationships, loyalty points, and contacts.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all"
        >
          <Plus className="w-5 h-5" /> Add Customer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users className="w-5 h-5" /></div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Customers</span>
          </div>
          <p className="text-3xl font-black text-gray-800">{customers.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Gift className="w-5 h-5" /></div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Loyalty Active</span>
          </div>
          <p className="text-3xl font-black text-gray-800">{customers.filter(c => c.loyaltyPoints > 0).length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Briefcase className="w-5 h-5" /></div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Staff Profiles</span>
          </div>
          <p className="text-3xl font-black text-gray-800">{customers.filter(c => c.type === 'STAFF').length}</p>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
            />
          </div>
        </div>
        
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Loyalty Points</th>
              <th className="px-6 py-4">Last Visit</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCustomers.map(customer => (
              <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${customer.type === 'STAFF' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{customer.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">ID: {customer.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Phone className="w-3 h-3" /> {customer.contact}</div>
                    {customer.email && <div className="flex items-center gap-2 text-sm text-gray-500"><Mail className="w-3 h-3" /> {customer.email}</div>}
                  </div>
                </td>
                <td className="px-6 py-4">
                    {customer.type === 'STAFF' ? (
                        <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border border-indigo-100 flex items-center gap-1 w-fit">
                            <Briefcase className="w-3 h-3" /> Staff
                        </span>
                    ) : (
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide">
                            Regular
                        </span>
                    )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-yellow-600 text-lg">{customer.loyaltyPoints}</span>
                    {customer.loyaltyPoints > 1000 && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-600">
                  {customer.lastVisit.toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => deleteCustomer(customer.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-400 font-bold uppercase text-xs">No customers found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-6">Register New Customer</h2>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Full Name</label>
                <input required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" 
                  value={newCustomer.name || ''} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Phone Number</label>
                <input required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" 
                  value={newCustomer.contact || ''} onChange={e => setNewCustomer({...newCustomer, contact: e.target.value})} 
                />
              </div>
              
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="isStaff"
                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    checked={newCustomer.type === 'STAFF'}
                    onChange={(e) => setNewCustomer({...newCustomer, type: e.target.checked ? 'STAFF' : 'REGULAR'})}
                  />
                  <div>
                      <label htmlFor="isStaff" className="block text-xs font-black text-indigo-900 uppercase tracking-wide cursor-pointer">Register as Company Staff</label>
                      <p className="text-[10px] text-indigo-600/70">Allows ordering on staff credit/tab in POS.</p>
                  </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Email (Optional)</label>
                <input type="email" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" 
                  value={newCustomer.email || ''} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} 
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CRMView;
