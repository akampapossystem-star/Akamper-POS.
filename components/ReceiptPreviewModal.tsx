
import React from 'react';
import { X, Printer, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Order, SystemConfig } from '../types';
import { generateReceiptHtml, printReceipt } from '../services/receiptService';

interface ReceiptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  systemConfig: SystemConfig;
  type: 'RECEIPT' | 'KITCHEN' | 'KITCHEN_UPDATE' | 'VOID' | 'BAR' | 'BAR_UPDATE' | 'SHIFT_REPORT';
  onConfirm?: () => void; 
  extraData?: any;
  printedBy?: string; // New: Pass the person's name
}

const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({ 
  isOpen, onClose, order, systemConfig, type, onConfirm, extraData, printedBy 
}) => {
  if (!isOpen) return null;

  const htmlContent = generateReceiptHtml(systemConfig, order, type, extraData, printedBy);
  const paperWidth = systemConfig.receipt.paperWidth || '80mm';

  const handlePrint = () => {
    printReceipt(systemConfig, order, type, extraData, printedBy);
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl"><Printer className="w-5 h-5 text-emerald-400" /></div>
            <div>
                <h3 className="text-lg font-black uppercase tracking-tight">Print Preview</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Verify details before printing</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            <div className="flex-1 bg-slate-100 p-8 overflow-y-auto custom-scrollbar flex justify-center">
                <div 
                    className="bg-white shadow-2xl p-0 h-fit" 
                    style={{ width: paperWidth, minHeight: 'auto', marginBottom: '20px' }}
                >
                    <iframe 
                        title="Receipt Content"
                        srcDoc={htmlContent}
                        className="w-full border-none pointer-events-none"
                        style={{ height: '700px' }}
                    />
                </div>
            </div>

            <div className="w-full md:w-64 bg-white border-l border-gray-100 p-8 flex flex-col gap-4 shrink-0">
                <div className="mb-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Output Mode</h4>
                    <div className="space-y-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Width</p>
                            <p className="text-sm font-black text-slate-700">{paperWidth}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Target</p>
                            <p className="text-sm font-black text-slate-700">{type.replace('_', ' ')}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-auto space-y-3">
                    <button onClick={handlePrint} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"><Printer className="w-5 h-5" /> Print Now</button>
                    <button onClick={onClose} className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-2 transition-all active:scale-95"><ArrowLeft className="w-5 h-5" /> Back</button>
                </div>
            </div>
        </div>
        <div className="bg-slate-50 px-6 py-3 border-t border-gray-100 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Authenticated by {printedBy}
            </p>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreviewModal;
