import React, { useState, useEffect } from 'react';
import { Download, Eye, Send, Check, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { firebaseService } from '../../services/firebase';
import { Bill } from '../../types';
import { format } from 'date-fns';

export const BillManagement: React.FC = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  useEffect(() => {
    if (user) {
      loadBills();
    }
  }, [user]);

  const loadBills = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const billsList = await firebaseService.getBills(user.id);
      setBills(billsList);
    } catch (error) {
      console.error('Error loading bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBillStatus = async (billId: string, status: Bill['status']) => {
    try {
      await firebaseService.updateBill(billId, { status });
      setBills(prev => prev.map(bill => 
        bill.id === billId ? { ...bill, status } : bill
      ));
      if (selectedBill?.id === billId) {
        setSelectedBill(prev => prev ? { ...prev, status } : null);
      }
    } catch (error) {
      console.error('Error updating bill status:', error);
      alert('Failed to update bill status');
    }
  };

  const getStatusColor = (status: Bill['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportBills = () => {
    const csvContent = [
      ['Bill ID', 'Order ID', 'Table', 'Subtotal', 'Tax', 'Total', 'Status', 'Date'].join(','),
      ...bills.map(bill => [
        bill.id,
        bill.orderId,
        bill.tableNumber,
        bill.subtotal.toFixed(2),
        bill.tax.toFixed(2),
        bill.total.toFixed(2),
        bill.status,
        format(new Date(bill.timestamp), 'yyyy-MM-dd HH:mm')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bills-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printBill = (bill: Bill) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill #${bill.id.slice(0, 8)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .bill-info { margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .total-section { text-align: right; margin-top: 20px; }
            .total-line { margin: 5px 0; }
            .final-total { font-weight: bold; font-size: 1.2em; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${user?.businessName || 'Restaurant'}</h1>
            <h2>Invoice</h2>
          </div>
          
          <div class="bill-info">
            <p><strong>Bill ID:</strong> ${bill.id}</p>
            <p><strong>Table:</strong> ${bill.tableNumber}</p>
            <p><strong>Date:</strong> ${format(new Date(bill.timestamp), 'MMM dd, yyyy HH:mm')}</p>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.price.toFixed(2)}</td>
                  <td>$${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-line">Subtotal: $${bill.subtotal.toFixed(2)}</div>
            <div class="total-line">Tax (15%): $${bill.tax.toFixed(2)}</div>
            <div class="total-line final-total">Total: $${bill.total.toFixed(2)}</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bill Management</h1>
          <p className="text-gray-600">Manage invoices and billing</p>
        </div>
        <button
          onClick={exportBills}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export Bills</span>
        </button>
      </div>

      {/* Bills List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bill Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Bill #{bill.id.slice(0, 8)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(bill.timestamp), 'MMM dd, yyyy HH:mm')}
                      </div>
                      <div className="text-xs text-gray-400">
                        Order: {bill.orderId.slice(0, 8)}...
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Table {bill.tableNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>Subtotal: ${bill.subtotal.toFixed(2)}</div>
                      <div>Tax: ${bill.tax.toFixed(2)}</div>
                      <div className="font-medium">Total: ${bill.total.toFixed(2)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bill.status)}`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedBill(bill)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => printBill(bill)}
                        className="text-green-600 hover:text-green-900"
                        title="Print Bill"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {bill.status === 'draft' && (
                        <button
                          onClick={() => updateBillStatus(bill.id, 'sent')}
                          className="text-blue-600 hover:text-blue-900"
                          title="Mark as Sent"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      {bill.status === 'sent' && (
                        <button
                          onClick={() => updateBillStatus(bill.id, 'paid')}
                          className="text-green-600 hover:text-green-900"
                          title="Mark as Paid"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Detail Modal */}
      {selectedBill && (
        <BillDetailModal
          bill={selectedBill}
          businessName={user?.businessName || 'Restaurant'}
          onClose={() => setSelectedBill(null)}
          onUpdateStatus={updateBillStatus}
          onPrint={printBill}
        />
      )}
    </div>
  );
};

// Bill Detail Modal Component
interface BillDetailModalProps {
  bill: Bill;
  businessName: string;
  onClose: () => void;
  onUpdateStatus: (billId: string, status: Bill['status']) => void;
  onPrint: (bill: Bill) => void;
}

const BillDetailModal: React.FC<BillDetailModalProps> = ({ 
  bill, 
  businessName, 
  onClose, 
  onUpdateStatus, 
  onPrint 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Bill #{bill.id.slice(0, 8)}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Bill Header */}
          <div className="text-center border-b pb-6">
            <h1 className="text-2xl font-bold text-gray-900">{businessName}</h1>
            <h2 className="text-lg text-gray-600">Invoice</h2>
          </div>

          {/* Bill Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Bill Information</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Bill ID:</span> {bill.id}</div>
                <div><span className="font-medium">Order ID:</span> {bill.orderId}</div>
                <div><span className="font-medium">Table:</span> {bill.tableNumber}</div>
                <div><span className="font-medium">Date:</span> {format(new Date(bill.timestamp), 'MMM dd, yyyy HH:mm')}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Status Management</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bill Status
                  </label>
                  <select
                    value={bill.status}
                    onChange={(e) => onUpdateStatus(bill.id, e.target.value as Bill['status'])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Bill Items */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Items</h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Item</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Qty</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Price</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items.map((item, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">${item.price.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bill Totals */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="text-sm font-medium">${bill.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tax (15%):</span>
                <span className="text-sm font-medium">${bill.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-lg font-bold text-gray-900">${bill.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              onClick={() => onPrint(bill)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Print Bill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};