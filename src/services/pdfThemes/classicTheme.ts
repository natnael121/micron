import jsPDF from 'jspdf';
import { MenuItem, Category, User } from '../../types';

export const generateClassicDesignPDF = async (
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