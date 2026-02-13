
import React, { useState } from 'react';
import { Briefcase, UserPlus, Trash2, Phone, Clock, Edit, Power, CheckCircle2, XCircle, Palette, ImageIcon, Upload, User, ShieldCheck, Lock, AlertCircle, ScanFace, Fingerprint, CalendarCheck, X, AlertTriangle, ShieldAlert, Zap } from 'lucide-react';
import { StaffMember, SystemConfig, UserRole, AttendanceRecord } from '../types';

interface HRMViewProps {
  staff: StaffMember[];
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  systemConfig: SystemConfig;
  currentUser: StaffMember | null;
  attendanceRecords: AttendanceRecord[];
  onUpdateAttendance: (record: AttendanceRecord) => void;
}

const HRMView: React.FC<HRMViewProps> = ({ staff, setStaff, systemConfig, currentUser, attendanceRecords = [], onUpdateAttendance }) => {
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'ATTENDANCE'>('DIRECTORY');
  
  // Staff Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState<Partial<StaffMember>>({ role: 'WAITER', status: 'active', uniformColor: '#10B981' });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Biometric Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanPin, setScanPin] = useState('');
  const [scanningState, setScanningState] = useState<'IDLE' | 'SCANNING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [scanMessage, setScanMessage] = useState('');

  // MASTER AUTHORITY LOGIC:
  // Identify if current session is the Master Root or an Impersonating Admin
  const isMasterAdmin = currentUser?.id === 'ROOT' || currentUser?.id?.startsWith('MASTER_OVERRIDE');
  const isTenantOwner = currentUser?.role === 'OWNER';
  const hasFullAccess = isMasterAdmin || isTenantOwner;
  const canManageStaff = ['MANAGER', 'OWNER'].includes(currentUser?.role || '');

  // Helper: Can Edit?
  const canEditMember = (member: StaffMember) => {
      // Special protection for ROOT account: Only the actual ROOT user can edit/view ROOT
      if (member.id === 'ROOT' && currentUser?.id !== 'ROOT') return false;

      if (isMasterAdmin) return true; // Master can edit anything
      if (isTenantOwner) return true; // Owners can edit anything
      if (currentUser?.role === 'MANAGER') {
          if (member.role === 'OWNER') return false;
          if (member.role === 'MANAGER' && member.isProtected) return false;
          return true; 
      }
      return false;
  };

  // Helper: Can Delete?
  const canDeleteMember = (member: StaffMember) => {
      if (member.id === 'ROOT') return false; // ROOT cannot be deleted by anyone

      if (isMasterAdmin) return true; // Master bypasses all protections
      if (isTenantOwner) return true; // Tenant Owner can delete anyone
      if (currentUser?.role === 'MANAGER') {
          if (member.isProtected) return false;
          if (member.role === 'OWNER' || member.role === 'MANAGER') return false;
          return true;
      }
      return false;
  };

  const COLOR_PALETTE = [
    { name: 'Emerald Green', value: '#10B981' },
    { name: 'Royal Blue', value: '#3B82F6' },
    { name: 'Purple Haze', value: '#8B5CF6' },
    { name: 'Sunset Orange', value: '#F97316' },
    { name: 'Crimson Red', value: '#EF4444' },
    { name: 'Slate Dark', value: '#1E293B' },
    { name: 'Pink Rose', value: '#EC4899' },
    { name: 'Cyan Sky', value: '#06B6D4' },
  ];

  // --- STAFF MANAGEMENT LOGIC ---

  const closeModal = () => {
    setIsModalOpen(false);
    setNewStaff({ role: 'WAITER', status: 'active', uniformColor: '#10B981' });
    setEditingId(null);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageStaff) {
        alert("Permission Denied: Only Managers and Owners can add/edit staff.");
        return;
    }
    if (!newStaff.name || !newStaff.pin) return;
    
    if (newStaff.pin.length !== 6) {
        alert("PIN must be exactly 6 digits.");
        return;
    }

    if (editingId) {
        const existing = staff.find(s => s.id === editingId);
        if (existing && !canEditMember(existing)) {
            alert("Restricted: You do not have permission to modify this account.");
            return;
        }
        setStaff(prev => prev.map(s => s.id === editingId ? { ...s, ...newStaff } as StaffMember : s));
    } else {
        const member: StaffMember = {
            id: `S${Math.floor(Math.random() * 10000)}`,
            name: newStaff.name!,
            role: newStaff.role as UserRole,
            pin: newStaff.pin!,
            contact: newStaff.contact || '',
            status: newStaff.status || 'active',
            schedule: newStaff.schedule || 'Mon-Fri, 9am - 5pm',
            uniformColor: newStaff.uniformColor || '#10B981',
            photoUrl: newStaff.photoUrl,
            isProtected: hasFullAccess ? newStaff.isProtected : false
        };
        setStaff(prev => [...prev, member]);
    }
    closeModal();
  };

  const deleteStaff = (id: string) => {
    if (!canManageStaff) {
        alert("Permission Denied: Only Managers and Owners can delete staff.");
        return;
    }
    const member = staff.find(s => s.id === id);
    
    if (member && !canDeleteMember(member)) {
        alert("Restricted: You do not have permission to remove this account.");
        return;
    }

    const confirmMsg = isMasterAdmin && member?.isProtected 
        ? `⚠️ MASTER OVERRIDE: You are about to permanently delete a PROTECTED account (${member.name}). This will remove all their access immediately. Proceed?`
        : `Permanently remove ${member?.name || 'this staff member'} from the system? This action cannot be undone.`;

    if(confirm(confirmMsg)) {
      setStaff(prev => prev.filter(s => s.id !== id));
    }
  };

  const toggleStatus = (member: StaffMember) => {
      if (!canEditMember(member)) return;
      const newStatus = member.status === 'active' ? 'inactive' : 'active';
      setStaff(prev => prev.map(s => s.id === member.id ? { ...s, status: newStatus } : s));
  };

  const openAddModal = () => {
      setNewStaff({ role: 'WAITER', status: 'active', uniformColor: '#10B981' });
      setEditingId(null);
      setIsModalOpen(true);
  };

  const openEditModal = (member: StaffMember) => {
      if (!canEditMember(member)) return;
      setNewStaff({ ...member });
      setEditingId(member.id);
      setIsModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewStaff(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- ATTENDANCE LOGIC ---

  const handleBiometricScan = () => {
      if (!scanPin) return;
      setScanningState('SCANNING');
      setScanMessage('Scanning fingerprint...');

      setTimeout(() => {
          const member = staff.find(s => s.pin === scanPin);
          if (member) {
              const todayStr = new Date().toISOString().split('T')[0];
              const existingRecord = attendanceRecords.find(r => r.staffId === member.id && r.date === todayStr);

              if (existingRecord) {
                  if (existingRecord.status === 'COMPLETED') {
                      setScanningState('ERROR');
                      setScanMessage(`Already clocked out for today, ${member.name}.`);
                  } else {
                      const updatedRecord: AttendanceRecord = {
                          ...existingRecord,
                          clockOut: new Date(),
                          status: 'COMPLETED'
                      };
                      onUpdateAttendance(updatedRecord);
                      setScanningState('SUCCESS');
                      setScanMessage(`Goodbye, ${member.name}. Clocked out at ${new Date().toLocaleTimeString()}.`);
                  }
              } else {
                  const newRecord: AttendanceRecord = {
                      id: `ATT-${Date.now()}`,
                      staffId: member.id,
                      staffName: member.name,
                      date: todayStr,
                      clockIn: new Date(),
                      clockOut: null,
                      status: 'PRESENT'
                  };
                  onUpdateAttendance(newRecord);
                  setScanningState('SUCCESS');
                  setScanMessage(`Welcome, ${member.name}. Clocked in at ${new Date().toLocaleTimeString()}.`);
              }
          } else {
              setScanningState('ERROR');
              setScanMessage('Biometric match failed. Invalid PIN.');
          }
          setScanPin('');
      }, 1500);
  };

  const handleCloseScanner = () => {
      setIsScannerOpen(false);
      setScanningState('IDLE');
      setScanMessage('');
      setScanPin('');
  };

  const getDuration = (start: Date, end: Date | null) => {
      if (!end) return 'Active';
      const diff = end.getTime() - start.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      return `${hours}h ${minutes}m`;
  };

  const todayRecords = [...(attendanceRecords || [])].sort((a,b) => b.clockIn.getTime() - a.clockIn.getTime());

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50 flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-blue-600" /> HRM
          </h1>
          <p className="text-gray-500 font-medium">Manage employees, roles, attendance, and access.</p>
        </div>
        
        <div className="flex gap-2">
            {/* MASTER MODE INDICATOR */}
            {isMasterAdmin && (
                <div className="hidden lg:flex items-center gap-2 px-4 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-200 border border-indigo-400/50 mr-4">
                    <Zap className="w-4 h-4 text-yellow-300 animate-pulse" /> Master Admin Mode
                </div>
            )}

            <div className="bg-gray-100 p-1 rounded-xl flex">
                <button 
                    onClick={() => setActiveTab('DIRECTORY')}
                    className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'DIRECTORY' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Directory
                </button>
                <button 
                    onClick={() => setActiveTab('ATTENDANCE')}
                    className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'ATTENDANCE' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Time & Attendance
                </button>
            </div>

            {activeTab === 'DIRECTORY' && canManageStaff && (
                <button 
                onClick={openAddModal}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                <UserPlus className="w-5 h-5" /> Add Staff
                </button>
            )}
        </div>
      </div>

      {!canManageStaff && activeTab === 'DIRECTORY' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                  <h4 className="text-sm font-bold text-red-800 uppercase tracking-tight">View Only Mode</h4>
                  <p className="text-xs text-red-600 mt-1">You are viewing the staff directory. Management actions are restricted to Managers and Owners.</p>
              </div>
          </div>
      )}

      {activeTab === 'DIRECTORY' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {staff.map(member => (
              <div key={member.id} className={`bg-white rounded-3xl border shadow-sm overflow-hidden hover:shadow-md transition-all group ${member.isProtected ? 'border-indigo-200 ring-1 ring-indigo-50' : 'border-gray-100'}`}>
                 <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                       <div className="flex items-center gap-4">
                          {member.photoUrl ? (
                              <img src={member.photoUrl} alt={member.name} className="w-14 h-14 rounded-2xl object-cover shadow-md border-2 border-white" />
                          ) : (
                              <div 
                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md"
                                style={{ backgroundColor: member.uniformColor || '#10B981' }}
                              >
                                 {member.name.charAt(0)}
                              </div>
                          )}
                          <div>
                             <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                 {member.name}
                                 {member.isProtected && (
                                     <ShieldCheck className="w-4 h-4 text-indigo-500" title="Business Controller (Protected)" />
                                 )}
                             </h3>
                             <div className="flex items-center gap-2">
                                {member.isProtected ? (
                                    <span className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded tracking-widest">Controller</span>
                                ) : (
                                    <span className="text-xs font-black uppercase text-gray-400 tracking-widest">{member.role?.replace('_', ' ')}</span>
                                )}
                                <span className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                             </div>
                          </div>
                       </div>
                       
                       {canEditMember(member) && (
                            <button 
                                onClick={() => toggleStatus(member)}
                                className={`p-2 rounded-xl transition-colors ${member.status === 'active' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                title={member.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                            >
                                <Power className="w-5 h-5" />
                            </button>
                       )}
                    </div>

                    <div className="space-y-3 pt-2">
                       <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                          <Phone className="w-4 h-4 text-gray-400" /> 
                          <span className="font-medium">{member.contact || 'No contact info'}</span>
                       </div>
                       <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{member.schedule || 'Standard Shift'}</span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
                    <div className="text-xs font-mono text-gray-400 font-bold">
                        PIN: {canEditMember(member) ? member.pin : '••••••'}
                    </div>
                    
                    <div className="flex gap-2">
                       {canEditMember(member) ? (
                           <>
                            <button 
                                onClick={() => openEditModal(member)}
                                className="p-2 bg-white border border-gray-200 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Staff Details"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            {canDeleteMember(member) ? (
                                <button 
                                    onClick={() => deleteStaff(member.id)}
                                    className={`p-2 rounded-lg transition-all ${isMasterAdmin ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm' : 'bg-white border border-gray-200 text-red-500 hover:bg-red-50'}`}
                                    title={isMasterAdmin ? "Master Force Delete" : "Delete Staff"}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            ) : (
                                <button disabled className="p-2 bg-gray-100 text-gray-300 rounded-lg cursor-not-allowed" title="Account Protected">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                           </>
                       ) : (
                           <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded">
                               <Lock className="w-3 h-3" /> Locked
                           </div>
                       )}
                    </div>
                 </div>
              </div>
            ))}
          </div>
      ) : (
          <div className="flex flex-col h-full space-y-6">
              <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div>
                      <h2 className="text-lg font-black uppercase tracking-tight text-gray-800">Daily Attendance Log</h2>
                      <p className="text-gray-500 text-sm">Monitor staff arrival and departure times.</p>
                  </div>
                  <button 
                    onClick={() => setIsScannerOpen(true)}
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase flex items-center gap-3 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                  >
                      <Fingerprint className="w-6 h-6" /> Launch Biometric Scanner
                  </button>
              </div>

              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex-1">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead>
                              <tr className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                                  <th className="px-6 py-4">Date</th>
                                  <th className="px-6 py-4">Staff Member</th>
                                  <th className="px-6 py-4">Arrival Time</th>
                                  <th className="px-6 py-4">Departure Time</th>
                                  <th className="px-6 py-4">Duration</th>
                                  <th className="px-6 py-4 text-center">Status</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-sm font-bold text-gray-700">
                              {todayRecords.length === 0 ? (
                                  <tr><td colSpan={6} className="p-10 text-center text-gray-400">No attendance records for today.</td></tr>
                              ) : (
                                  todayRecords.map(record => (
                                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                          <td className="px-6 py-4 text-gray-500 font-medium">{record.date}</td>
                                          <td className="px-6 py-4 text-gray-800 text-lg">{record.staffName}</td>
                                          <td className="px-6 py-4 text-green-600 font-mono">
                                              {record.clockIn.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                          </td>
                                          <td className="px-6 py-4 text-red-500 font-mono">
                                              {record.clockOut ? record.clockOut.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                          </td>
                                          <td className="px-6 py-4 text-gray-500">
                                              {getDuration(record.clockIn, record.clockOut)}
                                          </td>
                                          <td className="px-6 py-4 text-center">
                                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                  record.status === 'PRESENT' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                              }`}>
                                                  {record.status === 'PRESENT' ? 'Present' : 'Clocked Out'}
                                              </span>
                                          </td>
                                      </tr>
                                  ))
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* Staff Modal */}
      {isModalOpen && canManageStaff && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className={`p-8 flex justify-between items-center text-white ${isMasterAdmin ? 'bg-indigo-600' : 'bg-blue-600'}`}>
                 <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">{editingId ? 'Edit Staff' : 'New Staff'}</h2>
                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">
                        {isMasterAdmin ? 'Master Administrative Control' : 'Employee Details'}
                    </p>
                 </div>
                 <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-full transition-colors"><XCircle className="w-6 h-6" /></button>
              </div>
              
              <form onSubmit={handleSaveStaff} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                    <input 
                       required 
                       value={newStaff.name || ''} 
                       onChange={e => setNewStaff({...newStaff, name: e.target.value})} 
                       className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700"
                       placeholder="e.g. John Doe"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</label>
                       <select 
                          value={newStaff.role} 
                          onChange={e => setNewStaff({...newStaff, role: e.target.value as UserRole})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700 appearance-none"
                          disabled={newStaff.isProtected && !hasFullAccess}
                       >
                          <option value="WAITER">Waiter</option>
                          <option value="CASHIER">Cashier</option>
                          <option value="CHEF">Chef</option>
                          <option value="MANAGER">Manager</option>
                          <option value="OWNER">Owner (Full Access)</option>
                          <option value="BARMAN">Barman</option>
                          <option value="BARISTA">Barista</option>
                          <option value="STORE_KEEPER">Store Keeper</option>
                          <option value="HEAD_BAKER">Head Baker</option>
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Access PIN (6-Digits)</label>
                       <input 
                          required 
                          maxLength={6}
                          value={newStaff.pin || ''} 
                          onChange={e => setNewStaff({...newStaff, pin: e.target.value})} 
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-gray-700 text-center tracking-[0.5em]"
                          placeholder="000000"
                       />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Number</label>
                    <input 
                       value={newStaff.contact || ''} 
                       onChange={e => setNewStaff({...newStaff, contact: e.target.value})} 
                       className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700"
                       placeholder="+256..."
                    />
                 </div>

                 {hasFullAccess && (
                     <div className="space-y-1 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox"
                                checked={newStaff.isProtected || false}
                                onChange={e => setNewStaff({...newStaff, isProtected: e.target.checked, role: e.target.checked ? 'OWNER' : newStaff.role})}
                                className="w-4 h-4 text-indigo-600 rounded"
                            />
                            <span className="text-xs font-bold text-indigo-800">Set as Business Controller (Protected)</span>
                        </label>
                        <p className="text-[10px] text-indigo-600/70 pl-6">Protected staff cannot be removed by Managers. Only Owners can edit.</p>
                     </div>
                 )}

                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <ImageIcon className="w-3 h-3" /> Staff Photo
                    </label>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden group shrink-0">
                            {newStaff.photoUrl ? (
                                <img src={newStaff.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-6 h-6 text-gray-400" />
                            )}
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handlePhotoUpload} 
                                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                                title="Upload from device"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <Upload className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <div className="flex-1">
                             <input 
                                value={newStaff.photoUrl || ''} 
                                onChange={e => setNewStaff({...newStaff, photoUrl: e.target.value})} 
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-xs text-gray-600 mb-1"
                                placeholder="https:// or upload..."
                             />
                             <p className="text-[9px] text-gray-400">Click the box to upload image from device/disk</p>
                        </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <Palette className="w-3 h-3" /> Avatar Color
                    </label>
                    <div className="flex gap-2 flex-wrap">
                       {COLOR_PALETTE.map((color) => (
                          <button
                             key={color.value}
                             type="button"
                             onClick={() => setNewStaff({...newStaff, uniformColor: color.value})}
                             className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${newStaff.uniformColor === color.value ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''}`}
                             style={{ backgroundColor: color.value }}
                             title={color.name}
                          />
                       ))}
                    </div>
                 </div>

                 <button className={`w-full py-4 text-white rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-2 mt-4 active:scale-95 transition-all ${isMasterAdmin ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}>
                    <CheckCircle2 className="w-6 h-6" /> Save Staff Member
                 </button>

                 {/* ADMINISTRATIVE DELETE OPTION */}
                 {editingId && hasFullAccess && (
                     <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-xl space-y-3">
                        <h4 className="text-xs font-black text-red-800 uppercase tracking-widest flex items-center gap-2">
                           <ShieldAlert className="w-4 h-4" /> {isMasterAdmin ? 'Master Administrative Control' : 'Owner Control Zone'}
                        </h4>
                        <p className="text-[10px] text-red-600 leading-relaxed">
                           {isMasterAdmin 
                             ? 'You are authorized to permanently remove any staff profile from the system. This bypasses all standard protections.' 
                             : 'As the Primary Administrator, you can permanently delete this staff profile. This action cannot be undone.'}
                        </p>
                        <button 
                           type="button"
                           onClick={() => { deleteStaff(editingId); closeModal(); }}
                           className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-red-200 transition-all active:scale-95"
                        >
                           <Trash2 className="w-4 h-4" /> {isMasterAdmin ? 'Force Delete Permanently' : 'Delete Staff Member Permanently'}
                        </button>
                     </div>
                 )}
              </form>
           </div>
        </div>
      )}

      {/* BIOMETRIC SCANNER MODAL */}
      {isScannerOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
              <div className="bg-gray-900 w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden border border-gray-800 animate-in zoom-in-95 duration-200 relative">
                  <button onClick={handleCloseScanner} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
                      <X className="w-6 h-6" />
                  </button>

                  <div className="p-10 flex flex-col items-center justify-center min-h-[500px]">
                      <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">Staff Attendance</h2>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-10">Biometric Verification</p>

                      <div className="relative mb-10 group cursor-pointer" onClick={handleBiometricScan}>
                          <div className={`w-32 h-32 rounded-3xl flex items-center justify-center transition-all duration-300 border-2 ${
                              scanningState === 'SCANNING' ? 'bg-indigo-500/20 border-indigo-500 animate-pulse' :
                              scanningState === 'SUCCESS' ? 'bg-green-500/20 border-green-500' :
                              scanningState === 'ERROR' ? 'bg-red-500/20 border-red-500' :
                              'bg-gray-800 border-gray-700 hover:border-gray-500'
                          }`}>
                              <Fingerprint className={`w-20 h-20 transition-all ${
                                  scanningState === 'SCANNING' ? 'text-indigo-400' :
                                  scanningState === 'SUCCESS' ? 'text-green-400' :
                                  scanningState === 'ERROR' ? 'text-red-400' :
                                  'text-gray-500 group-hover:text-gray-300'
                              }`} />
                          </div>
                          {scanningState === 'SCANNING' && (
                              <div className="absolute inset-0 border-t-2 border-indigo-400 animate-scan rounded-3xl pointer-events-none"></div>
                          )}
                      </div>

                      {scanningState === 'IDLE' && (
                          <div className="w-full max-w-[200px] space-y-4">
                              <input 
                                  autoFocus
                                  type="password"
                                  maxLength={6}
                                  value={scanPin}
                                  onChange={e => setScanPin(e.target.value)}
                                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-center text-white font-mono text-lg tracking-[0.5em] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                  placeholder="------"
                              />
                              <p className="text-center text-gray-500 text-xs uppercase font-bold">Enter PIN & Click Fingerprint</p>
                          </div>
                      )}

                      <div className="h-8 flex items-center justify-center">
                          {scanMessage && (
                              <p className={`text-sm font-bold text-center animate-in fade-in slide-in-from-bottom-2 ${
                                  scanningState === 'SUCCESS' ? 'text-green-400' :
                                  scanningState === 'ERROR' ? 'text-red-400' :
                                  'text-indigo-400'
                              }`}>
                                  {scanMessage}
                              </p>
                          )}
                      </div>
                  </div>
                  <div className="bg-gray-800/50 p-4 text-center">
                      <p className="text-[10px] text-gray-600 font-mono">SECURE BIOMETRIC LINK v2.0</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default HRMView;
