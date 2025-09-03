import React, { useState } from 'react';
import { X, Download, FileText, Eye, Printer, Palette } from 'lucide-react';
import jsPDF from 'jspdf';
import { MenuItem, Category, User } from '../types';

interface TableTentPDFGeneratorProps {
  userId: string;
  businessInfo: User;
  menuItems: MenuItem[];
  categories: Category[];
  onClose: () => void;
}

type DesignOption = 'modern' | 'classic' | 'elegant';

export const TableTentPDFGenerator: React.FC<TableTentPDFGeneratorProps> = ({
  userId,
  businessInfo,
  menuItems,
  categories,
  onClose,
}) => {
  const [generating, setGenerating] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<DesignOption>('modern');

  const designOptions = [
    {
      id: 'modern' as DesignOption,
      name: 'Modern Style',
      description: 'Alternating layout with circular images and elegant typography',
      preview: 'Modern design with large circular food images and stylish script business name'
    },
    {
      id: 'classic' as DesignOption,
      name: 'Classic Restaurant',
      description: 'Traditional menu layout with clean typography and organized sections',
      preview: 'Clean, professional layout with category sections and traditional styling'
    },
    {
      id: 'elegant' as DesignOption,
      name: 'Elegant Fine Dining',
      description: 'Sophisticated design with premium typography and refined layout',
      preview: 'Luxurious design with premium fonts, gold accents, and sophisticated spacing'
    }
  ];

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

  const generateModernDesignPDF = async (): Promise<jsPDF> => {
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

    const addNewPage = () => {
      pdf.addPage();
      pageNumber++;
      currentY = margin;
      addPageHeader();
    };

    const checkPageSpace = (requiredSpace: number) => {
      if (currentY + requiredSpace > pageHeight - 30) {
        addNewPage();
        return true;
      }
      return false;
    };

    const addPageHeader = () => {
      pdf.setFillColor(245, 245, 245);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(32);
      pdf.setFont('helvetica', 'bolditalic');
      const businessName = businessInfo.businessName || 'Borcelle';
      const businessNameWidth = pdf.getTextWidth(businessName);
      pdf.text(businessName, (pageWidth - businessNameWidth) / 2, 25);
      
      const bannerY = 35;
      const bannerHeight = 12;
      const bannerWidth = 80;
      const bannerX = (pageWidth - bannerWidth) / 2;
      
      pdf.setFillColor(0, 0, 0);
      pdf.rect(bannerX, bannerY, bannerWidth, bannerHeight, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const menuText = 'FOOD MENU';
      const menuTextWidth = pdf.getTextWidth(menuText);
      pdf.text(menuText, (pageWidth - menuTextWidth) / 2, bannerY + 8);
      
      currentY = 60;
    };

    addPageHeader();

    const itemsByCategory = categories.reduce((acc, category) => {
      const categoryItems = menuItems.filter(item => 
        item.category === category.name && item.available
      );
      if (categoryItems.length > 0) {
        acc[category.name] = categoryItems.sort((a, b) => a.name.localeCompare(b.name));
      }
      return acc;
    }, {} as Record<string, MenuItem[]>);

    const uncategorizedItems = menuItems.filter(item => 
      item.available && !categories.some(cat => cat.name === item.category)
    );
    if (uncategorizedItems.length > 0) {
      itemsByCategory['Other Items'] = uncategorizedItems.sort((a, b) => a.name.localeCompare(b.name));
    }

    const allItems = Object.values(itemsByCategory).flat();
    
    for (let i = 0; i < allItems.length; i++) {
      const item = allItems[i];
      const itemHeight = 85;
      
      checkPageSpace(itemHeight);
      
      const isLeft = i % 2 === 0;
      const imageSize = 70;
      const imageX = isLeft ? margin : pageWidth - margin - imageSize;
      const textX = isLeft ? margin + imageSize + 10 : margin;
      const textWidth = contentWidth - imageSize - 10;
      
      try {
        if (item.photo) {
          const imageBase64 = await loadImageAsBase64(item.photo);
          pdf.setFillColor(255, 255, 255);
          pdf.circle(imageX + imageSize/2, currentY + imageSize/2, imageSize/2, 'F');
          pdf.addImage(imageBase64, 'JPEG', imageX, currentY, imageSize, imageSize);
        } else {
          pdf.setFillColor(240, 240, 240);
          pdf.circle(imageX + imageSize/2, currentY + imageSize/2, imageSize/2, 'F');
          pdf.setTextColor(150, 150, 150);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text('No Image', imageX + imageSize/2, currentY + imageSize/2, { align: 'center' });
        }
      } catch (error) {
        console.error('Error adding image:', error);
        pdf.setFillColor(240, 240, 240);
        pdf.circle(imageX + imageSize/2, currentY + imageSize/2, imageSize/2, 'F');
      }
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      
      const itemNameY = currentY + 20;
      const maxNameWidth = textWidth - 20;
      
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
      
      lines = lines.slice(0, 2);
      
      lines.forEach((line, lineIndex) => {
        if (isLeft) {
          pdf.text(line, textX, itemNameY + (lineIndex * 8));
        } else {
          pdf.text(line, textX + textWidth, itemNameY + (lineIndex * 8), { align: 'right' });
        }
      });
      
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const descriptionY = itemNameY + (lines.length * 8) + 5;
      const description = item.description.length > 80 ? 
        item.description.substring(0, 77) + '...' : item.description;
      
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
      
      descLines = descLines.slice(0, 2);
      
      descLines.forEach((line, lineIndex) => {
        if (isLeft) {
          pdf.text(line, textX, descriptionY + (lineIndex * 4));
        } else {
          pdf.text(line, textX + textWidth, descriptionY + (lineIndex * 4), { align: 'right' });
        }
      });
      
      const priceY = currentY + imageSize - 15;
      const priceX = isLeft ? textX + textWidth - 25 : textX + 25;
      
      pdf.setFillColor(0, 0, 0);
      pdf.circle(priceX, priceY, 12, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      const priceText = `$${item.price.toFixed(0)}`;
      pdf.text(priceText, priceX, priceY + 2, { align: 'center' });
      
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

    currentY = pageHeight - 25;
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    pdf.text('Delivery order', margin, currentY);
    
    const phone = businessInfo.aboutUs?.phone || businessInfo.phone || '+123-456-7890';
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(phone, margin, currentY + 6);
    
    const website = businessInfo.aboutUs?.website || 'WWW.REALLYGREATSITE.COM';
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(website, pageWidth - margin, currentY + 3, { align: 'right' });
    
    return pdf;
  };

  const generateClassicDesignPDF = async (): Promise<jsPDF> => {
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

    // Header
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, 0, pageWidth, 50, 'F');
    
    // Business name
    pdf.setTextColor(31, 41, 55);
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    const businessName = businessInfo.businessName || 'Restaurant';
    pdf.text(businessName, pageWidth / 2, 25, { align: 'center' });
    
    // Subtitle
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);
    pdf.text('MENU', pageWidth / 2, 35, { align: 'center' });
    
    // Decorative line
    pdf.setDrawColor(34, 197, 94);
    pdf.setLineWidth(2);
    pdf.line(margin, 45, pageWidth - margin, 45);
    
    currentY = 65;

    // Group items by category
    const itemsByCategory = categories.reduce((acc, category) => {
      const categoryItems = menuItems.filter(item => 
        item.category === category.name && item.available
      );
      if (categoryItems.length > 0) {
        acc[category.name] = categoryItems.sort((a, b) => a.name.localeCompare(b.name));
      }
      return acc;
    }, {} as Record<string, MenuItem[]>);

    const uncategorizedItems = menuItems.filter(item => 
      item.available && !categories.some(cat => cat.name === item.category)
    );
    if (uncategorizedItems.length > 0) {
      itemsByCategory['Other Items'] = uncategorizedItems.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Render categories and items
    for (const [categoryName, items] of Object.entries(itemsByCategory)) {
      // Check space for category header
      if (currentY + 30 > pageHeight - 30) {
        pdf.addPage();
        currentY = margin;
      }

      // Category header
      pdf.setFillColor(34, 197, 94);
      pdf.rect(margin, currentY, contentWidth, 15, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(categoryName.toUpperCase(), margin + 10, currentY + 10);
      
      currentY += 25;

      // Category items
      for (const item of items) {
        if (currentY + 25 > pageHeight - 30) {
          pdf.addPage();
          currentY = margin;
        }

        // Item name and price
        pdf.setTextColor(31, 41, 55);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        
        const itemName = item.name.length > 35 ? item.name.substring(0, 32) + '...' : item.name;
        pdf.text(itemName, margin, currentY);
        
        // Price
        const priceText = `$${item.price.toFixed(2)}`;
        const priceWidth = pdf.getTextWidth(priceText);
        pdf.text(priceText, pageWidth - margin - priceWidth, currentY);
        
        // Dotted line between name and price
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.5);
        const nameWidth = pdf.getTextWidth(itemName);
        const dotsStart = margin + nameWidth + 5;
        const dotsEnd = pageWidth - margin - priceWidth - 5;
        
        for (let x = dotsStart; x < dotsEnd; x += 3) {
          pdf.circle(x, currentY - 2, 0.3, 'F');
        }
        
        currentY += 8;

        // Description
        pdf.setTextColor(107, 114, 128);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        const description = item.description.length > 80 ? 
          item.description.substring(0, 77) + '...' : item.description;
        
        const descLines = pdf.splitTextToSize(description, contentWidth - 20);
        pdf.text(descLines.slice(0, 2), margin + 5, currentY);
        
        currentY += descLines.length * 4 + 8;
      }
      
      currentY += 10; // Space between categories
    }

    // Footer
    currentY = pageHeight - 20;
    pdf.setTextColor(107, 114, 128);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const phone = businessInfo.aboutUs?.phone || businessInfo.phone || '+123-456-7890';
    pdf.text(`Phone: ${phone}`, margin, currentY);
    
    const website = businessInfo.aboutUs?.website || 'www.restaurant.com';
    pdf.text(website, pageWidth - margin, currentY, { align: 'right' });
    
    return pdf;
  };

  const generateElegantDesignPDF = async (): Promise<jsPDF> => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 25;
    const contentWidth = pageWidth - (margin * 2);
    
    let currentY = margin;

    // Elegant header with gold accents
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Gold border
    pdf.setDrawColor(212, 175, 55); // Gold color
    pdf.setLineWidth(3);
    pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);
    
    // Inner border
    pdf.setLineWidth(1);
    pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);
    
    currentY = 35;

    // Business name with elegant typography
    pdf.setTextColor(31, 41, 55);
    pdf.setFontSize(36);
    pdf.setFont('helvetica', 'bold');
    const businessName = businessInfo.businessName || 'Restaurant';
    pdf.text(businessName, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 15;

    // Decorative flourish
    pdf.setDrawColor(212, 175, 55);
    pdf.setLineWidth(2);
    const centerX = pageWidth / 2;
    pdf.line(centerX - 30, currentY, centerX - 10, currentY);
    pdf.line(centerX + 10, currentY, centerX + 30, currentY);
    
    // Small decorative circle
    pdf.setFillColor(212, 175, 55);
    pdf.circle(centerX, currentY, 2, 'F');
    
    currentY += 15;

    // Subtitle
    pdf.setTextColor(107, 114, 128);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Fine Dining Experience', pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 25;

    // Group items by category
    const itemsByCategory = categories.reduce((acc, category) => {
      const categoryItems = menuItems.filter(item => 
        item.category === category.name && item.available
      );
      if (categoryItems.length > 0) {
        acc[category.name] = categoryItems.sort((a, b) => a.name.localeCompare(b.name));
      }
      return acc;
    }, {} as Record<string, MenuItem[]>);

    const uncategorizedItems = menuItems.filter(item => 
      item.available && !categories.some(cat => cat.name === item.category)
    );
    if (uncategorizedItems.length > 0) {
      itemsByCategory['Other Items'] = uncategorizedItems.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Render categories and items
    for (const [categoryName, items] of Object.entries(itemsByCategory)) {
      // Check space for category header
      if (currentY + 40 > pageHeight - 40) {
        pdf.addPage();
        currentY = margin + 20;
      }

      // Category header with elegant styling
      pdf.setTextColor(31, 41, 55);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(categoryName, pageWidth / 2, currentY, { align: 'center' });
      
      currentY += 8;
      
      // Decorative line under category
      pdf.setDrawColor(212, 175, 55);
      pdf.setLineWidth(1);
      pdf.line(pageWidth / 2 - 25, currentY, pageWidth / 2 + 25, currentY);
      
      currentY += 15;

      // Category items with elegant layout
      for (const item of items) {
        if (currentY + 35 > pageHeight - 40) {
          pdf.addPage();
          currentY = margin + 20;
        }

        // Item container with subtle background
        pdf.setFillColor(252, 252, 252);
        pdf.rect(margin, currentY - 5, contentWidth, 30, 'F');
        
        // Item name
        pdf.setTextColor(31, 41, 55);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        
        const itemName = item.name.length > 40 ? item.name.substring(0, 37) + '...' : item.name;
        pdf.text(itemName, margin + 5, currentY + 5);
        
        // Price with gold background
        const priceText = `$${item.price.toFixed(2)}`;
        const priceWidth = pdf.getTextWidth(priceText) + 8;
        
        pdf.setFillColor(212, 175, 55);
        pdf.rect(pageWidth - margin - priceWidth - 5, currentY - 2, priceWidth, 12, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(priceText, pageWidth - margin - priceWidth / 2 - 5, currentY + 6, { align: 'center' });
        
        currentY += 12;

        // Description with elegant typography
        pdf.setTextColor(107, 114, 128);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'italic');
        
        const description = item.description.length > 90 ? 
          item.description.substring(0, 87) + '...' : item.description;
        
        const descLines = pdf.splitTextToSize(description, contentWidth - 60);
        pdf.text(descLines.slice(0, 2), margin + 5, currentY);
        
        currentY += descLines.length * 4 + 15;
      }
      
      currentY += 10;
    }

    // Elegant footer
    currentY = pageHeight - 35;
    
    // Footer border
    pdf.setDrawColor(212, 175, 55);
    pdf.setLineWidth(1);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    
    currentY += 10;
    
    pdf.setTextColor(107, 114, 128);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'italic');
    
    const phone = businessInfo.aboutUs?.phone || businessInfo.phone || '+123-456-7890';
    pdf.text(phone, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 8;
    
    const website = businessInfo.aboutUs?.website || 'www.restaurant.com';
    pdf.setFontSize(10);
    pdf.text(website, pageWidth / 2, currentY, { align: 'center' });
    
    return pdf;
  };

  const generatePrintMenuPDF = async (): Promise<jsPDF> => {
    switch (selectedDesign) {
      case 'modern':
        return await generateModernDesignPDF();
      case 'classic':
        return await generateClassicDesignPDF();
      case 'elegant':
        return await generateElegantDesignPDF();
      default:
        return await generateModernDesignPDF();
    }
  };

  const generatePrintMenu = async () => {
    if (menuItems.length === 0) {
      alert('No menu items available to print');
      return;
    }

    setGenerating(true);
    
    try {
      const pdf = await generatePrintMenuPDF();
      const fileName = `${businessInfo.businessName?.toLowerCase().replace(/\s+/g, '-') || 'restaurant-menu'}-${selectedDesign}.pdf`;
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
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
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
          <p className="text-gray-600 mt-2">Choose a design and generate a beautiful menu for printing</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Design Selection */}
          <div className="bg-gray-100 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Palette className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Choose Design Style</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {designOptions.map((design) => (
                <div
                  key={design.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedDesign === design.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => setSelectedDesign(design.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{design.name}</h4>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedDesign === design.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedDesign === design.id && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{design.description}</p>
                  <p className="text-xs text-gray-500">{design.preview}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Design Preview */}
          <div className="bg-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Design Preview - {designOptions.find(d => d.id === selectedDesign)?.name}</h3>
            <div className="bg-white border border-gray-300 rounded-lg p-6 relative overflow-hidden">
              {/* Preview based on selected design */}
              {selectedDesign === 'modern' && (
                <div className="text-center mb-6">
                  <div className="font-bold text-2xl text-gray-900 italic tracking-wide mb-2">
                    {businessInfo.businessName || 'Restaurant Name'}
                  </div>
                  <div className="inline-block bg-black text-white px-6 py-2 font-bold text-sm tracking-wider">
                    FOOD MENU
                  </div>
                </div>
              )}

              {selectedDesign === 'classic' && (
                <div className="mb-6">
                  <div className="bg-gray-100 p-4 rounded-lg text-center mb-4">
                    <div className="font-bold text-2xl text-gray-900 mb-1">
                      {businessInfo.businessName || 'Restaurant Name'}
                    </div>
                    <div className="text-gray-600 text-sm tracking-wider">MENU</div>
                    <div className="w-full h-0.5 bg-green-500 mt-2"></div>
                  </div>
                  <div className="bg-green-500 text-white px-4 py-2 font-bold text-sm">
                    APPETIZERS
                  </div>
                </div>
              )}

              {selectedDesign === 'elegant' && (
                <div className="text-center mb-6 border-2 border-yellow-400 p-6">
                  <div className="font-bold text-3xl text-gray-900 mb-2">
                    {businessInfo.businessName || 'Restaurant Name'}
                  </div>
                  <div className="w-16 h-0.5 bg-yellow-400 mx-auto mb-2"></div>
                  <div className="text-gray-600 italic">Fine Dining Experience</div>
                </div>
              )}

              {/* Sample item layout */}
              <div className="space-y-4">
                {selectedDesign === 'modern' && (
                  <div className="flex items-center space-x-4">
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
                )}

                {selectedDesign === 'classic' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">SAMPLE APPETIZER</h4>
                        <p className="text-gray-600 text-sm">Fresh ingredients with house-made sauce</p>
                      </div>
                      <span className="font-bold text-gray-900 ml-4">$8.99</span>
                    </div>
                    <div className="border-b border-dotted border-gray-300"></div>
                  </div>
                )}

                {selectedDesign === 'elegant' && (
                  <div className="text-center border-b border-gray-200 pb-4">
                    <h4 className="font-bold text-xl text-gray-900 mb-2">SIGNATURE DISH</h4>
                    <p className="text-gray-600 italic text-sm mb-2">Exquisitely prepared with premium ingredients</p>
                    <div className="inline-block bg-yellow-400 text-gray-900 px-3 py-1 font-bold text-sm">
                      $24.99
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center text-xs text-gray-500 mt-8">
                <p>Sample layout preview</p>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {designOptions.find(d => d.id === selectedDesign)?.name} Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {selectedDesign === 'modern' && (
                <>
                  <div className="space-y-2">
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
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                      <span className="text-gray-700">Black banner with "FOOD MENU"</span>
                    </div>
                  </div>
                  <div className="space-y-2">
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
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                      <span className="text-gray-700">Modern, elegant layout</span>
                    </div>
                  </div>
                </>
              )}

              {selectedDesign === 'classic' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span className="text-gray-700">Traditional restaurant layout</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span className="text-gray-700">Category sections with headers</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span className="text-gray-700">Dotted lines between items and prices</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span className="text-gray-700">Clean, readable typography</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span className="text-gray-700">Professional header design</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span className="text-gray-700">Organized by food categories</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span className="text-gray-700">Easy-to-read descriptions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span className="text-gray-700">Contact information footer</span>
                    </div>
                  </div>
                </>
              )}

              {selectedDesign === 'elegant' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                      <span className="text-gray-700">Luxurious gold accents and borders</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                      <span className="text-gray-700">Premium typography with elegant fonts</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                      <span className="text-gray-700">Sophisticated spacing and layout</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                      <span className="text-gray-700">Fine dining presentation style</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                      <span className="text-gray-700">Decorative flourishes and dividers</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                      <span className="text-gray-700">Centered, balanced composition</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                      <span className="text-gray-700">Premium price presentation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                      <span className="text-gray-700">Upscale restaurant aesthetic</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Generation Options */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Print Options</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Selected Design:</span>
                <span className="text-sm font-medium text-gray-900">
                  {designOptions.find(d => d.id === selectedDesign)?.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Format:</span>
                <span className="text-sm font-medium text-gray-900">A4 Portrait (210×297mm)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Layout:</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedDesign === 'modern' ? 'Alternating image placement' :
                   selectedDesign === 'classic' ? 'Category-based sections' :
                   'Centered elegant layout'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Images:</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedDesign === 'modern' ? 'Large circular photos' :
                   selectedDesign === 'classic' ? 'Text-focused layout' :
                   'Premium presentation'}
                </span>
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
                  {generating ? 'Generating...' : `Download ${designOptions.find(d => d.id === selectedDesign)?.name} Menu`}
                </span>
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Printing Instructions:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Print on A4 paper in portrait orientation</li>
              <li>Use high-quality color printing for best results</li>
              <li>Ensure printer settings are set to "Actual Size" or "100%"</li>
              <li>Consider using premium paper (150-200gsm) for professional results</li>
              <li>
                {selectedDesign === 'modern' && 'Use color printing to showcase food photos effectively'}
                {selectedDesign === 'classic' && 'Black and white printing works well for this design'}
                {selectedDesign === 'elegant' && 'Color printing recommended for gold accents'}
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};