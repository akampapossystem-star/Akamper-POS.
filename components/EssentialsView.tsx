
import React, { useState } from 'react';
import { 
  Calculator, FileText, Truck, Zap, Percent, Shield, 
  HelpCircle, Wifi, Smartphone, PenTool, PhoneCall, Plus, Trash2, CheckCircle2, AlertTriangle, ArrowRight, Save, X, Delete
} from 'lucide-react';
import { SystemConfig } from '../types';

interface EssentialsViewProps {
  systemConfig: SystemConfig;
}

const EssentialsView: React.FC<EssentialsViewProps> = ({ systemConfig }) => {
  const [activeTool, setActiveTool] = useState<string>('SUPPORT');
  
  // Tax Calculator State
  const [taxAmount, setTaxAmount] = useState('');
  const [taxRate, setTaxRate] = useState('18');
  const [taxResult, setTaxResult] = useState<{net: number, tax: number, gross: number} | null>(null);

  // General Calculator State
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcEquation, setCalcEquation] = useState('');

  // Supplier Directory State
  const [suppliers, setSuppliers] = useState<{id: string, name: string, contact: string, category: string}[]>([
      { id: '1', name: 'Kampala Meat Supply', contact: '0700123456', category: 'Food' },
      { id: '2', name: 'Nile Beverages', contact: '0755987654', category: 'Drinks' }
  ]);
  const [newSupplier, setNewSupplier] = useState({ name: '', contact: '', category: '' });

  // Utility Log State
  const [utilities, setUtilities] = useState<{id: string, type: string, amount: number, date: string}[]>([]);
  const [newUtility, setNewUtility] = useState({ type: 'Electricity', amount: '', date: new Date().toISOString().split('T')[0] });

  // Discounts State
  const [promos, setPromos] = useState<{id: string, code: string, percent: number}[]>([
      { id: '1', code: 'HAPPYHOUR', percent: 20 },
      { id: '2', code: 'STAFF50', percent: 50 }
  ]);
  const [newPromo, setNewPromo] = useState({ code: '', percent: '' });

  // Notes State
  const [notes, setNotes] = useState<string[]>(['Kitchen sink needs repair.', 'Order extra milk for weekend.']);
  const [newNote, setNewNote] = useState('');

  // Handlers
  const handleCalculateTax = () => {
      const amt = parseFloat(taxAmount);
      const rate = parseFloat(taxRate);
      if (!isNaN(amt) && !isNaN(rate)) {
          const tax = amt * (rate / 100);
          setTaxResult({ net: amt, tax: tax, gross: amt + tax });
      }
  };

  const handleAddSupplier = () => {
      if(newSupplier.name && newSupplier.contact) {
          setSuppliers([...suppliers, { id: Date.now().toString(), ...newSupplier }]);
          setNewSupplier({ name: '', contact: '', category: '' });
      }
  };

  const handleAddUtility = () => {
      if(newUtility.amount) {
          setUtilities([...utilities, { id: Date.now().toString(), type: newUtility.type, amount: parseFloat(newUtility.amount), date: newUtility.date }]);
          setNewUtility({ ...newUtility, amount: '' });
      }
  };

  const handleAddPromo = () => {
      if(newPromo.code && newPromo.percent) {
          setPromos([...promos, { id: Date.now().toString(), code: newPromo.code.toUpperCase(), percent: parseFloat(newPromo.percent) }]);
          setNewPromo({ code: '', percent: '' });
      }
  };

  const handleAddNote = () => {
      if(newNote.trim()) {
          setNotes([...notes, newNote]);
          setNewNote('');
      }
  };

  // General Calculator Logic
  const handleCalcPress = (val: string) => {
    if (val === '=') {
      try {
        // eslint-disable-next-line
        const result = eval(calcEquation + calcDisplay); 
        setCalcDisplay(String(result));
        setCalcEquation('');
      } catch {
        setCalcDisplay('Error');
        setCalcEquation('');
      }
    } else if (val === 'C') {
      setCalcDisplay('0');
      setCalcEquation('');
    } else if (val === 'DEL') {
      setCalcDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (['+', '-', '*', '/'].includes(val)) {
      setCalcEquation(prev => prev + calcDisplay + val);
      setCalcDisplay('0');
    } else {
      setCalcDisplay(prev => prev === '0' ? val : prev + val);
    }
  };

  const tools = [
    { id: 'SUPPORT', name: 'Support', icon: HelpCircle },
    { id: 'GENERAL_CALC', name: 'Calculator', icon: Calculator },
    { id: 'TAX', name: 'Tax Calc', icon: Percent },
    { id: 'SUPPLIERS', name: 'Suppliers', icon: Truck },
    { id: 'UTILITY', name: 'Utility Log', icon: Zap },
    { id: 'PROMOS', name: 'Discounts', icon: Percent },
    { id: 'LEGAL', name: 'Legal Docs', icon: Shield },
    { id: 'NOTES', name: 'Notes', icon: PenTool },
    { id: 'NETWORK', name: 'Network', icon: Wifi },
    { id: 'DEVICES', name: 'Devices', icon: Smartphone },
  ];

  const calcButtons = [
    'C', '/', '*', 'DEL',
    '7', '8', '9', '-',
    '4', '5', '6', '+',
    '1', '2', '3', '=',
    '0', '.',
  ];

  return (
    <div className="h-full flex bg-gray-50 overflow-hidden font-sans">
      
      {/* Sidebar Navigation for Tools */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                  <Zap className="w-6 h-6 text-blue-600" /> Utilities
              </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {tools.map(tool => (
                  <button
                      key={tool.id}
                      onClick={() => setActiveTool(tool.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-left ${
                          activeTool === tool.id 
                              ? 'bg-blue-600 text-white shadow-md' 
                              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                  >
                      <tool.icon className="w-5 h-5" /> {tool.name}
                  </button>
              ))}
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* SUPPORT TAB */}
          {activeTool === 'SUPPORT' && (
              <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
                      <div className="relative z-10">
                          <h2 className="text-3xl font-black uppercase tracking-tight mb-4">Technical Support</h2>
                          <p className="text-indigo-200 text-lg mb-8 max-w-md">
                              Need immediate assistance? Contact the Akamper POS technical team directly.
                          </p>
                          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 inline-block">
                              <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2">Emergency Hotline</p>
                              <div className="flex items-center gap-3 text-2xl font-mono font-black">
                                  <PhoneCall className="w-6 h-6 text-green-400" />
                                  <span>+256 74-13 50 786</span>
                              </div>
                          </div>
                      </div>
                      <HelpCircle className="absolute -bottom-10 -right-10 w-64 h-64 text-indigo-800 opacity-20 rotate-12" />
                  </div>
              </div>
          )}

          {/* GENERAL CALCULATOR */}
          {activeTool === 'GENERAL_CALC' && (
              <div className="max-w-xs mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-gray-900 rounded-[2rem] shadow-2xl overflow-hidden border border-gray-800 p-6">
                      <div className="bg-gray-800 rounded-2xl p-6 mb-6 text-right shadow-inner border border-gray-700">
                        <div className="text-gray-400 text-xs h-4 mb-1 font-mono">{calcEquation}</div>
                        <div className="text-4xl font-black text-white truncate font-mono">{calcDisplay}</div>
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        {calcButtons.map((btn) => (
                          <button
                            key={btn}
                            onClick={() => handleCalcPress(btn)}
                            className={`h-16 rounded-xl font-bold text-lg shadow-sm transition-all active:scale-95 flex items-center justify-center
                              ${btn === '=' ? 'col-span-1 bg-blue-600 text-white hover:bg-blue-500' : 
                                btn === 'DEL' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                                ['C', '/', '*', '-', '+'].includes(btn) ? 'bg-gray-700 text-blue-300 hover:bg-gray-600' : 
                                'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'
                              }
                            `}
                          >
                            {btn === 'DEL' ? <Delete className="w-5 h-5" /> : btn}
                          </button>
                        ))}
                      </div>
                  </div>
              </div>
          )}

          {/* TAX CALCULATOR */}
          {activeTool === 'TAX' && (
              <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-2xl font-black text-gray-800 uppercase">VAT Calculator</h3>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-400 uppercase">Amount</label>
                              <input type="number" value={taxAmount} onChange={e => setTaxAmount(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl font-bold text-lg outline-none" placeholder="0.00" />
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-400 uppercase">Tax Rate (%)</label>
                              <input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl font-bold text-lg outline-none" placeholder="18" />
                          </div>
                      </div>
                      <button onClick={handleCalculateTax} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-sm shadow-lg hover:bg-blue-700">Calculate</button>
                      
                      {taxResult && (
                          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 space-y-2">
                              <div className="flex justify-between font-bold text-gray-600"><span>Net:</span><span>{taxResult.net.toLocaleString()}</span></div>
                              <div className="flex justify-between font-bold text-gray-600"><span>Tax:</span><span>{taxResult.tax.toLocaleString()}</span></div>
                              <div className="border-t border-blue-200 pt-2 flex justify-between font-black text-xl text-blue-900"><span>Gross:</span><span>{taxResult.gross.toLocaleString()}</span></div>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {/* SUPPLIER DIRECTORY */}
          {activeTool === 'SUPPLIERS' && (
              <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-2xl font-black text-gray-800 uppercase">Supplier Directory</h3>
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <div className="flex gap-2 mb-6">
                          <input value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} placeholder="Name" className="flex-1 p-3 bg-gray-50 rounded-xl font-bold text-sm outline-none" />
                          <input value={newSupplier.contact} onChange={e => setNewSupplier({...newSupplier, contact: e.target.value})} placeholder="Contact" className="w-1/3 p-3 bg-gray-50 rounded-xl font-bold text-sm outline-none" />
                          <input value={newSupplier.category} onChange={e => setNewSupplier({...newSupplier, category: e.target.value})} placeholder="Category" className="w-1/4 p-3 bg-gray-50 rounded-xl font-bold text-sm outline-none" />
                          <button onClick={handleAddSupplier} className="p-3 bg-blue-600 text-white rounded-xl"><Plus className="w-5 h-5"/></button>
                      </div>
                      <div className="space-y-2">
                          {suppliers.map(s => (
                              <div key={s.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                  <div>
                                      <p className="font-bold text-gray-900">{s.name}</p>
                                      <p className="text-xs text-gray-500">{s.category}</p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <span className="font-mono font-bold text-gray-600">{s.contact}</span>
                                      <button onClick={() => setSuppliers(suppliers.filter(x => x.id !== s.id))} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {/* UTILITY LOG */}
          {activeTool === 'UTILITY' && (
              <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-2xl font-black text-gray-800 uppercase">Utility Log</h3>
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <div className="flex gap-2 mb-6">
                          <select value={newUtility.type} onChange={e => setNewUtility({...newUtility, type: e.target.value})} className="p-3 bg-gray-50 rounded-xl font-bold text-sm outline-none">
                              <option>Electricity</option><option>Water</option><option>Gas</option><option>Internet</option>
                          </select>
                          <input type="number" value={newUtility.amount} onChange={e => setNewUtility({...newUtility, amount: e.target.value})} placeholder="Cost" className="flex-1 p-3 bg-gray-50 rounded-xl font-bold text-sm outline-none" />
                          <input type="date" value={newUtility.date} onChange={e => setNewUtility({...newUtility, date: e.target.value})} className="p-3 bg-gray-50 rounded-xl font-bold text-sm outline-none" />
                          <button onClick={handleAddUtility} className="p-3 bg-blue-600 text-white rounded-xl"><Plus className="w-5 h-5"/></button>
                      </div>
                      <div className="space-y-2">
                          {utilities.map(u => (
                              <div key={u.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                  <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-lg ${u.type === 'Electricity' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>
                                          <Zap className="w-4 h-4" />
                                      </div>
                                      <span className="font-bold text-gray-800">{u.type}</span>
                                  </div>
                                  <span className="font-mono font-bold text-gray-600">{u.date}</span>
                                  <span className="font-black text-gray-900">{systemConfig.currency} {u.amount.toLocaleString()}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {/* DISCOUNTS */}
          {activeTool === 'PROMOS' && (
              <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-2xl font-black text-gray-800 uppercase">Promo Codes</h3>
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <div className="flex gap-2 mb-6">
                          <input value={newPromo.code} onChange={e => setNewPromo({...newPromo, code: e.target.value})} placeholder="CODE" className="flex-1 p-3 bg-gray-50 rounded-xl font-bold text-sm outline-none uppercase" />
                          <input type="number" value={newPromo.percent} onChange={e => setNewPromo({...newPromo, percent: e.target.value})} placeholder="%" className="w-24 p-3 bg-gray-50 rounded-xl font-bold text-sm outline-none" />
                          <button onClick={handleAddPromo} className="p-3 bg-blue-600 text-white rounded-xl"><Plus className="w-5 h-5"/></button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          {promos.map(p => (
                              <div key={p.id} className="bg-green-50 p-4 rounded-2xl border border-green-100 flex justify-between items-center">
                                  <div>
                                      <p className="font-black text-green-800 text-lg">{p.code}</p>
                                      <p className="text-xs font-bold text-green-600">{p.percent}% Off</p>
                                  </div>
                                  <button onClick={() => setPromos(promos.filter(x => x.id !== p.id))} className="text-green-400 hover:text-green-700"><X className="w-4 h-4"/></button>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {/* NOTES */}
          {activeTool === 'NOTES' && (
              <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-2xl font-black text-gray-800 uppercase">Sticky Notes</h3>
                  <div className="flex gap-2 mb-6">
                      <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Type a quick note..." className="flex-1 p-4 bg-white border border-gray-200 rounded-2xl font-bold text-sm outline-none shadow-sm" />
                      <button onClick={handleAddNote} className="px-6 bg-yellow-400 text-yellow-900 rounded-2xl font-black uppercase text-sm shadow-md hover:bg-yellow-500">Add Note</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {notes.map((note, idx) => (
                          <div key={idx} className="bg-yellow-100 p-6 rounded-2xl shadow-sm rotate-1 hover:rotate-0 transition-transform relative group">
                              <p className="font-handwriting font-bold text-gray-800 text-lg leading-tight">{note}</p>
                              <button onClick={() => setNotes(notes.filter((_, i) => i !== idx))} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-yellow-700"><X className="w-4 h-4"/></button>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* NETWORK */}
          {activeTool === 'NETWORK' && (
              <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-2xl font-black text-gray-800 uppercase">Network Status</h3>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center space-y-6">
                      <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center ${navigator.onLine ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          <Wifi className="w-12 h-12" />
                      </div>
                      <div>
                          <h4 className="text-xl font-black text-gray-900">{navigator.onLine ? 'Online' : 'Offline'}</h4>
                          <p className="text-gray-500 font-medium">Connection is {navigator.onLine ? 'stable' : 'interrupted'}.</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl text-left text-sm font-mono text-gray-600 space-y-2">
                          <div className="flex justify-between"><span>Status:</span><span className="font-bold">Active</span></div>
                          <div className="flex justify-between"><span>Ping:</span><span className="font-bold">24ms</span></div>
                          <div className="flex justify-between"><span>Protocol:</span><span className="font-bold">HTTPS/WSS</span></div>
                      </div>
                  </div>
              </div>
          )}

          {/* DEVICES */}
          {activeTool === 'DEVICES' && (
              <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-2xl font-black text-gray-800 uppercase">Connected Devices</h3>
                  <div className="space-y-4">
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                              <div className="p-3 bg-gray-100 rounded-xl"><Smartphone className="w-6 h-6 text-gray-600" /></div>
                              <div>
                                  <p className="font-bold text-gray-800">Main POS Terminal</p>
                                  <p className="text-xs text-gray-500">Current Session • Chrome Windows</p>
                              </div>
                          </div>
                          <span className="text-green-600 font-bold text-xs bg-green-50 px-3 py-1 rounded-lg">Active</span>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between opacity-60">
                          <div className="flex items-center gap-4">
                              <div className="p-3 bg-gray-100 rounded-xl"><Smartphone className="w-6 h-6 text-gray-600" /></div>
                              <div>
                                  <p className="font-bold text-gray-800">Kitchen Display 1</p>
                                  <p className="text-xs text-gray-500">Last seen: 2 mins ago</p>
                              </div>
                          </div>
                          <span className="text-gray-400 font-bold text-xs bg-gray-50 px-3 py-1 rounded-lg">Idle</span>
                      </div>
                  </div>
              </div>
          )}

          {/* LEGAL */}
          {activeTool === 'LEGAL' && (
              <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-2xl font-black text-gray-800 uppercase">Legal Documents</h3>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center text-gray-400">
                      <Shield className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p className="font-bold">No documents uploaded.</p>
                      <button className="mt-4 px-6 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200">Upload License</button>
                  </div>
              </div>
          )}

      </div>
    </div>
  );
};

export default EssentialsView;
