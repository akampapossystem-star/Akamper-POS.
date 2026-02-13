
import { Order, SystemConfig } from '../types';

/**
 * Generates the HTML string for the receipt.
 * Used for both Printing (iframe) and Previewing (modal).
 */
export const generateReceiptHtml = (
  config: SystemConfig, 
  order: Order | null, 
  type: 'RECEIPT' | 'KITCHEN' | 'KITCHEN_UPDATE' | 'VOID' | 'TEST' | 'BAR' | 'BAR_UPDATE' | 'SHIFT_REPORT',
  extraData?: any
): string => {
  const currency = config.currency || 'UGX';
  const fontSize = config.receipt.fontSize || 12;
  const paperWidth = config.receipt.paperWidth || '80mm';
  
  // HARDCODED CONTACTS AS REQUESTED
  const SUPPORT_PHONE = "+256 7413 50786";
  const SUPPORT_EMAIL = "akamperpos@gmail.com";

  let itemsHtml = '';
  if (order) {
    order.items.forEach(item => {
      itemsHtml += `
        <div class="item-row">
          <div class="item-qty">${item.quantity}x</div>
          <div class="item-name">
            ${item.product.name}
            ${item.note ? `<div class="item-note">* ${item.note}</div>` : ''}
          </div>
          ${!['KITCHEN', 'KITCHEN_UPDATE', 'BAR', 'BAR_UPDATE'].includes(type) ? 
            `<div class="item-price">${(item.product.price * item.quantity).toLocaleString()}</div>` : ''}
        </div>
      `;
    });
  }

  // --- SHIFT REPORT LOGIC ---
  if (type === 'SHIFT_REPORT' && extraData) {
      const d = extraData; // Short alias
      const now = new Date();
      
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Shift Report</title>
          <style>
            @page { size: auto; margin: 0mm; }
            html, body {
                height: auto;
                margin: 0;
                padding: 0;
                background: #fff;
            }
            body { 
                padding: 6.35mm 6.35mm 12.7mm 6.35mm; /* 1/4 inch sides, 1/2 inch bottom */
                width: ${paperWidth}; 
                font-family: 'Courier New', monospace; 
                font-size: ${fontSize}pt; 
                color: #000; 
                box-sizing: border-box;
            }
            .receipt-container { width: 100%; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .header { margin-bottom: 3mm; }
            .divider { border-top: 1px dashed #000; margin: 2mm 0; }
            .double-divider { border-top: 2px solid #000; margin: 2mm 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 1mm; }
            .section-title { font-weight: bold; text-decoration: underline; margin: 3mm 0 1mm 0; font-size: 1.1em; }
            .footer { margin-top: 5mm; font-size: 0.8em; text-align: center; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header text-center">
              <div class="bold" style="font-size: 1.3em;">${config.name}</div>
              <div>SHIFT / EOD REPORT</div>
              <div>${now.toLocaleDateString()} ${now.toLocaleTimeString()}</div>
              <div>Cashier: ${d.printedBy}</div>
            </div>

            <div class="double-divider"></div>

            <div class="section-title">SALES SUMMARY</div>
            <div class="row"><span>Total Orders:</span> <span class="bold">${d.totalOrders}</span></div>
            <div class="row"><span>Gross Revenue:</span> <span class="bold">${currency} ${d.totalRevenue.toLocaleString()}</span></div>
            <div class="row"><span>Debt/Credit:</span> <span>${currency} ${d.due.toLocaleString()}</span></div>

            <div class="divider"></div>

            <div class="section-title">PAYMENT BREAKDOWN</div>
            <div class="row"><span>CASH SALES:</span> <span class="bold">${currency} ${d.cash.toLocaleString()}</span></div>
            <div class="row"><span>MOBILE MONEY:</span> <span>${currency} ${d.momo.toLocaleString()}</span></div>
            <div class="row"><span>CARD / POS:</span> <span>${currency} ${d.card.toLocaleString()}</span></div>
            <div class="row"><span>BANK TRANSFER:</span> <span>${currency} ${d.bank.toLocaleString()}</span></div>
            <div class="row"><span>SALARY DEDUCT:</span> <span>${currency} ${d.salaryPay.toLocaleString()}</span></div>
            <div class="row"><span>OTHER:</span> <span>${currency} ${d.others.toLocaleString()}</span></div>

            <div class="divider"></div>

            <div class="section-title text-center">*** CASH DRAWER ***</div>
            <div class="row"><span>Opening Float:</span> <span>${currency} ${d.openingCash.toLocaleString()}</span></div>
            <div class="row"><span>+ Cash Sales:</span> <span>${currency} ${d.cash.toLocaleString()}</span></div>
            <div class="divider"></div>
            <div class="row bold" style="font-size: 1.2em;">
                <span>EXPECTED CASH:</span>
                <span>${currency} ${(d.openingCash + d.cash).toLocaleString()}</span>
            </div>

            <div class="footer">
                <div style="margin-top: 5mm; border-top: 1px solid #000; padding-top: 2mm;">
                    Manager Signature
                </div>
                <br/>
                Powered by Akamper POS
            </div>
          </div>
        </body>
        </html>
      `;
  }

  const headerTitle = {
    'RECEIPT': config.name,
    'KITCHEN': 'KITCHEN ORDER',
    'BAR': 'BAR ORDER',
    'KITCHEN_UPDATE': '** ADD-ON ORDER **',
    'BAR_UPDATE': '** ADD-ON ORDER **',
    'VOID': '** VOID SLIP **',
    'TEST': 'SYSTEM PRINT TEST'
  }[type] || config.name;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${headerTitle}</title>
      <style>
        /* Force printer to use roll settings, removing default headers/footers/margins */
        @page {
            size: auto;
            margin: 0mm;
        }
        html, body {
            height: auto;
            margin: 0;
            padding: 0;
            background: #fff;
        }
        body {
          /* 6.35mm ~= 1/4 inch side/top margins. 12.7mm ~= 1/2 inch bottom margin */
          padding: 6.35mm 6.35mm 12.7mm 6.35mm;
          width: ${paperWidth};
          font-family: 'Courier New', monospace;
          font-size: ${fontSize}pt;
          color: #000;
          box-sizing: border-box; /* Ensures padding includes width */
        }
        .receipt-container { 
            width: 100%; 
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .header { margin-bottom: 3mm; }
        .logo { max-width: 60%; height: auto; display: block; margin: 0 auto 2mm auto; }
        .divider { border-top: 1px dashed #000; margin: 2mm 0; }
        .meta-row { display: flex; justify-content: space-between; font-size: 0.9em; margin-bottom: 0.5mm; }
        
        .item-row { 
            display: flex; 
            align-items: flex-start; 
            margin-bottom: 1.5mm; 
        }
        .item-qty { 
            width: 10%; 
            font-weight: bold; 
            flex-shrink: 0; 
        }
        .item-name { 
            width: 60%; 
            padding-right: 2mm;
            overflow-wrap: break-word; 
            word-wrap: break-word;
            word-break: break-word;
        }
        .item-price { 
            width: 30%; 
            text-align: right; 
            font-weight: bold; 
            flex-shrink: 0; 
        }
        .item-note { font-style: italic; font-size: 0.85em; margin-top: 0.5mm; }
        
        .total-section { margin-top: 3mm; font-size: 1.1em; }
        .footer { margin-top: 5mm; font-size: 0.8em; line-height: 1.3; }
        .status-badge { 
           display: block; 
           text-align: center; 
           border: 2px solid #000; 
           padding: 1.5mm; 
           margin: 3mm 0;
           font-weight: 900;
           text-transform: uppercase;
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header text-center">
          ${(config.receipt.showLogo && config.logo) ? `<img src="${config.logo}" class="logo" />` : ''}
          <div class="bold" style="font-size: 1.2em;">${headerTitle}</div>
          ${type === 'RECEIPT' && config.receipt.headerText ? `<div style="margin-top: 1mm; white-space: pre-wrap;">${config.receipt.headerText}</div>` : ''}
          ${config.receipt.headerPhone ? `<div>Tel: ${config.receipt.headerPhone}</div>` : ''}
          ${config.receipt.headerEmail ? `<div>Email: ${config.receipt.headerEmail}</div>` : ''}
        </div>

        <div class="divider"></div>

        ${order ? `
          <div class="meta-row"><span>Date:</span> <span>${new Date(order.timestamp).toLocaleDateString()} ${new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
          <div class="meta-row"><span>Ticket #:</span> <span class="bold">${order.id.slice(-6).toUpperCase()}</span></div>
          <div class="meta-row"><span class="bold">Table:</span> <span class="bold" style="font-size: 1.1em;">${order.table}</span></div>
          <div class="meta-row"><span>Waiter:</span> <span>${(order.staffName || 'N/A').toUpperCase()}</span></div>
        ` : ''}

        <div class="divider"></div>

        <div class="items">
          ${itemsHtml}
        </div>

        <div class="divider"></div>

        ${!['KITCHEN', 'KITCHEN_UPDATE', 'BAR', 'BAR_UPDATE'].includes(type) && order ? `
          <div class="total-section">
            <div class="meta-row bold">
              <span>TOTAL</span>
              <span>${currency} ${order.grandTotal.toLocaleString()}</span>
            </div>
            ${order.paymentMethod ? `
              <div class="meta-row" style="font-size: 0.8em; margin-top: 2mm;">
                <span>Method:</span>
                <span>${order.paymentMethod.replace('_', ' ')}</span>
              </div>
            ` : ''}
            ${order.paymentMethod === 'SALARY_PAY' ? `
              <div class="status-badge">Salary Deduction</div>
              <div class="text-center bold" style="font-size: 0.9em;">Staff: ${order.customerName.replace(' (Staff)', '')}</div>
            ` : ''}
          </div>
        ` : ''}

        ${type === 'VOID' && extraData ? `
          <div class="status-badge">CANCELLED</div>
          <div class="text-center" style="margin-bottom: 5mm;">${extraData.reason || 'No reason provided'}</div>
          <div class="meta-row"><span>Auth:</span> <span>${extraData.authorizedBy || 'Admin'}</span></div>
        ` : ''}

        <div class="footer text-center">
          ${['KITCHEN', 'KITCHEN_UPDATE', 'BAR', 'BAR_UPDATE'].includes(type) ? `
            <div class="bold" style="font-size: 1.2em;">--- END ORDER ---</div>
          ` : `
            ${config.receipt.footerText ? `<div style="white-space: pre-wrap;">${config.receipt.footerText}</div>` : ''}
            
            <div style="margin-top: 3mm; font-weight: bold; font-size: 0.9em; border-top: 1px dotted #000; padding-top: 2mm;">SYSTEM SUPPORT</div>
            <div>${SUPPORT_PHONE}</div>
            
            <div style="margin-top: 4mm; font-size: 0.7em;">Powered by Akamper POS</div>
          `}
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Prints the receipt silently using an invisible iframe.
 * Uses a robust loading strategy to ensure content is ready before printing.
 */
export const printReceipt = (
  config: SystemConfig, 
  order: Order | null, 
  type: 'RECEIPT' | 'KITCHEN' | 'KITCHEN_UPDATE' | 'VOID' | 'TEST' | 'BAR' | 'BAR_UPDATE' | 'SHIFT_REPORT',
  extraData?: any
) => {
  // 1. Generate Content
  const htmlContent = generateReceiptHtml(config, order, type, extraData);

  // 2. Create Hidden Iframe
  // Use position absolute off-screen instead of visibility:hidden to avoid some browser rendering optimizations that block printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '-9999px';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  // 3. Define Print Function
  const triggerPrint = () => {
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
    } catch (e) {
      console.error("Printing failed", e);
    } finally {
      // Cleanup after a delay
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }
  };

  // 4. Attach Load Listener BEFORE Writing Content
  // This ensures we don't miss the load event if it fires synchronously or very fast
  iframe.onload = triggerPrint;

  // 5. Write to Iframe
  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();
  } else {
    console.error("Iframe document not accessible");
    if (document.body.contains(iframe)) document.body.removeChild(iframe);
  }
};

export const printTestReceipt = (config: SystemConfig) => {
    printReceipt(config, null, 'TEST');
};
