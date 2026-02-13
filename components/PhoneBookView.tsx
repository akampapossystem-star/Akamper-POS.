
import React, { useState, useEffect } from 'react';
import { 
  Search, Phone, User, Star, Plus, Trash2, Edit2, 
  Delete, Users, Briefcase, Ambulance, Save, X, Lock, Shield
} from 'lucide-react';
import { StaffMember } from '../types';

interface PhoneBookContact {
  id: string;
  name: string;
  number: string;
  category: 'STAFF' | 'SUPPLIER' | 'CUSTOMER' | 'EMERGENCY' | 'PARTNER';
  note?: string;
  isFavorite?: boolean;
}

// Initial Mock Data for Tenants
const INITIAL_TENANT_CONTACTS: PhoneBookContact[] = [
  { id: '1', name: 'Police Emergency', number: '999', category: 'EMERGENCY', isFavorite: true },
  { id: '2', name: 'Manager John', number: '0700123456', category: 'STAFF', isFavorite: true },
  { id: '3', name: 'Vegetable Supplier', number: '0755111222', category: 'SUPPLIER' },
  { id: '4', name: 'Dr. Smith (Local)', number: '0772333444', category: 'EMERGENCY' },
  { id: '5', name: 'VIP Guest Sarah', number: '0788999000', category: 'CUSTOMER' },
];

// Initial Mock Data for Master (Independent)
const INITIAL_MASTER_CONTACTS: PhoneBookContact[] = [
  { id: 'M1', name: 'Kampala Cafe Owner', number: '0741350786', category: 'PARTNER', isFavorite: true },
  { id: 'M2', name: 'System Developer', number: '0700000000', category: 'STAFF' },
  { id: 'M3', name: 'Server Support', number: '0800111222', category: 'SUPPLIER' },
];

interface PhoneBookViewProps {
  currentUser: StaffMember | null;
  variant?: 'tenant' | 'master'; // New prop to distinguish modes
}

