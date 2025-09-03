import jsPDF from 'jspdf';
import { MenuItem, Category, User } from '../../types';

export const generateMinimalDesignPDF = async (
  businessInfo: User,
  menuItems: MenuItem[],
  categories: Category[]
): Promise<jsPDF> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 30;
  const contentWidth = pageWidth - (margin * 2);
  
  let currentY = margin;

  // Minimal header
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  currentY = 40;

  // Business name with minimal typography
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'normal');
  const businessName = businessInfo.businessName || 'Restaurant';
  pdf.text(businessName, pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 10;

  // Simple line
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.line(pageWidth / 2 - 40, currentY, pageWidth / 2 + 40, currentY);
  
  currentY += 20;

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

  // Render categories and items with minimal styling
  for (const [categoryName, items] of Object.entries(itemsByCategory)) {
    // Check space for category header
    if (currentY + 30 > pageHeight - 30) {
      pdf.addPage();
      currentY = margin;
    }

    // Category header - minimal
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(categoryName, margin, currentY);
    
    currentY += 15;

    // Category items with minimal layout
    for (const item of items) {
      if (currentY + 25 > pageHeight - 30) {
        pdf.addPage();
        currentY = margin;
      }

      // Item name
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      const itemName = item.name.length > 50 ? item.name.substring(0, 47) + '...' : item.name;
      pdf.text(itemName, margin, currentY);
      
      // Price - right aligned
      const priceText = `${item.price.toFixed(2)}`;
      const priceWidth = pdf.getTextWidth(priceText);
      pdf.text(priceText, pageWidth - margin - priceWidth, currentY);
      
      currentY += 6;

      // Description - minimal
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      const description = item.description.length > 100 ? 
        item.description.substring(0, 97) + '...' : item.description;
      
      const descLines = pdf.splitTextToSize(description, contentWidth - 20);
      pdf.text(descLines.slice(0, 1), margin, currentY);
      
      currentY += 4 + 8;
      
      // Minimal separator
      if (items.indexOf(item) < items.length - 1) {
        pdf.setDrawColor(230, 230, 230);
        pdf.setLineWidth(0.2);
        pdf.line(margin, currentY - 4, pageWidth - margin, currentY - 4);
      }
    }
    
    currentY += 15; // Space between categories
  }

  // Minimal footer
  currentY = pageHeight - 20;
  
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  
  const phone = businessInfo.aboutUs?.phone || businessInfo.phone || '+123-456-7890';
  pdf.text(phone, pageWidth / 2, currentY, { align: 'center' });
  
  return pdf;
};