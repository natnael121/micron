import jsPDF from 'jspdf';
import { MenuItem, Category, User } from '../../types';

export const generateElegantDesignPDF = async (
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