const PhoneBookView: React.FC<PhoneBookViewProps> = ({ currentUser, variant = 'tenant' }) => {
  // Use separate initial states based on variant
  const [contacts, setContacts] = useState<PhoneBookContact[]>(
      variant === 'master' ? INITIAL_MASTER_CONTACTS : INITIAL_TENANT_CONTACTS
  );
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'STAFF' | 'SUPPLIER' | 'CUSTOMER' | 'EMERGENCY' | 'PARTNER'>('ALL');
  
  // Dialer / Input State
  const [inputNumber, setInputNumber] = useState('');
  const [isAddingContact, setIsAddingContact] = useState(false);
  
  // New Contact Form State
  const [newContactForm, setNewContactForm] = useState<Partial<PhoneBookContact>>({ category: 'CUSTOMER' });

  // Permissions: Only Manager, Cashier, or Owner can delete contacts.
  // Master is always Owner, so they can always delete in their own book.
  const canDelete = currentUser && ['MANAGER', 'CASHIER', 'OWNER'].includes(currentUser.role || '');

  // Update contacts if variant changes (e.g. navigation switch)
  useEffect(() => {
      setContacts(variant === 'master' ? INITIAL_MASTER_CONTACTS : INITIAL_TENANT_CONTACTS);
      setFilterCategory('ALL');
      setSearchTerm('');
      setInputNumber('');
  }, [variant]);

  // Filtering Logic
  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.number.includes(searchTerm);
    const matchesCategory = filterCategory === 'ALL' || c.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Keypad Logic
  const handleKeyPadPress = (key: string) => {
    if (inputNumber.length < 15) {
      setInputNumber(prev => prev + key);
    }
  };

  const handleBackspace = () => {
    setInputNumber(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setInputNumber('');
    setIsAddingContact(false);
  };

  // Add/Save Contact Logic
  const initiateAddContact = () => {
    setNewContactForm({ number: inputNumber, category: variant === 'master' ? 'PARTNER' : 'CUSTOMER' });
    setIsAddingContact(true);
  };

  const saveContact = () => {
    if (!newContactForm.name || !newContactForm.number) return;

    const newContact: PhoneBookContact = {
      id: `PB-${Date.now()}`,
      name: newContactForm.name || 'Unknown',
      number: newContactForm.number || '',
      category: newContactForm.category || 'CUSTOMER',
      note: newContactForm.note,
      isFavorite: false
    };

    setContacts(prev => [...prev, newContact]);
    setIsAddingContact(false);
    setInputNumber(''); // Clear dialer after save
    setNewContactForm({ category: 'CUSTOMER' });
  };

  const deleteContact = (id: string) => {
    if (confirm('Delete this contact?')) {
      setContacts(prev => prev.filter(c => c.id !== id));
    }
  };

  // Render Helper for Category Badge
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'EMERGENCY': return <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded uppercase flex items-center gap-1"><Ambulance className="w-3 h-3" /> Emergency</span>;
      case 'STAFF': return <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded uppercase flex items-center gap-1"><Briefcase className="w-3 h-3" /> Staff</span>;
      case 'SUPPLIER': return <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded uppercase flex items-center gap-1"><Users className="w-3 h-3" /> Supplier</span>;
      case 'PARTNER': return <span className="bg-purple-100 text-purple-600 text-[10px] font-black px-2 py-0.5 rounded uppercase flex items-center gap-1"><Shield className="w-3 h-3" /> Partner</span>;
      default: return <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-2 py-0.5 rounded uppercase flex items-center gap-1"><User className="w-3 h-3" /> Customer</span>;
    }
  };

  return (
    <div className={`h-[calc(100vh-64px)] flex overflow-hidden font-sans ${variant === 'master' ? 'bg-[#111827]' : 'bg-gray-50'}`}>
      
      {/* --- LEFT SIDE: CONTACT LIST --- */}
      <div className={`w-full md:w-1/2 lg:w-2/5 border-r flex flex-col h-full ${variant === 'master' ? 'bg-[#1f2937] border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
        
        {/* Header */}
        <div className={`p-6 border-b ${variant === 'master' ? 'border-gray-700 bg-[#111827]' : 'border-gray-100 bg-gray-50'}`}>
          <h1 className={`text-2xl font-black tracking-tight flex items-center gap-2 mb-4 ${variant === 'master' ? 'text-white' : 'text-gray-800'}`}>
            {variant === 'master' ? <Lock className="w-6 h-6 text-green-500" /> : <Phone className="w-6 h-6 text-blue-600" />}
            {variant === 'master' ? 'My Contacts' : 'Phone Directory'}
          </h1>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search name or number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 font-medium text-sm shadow-sm ${
                  variant === 'master' 
                    ? 'bg-gray-800 border-gray-600 text-white focus:ring-green-500 placeholder-gray-500' 
                    : 'bg-white border-gray-200 text-gray-800 focus:ring-blue-500'
              }`}
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {(variant === 'master' 
                ? ['ALL', 'PARTNER', 'STAFF', 'SUPPLIER'] 
                : ['ALL', 'STAFF', 'SUPPLIER', 'CUSTOMER', 'EMERGENCY']
            ).map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat as any)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-colors border ${
                  filterCategory === cat 
                    ? (variant === 'master' ? 'bg-green-600 text-white border-green-600' : 'bg-gray-900 text-white border-gray-900')
                    : (variant === 'master' ? 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50')
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {filteredContacts.length === 0 ? (
            <div className={`h-full flex flex-col items-center justify-center ${variant === 'master' ? 'text-gray-600' : 'text-gray-400'}`}>
              <User className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">No contacts found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredContacts.map(contact => (
                <div 
                  key={contact.id} 
                  className={`group flex items-center justify-between p-3 rounded-xl transition-all border border-transparent cursor-pointer ${
                      variant === 'master' 
                        ? 'hover:bg-gray-700 hover:border-gray-600' 
                        : 'hover:bg-gray-50 hover:border-gray-100'
                  }`}
                  onClick={() => setInputNumber(contact.number)}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm ${
                      contact.category === 'EMERGENCY' ? 'bg-red-500' : 
                      contact.category === 'STAFF' ? 'bg-blue-500' : 
                      variant === 'master' ? 'bg-green-600' : 'bg-gray-400'
                    }`}>
                      {contact.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className={`font-bold text-sm truncate ${variant === 'master' ? 'text-gray-200' : 'text-gray-800'}`}>{contact.name}</h4>
                      <p className={`text-xs font-mono font-medium ${variant === 'master' ? 'text-gray-500' : 'text-gray-500'}`}>{contact.number}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     {getCategoryBadge(contact.category)}
                     {canDelete && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); deleteContact(contact.id); }}
                            className={`p-1.5 rounded-lg transition-colors ${
                                variant === 'master' 
                                    ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20' 
                                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                            }`}
                            title="Delete Contact"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                     )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- RIGHT SIDE: DIALER & ACTIONS --- */}
      <div className={`hidden md:flex w-full md:w-1/2 lg:w-3/5 flex-col items-center justify-center p-8 relative ${
          variant === 'master' ? 'bg-[#111827]' : 'bg-gray-100'
      }`}>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(#9ca3af 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>

        {/* Input Display Area */}
        <div className={`p-8 rounded-3xl shadow-xl w-full max-w-sm mb-6 flex flex-col items-center border relative z-10 ${
            variant === 'master' 
                ? 'bg-[#1f2937] border-gray-700' 
                : 'bg-white border-gray-100'
        }`}>
           <div className="w-full text-center mb-6 min-h-[60px] flex flex-col justify-center">
              {inputNumber ? (
                 <h2 className={`text-4xl font-mono font-black tracking-wider ${variant === 'master' ? 'text-white' : 'text-gray-800'}`}>{inputNumber}</h2>
              ) : (
                 <span className="text-gray-300 text-sm font-bold uppercase tracking-widest">Enter Number</span>
              )}
              
              {/* Show matching name if exists */}
              {inputNumber && (
                 <p className={`font-bold text-sm mt-2 h-5 ${variant === 'master' ? 'text-green-400' : 'text-blue-600'}`}>
                    {contacts.find(c => c.number === inputNumber)?.name || (isAddingContact ? 'New Contact' : '')}
                 </p>
              )}
           </div>

           {/* IF ADDING NEW CONTACT */}
           {isAddingContact ? (
              <div className="w-full space-y-4 animate-in fade-in zoom-in duration-200">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</label>
                    <input 
                       autoFocus
                       className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 font-bold ${
                           variant === 'master' 
                            ? 'bg-gray-800 border-gray-600 text-white focus:ring-green-500' 
                            : 'bg-gray-50 border-gray-200 text-gray-800 focus:ring-blue-500'
                       }`}
                       placeholder="Contact Name"
                       value={newContactForm.name || ''}
                       onChange={e => setNewContactForm({...newContactForm, name: e.target.value})}
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                    <div className="grid grid-cols-2 gap-2">
                       {(variant === 'master' 
                           ? ['PARTNER', 'SUPPLIER', 'STAFF', 'CUSTOMER'] 
                           : ['CUSTOMER', 'SUPPLIER', 'STAFF', 'EMERGENCY']
                       ).map(cat => (
                          <button
                             key={cat}
                             onClick={() => setNewContactForm({...newContactForm, category: cat as any})}
                             className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                newContactForm.category === cat 
                                   ? (variant === 'master' ? 'bg-green-600 text-white border-green-600' : 'bg-blue-600 text-white border-blue-600')
                                   : (variant === 'master' ? 'bg-gray-800 text-gray-400 border-gray-600' : 'bg-white text-gray-500 border-gray-200')
                             }`}
                          >
                             {cat}
                          </button>
                       ))}
                    </div>
                 </div>
                 <div className="flex gap-2 pt-2">
                    <button onClick={() => setIsAddingContact(false)} className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase ${
                        variant === 'master' ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600'
                    }`}>Cancel</button>
                    <button onClick={saveContact} className={`flex-1 py-3 text-white rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 ${
                        variant === 'master' ? 'bg-green-600 hover:bg-green-500' : 'bg-green-600'
                    }`}>
                       <Save className="w-4 h-4" /> Save
                    </button>
                 </div>
              </div>
           ) : (
              /* KEYPAD GRID */
              <div className="grid grid-cols-3 gap-4 w-full">
                 {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((key) => (
                    <button
                       key={key}
                       onClick={() => handleKeyPadPress(key.toString())}
                       className={`h-16 rounded-2xl text-2xl font-black transition-all shadow-sm border active:scale-95 flex items-center justify-center ${
                           variant === 'master' 
                            ? 'bg-gray-800 text-white border-gray-700 hover:bg-gray-700 active:bg-gray-600' 
                            : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100 active:bg-gray-200'
                       }`}
                    >
                       {key}
                    </button>
                 ))}
              </div>
           )}
        </div>

        {/* Action Buttons (Only show if not adding contact) */}
        {!isAddingContact && (
           <div className="flex gap-4 w-full max-w-sm justify-center">
              {/* Backspace / Clear */}
              {inputNumber && (
                 <button 
                    onClick={handleBackspace}
                    onDoubleClick={handleClear}
                    className={`w-20 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 ${
                        variant === 'master' 
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                    }`}
                 >
                    <Delete className="w-6 h-6" />
                 </button>
              )}

              {/* Add Contact Button (If number exists and is not known) */}
              {inputNumber && !contacts.find(c => c.number === inputNumber) && (
                 <button 
                    onClick={initiateAddContact}
                    className={`flex-1 text-white rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 py-4 font-bold gap-2 ${
                        variant === 'master' 
                            ? 'bg-green-600 hover:bg-green-500 shadow-green-900/30' 
                            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                    }`}
                    title="Add to Contacts"
                 >
                    <Plus className="w-6 h-6" /> Add to Contacts
                 </button>
              )}
           </div>
        )}

      </div>
    </div>
  );
};

export default PhoneBookView;
