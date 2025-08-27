import React, { useState, useRef } from 'react';
import { X, Download, QrCode, FileImage, FileText, Check } from 'lucide-react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface QRCodeGeneratorProps {
  userId: string;
  businessName: string;
  numberOfTables: number;
  onClose: () => void;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  userId,
  businessName,
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
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
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

  const downloadSingleQR = async (tableNumber: number, format: 'png' | 'pdf') => {
    try {
      const qrDataURL = qrCodes[tableNumber] || await generateQRCode(tableNumber);
      
      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `table-${tableNumber}-qr.png`;
        link.href = qrDataURL;
        link.click();
      } else {
        // A6 size: 105 x 148 mm (landscape)
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: [148, 105]
        });
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        // Background color (light green)
        pdf.setFillColor(240, 253, 244); // Very light green
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        
        // Left side - Business branding (60% of width)
        const leftWidth = pageWidth * 0.58;
        
        // Business logo area (green background)
        pdf.setFillColor(34, 197, 94); // Green color
        pdf.roundedRect(15, 20, 35, 35, 5, 5, 'F');
        
        // Logo text (placeholder)
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        const logoText = businessName.charAt(0).toUpperCase();
        pdf.text(logoText, 32.5, 40, { align: 'center' });
        
        // Business name
        pdf.setTextColor(34, 197, 94);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(businessName.toUpperCase(), 15, 65);
        
        // Table number with styling
        pdf.setTextColor(107, 114, 128);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`TABLE ${tableNumber}`, 15, 75);
        
        // Decorative line
        pdf.setDrawColor(34, 197, 94);
        pdf.setLineWidth(2);
        pdf.line(15, 80, 50, 80);
        
        // Right side - QR code section
        const qrSize = 55;
        const qrX = leftWidth + 15;
        const qrY = (pageHeight - qrSize) / 2 - 5;
        
        // QR code background (white with border)
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(229, 231, 235);
        pdf.setLineWidth(1);
        pdf.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 8, 8, 'FD');
        
        // QR code
        pdf.addImage(qrDataURL, 'PNG', qrX, qrY, qrSize, qrSize);
        
        // Welcome text above QR
        pdf.setTextColor(34, 197, 94);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Welcome!', qrX + (qrSize / 2), qrY - 15, { align: 'center' });
        
        // Subtitle below QR
        pdf.setTextColor(107, 114, 128);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Our menu on', qrX + (qrSize / 2), qrY + qrSize + 12, { align: 'center' });
        pdf.text('your smartphone', qrX + (qrSize / 2), qrY + qrSize + 20, { align: 'center' });
        
        pdf.save(`table-${tableNumber}-qr.pdf`);
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Failed to download QR code');
    }
  };

  const downloadAllQRCodes = async (format: 'png' | 'pdf') => {
    if (selectedTables.length === 0) return;
    
    setGenerating(true);
    
    try {
      if (format === 'png') {
        // Create a zip-like download by downloading each image
        for (const tableNumber of selectedTables) {
          await downloadSingleQR(tableNumber, 'png');
          // Small delay to prevent browser blocking
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else {
        // Create a single PDF with all QR codes
        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        for (let i = 0; i < selectedTables.length; i++) {
          const tableNumber = selectedTables[i];
          
          if (i > 0) {
            pdf.addPage();
          }
          
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          
          // Background color
          pdf.setFillColor(240, 253, 244);
          pdf.rect(0, 0, pageWidth, pageHeight, 'F');
          
          // Business name at top
          pdf.setTextColor(34, 197, 94);
          pdf.setFontSize(24);
          pdf.setFont('helvetica', 'bold');
          pdf.text(businessName.toUpperCase(), pageWidth / 2, 40, { align: 'center' });
          
          // Table number
          pdf.setTextColor(107, 114, 128);
          pdf.setFontSize(16);
          pdf.text(`TABLE ${tableNumber}`, pageWidth / 2, 55, { align: 'center' });
          
          // QR code with background
          const qrSize = 100;
          const qrX = (pageWidth - qrSize) / 2;
          const qrY = 80;
          
          // QR background
          pdf.setFillColor(255, 255, 255);
          pdf.setDrawColor(229, 231, 235);
          pdf.setLineWidth(2);
          pdf.roundedRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 10, 10, 'FD');
          
          const qrDataURL = qrCodes[tableNumber] || await generateQRCode(tableNumber);
          pdf.addImage(qrDataURL, 'PNG', qrX, qrY, qrSize, qrSize);
          
          // Welcome text
          pdf.setTextColor(34, 197, 94);
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Welcome!', pageWidth / 2, qrY - 20, { align: 'center' });
          
          // Instructions
          pdf.setTextColor(107, 114, 128);
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          pdf.text('Scan this QR code to view our menu', pageWidth / 2, qrY + qrSize + 25, { align: 'center' });
          pdf.text('on your smartphone', pageWidth / 2, qrY + qrSize + 35, { align: 'center' });
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
              <h2 className="text-xl font-bold text-gray-900">QR Code Generator</h2>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">Generate QR codes for your restaurant tables</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Table Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Tables</h3>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated QR Codes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" ref={qrContainerRef}>
                {Object.entries(qrCodes).map(([tableNumber, qrDataURL]) => (
                  <div key={tableNumber} className="bg-gray-50 p-4 rounded-lg text-center">
                    <h4 className="font-semibold text-gray-900 mb-2">Table {tableNumber}</h4>
                    <img
                      src={qrDataURL}
                      alt={`QR Code for Table ${tableNumber}`}
                      className="w-32 h-32 mx-auto mb-3 border rounded"
                    />
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => downloadSingleQR(parseInt(tableNumber), 'png')}
                        className="text-green-600 hover:text-green-700 p-1"
                        title="Download PNG"
                      >
                        <FileImage className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadSingleQR(parseInt(tableNumber), 'pdf')}
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Download PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 break-all">
                      {(() => {
                        const businessSlug = businessName.toLowerCase()
                          .replace(/[^a-z0-9\s-]/g, '')
                          .replace(/\s+/g, '-')
                          .replace(/-+/g, '-')
                          .trim();
                        return `${window.location.origin}/${businessSlug}/table/${tableNumber}`;
                      })()}
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