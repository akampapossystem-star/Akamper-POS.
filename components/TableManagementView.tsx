
import React, { useState, useEffect, useMemo } from 'react';
/* Add Settings to the lucide-react imports */
import { 
  LayoutGrid, Plus, Trash2, Armchair, Move, Check, X, Edit, Palette, Layers, Maximize, Lock, Grid, ChevronRight, User, Settings, Search
} from 'lucide-react';
import { Table, UserRole, StaffMember, Order } from '../types'; // Added Order

interface TableManagementViewProps {
  tables: Table[];
  onAddTable: (table: Table) => void;
  onDeleteTable: (id: string) => void;
  onUpdateTable: (table: Table) => void;
  userRole: UserRole;
  currentUser: StaffMember | null;
  orders?: Order[]; // Added optional orders prop to visualize occupancy
}

const PRESET_COLORS = [
  '#e2e8f0', // Available Grey (Default)
  '#22c55e', // Occupied Green
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
];

const TableManagementView: React.FC<TableManagementViewProps> = ({ tables, onAddTable, onDeleteTable, onUpdateTable, userRole, currentUser, orders = [] }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Permission Check
  const canManageTables = ['MANAGER', 'OWNER'].includes(userRole || '');

  // Section Management State
  const [availableSections, setAvailableSections] = useState<string[]>(() => {
      const existing = Array.from(new Set(tables.map(t => t.section || 'General')));
      // Ensure 'Bar' and 'Garden's exist as per typical restaurant setup
      const defaults = ['Bar', 'Garden 1', 'Garden 2', 'Garden 3', 'Garden 4'];
      return Array.from(new Set([...existing, ...defaults])).sort();
  });
  const [showSectionManager, setShowSectionManager] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  
  // Active Section for Visual Map - Default to Garden 1 to match image
  const [activeSection, setActiveSection] = useState<string>('Garden 1');

  // Sidebar Search State
  const [sidebarSearch, setSidebarSearch] = useState('');

  const [formData, setFormData] = useState<Partial<Table>>({
    type: 'round',
    seats: 4,
    x: 50,
    y: 50,
    section: 'Garden 1',
    color: '#e2e8f0',
    scale: 1
  });

  // Sync the map view to the form's selected section
  useEffect(() => {
      if (formData.section && formData.section !== activeSection) {
          setActiveSection(formData.section);
      }
  }, [formData.section]);

  // Handle saving (Create or Update)
  const handleSave = () => {
    if (!canManageTables) {
        alert("Access Denied: Only Managers and Owners can manage tables.");
        return;
    }
    if (!formData.name) return;
    
    if (editingId) {
        // Update Existing
        const updatedTable: Table = {
            id: editingId,
            name: formData.name,
            section: formData.section || availableSections[0],
            type: formData.type as any,
            seats: formData.seats || 4,
            status: 'available', 
            x: formData.x || 50,
            y: formData.y || 50,
            color: formData.color || '#e2e8f0',
            scale: formData.scale || 1
        };
        onUpdateTable(updatedTable);
        setEditingId(null);
    } else {
        // Create New
        const newTable: Table = {
            id: `T-${Math.floor(Math.random() * 10000)}`,
            name: formData.name,
            section: formData.section || availableSections[0],
            type: formData.type as any,
            seats: formData.seats || 4,
            status: 'available',
            x: formData.x || 50,
            y: formData.y || 50,
            color: formData.color || '#e2e8f0',
            scale: formData.scale || 1
        };
        onAddTable(newTable);
    }
    
    // Reset Form
    setFormData({ type: 'round', seats: 4, x: 50, y: 50, section: activeSection, color: '#e2e8f0', scale: 1, name: '' });
  };

  const handleEditClick = (table: Table) => {
      if (!canManageTables) return;
      setEditingId(table.id);
      setFormData({ ...table, scale: table.scale || 1, color: table.color || '#e2e8f0' });
      setActiveSection(table.section || 'General'); // Switch view to table's section
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setFormData({ type: 'round', seats: 4, x: 50, y: 50, section: activeSection, color: '#e2e8f0', scale: 1, name: '' });
  };

  // Section Management Handlers
  const handleAddSection = () => {
      if(newSectionName && !availableSections.includes(newSectionName)){
          const updated = [...availableSections, newSectionName].sort();
          setAvailableSections(updated);
          setNewSectionName('');
      }
  };

  const handleDeleteSection = (sec: string) => {
      if(confirm(`Delete section "${sec}"? Tables in this section will NOT be deleted but might need reassignment.`)) {
          const updated = availableSections.filter(s => s !== sec);
          setAvailableSections(updated);
          if(activeSection === sec) setActiveSection(updated[0] || '');
          if(formData.section === sec) setFormData({...formData, section: updated[0]});
      }
  };

  // Filter tables for the map based on active section
  const visibleTables = tables.filter(t => t.section === activeSection);

  // Filter tables for sidebar search
  const searchedTables = useMemo(() => {
      if (!sidebarSearch) return [];
      return tables.filter(t => t.name.toLowerCase().includes(sidebarSearch.toLowerCase()));
  }, [tables, sidebarSearch]);

  const selectedTableName = tables.find(t => t.id === editingId)?.name || '';

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#f8f9fa] overflow-hidden font-sans">
      
      {/* Visual Floor Plan Area (Main Content) */}
      <div className="flex-1 flex flex-col h-full bg-white relative">
         
         {/* ODOO STYLE TOP HEADER (As seen in image) */}
         <div className="h-14 bg-[#714b67] border-b border-[#5a3c52] flex items-center px-4 justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2">
                <div className="bg-[#5a3c52] hover:bg-[#4a3243] text-white px-4 py-1.5 rounded text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors">
                    Plan
                </div>
                <div className="bg-white/10 text-white px-4 py-1.5 rounded text-sm font-bold flex items-center gap-2 cursor-pointer">
                    Table
                </div>
                <div className="flex items-center text-white/50 px-2">
                    <ChevronRight className="w-4 h-4" />
                </div>
                {/* Dynamic 16B Tab / Selected Table Indicator */}
                <div className={`px-4 py-1.5 rounded text-sm font-bold transition-all ${selectedTableName ? 'bg-white text-[#714b67]' : 'bg-white/5 text-white/40'}`}>
                    {selectedTableName || 'Select Table'}
                </div>
            </div>

            <div className="flex items-center gap-4 text-white/80">
                {/* Dynamic User Tab */}
                <div className="flex items-center gap-2 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 hover:bg-white/20 transition-colors cursor-default">
                    <User className="w-3 h-3" />
                    <span>{currentUser?.name || 'Guest User'}</span>
                </div>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Lock className="w-4 h-4" /></button>
            </div>
         </div>

         {/* ODOO STYLE SECTION TABS */}
         <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-3 overflow-x-auto no-scrollbar shrink-0">
            {availableSections.map(sec => (
                <button
                    key={sec}
                    onClick={() => setActiveSection(sec)}
                    className={`px-6 py-2 text-sm font-bold rounded-md transition-all whitespace-nowrap border-2 ${
                        activeSection === sec 
                            ? 'bg-[#e7f3f5] border-[#c0e0e4] text-[#00717a] shadow-sm' 
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                >
                    {sec}
                </button>
            ))}
            {canManageTables && (
                <div className="ml-auto flex items-center gap-2">
                    <button onClick={() => setShowSectionManager(!showSectionManager)} className="text-[#00717a] font-bold text-xs uppercase tracking-widest hover:underline px-2">
                        {showSectionManager ? 'Close Editor' : 'Edit Sections'}
                    </button>
                </div>
            )}
         </div>

         {/* The Map Canvas */}
         <div className="flex-1 relative bg-white overflow-hidden p-8">
            
            {/* Grid Pattern (Subtle) */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
                 style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            {/* Render Tables (Filtered by Active Section) */}
            {visibleTables.map(table => {
               const isSelected = editingId === table.id;
               // Check live status from orders prop if available, otherwise rely on table prop (fallback)
               const isOccupied = orders && orders.length > 0 
                  ? orders.some(o => o.table === table.name && !['paid', 'cancelled', 'merged'].includes(o.status))
                  : (table.status === 'occupied' || table.color === '#22c55e');
               
               // Dynamic Styles based on shape to match Odoo looks
               const shapeClass = table.type === 'round' ? 'rounded-full' : 'rounded-sm';
               const baseSize = table.type === 'rect' ? 'w-36 h-28' : 'w-28 h-28';

               return (
                  <div
                     key={table.id}
                     onClick={() => handleEditClick(table)}
                     className={`
                        absolute flex flex-col items-center justify-center transition-all duration-300
                        ${shapeClass} ${baseSize}
                        ${isSelected 
                            ? 'ring-4 ring-blue-400 z-20 scale-105 shadow-xl' 
                            : 'shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-gray-200'
                        }
                        ${canManageTables ? 'cursor-pointer hover:shadow-lg' : 'cursor-default'}
                     `}
                     style={{ 
                         left: `${table.x}%`, 
                         top: `${table.y}%`, 
                         transform: `translate(-50%, -50%) scale(${table.scale || 1})`,
                         backgroundColor: isOccupied ? '#fee2e2' : (table.color || '#e2e8f0'),
                         borderColor: isOccupied ? '#fca5a5' : 'transparent',
                         borderWidth: isOccupied ? '2px' : '0px',
                         color: '#1e293b'
                     }}
                  >
                     <span className={`font-black text-2xl tracking-tighter ${isOccupied ? 'text-red-800' : 'text-gray-600'}`}>{table.name}</span>
                     
                     {/* Edit Indicator overlay */}
                     {isSelected && (
                         <div className="absolute -top-3 -right-3 bg-blue-600 text-white rounded-full p-1.5 shadow-lg">
                             <Edit className="w-4 h-4" />
                         </div>
                     )}
                  </div>
               );
            })}

            {/* Ghost Table (Preview) */}
            {!editingId && formData.name && canManageTables && formData.section === activeSection && (
                <div
                    className={`
                        absolute flex flex-col items-center justify-center border-2 border-dashed border-blue-400 bg-blue-50/50 text-blue-400 pointer-events-none opacity-70 animate-pulse
                        ${formData.type === 'round' ? 'rounded-full w-28 h-28' : 'rounded-sm w-28 h-28'}
                    `}
                    style={{ 
                        left: `${formData.x}%`, 
                        top: `${formData.y}%`, 
                        transform: `translate(-50%, -50%) scale(${formData.scale || 1})`,
                    }}
                >
                    <span className="font-black text-lg">{formData.name}</span>
                </div>
            )}

         </div>
         
         {/* STATUS BAR */}
         <div className="h-10 bg-white border-t border-gray-200 flex items-center justify-between px-6">
            <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#e2e8f0] border border-gray-300"></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#fee2e2] border border-red-300"></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Occupied</span>
                </div>
            </div>
            <span className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em]">{visibleTables.length} Objects Loaded</span>
         </div>
      </div>

      {/* Sidebar Controls (Right Side) */}
      <div className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col z-30 shadow-2xl overflow-y-auto custom-scrollbar">
        
        {/* SIDEBAR SEARCH BAR */}
        <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
                type="text"
                placeholder="Find a table..."
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
            />
            {sidebarSearch && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                    {searchedTables.length === 0 ? (
                        <div className="p-3 text-xs text-gray-400 text-center">No tables found.</div>
                    ) : (
                        searchedTables.map(t => (
                            <button
                                key={t.id}
                                onClick={() => { 
                                    handleEditClick(t); 
                                    setSidebarSearch(''); 
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm font-bold text-gray-700 border-b border-gray-50 last:border-0 flex justify-between items-center"
                            >
                                <span>{t.name}</span>
                                <span className="text-[10px] text-gray-400 uppercase">{t.section}</span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" /> Map Config
          </h2>
        </div>

        {!canManageTables ? (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                <Lock className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-red-800 uppercase tracking-tight">View Only</h4>
                    <p className="text-xs text-red-600 mt-1">Editing restricted.</p>
                </div>
            </div>
        ) : (
            <div className="space-y-6">
            
            {showSectionManager && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl animate-in slide-in-from-right-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Sections</h4>
                    <div className="flex gap-2 mb-3">
                        <input 
                            value={newSectionName}
                            onChange={e => setNewSectionName(e.target.value)}
                            placeholder="Add Area..."
                            className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button onClick={handleAddSection} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                        {availableSections.map(sec => (
                            <div key={sec} className="flex justify-between items-center px-2 py-1 hover:bg-white rounded transition-colors group">
                                <span className="text-xs font-bold text-gray-700">{sec}</span>
                                <button onClick={() => handleDeleteSection(sec)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3"/></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* EDITOR FORM */}
            <div className={`p-5 rounded-2xl border transition-all ${editingId ? 'bg-white border-blue-200 shadow-md ring-1 ring-blue-50' : 'bg-white border-gray-200'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-xs font-black uppercase tracking-widest ${editingId ? 'text-blue-700' : 'text-gray-500'}`}>
                        {editingId ? 'Object Properties' : 'Create Object'}
                    </h3>
                    {editingId ? (
                        <button onClick={handleCancelEdit} className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1">
                            <X className="w-3 h-3" /> Cancel
                        </button>
                    ) : (
                        <button 
                            onClick={() => {
                                setEditingId(null);
                                setFormData({ type: 'round', seats: 4, x: 50, y: 50, section: activeSection, color: '#e2e8f0', scale: 1, name: '' });
                            }} 
                            className="text-xs font-bold text-gray-400 hover:text-gray-600"
                        >
                            Reset
                        </button>
                    )}
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Display Label</label>
                        <input 
                        type="text" 
                        value={formData.name || ''}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. 14"
                        className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-black outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Seats</label>
                            <input 
                            type="number" 
                            value={formData.seats}
                            onChange={e => setFormData({...formData, seats: parseInt(e.target.value)})}
                            className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Shape</label>
                            <select 
                            value={formData.type}
                            onChange={e => setFormData({...formData, type: e.target.value as any})}
                            className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
                            >
                            <option value="round">Circular</option>
                            <option value="square">Square</option>
                            <option value="rect">Rectangular</option>
                            </select>
                        </div>
                    </div>

                    {/* Appearance */}
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                                <Palette className="w-3 h-3" /> Status Theme
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {PRESET_COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setFormData({...formData, color: c})}
                                        className={`w-8 h-8 rounded-full transition-transform hover:scale-110 border-2 ${formData.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110 border-white' : 'border-gray-100'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                <Maximize className="w-3 h-3" /> Scale Size: {formData.scale}x
                            </label>
                            <input 
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={formData.scale}
                                onChange={e => setFormData({...formData, scale: parseFloat(e.target.value)})}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>
                    </div>

                    {/* POSITION */}
                    <div className="pt-2 border-t border-gray-100">
                        <label className="text-[10px] font-black text-gray-400 uppercase mb-3 block flex items-center gap-2"><Move className="w-3 h-3"/> Layout Position</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-black text-gray-400 uppercase pl-1">Horizontal (X)</span>
                                <input 
                                    type="number" 
                                    value={formData.x} 
                                    onChange={e => setFormData({...formData, x: parseInt(e.target.value)})}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-black text-gray-400 uppercase pl-1">Vertical (Y)</span>
                                <input 
                                    type="number" 
                                    value={formData.y} 
                                    onChange={e => setFormData({...formData, y: parseInt(e.target.value)})}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        {editingId && (
                            <button 
                                onClick={() => onDeleteTable(editingId)}
                                className="px-5 py-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all group shadow-sm"
                                title="Delete Permanently"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                        <button 
                            onClick={handleSave}
                            disabled={!formData.name}
                            className={`flex-1 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                editingId 
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100' 
                                    : 'bg-gray-900 hover:bg-black text-white shadow-gray-400'
                            }`}
                        >
                            {editingId ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            {editingId ? 'Save Changes' : 'Add Object'}
                        </button>
                    </div>
                </div>
            </div>
            </div>
        )}
      </div>

    </div>
  );
};

export default TableManagementView;
