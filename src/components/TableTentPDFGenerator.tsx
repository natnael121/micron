import React, { useState } from 'react';
import { X, Download, FileText, Eye, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import { MenuItem, Category, User } from '../types';

interface TableTentPDFGeneratorProps {
  userId: string;
  businessInfo: User;
  menuItems: MenuItem[];
  categories: Category[];
  onClose: () => void;
}

export const TableTentPDFGenerator: React.FC<TableTentPDFGeneratorProps> = ({
  userId,
  businessInfo,
  menuItems,
  categories,
  onClose,
}) => {
  const [generating, setGenerating] = useState(false);

  const loadImageAsBase64 = async (imageUrl: string): Promise<string> => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading image:', error);
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    }
  };

  const generatePrintMenuPDF = async (): Promise<jsPDF> => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    let currentY = margin;
    let pageNumber = 1;

    // Helper function to add new page
    const addNewPage = () => {
      pdf.addPage();
      pageNumber++;
      currentY = margin;
      addPageHeader();
    };

    // Helper function to check if we need a new page
    const checkPageSpace = (requiredSpace: number) => {
      if (currentY + requiredSpace > pageHeight - 20) {
        addNewPage();
        return true;
      }
      return false;
    };

    // Add page header
    const addPageHeader = () => {
      // Business name header
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      
      // Business name
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      const businessName = businessInfo.businessName || 'MESSINA BAKERY & CAFE';
      const businessNameWidth = pdf.getTextWidth(businessName);
      pdf.text(businessName, (pageWidth - businessNameWidth) / 2, 20);
      
      currentY = 40;
    };

    // Add first page header
    addPageHeader();

    // Group menu items by category
    const itemsByCategory = categories.reduce((acc, category) => {
      const categoryItems = menuItems.filter(item => 
        item.category === category.name && item.available
      );
      if (categoryItems.length > 0) {
        acc[category.name] = categoryItems.sort((a, b) => a.name.localeCompare(b.name));
      }
      return acc;
    }, {} as Record<string, MenuItem[]>);

    // Add uncategorized items
    const uncategorizedItems = menuItems.filter(item => 
      item.available && !categories.some(cat => cat.name === item.category)
    );
    if (uncategorizedItems.length > 0) {
      itemsByCategory['Other Items'] = uncategorizedItems.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Render categories and items
    for (const [categoryName, items] of Object.entries(itemsByCategory)) {
      // Check space for category header
      checkPageSpace(20);
      
      // Category header
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      
      // Draw a line above category
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(margin, currentY - 5, pageWidth - margin, currentY - 5);
      
      const category = categories.find(c => c.name === categoryName);
      pdf.text(categoryName.toUpperCase(), margin, currentY);
      
      currentY += 10;
      
      // Items in this category
      for (const item of items) {
        // Calculate required space for this item
        const itemHeight = 15;
        
        checkPageSpace(itemHeight);
        
        // Item name
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        
        const itemName = item.name;
        pdf.text(itemName, margin, currentY);
        
        // Dotted line
        const itemNameWidth = pdf.getTextWidth(itemName);
        const dottedLineStart = margin + itemNameWidth + 5;
        const dottedLineEnd = pageWidth - margin - 40;
        
        if (dottedLineStart < dottedLineEnd) {
          // Draw dotted line
          pdf.setLineWidth(0.3);
          pdf.setDrawColor(180, 180, 180);
          let dotPosition = dottedLineStart;
          while (dotPosition < dottedLineEnd) {
            pdf.line(dotPosition, currentY - 2, dotPosition + 1, currentY - 2);
            dotPosition += 3;
          }
        }
        
        // Price (right-aligned)
        const price = `$${item.price.toFixed(2)}`;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(price, pageWidth - margin, currentY, { align: 'right' });
        
        // Description (if it fits)
        if (item.description) {
          const descriptionY = currentY + 5;
          if (descriptionY < pageHeight - 20) {
            pdf.setTextColor(100, 100, 100);
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'italic');
            
            const description = item.description.length > 60 ? 
              item.description.substring(0, 57) + '...' : item.description;
            
            pdf.text(description, margin, descriptionY);
            currentY += 8;
          }
        } else {
          currentY += 5;
        }
        
        currentY += 10;
      }
      
      // Extra space after category
      currentY += 5;
    }

    // Footer on last page
    currentY = pageHeight - 30;
    
    // Footer content
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // Draw a line above footer
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;
    
    // Contact info
    if (businessInfo.aboutUs?.phone || businessInfo.phone) {
      pdf.text(`📞 ${businessInfo.aboutUs?.phone || businessInfo.phone}`, margin, currentY);
    }
    
    if (businessInfo.aboutUs?.address || businessInfo.address) {
      const address = businessInfo.aboutUs?.address || businessInfo.address || '';
      pdf.text(`📍 ${address}`, margin, currentY + 5);
    }
    
    // Website and social media
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(9);
    pdf.text('MESSINABAKERY.COM', pageWidth - margin, currentY, { align: 'right' });
    pdf.text('@MESSINABAKERY', pageWidth - margin, currentY + 5, { align: 'right' });
    pdf.text('HELLO@MESSINABAKERY.COM', pageWidth - margin, currentY + 10, { align: 'right' });
    
    return pdf;
  };

  const generatePrintMenu = async () => {
    if (menuItems.length === 0) {
      alert('No menu items available to print');
      return;
    }

    setGenerating(true);
    
    try {
      const pdf = await generatePrintMenuPDF();
      const fileName = `${businessInfo.businessName?.toLowerCase().replace(/\s+/g, '-') || 'messina-menu'}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating print menu:', error);
      alert('Failed to generate menu PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const previewMenu = async () => {
    try {
      setGenerating(true);
      const pdf = await generatePrintMenuPDF();
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Error previewing menu:', error);
      alert('Failed to preview menu');
    } finally {
      setGenerating(false);
    }
  };

  // Group menu items by category for display
  const itemsByCategory = categories.reduce((acc, category) => {
    const categoryItems = menuItems.filter(item => 
      item.category === category.name && item.available
    );
    if (categoryItems.length > 0) {
      acc[category.name] = categoryItems.sort((a, b) => a.name.localeCompare(b.name));
    }
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Add uncategorized items
  const uncategorizedItems = menuItems.filter(item => 
    item.available && !categories.some(cat => cat.name === item.category)
  );
  if (uncategorizedItems.length > 0) {
    itemsByCategory['Other Items'] = uncategorizedItems.sort((a, b) => a.name.localeCompare(b.name));
  }

  const totalItems = Object.values(itemsByCategory).reduce((sum, items) => sum + items.length, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Printer className="w-6 h-6 text-gray-800" />
              <h2 className="text-xl font-bold text-gray-900">Print Menu Generator</h2>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">Generate a clean, professional menu for printing</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Preview Section */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Menu Preview</h3>
            <div className="bg-white border border-gray-300 rounded-lg p-6">
              {/* Header Preview */}
              <div className="text-center mb-6">
                <div className="font-bold text-2xl text-gray-900 uppercase tracking-wide">
                  {businessInfo.businessName || 'MESSINA BAKERY & CAFE'}
                </div>
              </div>

              {/* Sample Category Preview */}
              {Object.entries(itemsByCategory).slice(0, 2).map(([categoryName, items]) => (
                <div key={categoryName} className="mb-6">
                  <div className="border-t border-gray-300 pt-4 mb-3">
                    <div className="font-bold text-gray-900 uppercase text-lg">
                      {categoryName}
                    </div>
                  </div>
                  {items.slice(0, 2).map(item => (
                    <div key={item.id} className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-gray-600 italic mt-1">
                            {item.description.substring(0, 50)}...
                          </div>
                        )}
                      </div>
                      <div className="font-medium text-gray-900 ml-4">${item.price.toFixed(2)}</div>
                    </div>
                  ))}
                  {items.length > 2 && (
                    <div className="text-xs text-gray-500">+{items.length - 2} more items</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Menu Summary */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Menu Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">{Object.keys(itemsByCategory).length}</div>
                <div className="text-gray-600">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">{totalItems}</div>
                <div className="text-gray-600">Available Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  ${Math.min(...menuItems.filter(i => i.available).map(i => i.price)).toFixed(2)}
                </div>
                <div className="text-gray-600">Starting From</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  ${Math.max(...menuItems.filter(i => i.available).map(i => i.price)).toFixed(2)}
                </div>
                <div className="text-gray-600">Up To</div>
              </div>
            </div>
          </div>

          {/* Design Features */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Design Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                  <span className="text-gray-700">Clean, professional layout</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                  <span className="text-gray-700">Category organization</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                  <span className="text-gray-700">Dotted line separators</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                  <span className="text-gray-700">Automatic pagination</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                  <span className="text-gray-700">Item descriptions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                  <span className="text-gray-700">Print-ready A4 format</span>
                </div>
              </div>
            </div>
          </div>

          {/* Generation Options */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Print Options</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Format:</span>
                <span className="text-sm font-medium text-gray-900">A4 Portrait (210×297mm)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Color scheme:</span>
                <span className="text-sm font-medium text-gray-900">Black & White</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Layout:</span>
                <span className="text-sm font-medium text-gray-900">Clean, professional</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Pagination:</span>
                <span className="text-sm font-medium text-gray-900">Automatic page breaks</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {totalItems} items across {Object.keys(itemsByCategory).length} categories
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={previewMenu}
                disabled={generating || totalItems === 0}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
              
              <button
                onClick={generatePrintMenu}
                disabled={generating || totalItems === 0}
                className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold"
              >
                <Download className="w-4 h-4" />
                <span>
                  {generating ? 'Generating...' : 'Download Print Menu'}
                </span>
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Printing Instructions:</h4>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Print on A4 paper in portrait orientation</li>
              <li>Use high-quality printing for best results</li>
              <li>Ensure printer settings are set to "Actual Size"</li>
              <li>Consider using slightly heavier paper (120-150gsm) for menus</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};