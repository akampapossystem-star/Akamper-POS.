
import React, { useState } from 'react';
import { Clock, Download, Printer, User } from 'lucide-react';
import { ShiftLog, SystemConfig } from '../types';

interface DayShiftsViewProps {
  shifts: ShiftLog[];
  systemConfig: SystemConfig;
}

const DayShiftsView: React.FC<DayShiftsViewProps> = ({ shifts, systemConfig }) => {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      
      {/* Header */}
      <div className="shrink-0 p-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-600" /> Day Shifts Log
            </h1>
            <p className="text-gray-500 font-medium">History of register openings and closures.</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-gray-50">
                <Download className="w-4 h-4" /> Export CSV
            </button>
            <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-gray-50">
                <Printer className="w-4 h-4" /> Print Log
            </button>
          </div>
        </div>
      </div>

      {/* Table (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-8 pt-4">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 sticky top-0 z-10 shadow-sm">
                <th className="px-6 py-4">Shift ID</th>
                <th className="px-6 py-4">Opened By</th>
                <th className="px-6 py-4">Start Time</th>
                <th className="px-6 py-4">End Time</th>
                <th className="px-6 py-4 text-right">Opening Cash</th>
                <th className="px-6 py-4 text-right">Closing Cash</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shifts.map(shift => (
                <tr key={shift.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-xs text-gray-500">{shift.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <User className="w-4 h-4 text-blue-500" /> {shift.openedBy}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600">
                    {shift.openedAt.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600">
                    {shift.closedAt ? shift.closedAt.toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-gray-800">
                    {systemConfig.currency} {shift.openingCash.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-gray-800">
                    {shift.closingCash !== null ? `${systemConfig.currency} ${shift.closingCash.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        shift.status === 'OPEN' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                        {shift.status}
                    </span>
                  </td>
                </tr>
              ))}
              {shifts.length === 0 && (
                <tr>
                    <td colSpan={7} className="p-10 text-center text-gray-400 font-bold uppercase text-xs">No shift history found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DayShiftsView;
