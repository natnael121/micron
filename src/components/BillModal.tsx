import React from 'react';
import { X, Receipt, CreditCard } from 'lucide-react';
import { TableBill } from '../types';
import { telegramService } from '../services/telegram';
import html2canvas from 'html2canvas';

interface BillModalProps {
  tableBill: TableBill | null;
  tableNumber: string;
  businessName: string;
  userId?: string;
  onClose: () => void;
  onPaymentOrder: () => void;
}



export const BillModal: React.FC<BillModalProps> = ({
  tableBill,
  tableNumber,
  businessName,
  userId,
  onClose,
  onPaymentOrder,
}) => {
  const billRef = React.useRef<HTMLDivElement>(null);

  const sendBillToTelegram = async () => {
    if (!tableBill || !billRef.current) return;

    try {
      // Capture the bill as an image
      const canvas = await html2canvas(billRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });
      
      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const file = new File([blob], `bill-table-${tableNumber}.png`, { type: 'image/png' });
        
        // Send to Telegram
        await telegramService.sendBillPhoto(
          URL.createObjectURL(blob),
          tableNumber,
          tableBill.total,
          userId
        );
        
        alert('Bill sent to Telegram successfully!');
      }, 'image/png');
    } catch (error) {
      console.error('Error sending bill to Telegram:', error);
      alert('Failed to send bill to Telegram');
    }
  };

  if (!tableBill) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
          <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold text-gray-900 mb-3">No Outstanding Bill</h2>
          <p className="text-gray-600 mb-5 text-sm">Table {tableNumber} has no current orders.</p>
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-sm w-full text-center shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Current Bill</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Close bill"
          >
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4" ref={billRef}>
          {/* Business Header */}
          <div className="text-center mb-6 pb-4 border-b border-gray-800">
            <h1 className="text-xl font-bold text-white">{businessName}</h1>
            <p className="text-gray-400">Table {tableNumber}</p>
            <p className="text-sm text-gray-500">
              {new Date(tableBill.updatedAt).toLocaleString()}
            </p>
          </div>

          {/* Bill Items */}
          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-white">Items Ordered</h3>
            {tableBill.items.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex justify-between items-center py-2 border-b border-gray-800">
                <div className="flex-1">
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-sm text-gray-400">
                    ${item.price.toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-white">${item.total.toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Bill Totals */}
          <div className="bg-gray-800 p-4 rounded-lg space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal:</span>
              <span className="font-medium text-white">${tableBill.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Tax ({((tableBill.tax / tableBill.subtotal) * 100).toFixed(0)}%):</span>
              <span className="font-medium text-white">${tableBill.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span className="text-white">Total:</span>
              <span className="text-yellow-400">${tableBill.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-4">
            <button
              onClick={onPaymentOrder}
              className="w-full bg-yellow-400 text-gray-900 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Pay Now
            </button>
            <p className="text-xs text-gray-400 text-center">
              You'll be able to select your payment method in the next step
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 bg-gray-800">
          <button
            onClick={onClose}
            className="w-full bg-gray-700 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition-colors"
          >
            Close Bill
          </button>
        </div>
      </div>
    </div>
  );
};