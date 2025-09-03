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
    const margin = 15;
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
      if (currentY + requiredSpace > pageHeight - 30) {
        addNewPage();
        return true;
      }
      return false;
    };

    // Add page header with business name and "FOOD MENU"
    const addPageHeader = () => {
      // Light gray background
      pdf.setFillColor(245, 245, 245);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Business name in script font style
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(32);
      pdf.setFont('helvetica', 'bolditalic');
      const businessName = businessInfo.businessName || 'Borcelle';
      const businessNameWidth = pdf.getTextWidth(businessName);
      pdf.text(businessName, (pageWidth - businessNameWidth) / 2, 25);
      
      // "FOOD MENU" banner
      const bannerY = 35;
      const bannerHeight = 12;
      const bannerWidth = 80;
      const bannerX = (pageWidth - bannerWidth) / 2;
      
      // Black banner background
      pdf.setFillColor(0, 0, 0);
      pdf.rect(bannerX, bannerY, bannerWidth, bannerHeight, 'F');
      
      // White text on banner
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const menuText = 'FOOD MENU';
      const menuTextWidth = pdf.getTextWidth(menuText);
      pdf.text(menuText, (pageWidth - menuTextWidth) / 2, bannerY + 8);
      
      currentY = 60;
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

    // Render items in the new design style
    const allItems = Object.values(itemsByCategory).flat();
    
    for (let i = 0; i < allItems.length; i++) {
      const item = allItems[i];
      
      // Calculate required space for this item (image + text)
      const itemHeight = 85;
      
      checkPageSpace(itemHeight);
      
      // Determine layout (alternating left/right)
      const isLeft = i % 2 === 0;
      const imageSize = 70;
      const imageX = isLeft ? margin : pageWidth - margin - imageSize;
      const textX = isLeft ? margin + imageSize + 10 : margin;
      const textWidth = contentWidth - imageSize - 10;
      
      try {
        // Load and add food image
        if (item.photo) {
          const imageBase64 = await loadImageAsBase64(item.photo);
          
          // Add circular mask effect by drawing a white circle background
          pdf.setFillColor(255, 255, 255);
          pdf.circle(imageX + imageSize/2, currentY + imageSize/2, imageSize/2, 'F');
          
          // Add the image
          pdf.addImage(imageBase64, 'JPEG', imageX, currentY, imageSize, imageSize);
        } else {
          // Placeholder circle if no image
          pdf.setFillColor(240, 240, 240);
          pdf.circle(imageX + imageSize/2, currentY + imageSize/2, imageSize/2, 'F');
          
          // Add placeholder text
          pdf.setTextColor(150, 150, 150);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text('No Image', imageX + imageSize/2, currentY + imageSize/2, { align: 'center' });
        }
      } catch (error) {
        console.error('Error adding image:', error);
        // Fallback placeholder
        pdf.setFillColor(240, 240, 240);
        pdf.circle(imageX + imageSize/2, currentY + imageSize/2, imageSize/2, 'F');
      }
      
      // Item name in large, bold text
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      
      const itemNameY = currentY + 20;
      const maxNameWidth = textWidth - 20;
      
      // Split long names into multiple lines
      const words = item.name.split(' ');
      let lines = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = pdf.getTextWidth(testLine);
        
        if (testWidth <= maxNameWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
      
      // Limit to 2 lines
      lines = lines.slice(0, 2);
      
      lines.forEach((line, lineIndex) => {
        if (isLeft) {
          pdf.text(line, textX, itemNameY + (lineIndex * 8));
        } else {
          pdf.text(line, textX + textWidth, itemNameY + (lineIndex * 8), { align: 'right' });
        }
      });
      
      // Description
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const descriptionY = itemNameY + (lines.length * 8) + 5;
      const description = item.description.length > 80 ? 
        item.description.substring(0, 77) + '...' : item.description;
      
      // Split description into lines
      const descWords = description.split(' ');
      let descLines = [];
      let currentDescLine = '';
      
      for (const word of descWords) {
        const testLine = currentDescLine ? `${currentDescLine} ${word}` : word;
        const testWidth = pdf.getTextWidth(testLine);
        
        if (testWidth <= maxNameWidth) {
          currentDescLine = testLine;
        } else {
          if (currentDescLine) descLines.push(currentDescLine);
          currentDescLine = word;
        }
      }
      if (currentDescLine) descLines.push(currentDescLine);
      
      // Limit to 2 lines
      descLines = descLines.slice(0, 2);
      
      descLines.forEach((line, lineIndex) => {
        if (isLeft) {
          pdf.text(line, textX, descriptionY + (lineIndex * 4));
        } else {
          pdf.text(line, textX + textWidth, descriptionY + (lineIndex * 4), { align: 'right' });
        }
      });
      
      // Price in circular badge
      const priceY = currentY + imageSize - 15;
      const priceX = isLeft ? textX + textWidth - 25 : textX + 25;
      
      // Black circle for price
      pdf.setFillColor(0, 0, 0);
      pdf.circle(priceX, priceY, 12, 'F');
      
      // White price text
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      const priceText = `$${item.price.toFixed(0)}`;
      pdf.text(priceText, priceX, priceY + 2, { align: 'center' });
      
      // Decorative line under item
      const lineY = currentY + itemHeight - 5;
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      
      if (isLeft) {
        pdf.line(textX, lineY, textX + textWidth - 30, lineY);
      } else {
        pdf.line(textX + 30, lineY, textX + textWidth, lineY);
      }
      
      currentY += itemHeight + 10;
    }

    // Footer on last page
    currentY = pageHeight - 25;
    
    // Footer content
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // Delivery order section
    pdf.text('Delivery order', margin, currentY);
    
    // Phone number
    const phone = businessInfo.aboutUs?.phone || businessInfo.phone || '+123-456-7890';
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(phone, margin, currentY + 6);
    
    // Website (right aligned)
    const website = businessInfo.aboutUs?.website || 'WWW.REALLYGREATSITE.COM';
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(website, pageWidth - margin, currentY + 3, { align: 'right' });
    
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
      const fileName = `${businessInfo.businessName?.toLowerCase().replace(/\s+/g, '-') || 'restaurant-menu'}.pdf`;
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
          <p className="text-gray-600 mt-2">Generate a beautiful, modern menu design for printing</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Design Preview */}
          <div className="bg-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Design Preview</h3>
            <div className="bg-white border border-gray-300 rounded-lg p-6 relative overflow-hidden">
              {/* Mock design preview */}
              <div className="text-center mb-6">
                <div className="font-bold text-2xl text-gray-900 italic tracking-wide mb-2">
                  {businessInfo.businessName || 'Restaurant Name'}
                </div>
                <div className="inline-block bg-black text-white px-6 py-2 font-bold text-sm tracking-wider">
                  FOOD MENU
                </div>
              </div>

              {/* Sample item layout */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-500 text-xs">IMAGE</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-gray-900 mb-1">SAMPLE DISH</h4>
                  <p className="text-gray-600 text-sm">Delicious description of the menu item</p>
                  <div className="w-24 h-0.5 bg-gray-300 mt-2"></div>
                </div>
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">$12</span>
                </div>
              </div>

              <div className="text-center text-xs text-gray-500 mt-8">
                <p>Delivery order</p>
                <p className="font-bold">+123-456-7890</p>
                <p className="mt-1">WWW.YOURRESTAURANT.COM</p>
              </div>
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
                  <span className="text-gray-700">Modern, elegant layout inspired by your reference</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                  <span className="text-gray-700">Large, circular food images</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                  <span className="text-gray-700">Alternating left/right layout</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                  <span className="text-gray-700">Stylish script business name</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                  <span className="text-gray-700">Black banner with "FOOD MENU"</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                  <span className="text-gray-700">Circular price badges</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                  <span className="text-gray-700">Clean typography and spacing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                  <span className="text-gray-700">Professional footer with contact info</span>
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
                <span className="text-sm text-gray-700">Design style:</span>
                <span className="text-sm font-medium text-gray-900">Modern restaurant menu</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Layout:</span>
                <span className="text-sm font-medium text-gray-900">Alternating image placement</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Images:</span>
                <span className="text-sm font-medium text-gray-900">High-quality food photos</span>
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
                  {generating ? 'Generating...' : 'Download Beautiful Menu'}
                </span>
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Printing Instructions:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Print on A4 paper in portrait orientation</li>
              <li>Use high-quality color printing for best food photo reproduction</li>
              <li>Ensure printer settings are set to "Actual Size" or "100%"</li>
              <li>Consider using premium paper (150-200gsm) for professional results</li>
              <li>For best results, use a color laser printer or professional printing service</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};