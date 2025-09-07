import React, { useState, useRef } from 'react';
import { X, QrCode, FileImage, FileText } from 'lucide-react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';

interface QRCodeGeneratorProps {
  userId: string;
  businessName: string;
  businessLogo?: string; // logo as base64 or URL
  numberOfTables: number;
  onClose: () => void;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  userId,
  businessName,
  businessLogo,
  numberOfTables,
  onClose,
}) => {
  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [qrCodes, setQrCodes] = useState<{ [key: number]: string }>({});
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const tables = Array.from({ length: numberOfTables }, (_, i) => i + 1);

  const handleTableSelect = (tableNumber: number) => {
    setSelectedTables(prev =>
      prev.includes(tableNumber)
        ? prev.filter(t => t !== tableNumber)
        : [...prev, tableNumber]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTables([]);
    } else {
      setSelectedTables(tables);
    }
    setSelectAll(!selectAll);
  };

  const generateQRCode = async (tableNumber: number): Promise<string> => {
    const url = `${window.location.origin}/menu/${userId}/table/${tableNumber}`;
    try {
      const qrDataURL = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      return qrDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  };

  const generateAllQRCodes = async () => {
    setGenerating(true);
    const codes: { [key: number]: string } = {};
    try {
      for (const tableNumber of selectedTables) {
        codes[tableNumber] = await generateQRCode(tableNumber);
      }
      setQrCodes(codes);
    } catch (error) {
      console.error('Error generating QR codes:', error);
      alert('Failed to generate QR codes');
    } finally {
      setGenerating(false);
    }
  };
const downloadAllQRCodes = async (format: 'png' | 'pdf') => {
  if (selectedTables.length === 0) return;
  setGenerating(true);

  try {
    if (format === 'png') {
      for (const tableNumber of selectedTables) {
        await downloadSingleQR(tableNumber, 'png');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } else {
      // A4 landscape
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();   // 297mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 210mm

      const cols = 3;
      const rows = 2;
      const slotWidth = pageWidth / cols;
      const slotHeight = pageHeight / rows;

      // Repeat tables if less than 6
      let tablesToPrint = [...selectedTables];
      while (tablesToPrint.length < 6) {
        tablesToPrint = tablesToPrint.concat(selectedTables);
      }
      tablesToPrint = tablesToPrint.slice(0, Math.ceil(selectedTables.length / 6) * 6);

      for (let i = 0; i < tablesToPrint.length; i++) {
        if (i > 0 && i % (cols * rows) === 0) {
          pdf.addPage();
        }

        const pageIndex = i % (cols * rows);
        const col = pageIndex % cols;
        const row = Math.floor(pageIndex / cols);

        const x = col * slotWidth;
        const y = row * slotHeight;

        const tableNumber = tablesToPrint[i];
        const qrDataURL = qrCodes[tableNumber] || await generateQRCode(tableNumber);

        // Card background 
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(x + 5, y + 5, slotWidth - 10, slotHeight - 10, 5, 5, 'F');

        // Left branding area
        const leftWidth = (slotWidth - 20) * 0.45;
        pdf.setFillColor(255, 204, 0)
        pdf.roundedRect(x + 10, y + 15, leftWidth, slotHeight - 30, 5, 5, 'F');

        // Business logo
        if (businessLogo) {
          pdf.addImage(
            businessLogo,
            'PNG',
            x + 10 + (leftWidth / 2) - 12,
            y + 25,
            24,
            24
          );
        } else {
          // If no logo, fallback to business initial
          pdf.setFillColor(255, 255, 255);
          pdf.circle(x + 10 + leftWidth / 2, y + 37, 12, 'F');
          pdf.setTextColor(34, 197, 94);
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(businessName.charAt(0).toUpperCase(), x + 10 + leftWidth / 2, y + 42, { align: 'center' });
        }

        // Business name
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.text(businessName.toUpperCase(), x + 10 + leftWidth / 2, y + slotHeight - 20, { align: 'center' });

        // Table number text - FIXED: Using correct coordinates
        pdf.setFontSize(16);
        pdf.setTextColor(255, 255, 255);
        pdf.text(`TABLE ${tableNumber}`, x + 10 + leftWidth / 2, y + slotHeight - 40, { align: 'center' });

        // QR code on right side
        const qrSize = 40;
        const qrX = x + leftWidth + 25;
        const qrY = y + (slotHeight - qrSize) / 2;

        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 4, 4, 'FD');
        pdf.addImage(qrDataURL, 'PNG', qrX, qrY, qrSize, qrSize);

        // Welcome text
        pdf.setTextColor(255, 204, 0);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Welcome!', qrX + qrSize / 2, qrY - 10, { align: 'center' });

        pdf.setTextColor(107, 114, 128);
        pdf.setFontSize(8);
        pdf.text('Our menu on your smartphone', qrX + qrSize / 2, qrY + qrSize + 15, { align: 'center' });
      }

      pdf.save(`${businessName.toLowerCase().replace(/\s+/g, '-')}-qr-codes.pdf`);
    }
  } catch (error) {
    console.error('Error downloading QR codes:', error);
    alert('Failed to download QR codes');
  } finally {
    setGenerating(false);
  }
};
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <QrCode className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">
                QR Code Generator
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Generate QR codes for your restaurant tables
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Table Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Select Tables
              </h3>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Select All</span>
                </label>
                <span className="text-sm text-gray-500">
                  {selectedTables.length} of {numberOfTables} selected
                </span>
              </div>
            </div>

            <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
              {tables.map(tableNumber => (
                <button
                  key={tableNumber}
                  onClick={() => handleTableSelect(tableNumber)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    selectedTables.includes(tableNumber)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium">Table</div>
                    <div className="text-lg font-bold">{tableNumber}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <button
              onClick={generateAllQRCodes}
              disabled={selectedTables.length === 0 || generating}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <QrCode className="w-4 h-4" />
              <span>{generating ? 'Generating...' : 'Generate QR Codes'}</span>
            </button>

            <div className="flex space-x-3">
              <button
                onClick={() => downloadAllQRCodes('png')}
                disabled={Object.keys(qrCodes).length === 0 || generating}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <FileImage className="w-4 h-4" />
                <span>Download PNG</span>
              </button>
              <button
                onClick={() => downloadAllQRCodes('pdf')}
                disabled={Object.keys(qrCodes).length === 0 || generating}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Generated QR Codes Preview */}
          {Object.keys(qrCodes).length > 0 && (
            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Generated QR Codes
              </h3>
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                ref={qrContainerRef}
              >
                {Object.entries(qrCodes).map(([tableNumber, qrDataURL]) => (
                  <div
                    key={tableNumber}
                    className="bg-gray-50 p-4 rounded-lg text-center"
                  >
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Table {tableNumber}
                    </h4>
                    <img
                      src={qrDataURL}
                      alt={`QR Code for Table ${tableNumber}`}
                      className="w-32 h-32 mx-auto mb-3 border rounded"
                    />
                    <p className="text-xs text-gray-500 mt-2 break-all">
                      {`${window.location.origin}/menu/${userId}/table/${tableNumber}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
